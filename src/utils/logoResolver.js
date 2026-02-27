/**
 * Logo resolution utility for MCP servers
 *
 * Resolves logo URLs for MCP servers by deriving the GitHub owner avatar
 * URL directly from the repository URL — no API calls, no rate limits.
 *
 * GitHub serves public owner/org avatars at a well-known URL:
 *   https://github.com/{owner}.png?size=128
 *
 * This module supports both:
 * - Build-time resolution (static site generation)
 * - Runtime resolution via Cloudflare Worker
 */

/**
 * Resolve logo URL for a server using GitHub's public avatar URL.
 *
 * GitHub owner avatars are available at a predictable public URL with no
 * API calls or authentication required, eliminating build-time rate limiting.
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

  const [, owner] = match;

  // Construct the public GitHub avatar URL directly — no API call needed.
  // GitHub serves owner/org avatars at this well-known public URL without auth.
  const logoUrl = `https://github.com/${owner}.png?size=128`;

  return {
    url: logoUrl,
    source: 'github',
    cachedAt: new Date().toISOString()
  };
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
 * @param {number} limit - Kept for API compatibility; no longer enforced since
 *                         logo resolution no longer makes API calls and is not
 *                         subject to rate limiting. All servers are now enriched.
 * @returns {Promise<Array<Object>>} Servers with logo data added
 */
export async function enrichServersWithLogos(servers, limit) {
  if (!Array.isArray(servers) || servers.length === 0) {
    return servers;
  }

  // No rate-limit cap needed: logo URLs are derived directly from the
  // GitHub URL (no API calls), so every server can be enriched safely.
  const logoMap = await batchResolveLogos(servers);

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
