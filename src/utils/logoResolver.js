/**
 * Logo resolution utility for MCP servers
 * Phase 1: GitHub organization avatars
 * 
 * Resolves logo URLs for MCP servers by fetching GitHub organization avatars
 * and caching the results for improved performance.
 */

/**
 * Resolve logo URL for a server
 * @param {Object} server - Server object with github_url
 * @param {Object} server.fields - Server fields
 * @param {string} server.fields.github_url - GitHub repository URL
 * @returns {Promise<Object>} Logo data {url, source, cachedAt}
 * @example
 * const server = {
 *   fields: {
 *     github_url: 'https://github.com/modelcontextprotocol/servers'
 *   }
 * };
 * const logo = await resolveServerLogo(server);
 * // Returns: { url: 'https://avatars.githubusercontent.com/...', source: 'github', cachedAt: '2026-01-21T...' }
 */
export async function resolveServerLogo(server) {
  const githubUrl = server?.fields?.github_url;
  
  if (!githubUrl) {
    return { url: null, source: null, cachedAt: null };
  }

  // Parse GitHub URL - support both github.com/owner/repo and variations
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
  if (!match) {
    return { url: null, source: null, cachedAt: null };
  }

  const [, owner, repo] = match;

  try {
    // Fetch from GitHub stats worker (already cached)
    const response = await fetch(
      `/api/github-stats?repo=${owner}/${repo}`
    );
    
    if (!response.ok) {
      console.warn(`GitHub stats fetch failed for ${owner}/${repo}: ${response.status}`);
      return { url: null, source: null, cachedAt: null };
    }

    const data = await response.json();
    
    return {
      url: data.logoUrl || null,
      source: data.logoSource || null,
      cachedAt: data.updatedAt || new Date().toISOString()
    };
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
 * @example
 * const servers = [
 *   { id: 'srv-1', fields: { github_url: 'https://github.com/owner1/repo1' } },
 *   { id: 'srv-2', fields: { github_url: 'https://github.com/owner2/repo2' } }
 * ];
 * const logos = await batchResolveLogos(servers);
 * // Returns: Map { 'srv-1' => { url: '...', source: 'github', ... }, 'srv-2' => { ... } }
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
    // Return empty map on critical error
    return new Map();
  }
}
