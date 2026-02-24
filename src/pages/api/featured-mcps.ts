import type { APIRoute } from 'astro';
import { searchServers, healthCheck } from '../../utils/meilisearch.js';
import { slugify } from '../../utils/slugify.js';

export const prerender = false;

/**
 * GET /api/featured-mcps
 *
 * Returns a randomly selected MCP server for use in the BrainScriblr newsletter.
 * Picks from the full Meilisearch catalog, excluding:
 *   1. Servers hardcoded as always-featured on the homepage (ALWAYS_FEATURED_IDS)
 *   2. Servers in the ?exclude= list (previously featured in past newsletter issues,
 *      tracked by the newsletter in S3 as newsletter/featured-mcps-history.json)
 *
 * Query params:
 *   exclude  Comma-separated list of server IDs already featured in previous
 *            newsletter issues. These will be skipped.
 *   count    Number of candidates to return (default 1, max 5).
 *
 * Example:
 *   GET /api/featured-mcps?exclude=github-mcp,postgres-mcp&count=1
 *
 * Response shape:
 *   {
 *     "featured": [
 *       {
 *         "id": "puppeteer-mcp",          ← Meilisearch primary key, used as history key
 *         "name": "Puppeteer MCP Server",
 *         "description": "...",
 *         "stars": 360,
 *         "github_url": "https://github.com/...",
 *         "npm_package": "puppeteer-mcp-server",
 *         "author": "@merajmehrabi",
 *         "shelf_url": "https://www.mymcpshelf.com/server/puppeteer-mcp-server"
 *       }
 *     ]
 *   }
 */

/**
 * These IDs are always shown in the site's "Featured MCP Servers" homepage section.
 * Exclude them from newsletter random picks so the newsletter spotlights
 * different servers than what visitors already see on the homepage.
 * Mirrors the ALWAYS_FEATURED constant in FeaturedMcpServers.astro.
 */
const ALWAYS_FEATURED_IDS = new Set(['jetski', 'mcp-operator']);

/** Pull up to this many servers from Meilisearch for the random pool. */
const POOL_LIMIT = 500;

export const GET: APIRoute = async ({ url }) => {
  try {
    const excludeParam = url.searchParams.get('exclude') || '';
    const countParam = parseInt(url.searchParams.get('count') || '1', 10);
    const count = Math.min(Math.max(countParam, 1), 5);

    // Build the combined exclusion set:
    // - always-featured site IDs
    // - previously newsletter-featured IDs (sent by the newsletter via ?exclude=)
    const excludeSet = new Set<string>([
      ...ALWAYS_FEATURED_IDS,
      ...excludeParam
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ]);

    // Health-check Meilisearch before querying
    const healthy = await healthCheck();
    if (!healthy) {
      console.error('featured-mcps: Meilisearch unavailable');
      return new Response(
        JSON.stringify({ error: 'Search service unavailable', featured: [] }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Fetch a large pool of servers from Meilisearch.
    // Empty query returns all indexed servers; sort by stars desc so the pool
    // is weighted toward well-maintained servers even before random selection.
    const results = await searchServers('', {
      limit: POOL_LIMIT,
      sort: ['stars:desc'],
    });

    const allServers: any[] = results.hits ?? [];

    // Filter out excluded IDs and inactive/unnamed servers
    const candidates = allServers.filter(
      (s) =>
        s.id &&
        s.name &&
        s.status !== 'inactive' &&
        !excludeSet.has(s.id.toLowerCase())
    );

    if (candidates.length === 0) {
      // All known servers have been featured — return empty so the newsletter
      // resets its S3 history and skips the MCP block this issue.
      return new Response(JSON.stringify({ featured: [] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      });
    }

    // Randomly shuffle the candidate pool and pick `count` servers.
    const shuffled = fisherYatesShuffle([...candidates]);
    const picked = shuffled.slice(0, count).map((server) => ({
      // Use the Meilisearch primary key as the stable history-tracking ID.
      id: server.id,
      name: server.name,
      description: server.description || '',
      stars: server.stars || 0,
      github_url: server.github_url || null,
      npm_package: server.npm_package || null,
      author: server.author || '@unknown',
      // shelf_url uses slugify(name) — same logic as [slug].astro routing.
      shelf_url: `https://www.mymcpshelf.com/server/${slugify(server.name)}`,
    }));

    return new Response(JSON.stringify({ featured: picked }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Allow the AINewsletter Cloudflare Worker to call this cross-origin.
        'Access-Control-Allow-Origin': '*',
        // No caching — random selection should differ on each call.
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('featured-mcps error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch featured MCPs', featured: [] }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
};

/**
 * Fisher-Yates shuffle — returns a new randomly ordered array.
 * Using Math.random() is fine here; cryptographic randomness isn't needed
 * for newsletter server selection.
 */
function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
