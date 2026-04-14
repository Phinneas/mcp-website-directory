import type { APIRoute } from 'astro';
import { getServersPage } from '../../utils/d1';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response(
      JSON.stringify({ error: 'Database unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '24', 10)));
  const category = url.searchParams.get('category') || '';
  const search = url.searchParams.get('search') || '';
  const deployment = url.searchParams.get('deployment') || '';

  // If deployment filter is applied, we need to handle it differently
  // since deployment is stored in a separate column in the database
  let page;
  try {
    if (deployment && deployment !== 'all') {
      // When deployment filter is applied, we fetch more results and filter in memory
      // This is a temporary approach until we update getServersPage to handle deployment
      const largerLimit = Math.min(limit * 3, 200); // Fetch more to ensure we get enough after filtering
      page = await getServersPage(db, { offset, limit: largerLimit, category, search });
      
      // Filter servers by deployment type
      const { filterServersByDeployment } = await import('../../utils/serverData.js');
      const filteredServers = filterServersByDeployment(page.servers, deployment);
      
      // Adjust pagination info
      page.servers = filteredServers.slice(0, limit);
      page.total = filteredServers.length;
      page.hasMore = filteredServers.length > limit;
      page.nextOffset = offset + page.servers.length;
    } else {
      // Normal fetch without deployment filter
      page = await getServersPage(db, { offset, limit, category, search });
    }

    return new Response(JSON.stringify(page), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (err: any) {
    console.error('D1 query error:', err.message);
    return new Response(
      JSON.stringify({ error: 'Query failed', detail: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
