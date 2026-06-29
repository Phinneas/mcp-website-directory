/**
 * GET /api/v1/leaderboard
 *
 * Public API route for the MCP Server Leaderboard.
 * Returns servers ranked by real install counts from the CLI.
 *
 * Query params:
 *   sort: 'total' | 'trending' | 'hot'  (default: 'total')
 *   category: filter by category (default: all)
 *   limit: results per page (default: 50, max: 100)
 *   offset: pagination offset
 */
import type { APIRoute } from 'astro';
import { getLeaderboard, type LeaderboardSort } from '../../../utils/d1';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) {
    return new Response(
      JSON.stringify({ error: 'Database unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const sortParam = url.searchParams.get('sort') || 'total';
  const sort: LeaderboardSort = ['total', 'trending', 'hot'].includes(sortParam)
    ? sortParam as LeaderboardSort
    : 'total';
  const category = url.searchParams.get('category') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const { entries, total } = await getLeaderboard(db, { sort, category, limit, offset });

    const response = {
      sort,
      category: category || 'all',
      total,
      offset,
      limit,
      entries: entries.map(e => ({
        rank: e.rank,
        server_id: e.server.id,
        name: e.server.fields.name,
        description: e.server.fields.description?.slice(0, 120),
        category: e.server.fields.category,
        stars: e.server.fields.stars,
        badge_tier: e.badge_tier,
        total_installs: e.total_installs,
        installs_24h: e.installs_24h,
        installs_7d: e.installs_7d,
        trend: e.trend,
        logo_url: e.server.fields.logoUrl,
        shelf_url: `https://www.mymcpshelf.com/server/${e.server.id}`,
      })),
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Leaderboard query failed', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
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
