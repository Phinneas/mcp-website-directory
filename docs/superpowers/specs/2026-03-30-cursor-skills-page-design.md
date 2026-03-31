# Cursor Skills Page — Design Spec
**Date:** 2026-03-30
**Status:** Approved — Ready for Implementation
**Approach:** A — New curated data file + dedicated Astro page

---

## Context & Why

Search volume for "cursor skills" grew from 140/mo in October 2025 to 6,600/mo in February 2026 (+4,614%). Keyword difficulty is effectively zero — no dedicated directory or landing page currently ranks for this term. "Cursor skills directory" (70/mo, navigational intent) confirms users are explicitly looking for what mymcpshelf already builds. Keyword data sourced from DataForSEO, March 2026.

The existing `/agent-skills` page covers Cursor as one of 25+ agents but is not optimised for Cursor-specific search intent. A dedicated `/cursor-skills` page captures this gap without touching any existing code.

---

## Approach Selected

**Option A — New curated data file + dedicated page**

- Create `src/data/cursor-skills.json`: curated list of Cursor-compatible skills, same schema as `src/data/agent-skills.json`
- Create `src/pages/cursor-skills.astro`: new static prerendered page, modelled directly on `agent-skills.astro`
- No changes to existing files — zero regression risk

---

## Files to Create

### 1. `src/data/cursor-skills.json`

**Schema:** Identical to existing `src/data/agent-skills.json`. Each skill object:

```json
{
  "name": "skill-name",
  "title": "Human Readable Title",
  "description": "What the skill does and when to use it.",
  "repo": "owner/repo",
  "install": "npx skills add owner/repo --skill skill-name",
  "category": "Development & Code Tools",
  "source": "skills.sh",
  "publisher": "owner",
  "rank": 1,
  "license": "",
  "version": "1.0.0",
  "url": "https://github.com/owner/repo/tree/main/skills/skill-name",
  "skillsShUrl": "https://skills.sh"
}
```

**Include/Exclude criteria:**

Include skills that are framework, coding, or workflow-focused and directly usable in Cursor's code editing context. Exclude vendor-specific platform skills (Azure/Copilot), skills that are links or documentation entries rather than installable SKILL.md files, and Anthropic-internal tooling that is Claude Code-specific.

**Publisher rules:**

| Publisher | Action | Reason |
|-----------|--------|--------|
| `vercel-labs` | Include ALL | Framework/React skills — core Cursor use case |
| `remotion-dev` | Include ALL | Video/code tools — Cursor-compatible |
| `expo` | Include ALL | Mobile development — Cursor-compatible |
| `inference-sh-9` | Include ALL | AI tools, video, image gen — general coding context |
| `obra` (superpowers) | Include ALL | Coding workflow skills (TDD, debugging, git, brainstorming) |
| `michalparkola` | Include ALL | article-extractor, youtube-transcript, tapestry, ship-learn-next |
| `mhattingpete` | Include ALL | git-pushing, review-implementing, test-fixing, computer-forensics, file-deletion, metadata-extraction |
| `zxkane` | Include ALL | aws-skills |
| `microsoft` | Exclude ALL | Azure/Copilot-native — not relevant to Cursor users |

**Anthropics skills — include/exclude by name:**

Include these specific `anthropics` skills:
- `frontend-design`
- `artifacts-builder`
- `webapp-testing`
- `algorithmic-art`
- `docx`
- `pdf`
- `pptx`
- `xlsx`
- `excel-mastery-xlsx`
- `powerpoint-pptx`
- `word-processing-docx`
- `pdf-master`

Exclude ALL other anthropics skills. Specifically, exclude by rule:
- Any skill with `category === "Official Documentation"` — these are links, not installable skills (covers: `claude-skills-overview`, `skills-user-guide`, `creating-custom-skills`, `skills-api-documentation`, `agent-skills-blog-post`)
- Any skill with `category === "Community Resources"` — same reason (covers: `anthropic-skills-repository`, `claude-community`, `skills-marketplace`)
- Any skill with `category === "Inspiration & Use Cases"` — link/reference entries (covers: `lenny's-newsletter`, `notion-skills`)
- Internal Anthropic workflow tooling not relevant to Cursor users: `brand-guidelines`, `internal-comms`, `lead-research-assistant`, `competitive-ads-extractor`, `domain-name-brainstormer`, `meeting-insights-analyzer`, `content-research-writer`, `mcp-builder`, `skill-creator`, `changelog-generator`, `file-organizer`, `invoice-organizer`, `raffle-winner-picker`, `slack-gif-creator`, `theme-factory`, `video-downloader`, `image-enhancer`, `canvas-design`

