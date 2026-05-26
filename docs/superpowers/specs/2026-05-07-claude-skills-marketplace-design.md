# Claude Skills Marketplace — Design Spec

**Date:** 2026-05-07
**Target keyword:** "claude skills marketplace" (6,600/mo, KD 17, +1,962% growth)
**Secondary keyword:** "claude code skills marketplace" (1,300/mo)
**Site:** mymcpshelf.com (Astro + Cloudflare Pages)

---

## Problem

`/claude-skills` currently 301-redirects to `/agent-skills` — a generic all-agent directory with no Claude-specific focus. A high-growth keyword with no strong marketplace ranking today, and a wasted URL.

---

## Approach

Marketplace-first layout at a dedicated `/claude-skills` route. Same underlying data source as `/agent-skills`, filtered to Claude-tagged entries. Differentiated by a Featured Skills row, Claude-first copy framing, and an on-page skill submission form. No new data pipeline — fast to ship.

---

## 1. URL & Routing

- `/claude-skills` becomes a real Astro page (rebuilt from scratch, not a fork of `agent-skills.astro`)
- The existing 301 redirect in `claude-skills.astro` is removed
- Canonical: `https://www.mymcpshelf.com/claude-skills`
- Submit form is an embedded Tally form within a `#submit` anchor section on the same page — no separate route

---

## 2. Data Layer

**Filtering:** Add `claude: true` to entries in `src/data/agent-skills.json` that work with Claude Code. The `/claude-skills` page filters `allSkills` to only those entries.

**Featured row:** Add `featured: true` to the top 3 Claude-tagged entries by existing `rank` field. No manual editorial curation — featured = highest-ranked Claude skills automatically. Featured skills still appear in the main grid.

**Seeding Claude-specific content:** Manually add 5–10 new entries to `agent-skills.json` for Claude-specific skills not yet in the dataset (Superpowers plugins, `coreyhaines31/marketingskills`, etc.) with `claude: true` and `featured: true` on the best ones.

**No new data file.** Everything stays in `agent-skills.json`.

---

## 3. Page Layout

Top to bottom:

### Hero
- H1: `Claude Skills Marketplace`
- Subtitle: "Discover and install skills for Claude Code. The marketplace for Anthropic agents — updated daily." (works "claude code skills marketplace" in naturally)
- Stats bar: skill count (filtered), agents supported, daily updates — reusing existing stats bar pattern

### Featured Skills Row
- Label: "Featured Skills"
- 3 cards pulled from `claude: true` entries sorted by `rank`, where `featured: true`
- Visually distinct: slightly larger or with a highlighted amber border to differentiate from grid cards
- Same card data shape as existing skill cards

### Submit CTA
- Single button: "Submit a Skill →" — smooth-scrolls to `#submit`

### Search + Category Filter
- Same implementation as `/agent-skills` — input + category pill filters
- Scoped to `claude: true` entries only

### Skills Grid
- Same card component and interaction as `/agent-skills`
- Filtered to `claude: true` entries
- Cards show: name, category badge, description (truncated at 150 chars), GitHub link, install command (click-to-copy)

### Submit Section (`#submit`)
- Heading: "Submit a Claude Skill"
- Short intro: "Know a skill that Claude Code users would love? Add it to the marketplace."
- Embedded Tally form: `https://tally.so/r/WOD9lR`
- Tally handles: skill name, GitHub repo URL, description, submitter email

---

## 4. SEO Metadata

```
<title>Claude Skills Marketplace | My MCP Shelf</title>
<meta name="description" content="Discover and install Claude Code skills. Browse the marketplace of installable skills for Claude Code and Anthropic agents — updated daily." />
<link rel="canonical" href="https://www.mymcpshelf.com/claude-skills" />
```

- H1 is exact-match primary keyword
- Secondary keyword appears in subtitle copy on-page
- `prerender = true` for static generation (same as other pages)

---

## 5. Components & Files Touched

| File | Change |
|------|--------|
| `src/pages/claude-skills.astro` | Full rewrite — remove redirect, build marketplace page |
| `src/data/agent-skills.json` | Add `claude: true`, `featured: true` flags; add 5–10 new Claude-specific entries |

No new components required. Reuses existing card styles and search/filter JS pattern from `agent-skills.astro`.

---

## 6. Out of Scope

- Newsletter integration (stub exists but is unwired; add later with Beehiiv)
- Cursor Skills or other agent-specific pages (separate effort)
- Backend for form submissions (Tally handles this)
- Ratings, install counts, or other dynamic marketplace signals (future iteration)
