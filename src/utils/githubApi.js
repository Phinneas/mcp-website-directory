/**
 * GitHub API utilities for fetching project health metrics
 * 
 * Metrics tracked:
 * - Commit velocity (commits last 30 days)
 * - Issue resolution rate (% closed vs open)
 * - Release freshness (days since last release)
 * - Community growth (star velocity - stars gained in last 30 days vs total)
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Extract owner and repo name from GitHub URL
 * @param {string} githubUrl - Full GitHub URL (e.g., https://github.com/owner/repo)
 * @returns {Object|null} {owner, repo} or null if invalid
 */
export function extractRepoInfo(githubUrl) {
  if (!githubUrl) return null;
  
  const urlPattern = /github\.com\/([^\/]+)\/([^\/\.]+)/;
  const match = githubUrl.match(urlPattern);
  
  if (!match) return null;
  
  return {
    owner: match[1],
    repo: match[2]
  };
}

/**
 * Fetch commit velocity (commits in last 30 days)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} {commits, commitVelocity: number} or null on error
 */
export async function fetchCommitVelocity(owner, repo, token = null) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MCP-Directory/1.0'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?since=${since}`,
      { headers }
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch commits for ${owner}/${repo}: ${response.status}`);
      return null;
    }
    
    const commits = await response.json();
    const commitVelocity = Array.isArray(commits) ? commits.length : 0;
    
    return {
      commits: Array.isArray(commits) ? commits : [],
      commitVelocity
    };
    
  } catch (error) {
    console.error('Error fetching commit velocity:', error.message);
    return null;
  }
}

/**
 * Fetch issue resolution rate
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Stats or null on error
 */
export async function fetchIssueStats(owner, repo, token = null) {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MCP-Directory/1.0'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Fetch open and closed issue counts
    const [openResponse, closedResponse] = await Promise.all([
      fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=open&per_page=1`, { headers }),
      fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=closed&per_page=1`, { headers })
    ]);
    
    if (!openResponse.ok || !closedResponse.ok) {
      console.error(`Failed to fetch issue stats for ${owner}/${repo}`);
      return null;
    }
    
    // GitHub includes pagination headers with total counts
    const openLinks = openResponse.headers.get('link') || '';
    const closedLinks = closedResponse.headers.get('link') || '';
    
    const openCount = extractCountFromLink(openLinks) || 0;
    const closedCount = extractCountFromLink(closedLinks) || 0;
    
    const totalIssues = openCount + closedCount;
    const resolutionRate = totalIssues > 0 ? (closedCount / totalIssues * 100).toFixed(1) : 0;
    
    return {
      openIssues: openCount,
      closedIssues: closedCount,
      totalIssues,
      resolutionRate: parseFloat(resolutionRate)
    };
    
  } catch (error) {
    console.error('Error fetching issue stats:', error.message);
    return null;
  }
}

/**
 * Extract total count from GitHub Link header
 * @param {string} linkHeader - Link header from GitHub API
 * @returns {number|null} Total count or null
 */
function extractCountFromLink(linkHeader) {
  if (!linkHeader) return null;
  
  // Try to extract 'last' page number from link header
  const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
  if (lastMatch) {
    return parseInt(lastMatch[1], 10);
  }
  
  // Fallback: try to parse from other link relations
  const matches = linkHeader.matchAll(/page=(\d+)/g);
  const pages = Array.from(matches).map(m => parseInt(m[1], 10));
  return Math.max(...pages, 1); // Minimum 1 if issues exist
}

/**
 * Fetch release freshness (days since last release)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object|null>} {lastReleaseDate, daysSinceLastRelease} or null on error
 */
export async function fetchReleaseFreshness(owner, repo, token = null) {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MCP-Directory/1.0'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases?per_page=1`,
      { headers }
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch releases for ${owner}/${repo}`);
      return null;
    }
    
    const releases = await response.json();
    
    if (!releases || !Array.isArray(releases) || releases.length === 0) {
      return {
        lastReleaseDate: null,
        daysSinceLastRelease: null,
        hasReleases: false
      };
    }
    
    const lastRelease = releases[0];
    const releaseDate = new Date(lastRelease.created_at || lastRelease.published_at);
    const now = new Date();
    const daysSinceLastRelease = Math.floor((now - releaseDate) / (1000 * 60 * 60 * 24));
    
    return {
      lastReleaseDate: lastRelease.created_at || lastRelease.published_at,
      daysSinceLastRelease,
      hasReleases: true,
      version: lastRelease.tag_name || lastRelease.name
    };
    
  } catch (error) {
    console.error('Error fetching release freshness:', error.message);
    return null;
  }
}

/**
 * Fetch star velocity (stars gained in last 30 days)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object|null>} Star data or null on error
 */
export async function fetchStarVelocity(owner, repo, token = null) {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MCP-Directory/1.0'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();
    
    // Fetch recent stargazers
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/stargazers?since=${since}&per_page=100`,
      { headers }
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch star velocity for ${owner}/${repo}`);
      return null;
    }
    
    const recentStargazers = await response.json();
    
    // To get accurate data without pagination, we need to fetch repo info and estimate
    // GitHub API returns all stargazers, but only recent ones with 'since' parameter
    // We'll approximate by counting returned results
    
    const starsGained30Days = Array.isArray(recentStargazers) ? recentStargazers.length : 0;
    
    // Get total stars from repo endpoint for comparison
    const repoResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}`,
      { headers }
    );
    
    let totalStars = 0;
    if (repoResponse.ok) {
      const repoData = await repoResponse.json();
      totalStars = repoData.stargazers_count || 0;
    }
    
    return {
      totalStars,
      starsGained30Days,
      starVelocity: starsGained30Days, // Stars gained in last 30 days
      starGrowthRate: totalStars > 0 ? ((starsGained30Days / totalStars) * 100).toFixed(2) : 0
    };
    
  } catch (error) {
    console.error('Error fetching star velocity:', error.message);
    return null;
  }
}

