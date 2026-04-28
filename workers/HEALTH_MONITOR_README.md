# MCP Directory Health Monitoring System

## Overview

Weekly health monitoring for MCP servers using Cloudflare Workers with cron triggers. Tracks last commit dates, SDK versions, open issues ratio, and release cadence for all servers in the directory.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Cloudflare Worker (Cron: Weekly)               │
│  - Query D1 for all servers with github_url            │
│  - Batch fetch GitHub API stats (50 repos/batch)        │
│  - Calculate health metrics                            │
│  - Update D1 with health status                        │
│  - Update KV cache                                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              D1 Database Updates                         │
│  last_commit_date, sdk_version, open_issues_count,       │
│  health_status, health_updated_at                        │
└─────────────────────────────────────────────────────────┘
```

## Health Status Criteria

- **🟢 Active** (< 90 days since last commit) - Actively maintained with recent commits
- **🟡 Maintained** (< 180 days since last commit) - Stable maintenance with recent activity  
- **🔴 Maintenance Required** (≥ 180 days since last commit) - Requires attention, inactive for extended period

## Setup Instructions

### 1. Run Database Migration

```bash
# Run migration to add health monitoring columns
cloudflared tunnel url --local-hostname=localhost:5432 --local-http-service-url=http://localhost:5432
# Or use wrangler d1 execute
wrangler d1 execute mcp-directory --local --file=./migrations/003_add_health_monitoring.sql
```

### 2. Create KV Namespace

```bash
wrangler kv:namespace create "GITHUB_STATS"
```

Copy the namespace ID and update `workers/health-monitor-wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "GITHUB_STATS"
id = "YOUR_ACTUAL_NAMESPACE_ID_here"
```

### 3. Add GitHub Token (Optional but Recommended)

```bash
wrangler secret put GITHUB_TOKEN --name=mcp-health-monitor
# Paste your GitHub personal access token when prompted
```

Get a token from: https://github.com/settings/tokens (repo scope recommended)

### 4. Deploy Health Monitor Worker

```bash
cd workers
wrangler deploy --name=mcp-health-monitor
```

The worker will be deployed with cron trigger set to run weekly on Sundays at 2 AM UTC.

### 5. Test Manual Execution

```bash
# Test the worker manually via HTTP endpoint
wrangler tail --name=mcp-health-monitor
# In another terminal trigger the worker:
curl https://mcp-health-monitor.YOUR_SUBDOMAIN.workers.dev
```

## Cost Analysis

**Cloudflare Workers Free Tier:**
- 100,000 requests/day included
- Weekly cron trigger: ~52 executions/month
- ~600 servers processed in batches of 50
- Total requests: ~52 cron calls + ~600 batch fetches/month = **well within free limits**

**GitHub API Rate Limits:**
- Unauthenticated: 60 requests/hour
- Authenticated: 5,000 requests/hour
- Weekly batch processing: ~50 requests/week
- **No rate limit issues with authenticated requests**

## Database Schema Updates

The migration adds these columns to the `servers` table:

```sql
last_commit_date TEXT          -- ISO timestamp of last GitHub commit
open_issues_count INTEGER      -- Current open issues count
health_status TEXT             -- 'active', 'maintained', 'maintenance_required', 'unknown'
health_updated_at TEXT        -- ISO timestamp of last health check
release_cadence TEXT           -- 'frequent', 'moderate', 'occasional', 'none'
current_release_version TEXT   -- Latest semantic version
mcp_sdk_version TEXT           -- Detected MCP SDK dependency version
```

## Frontend Integration

The health status is automatically displayed on server cards using the `HealthBadge` component:

```tsx
import { HealthBadge } from '../components/HealthBadge';

<HealthBadge 
  healthStatus="active"
  lastCommitDate="2024-04-15T10:30:00Z"
  showLabel={true}
/>
```

## Monitoring

### View Worker Logs

```bash
wrangler tail --name=mcp-health-monitor
```

### Check D1 Database

```bash
# View servers by health status
wrangler d1 execute mcp-directory --command="SELECT health_status, COUNT(*) as count FROM servers GROUP BY health_status"

# View recent health checks
wrangler d1 execute mcp-directory --command="SELECT name, health_status, last_commit_date FROM servers ORDER BY health_updated_at DESC LIMIT 10"
```

### Check KV Cache

```bash
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID
wrangler kv:get --namespace-id=YOUR_NAMESPACE_ID health:owner/repo
```

## Constructive Language Policy

All health status messaging uses constructive language:
- ✅ "Active" not "Fresh"
- ✅ "Maintained" not "Stale" 
- ✅ "Maintenance Required" not "Abandoned"
- Emphasizes action and improvement opportunities rather than degradation

## Troubleshooting

**Cron trigger not firing**: Verify wrangler.toml has correct `[triggers]` configuration

**GitHub API rate limits**: Add GitHub token authentication for higher limits

**Database updates failing**: Check D1 binding configuration in wrangler.toml

**KV namespace errors**: Verify namespace ID matches your created namespace

**Health status not updating**: Check worker logs for GitHub API errors or invalid repo URLs

## Future Enhancements

- [ ] SDK version detection from package.json/requirements.txt
- [ ] Release cadence calculation from release history
- [ ] Automated maintenance notifications to maintainers
- [ ] Health trend tracking over time
- [ ] Integration with deployment readiness checks

## Contributing

To add new health metrics:
1. Update the `calculateHealthMetrics()` function in `health-monitor.js`
2. Add corresponding database columns in a new migration
3. Update the `HealthBadge` component to display new metrics
4. Update this documentation
