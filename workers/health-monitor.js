// Cloudflare Worker for weekly MCP server health monitoring
// Checks last commit date, SDK version, open issues, and release cadence
// Runs weekly via cron triggers and updates D1 database

export default {
  async scheduled(event, env, ctx) {
    console.log('Health monitor cron triggered:', event.cron);
    
    try {
      await runHealthCheck(env);
      return new Response('Health check completed successfully');
    } catch (error) {
      console.error('Health check failed:', error);
      return new Response(`Health check failed: ${error.message}`, { status: 500 });
    }
  },

  async fetch(request, env) {
    // Manual trigger via HTTP endpoint for testing
    try {
      await runHealthCheck(env);
      return new Response('Health check completed successfully');
    } catch (error) {
      console.error('Health check failed:', error);
      return new Response(`Health check failed: ${error.message}`, { status: 500 });
    }
  },
};

async function runHealthCheck(env) {
  console.log('Starting weekly health check...');
  
  // Fetch all servers with GitHub URLs
  const servers = await env.DB.prepare(`
    SELECT id, name, github_url 
    FROM servers 
    WHERE github_url IS NOT NULL 
    ORDER BY id
  `).all();
  
  if (!servers.results || servers.results.length === 0) {
    console.log('No servers found with GitHub URLs');
    return;
  }
  
  console.log(`Processing ${servers.results.length} servers...`);
  
  // Process in batches of 50 to respect GitHub API limits
  const batchSize = 50;
  for (let i = 0; i < servers.results.length; i += batchSize) {
    const batch = servers.results.slice(i, i + batchSize);
    await processBatch(batch, env);
    
    // Rate limiting delay between batches
    if (i + batchSize < servers.results.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('Health check completed');
}

async function processBatch(servers, env) {
  console.log(`Processing batch of ${servers.length} servers...`);
  
  const updates = [];
  
  for (const server of servers) {
    const repoInfo = extractRepoInfo(server.github_url);
    if (!repoInfo) {
      console.log(`Invalid GitHub URL for ${server.name}: ${server.github_url}`);
      continue;
    }
    
    try {
      const healthData = await fetchRepoHealth(repoInfo.owner, repoInfo.repo, env);
      await updateServerHealth(server.id, healthData, env);
      updates.push({ id: server.id, status: healthData.health_status });
    } catch (error) {
      console.error(`Failed to fetch health for ${server.name}:`, error.message);
    }
  }
  
  console.log(`Batch completed: ${updates.length} servers updated`);
}

function extractRepoInfo(githubUrl) {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

async function fetchRepoHealth(owner, repo, env) {
  // Check cache first
  const cacheKey = `health:${owner}/${repo}`;
  const cached = await env.GITHUB_STATS.get(cacheKey, 'json');
  
  if (cached && cached.data) {
    console.log(`Cache hit for ${owner}/${repo}`);
    return cached.data;
  }
  
  // Fetch from GitHub API
  const githubUrl = `https://api.github.com/repos/${owner}/${repo}`;
  
  const response = await fetch(githubUrl, {
    headers: {
      'User-Agent': 'MCP-Directory-Health-Monitor',
      'Accept': 'application/vnd.github.v3+json',
      ...(env.GITHUB_TOKEN && { 'Authorization': `token ${env.GITHUB_TOKEN}` }),
    },
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Calculate health metrics
  const healthMetrics = calculateHealthMetrics(data);
  
  // Cache for 24 hours
  await env.GITHUB_STATS.put(cacheKey, JSON.stringify({ data: healthMetrics }), {
    expirationTtl: 86400,
  });
  
  return healthMetrics;
}

function calculateHealthMetrics(githubData) {
  const now = new Date();
  const lastCommit = new Date(githubData.pushed_at);
  const daysSinceLastCommit = Math.floor((now - lastCommit) / (1000 * 60 * 60 * 24));
  
  // Health status logic
  let healthStatus = 'unknown';
  if (daysSinceLastCommit < 90) {
    healthStatus = 'active';
  } else if (daysSinceLastCommit < 180) {
    healthStatus = 'maintained';
  } else {
    healthStatus = 'maintenance_required'; // Constructive language
  }
  
  return {
    last_commit_date: githubData.pushed_at,
    open_issues_count: githubData.open_issues_count,
    health_status: healthStatus,
    current_release_version: githubData.latest_release_version || null,
    release_cadence: calculateReleaseCadence(githubData),
    mcp_sdk_version: null, // Would require package.json parsing
    health_updated_at: now.toISOString(),
  };
}

function calculateReleaseCadence(githubData) {
  // This would need additional API calls to fetch release history
  // For now, we categorize based on recent releases if available
  if (githubData.releases_count > 10) {
    return 'frequent';
  } else if (githubData.releases_count > 5) {
    return 'moderate';
  } else if (githubData.releases_count > 0) {
    return 'occasional';
  }
  return 'none';
}

async function updateServerHealth(serverId, healthData, env) {
  await env.DB.prepare(`
    UPDATE servers 
    SET 
      last_commit_date = ?,
      open_issues_count = ?,
      health_status = ?,
      health_updated_at = ?,
      release_cadence = ?,
      current_release_version = ?,
      mcp_sdk_version = ?
    WHERE id = ?
  `).bind(
    healthData.last_commit_date,
    healthData.open_issues_count,
    healthData.health_status,
    healthData.health_updated_at,
    healthData.release_cadence,
    healthData.current_release_version,
    healthData.mcp_sdk_version,
    serverId
  ).run();
  
  console.log(`Updated health status for ${serverId}: ${healthData.health_status}`);
}
