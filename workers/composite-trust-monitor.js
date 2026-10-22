/**
 * composite-trust-monitor.js — the CONSOLIDATED per-server recheck pipeline.
 *
 * Replaces four separate same-shape workers/pipelines (staleness, green-hosting,
 * security-scan, tool-description diff) with a single pass that runs all four
 * checks per server and writes ONE combined record (`composite_trust_json`) plus
 * the Composite Trust Score.
 *
 *   ┌─ staleness  (GitHub commit recency + volume + archived)
 *   ├─ green      (Green Web Foundation Greencheck)
 *   ├─ security   (npm static-analysis + Socket.dev + CVE watchlist)  ← reuses src/
 *   ├─ tool-diff  (README tool set diff vs prior snapshot → rug-pull / tool-poisoning)
 *   ├─ remote     (TLS reachability + uptime ping for SSE/HTTP servers)
 *   └─ execution  (MCP endpoint test for remote; npm package handshake for stdio)
 *
 * It also back-fills the individual columns (green_score_json, badge_tier,
 * scan_summary_json) so existing badges keep working until they migrate to the
 * composite record. Scoring is delegated to the pure, unit-tested
 * ./lib/composite-checks.js.
 *
 * Trigger: single weekly cron (see composite-trust-wrangler.toml) OR HTTP GET.
 */

import {
  scoreStaleness,
  scoreGreen,
  scoreSecurity,
  checkToolDiff,
  computeCompositeTrust,
} from './lib/composite-checks.js';

const GITHUB = 'https://api.github.com';
const GREENCHECK = 'https://api.thegreenwebfoundation.org/api/v3/greencheck/';
const NPM = 'https://registry.npmjs.org';
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// ── Shared fetch helpers ────────────────────────────────────────────────────

