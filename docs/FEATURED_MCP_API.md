# Featured MCP API — `/api/v1/featured?weekly=true`

Public endpoint that owns the **curation** for Brainscriblr's recurring "Featured MCP"
segment. MyMCPShelf keeps this in sync with its own security / staleness / green /
Composite-Trust data; the Brainscriblr repo (`AINEWSTOOL`) just calls this endpoint
and renders the result. Curation logic lives **here, once** — never duplicated.

## Request

```
GET https://www.mymcpshelf.com/api/v1/featured?weekly=true
```

| Param | Required | Description |
|-------|----------|-------------|
| `weekly` | yes | Must be `"true"`. Returns the single pick for the current ISO week. |

The pick is **deterministic for a given week** (seeded by the week key), so every
caller during that week — the CLI, the newsletter build, a manual check — gets the
identical result. The first call of the week selects and persists the pick; later
calls return the stored row.

## Response

```json
{
  "featured": [
    {
      "id": "upstash-context7",
      "name": "Context7",
      "description": "Up-to-date documentation for any library, in your AI tool.",
      "stars": 12400,
      "github_url": "https://github.com/upstash/context7",
      "npm_package": "@upstash/context7-mcp",
      "author": "@upstash",
      "shelf_url": "https://www.mymcpshelf.com/server/context7",
      "week": "2026-W27",
      "featured_at": "2026-06-29T11:04:00.000Z",
      "reason": "newly verified this week (passed automated security scan) · Composite Trust 91/100 · recently added to the directory · 12.4k★ on GitHub",
      "theme": null
    }
  ]
}
```

`reason` is a human-readable "why" (drop it straight under the server name in the
issue). `theme` is non-null only on **thematic weeks** (e.g. `"Browser Automation MCP"`),
drawn from the Skill Stacks — render it as a small "This week: {theme} stack" eyebrow.

## Rotation guarantees

- **No repeats** — anything featured in the trailing 12 months is excluded
  (`featured_mcp_weekly` is the history log).
- **Weighted** toward servers newly verified (tasks 13/14 security scan, bonus within
  30 days), high Composite Trust, and newly surfaced (recency proxy for task 22).
- **Thematic weeks** — every 4th week the pool is restricted to a Skill Stack (task 16).
- **Deterministic** — same week ⇒ same pick (seeded).

## Brainscriblr consumer snippet (AINEWSTOOL)

Drop this into the issue build, then render `reason` / `theme` in the template:

```js
const res = await fetch('https://www.mymcpshelf.com/api/v1/featured?weekly=true');
const { featured } = await res.json();
const pick = featured?.[0];

if (pick) {
  // { pick.name, pick.description, pick.shelf_url, pick.reason, pick.theme, pick.npm_package }
}
```

One-line install for the issue (from the directory's Config Generator format):

```
npx <npm_package>      # e.g.  npx @upstash/context7-mcp
```

## Brainscriblr issue hook (ask 1)

The Phase 4 work to mention in an upcoming issue is the original security research:
**"We Scanned 574 MCP Servers: The 2026 Security Landscape, In Our Own Data"**
(`/blog/mcp-security-landscape-2026-what-our-scanner-found`). It's the natural hook
because it's evidence from this directory's own pipeline, not a recycled stat — pair
it with the Featured MCP segment for a "here's what's safe to use" through-line.

## Deploy prerequisites (this repo)

1. Apply the D1 migrations (in order) before the new code serves traffic:
   ```
   wrangler d1 execute mcp-directory --remote --file=migrations/008_composite_trust.sql
   wrangler d1 execute mcp-directory --remote --file=migrations/009_featured_rotation.sql
   ```
   - **008** adds `composite_trust_json` (feeds the Featured weighting + the trust badge).
   - **009** adds `reason` / `theme` to `featured_mcp_weekly` + the history index.
   Without 009 the weekly endpoint errors (it selects/inserts those columns).
2. Deploy the site (the endpoint is part of the Astro SSR worker).
3. First call of the week populates the pick.
