import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/**
 * Extract owner and repo from GitHub URL
 */
export function extractRepoInfo(githubUrl) {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, '')
  };
}

/**
 * Fetch commit velocity (commits in last 30 days)
 */
export async function fetchCommitVelocity(owner, repo, token) {
  const client = token ? new Octokit({ auth: token }) : octokit;
  const since = new Date();
  since.setDate(since.getDate() - 30);

  try {
    const { data } = await client.repos.listCommits({
      owner,
      repo,
      since: since.toISOString(),
      per_page: 100
    });
    return data.length;
  } catch (e) {
    console.error(`Failed to fetch commit velocity for ${owner}/${repo}:`, e);
    return 0;
  }
}

/**
 * Fetch issue statistics
 */
export async function fetchIssueStats(owner, repo, token) {
  const client = token ? new Octokit({ auth: token }) : octokit;

  try {
    // Get open issues
    const { data: openIssues } = await client.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: 1
    });
    
    // Get closed issues (last 30 days for better performance)
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data: closedIssues } = await client.issues.listForRepo({
      owner,
      repo,
      state: 'closed',
      since: since.toISOString(),
      per_page: 100
    });

    const openCount = openIssues.length;
    const closedCount = closedIssues.length;
    const totalCount = openCount + closedCount;
    const resolutionRate = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;

    return {
      openIssues: openCount,
      closedIssues: closedCount,
      totalIssues: totalCount,
      issueResolutionRate: resolutionRate
    };
  } catch (e) {
    console.error(`Failed to fetch issue stats for ${owner}/${repo}:`, e);
    return {
      openIssues: 0,
      closedIssues: 0,
      totalIssues: 0,
      issueResolutionRate: 0
    };
  }
}

/**
 * Fetch release freshness
 */
export async function fetchReleaseFreshness(owner, repo, token) {
  const client = token ? new Octokit({ auth: token }) : octokit;

  try {
    const { data: releases } = await client.repos.listReleases({
      owner,
      repo,
      per_page: 1
    });

    if (releases.length === 0) {
      return {
        hasReleases: false,
        daysSinceLastRelease: null,
        lastReleaseDate: null
      };
    }

    const lastRelease = releases[0];
    const lastReleaseDate = new Date(lastRelease.published_at);
    const now = new Date();
    const diffTime = Math.abs(now - lastReleaseDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return {
      hasReleases: true,
      daysSinceLastRelease: diffDays,
      lastReleaseDate: lastRelease.published_at
    };
  } catch (e) {
    console.error(`Failed to fetch release info for ${owner}/${repo}:`, e);
    return {
      hasReleases: false,
      daysSinceLastRelease: null,
      lastReleaseDate: null
    };
  }
}

/**
 * Fetch star velocity
 */
export async function fetchStarVelocity(owner, repo, token) {
  const client = token ? new Octokit({ auth: token }) : octokit;

  try {
    // Get repo info for total stars
    const { data: repoData } = await client.repos.get({ owner, repo });
    const totalStars = repoData.stargazers_count;

    // Get stargazers from last 30 days (approximation)
    const since = new Date();
    since.setDate(since.getDate() - 30);
    
    // Note: GitHub API doesn't allow filtering stargazers by date,
    // so we approximate based on recent activity
    const { data: recentStargazers } = await client.activity.listStargazersForRepo({
      owner,
      repo,
      per_page: 100
    });

    // Rough approximation: count recent stargazers (this is not perfect but gives an idea)
    const recentCount = recentStargazers.length;
    const growthRate = totalStars > 0 ? Math.round((recentCount / totalStars) * 1000) / 10 : 0;

    return {
      totalStars,
      starsGained30Days: recentCount,
      starGrowthRate: growthRate
    };
  } catch (e) {
    console.error(`Failed to fetch star data for ${owner}/${repo}:`, e);
    return {
      totalStars: 0,
      starsGained30Days: 0,
      starGrowthRate: 0
    };
  }
}

/**
 * Fetch all GitHub health vitals
 */
export async function fetchGitHubHealthVitals(githubUrl, token) {
  try {
    const { owner, repo } = extractRepoInfo(githubUrl);
    
    // Fetch all metrics in parallel
    const [commitVelocity, issueStats, releaseFreshness, starVelocity, repoData] = await Promise.all([
      fetchCommitVelocity(owner, repo, token),
      fetchIssueStats(owner, repo, token),
      fetchReleaseFreshness(owner, repo, token),
      fetchStarVelocity(owner, repo, token),
      token ? new Octokit({ auth: token }).repos.get({ owner, repo }) : octokit.repos.get({ owner, repo })
    ]);

    const metrics = {
      repoInfo: { owner, repo },
      freshness: {
        commitVelocity,
        ...releaseFreshness
      },
      health: issueStats,
      community: starVelocity,
      lastUpdated: new Date().toISOString()
    };

    return metrics;
  } catch (e) {
    console.error(`Failed to fetch health vitals for ${githubUrl}:`, e);
    return { error: e.message };
  }
}

/**
 * Calculate overall health score (0-100)
 * Based on documentation: base 50 + commit velocity (0-20) + issue resolution (0-15) + 
 * release freshness (0-10) + star growth (0-5)
 */
export function calculateHealthScore(metrics) {
  if (!metrics || metrics.error) return 0;

  let score = 50; // Base score

  // Commit velocity (0-20 points)
  const commitVelocity = metrics.freshness?.commitVelocity || 0;
  score += Math.min(commitVelocity / 3, 20);

  // Issue resolution rate (0-15 points)
  const resolutionRate = metrics.health?.issueResolutionRate || 0;
  score += (resolutionRate / 100) * 15;

  // Release freshness (0-10 points)
  if (metrics.freshness?.hasReleases) {
    const daysSinceRelease = metrics.freshness.daysSinceLastRelease || 0;
    if (daysSinceRelease <= 30) score += 10;
    else if (daysSinceRelease <= 90) score += 5;
    else if (daysSinceRelease <= 180) score += 2;
  }

  // Star growth (0-5 points)
  const growthRate = metrics.community?.starGrowthRate || 0;
  score += Math.min(growthRate / 2, 5);

  return Math.round(score);
}

/**
 * Get health status based on score
 */
export function getHealthStatus(score) {
  if (score >= 80) {
    return { label: 'Excellent', color: 'text-green-600', variant: 'success' };
  } else if (score >= 60) {
    return { label: 'Good', color: 'text-blue-600', variant: 'info' };
  } else if (score >= 40) {
    return { label: 'Fair', color: 'text-yellow-600', variant: 'warning' };
  } else {
    return { label: 'Needs Attention', color: 'text-red-600', variant: 'error' };
  }
}

/**
 * Legacy function - kept for backwards compatibility
 */
export async function getGitHubHealthMetrics(githubUrl) {
  return fetchGitHubHealthVitals(githubUrl, process.env.GITHUB_TOKEN);
}
