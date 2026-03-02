# Agent Skills — Implementation Spec
**For:** Kiro Code
**Date:** 2026-03-02
**Status:** Ready for implementation
**Repo:** `/Users/chesterbeard/Desktop/mcp-directory`
**Live site:** https://www.mymcpshelf.com

---

## Stack Context

- **Framework:** Astro (SSR mode, `output: 'server'`, Cloudflare adapter)
- **UI:** React + Tailwind CSS v4
- **Scraping:** Puppeteer (see existing `scripts/scrape_skills.js` for pattern)
- **Data utils pattern:** See `src/utils/pulsemcpApi.js` — follow same structure
- **Redirects:** Add to `netlify.toml` (existing redirect rules live there)
- **Pages:** `.astro` files in `src/pages/`, `export const prerender = true` at top of static pages
- **Existing skills page:** `src/pages/claude-skills.astro` backed by root-level `skills.json`

---

## What We're Building

Three things:

1. **A scraper + new data file** — pull all 120+ skills from skills.sh (HTML scrape) + enrich from GitHub `SKILL.md` files → write `data/agent-skills.json`
2. **A new `/agent-skills` page** — replaces `/claude-skills`, broader scope, new UI elements
3. **Two published `SKILL.md` files** — for a separate `mymcpshelf/skills` GitHub repo (files authored here, pushed manually)
4. **Cross-link data file** — `data/mcp-skill-map.json` + render related skills pills on MCP cards

---

## Phase 1 — Scraper & Data

### Task 1.1 — Write `scripts/scrape_agent_skills.js`

Scrape https://skills.sh and enrich each result from GitHub.

**skills.sh HTML structure** (no public API — confirmed 404 on `/api` and `/api/skills`):
```
Each skill entry on the page looks like:
  <rank number>
  ### <skill-name>
  <owner>/<repo>
  <size>K
```
Parse these four fields for every skill on the page.

**For each skill**, fetch the raw `SKILL.md` from GitHub:
```
https://raw.githubusercontent.com/{owner}/{repo}/main/skills/{skill-name}/SKILL.md
```
If that 404s, also try:
```
https://raw.githubusercontent.com/{owner}/{repo}/main/{skill-name}/SKILL.md
https://raw.githubusercontent.com/{owner}/{repo}/main/SKILL.md
```
Parse YAML frontmatter from the `SKILL.md` to extract: `description`, `license`, `metadata.version`.

**Categorization logic** — map skill names to categories using keyword matching:

| Keywords in skill name | Category |
|---|---|
| react, next, vue, svelte, angular, frontend, component, ui, css, tailwind, shadcn, design | `Framework` |
| deploy, vercel, expo, ci, cd, workflow, build, release | `Deployment` |
| test, vitest, jest, playwright, review, quality | `Testing` |
| ai, sdk, llm, gpt, claude, gemini, agent, mcp | `AI/LLM Tools` |
| git, github, branch, pr, commit | `Agent Workflow` |
| sql, database, db, postgres, mysql | `Data & Analysis` |
| pdf, docx, xlsx, pptx, document, file | `Document Processing` |
| python, node, backend, api, server | `Development & Code Tools` |
| memory, episodic, context, prompt | `Agent Workflow` |
| default | `Development & Code Tools` |

**Output schema** — write to `data/agent-skills.json` as a JSON array:
```json
[
  {
    "name": "react-best-practices",
    "title": "React Best Practices",
    "description": "React and Next.js performance optimization guidelines with 40+ rules across 8 categories.",
    "repo": "vercel-labs/agent-skills",
    "install": "npx skills add vercel-labs/agent-skills --skill react-best-practices",
    "category": "Framework",
    "source": "skills.sh",
    "publisher": "vercel-labs",
    "rank": 1,
    "license": "MIT",
    "version": "1.0.0",
    "url": "https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices",
    "skillsShUrl": "https://skills.sh"
  }
]
```

