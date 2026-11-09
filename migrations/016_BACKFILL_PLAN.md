# Backfill Plan: license, mcp_primitives, compatible_clients

## Sources for each field

### license (TEXT — SPDX identifier)

| Source | How | Coverage |
|--------|-----|----------|
| **GitHub License API** | `GET /repos/{owner}/{repo}` → `license.spdx_id` | For servers with `github_url`. Covers most open-source entries. |
| **npm package** | `npm view {package} license` (or npm API `GET /{package}` → `license`) | For servers with `npm_package` and no GitHub URL. |
| **Manual entry** | Listed in `src/data/securityAudit.ts` for manually audited servers | ~200+ servers with human audit data. |
| **Default** | `null` (unknown) for servers where neither source is available | Uncommon — most servers have either a GitHub URL or npm package. |

**Backfill SQL** (one-time, via `wrangler d1 execute`):
```sql
-- Populate from GitHub URLs: UPDATE each row by extracting owner/repo
-- This requires the GitHub API. A script approach is better (see below).
```

Since the GitHub API needs rate-limited access, use a **script** (`scripts/backfill-license.js`) that:
1. Fetches servers WHERE license IS NULL (batch of 100)
2. For each with a GitHub URL: calls GitHub API `GET /repos/{owner}/{repo}` → `license.spdx_id`
3. For each with npm_package but no GitHub: calls npm API `GET /{package}` → `license`
4. UPDATEs the row in D1
5. Repeats until no more nulls

### mcp_primitives (TEXT — JSON array of ["resources", "tools", "prompts", "sampling", "elicitation"])

| Source | How | Coverage |
|--------|-----|----------|
| **README/manifest analysis** | Parse server source for: resource declarations (`server.resource()` or `addResource`), tool declarations (`server.tool()` or `addTool`), prompt declarations (`server.prompt()` or `addPrompt`), sampling via `createMessage` capability handlers, and elicitation via `elicitInput` or `ElicitationRequest` capabilities or the TS SDK's `elicitInput` call (Python equivalent: `elicit_input`). Also check capability declarations in `server.capabilities`. | Covers servers with accessible source (GitHub). Best signal for primitives. |
| **npm package metadata** | Check `package.json` keywords or `mcp` object for primitive declarations | Some servers declare this via the `mcp` keyword in `package.json`. |
| **Tool-diff snapshot** | The composite-trust-monitor already captures tool descriptions in `toolDiff.snapshot` in `composite_trust_json`. Parse the tool list to infer `"tools"`. | Partial — covers tools but not resources/prompts/sampling. |
| **Manual audit** | Listed in `src/data/securityAudit.ts` for servers with existing audit data | ~200+ servers. |
| **Default** | `null` (unknown). After bulk analysis, remaining nulls indicate servers whose source couldn't be inspected. | |

**Approach**: A script (`scripts/backfill-primitives.mjs`) that:
1. For each server with a GitHub URL and `composite_trust_json`: check if tools exist → set `["tools"]`
2. For servers with human audit data: check if the audit mentions resources/prompts/sampling
3. Run as a one-off, then the composite-trust worker can be enhanced to detect all 4 primitives

### compatible_clients (TEXT — JSON array of client IDs)

| Source | How | Coverage |
|--------|-----|----------|
| **Existing compatibility reports** | `src/data/compatibilityMatrix.js` has per-server, per-client status. Query: `SELECT server_id, client_id FROM compatibility_reports WHERE status = 'confirmed'`. | Covers servers with community-submitted reports. Growing. |
| **Deployment type inference** | `local_stdio` servers work with all local clients (Claude Desktop, Cursor, Cline, Windsurf). `cloud_native`/`enterprise_saas` work with SSE-capable clients. | Universal — every server has a `deployment_type`. |
| **Manual entry** | Listed in `src/data/securityAudit.ts` for manually audited servers | ~200+ servers. |
| **Default** | `null` (unknown). The deployment-type inference fills most gaps. | |

**Approach**: A script (`scripts/backfill-clients.js`) that:
1. Maps deployment type to compatible clients:
   - `local_stdio` → `["claude-desktop", "cursor", "cline", "windsurf"]`
   - `cloud_native` → `["cursor", "windsurf"]` (SSE-capable clients)
   - `self_hosted` → `["cursor", "windsurf"]` (SSE-capable)
   - `enterprise_saas` → `["cursor", "windsurf"]` (SSE-capable)
2. Overrides with confirmed compatibility reports where available
3. Updates each row

## Execution Plan

1. **Apply migration 016** to production D1:
   ```
   wrangler d1 migrations apply mcp-directory --remote
   ```

2. **Run backfill scripts** in order (each is independent):
   ```
   node scripts/backfill-license.js
   node scripts/backfill-primitives.mjs
   node scripts/backfill-clients.js
   ```

3. **Verify**:
   ```
   SELECT COUNT(*) as null_license FROM servers WHERE license IS NULL;
   SELECT COUNT(*) as null_primitives FROM servers WHERE mcp_primitives IS NULL;
   SELECT COUNT(*) as null_clients FROM servers WHERE compatible_clients IS NULL;
   ```

All three backfill scripts are small enough to write as one-off mjs files under `scripts/`. None of them need `npm install` beyond what's already available (fetch for GitHub API, basic file I/O). The license script needs a `GITHUB_TOKEN` env var for higher rate limits.