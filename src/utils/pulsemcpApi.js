// PulseMCP API client for fetching MCP server data
// API docs: https://api.pulsemcp.com/v0beta

const PULSEMCP_API_BASE = 'https://api.pulsemcp.com/v0beta';
const COUNT_PER_PAGE = 250; // Max allowed by API
// Fetch up to 5000 servers (20 pages of 250) - PulseMCP has 8600+ servers
// Note: v0beta API is in sunset mode (random failures) - retry logic essential
const MAX_SERVERS = 5000;
const MAX_RETRIES = 3;

/**
 * Fetch with retry for API sunset handling
 */
async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Use minimal fetch options for Cloudflare compatibility
      const response = await fetch(url);
      
      // Check for API sunset error in response
      if (response.ok) {
        const data = await response.json();
        if (data.error?.code === 'API_SUNSET') {
          console.warn(`API sunset error, retry ${attempt + 1}/${retries}`);
          await new Promise(r => setTimeout(r, 500 * (attempt + 1))); // Exponential backoff
          continue;
        }
        return { ok: true, data };
      }
      
      // Try to parse error
      try {
        const errorData = await response.json();
        if (errorData.error?.code === 'API_SUNSET') {
          console.warn(`API sunset error (HTTP), retry ${attempt + 1}/${retries}`);
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        return { ok: false, status: response.status, error: errorData };
      } catch {
        return { ok: false, status: response.status };
      }
    } catch (fetchError) {
      console.error(`Fetch error on attempt ${attempt + 1}:`, fetchError.message);
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
  return { ok: false, error: 'Max retries exceeded' };
}

/**
 * Fetch all MCP servers from the PulseMCP API with pagination
 * @returns {Promise<Array>} Array of all MCP servers
 */
