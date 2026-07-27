# Recall History — mcp-website-directory


## Session 6ec08f7c — 2026-07-27 12:35

**You:** mymcpshelf.com Content & Site Strategy — Summary
Content migration decisions

* OSS tool evaluations (formerly published on Medium under the Opensourcescribes publication) move to mymcpshelf.com going forward. Existing Medium posts stay live as-is; no new Opensourcescribes content gets published on Medium.
* Fit-checked as reference examples during this process: Skybridge (alpic-ai) — strong fit as an OSS/framework blog spotlight (MCP Apps framework, active, well-documented). MemPalace — strong fit, ships an actual MCP server with 36 tools, ideal directory + blog candidate. jcode (1jehuang) — fits as an MCP client listing, not a server. odysseus-dev/odysseus — possible MCP-client fit, but flagged a README discrepancy (clone URL, homepage, and star-history badge all reference a different GitHub account, "pewdiepie-archdaemon") worth verifying before featuring. NVIDIA/cosmos and antirez/ds4 — no MCP relevance, don't fit regardless of project quality.

Medium / follower findings

* Medium never exposes follower emails to writers. The ~6,100 Medium followers cannot be exported or emailed directly — the only lever is a farewell/redirect post published on Medium itself, since it still reaches followers' feeds/notifications.
* The legacy email-subscriber list (~250) is exportable via Settings → Security and apps → Download your information — but only subscribers who opted in before Medium's May 2025 policy change are exportable; anyone who subscribed after that date is not.
* Recommendation: re-warm that legacy list with one short "here's what's changing" email before folding it into regular sends, to protect sender/deliverability reputation.

Distribution channel plan

* Keep Reddit + LinkedIn (already planned by the user).
* Add Hacker News as the strongest single new channel for developer-tool content specifically — heavily cited by AI answer engines for technical queries, and capable of real traffic spikes.
* dev.to as a secondary, low-effort cross-post (canonical link back to mymcpshelf), same pattern recommended for any Medium cross-posting.
* Substack: not a distribution channel to casually revive — if brought back, treat it as a dormant-list reactivation project (send one short re-intro email first to protect deliverability) rather than assuming the old subscribers are still warm.

Newsletter / Ghost / Beehiiv decisions

* Brainscriblr.world (running on Ghost, linking out to Beehiiv) is too new a domain to carry meaningful SEO weight on its own. Decision: migrate its content into mymcpshelf.com rather than keep growing a separate site.
* Ghost is being dropped in favor of Beehiiv as the sole newsletter engine. Ghost's cost driver is Mailgun's per-email sending fee; Beehiiv bundles sending for free up to 2,500 subscribers and includes growth/discovery tools (recommendation network, boosts marketplace) Ghost doesn't offer.
* Migration mechanics: export Ghost content via Settings → Labs → Export your content (JSON), convert into whatever format mymcpshelf's blog pipeline expects, then 301-redirect the Brainscriblr.world domain once content is ported. Little SEO equity exists to preserve given the domain's age, so this is mainly a content-porting job, not a delicate SEO migration.
* Final call on newsletter count: keep 3 separate Beehiiv publications tied to mymcpshelf — AI Newsletter / "AI Field Notes" (Brainscriblr, broader AI commentary), OSS Newsletter / "OSS Spotlight" (Opensourcescribes-style tool evaluations), and "Signal Field" (data/infrastructure news — a genuinely distinct audience/topic). Beehiiv publications are fully separate subscriber lists with no automatic cross-pollination, confirmed — this was a deliberate choice to keep 3 real publications rather than consolidate into one tagged list.

Site information architecture (mymcpshelf.com)
Three top-level pillars, unchanged directory + expanded content layer:

1. MCP Directory — existing server/category listings, unchanged.
2. Tools/Utilities — existing resource pages (Topic Stacks, Leaderboard, Config Generator, Agent Skills, Cursor Skills, MCP Clients, AI-search API/MCP server) — unchanged, but recognized as its own IA bucket distinct from written content.
3. Blog/Content — expanded to carry three tagged content tracks corresponding to the three newsletters: OSS Spotlight, Signal Field, AI Field Notes — plus existing content types (server/tool spotlights like Jetski/MCP Operator, and how-to/educational posts).
4. Newsletter — three separate Beehiiv publications, each fed from its corresponding blog track via a dedicated RSS feed.

Content publishing policy