**Notes:**
- Add rate limiting between GitHub fetches: 200ms delay per request
- `title` = skill `name` converted to title case (replace hyphens with spaces, capitalise each word)
- `publisher` = the `owner` portion of the repo path
- If `SKILL.md` description is not found, fall back to an empty string — do not error
- Run with: `node scripts/scrape_agent_skills.js`
- `data/` directory should be created if it doesn't exist

**Acceptance criteria:**
- [ ] Script runs without errors: `node scripts/scrape_agent_skills.js`
- [ ] `data/agent-skills.json` is created with 100+ entries
- [ ] Every entry has all required fields (no nulls on required fields)
- [ ] `install` field is a valid `npx skills add` command for every entry

---

### Task 1.2 — Write `data/mcp-skill-map.json`

Static mapping from MCP server categories to related skill names. This is a hand-authored file.

```json
{
  "Version Control": ["git-workflow", "finishing-a-development-branch", "code-review-excellence"],
  "GitHub": ["git-workflow", "finishing-a-development-branch", "code-review-excellence"],
  "Database": ["nodejs-backend-patterns", "api-design-principles"],
  "Frontend": ["react-best-practices", "web-design-guidelines", "shadcn-ui", "vue-best-practices"],
  "Browser": ["react-best-practices", "web-design-guidelines"],
  "Deployment": ["vercel-deploy", "expo-cicd-workflows"],
  "Testing": ["vitest", "code-review-excellence"],
  "AI": ["ai-sdk", "mcp-shelf"],
  "LLM": ["ai-sdk", "mcp-shelf"],
  "Document": ["pdf", "docx", "xlsx"],
  "File": ["pdf", "docx", "xlsx"],
  "Communication": ["internal-comms", "slack-gif-creator"],
  "React": ["react-best-practices", "shadcn-ui"],
  "Next.js": ["react-best-practices", "vercel-deploy"],
  "Node": ["nodejs-backend-patterns", "api-design-principles"],
  "Python": ["python-performance-optimization"],
  "Vue": ["vue", "vue-best-practices", "pinia"],
  "Mobile": ["react-native-best-practices", "expo-cicd-workflows", "expo-api-routes"]
}
```

**Acceptance criteria:**
- [ ] File exists at `data/mcp-skill-map.json`
- [ ] Valid JSON, parses without errors

---

## Phase 2 — `/agent-skills` Page

### Task 2.1 — Create `src/utils/agentSkillsApi.js`

Utility to load `data/agent-skills.json`. Follow the same pattern as `src/utils/pulsemcpApi.js`.

```js
// src/utils/agentSkillsApi.js
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export function loadAgentSkills() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const dataPath = join(__dirname, '../../data/agent-skills.json');

  if (!existsSync(dataPath)) {
    console.warn('data/agent-skills.json not found — run scripts/scrape_agent_skills.js first');
    return [];
  }

  const raw = readFileSync(dataPath, 'utf-8');
  return JSON.parse(raw);
}

export function getSkillCategories(skills) {
  return ['All', ...new Set(skills.map(s => s.category).filter(Boolean))].sort();
}
```

**Acceptance criteria:**
- [ ] `loadAgentSkills()` returns array of skills
- [ ] `getSkillCategories()` returns deduplicated sorted array with `'All'` first

---

### Task 2.2 — Create `src/pages/agent-skills.astro`

New page at `/agent-skills`. Replace the content and branding of the existing `claude-skills.astro`.

**Page metadata:**
- `<title>` — `Agent Skills Directory | My MCP Shelf`
- `<meta name="description">` — `Discover and install agent skills for Claude Code, Cursor, Copilot, Windsurf, and 25+ other AI coding agents. Updated daily from skills.sh.`
- `<link rel="canonical">` — `https://www.mymcpshelf.com/agent-skills`
- Keep existing Google and MS verification meta tags from `claude-skills.astro`
- `export const prerender = true` at top of frontmatter

