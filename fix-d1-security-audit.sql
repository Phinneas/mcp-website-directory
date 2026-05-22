-- Fix: Populate security_audit_json using actual D1 server IDs
-- The original migration used staticServers.js IDs which don't match D1

-- GitHub (D1 id: github) -> same audit as github-official-mcp-new
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"OAuth2","tokenLifecycle":"short-lived","inputHandling":"parameterized","dataResidency":"cloud","auditScore":82,"auditDate":"2026-05-22","auditorNotes":"Official GitHub server. Supports OAuth2 flow with short-lived access tokens + refresh. GitHub PAT also supported (long-lived). Parameterized API calls. Data flows to GitHub cloud."}' WHERE id = 'github';

-- MindsDB (D1 id: mindsdb)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"API Key","tokenLifecycle":"long-lived","inputHandling":"parameterized","dataResidency":"cloud","auditScore":56,"auditDate":"2026-05-22","auditorNotes":"Requires MindsDB API key for cloud instance. Data queries routed to MindsDB cloud. Local self-hosted option available."}' WHERE id = 'mindsdb';

-- 1Panel (D1 id: 1panel)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"API Key","tokenLifecycle":"long-lived","inputHandling":"shell_strings","dataResidency":"local_only","auditScore":52,"auditDate":"2026-05-22","auditorNotes":"Server management tool. Executes shell commands for panel operations. API key for 1Panel REST API. Data stays local."}' WHERE id = '1panel';

-- Playwright (D1 id: playwright)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"None","tokenLifecycle":"N/A","inputHandling":"parameterized","dataResidency":"local_only","auditScore":60,"auditDate":"2026-05-22","auditorNotes":"Pure local browser automation via Playwright API. No auth needed for stdio transport. All data stays on local machine."}' WHERE id = 'playwright';

-- Context7 (D1 id: context7)
UPDATE servers SET security_audit_json = '{"transport":"sse_http","authMethod":"API Key","tokenLifecycle":"long-lived","inputHandling":"parameterized","dataResidency":"cloud","auditScore":49,"auditDate":"2026-05-22","auditorNotes":"SSE transport to Upstash cloud. Static API key authentication. Queries external documentation APIs. Data flows to/from cloud."}' WHERE id = 'context7';

-- Mastra Docs (D1 id: mastra-docs)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"None","tokenLifecycle":"N/A","inputHandling":"parameterized","dataResidency":"cloud","auditScore":46,"auditDate":"2026-05-22","auditorNotes":"Stdio transport but fetches documentation from remote web sources. No authentication required for server itself. Outbound cloud data flow."}' WHERE id = 'mastra-docs';

-- Activepieces (D1 id: activepieces)
UPDATE servers SET security_audit_json = '{"transport":"both","authMethod":"API Key","tokenLifecycle":"long-lived","inputHandling":"parameterized","dataResidency":"cloud","auditScore":49,"auditDate":"2026-05-22","auditorNotes":"Supports stdio and SSE. API key auth with long-lived tokens. Integrates with 280+ services. Data flows through Activepieces cloud platform."}' WHERE id = 'activepieces';

-- Figma Context (D1 id: figma-context)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"API Key","tokenLifecycle":"long-lived","inputHandling":"parameterized","dataResidency":"cloud","auditScore":56,"auditDate":"2026-05-22","auditorNotes":"Reads Figma design data via Figma Personal Access Token (long-lived). Stdio transport. Data fetched from Figma cloud APIs."}' WHERE id = 'figma-context';

-- GhidraMCP (D1 id: ghidramcp)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"None","tokenLifecycle":"N/A","inputHandling":"parameterized","dataResidency":"local_only","auditScore":60,"auditDate":"2026-05-22","auditorNotes":"Reverse engineering with Ghidra. Stdio transport. No auth. Operates on local binary files. Data stays local."}' WHERE id = 'ghidramcp';

