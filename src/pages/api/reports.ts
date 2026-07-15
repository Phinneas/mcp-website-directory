/**
 * Reports API — authenticated users flag reviews for moderator attention.
 * POST /api/reports — report a review
 * GET  /api/reports?review_id= — list reports for a review (moderator only)
 */
import type { APIRoute } from 'astro';
import { verifyAndUpsertUser, extractBearerToken, unauthorizedResponse, dbUnavailableResponse, forbiddenResponse } from '../../lib/auth';

export const prerender = false;

const VALID_REASONS = ['spam', 'abusive', 'irrelevant', 'misleading', 'other'];
const AUTO_FLAG_THRESHOLD = 3;
const MAX_REPORTS_PER_HOUR = 5;

function generateId(): string {
  return `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

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

  const { review_id, reason, detail } = body;
  if (!review_id || !reason) {
    return new Response(JSON.stringify({ error: 'Missing review_id or reason' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!VALID_REASONS.includes(reason)) {
    return new Response(JSON.stringify({ error: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (detail && detail.length > 500) {
    return new Response(JSON.stringify({ error: 'Detail too long (max 500 chars)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Verify the review exists
  const review = await db
    .prepare("SELECT id, user_id FROM user_reviews WHERE id = ? AND status = 'active'")
    .bind(review_id)
    .first<{ id: string; user_id: string }>();

  if (!review) {
    return new Response(JSON.stringify({ error: 'Review not found or already moderated' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  // Don't allow self-reporting
  if (review.user_id === user.userId) {
    return new Response(JSON.stringify({ error: 'Cannot report your own review' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Rate limit: max N reports per user per hour
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const recentReports = await db
    .prepare('SELECT COUNT(*) as cnt FROM review_reports WHERE reporter_id = ? AND created_at > ?')
    .bind(user.userId, oneHourAgo)
    .first<{ cnt: number }>();

  if ((recentReports?.cnt ?? 0) >= MAX_REPORTS_PER_HOUR) {
    return new Response(JSON.stringify({ error: 'Report rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  const now = new Date().toISOString();
  const id = generateId();

  try {
    await db
      .prepare('INSERT OR IGNORE INTO review_reports (id, review_id, reporter_id, reason, detail, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, review_id, user.userId, reason, detail || null, 'pending', now)
      .run();

    // Increment report_count on the review
    await db
      .prepare('UPDATE user_reviews SET report_count = report_count + 1 WHERE id = ?')
      .bind(review_id)
      .run();

    // Auto-flag if threshold reached or reporter is high-reputation
    const reportCount = await db
      .prepare('SELECT report_count FROM user_reviews WHERE id = ?')
      .bind(review_id)
      .first<{ report_count: number }>();

    const shouldAutoFlag =
      (reportCount?.report_count ?? 0) >= AUTO_FLAG_THRESHOLD ||
      user.reputationScore >= 40;

    if (shouldAutoFlag) {
      await db
        .prepare("UPDATE user_reviews SET status = 'flagged', flagged_at = ? WHERE id = ? AND status = 'active'")
        .bind(now, review_id)
        .run();
    }

    return new Response(JSON.stringify({
      success: true,
      report_id: id,
      auto_flagged: shouldAutoFlag,
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return new Response(JSON.stringify({ error: 'You have already reported this review' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
    console.error('Report insert error:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to submit report' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) return dbUnavailableResponse();

  const token = extractBearerToken(request.headers.get('Authorization'));
  if (!token) return unauthorizedResponse();

  const moderatorIds = ((locals as any).runtime?.env?.MODERATOR_GITHUB_IDS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const user = await verifyAndUpsertUser(token, db, moderatorIds);
  if (!user) return unauthorizedResponse();
  if (!user.isModerator) return forbiddenResponse();

  const url = new URL(request.url);
  const reviewId = url.searchParams.get('review_id');

  if (!reviewId) {
    return new Response(JSON.stringify({ error: 'Missing review_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const reports = await db
    .prepare(`SELECT r.*, u.github_username, u.avatar_url, u.reputation_score
              FROM review_reports r
              LEFT JOIN users u ON r.reporter_id = u.id
              WHERE r.review_id = ?
              ORDER BY r.created_at DESC`)
    .bind(reviewId)
    .all();

  return new Response(JSON.stringify({ reports: reports.results || [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