* Publish full articles on mymcpshelf.com — no teasers or summaries gating content behind email signup. Gated content undermines the SEO/AI-citation strategy this whole plan depends on, and Hacker News/Reddit (the two primary planned distribution channels) actively penalize teaser/paywall-style links.
* Subscribe incentive instead: give email subscribers early access — a post goes to its matching Beehiiv track a day or so before it's published publicly on the site — rather than withholding content permanently.

Design/UX principle for the redesign

* The current homepage is visually dense (stacked badges/stats on every server card, mega-nav, FAQ, comparison links). That density doesn't actually serve AI legibility — a crawler parsing rendered HTML faces the same clutter a human reader does.
* What actually serves AI legibility is structured data living separately from the rendered page: schema.org/JSON-LD markup, llms.txt, the JSON feed/sitemap, and the AI-search API.
* Recommendation: push exhaustive facts (transport type, auth type, security score, verified status, etc.) into structured metadata and/or detail pages, and simplify the human-facing list/card view via progressive disclosure. Use this redesign pass to declutter, not to add more visual density on top of the existing page.

Next step
Strategy/planning is done here. Actual implementation (new content collections, filter UI, subscribe components, nav changes, per-track RSS feeds, structured data, Ghost migration) should happen in Claude Code against the live mymcpshelf repo, not in this environment. Claude Code Build Brief — mymcpshelf.com Redesign
Context
mymcpshelf.com is an MCP (Model Context Protocol) server/client/skill directory with an existing blog (byline "Buzz"). Public site metadata suggests it's built on Astro — verify this against the actual repo before proceeding, along with confirming how existing blog content is authored/stored (markdown/MDX content collections, headless CMS, hardcoded pages, etc.), since the plan below assumes a markdown/MDX-based blog pipeline. Correct the plan if the real stack differs.
Goal
Extend the site to support three new editorial content tracks, each tied to its own separate Beehiiv newsletter publication, without adding visual clutter to the existing directory pages and without hurting SEO/AI-search legibility.
Decisions already made — implement, don't relitigate

* Three separate Beehiiv publications exist/will exist, each with its own subscriber list: OSS Spotlight (open-source tool evaluations, migrating from a Medium publication called Opensourcescribes), Signal Field (data/infrastructure news, a distinct audience/topic from the other two), and AI Field Notes (broader AI commentary, migrating from a Ghost+Beehiiv site at Brainscriblr.world).
* All blog content publishes in full on the site — no teasers, no gating content behind email signup. Do not build any paywall/metering mechanism.
* The directory's server-listing cards are currently too dense for human readers. The fix is progressive disclosure (compact card view, full metadata on the server's detail page and/or in structured data), not deleting information.

Tasks

1. Content taxonomy. Add a "track" field/tag to blog content: `oss-spotlight`, `signal-field`, `ai-field-notes`, plus whatever scheme already covers existing content (server/tool spotlights like the Jetski/MCP Operator/Semiotic posts, and how-to/educational posts like "How to Choose an MCP Server"). Inspect and extend the existing scheme rather than replacing it.
2. Blog index filtering. Add a filter bar/control on the blog index page so visitors can filter by track. Keep it lightweight — chips or a dropdown, not a new page template.
3. Per-track RSS feeds. Since each newsletter is a separate Beehiiv publication with its own list, generate a distinct RSS feed per track (e.g. `/rss/oss-spotlight.xml`, `/rss/signal-field.xml`, `/rss/ai-field-notes.xml`) in addition to (or replacing, if appropriate) any existing sitewide feed, so each Beehiiv publication can auto-import from its matching feed.
4. Subscribe components. Add a subscribe CTA to each blog post matching its track (an OSS Spotlight post shows "Subscribe to OSS Spotlight," pointing at that specific Beehiiv publication — not a generic sitewide signup). Also add a combined newsletter picker somewhere prominent (e.g. a `/newsletters` page or new nav item) where visitors can see and choose among all three publications.
5. Progressive disclosure on directory cards. Reduce default visible metadata per server card to name, one-line description, stars, category. Move the rest (transport type, auth type, security score, verified badge, hosting model, etc.) to the server's detail page and/or structured data — relocate, don't delete.
6. Structured data / AI legibility. Audit whether server listings and blog posts currently carry schema.org/JSON-LD markup. If not, add it (SoftwareApplication schema for servers, Article schema for blog posts) so machine-readable facts live in structured data rather than depending on visual page density. Confirm llms.txt, the JSON feed, and sitemap.xml stay current as new tracks/URLs are added.
7. Nav update. Add a "Newsletter" entry to the top-level nav (distinct from "Blog" under Resources), since it serves a different job — subscriber capture — than the rest of the site.
8. Ghost migration. Export Brainscriblr.world's content via Ghost's Settings → Labs → Export your content (JSON export of all posts). Convert into this site's content format and import, tagging each post by its actual topic (not everything from Brainscriblr is necessarily `ai-field-notes` — check per post). Set up a 301 redirect from brainscriblr.world to the corresponding mymcpshelf.com URLs (or to the site root if a clean per-post mapping isn't practical) once migrated.

