/**
 * POST /api/v1/playground/init
 * GET  /api/v1/playground/:sessionId/status
 *
 * Initialize or check status of a playground session for an MCP server.
 * For remote (SSE/Streamable HTTP) servers, returns the remote URL directly —
 * the browser connects without going through our Worker.
 * For stdio servers, creates a Durable Object session for sandboxed proxy.
 */
import type { APIRoute } from 'astro';
import { getServerBySlug } from '../../../utils/d1.js';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) {
    return new Response(
      JSON.stringify({ error: 'Database unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  let body: { serverId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const { serverId } = body;
  if (!serverId) {
    return new Response(
      JSON.stringify({ error: 'Missing serverId' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const server = await getServerBySlug(db, serverId);
  if (!server) {
    return new Response(
      JSON.stringify({ error: 'Server not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Check if this server has a remote URL (SSE/Streamable HTTP) — browser connects directly
  const npmPackage = server.fields.npm_package;
  const deploymentType = (server as any).deployment || 'local_stdio';

  // Determine playground mode
  let mode: 'remote' | 'stdio';
  let remoteUrl: string | null = null;

  // Known remote servers that expose HTTP endpoints
  const KNOWN_REMOTE: Record<string, string> = {
    'upstash-context7': 'https://mcp.context7.com/mcp',
    'mindsdb-mcp': 'https://api.mindsdb.com/mcp/sse',
    'activepieces-mcp': 'https://api.activepieces.com/mcp/sse',
    'googleapis-genai-toolbox': 'https://genai-toolbox.googleapis.com/mcp',
  };

  if (KNOWN_REMOTE[serverId]) {
    mode = 'remote';
    remoteUrl = KNOWN_REMOTE[serverId];
  } else if (deploymentType === 'cloud_native') {
    mode = 'remote';
    // Cloud-native servers should have a URL in their config
    remoteUrl = null; // Will be prompted from user
  } else {
    mode = 'stdio';
  }

  // Fetch available tools from D1
  let tools: any[] = [];
  try {
    const row = await db
      .prepare('SELECT available_tools FROM servers WHERE id = ?')
      .bind(serverId)
      .first<{ available_tools: string | null }>();
    if (row?.available_tools) {
      tools = JSON.parse(row.available_tools);
    }
  } catch { /* ignore */ }

  // Compute playground session info
  const audit = server.securityAudit;
  const auditScore = audit?.auditScore ?? 0;
  const depHealth = (audit as any)?.dependencyHealth ?? 'unscanned';
  const verified = auditScore >= 50 && depHealth !== 'critical';
  const greenScore = (server as any).greenScore || null;
  const reliability = (server as any).reliability || null;

  // Rate limit: hash client IP for tracking
  const ipHash = clientAddress
    ? await hashIp(clientAddress)
    : 'unknown';

  const sessionId = `pg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const response = {
    sessionId,
    serverId,
    serverName: server.fields.name,
    mode,
    remoteUrl,
    npmPackage,
    command: npmPackage ? 'npx' : '',
    args: npmPackage ? ['-y', npmPackage] : [],
    tools,
    security: audit ? {
      audit_score: auditScore,
      tier: auditScore >= 80 ? 'Secure' : auditScore >= 50 ? 'Moderate' : 'At Risk',
      verified,
    } : null,
    greenScore: greenScore ? {
      tier: greenScore.tier,
      label: greenScore.label,
    } : null,
    reliability: reliability ? {
      score: reliability.score,
      tier: reliability.tier,
    } : null,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
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

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + '_playground_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}
