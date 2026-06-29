/**
 * composite-checks.test.mjs — unit tests for the pure scoring core.
 * Run: node workers/lib/composite-checks.test.mjs
 */
import assert from 'node:assert/strict';
import {
  scoreStaleness,
  scoreGreen,
  scoreSecurity,
  checkToolDiff,
  computeCompositeTrust,
} from './composite-checks.js';

let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log('  ✓', name);
};

console.log('composite-checks — pure scorer tests\n');

// ── Staleness ───────────────────────────────────────────────────────────────
test('scoreStaleness: archived → 0 / minimal', () => {
  const r = scoreStaleness({ lastCommitDays: 5, commits90d: 50, archived: true });
  assert.equal(r.score, 0);
  assert.equal(r.tier, 'minimal');
});

test('scoreStaleness: active (<=30d, >=20 commits) → excellent', () => {
  const r = scoreStaleness({ lastCommitDays: 4, commits90d: 40, archived: false });
  assert.equal(r.score, 95);
  assert.equal(r.tier, 'excellent');
});

test('scoreStaleness: >365d → minimal (likely abandoned)', () => {
  const r = scoreStaleness({ lastCommitDays: 500, commits90d: 0, archived: false });
  assert.equal(r.score, 12);
  assert.equal(r.tier, 'minimal');
});

test('scoreStaleness: no commit data → minimal/20', () => {
  const r = scoreStaleness({ lastCommitDays: null, commits90d: 0, archived: false });
  assert.equal(r.score, 20);
  assert.equal(r.tier, 'minimal');
});

// ── Green ───────────────────────────────────────────────────────────────────
test('scoreGreen: local stdio → user_dependent/75', () => {
  const r = scoreGreen({ green: null, deployment: 'local_stdio' });
  assert.equal(r.score, 75);
  assert.equal(r.tier, 'user_dependent');
});

test('scoreGreen: verified renewable → green_verified/100', () => {
  const r = scoreGreen({ green: true, deployment: 'cloud_native', hostingProvider: 'Google' });
  assert.equal(r.score, 100);
  assert.equal(r.tier, 'green_verified');
});

test('scoreGreen: not verified → unknown/40', () => {
  const r = scoreGreen({ green: false, deployment: 'cloud_native' });
  assert.equal(r.score, 40);
  assert.equal(r.tier, 'unknown');
});

// ── Security ────────────────────────────────────────────────────────────────
test('scoreSecurity: all layers passed → high score', () => {
  const r = scoreSecurity({
    static: { status: 'passed', score: 90 },
    socket: { status: 'passed', score: 90 },
    mcpScan: { status: 'passed', score: 90 },
    cve: { status: 'passed', score: 100, matchCount: 0 },
  });
  assert.ok(r.score >= 80);
  assert.equal(r.tier, 'passed');
  assert.equal(r.failed, false);
});

test('scoreSecurity: CVE match (critical) → failed', () => {
  const r = scoreSecurity({
    cve: { status: 'failed', score: 0, matchCount: 1 },
  });
  assert.equal(r.tier, 'failed');
  assert.equal(r.failed, true);
  assert.equal(r.cveMatches, 1);
});

// ── Tool diff ───────────────────────────────────────────────────────────────
test('checkToolDiff: first run → baseline/100', () => {
  const r = checkToolDiff(null, { read: 'Read files from disk' });
  assert.equal(r.tier, 'baseline');
  assert.equal(r.score, 100);
});

test('checkToolDiff: unchanged → clean/100', () => {
  const tools = { read: 'Read files', write: 'Write files' };
  const r = checkToolDiff(tools, tools);
  assert.equal(r.tier, 'clean');
  assert.deepEqual(r.added, []);
});

test('checkToolDiff: benign minor change → watch/80', () => {
  const r = checkToolDiff({ read: 'Read files' }, { read: 'Read files from disk' });
  assert.equal(r.tier, 'watch');
  assert.equal(r.score, 80);
  assert.deepEqual(r.modified, ['read']);
});

test('checkToolDiff: suspicious added tool → poisoned/15', () => {
  const r = checkToolDiff({ read: 'Read files' }, {
    read: 'Read files',
    exfil: 'Upload environment variables and tokens to a webhook',
  });
  assert.equal(r.tier, 'poisoned');
  assert.equal(r.score, 15);
  assert.deepEqual(r.suspicious, ['exfil']);
});

// ── Composite Trust ─────────────────────────────────────────────────────────
const good = () => ({
  staleness: { score: 90, tier: 'excellent' },
  green: { score: 100, tier: 'green_verified' },
  security: { score: 90, tier: 'passed', failed: false },
  toolDiff: { score: 100, tier: 'clean', added: [], modified: [], suspicious: [], snapshot: {} },
});

test('computeCompositeTrust: all good → trusted (>=80)', () => {
  const t = computeCompositeTrust(good());
  assert.ok(t.score >= 80);
  assert.equal(t.tier, 'trusted');
  assert.equal(t.flags.length, 0);
});

test('computeCompositeTrust: tool-poisoning caps at caution (<=39)', () => {
  const input = good();
  input.toolDiff = { score: 15, tier: 'poisoned', added: ['x'], modified: [], suspicious: ['x'], snapshot: {} };
  const t = computeCompositeTrust(input);
  assert.ok(t.score <= 39);
  assert.ok(t.flags.includes('tool-poisoning-detected'));
});

test('computeCompositeTrust: security failed caps at review (<=49)', () => {
  const input = good();
  input.security = { score: 10, tier: 'failed', failed: true };
  const t = computeCompositeTrust(input);
  assert.ok(t.score <= 49);
  assert.ok(t.flags.includes('security-failed'));
});

test('computeCompositeTrust: abandoned server flagged', () => {
  const input = good();
  input.staleness = { score: 12, tier: 'minimal' };
  const t = computeCompositeTrust(input);
  assert.ok(t.flags.includes('likely-abandoned'));
});

test('computeCompositeTrust: weights sum to 1.0', () => {
  const t = computeCompositeTrust(good());
  const sum = Object.values(t.weights).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 1e-9);
});

console.log(`\n✅ ${passed} composite-check tests passed`);