**Hero section:**
- `<h1>` — `Agent Skills Directory`
- Subtitle — `Installable skills for Claude Code, Cursor, Copilot, Windsurf, and 25+ other AI coding agents.`
- Same nav links as existing claude-skills page
- Keep `<HeaderNewsletter />` component

**Stats bar** (below hero, above search):
```
{skills.length} skills · Works with 30+ agents · Updated daily from skills.sh
```

**Search bar:**
- Same style as existing `claude-skills.astro` search bar
- Placeholder: `Search agent skills...`
- Filters by: `name`, `title`, `description`, `category`, `publisher`

**Category filter pills:**
- Render one pill per unique category (from `getSkillCategories()`)
- `All` pill selected by default
- Clicking a category pill filters the grid client-side
- Active pill style: filled with primary colour

**Skills grid** — `display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`

**Skill card** must include:

1. **Header row:**
   - Skill title (`<h3>`)
   - Category label (coloured, small)
   - Publisher badge — pill showing `publisher` field (e.g. `vercel-labs`), muted style

2. **Rank badge** — only shown if `rank <= 100`:
   - Text: `#${rank} on skills.sh`
   - Positioned top-right of card or below header
   - Subtle styling (not dominant)

3. **Description** — truncated to 150 chars with `...`

4. **Install command copy box:**
   ```
   [ npx skills add vercel-labs/agent-skills --skill react-best-practices  📋 ]
   ```
   - Monospace font
   - Clicking the copy icon copies the full `install` string to clipboard
   - On copy: icon changes briefly, or show "Copied!" tooltip

5. **Action buttons:**
   - `View on GitHub` → links to `url` field, opens in new tab
   - `skills.sh` → links to `https://skills.sh`, opens in new tab

**"Submit a Skill" CTA:**
Place a CTA card or banner at the top of the grid (or just below the stats bar):
```
Know a skill not listed here?
[Submit a Skill →]   (links to https://github.com/mymcpshelf/skills/issues/new or a future /submit-skill page — use the GitHub issues link for now)
```

**Client-side JS** (inline `<script>` at bottom of page):
- Search input filters cards
- Category pill click filters cards
- Copy button clipboard logic
- Dark mode toggle (copy from existing `claude-skills.astro`)

**Acceptance criteria:**
- [ ] Page renders at `/agent-skills` with data from `data/agent-skills.json`
- [ ] Search filters cards in real-time
- [ ] Category pills filter cards
- [ ] Copy button copies install command to clipboard
- [ ] Rank badge only shows on skills ranked ≤ 100
- [ ] Publisher badge visible on every card
- [ ] "Submit a Skill" CTA is present and links to GitHub issues
- [ ] Dark mode works
- [ ] Page is mobile responsive

---

### Task 2.3 — Redirect `/claude-skills` → `/agent-skills`

Add a 301 redirect in `netlify.toml` (following the existing redirect pattern in that file):

```toml
[[redirects]]
  from = "/claude-skills"
  to = "/agent-skills"
  status = 301
  force = true
```

Replace the body of `src/pages/claude-skills.astro` with a minimal redirect page as a fallback:

```astro
---
export const prerender = true;
return Astro.redirect('/agent-skills', 301);
---
```

**Acceptance criteria:**
- [ ] Visiting `/claude-skills` redirects to `/agent-skills`
- [ ] Redirect is 301 (permanent)

---

## Phase 3 — Cross-linking

### Task 3.1 — Enrich skills with related MCPs

In `src/utils/agentSkillsApi.js`, add a function that joins skills to MCP servers via the category map:

```js
export function enrichSkillsWithRelatedMcps(skills, mcpServers, skillMap) {
  // Invert the map: skill-name -> [mcp categories]
  // For each skill, find MCPs whose category appears in the inverted map for that skill
  // Return skills with relatedMcps: [{ name, slug, description }] (max 3)
}
```

The `skillMap` is `data/mcp-skill-map.json`. MCP server data comes from the existing `staticServers` or PulseMCP data already loaded in `index.astro`. Match on MCP server `category` field.