**Community skills — include by (publisher, skill name) tuple:**

Each entry is `publisher` + exact `name` field from `agent-skills.json`:

| Publisher | Skill name |
|-----------|------------|
| `chrisvoncsefalvay` | `claude-d3js-skill` (category: Development & Code Tools) |
| `lackeyjb` | `playwright-browser-automation` |
| `conorluddy` | `ios-simulator` |
| `jthack` | `ffuf-web-fuzzing` |
| `omkamal` | `pypict-claude-skill` |
| `bluzername` | `claude-code-terminal-title` |
| `1NickPappas` | `move-code-quality-skill` |
| `smerchek` | `markdown-to-epub-converter` |
| `coffeefuelbump` | `csv-data-summarizer` |
| `yusufkaraaslan` | `skill-seekers` |

**Estimated total:** ~45–55 skills after applying these rules.

**How to build the file:** Filter `src/data/agent-skills.json` using the rules above and write the result to `src/data/cursor-skills.json`. Do not modify the source file.

---

### 2. `src/pages/cursor-skills.astro`

Model this file on `src/pages/agent-skills.astro`. Below are all differences. Everything not listed here is identical to `agent-skills.astro`.

#### Frontmatter (top of file, between `---` fences)

```astro
---
export const prerender = true;
import '../styles/global.css';
import { VintageIcon } from '../components/VintageIcon';
import HeaderNewsletter from '../components/HeaderNewsletter.astro';

import skillsData from '../data/cursor-skills.json';
const allSkills = skillsData;

const categories = ['All', ...new Set(allSkills.map(skill => skill.category))];

const title = 'Cursor Skills Directory | My MCP Shelf';
const description = 'Browse and install Cursor skills — extend your AI coding agent with pre-built skills for React, frameworks, testing, deployment, and more. Updated daily from skills.sh.';
const canonicalUrl = 'https://www.mymcpshelf.com/cursor-skills';
---
```

#### `<head>` meta tags

Use `title`, `description`, and `canonicalUrl` variables identically to `agent-skills.astro`. No changes to the meta tag structure.

#### Add CSS — Install Guide Section

Add the following CSS inside the `<style>` block, after the existing styles (copy all existing styles from `agent-skills.astro` first, then append these):

```css
.install-guide-section {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.install-guide-section h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  text-align: center;
}

.install-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.install-method-card {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem;
}

.install-method-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.install-method-card p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.install-code {
  display: block;
  background: hsl(var(--muted));
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.85rem;
  color: var(--text-primary);
  word-break: break-all;
}

@media (max-width: 768px) {
  .install-methods {
    grid-template-columns: 1fr;
  }
}
```

#### Hero Section (inside `<body>`, inside `.hero-section`)

Replace the hero title, subtitle, and stats bar with:

```astro
<h1 class="hero-title">Cursor Skills Directory</h1>
<p class="hero-subtitle">
  Extend Cursor AI with installable skills for frameworks, testing, deployment, and more
</p>

<div class="stats-bar">
  <div class="stat-item">
    <div class="stat-value">{allSkills.length}+</div>
    <div class="stat-label">Skills</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">Cursor</div>
    <div class="stat-label">Optimised</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">Daily</div>
    <div class="stat-label">Updates</div>
  </div>
</div>
```

#### Navigation Links

Replace the nav links block with (note "All Agent Skills" is first):

```astro
<nav class="nav-links">
  <a href="/agent-skills"><VintageIcon client:load name="VisualStudioWRENCH" size={16} /> All Agent Skills</a>
  <a href="/"><VintageIcon client:load name="WindowsFolder" size={16} /> Shelf</a>
  <a href="/mcp-clients"><VintageIcon client:load name="Windows95MyComputer" size={16} /> MCP Clients</a>
  <a href="/blog"><VintageIcon client:load name="Windows95TextFile" size={16} /> Blog</a>
  <a href="/faq"><VintageIcon client:load name="Windows95Help" size={16} /> FAQ</a>
</nav>
```

The "All Agent Skills" link uses the `VisualStudioWRENCH` icon (same as the agent-skills card on the homepage). If that icon is not available, use `Windows95MyComputer` as a fallback.

#### Install Guide Section

Place this section **between** the Submit CTA block and the Search section (i.e., after `<div class="submit-cta">` and before `<div class="search-section">`):

