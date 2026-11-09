/**
 * indexing.test.mjs — unit tests for the server indexing predicate.
 *
 * Run: node src/utils/indexing.test.mjs
 */
import assert from 'node:assert/strict';
import { isIndexableServer, INDEXING_MIN_STARS, INDEXING_MIN_DESC_LENGTH } from './indexing.js';

let passed = 0;
const TOTAL = 7;
let i = 0;

function check(label, ok) {
  i++;
  try {
    assert.ok(ok, label);
    passed++;
  } catch (e) {
    console.error(`FAIL ${i}/${TOTAL}: ${label} — ${e.message}`);
  }
}

// ── Tier A threshold sanity ──
check('threshold constants are positive integers',
  Number.isInteger(INDEXING_MIN_STARS) && INDEXING_MIN_STARS > 0 &&
  Number.isInteger(INDEXING_MIN_DESC_LENGTH) && INDEXING_MIN_DESC_LENGTH > 0);

// ── Indexable: meets both thresholds ──
check('indexable — stars >= 20, desc >= 300',
  isIndexableServer({ fields: { stars: 20, description: 'x'.repeat(300) } }));

check('indexable — stars >> 20, desc >> 300',
  isIndexableServer({ fields: { stars: 500, description: 'x'.repeat(1000) } }));

// ── Not indexable: below one or both thresholds ──
check('not indexable — zero stars, long desc',
  !isIndexableServer({ fields: { stars: 0, description: 'x'.repeat(500) } }));

check('not indexable — many stars, short desc',
  !isIndexableServer({ fields: { stars: 100, description: 'short' } }));

check('not indexable — missing fields',
  !isIndexableServer({}) && !isIndexableServer({ fields: {} }));

check('not indexable — null stars',
  !isIndexableServer({ fields: { stars: null, description: 'x'.repeat(300) } }));

// ── Report ──
console.log(`\n${passed}/${TOTAL} checks passed`);
if (passed === TOTAL) {
  console.log('OK — all indexing predicate checks pass.');
  process.exit(0);
} else {
  console.error(`FAIL — ${TOTAL - passed} check(s) failed.`);
  process.exit(1);
}