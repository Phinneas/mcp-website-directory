# Agent Skills Expansion — Spec

**Status:** Decisions locked — ready for implementation
**Date:** 2026-03-02
**Scope:** Expand mymcpshelf.com from Claude-only skills to the full open agent skills ecosystem

---

## Background

The site currently has a `/claude-skills` page backed by `skills.json` (68 skills, all from `anthropics/skills`). Meanwhile, the Vercel-led open agent skills ecosystem has grown to 120+ skills on skills.sh, published by orgs like Google, Expo, Anthropic, antfu, Better Auth, Callstack, and others. The `npx skills` CLI supports 30+ agents (Claude Code, Cursor, Copilot, Windsurf, Roo, Gemini CLI, etc.).

This is the same "MCP but for instructions" moment. We should own the discovery layer.

---

## Three Initiatives

### 1. skills.sh Data Integration (the feed)
### 2. Publish mymcpshelf as a Skill (the contribution)
### 3. Cross-link MCPs ↔ Skills (the differentiator)

---

## Initiative 1: skills.sh Data Integration

### Goal
Replace the static hand-curated `skills.json` with a live feed of all skills from the open ecosystem, scraped similarly to how PulseMCP powers the MCP directory.

### What We Get From skills.sh
skills.sh exposes a ranked leaderboard of skills with:
- Skill name (e.g., `react-best-practices`)
- GitHub repo / owner (e.g., `vercel-labs/agent-skills`)
- Size (approximate content weight in bytes, used for ranking)
- Rank position

Each skill lives on GitHub as a directory with a `SKILL.md` file containing YAML frontmatter:
```yaml
name: react-best-practices
description: React and Next.js performance optimization. Use when writing React components or reviewing for performance issues.
license: MIT
metadata:
  version: 1.0.0
```

### Data Pipeline

**File:** `scripts/scrape_agent_skills.js`

> **Note on skills.sh:** No public API exists (`/api` and `/api/skills` both return 404). HTML scraping required. The page HTML is clean and structured — each entry is: rank number, skill name as `###` heading, repo path (e.g. `vercel-labs/agent-skills`), and size in KB. Straightforward to parse.

Steps:
1. Scrape skills.sh HTML to extract ranked skill list (name, repo, rank, size)
2. For each skill, fetch the raw `SKILL.md` from GitHub to extract `description`, `license`, `metadata`, optional `compatibility`
3. Derive `install_command` from repo path: `npx skills add {owner}/{repo} --skill {name}`
4. All skills support all 30+ agents by default — do **not** surface an agent filter chip UI yet; add it only once we can reliably infer per-skill compatibility from `SKILL.md` `compatibility` fields
5. Categorize using the existing category taxonomy + add new ones (`Framework`, `Deployment`, `Testing`, `AI/LLM`)
6. Write to `data/agent-skills.json`

**Output schema per skill:**
```json
{
  "name": "react-best-practices",
  "title": "React Best Practices",
  "description": "React and Next.js performance optimization guidelines...",
  "repo": "vercel-labs/agent-skills",
  "install": "npx skills add vercel-labs/agent-skills --skill react-best-practices",
  "category": "Framework",
  "source": "skills.sh",
  "publisher": "vercel-labs",
  "rank": 12,
  "agents": ["claude-code", "cursor", "copilot", "windsurf", "roo"],
  "license": "MIT",
  "url": "https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices",
  "skillsShUrl": "https://skills.sh"
}
```

**Refresh cadence:** Run via existing Prefect pipeline, daily. Add a `scrape_agent_skills` flow alongside the PulseMCP flow.

### Page Changes

**Route:** Rename `/claude-skills` → `/agent-skills`
Add a 301 redirect from `/claude-skills` to `/agent-skills`.

**Page title:** "Agent Skills Directory" (drop "Claude Skills")
**Subtitle:** "Installable skills for Claude Code, Cursor, Copilot, Windsurf, and 25+ other AI coding agents."

**New UI elements:**

