import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/**
 * Fetches real GitHub health metrics for a repo
 */
export async function getGitHubHealthMetrics(githubUrl) {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const [_, owner, repo] = match;

  try {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const { data: issues } = await octokit.issues.listForRepo({ 
      owner, repo, state: 'open', per_page: 1 
    });
    
    // We get total open issues from the headers or by another call
    // Simplified for now
    return {
      lastCommitDate: repoData.pushed_at,
      openIssuesCount: repoData.open_issues_count,
      // SDK version usually requires parsing package.json or looking at tags
      sdkVersion: 'latest' 
    };
  } catch (e) {
    console.error(`Failed to fetch health for ${owner}/${repo}:`, e);
    return null;
  }
}
