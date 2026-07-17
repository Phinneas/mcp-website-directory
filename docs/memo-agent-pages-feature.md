# MEMO: Programmatic "Best MCP Servers for [Agent]" Pages

**Date:** 2026-07-15  
**Scope:** 10 programmatic agent pages, weighted server selection, agent-specific config snippets, cross-links  
**Competitive Context:** Counter to skills.sh (dedicated agent pages), claudeskills.info (harness components), and mcpservers.org (Agent Skills section). High-intent queries like "MCP servers for Cursor" currently resolve to competitors.

---

## What We Shipped

### 1. `src/data/agentPages.ts` — Data Pipeline
Central configuration for all agent pages.

- **10 agent configs:** Claude Code, Cursor, Cline, GitHub Copilot, Windsurf, Zed, Continue, Roo Code, Gemini, Goose
- **Weighted server selection:** `selectServersForAgent()` scores servers by `stars × categoryWeight + verifiedBonus`
- **Per-agent category weights:** e.g., Copilot weights `cloud` higher, Gemini weights `cloud` highest, Claude Code weights `development` highest
- **Config format helpers:** Mirrors `MCPConfigGenerator.tsx` — generates correct JSON for each client (Claude Desktop, Cursor, Cline, Continue, VS Code)
- **Editorial cross-links:** Each agent maps to a future editorial URL (`/blog/best-mcp-servers-for-{agent}`)

### 2. `src/pages/best-mcp-servers-for-[agent].astro` — Dynamic Route
Single Astro file generates all 10 pages at build time via `getStaticPaths()`.

**Each page includes:**
- **Hero:** Agent name, tagline, description, stat cards (verified picks count, config format, 1-click install)
- **One-Command Install:** CLI command pre-populated with all recommended server slugs
- **Config Snippet:** Agent-specific JSON config ready to paste into the correct config file path
- **Verified Picks Grid:** Top servers ranked by weighted score, showing:
  - Security score badge (🟢/🔵/🟡/🔴)
  - Verification status (Scanned / Manually Reviewed / Unverified)
  - Star count and language
  - Copy-to-clipboard for `npx -y {package}`
- **Editorial Cross-Link:** "Read the Guide →" button (when editorial URL is set)
- **Agent Discovery Grid:** Links to all other agent pages

**Page URLs:**
- `/best-mcp-servers-for-claude-code`
- `/best-mcp-servers-for-cursor`
- `/best-mcp-servers-for-cline`
- `/best-mcp-servers-for-github-copilot`
- `/best-mcp-servers-for-windsurf`
- `/best-mcp-servers-for-zed`
- `/best-mcp-servers-for-continue`
- `/best-mcp-servers-for-roo-code`
- `/best-mcp-servers-for-gemini`
- `/best-mcp-servers-for-goose`

### 3. Cross-Links & Discoverability
- **MCP Clients page (`/mcp-clients`):** Added "Best MCP Servers by Agent" section with a grid linking to all 10 agent pages
- **Sitemap:** Automatically included via `@astrojs/sitemap` (prerendered pages are indexed)
- **Internal linking:** Each agent page links to all other agent pages

### 4. Selection Criteria
| Factor | Weight |
|--------|--------|
| Stars (popularity) | Base score |
| Category match | ×1.0–1.5 per agent |
| Verified/scanned badge | +50 bonus |
| Security audit ≥50 | +30 bonus |
| Minimum stars threshold | 3–15 per agent |

---

## Files Changed

| File | Action | Note |
|------|--------|------|
| `src/data/agentPages.ts` | Created | Agent configs, config format helpers, weighted selection function |
| `src/pages/best-mcp-servers-for-[agent].astro` | Created | Dynamic route generating 10 static pages |
| `src/pages/mcp-clients.astro` | Modified | Added "Best MCP Servers by Agent" cross-link section |

---

## Deployment Status

- **Code:** Committed to `mcp-directory-fresh`
- **Build:** Pages are prerendered (`prerender = true`) — generated statically at build time from `staticServers.js`
- **Sitemap:** Auto-included by `@astrojs/sitemap` integration
- **Next step:** Standard push/deploy to Cloudflare Pages

---

## Deferred / Follow-Up

- **DataForSEO validation:** Keyword volume validation for the 10 agents should be run before expanding to additional agents. Current list is based on market presence (stars, mentions, search trends).
- **Editorial posts:** The `editorialUrl` field points to `/blog/best-mcp-servers-for-{agent}` — these editorial deep-dives are scheduled separately (content plan project, due Aug 8 for Claude/Claude Code).
- **D1 dynamic queries:** Currently uses `staticServers.js` at build time. Switching to D1 for live server picks is a one-line change once the DB is available at build time.
- **Subagents / hooks / plugins:** Out of scope — deferred to follow-up task when demand is validated.

---

## Competitive Positioning

| Competitor | Their Approach | Our Differentiator |
|-----------|---------------|-------------------|
| skills.sh | Static agent pages with generic lists | Weighted selection by category + verification status + security scores |
| claudeskills.info | Harness components (skills only) | Servers + skills + verified security context in one flow |
| mcpservers.org | Flat agent skills section | Per-agent curated picks with install command + config snippet |

The "install → configure → verify" flow on each page turns a discovery query into an action in under 60 seconds.
