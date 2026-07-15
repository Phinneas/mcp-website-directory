/**
 * GET /api/v1/featured
 *
 * Weekly Featured MCP feed for the mymcpshelf CLI and the Brainscriblr
 * newsletter (AINEWSTOOL) recurring "Featured MCP" segment.
 *
 *   weekly=true   → the single Featured MCP of the current week.
 *                   MyMCPShelf owns the rotation logic + data here (once):
 *                     • no repeats — excludes anything featured in the trailing
 *                       12 months (featured_mcp_weekly is the history log)
 *                     • weighted toward newly verified (tasks 13/14) and newly
 *                       surfaced servers, plus Composite Trust
 *                     • occasional thematic weeks drawn from the Skill Stacks
 *                       (task 16)
 *                     • deterministic for a given week (seeded), so every
 *                       caller in that week gets the same pick
 *                     • returns a human-readable `reason` (+ `theme`) so the
 *                       newsletter can render "what & why" without recomputing
 *                   The Brainscriblr repo just calls this endpoint and drops
 *                   the result into its issue template.
 *   count         → N random picks (default 1, max 5). Only when weekly != true.
 *   exclude       → comma-separated server IDs to exclude (non-weekly mode).
 */
import type { APIRoute } from 'astro';
import { searchServers, healthCheck } from '../../../utils/meilisearch.js';
import { slugify } from '../../../utils/slugify.js';
import { pickFeatured } from '../../../lib/featured-rotation.js';
import { TOPIC_STACKS } from '../../../data/topicStacks';

export const prerender = false;

const ALWAYS_FEATURED_IDS = new Set(['jetski', 'mcp-operator', 'semiotic']);
const POOL_LIMIT = 500;
const NO_REPEAT_WINDOW_DAYS = 365;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=3600',
};

function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function featuredPayload(s: any, weekKey: string, featuredAt: string, reason: string | null, theme: string | null) {
  return [{
    id: s.id,
    name: s.name,
    description: s.description || '',
    stars: s.stars || 0,
    github_url: s.github_url || null,
    npm_package: s.npm_package || null,
    author: s.author || '@unknown',
    shelf_url: `https://www.mymcpshelf.com/server/${slugify(s.name)}`,
    week: weekKey,
    featured_at: featuredAt,
    reason,
    theme,
  }];
}

export const GET: APIRoute = async ({ url, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  const weekly = url.searchParams.get('weekly') === 'true';

  // ── Weekly mode: one deterministic, no-repeat pick per week ────────────
  if (weekly && db) {
    const weekKey = getWeekKey();

    // Already picked this week? Return the persisted pick (+ reason/theme).
    const existing = await db
      .prepare('SELECT server_id, featured_at, reason, theme FROM featured_mcp_weekly WHERE week_key = ?')
      .bind(weekKey)
      .first<{ server_id: string; featured_at: string; reason: string | null; theme: string | null }>();

    if (existing) {
      const row = await db
        .prepare('SELECT id, name, description, stars, github_url, npm_package, author FROM servers WHERE id = ?')
        .bind(existing.server_id)
        .first<any>();
      if (row) {
        return new Response(JSON.stringify({ featured: featuredPayload(row, weekKey, existing.featured_at, existing.reason, existing.theme) }),
          { status: 200, headers: JSON_HEADERS });
      }
    }

    // Candidate pool straight from D1 (carries the signals we weight on).
    const candidates = await db
      .prepare(
        `SELECT id, name, description, stars, github_url, npm_package, author,
                badge_tier, last_scan_at, composite_trust_json, updated_at
         FROM servers
         WHERE name IS NOT NULL
         ORDER BY stars DESC
         LIMIT 500`
      )
      .all<any>();

    // No-repeats: exclude anything featured in the trailing window.
    const cutoff = new Date(Date.now() - NO_REPEAT_WINDOW_DAYS * 86400000).toISOString();
    const recent = await db
      .prepare('SELECT server_id FROM featured_mcp_weekly WHERE featured_at > ?')
      .bind(cutoff)
      .all<{ server_id: string }>();
    const recentIds = (recent.results || []).map((r) => r.server_id);

    const servers = (candidates.results || []).map((r: any) => {
      // Derive badge tier from composite trust when no scan exists yet
      let badgeTier = r.badge_tier || 'unverified';
      if (badgeTier === 'unverified' && r.composite_trust_json) {
        try {
          const ct = JSON.parse(r.composite_trust_json);
          const tier = ct?.tier;
          if (tier === 'trusted' || tier === 'verified' || tier === 'review') {
            badgeTier = 'scanned';
          }
        } catch {}
      }
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        stars: r.stars || 0,
        github_url: r.github_url || null,
        npm_package: r.npm_package || null,
        author: r.author || '@unknown',
        badge_tier: badgeTier,
        last_scan_at: r.last_scan_at || null,
        compositeTrust: r.composite_trust_json || null, // pickFeatured parses JSON
        updated_at: r.updated_at || null,
      };
    });

    let pick = pickFeatured({ servers, recentIds, weekKey, stacks: TOPIC_STACKS });

    // Defensive fallback: an over-full history window could empty the pool.
    // Retry with no exclusion so the newsletter always has a pick.
    if (!pick && servers.length) {
      pick = pickFeatured({ servers, recentIds: [], weekKey, stacks: TOPIC_STACKS });
    }
    if (!pick) {
      return new Response(JSON.stringify({ featured: [] }), { status: 200, headers: JSON_HEADERS });
    }

    const now = new Date().toISOString();
    await db
      .prepare(
        'INSERT OR IGNORE INTO featured_mcp_weekly (week_key, server_id, featured_at, reason, theme) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(weekKey, pick.server.id, now, pick.reason, pick.theme)
      .run();

    return new Response(
      JSON.stringify({ featured: featuredPayload(pick.server, weekKey, now, pick.reason, pick.theme) }),
      { status: 200, headers: JSON_HEADERS }
    );
  }

  // ── Non-weekly mode: N random picks (not persisted) ────────────────────
  const countParam = parseInt(url.searchParams.get('count') || '1', 10);
  const count = Math.min(Math.max(countParam, 1), 5);
  const excludeParam = url.searchParams.get('exclude') || '';
  const excludeSet = new Set<string>([
    ...ALWAYS_FEATURED_IDS,
    ...excludeParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
  ]);

  const healthy = await healthCheck();
  if (!healthy) {
    return new Response(
      JSON.stringify({ error: 'Search service unavailable', featured: [] }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const results = await searchServers('', { limit: POOL_LIMIT, sort: ['stars:desc'] });
  const candidates = (results.hits ?? []).filter(
    (s: any) => s.id && s.name && s.status !== 'inactive' && !excludeSet.has(s.id.toLowerCase())
  );

  if (candidates.length === 0) {
    return new Response(JSON.stringify({ featured: [] }), {
      status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
    });
  }

  const picked = fisherYatesShuffle([...candidates]).slice(0, count).map((server: any) => ({
    id: server.id,
    name: server.name,
    description: server.description || '',
    stars: server.stars || 0,
    github_url: server.github_url || null,
    npm_package: server.npm_package || null,
    author: server.author || '@unknown',
    shelf_url: `https://www.mymcpshelf.com/server/${slugify(server.name)}`,
  }));

  return new Response(JSON.stringify({ featured: picked }), {
    status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
  });
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};
