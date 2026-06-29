# Cloudflare Workers — MCP Directory

Scheduled Workers that maintain server metadata in the D1 database.

## ⭐ Consolidated pipeline: `composite-trust-monitor` (canonical)

**One worker, one cron, one combined record.** Runs the four per-server rechecks
that used to be four separate same-shape workers — staleness, green-hosting,
security-scan, and tool-description diff (rug-pull / tool-poisoning) — in a
single pass per server and writes **one** `composite_trust_json` record plus the
**Composite Trust Score**.

| Check | Signal | Source |
|-------|--------|--------|
| **Staleness** | commit recency + 90-day volume + archived | GitHub REST API |
| **Green** | renewable-energy hosting | Green Web Foundation Greencheck |
| **Security** | install-script static analysis + dependency/typosquat + CVE watchlist | npm registry + Socket.dev + `cve_watchlist` |
| **Tool-diff** | advertised tool set vs prior snapshot → tool-poisoning | repo README diff |

The pure, unit-tested scoring lives in **[`lib/composite-checks.js`](./lib/composite-checks.js)**
(`scoreStaleness`, `scoreGreen`, `scoreSecurity`, `checkToolDiff`,
`computeCompositeTrust`). Run the tests:

```bash
node workers/lib/composite-checks.test.mjs
```

**Weights:** security 0.35 · staleness 0.25 · tool-diff 0.20 · green 0.20. A
hard-fail in security or a tool-poisoning detection caps the composite so a bad
signal can't hide behind good maintenance.

```bash
wrangler deploy -c composite-trust-wrangler.toml
# Single cron: Tuesday 02:00 UTC
```

## Superseded workers (keep deployed crons OFF)

These were the four independent pipelines the consolidated monitor replaces.
Their code remains as reference, but **disable their cron triggers** on the next
deploy — the composite monitor back-fills their columns (`green_score_json`,
`badge_tier`, `scan_summary_json`) so existing badges keep working.

| Worker | Old cron | Now superseded by |
|--------|----------|-------------------|
| `health-monitor` | Sun 2 AM | staleness check in composite monitor |
| `green-score-monitor` | Mon 3 AM | green check in composite monitor |
| `reliability-monitor` | Mon 4 AM | staleness/maintenance check in composite monitor |
| `security-scanner` | daily 3 AM | security check in composite monitor |

> The consolidation exists because four recurring per-server rechecks of
> identical shape are wasteful to build and maintain separately, and could never
> produce a single Composite Trust Score. One pipeline gives that score one clean
> data source.

## Other workers (unrelated to the recheck cadence)

| Worker | Purpose |
|--------|---------|
| `github-repo-stats` | On-demand cached GitHub repo stats for the front-end |
| `install-aggregator` | Aggregates CLI install events |
| `playground` | In-browser MCP playground backend |

## Shared D1 database

All workers bind to the same D1 database:
- **Name:** `mcp-directory` · **ID:** `527bf637-7aba-4719-8d39-b9e6e614a3b9` · **Binding:** `DB`

## Secrets

```bash
wrangler secret put GITHUB_TOKEN -c composite-trust-wrangler.toml        # higher GitHub rate limits
wrangler secret put SOCKET_DEV_API_KEY -c composite-trust-wrangler.toml # dependency/typosquat layer
```