Constraints

* Don't restructure the existing MCP directory pages (server listings, category pages) beyond Task 5's card simplification — the directory works and shouldn't change structurally.
* Don't introduce a new CMS/backend dependency if the current site is static-generated, unless truly necessary — prefer content-collection/markdown authoring consistent with the existing blog's pattern.
* Inspect the actual repo structure first rather than assuming anything above — ask before guessing if something doesn't match. these are 2 documents explaining/summarizing a discussion that took place with cowork. i want to refactor/rebuild the website as i am moving off of Medium for most of my work. please enter plan mode if there is such a feature and help me to create a plan to implement. read the code, show me the problems with the pivot build and help me to understand what would be good to change in the spec to make the new build eaiser and show me the blockers as well.

**Claude:** I'll enter plan mode as requested, then locate and read the mymcpshelf repo before critiquing the build brief.
  - `ToolSearch: select:EnterPlanMode,ExitPlanMode`
  - `EnterPlanMode`
  - `Bash: ls -d ~/CascadeProjects/*/ ~/Projects/*/ ~/*/ 2>/dev/null | grep -iE 'mcp|shelf' ; mdfind -name mymcpshelf 2>/dev/null | head -5`
  - `Bash: ls ~/CascadeProjects/ 2>/dev/null; echo ---; grep -rl "mymcpshelf" ~/CascadeProjects/*/package.json ~/CascadeProjects/*/astro.config.* 2>/dev/null; echo ---; md`
  - `Agent: Explore mymcpshelf repo structure`
  - `Agent: Explore brainscirblr and signalfield repos`
  - `ToolSearch: select:WebSearch`
  - `WebSearch: beehiiv RSS to email automation auto import posts from RSS feed`
  - `AskUserQuestion`
  - `Write: /Users/chesterbeard/.claude/plans/enchanted-shimmying-kurzweil.md`

**Claude:** The plan is written, including the spec critique and blockers you asked for. Quick TLDR of what the code review turned up:

