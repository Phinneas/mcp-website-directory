// Cloudflare Worker for fetching GitHub repo stats
// Provides last commit age and open issue count with 6-hour KV caching

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      const url = new URL(request.url);
      const repoParam = url.searchParams.get('repo'); // e.g., "owner/repo"

      if (!repoParam) {
        return jsonResponse({ error: 'Missing repo parameter' }, 400);
      }

      // Check cache first
      const cacheKey = `repo:${repoParam}`;
      const cached = env.GITHUB_STATS ? await env.GITHUB_STATS.get(cacheKey, 'json') : null;

      if (cached) {
        return jsonResponse(cached);
      }

      // Fetch from GitHub API
      const [owner, repo] = repoParam.split('/');
      const githubUrl = `https://api.github.com/repos/${owner}/${repo}`;

      const githubResponse = await fetch(githubUrl, {
        headers: {
          'User-Agent': 'MCP-Directory-Stats',
          'Accept': 'application/vnd.github.v3+json',
          ...(env.GITHUB_TOKEN && { 'Authorization': `token ${env.GITHUB_TOKEN}` }),
        },
      });

      if (!githubResponse.ok) {
        return jsonResponse({
          error: 'GitHub API error',
          status: githubResponse.status
        }, githubResponse.status);
      }

      const data = await githubResponse.json();

      // Extract logo URL from owner avatar
      const logoUrl = data.owner?.avatar_url 
        ? `${data.owner.avatar_url}&s=128`
        : null;

      const result = {
        pushedAt: data.pushed_at,
        openIssues: data.open_issues_count,
        stars: data.stargazers_count,
        updatedAt: new Date().toISOString(),
        logoUrl: logoUrl,
        logoSource: logoUrl ? 'github' : null,
      };

      // Cache for 6 hours (21600 seconds)
      if (env.GITHUB_STATS) {
        await env.GITHUB_STATS.put(cacheKey, JSON.stringify(result), {
          expirationTtl: 21600,
        });
      }

      return jsonResponse(result);

    } catch (error) {
      return jsonResponse({
        error: 'Internal server error',
        message: error.message
      }, 500);
    }
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=21600', // 6 hours browser cache
    },
  });
}