### Task 3.2 — Render "Related Skills" pills on MCP cards

On the home page (`src/pages/index.astro`) and any search results, add a small "Related Skills" row at the bottom of each MCP server card.

- Only show if the MCP's category has entries in `data/mcp-skill-map.json`
- Show max 2 skill pills per card
- Pill text: skill name (e.g. `react-best-practices`)
- Pill links to `/agent-skills` with a `?skill=react-best-practices` query param (pre-filter the page — handle this in the client-side filter JS on the agent-skills page)
- Pill style: small, outlined, with a ⚡ prefix icon

**Acceptance criteria:**
- [ ] MCP cards with a mapped category show ≤ 2 related skill pills
- [ ] MCP cards without a mapped category show nothing extra (no empty section)
- [ ] Clicking a pill navigates to `/agent-skills` and filters to that skill

---

## Phase 4 — Published SKILL.md Files

These files live in a **separate GitHub repo** (`mymcpshelf/skills`), not in this repo. Author them here under `skills-publish/` so they can be reviewed, then moved to the new repo manually.

### Task 4.1 — Write `skills-publish/mcp-shelf/SKILL.md`

```markdown
---
name: mcp-shelf
description: >
  Search, discover, and evaluate MCP (Model Context Protocol) servers on mymcpshelf.com.
  Use when the user asks to find an MCP server, add MCP tools to their agent setup,
  or configure MCP integrations for Claude Code, Cursor, Windsurf, or any MCP-compatible client.
license: MIT
metadata:
  version: 1.0.0
  site: https://www.mymcpshelf.com
---

# MCP Shelf — Finding and Using MCP Servers

MCP (Model Context Protocol) servers give AI agents access to external tools: databases, APIs, file systems, browser automation, and more. mymcpshelf.com is a searchable directory of 1,000+ MCP servers.

## When to use this skill

Activate when the user says things like:
- "Find me an MCP server for X"
- "I want to add GitHub tools to my agent"
- "How do I configure MCP for Cursor?"
- "What MCP servers are available for databases?"

## How to search

Navigate to https://www.mymcpshelf.com or use the API:

```
GET https://www.mymcpshelf.com/api/servers?q={query}
```

Browse by category: Filesystem, Databases, APIs, Communication, Development, Browser Automation, AI/LLM, Document Processing.

## Evaluating a server

Check these signals in order:
1. **GitHub stars** — proxy for adoption and trust
2. **Last commit date** — is it actively maintained?
3. **Author / org** — official publisher (e.g. `anthropics`, `vercel`) vs community
4. **License** — MIT or Apache 2.0 preferred for commercial use
5. **README quality** — clear install instructions and config examples

## Installing an MCP server

Once the user selects a server, generate the correct config using:
https://www.mymcpshelf.com/mcp-config-generator

Or use the `mcp-config-generator` skill for inline config generation.

## MCP vs Skills

| | MCP Servers | Agent Skills |
|---|---|---|
| What they provide | Tools (functions the agent can call) | Instructions (context the agent loads) |
| Install method | Config JSON in client settings | `npx skills add` |
| Example | GitHub MCP → can read/write PRs | `git-workflow` skill → knows branching strategy |
| Use together? | Yes — they complement each other |  |

## Common MCP categories

- **Filesystem** — read/write local files
- **Databases** — Postgres, SQLite, MySQL query tools
- **APIs** — GitHub, Slack, Linear, Notion, Google Workspace
- **Browser** — Playwright, Puppeteer automation
- **AI/LLM** — inference, embeddings, vector DBs
- **Document** — PDF, DOCX, XLSX processing
- **Communication** — email, Slack, Discord

## Config file locations by client

| Client | Config path |
|---|---|
| Claude Desktop (Mac) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor | `.cursor/mcp.json` in project root |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Roo | `.roo/mcp.json` in project root |
```

### Task 4.2 — Write `skills-publish/mcp-config-generator/SKILL.md`

