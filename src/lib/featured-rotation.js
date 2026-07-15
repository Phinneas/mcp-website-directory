/**
 * featured-rotation.js — pure, testable rotation logic for the weekly
 * "Featured MCP" pick (powers Brainscriblr's recurring segment via
 * GET /api/v1/featured?weekly=true).
 *
 * Design goals (from the task brief):
 *   - No repeats: exclude anything featured in the trailing ~12 months.
 *   - Bias toward servers newly verified (tasks 13/14) and newly surfaced
 *     (task 22 discovery); fall back to a recency proxy when those signals
 *     aren't present.
 *   - Occasionally run a thematic week drawn from the Skill Stacks (task 16).
 *   - Always return a human-readable "why" so the newsletter can render it.
 *
 * Everything here is pure (no I/O) so it can be unit-tested directly; the
 * endpoint gathers inputs (D1 rows + history) and feeds them in.
 */

const DAY = 24 * 60 * 60 * 1000;

/**
 * Deterministic PRNG (mulberry32) seeded from a string. Same week → same pick,
 * so the featured server is stable for the whole week regardless of who calls.
 */
export function seededRandom(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daysSince(iso, now = Date.now()) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((now - t) / DAY);
}

function parseTrust(json) {
  if (!json) return null;
  try {
    const o = typeof json === 'string' ? JSON.parse(json) : json;
    return typeof o?.score === 'number' ? o : null;
  } catch {
    return null;
  }
}

/**
 * Weighted score for a single candidate (higher = more likely to feature).
 * Mirrors the curation priorities: verified > high-trust > maintained >
 * popular, with bonuses for recency.
 */
export function featureScore(server, now = Date.now()) {
  const stars = server.stars || 0;
  const popularity = Math.min(Math.log10(stars + 1) * 8, 30); // 0–30

  const trust = parseTrust(server.compositeTrust);
  const trustScore = trust ? trust.score * 0.3 : 0; // 0–30

  const badge = server.badge_tier;
  let verification = 0;
  if (badge === 'manually_reviewed') verification += 25;
  else if (badge === 'scanned') verification += 12;
  const scanDays = daysSince(server.last_scan_at, now);
  if (scanDays != null && scanDays <= 30) verification += 12; // newly verified

  let discovery = 0;
  const updatedDays = daysSince(server.updated_at, now);
  if (updatedDays != null && updatedDays <= 60) discovery += 12; // newly surfaced proxy

  return { popularity, trust: trustScore, verification, discovery, total: popularity + trustScore + verification + discovery };
}

/**
 * Build the human-readable "why this server" line from the signals that fired.
 */
export function featureReason(server, theme = null, now = Date.now()) {
  const parts = [];
  if (theme) parts.push(`Thematic pick — part of our verified ${theme} stack`);

  const badge = server.badge_tier;
  const scanDays = daysSince(server.last_scan_at, now);
  if (badge === 'manually_reviewed') parts.push('manually reviewed by our team');
  else if (badge === 'scanned' && scanDays != null && scanDays <= 30) parts.push('newly verified this week (passed automated security scan)');
  else if (badge === 'scanned') parts.push('security-scanned');

  const trust = parseTrust(server.compositeTrust);
  if (trust) parts.push(`Composite Trust ${trust.score}/100`);

  const updatedDays = daysSince(server.updated_at, now);
  if (updatedDays != null && updatedDays <= 60) parts.push('recently added to the directory');

  const stars = server.stars || 0;
  if (stars > 0) parts.push(`${formatStars(stars)}★ on GitHub`);

  return parts.length ? parts.join(' · ') : 'curated pick';
}

function formatStars(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/**
 * Week number from a weekKey like "2026-W27".
 */
export function weekNumber(weekKey) {
  const m = /-W(\d{2})$/.exec(weekKey || '');
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Pick the featured server for the week. Deterministic for a given weekKey.
 *
 * @param {object} args
 * @param {array}  args.servers    Candidate servers (any with an id/name).
 * @param {Set|Iterable} args.recentIds  Server ids to exclude (trailing window).
 * @param {string} args.weekKey     e.g. "2026-W27".
 * @param {array}  [args.stacks]    TopicStack[] for thematic weeks.
 * @param {object} [args.opts]      { historyMonths:12, thematicEveryNWeeks:4, now:Date.now() }
 * @returns {{ server, reason, theme, score } | null}
 */
export function pickFeatured({ servers, recentIds, weekKey, stacks = [], opts = {} }) {
  const { thematicEveryNWeeks = 4, now = Date.now() } = opts;
  const recent = new Set(recentIds || []);

  let pool = (servers || []).filter((s) => s && s.id && s.name && !recent.has(s.id));
  if (!pool.length) return null;

  const wk = weekNumber(weekKey);
  const isThematic = stacks.length > 0 && wk > 0 && wk % thematicEveryNWeeks === 0;
  let theme = null;

  if (isThematic) {
    // Deterministically choose a stack for this thematic week, then restrict
    // the pool to that stack's servers (that aren't recently featured).
    const stack = stacks[Math.floor(wk / thematicEveryNWeeks) % stacks.length];
    const ids = new Set((stack?.serverIds || []).map((id) => id.toLowerCase()));
    const themed = pool.filter((s) => ids.has(String(s.id).toLowerCase()));
    if (themed.length) {
      pool = themed;
      theme = stack.name;
    }
  }

  // Score every candidate; thematic members get a bonus.
  const scored = pool.map((s) => {
    const sc = featureScore(s, now);
    let total = sc.total;
    if (theme) total += 40; // thematic bonus
    return { server: s, score: total, parts: sc };
  });
  scored.sort((a, b) => b.score - a.score);

  // Weighted-random among the strong tier (>= 55% of the top score) so picks
  // are always decent yet rotate week to week. Seeded → stable within a week.
  const top = scored[0].score;
  const tier = scored.filter((x) => x.score >= top * 0.55);
  const rng = seededRandom(weekKey);
  const r = rng() * tier.reduce((sum, x) => sum + x.score, 0);
  let acc = 0;
  let chosen = tier[0];
  for (const x of tier) {
    acc += x.score;
    if (r <= acc) { chosen = x; break; }
  }

  return {
    server: chosen.server,
    score: Math.round(chosen.score),
    theme,
    reason: featureReason(chosen.server, theme, now),
  };
}
