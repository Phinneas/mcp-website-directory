# Cloudflare Workers — MCP Directory

This directory contains scheduled Workers that maintain server metadata in the D1 database.

## Workers

| Worker | Cron | Purpose |
|--------|------|---------|
| `health-monitor` | Sun 2 AM UTC | Last commit, open issues, release cadence |
| `green-score-monitor` | Mon 3 AM UTC | Green Web Foundation hosting verification |
| `reliability-monitor` | Mon 4 AM UTC | Composite reliability score (stars, issues, forks, downloads, commits) |
| `github-repo-stats` | On-demand | Cached GitHub repo stats for front-end |

## Shared D1 Database

All workers bind to the same D1 database:
- **Name:** `mcp-directory`
- **ID:** `527bf637-7aba-4719-8d39-b9e6e614a3b9`
- **Binding:** `DB`

## Deploying

```bash
cd workers
wrangler deploy -c <worker>-wrangler.toml
```

Example:
```bash
wrangler deploy -c reliability-wrangler.toml
```

## Secrets

Set GitHub tokens for higher API rate limits:
```bash
wrangler secret put GITHUB_TOKEN -c reliability-wrangler.toml
```

## Reliability Monitor Details

**Scoring model (0–100):**
- Stars trajectory — 30 pts (star count + recent commit activity)
- Issue response time — 25 pts (median days to close)
- Fork activity — 20 pts (total + recent forks)
- Download trend — 15 pts (npm weekly downloads + growth)
- Commit frequency — 10 pts (commits per week, 90-day window)

**Tiers:**
- Excellent (80–100), Strong (60–79), Moderate (40–59), Limited (20–39), Minimal (0–19)

**Endpoints:**
- `GET /report` — Generate Top 10 monthly report (JSON)
- Default (no path) — Run full assessment

**Data source:** GitHub REST API + npm downloads API. No user-submitted data.
