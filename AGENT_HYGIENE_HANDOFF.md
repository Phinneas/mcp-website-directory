# Agent Hygiene Score — Implementation Handoff

## Status: Build Verified, Source Citations Added ✅

**Latest Commit:** `ea622ca` on `main`
**Date:** August 12, 2026
**Build:** `astro build` passes clean (7.75s, 0 errors)
**Deploy:** Not yet deployed. Cloudflare adapter doesn't support local preview.

---

## What Was Built

A second, independent badge for MCP server detail pages that answers "is it safe to hand this server to an autonomous AI agent?" — separate from the existing Security Audit (0-100) which answers "is this server secure to deploy?"

5 dimensions scored 0-2 each, summed to a total out of 10:

| Dimension | What It Measures |
|-----------|-----------------|
| Schema Strictness 📋 | Typed inputs, enums, required fields declared |
| Least-Privilege Scoping 🔑 | Per-tool auth scopes vs one blanket API key |
| Declared Boundaries 🚧 | Security policy, rate limits, "won't do" statement |
| Auditability 🔍 | Logs tool calls or supports idempotency keys |
| Maintenance Signal 🛠️ | Active development (reuses existing verification data) |

**Tiers:** Excellent (8-10, green) → Good (6-7, blue) → Fair (4-5, yellow) → Poor (0-3, red)

---

## Files Created/Modified

### New Files (3)

| File | Lines | Purpose |
|------|-------|---------|
| `src/data/agentHygieneScores.ts` | ~450 | Score data for 14 servers, dimension definitions, tier function, alias resolution, sourceUrl citations |
| `src/components/AgentHygieneBadge.tsx` | ~230 | React badge component (expandable card with per-dim breakdown + source link) |
| `src/pages/agent-hygiene.astro` | ~550 | Rubric explanation page at `/agent-hygiene` with per-server source links in leaderboard |

### Modified Files (1)

| File | Change | Lines Added |
|------|--------|-------------|
| `src/pages/server/[slug].astro` | Import badge + data, add section after Composite Trust, add CSS | ~50 |

---

## 14 Scored Servers (with sourceUrl citations)

All scores sourced from live README fetches on 2026-08-12. Each server has a `sourceUrl` field pointing to the GitHub repo used for scoring.

| # | Server | Score | Tier | Source URL |
|---|--------|-------|------|------------|
| 1 | Google GenAI Toolbox | 10/10 | 🟢 Excellent | https://github.com/googleapis/genai-toolbox |
| 2 | GitHub Official MCP | 9/10 | 🟢 Excellent | https://github.com/github/github-mcp-server |
| 3 | Microsoft Playwright MCP | 9/10 | 🟢 Excellent | https://github.com/microsoft/playwright-mcp |
| 4 | AWS MCP (Official) | 9/10 | 🟢 Excellent | https://github.com/awslabs/mcp |
| 5 | FastMCP | 7/10 | 🔵 Good | https://github.com/jlowin/fastmcp |
| 6 | Serena MCP | 7/10 | 🔵 Good | https://github.com/oramasearch/serena |
| 7 | Upstash Context7 | 6/10 | 🔵 Good | https://github.com/upstash/context7 |
| 8 | Activepieces MCP | 5/10 | 🟡 Fair | https://github.com/activepieces/activepieces |
| 9 | Mastra Docs | 5/10 | 🟡 Fair | https://github.com/mastra-ai/mastra |
| 10 | Figma Context MCP | 5/10 | 🟡 Fair | https://github.com/1yhy/figma-context-mcp |
| 11 | 1Panel | 5/10 | 🟡 Fair | https://github.com/1panel-dev/mcp-1panel |
| 12 | Playwright (Community) | 4/10 | 🟡 Fair | https://github.com/dennisgl/mcp-playwright-scraper |
| 13 | Ghidra MCP | 4/10 | 🟡 Fair | https://github.com/athukarad109/ghidra-mcp |
| 14 | Zen MCP Server (PAL) | 3/10 | 🔴 Poor | https://github.com/beehiveinnovations/pal-mcp-server |

---

## Score Changes After sourceUrl Re-fetch (2026-08-12)