- **Source badge on each card** — pill showing publisher org (e.g., `vercel-labs`, `anthropics`, `antfu`, `expo`)
- **Install command copy box** — one-click copy of `npx skills add ...` on each card
- **`skills.sh` rank badge** — show rank for top-100 skills (e.g., "#12 on skills.sh")
- **Existing categories retained** + new ones: `Framework`, `Deployment`, `Testing`, `AI/LLM Tools`, `Agent Workflow`
- **"Submit a Skill" CTA** — button/link on the page alongside the existing `/submit-server` pattern, so users can nominate skills not yet on skills.sh
- ~~Agent filter chips~~ — deferred until per-skill agent compatibility data is available from `SKILL.md` `compatibility` fields

**Stats bar:**
> `{N} skills` · `{agents} agents supported` · `Updated daily from skills.sh`

**Keep backward compat:** The existing Claude-specific skills from `anthropics/skills` stay in the feed with `publisher: "anthropics"` and are treated as first-class entries.

---

## Initiative 2: Publish mymcpshelf as a Skill

### Goal
Make the directory itself installable as a skill. When an agent has this skill loaded, it knows how to discover, evaluate, and configure MCP servers — turning the directory into an active tool for agents, not just a passive website.

### What We Publish

A dedicated GitHub repo `mymcpshelf/skills` (separate from the main mcp-directory repo for clean packaging and a tidy install command):

```
mymcpshelf/skills
  skills/
    mcp-shelf/
      SKILL.md
    mcp-config-generator/
      SKILL.md
      scripts/
        generate-config.js   (optional helper)
  README.md
```

**Installable as:**
```bash
npx skills add mymcpshelf/skills
# or specific skills:
npx skills add mymcpshelf/skills --skill mcp-shelf
npx skills add mymcpshelf/skills --skill mcp-config-generator
```

### Skill 1: `mcp-shelf`

**Purpose:** Teach agents how to search and evaluate MCP servers.

**`SKILL.md` frontmatter:**
```yaml
name: mcp-shelf
description: >
  Search, discover, and evaluate MCP (Model Context Protocol) servers on mymcpshelf.com.
  Use when the user asks to find an MCP server, add MCP tools to their agent,
  or configure MCP integrations.
license: MIT
metadata:
  version: 1.0.0
  site: https://www.mymcpshelf.com
```

**`SKILL.md` body (abbreviated):**
- How to search mymcpshelf.com by category, use case, and agent compatibility
- MCP vs skills: when to use each
- How to evaluate server quality (GitHub stars, last commit, author, license)
- Categories: filesystem, databases, APIs, communication, development, browser automation, etc.
- How to install an MCP server once found (link to `/mcp-config-generator`)
- Pointer to the API: `https://www.mymcpshelf.com/api/servers`

### Skill 2: `mcp-config-generator`

**Purpose:** Teach agents how to generate correct MCP config JSON for any Claude-compatible client.

**`SKILL.md` body:**
- MCP config file locations per client (Claude Desktop, Cursor, Windsurf, etc.)
- Config JSON schema (command, args, env, transport type)
- Common patterns: npx-based, uvx-based, docker-based servers
- How to call `https://www.mymcpshelf.com/mcp-config-generator` for pre-built configs
- Troubleshooting common config errors

### Submit to skills.sh

After publishing `mymcpshelf/skills` to GitHub, submit both skills to the skills.sh directory so they appear in the leaderboard and are discoverable via `npx skills find`.

---

## Initiative 3: Cross-link MCPs ↔ Skills

### Goal
Surface the relationship between "tools" (MCP servers) and "knowledge" (skills) — when you're using a GitHub MCP server, you probably also want a `git-workflow` skill. This is our differentiation vs. skills.sh (pure skills) and PulseMCP (pure MCPs).

### Taxonomy Mapping

Define a mapping between MCP categories and relevant skill names:

| MCP Category | Related Skills |
|---|---|
| Version Control / GitHub | `git-workflow`, `finishing-a-development-branch` |
| Databases | `sql-best-practices`, `nodejs-backend-patterns` |
| Frontend / Browser | `react-best-practices`, `web-design-guidelines`, `shadcn-ui` |
| Deployment | `vercel-deploy`, `expo-cicd-workflows` |
| Testing | `vitest`, `code-review-excellence` |
| AI / LLM | `ai-sdk`, `mcp-shelf` |
| Documents | `pdf`, `docx`, `xlsx` |

Store as `data/mcp-skill-map.json`.

### UI Changes

**On MCP server cards (home page / search results):**
- Small "Related Skills" footer with 1–2 pill links: e.g., `⚡ react-best-practices` linking to the skill on `/agent-skills`

**On the `/agent-skills` page:**
- Each skill card gets a "Related MCP Servers" section showing 1–3 MCP cards that complement the skill

**On future MCP detail pages** (if/when those exist):
- Full "Skills that work well with this server" section

### Implementation

- At build time, enrich each MCP server entry with `relatedSkills[]` using the category map
- Enrich each skill entry with `relatedMcps[]` using the reverse map
- Keep it lightweight — no AI inference, just the static category→skill map

---

## Implementation Order

### Phase 1 — Data + Infrastructure (no UI changes)
1. Write `scripts/scrape_agent_skills.js` to pull from skills.sh + GitHub
2. Generate `data/agent-skills.json` with full schema
3. Add to Prefect pipeline
4. Write `skills/mcp-shelf/SKILL.md` and `skills/mcp-config-generator/SKILL.md`
5. Write `data/mcp-skill-map.json`

### Phase 2 — Page Redesign
1. Create `/agent-skills` page (replacing `/claude-skills`)
2. Add 301 redirect
3. Implement agent filter chips, install copy boxes, publisher badges, rank badges
4. Wire to `data/agent-skills.json`

### Phase 3 — Cross-linking
1. Add `relatedSkills` to MCP server data at build time
2. Render "Related Skills" pills on MCP cards (home + search)
3. Add `relatedMcps` to skill entries
4. Render "Related MCP Servers" on skill cards

### Phase 4 — Publish & Promote
1. Create `mymcpshelf/skills` repo and push both `SKILL.md` files
2. Submit to skills.sh
3. Update nav: rename "Claude Skills" → "Agent Skills" sitewide
4. Blog post: "We track skills now too"

---

## Files Created / Modified

| File | Action | Notes |
|---|---|---|
| `scripts/scrape_agent_skills.js` | Create | skills.sh scraper + GitHub SKILL.md fetcher |
| `data/agent-skills.json` | Create | Generated, gitignored, Prefect-managed |
| `data/mcp-skill-map.json` | Create | Static category→skill mapping |
| `skills/mcp-shelf/SKILL.md` | Create | Published skill #1 |
| `skills/mcp-config-generator/SKILL.md` | Create | Published skill #2 |
| `src/pages/agent-skills.astro` | Create | New page (replaces claude-skills) |
| `src/pages/claude-skills.astro` | Modify | 301 redirect only |
| `src/utils/agentSkillsApi.js` | Create | Data loading util for the page |
| `astro.config.mjs` | Modify | Add redirect rule |
| `README.md` | Modify | Document skills install commands |

---

## Decisions Log

| # | Question | Decision |
|---|---|---|
| 1 | skills.sh API or HTML scrape? | **HTML scrape** — no public API exists (`/api` and `/api/skills` both 404). Page HTML is clean and parseable. |
| 2 | Surface agent filter UI before compatibility data? | **No** — defer agent filter chips until per-skill compatibility can be inferred from `SKILL.md` fields. |
| 3 | Add "Submit a Skill" CTA? | **Yes** — add alongside the existing `/submit-server` pattern. |
| 4 | Brand name? | **"Agent Skills"** |
| 5 | Publish skills from this repo or separate repo? | **Separate repo** — `mymcpshelf/skills` for clean `npx skills add mymcpshelf/skills` command. |
