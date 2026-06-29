/**
 * GET /api/v1/stacks
 *
 * Returns list of topic stack definitions.
 */
import type { APIRoute } from 'astro';
import { getAllTopicStacks } from '../../../../data/topicStacks';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
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