**Biggest gaps between the brief and the real repo:**
- The blog schema silently drops frontmatter fields — `category`, `draft`, `featured` are all invisible today (one draft post is live right now). "Extend the taxonomy" is really "fix it first."
- There is **no blog RSS at all** — the only feed is a directory-activity feed. Per-track feeds are greenfield (which is easier, not harder).
- **Beehiiv RSS-to-Send requires the Max/Enterprise plan** — the "free up to 2,500 subs" tier can't auto-import from your feeds. Manual posting or a Zapier bridge unless you upgrade. ([beehiiv RSS-to-Send](https://www.beehiiv.com/features/rss-to-send), [beehiiv RSS help](https://www.beehiiv.com/support/article/9363537272215-how-to-enable-and-use-rss))
- The site already has **three dead/conflicting subscribe systems** (Ghost embed on every page, a fake form that console.logs emails, a 410'd Beehiiv endpoint).
- **No Brainscriblr Ghost export exists on this machine** — `~/CascadeProjects/brainscirblr` is an empty typo'd folder; the content lives only in the live Railway Ghost instance. That's your blocker to unblock.
- Server detail pages are all noindex'd — resolved per your answer with the middle path: keep GSC clean, put machine-readable facts in `ItemList` JSON-LD on listing pages + expanded `llms.txt` + the existing API, and drop the fabricated `aggregateRating` (invented review counts in JSON-LD — a spam signal).

**Your four action items outside the code:** export Ghost content, create the 3 Beehiiv publications (need embed IDs), decide on the Beehiiv plan tier, and later the brainscriblr.world 301 in Cloudflare.
  - `ExitPlanMode: # mymcpshelf.com — Content Tracks, Newsletters & Card Declutter **Repo:** `~/CascadeProjects/mcp-website-directory` (Astro 5, SSR-by-default, Cloudflare Pages +`

**Claude:** Plan approved — starting implementation. Phase 1 first: the content pipeline.
  - `Read: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/content/config.ts`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && head -20 src/content/blog/cursor-agent-skills-guide.mdx src/content/blog/cursor-mcp-servers.mdx src/content/blog/h`
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/content/config.ts`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/content/blog/cursor-agent-skills-guide.mdx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/content/blog/cursor-mcp-servers.mdx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/content/blog/how-to-use-skills-in-cursor.mdx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/content/blog/sustainable-marketing-mcp-stack.mdx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/content/blog/jetski-spotlight.mdx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/content/blog/mcp-operator-kubernetes-native-deployment.mdx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/content/blog/semiotic-mcp-server.mdx`

**Claude:** Now the blog pages — read the three consumers to add draft filtering, the track filter, and JSON-LD.
  - `Read: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/blog.astro`
  - `Read: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/blog/[...slug].astro`
  - `Read: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/FeaturedArticles.astro`
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/data/newsletters.ts`

**Claude:** Now the blog index — draft filtering, track filter chips, and JSON-LD:
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/blog.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/blog.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/blog.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/blog.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/blog.astro`
  - `Read: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/layouts/BaseLayout.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/layouts/BaseLayout.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/layouts/BaseLayout.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/layouts/BaseLayout.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/layouts/BaseLayout.astro`
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/TrackSubscribe.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/blog/[...slug].astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/blog/[...slug].astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/blog/[...slug].astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/FeaturedArticles.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/FeaturedArticles.astro`

**Claude:** Phases 1–2 done. Phase 3: RSS feeds.
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && pnpm add @astrojs/rss 2>&1 | tail -3`
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/utils/blogFeed.ts`
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/rss.xml.ts`
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/rss/oss-spotlight.xml.ts`
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/rss/signal-field.xml.ts`
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/rss/ai-field-notes.xml.ts`
  - `Read: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/EmailSignup.astro`
  - `Read: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/HeaderNewsletter.astro`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && sed -n '1,95p' src/components/Navbar.astro && grep -rn "HeaderNewsletter" src --include="*.astro" -l`
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/EmailSignup.astro`

**Claude:** Now `HeaderNewsletter` — the fake form becomes an honest link to `/newsletters`:
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/HeaderNewsletter.astro`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && rm src/pages/api/subscribe.ts src/utils/ghostApi.js && grep -rn "ghostApi\|api/subscribe" src scripts --include="*`

**Claude:** Dead files removed with zero references. Now the `/newsletters` page:
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/newsletters.astro`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && sed -n '95,200p' src/components/Navbar.astro`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && grep -n -A 20 "\.enterprise-cta {" src/components/Navbar.astro | head -30`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/Navbar.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/Navbar.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/Navbar.astro`
  - `ToolSearch: select:mcp__gitnexus__impact`
  - `mcp__gitnexus__impact: ServerCard`
  - `mcp__gitnexus__impact: ServerCard`
  - `Read: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/ServerGrid.tsx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/ServerGrid.tsx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/ServerGrid.tsx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/ServerGrid.tsx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/ServerGrid.tsx`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/ServerGrid.tsx`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && grep -n "getCategoryDisplayName" src/utils/serverData.js | head -2 && grep -n "formatInstalls\|getReliabilityColor`

**Claude:** Clean. Phase 6 — structured data. Reading the server detail JSON-LD, homepage, category page, and llms.txt:
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && sed -n '195,245p' src/pages/server/[slug].astro && echo ===INDEX=== && grep -n "structuredData\|BaseLayout" src/pa`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && sed -n '195,245p' 'src/pages/server/[slug].astro' && echo ===INDEX=== && grep -n "structuredData\|BaseLayout" src/`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && sed -n '245,270p' 'src/pages/server/[slug].astro'; echo "===INDEX==="; grep -n 'structuredData\|BaseLayout' src/pa`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && sed -n '210,218p' 'src/pages/server/[slug].astro'; echo "---indexctx---"; sed -n '60,100p' src/pages/index.astro;`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/server/[slug].astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/server/[slug].astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/index.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/category/[slug].astro`
  - `Read: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/llms.txt.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/pages/llms.txt.astro`

**Claude:** Phase 7 — the Ghost import script (runnable once the export exists):
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && pnpm add -D turndown 2>&1 | tail -2`
  - `Write: /Users/chesterbeard/CascadeProjects/mcp-website-directory/scripts/import-ghost-export.mjs`

**Claude:** All phases implemented. Now verifying with a build:
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && pnpm build 2>&1 | tail -30`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && ls dist/rss.xml dist/rss/ dist/newsletters/ 2>&1; echo "---draft check---"; ls dist/blog/ | grep -c . ; ls dist/bl`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && echo "---post JSON-LD---"; grep -o 'application/ld+json[^<]*' dist/blog/jetski-spotlight/index.html | head -c 400;`
  - `Write: /Users/chesterbeard/.claude/launch.json`
  - `Read: /Users/chesterbeard/.claude/launch.json`
  - `Edit: /Users/chesterbeard/.claude/launch.json`
  - `mcp__Claude_Browser__preview_start: mymcpshelf`
  - `mcp__Claude_Browser__navigate: http://localhost:4323/blog`
  - `mcp__Claude_Browser__preview_logs: 5390f23e-ec34-4402-91b9-87deec203146`

**Claude:** Server started on 4321 instead — pnpm passed the `--` literal through. Fixing the launch args:
  - `mcp__Claude_Browser__preview_stop: 5390f23e-ec34-4402-91b9-87deec203146`
  - `Edit: /Users/chesterbeard/.claude/launch.json`
  - `mcp__Claude_Browser__preview_start: mymcpshelf`
  - `mcp__Claude_Browser__navigate: http://localhost:4323/blog`
  - `mcp__Claude_Browser__computer: screenshot`
  - `mcp__Claude_Browser__computer: scroll`
  - `mcp__Claude_Browser__read_page: tab-1`
  - `mcp__Claude_Browser__computer: left_click`
  - `mcp__Claude_Browser__javascript_tool: javascript_exec`
  - `mcp__Claude_Browser__navigate: http://localhost:4323/newsletters`
  - `mcp__Claude_Browser__computer: screenshot`
  - `mcp__Claude_Browser__navigate: http://localhost:4323/`
  - `mcp__Claude_Browser__computer: scroll`

**Claude:** You've hit your monthly spend limit. Run /usage-credits to manage your limit and keep using Fable 5 or switch models to continue this chat.

**You:** Continue from where you left off.

**Claude:** No response requested.

**You:** mymcpshelf.com Content & Site Strategy — Summary
Content migration decisions

* OSS tool evaluations (formerly published on Medium under the Opensourcescribes publication) move to mymcpshelf.com going forward. Existing Medium posts stay live as-is; no new Opensourcescribes content gets published on Medium.
* Fit-checked as reference examples during this process: Skybridge (alpic-ai) — strong fit as an OSS/framework blog spotlight (MCP Apps framework, active, well-documented). MemPalace — strong fit, ships an actual MCP server with 36 tools, ideal directory + blog candidate. jcode (1jehuang) — fits as an MCP client listing, not a server. odysseus-dev/odysseus — possible MCP-client fit, but flagged a README discrepancy (clone URL, homepage, and star-history badge all reference a different GitHub account, "pewdiepie-archdaemon") worth verifying before featuring. NVIDIA/cosmos and antirez/ds4 — no MCP relevance, don't fit regardless of project quality.

Medium / follower findings

* Medium never exposes follower emails to writers. The ~6,100 Medium followers cannot be exported or emailed directly — the only lever is a farewell/redirect post published on Medium itself, since it still reaches followers' feeds/notifications.
* The legacy email-subscriber list (~250) is exportable via Settings → Security and apps → Download your information — but only subscribers who opted in before Medium's May 2025 policy change are exportable; anyone who subscribed after that date is not.
* Recommendation: re-warm that legacy list with one short "here's what's changing" email before folding it into regular sends, to protect sender/deliverability reputation.

Distribution channel plan

* Keep Reddit + LinkedIn (already planned by the user).
* Add Hacker News as the strongest single new channel for developer-tool content specifically — heavily cited by AI answer engines for technical queries, and capable of real traffic spikes.
* dev.to as a secondary, low-effort cross-post (canonical link back to mymcpshelf), same pattern recommended for any Medium cross-posting.
* Substack: not a distribution channel to casually revive — if brought back, treat it as a dormant-list reactivation project (send one short re-intro email first to protect deliverability) rather than assuming the old subscribers are still warm.

Newsletter / Ghost / Beehiiv decisions

* Brainscriblr.world (running on Ghost, linking out to Beehiiv) is too new a domain to carry meaningful SEO weight on its own. Decision: migrate its content into mymcpshelf.com rather than keep growing a separate site.
* Ghost is being dropped in favor of Beehiiv as the sole newsletter engine. Ghost's cost driver is Mailgun's per-email sending fee; Beehiiv bundles sending for free up to 2,500 subscribers and includes growth/discovery tools (recommendation network, boosts marketplace) Ghost doesn't offer.
* Migration mechanics: export Ghost content via Settings → Labs → Export your content (JSON), convert into whatever format mymcpshelf's blog pipeline expects, then 301-redirect the Brainscriblr.world domain once content is ported. Little SEO equity exists to preserve given the domain's age, so this is mainly a content-porting job, not a delicate SEO migration.
* Final call on newsletter count: keep 3 separate Beehiiv publications tied to mymcpshelf — AI Newsletter / "AI Field Notes" (Brainscriblr, broader AI commentary), OSS Newsletter / "OSS Spotlight" (Opensourcescribes-style tool evaluations), and "Signal Field" (data/infrastructure news — a genuinely distinct audience/topic). Beehiiv publications are fully separate subscriber lists with no automatic cross-pollination, confirmed — this was a deliberate choice to keep 3 real publications rather than consolidate into one tagged list.

Site information architecture (mymcpshelf.com)
Three top-level pillars, unchanged directory + expanded content layer:

1. MCP Directory — existing server/category listings, unchanged.
2. Tools/Utilities — existing resource pages (Topic Stacks, Leaderboard, Config Generator, Agent Skills, Cursor Skills, MCP Clients, AI-search API/MCP server) — unchanged, but recognized as its own IA bucket distinct from written content.
3. Blog/Content — expanded to carry three tagged content tracks corresponding to the three newsletters: OSS Spotlight, Signal Field, AI Field Notes — plus existing content types (server/tool spotlights like Jetski/MCP Operator, and how-to/educational posts).
4. Newsletter — three separate Beehiiv publications, each fed from its corresponding blog track via a dedicated RSS feed.

Content publishing policy

* Publish full articles on mymcpshelf.com — no teasers or summaries gating content behind email signup. Gated content undermines the SEO/AI-citation strategy this whole plan depends on, and Hacker News/Reddit (the two primary planned distribution channels) actively penalize teaser/paywall-style links.
* Subscribe incentive instead: give email subscribers early access — a post goes to its matching Beehiiv track a day or so before it's published publicly on the site — rather than withholding content permanently.

Design/UX principle for the redesign

* The current homepage is visually dense (stacked badges/stats on every server card, mega-nav, FAQ, comparison links). That density doesn't actually serve AI legibility — a crawler parsing rendered HTML faces the same clutter a human reader does.
* What actually serves AI legibility is structured data living separately from the rendered page: schema.org/JSON-LD markup, llms.txt, the JSON feed/sitemap, and the AI-search API.
* Recommendation: push exhaustive facts (transport type, auth type, security score, verified status, etc.) into structured metadata and/or detail pages, and simplify the human-facing list/card view via progressive disclosure. Use this redesign pass to declutter, not to add more visual density on top of the existing page.

Next step
Strategy/planning is done here. Actual implementation (new content collections, filter UI, subscribe components, nav changes, per-track RSS feeds, structured data, Ghost migration) should happen in Claude Code against the live mymcpshelf repo, not in this environment. Claude Code Build Brief — mymcpshelf.com Redesign
Context
mymcpshelf.com is an MCP (Model Context Protocol) server/client/skill directory with an existing blog (byline "Buzz"). Public site metadata suggests it's built on Astro — verify this against the actual repo before proceeding, along with confirming how existing blog content is authored/stored (markdown/MDX content collections, headless CMS, hardcoded pages, etc.), since the plan below assumes a markdown/MDX-based blog pipeline. Correct the plan if the real stack differs.
Goal
Extend the site to support three new editorial content tracks, each tied to its own separate Beehiiv newsletter publication, without adding visual clutter to the existing directory pages and without hurting SEO/AI-search legibility.
Decisions already made — implement, don't relitigate

* Three separate Beehiiv publications exist/will exist, each with its own subscriber list: OSS Spotlight (open-source tool evaluations, migrating from a Medium publication called Opensourcescribes), Signal Field (data/infrastructure news, a distinct audience/topic from the other two), and AI Field Notes (broader AI commentary, migrating from a Ghost+Beehiiv site at Brainscriblr.world).
* All blog content publishes in full on the site — no teasers, no gating content behind email signup. Do not build any paywall/metering mechanism.
* The directory's server-listing cards are currently too dense for human readers. The fix is progressive disclosure (compact card view, full metadata on the server's detail page and/or in structured data), not deleting information.

