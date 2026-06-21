/**
 * Reviews API — CRUD for authenticated user reviews
 * POST   /api/reviews           — create or update a review
 * GET    /api/reviews?server_id=  — list reviews for a server
 * DELETE /api/reviews?id=         — delete a review
 */
import type { APIRoute } from 'astro';

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
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(request.url);
  const serverId = url.searchParams.get('server_id');
  const userId = url.searchParams.get('user_id');

  if (!serverId) {
    return new Response(JSON.stringify({ error: 'Missing server_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const reviews = await db
    .prepare(`SELECT r.*, u.display_name, u.github_username, u.avatar_url
              FROM user_reviews r
              LEFT JOIN users u ON r.user_id = u.id
              WHERE r.server_id = ? AND r.status = 'active'
              ORDER BY r.helpful_count DESC, r.created_at DESC
              LIMIT 50`)
    .bind(serverId)
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
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  // Extract user identity from auth header (GitHub OAuth token)
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const token = authHeader.slice(7);
  const userId = await verifyGitHubToken(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

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

  const now = new Date().toISOString();
  const id = generateId();

  try {
    await db
      .prepare(`INSERT INTO user_reviews (id, server_id, user_id, rating, title, body, usage_context, deployment_type, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(server_id, user_id) DO UPDATE SET
                  rating = excluded.rating,
                  title = excluded.title,
                  body = excluded.body,
                  usage_context = excluded.usage_context,
                  deployment_type = excluded.deployment_type,
                  updated_at = excluded.updated_at`)
      .bind(id, server_id, userId, rating, title, reviewBody || '', usage_context || null, deployment_type || null, now, now)
      .run();

    // Refresh cached community stats
    await refreshCommunityStats(db, server_id);

    return new Response(JSON.stringify({ success: true, review_id: id }), {
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
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const token = authHeader.slice(7);
  const userId = await verifyGitHubToken(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(request.url);
  const reviewId = url.searchParams.get('id');

  if (!reviewId) {
    return new Response(JSON.stringify({ error: 'Missing review id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Only allow deleting own reviews
  const review = await db
    .prepare('SELECT server_id, user_id FROM user_reviews WHERE id = ?')
    .bind(reviewId)
    .first();

  if (!review) {
    return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  if ((review as any).user_id !== userId) {
    return new Response(JSON.stringify({ error: 'Not authorized to delete this review' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  await db.prepare('DELETE FROM user_reviews WHERE id = ?').bind(reviewId).run();
  await refreshCommunityStats(db, (review as any).server_id);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// GitHub OAuth token verification — calls GitHub API to validate token and get user ID
async function verifyGitHubToken(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'MCP-Directory-Auth',
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user.id ? `gh_${user.id}` : null;
  } catch {
    return null;
  }
}
