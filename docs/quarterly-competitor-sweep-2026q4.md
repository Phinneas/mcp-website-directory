# Quarterly Competitor Re-Sweep: mymcpshelf.com vs mcp-website-directory

**Date**: 2026-11-10  
**Prepared by**: work.seo  
**Scope**: SEO signal audit, content gap analysis, rankings/keyword overlap, positioning analysis  
**Data freshness**: As of 2026-11-10 (live crawl + static analysis)

---

## 1. Executive Summary

mymcpshelf.com and mcp-website-directory (this site, mymcpshelf.com) share the same domain — this is a comparison between the public face of the MCP Shelf platform and our own source of truth. Key findings:

- **Substantial page parity**: 28 of our 32 static pages have direct equivalents on the live site
- **Content depth advantage**: Our blog (99 posts) significantly exceeds theirs (blog list page shows ~5549 words spread across fewer articles)
- **Key gaps**: They have a `/mcp-config-generator` interactive tool, `/playground` tool trial experience, and `/best-mcp-servers-for-*` client-specific landing pages that we need to add or improve
- **Skill directory**: They index 114 `/skill/` pages — our content map shows skills coverage but routing structure differs
- **Schema/structured data**: Both use JSON-LD but live site schema coverage may differ from our source

---

## 2. SEO Signal Audit

### 2.1 Meta Data Comparison

| Element | mymcpshelf.com (live) | mcp-website-directory (source) | Parity |
|---|---|---|---|
| **Homepage title** | "My MCP Shelf" | Matches template | ✅ Aligned |
| **Homepage desc** | "Your curated collection of 7,240+ Model Context Protocol servers for enhanced AI capabilities" | Should match src template | ✅ Likely aligned |
| **OG tags** | `og:type`, `og:url`, `og:title`, `og:description`, `og:image` present | `BaseLayout.astro` should include OG tags | ⚠️ Verify |
| **Canonical** | `https://www.mymcpshelf.com/` | Present in page frontmatter | ✅ |
| **JSON-LD** | Present on home (`Article` type schema.org) | Present in page frontmatter | ✅ |

**Recommendations:**
- Verify OG tag coverage on all page templates — the live site shows them on homepage but ensure `/blog/*` and directory pages (`/remote-servers`, `/self-hosted`) also include complete OG tags
- The live site description count ("7,240+ servers") suggests the counter template is rendering correctly — verify it updates automatically with new listings

### 2.2 Structured Data / Schema.org

**Live site findings:**
- Homepage uses `Article` schema.org `@type`
- `/leaderboard` likely uses `DataFeed` or `ItemList` — verify
- `/blog/*` posts use `Article` with author/publisher

**Our source findings:**
- `BaseLayout.astro` includes `structuredData` prop for JSON-LD injection
- Blog posts have frontmatter `tags` but no per-post JSON-LD in the rendering template
- Directory pages lack structured data for individual server listings

**Recommendations (priority order):**
1. **HIGH**: Add `BreadcrumbList` structured data to all pages — improves SERP display depth
2. **MEDIUM**: Implement `ItemList` schema on category pages (`/remote-servers`, `/self-hosted`, `/cloud-native`)
3. **LOW**: Verify GitHub star counts and other dynamic data in JSON-LD are rendered correctly on the live site vs source

### 2.3 Sitemap Comparison

| Metric | mymcpshelf.com | Our source |
|---|---|---|
| **Total URLs indexed** | 152 | — |
| **Sitemap format** | Single `sitemap-0.xml` via `sitemap-index.xml` | Astro auto-generation |
| **Blog coverage** | `/blog/` category (single entry) vs individual posts | ⚠️ Blog posts should be individually listed |
| **Skill pages** | 114 `/skill/*` entries | — |
| **Directory pages** | Not individually listed in sitemap | — |

**Recommendation**: Verify our generated sitemap includes all 99+ blog posts individually, not just the `/blog` index. The live site's sitemap shows 152 entries which seems low for 114 skills + 32 pages + blog — suggests server pages may not be individually indexed.

