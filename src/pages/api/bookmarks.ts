/**
 * Bookmarks API — save/unsave servers to user's shelf
 * POST   /api/bookmarks  — bookmark a server
 * DELETE /api/bookmarks  — remove bookmark
 * GET    /api/bookmarks?user_id= — list user's bookmarks
 */
import type { APIRoute } from 'astro';
import { verifyAndUpsertUser, extractBearerToken, unauthorizedResponse, dbUnavailableResponse } from '../../lib/auth';

export const prerender = false;

function generateId(): string {
  return `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function refreshBookmarkCount(db: D1Database, serverId: string): Promise<void> {
  const count = await db
    .prepare('SELECT COUNT(*) as cnt FROM user_bookmarks WHERE server_id = ?')
    .bind(serverId)
    .first();

  const now = new Date().toISOString();

  await db
    .prepare(`INSERT INTO community_stats (server_id, review_count, avg_rating, rating_distribution, bookmark_count, usage_contexts, updated_at)
              SELECT COALESCE(cs.review_count, 0), COALESCE(cs.avg_rating, NULL), COALESCE(cs.rating_distribution, '{}'), ?, COALESCE(cs.usage_contexts, NULL), ?
              FROM (SELECT ? as server_id) s
              LEFT JOIN community_stats cs ON cs.server_id = s.server_id
              WHERE s.server_id = ?`)
    .bind((count?.cnt as number) || 0, now, serverId, serverId)
    .run()
    .catch(() => {
      // Fallback: simple update
      return db
        .prepare('UPDATE community_stats SET bookmark_count = ?, updated_at = ? WHERE server_id = ?')
        .bind((count?.cnt as number) || 0, now, serverId)
        .run();
    });
}

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) return dbUnavailableResponse();

  const token = extractBearerToken(request.headers.get('Authorization'));
  if (!token) return unauthorizedResponse();

  const moderatorIds = ((locals as any).runtime?.env?.MODERATOR_GITHUB_IDS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const user = await verifyAndUpsertUser(token, db, moderatorIds);
  if (!user) return unauthorizedResponse();

  const bookmarks = await db
    .prepare('SELECT server_id, created_at FROM user_bookmarks WHERE user_id = ? ORDER BY created_at DESC')
    .bind(user.userId)
    .all();

  return new Response(JSON.stringify({ bookmarks: bookmarks.results || [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
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

  const { server_id } = body;
  if (!server_id) {
    return new Response(JSON.stringify({ error: 'Missing server_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const now = new Date().toISOString();
  const id = generateId();

  try {
    await db
      .prepare('INSERT OR IGNORE INTO user_bookmarks (id, server_id, user_id, created_at) VALUES (?, ?, ?, ?)')
      .bind(id, server_id, user.userId, now)
      .run();

    await refreshBookmarkCount(db, server_id);

    return new Response(JSON.stringify({ success: true, bookmark_id: id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Bookmark insert error:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to save bookmark' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { server_id } = body;
  if (!server_id) {
    return new Response(JSON.stringify({ error: 'Missing server_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  await db
    .prepare('DELETE FROM user_bookmarks WHERE server_id = ? AND user_id = ?')
    .bind(server_id, user.userId)
    .run();

  await refreshBookmarkCount(db, server_id);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
