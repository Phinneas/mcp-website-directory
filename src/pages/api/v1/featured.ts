/**
 * GET /api/v1/featured
 *
 * Weekly Featured MCP feed for the mymcpshelf CLI and task 21 newsletter integration.
 * Extends the existing /api/featured-mcps logic with persisted weekly picks.
 *
 * Query params:
 *   weekly   If "true", returns the single Featured MCP of the current week.
 *            Picks one server from the random pool, persists it in featured_mcp_weekly
 *            so the newsletter repo can also pull it without duplicating curation.
 *   count    Number of candidates (default 1, max 5). Only used when weekly != true.
 *   exclude  Comma-separated server IDs to exclude (same as /api/featured-mcps).
 */
import type { APIRoute } from 'astro';
import { searchServers, healthCheck } from '../../../utils/meilisearch.js';
import { slugify } from '../../../utils/slugify.js';

export const prerender = false;

const ALWAYS_FEATURED_IDS = new Set(['jetski', 'mcp-operator', 'semiotic']);
const POOL_LIMIT = 500;

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

export const GET: APIRoute = async ({ url, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  const weekly = url.searchParams.get('weekly') === 'true';

  if (weekly && db) {
    const weekKey = getWeekKey();

    // Check if we already have a pick for this week
    const existing = await db
      .prepare('SELECT server_id, featured_at FROM featured_mcp_weekly WHERE week_key = ?')
      .bind(weekKey)
      .first<{ server_id: string; featured_at: string }>();

    if (existing) {
      // Look up the server details from Meilisearch
      const healthy = await healthCheck();
      if (!healthy) {
        return new Response(
          JSON.stringify({ error: 'Search service unavailable', featured: [] }),
          { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }

      const results = await searchServers(existing.server_id, { limit: 1 });
      const hit = results.hits?.[0];
      if (hit) {
        const featured = [{
          id: hit.id,
          name: hit.name,
          description: hit.description || '',
          stars: hit.stars || 0,
          github_url: hit.github_url || null,
          npm_package: hit.npm_package || null,
          author: hit.author || '@unknown',
          shelf_url: `https://www.mymcpshelf.com/server/${slugify(hit.name)}`,
          week: weekKey,
          featured_at: existing.featured_at,
        }];
        return new Response(JSON.stringify({ featured }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
        });
      }
    }

    // Pick a new one for this week
    const healthy = await healthCheck();
    if (!healthy) {
      return new Response(
        JSON.stringify({ error: 'Search service unavailable', featured: [] }),
        { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const excludeParam = url.searchParams.get('exclude') || '';
    const excludeSet = new Set<string>([
      ...ALWAYS_FEATURED_IDS,
      ...excludeParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    ]);

    const results = await searchServers('', { limit: POOL_LIMIT, sort: ['stars:desc'] });
    const candidates = (results.hits ?? []).filter(
      (s: any) => s.id && s.name && s.status !== 'inactive' && !excludeSet.has(s.id.toLowerCase())
    );

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ featured: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
      });
    }

    const shuffled = fisherYatesShuffle([...candidates]);
    const picked = shuffled[0];
    const now = new Date().toISOString();

    // Persist the weekly pick
    await db
      .prepare('INSERT OR IGNORE INTO featured_mcp_weekly (week_key, server_id, featured_at) VALUES (?, ?, ?)')
      .bind(weekKey, picked.id, now)
      .run();

    const featured = [{
      id: picked.id,
      name: picked.name,
      description: picked.description || '',
      stars: picked.stars || 0,
      github_url: picked.github_url || null,
      npm_package: picked.npm_package || null,
      author: picked.author || '@unknown',
      shelf_url: `https://www.mymcpshelf.com/server/${slugify(picked.name)}`,
      week: weekKey,
      featured_at: now,
    }];

    return new Response(JSON.stringify({ featured }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
    });
  }

  // Non-weekly mode: same as /api/featured-mcps (random picks, not persisted)
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
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
    });
  }

  const shuffled = fisherYatesShuffle([...candidates]);
  const picked = shuffled.slice(0, count).map((server: any) => ({
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
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
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
