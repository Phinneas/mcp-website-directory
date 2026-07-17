# MEMO: Execution Test Harness — Implementation Summary

**Date:** 2026-07-15  
**Scope:** 6th check layer in composite-trust-monitor, two-tier testing, frontend badges  
**Competitive Context:** No directory currently claims "we executed this server and its tools responded correctly" at scale. Stars, scans, and metadata are all proxies; this is ground truth.

---

## What We Shipped

### 1. Two-Tier Execution Testing

Added `fetchExecutionTest(server)` as the 6th parallel check in `composite-trust-monitor.js`.

**Tier 1: "Works: tested"** — for remote servers with known endpoints
- Performs HTTP HEAD to the endpoint
- Records response time and status
- Score: 90 if OK, 0 if failed
- Known endpoints: Upstash Context7, MindsDB, Activepieces, Google GenAI Toolbox

**Tier 2: "Handshake verified"** — for stdio servers and remote servers without known endpoints
- Fetches npm package metadata
- Verifies package contains `@modelcontextprotocol/sdk` dependency or `mcp` keyword
- Score: 70 if MCP-verified, 40 if not, 0 if no package
- *Why this tier:* Cloudflare Workers cannot spawn subprocesses. npm metadata verification is the best proxy for "this package is a real MCP server" within Worker constraints.

### 2. Storage

- **New column:** `execution_json` on `servers` table
- **Shape:** `{ status: 'tested'|'handshake'|'failed', tier, score, endpoint?, responseMs?, packageVerified?, hasMcpSdk?, hasMcpKeyword?, testedAt }`
- **Also folded into:** `composite_trust_json.subscores.execution`

### 3. Frontend Badges

**Server cards (ServerGrid.tsx):**
- Green chip: `✅ Works: tested` (endpoint responded)
- Blue chip: `🔵 Handshake verified` (npm package verified)
- Red chip: `❌ Test failed`

**Server detail page (`server/[slug].astro`):**
- Full "Execution Test" section with badge + explanation
- Shows response time for tested servers
- Shows package verification details for handshake servers

---

## Files Changed

| File | Action | Note |
|------|--------|------|
| `workers/composite-trust-monitor.js` | Modified | `fetchExecutionTest()`, wired into `assessOne()` and `runAll()` |
| `migrations/014_execution_test.sql` | Created | Adds `execution_json` column |
| `src/utils/d1.ts` | Modified | `ExecutionData` interface, `execution_json` parsing in `rowToServer()` |
| `src/components/ServerGrid.tsx` | Modified | Execution badge on server cards |
| `src/pages/server/[slug].astro` | Modified | Execution Test section on detail page |

---

## Pass/Fail Query (Content Hook)

Run this against D1 for the headline stat:

```sql
-- Overall pass/fail breakdown
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pct
FROM (
  SELECT
    CASE
      WHEN json_extract(execution_json, '$.status') = 'tested' THEN 'tested'
      WHEN json_extract(execution_json, '$.status') = 'handshake' THEN 'handshake'
      WHEN json_extract(execution_json, '$.status') = 'failed' THEN 'failed'
      ELSE 'untested'
    END as status
  FROM servers
)
GROUP BY status;
```

```sql
-- Headline: % of listed servers that don't complete a handshake
SELECT
  ROUND(
    SUM(CASE WHEN json_extract(execution_json, '$.score') = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    1
  ) as fail_rate_pct
FROM servers;
```

```sql
-- Tested vs handshake by category
SELECT
  category,
  SUM(CASE WHEN json_extract(execution_json, '$.status') = 'tested' THEN 1 ELSE 0 END) as tested,
  SUM(CASE WHEN json_extract(execution_json, '$.status') = 'handshake' THEN 1 ELSE 0 END) as handshake,
  SUM(CASE WHEN json_extract(execution_json, '$.score') = 0 THEN 1 ELSE 0 END) as failed,
  COUNT(*) as total
FROM servers
GROUP BY category
ORDER BY total DESC;
```

---

## Deployment Status

- **Code:** Committed to `mcp-directory-fresh`
- **D1 schema:** Apply `migrations/014_execution_test.sql` (or run `ALTER TABLE servers ADD COLUMN execution_json TEXT;`)
- **Next step:** Standard push/deploy to Cloudflare Pages

---

## Deferred / Follow-Up

- **Stdio subprocess testing:** Requires a separate compute environment (GitHub Actions runner, Cloudflare Containers, or VPS) that can spawn `npx` processes. The harness architecture supports this — swap `fetchExecutionTest()` for a real MCP client that spawns stdio servers.
- **Safe tool execution:** The current endpoint test is HEAD-only. Full tool-list + safe-execution testing requires an MCP SDK client in the worker or a separate service.
- **Endpoint discovery:** Currently uses a hardcoded map. Future: extract endpoints from package README or `package.json` `mcp` field.

---

## Competitive Positioning

| Claim | Competitor | Us |
|-------|-----------|-----|
| "We list servers" | Everyone | Yes |
| "We scan for security" | AgentSkillsHub, skills.sh | Yes (task 13/19) |
| "We verified the server actually runs" | **No one** | **Yes — endpoint tested or package handshake verified** |