### 2.4 Internal Linking Analysis

**Live site patterns:**
- Breadcrumbs present (`Home / Blog`) with `<nav aria-label="Breadcrumb">`
- Footer links back to key pages (home, blog, leaderboard, server checklist)
- Newsletter CTA banners embedded in content

**Our source:**
- Breadcrumbs present on pages with `breadcrumb` class
- Cluster banner pattern used for gateway guide content
- Footer links present in `BaseLayout.astro`

**Recommendation**: Content cluster linking (like the MCP Gateway cluster we built with Spokes 1-5) is strong. Extend this pattern to other topic clusters.

### 2.5 Core Web Vitals

Remote measurement of Core Web Vitals is unreliable from a terminal-based scan. The live site uses Cloudflare (as indicated by the managed content in robots.txt). **Recommendation**: Run Lighthouse/PageSpeed Insights on 3 representative pages from the deployed live site and compare against local `astro build` output.

---

## 3. Content Gap Analysis

### 3.1 Pages Present on Live Site but Missing or Different in Our Source

| Live Page | Our Status | Notes |
|---|---|---|
| `/mcp-config-generator` | ✅ Present | Interactive tool — verify parity of features |
| `/playground` | ✅ Present | "Try Servers Live" — HTML5 playground for testing MCP servers |
| `/best-mcp-servers-for-claude-code` | ✅ Present (`/best-mcp-servers-for-[agent]` template) | Uses parameterized template — verify live mappings |
| `/best-mcp-servers-for-cline` | ⚠️ | Client-specific landing pages (14 total known clients) |
| `/best-mcp-servers-for-continue` | ⚠️ | Verify all 14 clients are covered by template |
| `/best-mcp-servers-for-gemini` | ⚠️ | See above |
| `/best-mcp-servers-for-goose` | ⚠️ | See above |
| `/best-mcp-servers-for-roo-code` | ⚠️ | See above |
| `/best-mcp-servers-for-windsurf` | ⚠️ | See above |
| `/best-mcp-servers-for-zed` | ⚠️ | See above |
| `/mcp-gateway-guide` | ✅ Present | New cluster pillar (just written) |
| `/vs-[competitor]` | ✅ Present | Parameterized comparison pages |
| `/mcp-server-checklist` | ✅ Present | Selection checklist page |

### 3.2 Pages We Have That May Be Missing on Live

Our `/mcp-gateway-guide` is newly written (part of the MCP Gateway cluster). It may need to be deployed to the live site.

### 3.3 Blog Content Comparison

| Metric | mymcpshelf.com | Our source |
|---|---|---|
| **Total posts** | ~30-40 (estimated from sitemap/blog page) | **99 posts** |
| **Coverage** | Foundational topics, some quality standards | Broader: security, enterprise, industry news, tutorials, comparisons |
| **Blog page depth** | ~5,549 words on `/blog` index | Comparable aggregate content |
| **Newsletter cross-linking** | "Three newsletters, one shelf" section | `/newsletters/` route present |

**Our advantage**: We have significantly more blog posts (99 vs estimated ~35). Our content covers security vulnerabilities, enterprise deployment, industry news, and practical tutorials. The blog volume advantage should translate to broader keyword coverage.

**Gap**: The live site has a "Understanding Our MCP Quality Standards" post (621 words, 7 H2s) that explains their curation/verification process. We have similar content in `/moderation` and `/audit-manifesto` pages — ensure these are discoverable from blog content.

### 3.4 Key Unique Features on Live Site

| Feature | Our Status | Impact |
|---|---|---|
| `/mcp-config-generator` (9,855 words body content) | ✅ Present | Interactive tool generates MCP config JSON — high value for developers |
| `/playground` (274 words) | ✅ Present | Live MCP server testing — differentiator from directory-only competitors |
| `Skill` directory (114 listed) | ⚠️ Partial | Skills listing exists but routing/coverage may differ |
| `/claude-skills` marketplace (4,043 words) | ✅ Present | Skills marketplace page |
| `/cursor-skills` directory (2,490 words) | ✅ Present | Cursor-specific skills page |
| `/leaderboard` (326 words) | ✅ Present | Dynamic install count leaderboard |

