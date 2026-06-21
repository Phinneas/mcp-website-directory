/**
 * Community stats API — read aggregated review/bookmark data for a server
 * GET /api/community/[serverId]
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const serverId = params.serverId;
  if (!serverId) {
    return new Response(JSON.stringify({ error: 'Missing server ID' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Try cached stats first
  const cached = await db
    .prepare('SELECT * FROM community_stats WHERE server_id = ?')
    .bind(serverId)
    .first();

  if (cached) {
    return new Response(JSON.stringify({
      serverId,
      reviewCount: cached.review_count || 0,
      avgRating: cached.avg_rating,
      ratingDistribution: cached.rating_distribution ? JSON.parse(cached.rating_distribution as string) : null,
      bookmarkCount: cached.bookmark_count || 0,
      usageContexts: cached.usage_contexts ? JSON.parse(cached.usage_contexts as string) : null,
      updatedAt: cached.updated_at,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120, stale-while-revalidate=300' },
    });
  }

  // No cached stats — compute on the fly
  const reviewStats = await db
    .prepare('SELECT COUNT(*) as cnt, AVG(rating) as avg FROM user_reviews WHERE server_id = ? AND status = ?')
    .bind(serverId, 'active')
    .first();

  const bookmarkCount = await db
    .prepare('SELECT COUNT(*) as cnt FROM user_bookmarks WHERE server_id = ?')
    .bind(serverId)
    .first();

  // Rating distribution
  const distribution = await db
    .prepare('SELECT rating, COUNT(*) as cnt FROM user_reviews WHERE server_id = ? AND status = ? GROUP BY rating ORDER BY rating')
    .bind(serverId, 'active')
    .all();

  const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (distribution.results) {
    for (const row of distribution.results as any[]) {
      distMap[row.rating] = row.cnt;
    }
  }

  // Usage contexts
  const contexts = await db
    .prepare("SELECT usage_context, COUNT(*) as cnt FROM user_reviews WHERE server_id = ? AND status = 'active' AND usage_context IS NOT NULL GROUP BY usage_context")
    .bind(serverId)
    .all();

  const contextMap: Record<string, number> = {};
  if (contexts.results) {
    for (const row of contexts.results as any[]) {
      contextMap[row.usage_context] = row.cnt;
    }
  }

  const result = {
    serverId,
    reviewCount: (reviewStats?.cnt as number) || 0,
    avgRating: reviewStats?.avg ? Math.round((reviewStats.avg as number) * 10) / 10 : null,
    ratingDistribution: distMap,
    bookmarkCount: (bookmarkCount?.cnt as number) || 0,
    usageContexts: Object.keys(contextMap).length > 0 ? contextMap : null,
    updatedAt: null,
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
  });
};
