/**
 * Reviews API — CRUD for authenticated user reviews
 * POST   /api/reviews           — create or update a review
 * GET    /api/reviews?server_id=  — list reviews for a server
 * DELETE /api/reviews?id=         — delete a review
 */
import type { APIRoute } from 'astro';
import { verifyAndUpsertUser, extractBearerToken, unauthorizedResponse, dbUnavailableResponse } from '../../lib/auth';
import { checkReviewSpam } from '../../lib/spam-filter';

export const prerender = false;

function generateId(): string {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Helper: recalculate and cache community stats for a server
async function refreshCommunityStats(db: D1Database, serverId: string): Promise<void> {
  const reviewStats = await db
    .prepare("SELECT COUNT(*) as cnt, AVG(rating) as avg FROM user_reviews WHERE server_id = ? AND status = 'active'")
    .bind(serverId)
    .first();

  const bookmarkCount = await db
    .prepare('SELECT COUNT(*) as cnt FROM user_bookmarks WHERE server_id = ?')
    .bind(serverId)
    .first();

  const distribution = await db
    .prepare("SELECT rating, COUNT(*) as cnt FROM user_reviews WHERE server_id = ? AND status = 'active' GROUP BY rating ORDER BY rating")
    .bind(serverId)
    .all();

  const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (distribution.results) {
    for (const row of distribution.results as any[]) {
      distMap[row.rating] = row.cnt;
    }
  }

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

  const now = new Date().toISOString();
  const avgRating = reviewStats?.avg ? Math.round((reviewStats.avg as number) * 10) / 10 : null;

  await db
    .prepare(`INSERT INTO community_stats (server_id, review_count, avg_rating, rating_distribution, bookmark_count, usage_contexts, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(server_id) DO UPDATE SET
                review_count = excluded.review_count,
                avg_rating = excluded.avg_rating,
                rating_distribution = excluded.rating_distribution,
                bookmark_count = excluded.bookmark_count,
                usage_contexts = excluded.usage_contexts,
                updated_at = excluded.updated_at`)
    .bind(
      serverId,
      (reviewStats?.cnt as number) || 0,
      avgRating,
      JSON.stringify(distMap),
      (bookmarkCount?.cnt as number) || 0,
      Object.keys(contextMap).length > 0 ? JSON.stringify(contextMap) : null,
      now,
    )
    .run();
}

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) return dbUnavailableResponse();

  const url = new URL(request.url);
  const serverId = url.searchParams.get('server_id');
  const userId = url.searchParams.get('user_id');

  if (!serverId) {
    return new Response(JSON.stringify({ error: 'Missing server_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Fetch active reviews (and pending reviews by the requesting user so they can see their own held review)
  const includeStatus = userId ? `AND (r.status = 'active' OR (r.status = 'pending' AND r.user_id = ?))` : `AND r.status = 'active'`;
  const binds = userId ? [userId, serverId] : [serverId];

  const reviews = await db
    .prepare(`SELECT r.*, u.display_name, u.github_username, u.avatar_url, u.reputation_score,
                     u.github_account_age_days, u.github_public_repos
              FROM user_reviews r
              LEFT JOIN users u ON r.user_id = u.id
              WHERE r.server_id = ? ${includeStatus}
              ORDER BY r.helpful_count DESC, r.created_at DESC
              LIMIT 50`)
    .bind(...binds)
    .all();

  // If userId provided, also fetch the user's vote state for each review
  let userVotes: Record<string, string> = {};
  if (userId) {
    const reviewIds = (reviews.results || []).map((r: any) => r.id);
    if (reviewIds.length > 0) {
      const placeholders = reviewIds.map(() => '?').join(',');
      const voteRows = await db
        .prepare(`SELECT review_id, direction FROM user_votes WHERE user_id = ? AND review_id IN (${placeholders})`)
        .bind(userId, ...reviewIds)
        .all();
      for (const v of (voteRows.results || []) as any[]) {
        userVotes[v.review_id] = v.direction;
      }
    }
  }

  return new Response(JSON.stringify({
    reviews: (reviews.results || []).map((r: any) => ({
      ...r,
      userVote: userVotes[r.id] || null,
    })),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) return dbUnavailableResponse();

  const token = extractBearerToken(request.headers.get('Authorization'));
  if (!token) return unauthorizedResponse();

  const moderatorIds = ((locals as any).runtime?.env?.MODERATOR_GITHUB_IDS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const user = await verifyAndUpsertUser(token, db, moderatorIds);
  if (!user) return unauthorizedResponse();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { server_id, rating, title, body: reviewBody, usage_context, deployment_type } = body;

  if (!server_id || !rating || !title) {
    return new Response(JSON.stringify({ error: 'Missing required fields: server_id, rating, title' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (rating < 1 || rating > 5) {
    return new Response(JSON.stringify({ error: 'Rating must be 1-5' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (title.length > 120) {
    return new Response(JSON.stringify({ error: 'Title too long (max 120 chars)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (reviewBody && reviewBody.length > 2000) {
    return new Response(JSON.stringify({ error: 'Review body too long (max 2000 chars)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const validContexts = ['production', 'staging', 'development', 'evaluation'];
  if (usage_context && !validContexts.includes(usage_context)) {
    return new Response(JSON.stringify({ error: 'Invalid usage_context' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Run spam filter heuristics
  const spamResult = await checkReviewSpam(db, user, server_id, title.trim(), (reviewBody || '').trim());
  if (!spamResult.allowed) {
    return new Response(JSON.stringify({ error: spamResult.reason || 'Review rejected' }), { status: 422, headers: { 'Content-Type': 'application/json' } });
  }

  const now = new Date().toISOString();
  const id = generateId();
  const reviewStatus = spamResult.status; // 'active' or 'pending'

  try {
    // Check if user already has a review for this server (upsert case)
    const existing = await db
      .prepare('SELECT id FROM user_reviews WHERE server_id = ? AND user_id = ?')
      .bind(server_id, user.userId)
      .first<{ id: string }>();

    const reviewId = existing?.id || id;
    const isUpdate = !!existing;

    if (isUpdate) {
      // Update existing review — keep current status unless it was hidden/flagged by a moderator
      await db
        .prepare(`UPDATE user_reviews SET rating = ?, title = ?, body = ?, usage_context = ?, deployment_type = ?, updated_at = ?,
                  status = CASE WHEN status IN ('hidden', 'flagged') THEN status ELSE ? END
                  WHERE id = ?`)
        .bind(rating, title.trim(), reviewBody || '', usage_context || null, deployment_type || null, now, reviewStatus, reviewId)
        .run();
    } else {
      await db
        .prepare(`INSERT INTO user_reviews (id, server_id, user_id, rating, title, body, usage_context, deployment_type, status, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(reviewId, server_id, user.userId, rating, title.trim(), reviewBody || '', usage_context || null, deployment_type || null, reviewStatus, now, now)
        .run();

      // Increment user's review_count
      await db
        .prepare('UPDATE users SET review_count = review_count + 1, updated_at = ? WHERE id = ?')
        .bind(now, user.userId)
        .run();
    }

    // Refresh cached community stats
    await refreshCommunityStats(db, server_id);

    return new Response(JSON.stringify({
      success: true,
      review_id: reviewId,
      status: reviewStatus,
      ...(reviewStatus === 'pending' && { message: 'Your review is held for moderation and will be visible once approved.' }),
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Review insert error:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to save review' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) return dbUnavailableResponse();

  const token = extractBearerToken(request.headers.get('Authorization'));
  if (!token) return unauthorizedResponse();

  const moderatorIds = ((locals as any).runtime?.env?.MODERATOR_GITHUB_IDS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const user = await verifyAndUpsertUser(token, db, moderatorIds);
  if (!user) return unauthorizedResponse();

  const url = new URL(request.url);
  const reviewId = url.searchParams.get('id');

  if (!reviewId) {
    return new Response(JSON.stringify({ error: 'Missing review id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Only allow deleting own reviews (moderators use /api/moderation)
  const review = await db
    .prepare('SELECT server_id, user_id FROM user_reviews WHERE id = ?')
    .bind(reviewId)
    .first<{ server_id: string; user_id: string }>();

  if (!review) {
    return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  if (review.user_id !== user.userId) {
    return new Response(JSON.stringify({ error: 'Not authorized to delete this review' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  await db.prepare('DELETE FROM user_reviews WHERE id = ?').bind(reviewId).run();
  // Decrement user's review_count
  await db
    .prepare('UPDATE users SET review_count = MAX(0, review_count - 1), updated_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), user.userId)
    .run();
  await refreshCommunityStats(db, review.server_id);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
