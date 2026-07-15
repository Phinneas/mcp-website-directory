/**
 * run-discovery.mjs — first-party MCP server discovery runner (task 22).
 *
 * Fetches ONLY first-party sources (never a competing directory's API):
 *   1. npm registry search   (packages describing MCP servers)
 *   2. GitHub search API     (repos tagged mcp-server / model-context-protocol)
 *   3. Official MCP Registry (registry.modelcontextprotocol.io — neutral)
 *
 * Then runs the pure discovery engine: filter noise → merge corroboration →
 * dedupe against the existing directory → rank. Newly discovered candidates are
 * written to discovered.json (and D1 INSERT SQL) to feed the scan queue (13/14),
 * the API (11), stacks (16), and newsletter (21).
 *
 *   node scripts/discovery/run-discovery.mjs            # live, all sources
 *   node scripts/discovery/run-discovery.mjs --dry-run  # fetch, don't write files
 */
import { writeFile } from 'node:fs/promises';
import { staticServers } from '../../src/data/staticServers.js';
import {
  buildExisting, discover, rankCandidates,
} from '../../src/lib/discovery-engine.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const NPM = 'https://registry.npmjs.org/-/v1/search';
const GH = 'https://api.github.com/search/repositories';
const REGISTRY = 'https://registry.modelcontextprotocol.io/v0/servers';
const DRY = process.argv.includes('--dry-run');

const ghHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'mymcpshelf-discovery',
  ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
};

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// ── Source fetchers ─────────────────────────────────────────────────────────
async function fetchNpm() {
  const objects = [];
  // keyword-based + text-based queries for coverage; merged by the engine.
  for (const text of ['keywords:mcp-server', 'mcp-server']) {
    try {
      const j = await getJson(`${NPM}?text=${encodeURIComponent(text)}&size=250`);
      objects.push(...(j.objects || []));
    } catch (e) { console.warn(`  npm "${text}" failed: ${e.message}`); }
  }
  // de-dup identical package objects across queries
  const seen = new Set();
  return objects.filter((o) => { const k = o.package?.name; return k && !seen.has(k) && seen.add(k); });
}

async function fetchGithub() {
  const items = [];
  const pages = GITHUB_TOKEN ? 3 : 1; // authed → higher rate limit → more pages
  for (const q of ['topic:mcp-server', 'topic:model-context-protocol']) {
    for (let p = 1; p <= pages; p++) {
      try {
        const j = await getJson(`${GH}?q=${encodeURIComponent(q)}&sort=updated&per_page=100&page=${p}`, ghHeaders);
        items.push(...(j.items || []));
        if (!j.items?.length) break;
        await sleep(1500); // respect search rate limits
      } catch (e) { console.warn(`  github "${q}" p${p} failed: ${e.message}`); break; }
    }
  }
  const seen = new Set();
  return items.filter((i) => !seen.has(i.id) && seen.add(i.id));
}

async function fetchRegistry() {
  try {
    const j = await getJson(REGISTRY, { Accept: 'application/json' });
    return j.servers || [];
  } catch (e) { console.warn(`  registry failed: ${e.message}`); return []; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Real MCP servers depend on an official SDK. Verifying that dependency is the
// high-precision signal that cuts through topic/keyword gaming (e.g. repos that
// tag themselves `mcp-server` for discoverability but aren't MCP servers).
const SDK_PACKAGES = ['@modelcontextprotocol/sdk', '@modelcontextprotocol/server-sdk', 'mcp'];
async function verifySdk(candidates) {
  const withNpm = candidates.filter((c) => c.npm_package && !c.sdkVerified);
  console.log(`  verifying SDK dependency for ${withNpm.length} npm candidates...`);
  let verified = 0;
  const CONCURRENCY = 8;
  for (let i = 0; i < withNpm.length; i += CONCURRENCY) {
    const batch = withNpm.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (c) => {
      try {
        const j = await getJson(`https://registry.npmjs.org/${encodeURIComponent(c.npm_package)}`);
        const latest = j['dist-tags']?.latest;
        const v = latest && j.versions?.[latest];
        const all = { ...(v?.dependencies || {}), ...(v?.devDependencies || {}), ...(v?.peerDependencies || {}) };
        if (SDK_PACKAGES.some((p) => p in all)) { c.sdkVerified = true; verified++; }
      } catch { /* leave unverified */ }
    }));
  }
  console.log(`  SDK-verified: ${verified}/${withNpm.length}`);
}

// ── Run ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('First-party MCP discovery — fetching sources...');
  const [npm, github, registry] = await Promise.all([fetchNpm(), fetchGithub(), fetchRegistry()]);
  console.log(`  fetched: npm=${npm.length} github=${github.length} registry=${registry.length}`);

  const existing = buildExisting(staticServers);
  const { discovered, stats } = discover({ npm, github, registry }, existing);

  // Verify the SDK-dependency signal, then re-rank (verified candidates rise).
  await verifySdk(discovered);
  const ranked = rankCandidates(discovered);
  stats.sdkVerified = ranked.filter((c) => c.sdkVerified).length;

  console.log('\nDiscovery stats:', JSON.stringify(stats, null, 0));
  console.log(`\n→ ${ranked.length} NEW MCP servers not yet in the directory (${stats.sdkVerified} SDK-verified).`);
  console.log('\nTop 20 newly discovered (ranked):');
  console.log('score | stars  | sources              | server');
  console.log('------+--------+----------------------+-------------------------------------------');
  for (const c of ranked.slice(0, 20)) {
    console.log(
      `${String(c.score).padStart(5)} | ${String(c.stars).padStart(6)} | ${c.sources.join('+').padEnd(20)} | ${c.github_url || c.name}${c.sdkVerified ? '  ✓sdk' : ''}`
    );
  }

  if (DRY) { console.log('\n(--dry-run: not writing files)'); return; }

  const out = {
    runAt: new Date().toISOString(),
    stats,
    discovered: ranked.map((c) => ({
      name: c.name,
      github_url: c.github_url,
      npm_package: c.npm_package,
      description: c.description,
      stars: c.stars,
      sources: c.sources,
      official: c.official,
      sdkVerified: !!c.sdkVerified,
      score: c.score,
    })),
  };
  await writeFile('scripts/discovery/discovered.json', JSON.stringify(out, null, 2));
  console.log(`\nWrote scripts/discovery/discovered.json (${ranked.length} candidates).`);

  // Also emit D1 INSERT SQL for the discovered_servers queue (migration 010).
  const today = new Date().toISOString();
  const vals = ranked
    .map((c) => {
      const id = (c.ownerRepo || c.npm_package || c.name || '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
      return `('${sqlEsc(id)}','${sqlEsc(c.ownerRepo)}','${sqlEsc(c.npm_package)}','${sqlEsc(c.github_url)}','${sqlEsc(c.name)}',${c.stars},'${c.sources.join(',')}','new','${today}')`;
    })
    .join(',\n  ');
  if (vals) {
    await writeFile('scripts/discovery/discovered_queue.sql',
      `-- Auto-generated by run-discovery.mjs — ${ranked.length} new candidates\n` +
      `INSERT OR IGNORE INTO discovered_servers (id, owner_repo, npm_package, github_url, name, stars, sources, status, discovered_at) VALUES\n  ${vals};\n`);
    console.log('Wrote scripts/discovery/discovered_queue.sql (D1 queue seed).');
  }
}
const sqlEsc = (s) => String(s ?? '').replace(/'/g, "''");
main().catch((e) => { console.error('discovery failed:', e); process.exit(1); });