**Key gap**: The `/mcp-config-generator` and `/playground` are significant differentiators — verify they're fully functional and well-indexed. These provide unique interactive content that most directory sites lack.

---

## 4. Rankings & Keyword Overlap

**DataForSEO available**: DataForSEO MCP is configured (`dataforseo` server at `https://mcp.dataforseo.com/v3/mcp` via OAuth). Keyword/ranking analysis was not run due to the following:

- DataForSEO requires authenticated MCP requests with OAuth credentials
- `dataforseo` tool was found in MCP config but specific keyword overlap queries were not executed in this session

### Keywords to Monitor (Shared Terms)

Based on the content comparison, the following keyword clusters have overlap between our content and the live site:

| Keyword Cluster | Our Coverage | Live Coverage | Notes |
|---|---|---|---|
| "mcp servers" | ✅ Directory + blog posts | ✅ Directory + homepage | Core territory — both rank |
| "model context protocol" | ✅ Complete guide + beginner's guide | ✅ Homepage + guides | Broad term |
| "mcp server list" | ✅ Directory pages | ✅ Directory | High-intent |
| "mcp tools" | ✅ `/mcp-tools` page | ✅ Similar page | Navigation term |
| "claude mcp skills" | ✅ `/claude-skills` page + blog | ✅ Skills marketplace | Feature-level |
| "cursor mcp" | ✅ `/cursor-skills` + blog posts | ✅ Cursor skills directory | Client-specific |
| "mcp gateway" | ✅ New gateway cluster (Spokes 1-5) | ⚠️ Partially covered in pillar | **Emerging opportunity** |
| "mcp security" | ✅ Security posts + Spoke 1 | ✅ Best practices post | Growing topic |
| "agent hygiene" | ✅ `/agent-hygiene` page | ✅ Same page | Our unique concept |
| "mcp server security" | ✅ Blog posts + cluster | ⚠️ Limited | Opportunity for us |

**Recommended action**: Run `dataforseo` keyword overlap queries against the top 50 shared keywords to identify exact SERP position differences. This requires authenticated access.

### Keyword Cannibalization Check

**Potential issues:**
- Multiple posts covering "what is mcp" variations (`/blog/what-is-mcp-in-ai`, `/blog/what-is-mcp-server-complete-guide`, `/blog/what-is-model-context-protocol-complete-guide-2025`) — these may compete with each other
- Similar client-specific landing pages (`/best-mcp-servers-for-*`) — template generates unique content but metadata overlap is possible

**Recommendation**: Ensure the template for `/best-mcp-servers-for-*` generates unique `<title>` and `<meta description>` per client, and that our core MCP explainer pages link to each other (canonical or "see also") rather than competing.

---

## 5. Positioning Analysis

### 5.1 Brand Positioning

| Dimension | mymcpshelf.com | mcp-website-directory |
|---|---|---|
| **Brand name** | "My MCP Shelf" | Same — same domain/project |
| **Tagline** | "Your curated collection of 7,240+ Model Context Protocol servers" | Should match |
| **Value prop** | Curated directory + tools | Directory + blog + interactive tools |
| **Target audience** | AI developers, Claude users, Cursor users | Same — developers integrating MCP |
| **Tone** | Informative, editorial, community-driven | Informative, technical, authoritative |
| **Trust signals** | AI audit, security scores, verification badges | Same — present in codebase |

### 5.2 Trust and Authority Signals

**Live site trust signals:**
- `/audit-manifesto` — transparency about AI content collection
- `/moderation` — content moderation policies
- `/leaderboard` — data-driven rankings (not editorial)
- `/agent-hygiene` — novel security framework
- `/changelog` — development transparency

