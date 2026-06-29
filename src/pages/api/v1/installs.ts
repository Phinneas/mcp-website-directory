/**
 * POST /api/v1/installs
 *
 * Anonymous install telemetry from the mymcpshelf CLI.
 * Rate-limited: 1 per server per IP hash per hour.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

function generateId(): string {
  return `ie_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + '_mymcpshelf_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) {
    return new Response(
      JSON.stringify({ error: 'Database unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  let body: { server_id?: string; client?: string; timestamp?: string; audit_snapshot?: any };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const { server_id, client } = body;
  if (!server_id || !client) {
    return new Response(
      JSON.stringify({ error: 'Missing server_id or client' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Validate client name
  const validClients = ['claude-desktop', 'cursor', 'vscode', 'windsurf', 'cline', 'continue'];
  if (!validClients.includes(client)) {
    return new Response(
      JSON.stringify({ error: 'Invalid client', valid_clients: validClients }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Rate limit: 1 install event per server per IP hash per hour
  const ip = clientAddress || 'unknown';
  const ipHash = await hashIp(ip);
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  const recent = await db
    .prepare('SELECT id FROM install_events WHERE server_id = ? AND ip_hash = ? AND created_at > ? LIMIT 1')
    .bind(server_id, ipHash, oneHourAgo)
    .first();

  if (recent) {
    return new Response(
      JSON.stringify({ ok: true, message: 'Already recorded recently' }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const id = generateId();
  const now = new Date().toISOString();
  const auditSnapshot = body.audit_snapshot ? JSON.stringify(body.audit_snapshot) : null;

  await db
    .prepare('INSERT INTO install_events (id, server_id, client, ip_hash, audit_snapshot, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, server_id, client, ipHash, auditSnapshot, now)
    .run();

  // Increment denormalized install_count on servers row for fast sorting
  // (full aggregation happens in the cron worker, but this gives immediate visibility)
  try {
    await db
      .prepare('UPDATE servers SET install_count = COALESCE(install_count, 0) + 1 WHERE id = ?')
      .bind(server_id)
      .run();
  } catch {
    // Column may not exist yet — safe to ignore
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};
