# Spec: Styled Comparison Tables for `/blog/mcp-vs-api-comparison/`

## Problem
The two plain markdown comparison tables on the MCP vs API blog post render as unstyled browser-default tables. The top summary table (Traditional API vs MCP, 5 rows) and the bottom "When to Use Which" table (8 scenario rows with checkmarks) are visually indistinguishable from the surrounding text and lack the branded styling expected on a production blog.

## Goal
Replace the plain table rendering with a polished, on-brand comparison table that:
- Uses rounded borders, subtle zebra striping, and proper typography
- Highlights the MCP column header in the site accent color
- Treats the first column as row labels (bold, no-wrap on desktop)
- Scrolls horizontally on mobile instead of crushing columns
- Does not affect tables outside blog post content

## Approach

### 1. CSS Injection
Add table-specific styles to the blog post layout component (`src/pages/blog/[...slug].astro`) inside the existing `<style>` block, using `.content table` selectors. This follows the existing pattern (`.content h1`, `.content p`, etc.) and scopes the styles to blog post content only.

Key style rules:
- `border-collapse: separate; border-spacing: 0; border-radius: 10px; overflow: hidden;`
- Header row: `background: #fafafa; font-weight: 600; text-transform: uppercase; font-size: 0.85rem;`
- MCP column highlight: `.content thead th:nth-child(3)` in the accent color `#1a56db`
  - *Note:* The original snippet used `:nth-child(2)`, but both tables have MCP as the **third** column (first column = row label/dimension). The selector is adjusted to `nth-child(3)`.
- Zebra striping: even rows get `#fafafa`
- First-column labels: `font-weight: 600; white-space: nowrap;`
- Mobile: `display: block; overflow-x: auto;` on the table itself (no wrapper div required)

### 2. MDX Table Updates
Rewrite the two tables in `src/content/blog/mcp-vs-api-comparison.mdx`:

**Table 1 — Top Summary (lines 13-19)**
- Change empty first header to `Dimension` for clarity
- Keep 3-column markdown structure; the CSS handles styling

**Table 2 — When to Use Which (lines 201-210)**
- Keep 3-column markdown structure
- No structural changes needed; CSS styles it automatically

### 3. Build Verification
Run `npm run build` and inspect the generated `/blog/mcp-vs-api-comparison/index.html` to confirm:
- Both `<table>` elements render inside `<article>`
- `<thead>` and `<tbody>` are present
- MCP column header (`<th>`) receives the accent color
- No visual regressions on other blog posts

## Files Changed
- `src/pages/blog/[...slug].astro` — add `.content table` CSS rules
- `src/content/blog/mcp-vs-api-comparison.mdx` — fix top table header, keep bottom table

## Out of Scope
- Adding wrapper divs with `class="table-scroll"` (the fallback mobile CSS handles this)
- Converting markdown tables to raw HTML (unnecessary; GFM tables emit `<thead>`/`<tbody>`)
- Changing table data or copy
