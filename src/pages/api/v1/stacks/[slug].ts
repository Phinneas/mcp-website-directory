/**
 * GET /api/v1/stacks
 * GET /api/v1/stacks/:slug
 *
 * Returns topic stack definitions with server details.
 */
import type { APIRoute } from 'astro';
import { getAllTopicStacks, getTopicStack } from '../../../../data/topicStacks';

export const prerender = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  const slug = params.slug;

  // Single stack detail
  if (slug) {
    const stack = getTopicStack(slug);
    if (!stack) {
      return new Response(
        JSON.stringify({ error: 'Stack not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Fetch server details from D1
    const serverDetails: any[] = [];
    if (db) {
      const placeholders = stack.serverIds.map(() => '?').join(', ');
      try {
        const rows = await db
          .prepare(
            `SELECT id, name, description, npm_package, stars, badge_tier, install_count
             FROM servers WHERE id IN (${placeholders})`
          )
          .bind(...stack.serverIds)
          .all<any>();

        for (const row of rows.results || []) {
          serverDetails.push({
            id: row.id,
            name: row.name,
            description: (row.description || '').slice(0, 120),
            npm_package: row.npm_package,
            stars: row.stars,
            badge_tier: row.badge_tier || 'unverified',
            install_count: row.install_count || 0,
          });
        }
      } catch {}
    }

    return new Response(JSON.stringify({
      ...stack,
      servers: serverDetails,
      install_command: `npx mymcpshelf add-stack ${stack.slug}`,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  }

  // List all stacks
  const stacks = getAllTopicStacks();
  const featured = url.searchParams.get('featured') === 'true';
  const filtered = featured ? stacks.filter(s => s.featured) : stacks;

  return new Response(JSON.stringify({
    stacks: filtered.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      icon: s.icon,
      difficulty: s.difficulty,
      server_count: s.serverIds.length,
      estimated_setup_minutes: s.estimatedSetupMinutes,
      featured: s.featured,
      install_command: `npx mymcpshelf add-stack ${s.slug}`,
      mcpservers_org_equivalent: s.mcpserversOrgEquivalent,
    })),
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
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