```astro
<!-- Install Guide -->
<section class="install-guide-section">
  <h2>How to Install Cursor Skills</h2>
  <div class="install-methods">
    <div class="install-method-card">
      <h3>Via CLI (Recommended)</h3>
      <code class="install-code">npx skills add [repo] --skill [name]</code>
      <p>Copies the skill's SKILL.md file into your project's <code>.cursor/skills/</code> directory automatically.</p>
    </div>
    <div class="install-method-card">
      <h3>Manual Install</h3>
      <code class="install-code">.cursor/skills/skill-name.md</code>
      <p>Download the SKILL.md from the skill's GitHub URL and place it in <code>.cursor/skills/</code> in your project root.</p>
    </div>
  </div>
</section>
```

#### Submit CTA

Change button text and keep same GitHub URL:

```astro
<div class="submit-cta">
  <a href="https://github.com/mymcpshelf/skills/issues/new" class="submit-btn">
    🚀 Submit a Cursor Skill
  </a>
</div>
```

#### Search Placeholder

Change `placeholder="Search agent skills..."` to `placeholder="Search Cursor skills..."`

#### Client-side JS

Copy identically from `agent-skills.astro`. No changes.

---

## Files NOT to Modify

| File | Reason |
|------|--------|
| `src/data/agent-skills.json` | No schema changes — cursor-skills.json is a separate file |
| `src/pages/agent-skills.astro` | Zero changes — no regression risk |
| `src/pages/claude-skills.astro` | Currently a 301 redirect — leave as-is |
| Any other existing pages | Out of scope |

---

## SEO Requirements

| Element | Value |
|---------|-------|
| `<title>` | `Cursor Skills Directory \| My MCP Shelf` |
| `<meta name="description">` | `Browse and install Cursor skills — extend your AI coding agent with pre-built skills for React, frameworks, testing, deployment, and more. Updated daily from skills.sh.` |
| `<link rel="canonical">` | `https://www.mymcpshelf.com/cursor-skills` |
| `og:title` | `Cursor Skills Directory \| My MCP Shelf` |
| `og:url` | `https://www.mymcpshelf.com/cursor-skills` |
| H1 text | `Cursor Skills Directory` |
| Page route | `/cursor-skills` |
| Astro file path | `src/pages/cursor-skills.astro` |

**Target keywords (DataForSEO, March 2026):**
- `cursor skills` — 6,600/mo, KD <5 (primary target)
- `cursor agent skills` — 720/mo, KD 4
- `cursor skills directory` — 70/mo, navigational intent (exact match to page name)
- `cursor skills examples` — 170/mo (served by the skills grid)
- `cursor rules vs skills` — 210/mo (addressed in install guide)
- `how to use skills in cursor` — 140/mo (addressed in install guide)

---

## Internal Linking (Post-Launch — Do Not Block on These)

After the page is live, add links in these locations:

1. **Homepage** (`src/pages/index.astro`) — add "Cursor Skills" alongside the Agent Skills card in the hero section
2. **Agent Skills page** (`src/pages/agent-skills.astro`) — add a callout near the top: _"Looking for Cursor-specific skills? → [Cursor Skills Directory](/cursor-skills)"_
3. **Blog post** `src/content/blog/superpowers-skills-framework-claude-code.md` — add a link to `/cursor-skills`

---

## Acceptance Criteria

- [ ] `src/data/cursor-skills.json` exists with 40+ skills, all matching the existing schema (same keys as `agent-skills.json`)
- [ ] `src/data/cursor-skills.json` contains no Microsoft Azure/Copilot skills
- [ ] `src/data/cursor-skills.json` contains no skills with `category === "Official Documentation"` or `category === "Community Resources"`
- [ ] `src/pages/cursor-skills.astro` exists and `npm run build` completes without errors
- [ ] Page renders at `/cursor-skills` locally (`npm run dev`)
- [ ] `<title>` is exactly `Cursor Skills Directory | My MCP Shelf`
- [ ] `<link rel="canonical">` points to `https://www.mymcpshelf.com/cursor-skills`
- [ ] Install guide section is present between the Submit CTA and Search input
- [ ] "All Agent Skills" is the first nav link and points to `/agent-skills`
- [ ] Category filter works client-side
- [ ] Search input placeholder reads "Search Cursor skills..."
- [ ] Copy-to-clipboard works on install commands
- [ ] `src/pages/agent-skills.astro` is unchanged (verify with `git diff`)
- [ ] `src/data/agent-skills.json` is unchanged (verify with `git diff`)

---

## Out of Scope

- Adding a `platforms` field to `agent-skills.json` (future work — Approach B)
- Building a shared Astro layout component for all platform pages (future work — Approach C)
- Repurposing `claude-skills.astro` from a redirect into a real page (separate task)
- Any changes to MCP Servers, MCP Clients, or other existing sections
