/**
 * GET /api/v1/servers
 *
 * Public search API for the mymcpshelf CLI.
 * Returns a list of servers matching a query, with security audit summaries.
 */
import type { APIRoute } from 'astro';
import { getServersPage } from '../../../../utils/d1';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, url }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) {
    return new Response(
      JSON.stringify({ error: 'Database unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const q = url.searchParams.get('q') || '';
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10), 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
  const category = url.searchParams.get('category') || '';

  const page = await getServersPage(db, { offset, limit, category, search: q });

  const servers = page.servers.map((server) => {
    const audit = server.securityAudit;
    const auditScore = audit?.auditScore ?? 0;
    const depHealth = (audit as any)?.dependencyHealth ?? 'unscanned';
    const verified = auditScore >= 50 && depHealth !== 'critical';

    return {
      id: server.id,
      name: server.fields.name,
      description: server.fields.description,
      category: server.fields.category,
      language: server.fields.language,
      stars: server.fields.stars,
      npm_package: server.fields.npm_package,
      audit_score: auditScore,
      tier: audit ? (auditScore >= 80 ? 'Secure' : auditScore >= 50 ? 'Moderate' : 'At Risk') : null,
      dependency_health: depHealth,
      verified,
    };
  });

  return new Response(JSON.stringify({
    servers,
    total: page.total,
    offset: page.nextOffset - servers.length,
    limit,
    has_more: page.hasMore,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
    },
  });
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
