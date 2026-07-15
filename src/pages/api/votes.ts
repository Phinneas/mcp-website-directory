/**
 * Votes API — upvote/downvote reviews
 * POST /api/votes — vote on a review (toggles if same direction)
 */
import type { APIRoute } from 'astro';
import { verifyAndUpsertUser, extractBearerToken, unauthorizedResponse, dbUnavailableResponse } from '../../lib/auth';

export const prerender = false;

function generateId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

  const { review_id, direction } = body;
  if (!review_id || !direction) {
    return new Response(JSON.stringify({ error: 'Missing review_id or direction' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!['up', 'down'].includes(direction)) {
    return new Response(JSON.stringify({ error: 'Direction must be up or down' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Check for existing vote
  const existing = await db
    .prepare('SELECT direction FROM user_votes WHERE review_id = ? AND user_id = ?')
    .bind(review_id, user.userId)
    .first<{ direction: string }>();

  if (existing) {
    const existingDir = existing.direction;
    if (existingDir === direction) {
      // Same vote — remove it (toggle off)
      await db
        .prepare('DELETE FROM user_votes WHERE review_id = ? AND user_id = ?')
        .bind(review_id, user.userId)
        .run();

      // Update helpful_count on review
      const delta = direction === 'up' ? -1 : 1;
      await db
        .prepare('UPDATE user_reviews SET helpful_count = MAX(0, helpful_count + ?) WHERE id = ?')
        .bind(delta, review_id)
        .run();

      return new Response(JSON.stringify({ success: true, action: 'removed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Different direction — update
      await db
        .prepare('UPDATE user_votes SET direction = ? WHERE review_id = ? AND user_id = ?')
        .bind(direction, review_id, user.userId)
        .run();

      // Update helpful_count: switching from down to up = +2, up to down = -2
      const delta = direction === 'up' ? 2 : -2;
      await db
        .prepare('UPDATE user_reviews SET helpful_count = MAX(0, helpful_count + ?) WHERE id = ?')
        .bind(delta, review_id)
        .run();

      return new Response(JSON.stringify({ success: true, action: 'updated' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // New vote
  const now = new Date().toISOString();
  const id = generateId();

  await db
    .prepare('INSERT OR IGNORE INTO user_votes (id, review_id, user_id, direction, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, review_id, user.userId, direction, now)
    .run();

  // Update helpful_count on review
  const delta = direction === 'up' ? 1 : -1;
  await db
    .prepare('UPDATE user_reviews SET helpful_count = MAX(0, helpful_count + ?) WHERE id = ?')
    .bind(delta, review_id)
    .run();

  return new Response(JSON.stringify({ success: true, action: 'created' }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