export async function fetchAllMCPServers() {
  console.log('Fetching MCP servers from PulseMCP API (with retry for sunset mode)...');

  const allServers = [];
  let offset = 0;

  try {
    while (allServers.length < MAX_SERVERS) {
      console.log(`Fetching servers at offset ${offset}...`);

      const url = `${PULSEMCP_API_BASE}/servers?count_per_page=${COUNT_PER_PAGE}&offset=${offset}`;
      const result = await fetchWithRetry(url);
      
      if (!result.ok) {
        console.warn(`PulseMCP API failed after retries: ${result.status || result.error}`);
        if (offset === 0) {
          console.warn('Using fallback data');
          return null;
        }
        break; // Stop pagination on error, return what we have
      }

      const data = result.data;
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
      await new Promise(resolve => setTimeout(resolve, 200));
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
 * Deployment type mapping from transport support to deployment targets
 * This maps the technical transport (stdio/sse/websocket) to business deployment categories
 */
const deploymentTypeMapping = {
  // stdio-only servers -> Local development and self-hosted
  stdio_only: ['local_stdio', 'self_hosted'],
  
  // SSE-only servers -> Cloud-native and enterprise SaaS  
  sse_only: ['cloud_native', 'enterprise_saas'],
  
  // Hybrid servers (stdio + SSE) -> All deployment types
  hybrid: ['local_stdio', 'cloud_native', 'self_hosted', 'enterprise_saas'],
  
  // WebSocket servers -> Typically cloud/enterprise focused
  websocket: ['cloud_native', 'enterprise_saas']
};

/**
 * Infer deployment type from server capabilities
 * @param {Object} server - Server with capabilities/transport metadata
 * @returns {Object} Deployment type inference
 */
function inferDeploymentType(server) {
  const name = server.name || '';
  const description = server.short_description || '';
  const text = `${name} ${description}`.toLowerCase();
  
  // Check for transport support flags first (most reliable)
  const hasStdio = server.capabilities?.includes('stdio');
  const hasSse = server.capabilities?.includes('sse');
  const hasWebsocket = server.capabilities?.includes('websocket');
  
  let primaryDeployment, secondaryDeployments, enterpriseFeatures = [];
  
  // Priority 1: Use explicit transport support from capabilities
  if (hasStdio && hasSse) {
    // Hybrid servers support multiple deployment types
    primaryDeployment = 'hybrid';
    secondaryDeployments = ['local_stdio', 'cloud_native', 'self_hosted'];
    
    // Check for enterprise features
    if (text.includes('auth') || text.includes('oauth') || text.includes('enterprise')) {
      enterpriseFeatures.push('sso', 'audit_logs', 'enterprise_ready');
    }
    
  } else if (hasStdio) {
    // stdio-only servers are primarily local/self-hosted
    primaryDeployment = 'local_stdio';
    secondaryDeployments = ['self_hosted'];
    
    // CLI tools that could be self-hosted
    if (text.includes('self-hosted') || text.includes('on-premise') || text.includes('vpc')) {
      primaryDeployment = 'self_hosted';
    }
    
  } else if (hasSse || hasWebsocket) {
    // Cloud/SSE focused servers
    primaryDeployment = 'cloud_native';
    secondaryDeployments = ['enterprise_saas'];
    
    // Check for enterprise SaaS characteristics
    const hasEnterpriseSignals = 
      text.includes('enterprise') ||
      text.includes('sl') ||
      text.includes('auth') ||
      text.includes('sso') ||
      text.includes('managed') ||
      server.github_stars > 1000 ||
      server.package_download_count > 100000;
    
    if (hasEnterpriseSignals) {
      primaryDeployment = 'enterprise_saas';
      secondaryDeployments = ['cloud_native'];
      enterpriseFeatures.push('sla', 'support', 'enterprise_ready');
    }
    
  } else {
    // Default fallback based on heuristics
    const isCloudService = 
      text.includes('saas') ||
      text.includes('api') ||
      text.includes('cloud');
    
    const isLocalTool = 
      text.includes('cli') ||
      text.includes('local') ||
      text.includes('filesystem');
    
    if (isCloudService) {
      primaryDeployment = 'cloud_native';
      secondaryDeployments = ['self_hosted'];
    } else if (isLocalTool) {
      primaryDeployment = 'local_stdio';
      secondaryDeployments = ['self_hosted'];
    } else {
      // Fallback to hybrid for unknown servers
      primaryDeployment = 'hybrid';
      secondaryDeployments = ['local_stdio', 'self_hosted'];
    }
  }
  
  return {
    primaryDeployment,
    secondaryDeployments,
    enterpriseFeatures,
    confidence: hasStdio || hasSse || hasWebsocket ? 'high' : 'medium'
  };
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
    
    // Infer category from name and description
    const category = inferCategory(server.name, server.short_description, server.EXPERIMENTAL_ai_generated_description);
    
    // Infer deployment type from server capabilities
    const deployment = inferDeploymentType(server);

    return {
      id: server.id || slugifyId(server.name) || `pulsemcp-${index}`,
      fields: {
        name: server.name || 'Unknown Server',
        description: server.EXPERIMENTAL_ai_generated_description || server.short_description || 'No description available',
        author,
        category,
        language: 'Unknown',
        stars: server.github_stars || 0,
        github_url: server.source_code_url || server.external_url || server.url || '#',
        npm_package: server.package_name || null,
        downloads: server.package_download_count || 0,
        updated: new Date().toISOString(),
        logoUrl: null,
        logoSource: null,
        logoCachedAt: null
      },
      // Add deployment metadata
      deployment: deployment.primaryDeployment,
      deployment_metadata: {
        confidence: deployment.confidence,
        secondary_deployments: deployment.secondaryDeployments,
        capabilities: server.capabilities || [],
        inferred_at: new Date().toISOString()
      },
      enterprise_features: deployment.enterpriseFeatures
    };
  });
}

/**
 * Infer category from server name and description
 */
function inferCategory(name, shortDesc, aiDesc) {
  const text = `${name} ${shortDesc || ''} ${aiDesc || ''}`.toLowerCase();
  
  // Category keywords
  const categoryPatterns = [
    { category: 'databases', keywords: ['database', 'sql', 'postgres', 'mysql', 'mongodb', 'sqlite', 'redis', 'supabase', 'neon', 'planetScale'] },
    { category: 'cloud', keywords: ['aws', 'azure', 'gcp', 'cloudflare', 'vercel', 'netlify', 'kubernetes', 'docker', 'terraform'] },
    { category: 'development', keywords: ['github', 'gitlab', 'git', 'code', 'development', 'build', 'test', 'debug', 'eslint', 'typescript'] },
    { category: 'communication', keywords: ['slack', 'discord', 'telegram', 'email', 'twilio', 'sendgrid', 'notifier', 'messaging'] },
    { category: 'productivity', keywords: ['notion', 'jira', 'linear', 'trello', 'asana', 'calendar', 'task', 'todo', 'project'] },
    { category: 'ai-ml', keywords: ['ai', 'ml', 'llm', 'gpt', 'claude', 'openai', 'anthropic', 'huggingface', 'model', 'embedding', 'rag'] },
    { category: 'search', keywords: ['search', 'web', 'scrape', 'crawl', 'browser', 'puppeteer', 'playwright', 'selenium'] },
    { category: 'file-systems', keywords: ['file', 'filesystem', 'drive', 'storage', 'dropbox', 's3', 'blob'] },
    { category: 'finance', keywords: ['finance', 'stock', 'trading', 'crypto', 'bitcoin', 'ethereum', 'payment', 'stripe', 'bank'] },
    { category: 'security', keywords: ['security', 'auth', 'oauth', 'jwt', 'password', 'encryption', 'vulnerability'] },
    { category: 'media', keywords: ['image', 'video', 'audio', 'media', 'youtube', 'spotify', 'ffmpeg'] },
    { category: 'data-analytics', keywords: ['analytics', 'data', 'metrics', 'dashboard', 'chart', 'grafana', 'prometheus'] },
    { category: 'aggregators', keywords: ['aggregator', 'platform', 'gateway', 'registry', 'hub', 'unified'] },
    { category: 'browser-automation', keywords: ['browser', 'selenium', 'puppeteer', 'playwright', 'automation', 'scraping'] },
  ];
  
  for (const { category, keywords } of categoryPatterns) {
    if (keywords.some(kw => text.includes(kw))) {
      return category;
    }
  }
  
  return 'development'; // Default category
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