```markdown
---
name: mcp-config-generator
description: >
  Generate correct MCP config JSON for any MCP-compatible AI client (Claude Desktop, Cursor,
  Windsurf, Roo, etc.). Use when the user wants to add an MCP server to their agent setup
  and needs the configuration snippet.
license: MIT
metadata:
  version: 1.0.0
  site: https://www.mymcpshelf.com/mcp-config-generator
---

# MCP Config Generator

Generates the correct JSON configuration block to add an MCP server to any supported AI client.

## When to use this skill

- User says "add X MCP server to my setup"
- User asks "how do I configure this MCP?"
- User has an MCP server URL/package and needs the config JSON

## Use the web tool first

Before generating manually, check:
https://www.mymcpshelf.com/mcp-config-generator

Select the server and client — it outputs the ready-to-paste config.

## MCP config JSON schema

```json
{
  "mcpServers": {
    "<server-name>": {
      "command": "<executable>",
      "args": ["<arg1>", "<arg2>"],
      "env": {
        "API_KEY": "<value>"
      }
    }
  }
}
```

## Common patterns

**npx-based server:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

**uvx-based server (Python):**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "uvx",
      "args": ["mcp-server-filesystem", "/Users/username/projects"]
    }
  }
}
```

**Docker-based server:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

## Config file locations by client

| Client | Config path |
|---|---|
| Claude Desktop (Mac) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor | `.cursor/mcp.json` in project root, or global `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Roo | `.roo/mcp.json` in project root |
| Claude Code | `~/.claude.json` (global) or `.claude.json` (project) |

## Troubleshooting

| Problem | Fix |
|---|---|
| Server not appearing in agent | Restart the client after editing config |
| `command not found` error | Ensure `npx` or `uvx` is in PATH; try full path |
| Auth errors | Double-check env var names match what the server expects |
| Server crashes on start | Check server README for required args; missing args cause silent crashes |
| Config not loading | Validate JSON syntax — trailing commas break parsing |
```

**Acceptance criteria for Phase 4:**
- [ ] Both `SKILL.md` files exist under `skills-publish/`
- [ ] Both are valid Markdown with correct YAML frontmatter
- [ ] Frontmatter fields: `name`, `description`, `license`, `metadata.version` all present
- [ ] Content is accurate and complete (not stubs)

---

## File Map

All changes are within this repo except the `mymcpshelf/skills` GitHub repo (which is a separate manual step after Phase 4).

| File | Action | Phase |
|---|---|---|
| `scripts/scrape_agent_skills.js` | **Create** | 1 |
| `data/agent-skills.json` | **Create** (generated by script) | 1 |
| `data/mcp-skill-map.json` | **Create** (hand-authored) | 1 |
| `src/utils/agentSkillsApi.js` | **Create** | 2 |
| `src/pages/agent-skills.astro` | **Create** | 2 |
| `src/pages/claude-skills.astro` | **Modify** (redirect only) | 2 |
| `netlify.toml` | **Modify** (add redirect rule) | 2 |
| `src/pages/index.astro` | **Modify** (add related skills pills to MCP cards) | 3 |
| `skills-publish/mcp-shelf/SKILL.md` | **Create** | 4 |
| `skills-publish/mcp-config-generator/SKILL.md` | **Create** | 4 |

**Do not modify:**
- `skills.json` (the old Claude-specific file — leave in place, it is no longer used by the new page but don't delete it yet)
- `astro.config.mjs` (redirects go in `netlify.toml`, not here)
- Any existing page other than `claude-skills.astro` and `index.astro`

---

## Do Not Do

- Do not build an agent filter UI (deferred — no reliable per-skill compatibility data yet)
- Do not use an API for skills.sh (none exists)
- Do not modify `astro.config.mjs` for redirects (use `netlify.toml`)
- Do not delete `skills.json`
- Do not create the `mymcpshelf/skills` GitHub repo (that is a manual step by the owner after Phase 4)
- Do not infer MCP-skill relationships using AI/LLM — use only the static `mcp-skill-map.json`
