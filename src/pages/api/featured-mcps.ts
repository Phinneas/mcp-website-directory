import type { APIRoute } from 'astro';

export const prerender = false;

const PULSEMCP_API_BASE = 'https://api.pulsemcp.com/v0beta';

/**
 * GET /api/featured-mcps
 *
 * Returns a single featured MCP server for use in the BrainScriblr newsletter.
 * Picks the highest-starred server not present in the ?exclude= list.
 *
 * Query params:
 *   exclude  Comma-separated list of server slugs/IDs already featured in
 *            previous newsletter issues. The endpoint will skip these and
 *            return the next best candidate.
 *   count    Number of candidates to return (default 1, max 5). Useful if
 *            the newsletter wants a shortlist to pick from manually.
 *
 * Example:
 *   GET /api/featured-mcps?exclude=github-mcp,postgres-mcp&count=1
 *
 * Response shape:
 *   {
 *     "featured": [
 *       {
 *         "id": "...",
 *         "name": "...",
 *         "description": "...",
 *         "stars": 1234,
 *         "github_url": "...",
 *         "npm_package": "...",
 *         "author": "...",
 *         "shelf_url": "https://www.mymcpshelf.com/server/..."
 *       }
 *     ]
 *   }
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const excludeParam = url.searchParams.get('exclude') || '';
    const countParam = parseInt(url.searchParams.get('count') || '1', 10);
    const count = Math.min(Math.max(countParam, 1), 5);

    // Build exclude set — support both slugified names and raw names, lowercased
    const excludeSet = new Set(
      excludeParam
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    );

    // Fetch a batch of top servers from PulseMCP, sorted by github_stars desc
    // Fetch enough pages to find non-excluded candidates even with a large exclude list
    const FETCH_LIMIT = 200;
    const response = await fetch(
      `${PULSEMCP_API_BASE}/servers?count_per_page=${FETCH_LIMIT}&offset=0`,
      {
        headers: {
          'User-Agent': 'BrainScriblr-Newsletter/1.0',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      throw new Error(`PulseMCP API error: ${response.status}`);
    }

    const data = await response.json();
    const servers: any[] = data.servers || [];

    // Sort by stars descending
    servers.sort((a, b) => (b.github_stars || 0) - (a.github_stars || 0));

    // Filter out excluded servers
    const candidates = servers.filter(server => {
      const nameSlug = slugify(server.name || '');
      const nameLower = (server.name || '').toLowerCase();
      return (
        !excludeSet.has(nameSlug) &&
        !excludeSet.has(nameLower) &&
        server.name // must have a name
      );
    });

    // Pick top `count` candidates
    const picked = candidates.slice(0, count).map(server => {
      // Extract author from source_code_url
      let author = '@unknown';
      const ghMatch = (server.source_code_url || '').match(/github\.com\/([^/]+)/);
      if (ghMatch) author = `@${ghMatch[1]}`;

      const nameSlug = slugify(server.name);

      return {
        id: nameSlug,
        name: server.name,
        description: server.EXPERIMENTAL_ai_generated_description || server.short_description || '',
        stars: server.github_stars || 0,
        github_url: server.source_code_url || server.external_url || null,
        npm_package: server.package_name || null,
        author,
        shelf_url: `https://www.mymcpshelf.com/server/${nameSlug}`
      };
    });

    return new Response(
      JSON.stringify({ featured: picked }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Allow AINewsletter project to call this cross-origin
          'Access-Control-Allow-Origin': '*',
          // Cache for 1 hour — PulseMCP data doesn't change that fast
          'Cache-Control': 'public, max-age=3600'
        }
      }
    );

  } catch (error) {
    console.error('featured-mcps error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch featured MCPs' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