/**
 * Fetch all GitHub health vitals for a repository
 * @param {string} githubUrl - Full GitHub URL
 * @param {string} token - Optional GitHub personal access token for higher rate limits
 * @returns {Promise<Object>} Complete health metrics
 */
export async function fetchGitHubHealthVitals(githubUrl, token = null) {
  const repoInfo = extractRepoInfo(githubUrl);
  
  if (!repoInfo) {
    console.error('Invalid GitHub URL:', githubUrl);
    return {
      error: 'Invalid GitHub URL',
      data: null
    };
  }
  
  const { owner, repo } = repoInfo;
  
  // Fetch all metrics in parallel for efficiency
  const [commits, issues, releases, stars] = await Promise.allSettled([
    fetchCommitVelocity(owner, repo, token),
    fetchIssueStats(owner, repo, token),
    fetchReleaseFreshness(owner, repo, token),
    fetchStarVelocity(owner, repo, token)
  ]);
  
  const commitData = commits.status === 'fulfilled' ? commits.value : null;
  const issueData = issues.status === 'fulfilled' ? issues.value : null;
  const releaseData = releases.status === 'fulfilled' ? releases.value : null;
  const starData = stars.status === 'fulfilled' ? stars.value : null;
  
  return {
    repoInfo,
    freshness: {
      commitVelocity: commitData?.commitVelocity || 0,
      daysSinceLastRelease: releaseData?.daysSinceLastRelease,
      lastReleaseDate: releaseData?.lastReleaseDate,
      hasReleases: releaseData?.hasReleases || false
    },
    health: {
      issueResolutionRate: issueData?.resolutionRate || 0,
      openIssues: issueData?.openIssues || 0,
      closedIssues: issueData?.closedIssues || 0
    },
    community: {
      totalStars: starData?.totalStars || 0,
      starsGained30Days: starData?.starsGained30Days || 0,
      starGrowthRate: parseFloat(starData?.starGrowthRate || 0)
    },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Calculate overall health score (0-100)
 * @param {Object} healthMetrics - GitHub health metrics
 * @returns {number} Health score
 */
export function calculateHealthScore(healthMetrics) {
  const {
    freshness: { commitVelocity, daysSinceLastRelease, hasReleases },
    health: { issueResolutionRate },
    community: { starGrowthRate, totalStars }
  } = healthMetrics;
  
  let score = 50; // Base score
  
  // Commit velocity: up to +20 points
  const commitScore = Math.min(commitVelocity / 30 * 20, 20);
  score += commitScore;
  
  // Issue resolution rate: up to +15 points
  score += (issueResolutionRate / 100) * 15;
  
  // Release freshness: up to +10 points
  if (hasReleases && daysSinceLastRelease !== null) {
    if (daysSinceLastRelease < 7) score += 10;
    else if (daysSinceLastRelease < 30) score += 7;
    else if (daysSinceLastRelease < 90) score += 4;
    else if (daysSinceLastRelease < 180) score += 2;
  }
  
  // Star growth: up to +5 points
  score += Math.min(starGrowthRate / 10, 5);
  
  return Math.min(Math.round(score), 100);
}

/**
 * Get health status label based on score
 * @param {number} score - Health score (0-100)
 * @returns {Object} { label, color, variant }
 */
export function getHealthStatus(score) {
  if (score >= 80) {
    return { label: 'Excellent', color: 'text-green-600', variant: 'success' };
  } else if (score >= 60) {
    return { label: 'Good', color: 'text-blue-600', variant: 'success' };
  } else if (score >= 40) {
    return { label: 'Fair', color: 'text-yellow-600', variant: 'warning' };
  } else {
    return { label: 'Needs Attention', color: 'text-red-600', variant: 'danger' };
  }
}
