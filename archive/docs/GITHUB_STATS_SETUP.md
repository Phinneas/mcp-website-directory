# GitHub Stats Feature - Complete Setup Guide

This guide walks you through implementing the "live last commit age & open issues count" feature for your MCP directory.

## 🎯 What This Feature Does

Displays real-time GitHub repository statistics on each server/client card:
- **Last commit age** (e.g., "3d ago", "2mo ago") with color coding:
  - 🟢 Green: Active (< 30 days)
  - 🟡 Yellow: Stale (30-90 days)
  - 🔴 Red: Abandoned (> 90 days)
- **Open issues count** (e.g., "23 issues")
  - Highlighted if > 50 issues

**Value**: Helps users quickly identify abandoned repos without clicking through to GitHub.

## 📁 Files Created

```
workers/
├── github-repo-stats.js       # Cloudflare Worker script
├── wrangler.toml              # Worker configuration
└── README.md                  # Worker documentation

GITHUB_STATS_SETUP.md          # This file
```

## 🚀 Step-by-Step Deployment

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

### Step 3: Create KV Namespace for Caching

```bash
cd workers
wrangler kv:namespace create "GITHUB_STATS"
```

**Expected output:**
```
🌀 Creating namespace with title "github-repo-stats-GITHUB_STATS"
✨ Success!
Add the following to your wrangler.toml:
{ binding = "GITHUB_STATS", id = "abc123def456..." }
```

Copy the `id` value from the output.

### Step 4: Update wrangler.toml

Open `workers/wrangler.toml` and replace `YOUR_KV_NAMESPACE_ID` with the actual ID:

```toml
[[kv_namespaces]]
binding = "GITHUB_STATS"
id = "abc123def456..."  # Your actual namespace ID
```

### Step 5: Deploy the Worker

```bash
wrangler deploy
```

**Expected output:**
```
⛅️ wrangler 3.x.x
Total Upload: 2.15 KiB / gzip: 0.85 KiB
Uploaded github-repo-stats (1.23 sec)
Published github-repo-stats (0.21 sec)
  https://github-repo-stats.YOUR_SUBDOMAIN.workers.dev
```

Copy your Worker URL! You'll need it for the next step.

### Step 6: Update Front-End with Worker URL

Open both files and replace `YOUR_WORKER_URL` with your actual Worker URL:

1. **src/pages/index.astro** (line ~7725):
```javascript
const workerUrl = `https://github-repo-stats.YOUR_SUBDOMAIN.workers.dev?repo=${encodeURIComponent(repo)}`;
```

Replace with:
```javascript
const workerUrl = `https://github-repo-stats.YOUR_ACTUAL_SUBDOMAIN.workers.dev?repo=${encodeURIComponent(repo)}`;
```

2. **src/pages/mcp-clients.astro** (line ~412):
```javascript
const workerUrl = `https://github-repo-stats.YOUR_SUBDOMAIN.workers.dev?repo=${encodeURIComponent(repo)}`;
```

Replace with:
```javascript
const workerUrl = `https://github-repo-stats.YOUR_ACTUAL_SUBDOMAIN.workers.dev?repo=${encodeURIComponent(repo)}`;
```

### Step 7: Test the Worker

Test your worker manually:

```bash
curl "https://github-repo-stats.YOUR_SUBDOMAIN.workers.dev?repo=microsoft/vscode"
```

**Expected response:**
```json
{
  "pushedAt": "2024-11-12T10:30:00Z",
  "openIssues": 5234,
  "stars": 158000,
  "updatedAt": "2024-11-12T15:45:00Z"
}
```

### Step 8: Build and Deploy Your Site

```bash
npm run build
git add .
git commit -m "feat: add live GitHub repo stats with Cloudflare Worker"
git push origin master
```

Your site will automatically rebuild and deploy with the new feature!

## 🎨 What It Looks Like

Each repo card will now display:

```
┌─────────────────────────────────────┐
│ MCP Server Name                      │
│ Description of the server...         │
│ ┌──────┐ ┌──────────┐ ┌──────────┐ │
│ │ TypeScript │ │ Official │ │ ⭐ 1.2k │ │
│ └──────┘ └──────────┘ └──────────┘ │
│ 📅 3d ago     🐛 23 issues          │  ← NEW!
│ [View on GitHub]                    │
└─────────────────────────────────────┘
```

## 🔧 Configuration Options

### Increase GitHub API Rate Limits

By default, the worker uses unauthenticated requests (60/hour limit).

To increase to 5,000 requests/hour:

1. Create a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - No scopes needed for public repo data
   - Copy the token

2. Add token as Worker secret:
```bash
wrangler secret put GITHUB_TOKEN
# Paste your token when prompted
```

3. Update `workers/github-repo-stats.js` line 41:
```javascript
const githubResponse = await fetch(githubUrl, {
  headers: {
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,  // Add this line
    'User-Agent': 'MCP-Directory-Stats',
    'Accept': 'application/vnd.github.v3+json',
  },
});
```

4. Redeploy:
```bash
wrangler deploy
```

### Adjust Cache Duration

Default: 6 hours (21600 seconds)

To change to 12 hours, update line 62 in `workers/github-repo-stats.js`:

```javascript
await env.GITHUB_STATS.put(cacheKey, JSON.stringify(result), {
  expirationTtl: 43200,  // 12 hours in seconds
});
```

Redeploy after changes.

### Adjust Freshness Thresholds

Update color-coding thresholds in both `index.astro` and `mcp-clients.astro`:

```javascript
// Current thresholds
if (daysAgo < 30) {
    freshnessClass = 'repo-stat-fresh';      // Green
} else if (daysAgo < 90) {
    freshnessClass = 'repo-stat-stale';      // Yellow
} else {
    freshnessClass = 'repo-stat-abandoned';  // Red
}
```

Customize as needed.

## 📊 Cost Analysis

### Cloudflare Workers Free Tier
- **100,000 requests/day** (free)
- **Unlimited KV reads** (free on workers)
- **1,000 KV writes/day** (free)

### Example Usage
- **Page views**: 10,000/day
- **Unique repos**: 600
- **Cache duration**: 6 hours (4 cycles/day)
- **Cache hits**: ~95% after first 6 hours

**API calls needed:**
- First 6 hours: 600 repos × 10,000 views / 10,000 = 600 requests
- After cache: 10,000 views × 5% = 500 requests/6 hours
- Daily: 600 + (500 × 3) = 2,100 requests

**Result**: Well within free tier limits! 🎉

### GitHub API Limits
- **Unauthenticated**: 60 requests/hour
- **With token**: 5,000 requests/hour

With caching, you'll average ~87 requests/hour, well within authenticated limits.

## 🐛 Troubleshooting

### Worker not accessible
```bash
# Check deployment status
wrangler deployments list

# View real-time logs
wrangler tail
```

### CORS errors in browser console
Verify worker includes CORS headers (already included in the provided code):
```javascript
'Access-Control-Allow-Origin': '*',
```

### Empty stats appearing
Check browser console for errors. Common issues:
- Wrong Worker URL in front-end code
- KV namespace not bound correctly
- GitHub API rate limiting

### Rate limiting
If you hit GitHub's rate limit:
1. Add GitHub token (see Configuration Options above)
2. Increase cache duration
3. Reduce request frequency

### KV storage errors
```bash
# List stored keys
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Check a specific cached value
wrangler kv:key get "repo:microsoft/vscode" --namespace-id=YOUR_NAMESPACE_ID
```

## 🎓 How It Works

```
┌─────────┐      ┌──────────────┐      ┌──────────┐      ┌─────────────┐
│ Browser │─────>│ Your Website │─────>│ CF Worker│─────>│ GitHub API  │
│         │      │              │      │  (Cache) │      │             │
└─────────┘      └──────────────┘      └──────────┘      └─────────────┘
    ↑                                         │
    │                                         ↓
    │                                    ┌─────────┐
    └────────────────────────────────────│   KV    │
                                         │ Storage │
                                         └─────────┘
```

1. User visits page
2. JavaScript fetches from Cloudflare Worker
3. Worker checks KV cache
   - **Cache hit**: Return cached data instantly
   - **Cache miss**: Fetch from GitHub API, cache for 6 hours
4. Display stats with color-coded freshness

## 📝 Next Steps

1. ✅ Deploy Worker to Cloudflare
2. ✅ Update front-end with Worker URL
3. ✅ Test functionality
4. 🔄 Monitor usage via Cloudflare dashboard
5. 🔄 Add GitHub token for higher rate limits (optional)
6. 🔄 Adjust cache duration based on traffic patterns

## 🙋 Support

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **GitHub API Docs**: https://docs.github.com/en/rest
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/

---

**Implementation completed** ✨

All code is ready to deploy. Just follow the steps above!