Tasks

1. Content taxonomy. Add a "track" field/tag to blog content: `oss-spotlight`, `signal-field`, `ai-field-notes`, plus whatever scheme already covers existing content (server/tool spotlights like the Jetski/MCP Operator/Semiotic posts, and how-to/educational posts like "How to Choose an MCP Server"). Inspect and extend the existing scheme rather than replacing it.
2. Blog index filtering. Add a filter bar/control on the blog index page so visitors can filter by track. Keep it lightweight — chips or a dropdown, not a new page template.
3. Per-track RSS feeds. Since each newsletter is a separate Beehiiv publication with its own list, generate a distinct RSS feed per track (e.g. `/rss/oss-spotlight.xml`, `/rss/signal-field.xml`, `/rss/ai-field-notes.xml`) in addition to (or replacing, if appropriate) any existing sitewide feed, so each Beehiiv publication can auto-import from its matching feed.
4. Subscribe components. Add a subscribe CTA to each blog post matching its track (an OSS Spotlight post shows "Subscribe to OSS Spotlight," pointing at that specific Beehiiv publication — not a generic sitewide signup). Also add a combined newsletter picker somewhere prominent (e.g. a `/newsletters` page or new nav item) where visitors can see and choose among all three publications.
5. Progressive disclosure on directory cards. Reduce default visible metadata per server card to name, one-line description, stars, category. Move the rest (transport type, auth type, security score, verified badge, hosting model, etc.) to the server's detail page and/or structured data — relocate, don't delete.
6. Structured data / AI legibility. Audit whether server listings and blog posts currently carry schema.org/JSON-LD markup. If not, add it (SoftwareApplication schema for servers, Article schema for blog posts) so machine-readable facts live in structured data rather than depending on visual page density. Confirm llms.txt, the JSON feed, and sitemap.xml stay current as new tracks/URLs are added.
7. Nav update. Add a "Newsletter" entry to the top-level nav (distinct from "Blog" under Resources), since it serves a different job — subscriber capture — than the rest of the site.
8. Ghost migration. Export Brainscriblr.world's content via Ghost's Settings → Labs → Export your content (JSON export of all posts). Convert into this site's content format and import, tagging each post by its actual topic (not everything from Brainscriblr is necessarily `ai-field-notes` — check per post). Set up a 301 redirect from brainscriblr.world to the corresponding mymcpshelf.com URLs (or to the site root if a clean per-post mapping isn't practical) once migrated.