During the sourceUrl backfill, all 14 READMEs were re-fetched live and scores were re-verified against current content. Three adjustments were made:

| Server | Dimension | Old | New | Reason |
|--------|-----------|-----|-----|--------|
| Upstash Context7 | Boundaries | 1 | 2 | `SECURITY.md` file exists in repo (missed in initial assessment) |
| Playwright (Community) | Maintenance | 2 | 1 | Repo is a small community project (~hundreds of stars), not the large 28k-star Playwright project |
| Zen MCP Server | Notes updated | — | — | Scoping note: delegates to external AI model providers via API keys; Auditability note: `LOG_LEVEL` env var exists but no structured audit trail |

All other 11 servers had their scores **confirmed unchanged** after README re-fetch.

---

## Source Citation Implementation

### Data Layer (`agentHygieneScores.ts`)
- Added `sourceUrl: string` to the `AgentHygieneScore` interface
- Added `sourceUrl` parameter to the `makeScore` helper function
- All 14 entries now pass their GitHub repo URL as the last positional arg before `notes`

### Badge Component (`AgentHygieneBadge.tsx`)
- Expanded badge footer now shows: `"Assessed YYYY-MM-DD from public README, schema, and GitHub data. View rubric → · Source ↗"`
- "Source ↗" links to `score.sourceUrl` (external GitHub link, opens in new tab)

### Rubric Page (`agent-hygiene.astro`)
- Leaderboard rows now include a "Source ↗" link per server
- Links styled in the site's amber accent color (`#b45309`)

---

## Server ID Alias Resolution

The site has two data sources (D1 database + static `servers.json`) with different ID formats. The hygiene module resolves both via `HYGIENE_ID_ALIASES` (same pattern as `src/data/securityAudit.ts`).

**D1 aliases:** `github` → `github-official-mcp-new`, `playwright` → `playwright-browser-automation`, `context7` → `upstash-context7`, `aws-mcp` → `awslabs-mcp-official`, etc.

**Static JSON aliases:** `secure-github-ops` → `github-official-mcp-new`, `aws-cli` → `awslabs-mcp-official`, `ghidra-bridge` → `ghidra-mcp`, `toolbox` → `googleapis-genai-toolbox`, `zenmoney` → `zen-mcp-server`, etc.

