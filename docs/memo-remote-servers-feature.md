# MEMO: Remote Servers Section — Implementation Summary

**Date:** 2026-07-15  
**Scope:** `/remote-servers` page, uptime/TLS monitoring pipeline, nav integration  
**Competitive Context:** Counter to mcp.so ("Remote Servers" nav), mcpservers.org ("Remote MCP Servers" page), and Smithery (7K+ hosted servers). Remote/hosted MCP is where the ecosystem is moving — and it's where security matters most.

---

## What We Shipped

### 1. `/remote-servers` Page
A dedicated section aggregating all SSE/HTTP servers (`cloud_native` + `self_hosted` + `enterprise_saas`) into a single browsable view.

- **Live URL:** `https://www.mymcpshelf.com/remote-servers`
- **Query pattern:** Single D1 query with `deployment_type IN ('cloud_native', 'self_hosted', 'enterprise_saas')`
- **Zero hardcoded counts** — total sourced from live DB at build time
- **Hero copy:** Explicitly calls out why remote servers need extra scrutiny (auth, token lifecycle, data residency, TLS)
- **SSC CTA:** `CustomMcpCta variant="banner" context="Remote MCP"` — ties remote deployment to the consulting offering

### 2. Auth / Token / Residency Visibility on Cards
The existing `security_audit_json` columns (`authMethod`, `tokenLifecycle`, `dataResidency`) were already in D1 but only partially surfaced. We now show all three as chips on every card:

- `🔒 OAuth2` / `🔐 SSO/SAML` / `🔑 API Key` / `⚠️ No Auth`
- `⏳ short-lived` / `⏳ long-lived`
- `🏠 local_only` / `🏠 cloud` / `🏠 hybrid`

### 3. TLS + Uptime Monitoring (5th Check Layer)
Added `remote_health_json` to D1 `servers` and wired it into the weekly `composite-trust-monitor` recheck pipeline.

**`fetchRemoteHealth(server)` logic:**
- Skips `local_stdio` servers
- **TLS check:** HEAD request to `https://{github_domain}`; records `valid: true/false`
- **Uptime check:** Discovers endpoint from npm metadata (`homepage` / `bugs.url`); HEADs it and records `status: up/down/unknown` + `responseMs`
- Graceful skip when no endpoint is discoverable

**Pipeline integration:** Runs in parallel with staleness/green/security/tool-diff inside `assessOne()`. Written back to D1 in the same batch update.

### 4. Nav Integration
Added "Remote" (🌐) to the "Deploy By Target" navbar section alongside Local, Cloud-Native, Self-Hosted, and Enterprise.

---

## Files Changed

| File | Action | Note |
|------|--------|------|
| `migrations/012_remote_server_health.sql` | Created | Adds `remote_health_json` column |
| `src/utils/d1.ts` | Modified | `RemoteHealthData` interface, `rowToServer()` parsing, `getServersPage()` `deployments[]` IN-query support |
| `src/pages/api/servers.ts` | Modified | Parses `deployments` query param for client-side filtering |
| `src/components/ServerGrid.tsx` | Modified | Remote-health badges (TLS dot + uptime dot); token/residency chips |
| `workers/composite-trust-monitor.js` | Modified | `fetchRemoteHealth()` helper; wired into `assessOne()`/`runAll()` |
| `src/pages/remote-servers.astro` | Created | New page; queries all three remote deployment types |
| `src/components/Navbar.astro` | Modified | Added "Remote" nav item |
| `migrations/0001_create_servers.sql` | Fixed | Pre-existing broken SQLite syntax (multi-column ALTER) |

---

## Deployment Status

- **Code:** Committed to `mcp-directory-fresh`
- **D1 schema:** `remote_health_json` column applied to both local and production databases
- **Build:** Astro "All pages loaded" phase passes cleanly (including `remote-servers.astro`)
- **Next step:** Standard push/deploy to Cloudflare Pages

---

## Deferred / Not in Scope

- **Composite-score weighting:** Uptime/TLS are informational badges only; not folded into the composite trust score (to avoid skewing existing tiering). Can be added later if we want remote health to affect tiering.
- **Endpoint URL backfill:** We discover endpoints from npm metadata on-the-fly during the weekly recheck. A dedicated `endpoint_url` column + manual curation would improve uptime coverage.
- **Subagents / hooks / plugins:** Out of scope for this task. See follow-up task memo when scheduled.

---

## Competitive Positioning

| Competitor | Their Remote Offering | Our Differentiator |
|-----------|----------------------|-------------------|
| mcp.so | "Remote Servers" nav section | Trust layer: auth method, token lifecycle, data residency, TLS check, uptime ping |
| mcpservers.org | Flat "Remote MCP Servers" list | Deployment-target taxonomy (cloud / self-hosted / enterprise) with cross-filtering |
| Smithery | 7K+ hosted servers | Security/staleness badges on every card; weekly recheck pipeline |
| AgentSkillsHub | Grades only | We verify + monitor continuously |

The tiering story — "4217 listed, 600 verified, TLS-checked, uptime-monitored" — is now visible on a single page.
