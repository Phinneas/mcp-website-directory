/**
 * discovery-engine.test.mjs — pure-logic tests.
 * Run: node src/lib/discovery-engine.test.mjs
 */
import assert from 'node:assert/strict';
import {
  extractOwnerRepo, looksLikeMcp, normalizeNpm, normalizeGithub, normalizeRegistry,
  buildExisting, dedupNew, mergeCandidates, scoreCandidate, discover,
} from './discovery-engine.js';

let passed = 0;
const test = (n, fn) => { fn(); passed++; console.log('  ✓', n); };

console.log('discovery-engine — tests\n');

// ── extractOwnerRepo ────────────────────────────────────────────────────────
test('extractOwnerRepo handles git+, .git, plain, and non-github', () => {
  assert.equal(extractOwnerRepo('git+https://github.com/anthropics/mcp-server-git.git'), 'anthropics/mcp-server-git');
  assert.equal(extractOwnerRepo('https://github.com/Upstash/context7'), 'upstash/context7');
  assert.equal(extractOwnerRepo('https://gitlab.com/foo/bar'), null);
  assert.equal(extractOwnerRepo(null), null);
});

// ── looksLikeMcp ────────────────────────────────────────────────────────────
test('looksLikeMcp: registry always true', () => {
  assert.equal(looksLikeMcp({ sources: ['registry'], name: 'x', description: '' }), true);
});

test('looksLikeMcp: mcp-server keyword true, finance noise false', () => {
  assert.equal(looksLikeMcp({ sources: ['npm'], name: 'foo', description: 'a thing', keywords: ['mcp-server'] }), true);
  assert.equal(looksLikeMcp({ sources: ['npm'], name: 'yahoo-finance2', description: 'JS API for Yahoo Finance', keywords: ['finance'] }), false);
});

test('looksLikeMcp: description mentions MCP server', () => {
  assert.equal(looksLikeMcp({ sources: ['github'], name: 'my-tool', description: 'An MCP server for reading files', keywords: [] }), true);
});

// ── normalizers ─────────────────────────────────────────────────────────────
test('normalizeNpm extracts owner/repo from repo link', () => {
  const c = normalizeNpm({ package: { name: '@acme/mcp', description: 'd', keywords: ['mcp-server'], links: { repository: 'git+https://github.com/acme/mcp.git' } } });
  assert.equal(c.ownerRepo, 'acme/mcp');
  assert.equal(c.npm_package, '@acme/mcp');
  assert.equal(c.github_url, 'https://github.com/acme/mcp');
  assert.equal(c.official, false);
});

test('normalizeGithub sets ownerRepo + stars + official for vendor org', () => {
  const c = normalizeGithub({ full_name: 'Anthropics/mcp-server-git', name: 'mcp-server-git', description: 'd', html_url: 'https://github.com/anthropics/mcp-server-git', stargazers_count: 4200, topics: ['mcp-server'] });
  assert.equal(c.ownerRepo, 'anthropics/mcp-server-git');
  assert.equal(c.stars, 4200);
  assert.equal(c.official, true);
});

test('normalizeRegistry maps canonical fields', () => {
  const c = normalizeRegistry({ server: { name: 'ac.inference.sh/mcp', title: 'inference.sh', description: 'Run AI apps', repository: { url: 'https://github.com/inference/mcp' }, remotes: [{ type: 'streamable-http', url: 'https://x' }] }, _meta: { 'io.modelcontextprotocol.registry/official': { status: 'active' } } });
  assert.equal(c.name, 'inference.sh');
  assert.equal(c.ownerRepo, 'inference/mcp');
  assert.equal(c.official, true);
  assert.deepEqual(c.sources, ['registry']);
});

// ── merge ───────────────────────────────────────────────────────────────────
test('mergeCandidates folds same owner/repo across sources', () => {
  const npm = normalizeNpm({ package: { name: '@foo/bar', description: 'An MCP server', links: { repository: 'git+https://github.com/foo/bar.git' } } });
  const gh = normalizeGithub({ full_name: 'foo/bar', name: 'bar', description: 'An MCP server', html_url: 'https://github.com/foo/bar', stargazers_count: 900, topics: ['mcp-server'] });
  const merged = mergeCandidates([npm, gh]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].sources.sort(), ['github', 'npm']);
  assert.equal(merged[0].stars, 900);
});

// ── dedup ───────────────────────────────────────────────────────────────────
test('dedupNew drops candidates already in the directory', () => {
  const existing = buildExisting([{ id: 'ctx7', fields: { github_url: 'https://github.com/Upstash/context7', npm_package: '@upstash/context7-mcp' } }]);
  const cands = [
    { ownerRepo: 'upstash/context7', npm_package: '@upstash/context7-mcp', sources: ['npm'] },        // dup by repo
    { ownerRepo: 'firecrawl/firecrawl-mcp', npm_package: 'firecrawl-mcp', sources: ['github'] },       // new
    { ownerRepo: null, npm_package: '@upstash/context7-mcp', sources: ['npm'] },                       // dup by npm
  ];
  const fresh = dedupNew(cands, existing);
  assert.equal(fresh.length, 1);
  assert.equal(fresh[0].ownerRepo, 'firecrawl/firecrawl-mcp');
});

// ── score ───────────────────────────────────────────────────────────────────
test('scoreCandidate rewards corroboration + official', () => {
  const lone = { stars: 50, sources: ['npm'], github_url: 'x', npm_package: 'y', official: false };
  const corroborated = { stars: 50, sources: ['npm', 'github', 'registry'], github_url: 'x', npm_package: 'y', official: true };
  assert.ok(scoreCandidate(corroborated) > scoreCandidate(lone));
});

// ── end-to-end discover ─────────────────────────────────────────────────────
test('discover: filters noise, dedupes, ranks, returns stats', () => {
  const raw = {
    npm: [
      { package: { name: 'yahoo-finance2', description: 'finance lib', keywords: ['finance'], links: {} } }, // noise
      { package: { name: 'firecrawl-mcp', description: 'MCP server for web scraping', keywords: ['mcp-server'], links: { repository: 'git+https://github.com/firecrawl/firecrawl-mcp.git' } } },
    ],
    github: [
      { full_name: 'firecrawl/firecrawl-mcp', name: 'firecrawl-mcp', description: 'MCP server for web scraping', html_url: 'https://github.com/firecrawl/firecrawl-mcp', stargazers_count: 3000, topics: ['mcp-server'] },
    ],
    registry: [],
  };
  const existing = buildExisting([]); // empty directory
  const { discovered, stats } = discover(raw, existing);
  assert.equal(stats.lookedLikeMcp, 2);     // firecrawl from npm + github (finance filtered)
  assert.equal(stats.afterMerge, 1);        // merged into one
  assert.equal(stats.newToDirectory, 1);
  assert.equal(discovered[0].ownerRepo, 'firecrawl/firecrawl-mcp');
  assert.deepEqual(discovered[0].sources.sort(), ['github', 'npm']);
  assert.ok(discovered[0].score > 0);
});

console.log(`\n✅ ${passed} discovery-engine tests passed`);