Constraints

* Don't restructure the existing MCP directory pages (server listings, category pages) beyond Task 5's card simplification — the directory works and shouldn't change structurally.
* Don't introduce a new CMS/backend dependency if the current site is static-generated, unless truly necessary — prefer content-collection/markdown authoring consistent with the existing blog's pattern.
* Inspect the actual repo structure first rather than assuming anything above — ask before guessing if something doesn't match. these are 2 documents explaining/summarizing a discussion that took place with cowork. i want to refactor/rebuild the website as i am moving off of Medium for most of my work. please enter plan mode if there is such a feature and help me to create a plan to implement. read the code, show me the problems with the pivot build and help me to understand what would be good to change in the spec to make the new build eaiser and show me the blockers as well.

**Claude:** You've hit your monthly spend limit. Run /usage-credits to manage your limit and keep using Fable 5 or switch models to continue this chat.

**You:** <local-command-caveat>Caveat: The messages below were generated by the user while running local commands. DO NOT respond to these messages or otherwise consider them in your response unless the user explicitly asks you to.</local-command-caveat>

**You:** continue

**Claude:** Continuing verification — checking the decluttered server cards on the homepage.
  - `mcp__Claude_Browser__computer: scroll`
  - `mcp__Claude_Browser__preview_start: mymcpshelf`
  - `mcp__Claude_Browser__javascript_tool: javascript_exec`
  - `mcp__Claude_Browser__javascript_tool: javascript_exec`

