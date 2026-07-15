/**
 * featured-rotation.test.mjs — tests for the weekly featured-pick rotation.
 * Run: node src/lib/featured-rotation.test.mjs
 */
import assert from 'node:assert/strict';
import {
  seededRandom,
  featureScore,
  featureReason,
  pickFeatured,
  weekNumber,
} from './featured-rotation.js';

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ✓', name); };

const NOW = new Date('2026-06-29').getTime();
const iso = (daysAgo) => new Date(NOW - daysAgo * 86400000).toISOString();

const mk = (over = {}) => ({
  id: 'x', name: 'X', stars: 100, badge_tier: 'unverified',
  last_scan_at: null, compositeTrust: null, updated_at: null, ...over,
});

console.log('featured-rotation — tests\n');

test('seededRandom is deterministic per seed', () => {
  const a = [seededRandom('2026-W27')(), seededRandom('2026-W27')()];
  const b = [seededRandom('2026-W27')(), seededRandom('2026-W27')()];
  assert.deepEqual(a, b);
  // different seed → different first draw (extremely likely)
  assert.notEqual(seededRandom('2026-W27')(), seededRandom('2026-W28')());
});

test('featureScore: manually_reviewed beats unverified', () => {
  const audited = featureScore(mk({ badge_tier: 'manually_reviewed' }), NOW);
  const unverified = featureScore(mk({ badge_tier: 'unverified' }), NOW);
  assert.ok(audited.verification > unverified.verification);
  assert.ok(audited.total > unverified.total);
});

test('featureScore: newly-scanned gets recency bonus', () => {
  const fresh = featureScore(mk({ badge_tier: 'scanned', last_scan_at: iso(5) }), NOW);
  const stale = featureScore(mk({ badge_tier: 'scanned', last_scan_at: iso(400) }), NOW);
  assert.ok(fresh.verification > stale.verification);
});

test('featureScore: high Composite Trust adds points', () => {
  const high = featureScore(mk({ compositeTrust: { score: 95 } }), NOW);
  const none = featureScore(mk({}), NOW);
  assert.ok(high.trust > none.trust);
  assert.ok(high.total > none.total);
});

test('pickFeatured excludes recently-featured ids (no repeats)', () => {
  const servers = [mk({ id: 'a', name: 'A' }), mk({ id: 'b', name: 'B' }), mk({ id: 'c', name: 'C' })];
  const pick = pickFeatured({ servers, recentIds: ['a', 'b'], weekKey: '2026-W27' });
  assert.equal(pick.server.id, 'c');
});

test('pickFeatured is deterministic for the same weekKey', () => {
  const servers = Array.from({ length: 20 }, (_, i) => mk({ id: `s${i}`, name: `S${i}`, stars: 100 + i }));
  const p1 = pickFeatured({ servers, recentIds: [], weekKey: '2026-W27', opts: { now: NOW } });
  const p2 = pickFeatured({ servers, recentIds: [], weekKey: '2026-W27', opts: { now: NOW } });
  assert.equal(p1.server.id, p2.server.id);
});

test('pickFeatured returns null when everything is excluded', () => {
  const servers = [mk({ id: 'a', name: 'A' })];
  const pick = pickFeatured({ servers, recentIds: ['a'], weekKey: '2026-W27' });
  assert.equal(pick, null);
});

test('pickFeatured includes a reason', () => {
  const servers = [mk({ id: 'a', name: 'A', stars: 5000, badge_tier: 'manually_reviewed', compositeTrust: { score: 90 } })];
  const pick = pickFeatured({ servers, recentIds: [], weekKey: '2026-W27', opts: { now: NOW } });
  assert.ok(pick.reason.length > 0);
  assert.match(pick.reason, /manually reviewed/i);
  assert.match(pick.reason, /Composite Trust 90/);
});

test('thematic week restricts the pool to the chosen stack', () => {
  const servers = [
    mk({ id: 'popular-outside-stack', name: 'Popular', stars: 99999 }),
    mk({ id: 'in-stack', name: 'InStack', stars: 10 }),
  ];
  const stacks = [{ name: 'Browser Automation', serverIds: ['in-stack'] }];
  // week 28 is divisible by 4 → thematic
  const pick = pickFeatured({ servers, recentIds: [], weekKey: '2026-W28', stacks, opts: { now: NOW } });
  assert.ok(pick.theme);
  assert.equal(pick.server.id, 'in-stack');
});

test('non-thematic week can pick outside any stack', () => {
  const servers = [
    mk({ id: 'popular', name: 'Popular', stars: 99999 }),
    mk({ id: 'in-stack', name: 'InStack', stars: 10 }),
  ];
  const stacks = [{ name: 'Browser Automation', serverIds: ['in-stack'] }];
  // week 27 is NOT divisible by 4 → standard
  const pick = pickFeatured({ servers, recentIds: [], weekKey: '2026-W27', stacks, opts: { now: NOW } });
  assert.equal(pick.theme, null);
  assert.equal(pick.server.id, 'popular');
});

test('weekNumber parses W27', () => {
  assert.equal(weekNumber('2026-W27'), 27);
  assert.equal(weekNumber('bad'), 0);
});

console.log(`\n✅ ${passed} featured-rotation tests passed`);