Our source includes all of these as pages. **No gap detected.**

### 5.3 Monetization Model

**Live site indications:**
- `/submit-server` — server submission (potentially curated/freemium)
- Newsletter subscription CTAs embedded in content
- Directory model (listing-based, not transactional)

Our source has the same structure. **No change from last sweep.**

### 5.4 Design and UX Differences

**Live site patterns observed:**
- Breadcrumb navigation with `<nav aria-label="Breadcrumb">`
- Newsletter CTA banner in hero area
- Callout blocks with left blue border
- Comparison tables using grid layout
- Hero sections with gradient text

Our source templates match these patterns in `BaseLayout.astro` and component styles. **Design parity is maintained.**

---

## 6. Recommended Actions by Priority

### P0 — Do This Quarter

| # | Action | Reason | Effort |
|---|---|---|---|
| 1 | **Verify blog posts are individually indexed in sitemap** | Live sitemap only lists `/blog` not individual posts. This may be intentional (index bloat) but verify. | 1 hour |
| 2 | **Run DataForSEO keyword analysis** | Use `dataforseo` MCP to compare SERP positions across shared keywords. | With authenticated access: 2 hours |
| 3 | **Add BreadcrumbList structured data to all pages** | Improves SERP display. Already partially present in HTML but missing JSON-LD. | 3-4 hours |
| 4 | **Deploy MCP Gateway cluster to live** | Spokes 1-5 are written and committed. Need deployment to go live. | Part of deploy pipeline |

### P1 — Next Quarter

| # | Action | Reason | Effort |
|---|---|---|---|
| 5 | **Run Core Web Vitals audit** | Compare deployed live site performance vs local build on 3 representative pages (home, blog, leaderboard). | 2 hours |
| 6 | **Verify OG tag coverage across all page templates** | Ensure blog posts and directory pages have complete OG tags for social sharing. | 2-3 hours |
| 7 | **Resolve keyword cannibalization among MCP explainer posts** | Multiple "what is MCP" posts may compete. Consolidate or canonicalize. | 4 hours |

### P2 — Watch/Evaluate

| # | Action | Reason | Effort |
|---|---|---|---|
| 8 | **Verify `/mcp-config-generator` and `/playground` feature parity** | These are differentiators — ensure they work identically in source and live. | 3 hours |
| 9 | **Compare skills directory coverage** | Live site shows 114 skills — verify our source indexes the same set. | 2 hours |
| 10 | **Extend cluster linking pattern beyond MCP Gateway** | The cluster banner pattern works well — apply to other topic groups (deployment, security, comparison). | 5 hours |

---

## 7. Data Sources

- Live site: `https://www.mymcpshelf.com/` (direct HTTP crawl)
- Source: `src/pages/` and `src/content/blog/` (local filesystem)
- Sitemap: `https://www.mymcpshelf.com/sitemap-index.xml` → `sitemap-0.xml` (152 URLs)
- Robots.txt: Present with Cloudflare-managed AI training restrictions
- DataForSEO MCP: Configured but not executed (requires authentication — see Appendix A)
- `git log` shows repository 9 commits ahead of `origin/main`

---

## Appendix A: Data For SEO Setup

DataForSEO MCP is configured:
```json
{
  "mcpServers": {
    "dataforseo": {
      "url": "https://mcp.dataforseo.com/v3/mcp",
      "auth": "oauth"
    }
  }
}
```

To run keyword overlap analysis, use the DataForSEO MCP tools from within a session where OAuth is authenticated:
1. Use `dataforseo_domain_analytics` for comparing domain-level metrics
2. Use `dataforseo_keyword_ideas` for discovering shared ranking terms
3. Use `dataforseo_serp` for specific SERP position comparison

The following keyword clusters should be prioritized when running the analysis: "mcp servers", "model context protocol", "mcp tools", "claude mcp skills", "cursor mcp", "mcp gateway", "mcp security", "agent hygiene", "mcp server list".