**Claude:** The main directory grid is correctly simplified. But there are 12 more cards on the homepage from a different component — checking that one:
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && grep -n "meta-tag\|Official\|Community\|language\|security\|badge\|Badge" src/components/FeaturedMcpServers.astro`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && sed -n '165,185p' src/components/FeaturedMcpServers.astro`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && sed -n '1,12p' src/components/FeaturedMcpServers.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/FeaturedMcpServers.astro`
  - `Edit: /Users/chesterbeard/CascadeProjects/mcp-website-directory/src/components/FeaturedMcpServers.astro`
  - `mcp__Claude_Browser__navigate: http://localhost:4323/`
  - `mcp__Claude_Browser__javascript_tool: javascript_exec`
  - `mcp__Claude_Browser__read_console_messages: seed`
  - `mcp__Claude_Browser__javascript_tool: javascript_exec`
  - `mcp__Claude_Browser__computer: screenshot`
  - `mcp__Claude_Browser__resize_window: desktop`
  - `mcp__Claude_Browser__javascript_tool: javascript_exec`
  - `mcp__Claude_Browser__computer: screenshot`

**Claude:** Screenshots are pinned to a narrow viewport, but DOM inspection already confirmed the card contents. Running the final production build:
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && pnpm build 2>&1 | grep -iE "error|warn|✗|failed|Complete|fix-routes" | head -20`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && echo "=== FEEDS ==="; for f in dist/rss.xml dist/rss/oss-spotlight.xml dist/rss/signal-field.xml dist/rss/ai-field`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && echo "=== ItemList on homepage ==="; grep -o '"@type":"ItemList"' dist/index.html | head -1; echo "=== Article on`

