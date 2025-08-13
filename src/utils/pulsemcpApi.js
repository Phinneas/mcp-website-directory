// PulseMCP API client for fetching MCP server data
// Based on https://github.com/orliesaurus/pulsemcp-server

// Use PulseMCP.com's website directly since the server is an MCP protocol server, not REST API
const PULSEMCP_WEB_URL = 'https://www.pulsemcp.com';

/**
 * Fetch all MCP servers from the PulseMCP API with pagination
 * @returns {Promise<Array>} Array of all MCP servers
 */
export async function fetchAllMCPServers() {
  console.log('Fetching MCP servers from PulseMCP API...');
  
  let page = 0;
  const allServers = [];
  const maxPages = 100; // Safety limit to prevent infinite loops
  
  try {
    while (page < maxPages) {
      console.log(`Fetching page ${page}...`);
      
      const response = await fetch(`${PULSEMCP_API_URL}/servers?page=${page}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MCP-Directory/1.0'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        if (response.status === 404 && page === 0) {
          console.warn('PulseMCP API not available, using fallback data');
          return null; // Will trigger fallback to static data
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const servers = await response.json();
      
      // If no servers or empty array, we've reached the end
      if (!servers || !Array.isArray(servers) || servers.length === 0) {
        console.log(`Reached end of results at page ${page}`);
        break;
      }
      
      console.log(`Got ${servers.length} servers from page ${page}`);
      allServers.push(...servers);
      page++;
      
      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Successfully fetched ${allServers.length} servers from PulseMCP API`);
    return allServers;
    
  } catch (error) {
    console.error('Error fetching from PulseMCP API:', error.message);
    
    // Check if it's a connection error (API not running)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn('PulseMCP API server appears to be offline, using fallback data');
      return null;
    }
    
    // For other errors, still return null to trigger fallback
    console.warn('Using fallback data due to API error');
    return null;
  }
}

/**
 * Transform PulseMCP API data to our internal format
 * @param {Array} apiServers - Raw servers from PulseMCP API 
 * @returns {Array} Servers in our internal format
 */
export function transformPulseMCPData(apiServers) {
  if (!Array.isArray(apiServers)) {
    return [];
  }
  
  return apiServers.map((server, index) => {
    // Map PulseMCP API structure to our format
    // This may need adjustment based on actual API response structure
    return {
      id: server.id || `pulsemcp-${index}`,
      fields: {
        name: server.name || server.title || 'Unknown Server',
        description: server.description || server.summary || 'No description available',
        author: server.author || server.maintainer || '@unknown',
        category: mapCategory(server.category || server.type || 'other'),
        language: server.language || server.tech || 'Unknown',
        stars: server.stars || server.github_stars || 0,
        github_url: server.github_url || server.repository || server.url || '#',
        npm_package: server.npm_package || server.package || generateNpmPackage(server.name),
        downloads: server.downloads || 0,
        updated: server.updated_at || server.last_updated || new Date().toISOString()
      }
    };
  });
}

/**
 * Map PulseMCP categories to our internal categories
 * @param {string} pulsemcpCategory 
 * @returns {string} Our internal category
 */
function mapCategory(pulsemcpCategory) {
  const categoryMap = {
    'web-automation': 'browser-automation',
    'browser': 'browser-automation',
    'database': 'databases',
    'db': 'databases',
    'communication': 'communication',
    'chat': 'communication',
    'messaging': 'communication',
    'development': 'development',
    'dev-tools': 'development',
    'cloud': 'cloud',
    'aws': 'cloud',
    'azure': 'cloud',
    'gcp': 'cloud',
    'file-system': 'file-systems',
    'files': 'file-systems',
    'storage': 'file-systems',
    'ai': 'ai-tools',
    'ml': 'ai-tools',
    'artificial-intelligence': 'ai-tools',
    'search': 'search',
    'web-scraping': 'search',
    'scraping': 'search',
    'finance': 'finance',
    'fintech': 'finance',
    'payments': 'finance',
    'media': 'media',
    'video': 'media',
    'audio': 'media',
    'productivity': 'productivity',
    'tools': 'productivity',
    'security': 'security',
    'aggregator': 'aggregators',
    'meta': 'aggregators',
    'registry': 'aggregators'
  };
  
  const normalized = pulsemcpCategory.toLowerCase().trim();
  return categoryMap[normalized] || 'other';
}

/**
 * Generate npm package name if not provided
 * @param {string} serverName 
 * @returns {string}
 */
function generateNpmPackage(serverName) {
  if (!serverName) return 'unknown-mcp';
  
  return serverName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '-mcp';
}