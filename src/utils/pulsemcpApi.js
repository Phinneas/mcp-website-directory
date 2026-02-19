// PulseMCP API client for fetching MCP server data
// API docs: https://api.pulsemcp.com/v0beta

const PULSEMCP_API_BASE = 'https://api.pulsemcp.com/v0beta';
const COUNT_PER_PAGE = 100;
// Fetch up to 2500 servers (25 pages of 100)
const MAX_SERVERS = 2500;

/**
 * Fetch all MCP servers from the PulseMCP API with pagination
 * @returns {Promise<Array>} Array of all MCP servers
 */
export async function fetchAllMCPServers() {
  console.log('Fetching MCP servers from PulseMCP API...');

  const allServers = [];
  let offset = 0;

  try {
    while (allServers.length < MAX_SERVERS) {
      console.log(`Fetching servers at offset ${offset}...`);

      const response = await fetch(
        `${PULSEMCP_API_BASE}/servers?count_per_page=${COUNT_PER_PAGE}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MCP-Directory/1.0'
          },
          signal: AbortSignal.timeout(15000)
        }
      );

      if (!response.ok) {
        if (offset === 0) {
          console.warn('PulseMCP API not available, using fallback data');
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const servers = data.servers || data;

      if (!servers || !Array.isArray(servers) || servers.length === 0) {
        console.log(`Reached end of results at offset ${offset}`);
        break;
      }

      console.log(`Got ${servers.length} servers (total so far: ${allServers.length + servers.length})`);
      allServers.push(...servers);
      offset += servers.length;

      // Stop if we've hit our target or there are no more pages
      if (!data.next || allServers.length >= MAX_SERVERS) {
        break;
      }

      // Small delay to be polite to the API
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`Successfully fetched ${allServers.length} servers from PulseMCP API`);
    return allServers;

  } catch (error) {
    console.error('Error fetching from PulseMCP API:', error.message);
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
    // Extract author from source_code_url (e.g. github.com/author/repo -> @author)
    let author = '@unknown';
    const sourceUrl = server.source_code_url || '';
    const ghMatch = sourceUrl.match(/github\.com\/([^/]+)/);
    if (ghMatch) {
      author = `@${ghMatch[1]}`;
    }

    return {
      id: server.id || slugifyId(server.name) || `pulsemcp-${index}`,
      fields: {
        name: server.name || 'Unknown Server',
        description: server.EXPERIMENTAL_ai_generated_description || server.short_description || 'No description available',
        author,
        category: 'other', // PulseMCP v0beta API does not expose category
        language: 'Unknown',
        stars: server.github_stars || 0,
        github_url: server.source_code_url || server.external_url || server.url || '#',
        npm_package: server.package_name || null,
        downloads: server.package_download_count || 0,
        updated: new Date().toISOString(),
        logoUrl: null,
        logoSource: null,
        logoCachedAt: null
      }
    };
  });
}

/**
 * Create a stable ID from a server name
 * @param {string} name
 * @returns {string}
 */
function slugifyId(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}