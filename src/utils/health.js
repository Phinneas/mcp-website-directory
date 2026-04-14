/**
 * Health monitoring utility for MCP servers
 */

export const HEALTH_THRESHOLDS = {
  ACTIVE: 90,        // Days
  MAINTAINED: 180    // Days
};

export function calculateHealthStatus(lastCommitDate) {
  if (!lastCommitDate) return { label: 'Unknown', color: 'gray' };

  const lastCommit = new Date(lastCommitDate);
  const now = new Date();
  const diffTime = Math.abs(now - lastCommit);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= HEALTH_THRESHOLDS.ACTIVE) {
    return { label: 'Active', color: 'green' };
  } else if (diffDays <= HEALTH_THRESHOLDS.MAINTAINED) {
    return { label: 'Maintained', color: 'yellow' };
  } else {
    return { label: 'Maintenance Required', color: 'red' };
  }
}

/**
 * Mock function for GitHub API interaction.
 * In a real scenario, this would call the GitHub API.
 */
export async function getRepoHealth(owner, repo, token) {
  // Placeholder for actual GitHub API logic
  // Returns: { lastCommitDate, sdkVersion, openIssuesCount }
  return {
    lastCommitDate: new Date().toISOString(),
    sdkVersion: '1.0.0',
    openIssuesCount: 0
  };
}