**Claude:** Homepage is SSR so it isn't in `dist` — verifying its JSON-LD via the dev server instead:
  - `Bash: curl -s http://localhost:4323/ | grep -o '"@type":"ItemList".\{0,220\}' | head -c 400; echo; echo "--- category page ---"; curl -s http://localhost:4323/categor`
  - `Bash: cd ~/CascadeProjects/mcp-website-directory && git diff --stat | tail -5; echo "--- ServerGrid line count ---"; wc -l src/components/ServerGrid.tsx`
  - `mcp__Claude_Browser__preview_stop: 9f089010-14f7-434b-b18b-3d72b4149181`
  - `Write: /Users/chesterbeard/.claude/projects/-Users-chesterbeard/memory/project_mymcpshelf_tracks.md`
  - `Read: /Users/chesterbeard/.claude/projects/-Users-chesterbeard/memory/MEMORY.md`
  - `Edit: /Users/chesterbeard/.claude/projects/-Users-chesterbeard/memory/MEMORY.md`

**Claude:** The build is done and verified. **425 lines added, 662 deleted** — it's a net deletion, which is the right shape for a declutter.

## What shipped

**Content pipeline fixed first.** The schema in [config.ts](CascadeProjects/mcp-website-directory/src/content/config.ts) was silently discarding every frontmatter field it didn't declare. It now accepts `track`, `category`, `draft`, and `featured`. Consequences of that fix: your draft post `cursor-mcp-servers.mdx` was publicly live and is now correctly excluded (55 published, down from 56), and the four posts using `pubDate`/`publishDate` — which had been silently dated to January 2024 and buried at the bottom of the blog — now carry their real dates.

**Three tracks with working feeds.** `/rss.xml` (55 items), `/rss/oss-spotlight.xml` (3 items: Jetski, MCP Operator, Semiotic), plus signal-field and ai-field-notes feeds standing by empty and valid, ready for content. The blog index has filter chips that deep-link (`/blog?track=oss-spotlight`) with no JS framework involved — just a `hidden` toggle over `data-track`.

**Cards went from 13 badge rows to 4 elements.** A directory card is now name, author, one-line description, category, stars, and the single consolidated trust badge. `ServerGrid.tsx` dropped from 493 to 300 lines, and removing `CommunityBadge`/`SecurityBadge` from cards eliminated two client-side fetches *per card* — 48 fewer network requests on a full listing page. I also aligned the homepage's featured carousel, which was a second card style showing a meaningless "Official" badge (derived from whether the author string contains `@`, which every author does).

**Structured data.** `Article` schema on posts with `og:type=article`, `Blog` on the index, `ItemList` on the homepage and category pages. I removed the fabricated `aggregateRating` from server pages — it was inventing star ratings and review counts from GitHub stars, which is a structured-data spam signal regardless of the noindex.

**Subscribe path consolidated.** The Ghost embed, the fake form that only `console.log`'d emails, and the 410'd endpoint are all gone, replaced by a `/newsletters` picker, per-post CTAs matched to track, and a top-level Newsletter nav item. All embed URLs live in one file, [newsletters.ts](CascadeProjects/mcp-website-directory/src/data/newsletters.ts) — that's the single place to paste Beehiiv IDs.

## What you need to do

The Ghost importer at [import-ghost-export.mjs](CascadeProjects/mcp-website-directory/scripts/import-ghost-export.mjs) is written and takes `--dry-run`, but **I could not test it** — no Brainscriblr export exists anywhere on this machine, and the directory you'd expect it in (`~/CascadeProjects/brainscirblr`) is empty with a typo in its name. Pull the export from your Railway Ghost admin and run it.

Then: create the three Beehiiv publications for their embed IDs, and decide the Beehiiv plan question — RSS-to-Send needs Max/Enterprise, so on the free tier you'll be posting manually or bridging through Zapier. The brainscriblr.world 301 comes last, after content ports.

Nothing is committed; the tree is yours to review.
