/**
 * Logo resolution utility for MCP servers
 * Phase 1: GitHub organization avatars
 * 
 * Resolves logo URLs for MCP servers by fetching GitHub organization avatars
 * and caching the results for improved performance.
 * 
 * This module supports both:
 * - Build-time resolution (direct GitHub API calls)
 * - Runtime resolution via Cloudflare Worker
 */

// In-memory cache for build-time logo resolution
const logoCache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

/**
 * Resolve logo URL for a server by fetching directly from GitHub API
 * This is used during build time (SSG/SSR) when we can't call the worker
 * 
 * @param {Object} server - Server object with github_url
 * @param {Object} server.fields - Server fields
 * @param {string} server.fields.github_url - GitHub repository URL
 * @returns {Promise<Object>} Logo data {url, source, cachedAt}
 */
export async function resolveServerLogo(server) {
  const githubUrl = server?.fields?.github_url;
  
  if (!githubUrl) {
    return { url: null, source: null, cachedAt: null };
  }

  // Parse GitHub URL - support both github.com/owner/repo and variations
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\s#?]+)/);
  if (!match) {
    return { url: null, source: null, cachedAt: null };
  }

  const [, owner, repo] = match;
  const cacheKey = `${owner}/${repo}`.toLowerCase();

  // Check in-memory cache first
  const cached = logoCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch directly from GitHub API during build time
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const response = await fetch(githubApiUrl, {
      headers: {
        'User-Agent': 'MCP-Directory-Logo-Resolver',
        'Accept': 'application/vnd.github.v3+json',
        // Use GITHUB_TOKEN env var if available for higher rate limits
        ...(process.env.GITHUB_TOKEN && {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        })
      }
    });
    
    if (!response.ok) {
      console.warn(`GitHub API fetch failed for ${owner}/${repo}: ${response.status}`);
      return { url: null, source: null, cachedAt: null };
    }

    const data = await response.json();
    
    // Extract logo URL from owner avatar
    const logoUrl = data.owner?.avatar_url 
      ? `${data.owner.avatar_url}&s=128`
      : null;

    const result = {
      url: logoUrl,
      source: logoUrl ? 'github' : null,
      cachedAt: new Date().toISOString()
    };

    // Cache the result
    logoCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error(`Failed to resolve logo for ${owner}/${repo}:`, error.message);
    return { url: null, source: null, cachedAt: null };
  }
}

/**
 * Batch resolve logos for multiple servers
 * Resolves logos in parallel for improved performance
 * 
 * @param {Array<Object>} servers - Array of server objects
 * @returns {Promise<Map>} Map of server IDs to logo data
 */
export async function batchResolveLogos(servers) {
  if (!Array.isArray(servers)) {
    return new Map();
  }

  try {
    const logoPromises = servers.map(async (server) => {
      const logo = await resolveServerLogo(server);
      return [server.id, logo];
    });

    const results = await Promise.all(logoPromises);
    return new Map(results);
  } catch (error) {
    console.error('Error in batch logo resolution:', error.message);
    return new Map();
  }
}

/**
 * Enrich servers with logo URLs
 * Returns new array with logoUrl added to each server's fields
 * 
 * @param {Array<Object>} servers - Array of server objects
 * @param {number} limit - Max number of servers to enrich (for rate limiting)
 * @returns {Promise<Array<Object>>} Servers with logo data added
 */
export async function enrichServersWithLogos(servers, limit = 20) {
  if (!Array.isArray(servers) || servers.length === 0) {
    return servers;
  }

  // Only process up to the limit to avoid rate limiting
  const serversToEnrich = servers.slice(0, limit);
  const logoMap = await batchResolveLogos(serversToEnrich);

  // Enrich servers with logo data
  return servers.map(server => {
    const logo = logoMap.get(server.id);
    if (logo && logo.url) {
      return {
        ...server,
        fields: {
          ...server.fields,
          logoUrl: logo.url,
          logoSource: logo.source,
          logoCachedAt: logo.cachedAt
        }
      };
    }
    return server;
  });
}

/**
 * Get logo URL for a single server (synchronous helper for templates)
 * Returns the logo URL if already present in server data
 * 
 * @param {Object} server - Server object
 * @returns {string|null} Logo URL or null
 */
export function getServerLogoUrl(server) {
  return server?.fields?.logoUrl || null;
}