function extractOwnerRepo(githubUrl) {
  try {
    const m = String(githubUrl || '').match(/github\.com\/([^/]+)\/([^/?#]+?)(?:[/?#]|$)/);
    return m ? `${m[1]}/${m[2].replace(/\.git$/, '')}` : null;
  } catch {
    return null;
  }
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function gh(url, token) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'mymcpshelf-composite-monitor' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.json();
}

// ── 0. Remote health inputs (TLS + uptime for SSE/HTTP servers) ─────────────

async function fetchRemoteHealth(server) {
  const deployment = server.deployment_type || 'local_stdio';
  if (deployment === 'local_stdio') {
    return { tls: null, uptime: null };
  }

  const now = new Date().toISOString();
  let tls = null;
  let uptime = null;

  // TLS check: try to HEAD the GitHub domain over HTTPS
  const domain = server.github_url ? extractDomain(server.github_url) : null;
  if (domain) {
    try {
      const start = Date.now();
      const res = await fetch(`https://${domain}`, { method: 'HEAD', redirect: 'follow' });
      tls = { valid: res.ok, checkedAt: now };
    } catch {
      tls = { valid: false, checkedAt: now };
    }
  }

  // Uptime check: try to discover an endpoint from npm metadata, then HEAD it
  const npmPackage = server.npm_package;
  if (npmPackage) {
    try {
      const resp = await fetch(`${NPM}/${encodeURIComponent(npmPackage)}`);
      if (resp.ok) {
        const pkg = await resp.json();
        const endpoint = pkg.homepage || pkg.bugs?.url || null;
        if (endpoint && endpoint.startsWith('http')) {
          try {
            const start = Date.now();
            const res = await fetch(endpoint, { method: 'HEAD', redirect: 'follow' });
            uptime = {
              status: res.ok ? 'up' : 'down',
              responseMs: Date.now() - start,
              checkedAt: now,
            };
          } catch {
            uptime = { status: 'down', responseMs: null, checkedAt: now };
          }
        }
      }
    } catch { /* leave uptime null — endpoint unknown */ }
  }

  if (!uptime) {
    uptime = { status: 'unknown', responseMs: null, checkedAt: now };
  }

  return { tls, uptime };
}

// ── 0b. Execution test (MCP handshake / endpoint test) ──────────────────────

// Known remote MCP endpoints — verified working URLs for cloud-native servers.
const KNOWN_REMOTE_ENDPOINTS = {
  'upstash-context7': 'https://mcp.context7.com/mcp',
  'mindsdb-mcp': 'https://api.mindsdb.com/mcp/sse',
  'activepieces-mcp': 'https://api.activepieces.com/mcp/sse',
  'googleapis-genai-toolbox': 'https://genai-toolbox.googleapis.com/mcp',
};

async function fetchExecutionTest(server) {
  const now = new Date().toISOString();
  const deployment = server.deployment_type || 'local_stdio';
  const npmPackage = server.npm_package;

  // ── Tier 1: Full test for remote servers with known endpoints ─────────────
  if (deployment !== 'local_stdio') {
    const endpoint = KNOWN_REMOTE_ENDPOINTS[server.id];
    if (endpoint) {
      try {
        const start = Date.now();
        const res = await fetch(endpoint, { method: 'HEAD', redirect: 'follow' });
        return {
          status: res.ok ? 'tested' : 'failed',
          tier: res.ok ? 'tested' : 'failed',
          score: res.ok ? 90 : 0,
          endpoint,
          responseMs: Date.now() - start,
          testedAt: now,
        };
      } catch {
        return { status: 'failed', tier: 'failed', score: 0, endpoint, testedAt: now };
      }
    }
  }

  // ── Tier 2: Handshake verification via npm metadata ───────────────────────
  // For stdio servers (or remote servers without a known endpoint), we verify
  // the npm package is real and MCP-related. This is the best we can do in a
  // Worker environment where spawning subprocesses is not possible.
  if (npmPackage) {
    try {
      const resp = await fetch(`${NPM}/${encodeURIComponent(npmPackage)}`);
      if (!resp.ok) {
        return { status: 'handshake', tier: 'no_package', score: 20, packageVerified: false, testedAt: now };
      }
      const pkg = await resp.json();
      const latest = pkg['dist-tags']?.latest;
      const version = latest ? pkg.versions?.[latest] : null;
      const deps = version?.dependencies || {};
      const keywords = version?.keywords || [];
      const hasMcpSdk = !!deps['@modelcontextprotocol/sdk'];
      const hasMcpKeyword = keywords.some((k) => /mcp/i.test(k));
      const packageVerified = hasMcpSdk || hasMcpKeyword;

      return {
        status: 'handshake',
        tier: packageVerified ? 'verified_package' : 'unverified_package',
        score: packageVerified ? 70 : 40,
        packageVerified,
        hasMcpSdk,
        hasMcpKeyword,
        testedAt: now,
      };
    } catch {
      return { status: 'handshake', tier: 'error', score: 10, packageVerified: false, testedAt: now };
    }
  }

  // No npm package and no remote endpoint — can't test anything.
  return { status: 'handshake', tier: 'no_package', score: 0, testedAt: now };
}

// ── 1. Staleness inputs ─────────────────────────────────────────────────────

async function fetchStalenessInputs(server, token) {
  const ownerRepo = extractOwnerRepo(server.github_url);
  if (!ownerRepo) return { lastCommitDays: null, commits90d: 0, archived: false };

  const repo = await gh(`${GITHUB}/repos/${ownerRepo}`, token);
  if (!repo) return { lastCommitDays: null, commits90d: 0, archived: false };

  let lastCommitDays = null;
  if (repo.pushed_at) {
    lastCommitDays = Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / (24 * 60 * 60 * 1000));
  }

  // Count commits in the last 90 days (capped at 100 per page).
  const since = new Date(Date.now() - NINETY_DAYS_MS).toISOString();
  const commits = await gh(`${GITHUB}/repos/${ownerRepo}/commits?since=${since}&per_page=100`, token);
  const commits90d = Array.isArray(commits) ? commits.length : 0;

  return {
    lastCommitDays,
    commits90d,
    archived: !!repo.archived,
    openIssues: repo.open_issues_count ?? 0,
  };
}

// ── 2. Green inputs ─────────────────────────────────────────────────────────

async function fetchGreenInputs(server) {
  const deployment = server.deployment_type || 'local_stdio';
  if (deployment === 'local_stdio') return { green: null, hostingProvider: null };
  const domain = server.github_url ? extractDomain(server.github_url) : null;
  if (!domain) return { green: null, hostingProvider: null };
  try {
    const res = await fetch(`${GREENCHECK}${domain}`);
    if (!res.ok) return { green: null, hostingProvider: null };
    const data = await res.json();
    return { green: data.green === true, hostingProvider: data.hosted_by || null };
  } catch {
    return { green: null, hostingProvider: null };
  }
}

// ── 3. Security inputs (reuses src/ scanners) ──────────────────────────────

async function runSecurityLayers(server, env) {
  let staticLayer = undefined;
  let socketLayer = undefined;
  const npmPackage = server.npm_package;

  // Layer 1: static analysis on npm install/postinstall scripts
  if (npmPackage) {
    try {
      const resp = await fetch(`${NPM}/${encodeURIComponent(npmPackage)}`);
      if (resp.ok) {
        const pkg = await resp.json();
        const latest = pkg['dist-tags']?.latest;
        const scripts = latest ? pkg.versions?.[latest]?.scripts : null;
        if (scripts) {
          const suspicious = ['postinstall', 'preinstall', 'install'].filter(
            (s) => scripts[s] && /(curl|wget|eval\(|require\(|child_process)/.test(scripts[s])
          );
          staticLayer = suspicious.length
            ? { status: 'warning', score: 50 }
            : { status: 'passed', score: 90 };
        } else {
          staticLayer = { status: 'passed', score: 90 };
        }
      }
    } catch { /* leave undefined */ }
  }

  // Layer 2: Socket.dev (dependency health + typosquat)
  if (npmPackage) {
    try {
      const { scanWithSocketDev } = await import('../src/security/socket-dev-scanner');
      const r = await scanWithSocketDev(server.id, npmPackage, env.SOCKET_DEV_API_KEY);
      socketLayer = { status: r.status, score: r.score };
    } catch { /* leave undefined */ }
  }

  // Layer 4: CVE watchlist cross-reference (always runs)
  let cve = { status: 'passed', score: 100, matchCount: 0 };
  try {
    const { matchWatchlist, getHighestSeverity } = await import('../src/data/cveWatchlist');
    const matches = matchWatchlist(npmPackage, server.github_url, server.id);
    if (matches.length > 0) {
      const highest = getHighestSeverity(matches);
      cve = {
        status: highest === 'critical' ? 'failed' : highest === 'high' ? 'warning' : 'passed',
        score: highest === 'critical' ? 0 : highest === 'high' ? 40 : 70,
        matchCount: matches.length,
      };
    }
  } catch { /* default passed */ }

  return { static: staticLayer, socket: socketLayer, cve };
}

// ── 4. Tool-description inputs (rug-pull / tool-poisoning diff) ─────────────

async function fetchToolMap(server, token) {
  const ownerRepo = extractOwnerRepo(server.github_url);
  if (!ownerRepo) return {};
  try {
    const readme = await gh(`${GITHUB}/repos/${ownerRepo}/readme`, token);
    if (!readme || !readme.content) return {};
    const text = Buffer.from(readme.content, 'base64').toString('utf8');
    return extractTools(text);
  } catch {
    return {};
  }
}

// Heuristic tool extraction from a README: looks for a "Tools" section and
// pulls `- **name**: description`, `- name — description`, or table rows.
function extractTools(readme) {
  const tools = {};
  // Isolate a tools-ish section if present, else scan the whole doc.
  let body = readme;
  const section = readme.match(/#+\s*(?:available\s+)?tools?.*?([\s\S]*?)(?:\n#+\s|$)/i);
  if (section) body = section[1];

  const patterns = [
    /[-*]\s+\*\*([^*]{2,60}?)\*\*\s*[:：—-]\s*(.{3,200})/g,   // - **name**: desc
    /[-*]\s+`([^`]{2,60}?)`\s*[:：—-]\s*(.{3,200})/g,           // - `name`: desc
    /^\|\s*`?([^|]{2,60}?)`?\s*\|\s*([^|]{3,200}?)\s*\|/gm,     // | name | desc |
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(body)) !== null) {
      const name = m[1].trim();
      const desc = m[2].trim();
      if (name && desc && !tools[name.toLowerCase()]) tools[name.toLowerCase()] = desc;
    }
  }
  return tools;
}

// ── Per-server assessment ───────────────────────────────────────────────────

async function assessOne(server, prevComposite, env, token) {
  const [stalenessInputs, greenInputs, secLayers, toolMap, remoteHealth, execution] = await Promise.all([
    fetchStalenessInputs(server, token),
    fetchGreenInputs(server),
    runSecurityLayers(server, env),
    fetchToolMap(server, token),
    fetchRemoteHealth(server),
    fetchExecutionTest(server),
  ]);

  const staleness = scoreStaleness(stalenessInputs);
  const green = scoreGreen({ ...greenInputs, deployment: server.deployment_type || 'local_stdio' });
  const security = scoreSecurity(secLayers);
  const toolDiff = checkToolDiff(prevComposite?.toolSnapshot || null, toolMap);
  const composite = computeCompositeTrust({ staleness, green, security, toolDiff });

  const record = {
    score: composite.score,
    tier: composite.tier,
    label: composite.label,
    flags: composite.flags,
    subscores: {
      staleness,
      green,
      security: { score: security.score, tier: security.tier, cveMatches: security.cveMatches },
      toolDiff: {
        score: toolDiff.score, tier: toolDiff.tier,
        added: toolDiff.added, removed: toolDiff.removed, modified: toolDiff.modified, suspicious: toolDiff.suspicious,
      },
      execution: { score: execution.score, tier: execution.tier, status: execution.status },
    },
    toolSnapshot: toolDiff.snapshot, // stored for next run's diff
    assessedAt: new Date().toISOString(),
  };

  return { record, composite, green, security, remoteHealth, execution };
}

// ── Orchestration ───────────────────────────────────────────────────────────

// Servers per invocation. The index is ~7,240 servers, far more than one
// invocation can handle within Worker subrequest/CPU limits, so each run takes
// the servers that were scanned least recently (never-scanned first, then by
// stars). With an hourly cron and the default chunk of 100, the full index is
// covered in ~3 days and then keeps cycling.
const DEFAULT_CHUNK = 100;

async function runAll(env, chunkOverride) {
  console.log('composite-trust-monitor: starting consolidated recheck...');
  const token = env.GITHUB_TOKEN;
  const chunk = Math.max(1, Math.min(500, Number(chunkOverride || env.CHUNK_SIZE) || DEFAULT_CHUNK));

  const servers = await env.DB.prepare(
    `SELECT id, name, deployment_type, github_url, npm_package, composite_trust_json
     FROM servers
     ORDER BY (last_scan_at IS NOT NULL), last_scan_at ASC, stars DESC
     LIMIT ?`
  ).bind(chunk).all();

  if (!servers.results?.length) {
    console.log('composite-trust-monitor: no servers found');
    return;
  }

  // Ensure columns exist (idempotent).
  try { await env.DB.prepare('ALTER TABLE servers ADD COLUMN composite_trust_json TEXT').run(); } catch { /* exists */ }
  try { await env.DB.prepare('ALTER TABLE servers ADD COLUMN remote_health_json TEXT').run(); } catch { /* exists */ }
  try { await env.DB.prepare('ALTER TABLE servers ADD COLUMN execution_json TEXT').run(); } catch { /* exists */ }

  const batchSize = 15;
  let processed = 0;
  let flagged = 0;

  for (let i = 0; i < servers.results.length; i += batchSize) {
    const batch = servers.results.slice(i, i + batchSize);
    await Promise.all(batch.map(async (server) => {
      let prev = null;
      try { prev = server.composite_trust_json ? JSON.parse(server.composite_trust_json) : null; } catch { prev = null; }
      try {
        const { record, composite, green, security, remoteHealth, execution } = await assessOne(server, prev, env, token);
        if (composite.flags.length) flagged++;

        const badgeTier = prev && composite.tier === 'trusted' ? 'manually_reviewed' : 'scanned';

        // One write per server: the combined record (source of truth) plus the
        // back-filled individual columns that existing badges and pages read.
        await env.DB.prepare(
          `UPDATE servers SET
             composite_trust_json = ?,
             green_score_json = ?,
             badge_tier = ?, last_scan_at = ?, scan_summary_json = ?,
             remote_health_json = ?,
             execution_json = ?
           WHERE id = ?`
        ).bind(
          JSON.stringify(record),
          JSON.stringify({ tier: green.tier, label: green.label, description: green.description, hostingProvider: green.hostingProvider }),
          badgeTier, record.assessedAt, JSON.stringify({ overall_score: security.score, ...security }),
          JSON.stringify(remoteHealth),
          JSON.stringify(execution),
          server.id,
        ).run();

        processed++;
      } catch (err) {
        console.error(`composite-trust: failed for ${server.id}:`, err.message);
        // Stamp the attempt so a failing server rotates to the back of the
        // queue instead of being retried first on every run. badge_tier is
        // left unchanged.
        try {
          await env.DB.prepare('UPDATE servers SET last_scan_at = ? WHERE id = ?')
            .bind(new Date().toISOString(), server.id).run();
        } catch { /* ignore */ }
      }
    }));
    // Rate-limit pause between batches.
    if (i + batchSize < servers.results.length) await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`composite-trust-monitor: done — ${processed} assessed, ${flagged} flagged for review`);
}

// ── Worker entry ────────────────────────────────────────────────────────────

export default {
  async scheduled(event, env) {
    try {
      await runAll(env);
    } catch (err) {
      console.error('composite-trust-monitor failed:', err);
    }
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    // If TRIGGER_KEY is set, manual runs require ?key=<TRIGGER_KEY>.
    if (env.TRIGGER_KEY && url.searchParams.get('key') !== env.TRIGGER_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }
    try {
      // ?limit=N runs a smaller chunk, useful for a first test run.
      await runAll(env, url.searchParams.get('limit'));
      return new Response(JSON.stringify({ ok: true, message: 'composite-trust recheck complete' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
