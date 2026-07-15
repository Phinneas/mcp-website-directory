/**
 * discovery-engine.js — pure, testable core of the first-party MCP discovery
 * pipeline (task 22).
 *
 * Sources (none of them a competing *directory* API):
 *   1. npm registry search  — packages depending on / describing MCP servers
 *   2. GitHub search API    — repos tagged mcp-server / model-context-protocol
 *   3. Official MCP Registry — registry.modelcontextprotocol.io (the protocol's
 *      own canonical list; competitors read FROM it, so using it isn't
 *      "relying on a competitor")
 *
 * This module is pure (no I/O): it turns raw source responses into normalized
 * candidates, filters noise, dedupes against the existing directory, and ranks.
 * The runner (scripts/discovery/run-discovery.mjs) does the fetching.
 *
 * Output feeds downstream: discovered → scan queue (tasks 13/14) → API (11) →
 * stacks (16) → newsletter (21).
 */

// ── Candidate shape ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} Candidate
 * @property {string} name            display name
 * @property {string|null} github_url normalized https://github.com/owner/repo
 * @property {string|null} ownerRepo  "owner/repo" (lowercase) — primary dedup key
 * @property {string|null} npm_package
 * @property {string} description
 * @property {number} stars
 * @property {string[]} sources       which sources surfaced it
 * @property {boolean} official       official/vendor or registry-official
 * @property {object} raw             original (for the runner to persist)
 */

const MCP_KEYWORDS = ['mcp', 'mcp-server', 'mcp-server-typescript', 'model-context-protocol', 'model context protocol'];
const OFFICIAL_ORGS = new Set([
  'modelcontextprotocol', 'anthropics', 'github', 'microsoft', 'google', 'googlecloudplatform',
  'aws', 'awslabs', 'stripe', 'notion', 'linear', 'slackapi', 'firecrawl', 'upstash',
  'figma', 'browserbase', 'cloudflare', 'vercel', 'supabase', 'neondatabase',
]);

