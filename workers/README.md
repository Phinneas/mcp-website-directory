# GitHub Repo Stats Worker

A Cloudflare Worker that fetches and caches GitHub repository statistics (last commit age and open issue count) to help identify abandoned repositories.

## Features

- Fetches `pushedAt` (last commit timestamp) and `openIssues` count from GitHub API
- Caches results in Cloudflare KV for 6 hours
- CORS-enabled for front-end requests
- Stays within Cloudflare free tier limits (100k requests/day)
- With 6-hour cache: 10k page views = ~1,667 API calls

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create KV Namespace

```bash
wrangler kv:namespace create "GITHUB_STATS"
```

Copy the namespace ID from the output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "GITHUB_STATS"
id = "your-actual-namespace-id-here"
```

### 4. Deploy the Worker

```bash
cd workers
wrangler deploy
```

The worker will be deployed to: `https://github-repo-stats.YOUR_SUBDOMAIN.workers.dev`

## Usage

### API Endpoint

```
GET https://github-repo-stats.YOUR_SUBDOMAIN.workers.dev?repo=owner/repo
```

### Example Request

```bash
curl "https://github-repo-stats.YOUR_SUBDOMAIN.workers.dev?repo=microsoft/vscode"
```

### Example Response

```json
{
  "pushedAt": "2024-11-12T10:30:00Z",
  "openIssues": 5234,
  "stars": 158000,
  "updatedAt": "2024-11-12T15:45:00Z"
}
```

## Front-End Integration

```javascript
async function fetchRepoStats(githubUrl) {
  const match = githubUrl.match(/github\.com\/([^/]+\/[^/]+)/);
  if (!match) return null;

  const repo = match[1];
  const workerUrl = `https://github-repo-stats.YOUR_SUBDOMAIN.workers.dev?repo=${repo}`;

  try {
    const response = await fetch(workerUrl);
    const data = await response.json();

    // Calculate time ago
    const lastCommit = new Date(data.pushedAt);
    const daysAgo = Math.floor((Date.now() - lastCommit) / (1000 * 60 * 60 * 24));

    return {
      lastCommitDays: daysAgo,
      openIssues: data.openIssues,
      stars: data.stars
    };
  } catch (error) {
    console.error('Failed to fetch repo stats:', error);
    return null;
  }
}
```

## Cost Analysis (Free Tier)

- **Cloudflare Workers Free Tier**: 100,000 requests/day
- **Cache Duration**: 6 hours
- **Page Views**: 10,000/day
- **Unique Repos**: ~100
- **Cache Hit Rate**: ~95% (after initial 6 hours)
- **Estimated API Calls**: 10,000 × 100 repos / (4 × 6-hour periods) ≈ 1,667/day
- **Result**: Well within free limits! 🎉

## Rate Limiting

GitHub API allows:
- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour

To stay within unauthenticated limits with heavy traffic, consider adding a GitHub token:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_GITHUB_TOKEN',
  'User-Agent': 'MCP-Directory-Stats',
}
```

Store the token as a Worker secret:

```bash
wrangler secret put GITHUB_TOKEN
```

Then update the worker code to use `env.GITHUB_TOKEN`.

## Monitoring

Check your worker stats:

```bash
wrangler tail
```

View KV storage:

```bash
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID
```

## Troubleshooting

**Worker not accessible**: Make sure you've deployed with `wrangler deploy`

**KV errors**: Verify namespace ID in `wrangler.toml` matches your created namespace

**CORS errors**: The worker includes CORS headers; check your front-end is using the correct URL

**Rate limits**: Add GitHub token authentication for higher limits
