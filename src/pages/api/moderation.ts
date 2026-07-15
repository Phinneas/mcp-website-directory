/**
 * Moderation API — moderator-only endpoints for managing flagged content and users.
 * GET  /api/moderation/queue    — list flagged/pending reviews
 * GET  /api/moderation/stats    — moderation dashboard stats
 * POST /api/moderation/hide     — hide a review
 * POST /api/moderation/restore  — restore a hidden/flagged review
 * POST /api/moderation/delete   — permanently delete a review
 * POST /api/moderation/ban      — ban a user (hides all their reviews)
 * POST /api/moderation/unban    — unban a user
 * POST /api/moderation/dismiss  — dismiss all reports on a review
 */
import type { APIRoute } from 'astro';
import { verifyAndUpsertUser, extractBearerToken, unauthorizedResponse, dbUnavailableResponse, forbiddenResponse } from '../../lib/auth';

export const prerender = false;

function generateId(): string {
  return `mod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function logAction(db: D1Database, moderatorId: string, action: string, targetType: string, targetId: string, reason?: string): Promise<void> {
  const now = new Date().toISOString();
  const id = generateId();
  await db
    .prepare('INSERT INTO moderation_log (id, moderator_id, action, target_type, target_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, moderatorId, action, targetType, targetId, reason || null, now)
    .run();
}

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
    .bind(serverId, (reviewStats?.cnt as number) || 0, avgRating, JSON.stringify(distMap), (bookmarkCount?.cnt as number) || 0, Object.keys(contextMap).length > 0 ? JSON.stringify(contextMap) : null, now)
    .run();
}

async function requireModerator(request: Request, locals: any): Promise<{ user: any; db: D1Database } | Response> {
  const db = locals?.runtime?.env?.DB as D1Database | undefined;
  if (!db) return dbUnavailableResponse();

  const token = extractBearerToken(request.headers.get('Authorization'));
  if (!token) return unauthorizedResponse();

  const moderatorIds = (locals?.runtime?.env?.MODERATOR_GITHUB_IDS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const user = await verifyAndUpsertUser(token, db, moderatorIds);
  if (!user) return unauthorizedResponse();
  if (!user.isModerator) return forbiddenResponse();

  return { user, db };
}

// ─── GET: moderation queue or stats ──────────────────────────────────────────

export const GET: APIRoute = async ({ request, locals }) => {
  const authResult = await requireModerator(request, locals);
  if (authResult instanceof Response) return authResult;
  const { db } = authResult;

  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint') || 'queue';

  if (endpoint === 'stats') {
    const pendingCount = await db
      .prepare("SELECT COUNT(*) as cnt FROM user_reviews WHERE status IN ('flagged', 'pending')")
      .first<{ cnt: number }>();

    const flaggedCount = await db
      .prepare("SELECT COUNT(*) as cnt FROM user_reviews WHERE status = 'flagged'")
      .first<{ cnt: number }>();

    const pendingReviewCount = await db
      .prepare("SELECT COUNT(*) as cnt FROM user_reviews WHERE status = 'pending'")
      .first<{ cnt: number }>();

    const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00Z';
    const resolvedToday = await db
      .prepare("SELECT COUNT(*) as cnt FROM moderation_log WHERE action IN ('hide', 'delete', 'dismiss_report', 'restore') AND created_at >= ?")
      .bind(todayStart)
      .first<{ cnt: number }>();

    const moderatorCount = await db
      .prepare('SELECT COUNT(*) as cnt FROM users WHERE is_moderator = 1')
      .first<{ cnt: number }>();

    const bannedCount = await db
      .prepare('SELECT COUNT(*) as cnt FROM users WHERE is_banned = 1')
      .first<{ cnt: number }>();

    const pendingReports = await db
      .prepare("SELECT COUNT(*) as cnt FROM review_reports WHERE status = 'pending'")
      .first<{ cnt: number }>();

    return new Response(JSON.stringify({
      pending: (pendingCount?.cnt ?? 0),
      flagged: (flaggedCount?.cnt ?? 0),
      pendingReview: (pendingReviewCount?.cnt ?? 0),
      resolvedToday: (resolvedToday?.cnt ?? 0),
      moderators: (moderatorCount?.cnt ?? 0),
      bannedUsers: (bannedCount?.cnt ?? 0),
      pendingReports: (pendingReports?.cnt ?? 0),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Default: queue
  const status = url.searchParams.get('status') || 'flagged';
  const validStatuses = ['flagged', 'pending', 'hidden'];
  if (!validStatuses.includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid status filter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const reviews = await db
    .prepare(`SELECT r.*, u.github_username, u.avatar_url, u.reputation_score,
                     u.github_account_age_days, u.github_public_repos, u.github_followers,
                     (SELECT COUNT(*) FROM review_reports rr WHERE rr.review_id = r.id AND rr.status = 'pending') as report_count_pending
              FROM user_reviews r
              LEFT JOIN users u ON r.user_id = u.id
              WHERE r.status = ?
              ORDER BY r.flagged_at DESC, r.created_at DESC
              LIMIT 100`)
    .bind(status)
    .all();

  return new Response(JSON.stringify({ reviews: reviews.results || [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// ─── POST: moderation actions ────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  const authResult = await requireModerator(request, locals);
  if (authResult instanceof Response) return authResult;
  const { user: moderator, db } = authResult;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { action, review_id, user_id, reason } = body;

  if (!action) {
    return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const now = new Date().toISOString();

  switch (action) {
    case 'hide': {
      if (!review_id) return new Response(JSON.stringify({ error: 'Missing review_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      const review = await db.prepare('SELECT server_id FROM user_reviews WHERE id = ?').bind(review_id).first<{ server_id: string }>();
      if (!review) return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

      await db.prepare("UPDATE user_reviews SET status = 'hidden', moderation_note = ? WHERE id = ?").bind(reason || null, review_id).run();
      await logAction(db, moderator.userId, 'hide', 'review', review_id, reason);
      await refreshCommunityStats(db, review.server_id);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    case 'restore': {
      if (!review_id) return new Response(JSON.stringify({ error: 'Missing review_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      const review = await db.prepare('SELECT server_id FROM user_reviews WHERE id = ?').bind(review_id).first<{ server_id: string }>();
      if (!review) return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

      await db.prepare("UPDATE user_reviews SET status = 'active', flagged_at = NULL, moderation_note = ? WHERE id = ?").bind(reason || null, review_id).run();
      await logAction(db, moderator.userId, 'restore', 'review', review_id, reason);
      await refreshCommunityStats(db, review.server_id);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    case 'delete': {
      if (!review_id) return new Response(JSON.stringify({ error: 'Missing review_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      const review = await db.prepare('SELECT server_id, user_id FROM user_reviews WHERE id = ?').bind(review_id).first<{ server_id: string; user_id: string }>();
      if (!review) return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

      await db.prepare('DELETE FROM user_reviews WHERE id = ?').bind(review_id).run();
      await db.prepare("UPDATE review_reports SET status = 'resolved' WHERE review_id = ?").bind(review_id).run();
      await db.prepare('UPDATE users SET review_count = MAX(0, review_count - 1) WHERE id = ?').bind(review.user_id).run();
      await logAction(db, moderator.userId, 'delete', 'review', review_id, reason);
      await refreshCommunityStats(db, review.server_id);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    case 'ban': {
      if (!user_id) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      if (user_id === moderator.userId) return new Response(JSON.stringify({ error: 'Cannot ban yourself' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      await db.prepare('UPDATE users SET is_banned = 1 WHERE id = ?').bind(user_id).run();
      // Hide all active reviews by this user
      const userReviews = await db.prepare("SELECT id, server_id FROM user_reviews WHERE user_id = ? AND status = 'active'").bind(user_id).all();
      const serverIds = new Set<string>();
      for (const r of (userReviews.results || []) as any[]) {
        serverIds.add(r.server_id);
      }
      await db.prepare("UPDATE user_reviews SET status = 'hidden', moderation_note = 'User banned' WHERE user_id = ? AND status = 'active'").bind(user_id).run();
      for (const sid of serverIds) {
        await refreshCommunityStats(db, sid);
      }
      await logAction(db, moderator.userId, 'ban_user', 'user', user_id, reason);

      return new Response(JSON.stringify({ success: true, hiddenReviews: (userReviews.results || []).length }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    case 'unban': {
      if (!user_id) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      await db.prepare('UPDATE users SET is_banned = 0 WHERE id = ?').bind(user_id).run();
      await logAction(db, moderator.userId, 'unban_user', 'user', user_id, reason);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    case 'dismiss': {
      if (!review_id) return new Response(JSON.stringify({ error: 'Missing review_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      await db.prepare("UPDATE review_reports SET status = 'dismissed' WHERE review_id = ?").bind(review_id).run();
      // Reset report_count so it doesn't auto-flag again
      await db.prepare('UPDATE user_reviews SET report_count = 0, flagged_at = NULL WHERE id = ?').bind(review_id).run();
      await logAction(db, moderator.userId, 'dismiss_report', 'review', review_id, reason);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    default:
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
};