/** Pull "owner/repo" (lowercase) out of any GitHub-ish URL or package repo string. */
export function extractOwnerRepo(raw) {
  if (!raw) return null;
  const m = String(raw).match(/github\.com[:/]([^/]+)\/([^/?#.\s]+)/i);
  if (!m) return null;
  const owner = m[1].toLowerCase();
  let repo = m[2].toLowerCase();
  repo = repo.replace(/\.git$/, '').replace(/\/$/, '');
  return `${owner}/${repo}`;
}

function githubUrlFromOwnerRepo(ownerRepo) {
  return ownerRepo ? `https://github.com/${ownerRepo}` : null;
}

/** Does a normalized candidate plausibly describe an MCP server? Filters noise. */
export function looksLikeMcp(c) {
  // Registry entries are canonical — always MCP.
  if (c.sources.includes('registry')) return true;
  // Explicit self-declaration via keyword / topic (highest precision).
  const kws = (c.keywords || []).map((k) => String(k).toLowerCase());
  if (kws.some((k) => MCP_KEYWORDS.includes(k))) return true;
  // Name brands it as an MCP server.
  if (/\bmcp\b|mcp[-_]?(server|cli|tools?)|model[-_ ]?context[-_ ]?protocol/i.test(c.name || '')) return true;
  // Description uses the explicit phrase (not a bare "mcp" substring, which
  // catches false positives like "neo" / "n8n" that merely say "tool/server").
  if (/model[-_ ]?context[-_ ]?protocol|\bmcp[-_ ]?server\b/i.test(c.description || '')) return true;
  return false;
}

// ── Source normalizers ──────────────────────────────────────────────────────

/** npm search object → candidate. */
export function normalizeNpm(obj) {
  const pkg = obj?.package || {};
  const ownerRepo = extractOwnerRepo(pkg.links?.repository || pkg.links?.homepage);
  return {
    name: pkg.name || '',
    npm_package: pkg.name || null,
    github_url: githubUrlFromOwnerRepo(ownerRepo),
    ownerRepo,
    description: pkg.description || '',
    stars: 0, // npm has no star count
    keywords: pkg.keywords || [],
    sources: ['npm'],
    official: ownerRepo ? OFFICIAL_ORGS.has(ownerRepo.split('/')[0]) : false,
    raw: { name: pkg.name, version: pkg.version, date: pkg.date, links: pkg.links },
  };
}

/** GitHub search item → candidate. */
export function normalizeGithub(item) {
  const ownerRepo = item.full_name ? item.full_name.toLowerCase() : null;
  return {
    name: item.name || (item.full_name ? item.full_name.split('/').pop() : ''),
    npm_package: null, // resolved later if an npm source corroborates
    github_url: item.html_url || githubUrlFromOwnerRepo(ownerRepo),
    ownerRepo,
    description: item.description || '',
    stars: item.stargazers_count || 0,
    keywords: item.topics || [],
    sources: ['github'],
    official: ownerRepo ? OFFICIAL_ORGS.has(ownerRepo.split('/')[0]) : false,
    raw: { full_name: item.full_name, stars: item.stargazers_count, topics: item.topics, updated: item.updated_at },
  };
}

/** Official registry entry → candidate. */
export function normalizeRegistry(entry) {
  const s = entry?.server || {};
  const meta = entry?._meta?.['io.modelcontextprotocol.registry/official'] || {};
  const ownerRepo = extractOwnerRepo(s.repository?.url || s.repository || s.source_url || s.homepage);
  return {
    name: s.title || s.name || '',
    npm_package: null,
    github_url: githubUrlFromOwnerRepo(ownerRepo),
    ownerRepo,
    description: s.description || '',
    stars: 0,
    keywords: [],
    registryId: s.name,
    remotes: (s.remotes || []).map((r) => r.url),
    sources: ['registry'],
    official: meta.status === 'active' || !!ownerRepo,
    raw: { registry_id: s.name, title: s.title, version: s.version, repository: s.repository },
  };
}

// ── Merge + dedup ───────────────────────────────────────────────────────────

/** Merge candidates that refer to the same server (same ownerRepo or npm). */
export function mergeCandidates(candidates) {
  const byOwner = new Map();
  const byNpm = new Map();
  const merged = [];

  for (const c of candidates) {
    const npmKey = c.npm_package?.toLowerCase();
    const ghKey = c.ownerRepo;
    let existing = (ghKey && byOwner.get(ghKey)) || (npmKey && byNpm.get(npmKey));

    if (existing) {
      // corroboration — fold sources + fill gaps
      for (const src of c.sources) if (!existing.sources.includes(src)) existing.sources.push(src);
      if (!existing.npm_package && c.npm_package) existing.npm_package = c.npm_package;
      if (!existing.github_url && c.github_url) { existing.github_url = c.github_url; existing.ownerRepo = c.ownerRepo; }
      existing.stars = Math.max(existing.stars, c.stars);
      existing.official = existing.official || c.official;
      if (npmKey && !byNpm.has(npmKey)) byNpm.set(npmKey, existing);
      if (ghKey && !byOwner.has(ghKey)) byOwner.set(ghKey, existing);
    } else {
      merged.push(c);
      if (ghKey) byOwner.set(ghKey, c);
      if (npmKey) byNpm.set(npmKey, c);
    }
  }
  return merged;
}

/** Build the set of "already in the directory" keys from existing servers. */
export function buildExisting(existingServers) {
  const ownerRepos = new Set();
  const npms = new Set();
  const ids = new Set();
  for (const s of existingServers || []) {
    const id = s.id || s.fields?.id;
    if (id) ids.add(String(id).toLowerCase());
    const gh = s.github_url || s.fields?.github_url;
    const or = extractOwnerRepo(gh);
    if (or) ownerRepos.add(or);
    const npm = s.npm_package || s.fields?.npm_package;
    if (npm) npms.add(String(npm).toLowerCase());
  }
  return { ownerRepos, npms, ids };
}

/** Remove candidates already in the directory. Returns only NEW ones. */
export function dedupNew(candidates, existing) {
  return candidates.filter((c) => {
    const or = c.ownerRepo;
    const npm = c.npm_package?.toLowerCase();
    if (or && existing.ownerRepos.has(or)) return false;
    if (npm && existing.npms.has(npm)) return false;
    return true;
  });
}

// ── Ranking ─────────────────────────────────────────────────────────────────

export function scoreCandidate(c) {
  let score = 0;
  score += Math.min(Math.log10((c.stars || 0) + 1) * 8, 40);          // popularity 0–40
  score += c.sources.length * 12;                                      // corroboration 12–36
  if (c.github_url && c.npm_package) score += 12;                      // installable + source-visible
  if (c.official) score += 20;                                         // vendor/registry-official
  if (c.sdkVerified) score += 25;                                      // depends on the official MCP SDK
  return Math.round(score);
}

export function rankCandidates(candidates) {
  return candidates
    .map((c) => ({ ...c, score: scoreCandidate(c) }))
    .sort((a, b) => b.score - a.score || b.stars - a.stars);
}

// ── Full pipeline (pure) ────────────────────────────────────────────────────

/**
 * Run the full discovery core over already-fetched raw responses.
 * @param {object} raw { npm: [], github: [], registry: [] }
 * @param {object} existing output of buildExisting(existingServers)
 * @returns {{ discovered, stats }}
 */
export function discover(raw, existing) {
  const all = [];
  for (const o of raw.npm || []) all.push(normalizeNpm(o));
  for (const i of raw.github || []) all.push(normalizeGithub(i));
  for (const e of raw.registry || []) all.push(normalizeRegistry(e));

  const mcpOnly = all.filter(looksLikeMcp);
  const merged = mergeCandidates(mcpOnly);
  const fresh = dedupNew(merged, existing);
  const ranked = rankCandidates(fresh);

  return {
    discovered: ranked,
    stats: {
      rawNpm: (raw.npm || []).length,
      rawGithub: (raw.github || []).length,
      rawRegistry: (raw.registry || []).length,
      lookedLikeMcp: mcpOnly.length,
      afterMerge: merged.length,
      newToDirectory: ranked.length,
    },
  };
}