23 distinct input IDs resolve to **17** unique alias targets (not 13 — the previous doc had a counting error). 14 of those targets are scored servers. 3 alias targets (`mindsdb-mcp`, `mcp-chrome-hangwin`, `whatsapp-mcp`, `git-mcp-idosal`) exist in the alias map but have no score data (they're inherited from the security audit alias pattern; no score was assigned for those servers). 1 scored server (`mastra-docs`) has no alias — it's D1-only and accessed by its canonical key directly.

---

## Validation Results

### Build
```
npx astro build → Complete in 7.75s, 0 errors
npx tsc --noEmit → Exit 0 (both data module and component; pre-existing errors in workers/security-scanner.js only)
```

### SourceUrl Verification
| Check | Result |
|-------|--------|
| 14 sourceUrl fields present | ✅ (14 `https://github.com/` URLs in data file) |
| All URLs are valid GitHub repos | ✅ (all fetched live during re-verification) |
| sourceUrl used in badge component | ✅ (Source ↗ link) |
| sourceUrl used in rubric leaderboard | ✅ (per-server link) |

### Runtime Validation (9-point suite via `tsx`)
| Check | Result |
|-------|--------|
| 14 servers present | ✅ |
| Score sums correct | ✅ |
| All scores in 0-2 range | ✅ |
| D1 alias resolution | ✅ |
| Static JSON alias resolution | ✅ |
| Unknown IDs return undefined | ✅ |
| Tier classification correct | ✅ |
| 5 dimensions defined | ✅ |
| Leaderboard sort verified | ✅ |

### Edge Cases
| Input | Result |
|-------|--------|
| `undefined` | Returns `undefined` (no crash) |
| Empty string `""` | Returns `undefined` |
| `null` | Returns `undefined` |

### Component Contract
- Tier colors are valid CSS hex (`#22c55e`, `#3b82f6`, `#eab308`, `#ef4444`)
- Score dot values all in `[0, 1, 2]`
- Note keys match valid dimension keys only
- `assessedAt` format is `YYYY-MM-DD` for all entries
- All 5 dimension keys present in every server's scores
- `sourceUrl` format is `https://github.com/{org}/{repo}` for all entries

### Build Artifacts
```
dist/_worker.js/pages/agent-hygiene.astro.mjs → 15,583 bytes (8 hygiene references)
dist/_astro/agent-hygiene.*.css → 3 CSS chunks generated
```

---

## How to Verify in Production

### 1. Deploy
```bash
npx astro build && npx wrangler pages deploy dist
```

### 2. Check the rubric page
Visit `https://www.mymcpshelf.com/agent-hygiene`
- Hero section with "5 Dimensions, 0-10 Score, 14 Servers Scored"
- 4 tier cards (Excellent/Good/Fair/Poor)
- 5 dimension breakdowns with 0/1/2 level descriptions
- Leaderboard of all 14 servers sorted by score, each with a "Source ↗" link to the GitHub repo
- Comparison table: Security Audit vs Agent Hygiene

### 3. Check a server detail page
Visit `https://www.mymcpshelf.com/server/github` (or any scored server)
- Look for "Agent Hygiene Score" section between Composite Trust and Playground
- Click the header to expand dimension breakdown (dots + per-dim notes)
- "View rubric →" link goes to `/agent-hygiene`
- "Source ↗" link goes to the server's GitHub repo

### 4. Check an unscored server
Visit any server not in the 14 (e.g. `/server/polymarket`)
- No "Agent Hygiene Score" section should appear

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Separate file from `securityAudit.ts` | Hygiene is a different signal for a different audience. Keeping it independent means no coupling risk. |
| Same alias pattern as security audit | D1 IDs are stable and shared across the codebase. Mirrors existing proven approach. |
| `client:load` directive on badge | Badge uses React `useState` for expand/collapse. Needs client-side hydration. |
| Manual scoring, no automation | Matches user's explicit out-of-scope: "No automated/LLM scoring pipeline." |
| Maintenance dim reuses verification data | User specified: "Maintenance signal dimension reuses existing verification data — don't rebuild it." |
| sourceUrl citations per server | User review flagged scores lacked sourcing evidence. Every score now has a paper trail to the specific repo README. |

---

### Maintenance Signal: Static Snapshot ⚠️

The maintenance dimension is stored as a hardcoded number in the score data (e.g., `maintenance: 2`), assessed on 2026-08-12. It does **not** reference the live verification system at runtime.

**Implication:** If a server's verification status changes (e.g., commits stall, repo gets archived), the hygiene score won't update automatically.

**Fix options:**
- Re-score periodically and update the static data (simplest)
- Read maintenance from the live verification endpoint at request time (requires API integration on the detail page)
- Add a `lastVerified` date to each score and show staleness warnings on the badge

---

## Resolved Issues

### ~~1. Score Sourcing — No Paper Trail~~ ✅ RESOLVED

**Previous issue:** Scores had no citation to a specific README, schema file, or repo URL. If a maintainer disputed their rating, notes provided context but not proof.

**Resolution (commit `ea622ca`):**
- Added `sourceUrl: string` field to the `AgentHygieneScore` interface
- All 14 servers now cite their GitHub repo URL
- Re-fetched all 14 READMEs live to re-verify scores against current content
- Three score adjustments made (see "Score Changes" section above)
- Badge component and rubric page both link to the source repo
- No disclaimer needed — each score now has a direct paper trail

### 2. Visual Match — Unverified

Badge CSS (`border-radius: 10px`, `rgba` backgrounds, tinted borders) follows the existing card patterns. But this hasn't been eyeballed against the live site. The color scheme uses `var(--text-primary, #000000)` which assumes the site has CSS custom properties set.

**Recommendation:** Deploy to a Cloudflare preview branch (`wrangler pages deploy dist --branch=agent-hygiene`) and compare side-by-side with the existing Security Audit section.

### 3. Next Step

Deploy to a Cloudflare preview branch, then share the URL for visual review.

---

## Out of Scope (Explicit)

- No automated scoring pipeline
- No changes to existing verification/security system
- No new servers added to catalog
