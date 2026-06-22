# GitHub Health Vitals - Usage Guide

## Overview

Live GitHub Health Vitals displays real-time project health indicators pulled directly from the GitHub API:

### Metrics Tracked:
1. **Commit Velocity** - Number of commits in the last 30 days
2. **Issue Resolution Rate** - Percentage of closed vs. open issues
3. **Release Freshness** - Days since the last release (if any)
4. **Community Growth** - Star velocity (stars gained in 30 days vs total)
5. **Overall Health Score** - Calculated score (0-100) based on all metrics

## Is n8n Necessary?

**No, n8n is NOT necessary** for this feature. The GitHub API provides all the data we need:

- **Commit velocity**: Via `/repos/{owner}/{repo}/commits` endpoint with `since` parameter
- **Issue stats**: Via `/repos/{owner}/{repo}/issues` with state filters
- **Release info**: Via `/repos/{owner}/{repo}/releases` endpoint
- **Star data**: Via `/repos/{owner}/{repo}/stargazers` and repo metadata

n8n would add unnecessary complexity for this simple use case.

## Rate Limits

GitHub API has rate limits:
- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour

For production use, you should use a GitHub Personal Access Token.

## Getting a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" (classic)
3. Give it a descriptive name (e.g., "MCP Directory - Health Vitals")
4. Select scopes:
   - `public_repo` (for public repositories)
   - `read:org` (if you need org-level data)
5. Generate and copy the token
6. Store it in your environment variables:
   ```bash
   # .env file
   GITHUB_TOKEN=ghp_your_token_here
   ```

## Usage

### Basic Usage (React Component)

```tsx
import GitHubHealthVitals from '../components/GitHubHealthVitals';

<GitHubHealthVitals 
  githubUrl="https://github.com/modelcontextprotocol/servers"
  token={import.meta.env.GITHUB_TOKEN}
/>
```

### Astro Page Integration

```astro
---
import GitHubHealthVitals from '../components/GitHubHealthVitals';
---

<div class="github-health-section">
  <h2>GitHub Health Vitals</h2>
  <GitHubHealthVitals 
    githubUrl="https://github.com/modelcontextprotocol/servers"
    token={import.meta.env.GITHUB_TOKEN}
  />
</div>
```

### Using with MCP Server Data

If you have MCP server data with `github_url` fields:

```tsx
import { fetchGitHubHealthVitals } from '../utils/githubApi';

// Fetch health metrics for a server
const metrics = await fetchGitHubHealthVitals(server.github_url);

// Calculate overall health score
const score = calculateHealthScore(metrics);
const status = getHealthStatus(score);
// status: { label: 'Excellent', color: 'text-green-600', variant: 'success' }
```

## Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `githubUrl` | string | Yes | Full GitHub repository URL |
| `token` | string | No | GitHub Personal Access Token for higher rate limits |

## API Response Structure

```typescript
{
  repoInfo: {
    owner: string;
    repo: string;
  };
  freshness: {
    commitVelocity: number;           // Commits in last 30 days
    daysSinceLastRelease: number | null;  // Days since last release
    lastReleaseDate: string | null;   // ISO date of last release
    hasReleases: boolean;
  };
  health: {
    issueResolutionRate: number;      // Percentage (0-100)
    openIssues: number;
    closedIssues: number;
  };
  community: {
    totalStars: number;
    starsGained30Days: number;
    starGrowthRate: number;          // Percentage growth
  };
}
```

## Health Score Calculation

The overall health score (0-100) is calculated as:

- **Base score**: 50 points
- **Commit velocity**: +0 to +20 points (based on commits in 30 days)
- **Issue resolution rate**: +0 to +15 points (based on % closed)
- **Release freshness**: +0 to +10 points (more recent = higher)
- **Star growth**: +0 to +5 points (based on 30-day growth rate)

### Score Categories:
- **80-100**: Excellent (green)
- **60-79**: Good (blue)
- **40-59**: Fair (yellow)
- **0-39**: Needs Attention (red)

## API Utility Functions

```javascript
// Extract owner/repo from URL
const { owner, repo } = extractRepoInfo('https://github.com/owner/repo');

// Fetch individual metrics
const commitVelocity = await fetchCommitVelocity(owner, repo, token);
const issueStats = await fetchIssueStats(owner, repo, token);
const releaseFreshness = await fetchReleaseFreshness(owner, repo, token);
const starVelocity = await fetchStarVelocity(owner, repo, token);

// Or fetch all at once
const healthMetrics = await fetchGitHubHealthVitals(githubUrl, token);

// Calculate score and status
const score = calculateHealthScore(healthMetrics);
const status = getHealthStatus(score);
```

## Error Handling

The component handles:
- Invalid GitHub URLs
- API rate limits
- Network errors
- Missing data
- Loading states

Errors are displayed clearly in the UI with helpful messages.

## Styling

The component uses Tailwind CSS classes that match the existing project theme:
- Blue gradient backgrounds for main score
- Progress bars for visual metrics
- Color-coded indicators for health status
- Responsive design for mobile/desktop

## Files Created

1. `/src/utils/githubApi.js` - All GitHub API functions
2. `/src/components/GitHubHealthVitals.tsx` - React component display

## Testing

To test without a token, the component will use the unauthenticated rate limit (60 req/hr). For development, you can:

```bash
# Set a test token
export GITHUB_TOKEN=ghp_xxx

# Run dev server
npm run dev
```

## Performance Considerations

- Metrics are cached per component instance
- All API calls are made in parallel for efficiency
- Rate limits are respected automatically
- Loading states prevent UI freezing
- Error boundaries catch network failures

## Future Enhancements (Optional)

- Add Redis caching for repeated requests
- Show trend indicators (better/worse than last check)
- Add alerts for dropping health scores
- Integrate with GitHub webhooks for real-time updates
- Add historical charts for metric trends

## Example Integration with MCP ServersPage

```astro
---
import GitHubHealthVitals from './GitHubHealthVitals';

const servers = [
  {
    id: 'github-mcp',
    fields: {
      name: 'GitHub MCP Server',
      github_url: 'https://github.com/modelcontextprotocol/servers'
    }
    // ... other fields
  }
];
---

<div class="grid gap-6">
  {servers.map(server => (
    <div class="server-card">
      <h3>{server.fields.name}</h3>
      <GitHubHealthVitals 
        githubUrl={server.fields.github_url}
        token={import.meta.env.GITHUB_TOKEN}
      />
    </div>
  ))}
</div>
```
