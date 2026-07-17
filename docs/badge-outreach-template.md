# Badge Outreach — Maintainer Email Template

## Target List
Top 25 verified servers by composite trust score + stars. Query to generate:

```sql
SELECT id, name, author, github_url, stars, composite_trust_json
FROM servers
WHERE badge_tier IN ('scanned', 'manually_reviewed')
  OR composite_trust_json IS NOT NULL
ORDER BY stars DESC
LIMIT 25;
```

Run this against D1, then extract GitHub author emails from repo profiles (or use the GitHub API to find maintainers).

---

## Email Subject Lines (A/B test)

**A:** `Your MCP server is verified — here's a badge for your README`
**B:** `Free trust signal for your MCP server (auto-updates)`

---

## Email Body (Template)

```
Hi {maintainer_name},

Your MCP server {server_name} is listed and verified on My MCP Shelf
(https://www.mymcpshelf.com), the largest deployment-ready MCP directory.

We've just launched embeddable verification badges that reflect your
server's live security and staleness status — automatically updated
whenever our weekly recheck pipeline runs.

Why add it:
• Users instantly see your server is actively maintained and security-scanned
• Every badge is a live backlink from your GitHub repo to your listing
• If your score drops (e.g., stale dependencies), the badge updates —
  giving you a signal to fix it before users notice

Copy-paste this into your README:

[![Verified on My MCP Shelf](https://www.mymcpshelf.com/api/v1/badge/{server_slug}.svg)](https://www.mymcpshelf.com/server/{server_slug})

Preview: {badge_image_url}

Your current status: {badge_state} ({composite_score}/100)

Questions? Just reply.

— The My MCP Shelf team
https://www.mymcpshelf.com
```

---

## Outreach Tracking Sheet

| Server | Maintainer | Email | Sent | Replied | Badge Added | Notes |
|--------|-----------|-------|------|---------|-------------|-------|

---

## Follow-Up Sequence

**Day 0:** Initial email
**Day 7:** Short follow-up with badge preview image attached
**Day 14:** Final nudge — mention competitor badges (skills.sh, mcp.so) if relevant

---

## Adoption Metric

Track via `badge_views` table (sampled 1:10):

```sql
SELECT server_slug, COUNT(*) as impressions
FROM badge_views
WHERE viewed_at > datetime('now', '-30 days')
GROUP BY server_slug
ORDER BY impressions DESC;
```

Goal: 10+ maintainers displaying the badge within 30 days of launch.
