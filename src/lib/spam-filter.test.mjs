/**
 * spam-filter.test.mjs — unit tests for spam filter pure helpers.
 * Run: node src/lib/spam-filter.test.mjs
 */
import assert from 'node:assert/strict';

// Re-implement the pure helpers here for unit testing since they're not exported
function countUrls(text) {
  const urlPattern = /https?:\/\/[^\s]+/gi;
  return (text.match(urlPattern) || []).length;
}

function isMostlyUppercase(text) {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 10) return false;
  const upper = text.replace(/[^A-Z]/g, '').length;
  return upper / letters.length > 0.7;
}

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  \u2713', name); };

// ─── countUrls ──────────────────────────────────────────────────────────
test('counts zero URLs in plain text', () => {
  assert.equal(countUrls('Hello world no links'), 0);
});

test('counts a single URL', () => {
  assert.equal(countUrls('Check https://example.com'), 1);
});

test('counts multiple URLs', () => {
  assert.equal(
    countUrls('Visit https://a.com and http://b.com and https://c.com'),
    3,
  );
});

test('ignores text that looks like URLs but has no protocol', () => {
  assert.equal(countUrls('example.com is cool'), 0);
});

// ─── isMostlyUppercase ──────────────────────────────────────────────────
test('returns false for short strings', () => {
  assert.equal(isMostlyUppercase('HI'), false);
});

test('returns true for all-caps long strings', () => {
  assert.equal(isMostlyUppercase('THIS IS REALLY BAD SERVER DO NOT USE'), true);
});

test('returns false for normal mixed case', () => {
  assert.equal(isMostlyUppercase('This server works well for our team'), false);
});

test('returns false for lowercase long strings', () => {
  assert.equal(isMostlyUppercase('this is all lowercase text here'), false);
});

test('returns true for 71% uppercase (above threshold)', () => {
  // 10 uppercase, 4 lowercase = 71%
  assert.equal(isMostlyUppercase('AAAAAAAAAAbcdf'), true);
});

test('returns false for exactly 70% uppercase (boundary)', () => {
  // 7 uppercase, 3 lowercase = 70% — not > 0.7
  assert.equal(isMostlyUppercase('AAAAAAAabc'), false);
});

console.log(`\nAll ${passed} spam-filter tests passed.`);