-- AWS MCP (D1 id: aws-mcp)
UPDATE servers SET security_audit_json = '{"transport":"both","authMethod":"API Key","tokenLifecycle":"long-lived","inputHandling":"parameterized","dataResidency":"cloud","auditScore":49,"auditDate":"2026-05-22","auditorNotes":"AWS official MCP servers. Supports stdio and SSE. AWS access keys (long-lived IAM credentials). Parameterized API calls. Data flows through AWS cloud."}' WHERE id = 'aws-mcp';

-- GitMCP (D1 id: gitmcp-github-to-mcp)
UPDATE servers SET security_audit_json = '{"transport":"both","authMethod":"API Key","tokenLifecycle":"long-lived","inputHandling":"parameterized","dataResidency":"cloud","auditScore":49,"auditDate":"2026-05-22","auditorNotes":"GitHub repository management. Supports stdio and SSE. GitHub PAT (long-lived). Parameterized Git operations. Data flows through GitHub API."}' WHERE id = 'gitmcp-github-to-mcp';

-- WhatsApp (D1 id: whatsapp)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"API Key","tokenLifecycle":"long-lived","inputHandling":"parameterized","dataResidency":"cloud","auditScore":56,"auditDate":"2026-05-22","auditorNotes":"WhatsApp Web integration. Stdio transport. Uses WhatsApp session credentials (long-lived). Data flows through WhatsApp cloud. Parameterized message API."}' WHERE id = 'whatsapp';

-- PostgreSQL (D1 id: postgresql)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"API Key","tokenLifecycle":"long-lived","inputHandling":"parameterized","dataResidency":"local_only","auditScore":70,"auditDate":"2026-05-22","auditorNotes":"PostgreSQL MCP with safe SQL execution modes. Stdio transport. Database credentials required (long-lived). Parameterized queries. Data stays local."}' WHERE id = 'postgresql';

-- SQLite (D1 id: sqlite)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"None","tokenLifecycle":"N/A","inputHandling":"parameterized","dataResidency":"local_only","auditScore":60,"auditDate":"2026-05-22","auditorNotes":"SQLite MCP with CRUD and schema introspection. Stdio transport. No auth needed for local DB. Parameterized queries. Data stays local."}' WHERE id = 'sqlite';

-- Puppeteer (D1 id: puppeteer)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"None","tokenLifecycle":"N/A","inputHandling":"parameterized","dataResidency":"local_only","auditScore":60,"auditDate":"2026-05-22","auditorNotes":"Browser automation via Puppeteer. Stdio transport. No auth. Parameterized Playwright-style API. Data stays local."}' WHERE id = 'puppeteer';

-- Google Workspace (D1 id: google-workspace)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"OAuth2","tokenLifecycle":"short-lived","inputHandling":"parameterized","dataResidency":"cloud","auditScore":82,"auditDate":"2026-05-22","auditorNotes":"Google Workspace integration with OAuth2 authentication. Stdio transport. Short-lived OAuth2 tokens with refresh. Data flows through Google APIs."}' WHERE id = 'google-workspace';

-- Playwright Browser Automation (D1 id: playwright-browser-automation, already in staticServers)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"None","tokenLifecycle":"N/A","inputHandling":"parameterized","dataResidency":"local_only","auditScore":60,"auditDate":"2026-05-22","auditorNotes":"Pure local browser automation via Playwright API. No auth needed for stdio transport. All data stays on local machine."}' WHERE id = 'playwright-browser-automation';

-- Zen (D1 id: zen)
UPDATE servers SET security_audit_json = '{"transport":"stdio","authMethod":"None","tokenLifecycle":"N/A","inputHandling":"mixed","dataResidency":"local_only","auditScore":50,"auditDate":"2026-05-22","auditorNotes":"Multi-tool MCP server. Stdio transport. No auth. Some tools use shell commands (mixed input handling). Data stays local."}' WHERE id = 'zen';

-- Done: 20 servers matched in D1
