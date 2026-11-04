---
title: "MCP Monthly — October 2026"
description: "The first MCP Monthly: a month-close snapshot of the directory — 7,240 servers indexed, the verification pipeline coming online, the category mix, directory leaders by stars, and October's security coverage."
date: "2026-11-03"
author: "Chester Beard"
tags: ["monthly-report", "mcp-servers", "ecosystem"]
---

Welcome to the first **MCP Monthly** — a month-close snapshot of the Model Context Protocol ecosystem, built from the directory's own data: the server index, the new-server discovery pipeline, and the monthly intelligence report. This issue covers **October 2026**.

## By the numbers

| Metric | Count |
|---|---|
| Servers indexed | 7,240 |
| Local / stdio | 6,142 |
| Cloud-native | 540 |
| Enterprise SaaS | 451 |
| Self-hosted | 107 |

Roughly 85% of the index runs as local / stdio servers — the long tail of single-purpose tools that make up the day-to-day MCP experience — while about 7.5% is cloud-native and another 6% enterprise SaaS.

## The category mix

| Category | Servers | Share |
|---|---|---|
| Development | 2,597 | 35.9% |
| AI / ML | 2,177 | 30.1% |
| Databases | 848 | 11.7% |
| Cloud | 530 | 7.3% |
| Productivity | 407 | 5.6% |
| Communication | 287 | 4.0% |
| Search | 152 | 2.1% |
| Finance | 69 | 1.0% |
| Aggregators | 44 | 0.6% |
| File systems | 42 | 0.6% |
| Other | 87 | 1.2% |

Two thirds of the ecosystem sits in just two categories — development and AI/ML tooling. Databases remain the clear third pillar, and everything else is a long tail. If you are building an MCP server today, that tail (finance, search, file systems) is where the open ground is.

## Directory leaders — top 10 by stars

| # | Server | Category | Stars |
|---|---|---|---|
| 1 | [Scrapling](/server/scrapling) | Cloud | 73,748 |
| 2 | [Chrome DevTools](/server/chrome-devtools) | Development | 49,239 |
| 3 | [MindsDB](/server/mindsdb) | Databases | 38,651 |
| 4 | [Search (UI-TARS)](/server/search-ui-tars) | AI / ML | 38,574 |
| 5 | [Playwright Browser Automation](/server/playwright-browser-automation) | Productivity | 28,403 |
| 6 | [Task Master](/server/task-master) | Development | 25,820 |
| 7 | [Activepieces](/server/activepieces) | Productivity | 23,614 |
| 8 | [n8n](/server/n8n) | Databases | 22,479 |
| 9 | [Mastra Docs](/server/mastra-docs) | Development | 21,792 |
| 10 | [CUA MCP Server](/server/cua-mcp-server) | AI / ML | 21,084 |

Browser automation and agent-adjacent tooling dominate the top of the table — Scrapling, Chrome DevTools, and Playwright between them cover most of the "let the model drive a browser" demand.

## From the pipeline: verification goes live

Just after October closed, in the first days of November, the directory's verification pipeline finished its first full sweep. Every one of the 7,240 indexed servers now carries a Composite Trust record — a combined assessment of repository staleness, green hosting, security layers (static analysis, dependency health, CVE watchlist), tool-description drift, remote reachability, and an execution check.

- **7,228** servers now hold the **scanned** badge
- **12** hold the higher **manually reviewed** tier
- The pipeline rescans the whole index daily in cursor batches, so badges stay current

Click any badge on a server page to see the underlying signals.

## October on the blog

October was a heavy security month on [Signal Field](/newsletters/signal-field):

- **Oct 2** — [Citrix NetScaler zero-days actively exploited since September](/blog/citrix-netscaler-zero-days-actively-exploited-since-september)
- **Oct 9** — [Tensorlake npm package compromised, steals developer credentials](/blog/tensorlake-npm-package-compromised-steals-developer-credentials)
- **Oct 13** — [Linus Torvalds uses Claude Code, finds 10-year-old bugs](/blog/linus-torvalds-uses-claude-code-finds-10-year-old-bugs)
- **Oct 16** — [Palo Alto PAN-OS flaw actively exploited in wild](/blog/palo-alto-pan-os-flaw-actively-exploited-in-wild)
- **Oct 20** — [Ransomware negotiators allegedly ran ShinyHunters extortion site](/blog/ransomware-negotiators-allegedly-ran-shinyhunters-extortion-site)
- **Oct 23** — [Critical PHP flaws now affecting 70% of websites](/blog/critical-php-flaws-now-affecting-70-of-websites)
- **Oct 30** — [Palo Alto firewalls exploited via PHP2Shell vulnerabilities](/blog/palo-alto-firewalls-exploited-via-php2shell-vulnerabilities)

## New-server discovery: where things stand

The discovery pipeline — npm registry search, GitHub search, and the official MCP Registry — last completed a full run in late June, surfacing **583 candidates new to the directory**, of which **311 are SDK-verified** (they actually depend on an official MCP SDK). Those candidates are queued for review and promotion; upcoming issues of MCP Monthly will carry the promotion wave and the fresh discovery stats alongside it.

## Method & sources

- **Directory snapshot** — live index data as of publication (November 3, 2026)
- **Verification** — Composite Trust pipeline results (first full sweep completed November 3, 2026)
- **Discovery** — npm registry, GitHub, and the official MCP Registry
- **Structure** — follows the MCP Intelligence Monthly Report format

Next issue: **November 2026**, out the first week of December.
