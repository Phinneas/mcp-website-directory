/**
 * Security Audit Data for Top 20 MCP Servers
 *
 * Audit dimensions:
 *   transport     - stdio | sse_http | both
 *   authMethod    - None | API Key | OAuth2 | SSO-SAML
 *   tokenLifecycle - short-lived | long-lived | N/A
 *   inputHandling - parameterized | shell_strings | mixed
 *   dataResidency - local_only | cloud | hybrid | unknown
 *
 * Scoring methodology (0-100):
 *   Transport Security (20): stdio=20, SSE-with-auth=15, SSE-no-auth=5
 *   Authentication (20): SSO-SAML=20, OAuth2=16, API Key=10, None=0
 *   Token Lifecycle (20): short-lived=20, long-lived=8, N/A=0
 *   Input Handling (20): parameterized=20, mixed=10, shell_strings=2
 *   Data Residency (20): local_only=20, hybrid=12, cloud=6, unknown=0
 */

export type Transport = 'stdio' | 'sse_http' | 'both';
export type AuthMethod = 'None' | 'API Key' | 'OAuth2' | 'SSO-SAML';
export type TokenLifecycle = 'short-lived' | 'long-lived' | 'N/A';
export type InputHandling = 'parameterized' | 'shell_strings' | 'mixed';
export type DataResidency = 'local_only' | 'cloud' | 'hybrid' | 'unknown';

export interface SecurityAudit {
  serverId: string;
  transport: Transport;
  authMethod: AuthMethod;
  tokenLifecycle: TokenLifecycle;
  inputHandling: InputHandling;
  dataResidency: DataResidency;
  auditScore: number;
  auditDate: string;
  auditorNotes?: string;
}

// --- Scoring helpers ---

const TRANSPORT_SCORES: Record<Transport, number> = {
  stdio: 20,
  sse_http: 15, // assumed SSE-with-auth; downgraded per-case if no auth
  both: 15,
};
const AUTH_SCORES: Record<AuthMethod, number> = {
  'SSO-SAML': 20,
  OAuth2: 16,
  'API Key': 10,
  None: 0,
};
const TOKEN_SCORES: Record<TokenLifecycle, number> = {
  'short-lived': 20,
  'long-lived': 8,
  'N/A': 0,
};
const INPUT_SCORES: Record<InputHandling, number> = {
  parameterized: 20,
  mixed: 10,
  shell_strings: 2,
};
const RESIDENCY_SCORES: Record<DataResidency, number> = {
  local_only: 20,
  hybrid: 12,
  cloud: 6,
  unknown: 0,
};

function computeScore(
  transport: Transport,
  authMethod: AuthMethod,
  tokenLifecycle: TokenLifecycle,
  inputHandling: InputHandling,
  dataResidency: DataResidency
): number {
  let transportScore = TRANSPORT_SCORES[transport];
  // SSE without auth is much riskier
  if ((transport === 'sse_http' || transport === 'both') && authMethod === 'None') {
    transportScore = 5;
  }
  return (
    transportScore +
    AUTH_SCORES[authMethod] +
    TOKEN_SCORES[tokenLifecycle] +
    INPUT_SCORES[inputHandling] +
    RESIDENCY_SCORES[dataResidency]
  );
}

function makeAudit(
  serverId: string,
  transport: Transport,
  authMethod: AuthMethod,
  tokenLifecycle: TokenLifecycle,
  inputHandling: InputHandling,
  dataResidency: DataResidency,
  auditorNotes?: string
): SecurityAudit {
  return {
    serverId,
    transport,
    authMethod,
    tokenLifecycle,
    inputHandling,
    dataResidency,
    auditScore: computeScore(transport, authMethod, tokenLifecycle, inputHandling, dataResidency),
    auditDate: '2026-05-22',
    auditorNotes,
  };
}

/**
 * Score tier label
 */
export function getScoreTier(score: number): { label: string; color: string; emoji: string } {
  if (score >= 80) return { label: 'Secure', color: '#22c55e', emoji: '🟢' };
  if (score >= 50) return { label: 'Moderate', color: '#eab308', emoji: '🟡' };
  return { label: 'At Risk', color: '#ef4444', emoji: '🔴' };
}

/**
 * Lookup map: serverId -> SecurityAudit
 */
export const securityAudits: Record<string, SecurityAudit> = {
  // Rank 1 — MindsDB (35.2k stars)
  'mindsdb-mcp': makeAudit(
    'mindsdb-mcp',
    'stdio',
    'API Key',
    'long-lived',
    'parameterized',
    'cloud',
    'Requires MindsDB API key for cloud instance. Data queries routed to MindsDB cloud. Local self-hosted option available.'
  ),

  // Rank 2 — 1Panel (30.6k stars)
  'panel-1panel': makeAudit(
    'panel-1panel',
    'stdio',
    'API Key',
    'long-lived',
    'shell_strings',
    'local_only',
    'Server management tool. Executes shell commands for panel operations. API key for 1Panel REST API. Data stays local.'
  ),

  // Rank 3 — Playwright Browser Automation (28.4k stars)
  'playwright-browser-automation': makeAudit(
    'playwright-browser-automation',
    'stdio',
    'None',
    'N/A',
    'parameterized',
    'local_only',
    'Pure local browser automation via Playwright API. No auth needed for stdio transport. All data stays on local machine.'
  ),

  // Rank 4 — Context7 / Upstash (25.1k stars)
  'upstash-context7': makeAudit(
    'upstash-context7',
    'sse_http',
    'API Key',
    'long-lived',
    'parameterized',
    'cloud',
    'SSE transport to Upstash cloud. Static API key authentication. Queries external documentation APIs. Data flows to/from cloud.'
  ),

  // Rank 5 — Mastra Docs (21.8k stars)
  'mastra-docs': makeAudit(
    'mastra-docs',
    'stdio',
    'None',
    'N/A',
    'parameterized',
    'cloud',
    'Stdio transport but fetches documentation from remote web sources. No authentication required for server itself. Outbound cloud data flow.'
  ),

  // Rank 6 — GitHub Official MCP (20.6k stars)
  'github-official-mcp-new': makeAudit(
    'github-official-mcp-new',
    'stdio',
    'OAuth2',
    'short-lived',
    'parameterized',
    'cloud',
    'Official GitHub server. Supports OAuth2 flow with short-lived access tokens + refresh. GitHub PAT also supported (long-lived). Parameterized API calls. Data flows to GitHub cloud.'
  ),

  // Rank 7 — Microsoft Playwright MCP (16.7k stars)
  'microsoft-playwright-mcp': makeAudit(
    'microsoft-playwright-mcp',
    'stdio',
    'None',
    'N/A',
    'parameterized',
    'local_only',
    'Microsoft official Playwright MCP. Pure local browser automation. No auth. Parameterized Playwright API. Data stays local.'
  ),

  // Rank 8 — Activepieces (16.3k stars)
  'activepieces-mcp': makeAudit(
    'activepieces-mcp',
    'both',
    'API Key',
    'long-lived',
    'parameterized',
    'cloud',
    'Supports stdio and SSE. API key auth with long-lived tokens. Integrates with 280+ services. Data flows through Activepieces cloud platform.'
  ),

  // Rank 9 — FastMCP (16k stars)
  'fastmcp': makeAudit(
    'fastmcp',
    'stdio',
    'None',
    'N/A',
    'parameterized',
    'local_only',
    'MCP server framework (not a standalone server). Provides Python SDK for building servers. No built-in auth. Local-only by default. Parameterized tool definitions.'
  ),

  // Rank 10 — Figma Context MCP (9.8k stars)
  'figma-context-mcp': makeAudit(
    'figma-context-mcp',
    'stdio',
    'API Key',
    'long-lived',
    'parameterized',
    'cloud',
    'Reads Figma design data via Figma Personal Access Token (long-lived). Stdio transport. Data fetched from Figma cloud APIs.'
  ),

  // Rank 11 — Google GenAI Toolbox (9.1k stars)
  'googleapis-genai-toolbox': makeAudit(
    'googleapis-genai-toolbox',
    'sse_http',
    'OAuth2',
    'short-lived',
    'parameterized',
    'cloud',
    'Google official. SSE transport for remote deployment. OAuth2 with short-lived access tokens. Data flows through Google Cloud APIs.'
  ),

  // Rank 12 — Serena MCP (8.3k stars)
  'serena-mcp': makeAudit(
    'serena-mcp',
    'stdio',
    'None',
    'N/A',
    'parameterized',
    'local_only',
    'AI-powered code analysis. Stdio transport. No auth. Operates on local codebase. Data stays on local machine.'
  ),

  // Rank 13 — MCP Use (6k stars)
  'mcp-use': makeAudit(
    'mcp-use',
    'stdio',
    'None',
    'N/A',
    'parameterized',
    'local_only',
    'MCP client framework for Python agents. Stdio transport. No built-in auth. Local-only by design. Parameterized tool calls.'
  ),

  // Rank 14 — Zen MCP Server (6k stars)
  'zen-mcp-server': makeAudit(
    'zen-mcp-server',
    'stdio',
    'None',
    'N/A',
    'mixed',
    'local_only',
    'Multi-tool MCP server. Stdio transport. No auth. Some tools use shell commands (mixed input handling). Data stays local.'
  ),

  // Rank 15 — MCP Inspector (5.6k stars)
  'mcp-inspector': makeAudit(
    'mcp-inspector',
    'both',
    'None',
    'N/A',
    'parameterized',
    'local_only',
    'Debugging/inspection tool. SSE for web UI + stdio for MCP protocol. No auth (dev tool). Parameterized. Local-only data.'
  ),

  // Rank 16 — GhidraMCP (5.6k stars)
  'ghidra-mcp': makeAudit(
    'ghidra-mcp',
    'stdio',
    'None',
    'N/A',
    'parameterized',
    'local_only',
    'Reverse engineering with Ghidra. Stdio transport. No auth. Operates on local binary files. Data stays local.'
  ),

  // Rank 17 — AWS MCP Servers (5.3k stars)
  'awslabs-mcp-official': makeAudit(
    'awslabs-mcp-official',
    'both',
    'API Key',
    'long-lived',
    'parameterized',
    'cloud',
    'AWS official MCP servers. Supports stdio and SSE. AWS access keys (long-lived IAM credentials). Parameterized API calls. Data flows through AWS cloud.'
  ),

  // Rank 18 — Chrome MCP Server (5.3k stars)
  'mcp-chrome-hangwin': makeAudit(
    'mcp-chrome-hangwin',
    'stdio',
    'None',
    'N/A',
    'parameterized',
    'local_only',
    'Chrome DevTools Protocol integration. Stdio transport. No auth. Controls local Chrome browser. Data stays local.'
  ),

  // Rank 19 — WhatsApp MCP Server (4.7k stars)
  'whatsapp-mcp': makeAudit(
    'whatsapp-mcp',
    'stdio',
    'API Key',
    'long-lived',
    'parameterized',
    'cloud',
    'WhatsApp Web integration. Stdio transport. Uses WhatsApp session credentials (long-lived). Data flows through WhatsApp cloud. Parameterized message API.'
  ),

  // Rank 20 — GitMCP (4.7k stars)
  'git-mcp-idosal': makeAudit(
    'git-mcp-idosal',
    'both',
    'API Key',
    'long-lived',
    'parameterized',
    'cloud',
    'GitHub repository management. Supports stdio and SSE. GitHub PAT (long-lived). Parameterized Git operations. Data flows through GitHub API.'
  ),
};

/**
 * Alternate ID aliases — servers.json and D1 may store servers under different IDs
 * than staticServers.js. This maps alternate IDs to the canonical audit key.
 */
const AUDIT_ID_ALIASES: Record<string, string> = {
  // GitHub MCP — exists as 'github' in servers.json
  'github': 'github-official-mcp-new',
  // Playwright — may exist under different IDs
  'playwright': 'playwright-browser-automation',
  'playwright-mcp': 'microsoft-playwright-mcp',
  // PostgreSQL
  'postgres-mcp': 'postgres-mcp',
  // SQLite
  'sqlite-mcp': 'sqlite-mcp',
  // Puppeteer
  'puppeteer-mcp': 'puppeteer-mcp',
  // Google Workspace / gdrive
  'gdrive-mcp': 'gdrive-mcp',
  'mcp-gsuite': 'gdrive-mcp',
  // AWS
  'aws-mcp': 'awslabs-mcp-official',
  // Figma
  'figma-mcp': 'figma-context-mcp',
  // Chrome
  'chrome-mcp': 'mcp-chrome-hangwin',
  // WhatsApp
  'whatsapp': 'whatsapp-mcp',
  // Git
  'git-mcp': 'git-mcp-idosal',
};

/**
 * Get security audit for a server by ID (with alias resolution)
 */
export function getSecurityAudit(serverId: string): SecurityAudit | undefined {
  // Direct lookup first
  if (securityAudits[serverId]) return securityAudits[serverId];
  // Try alias
  const aliasKey = AUDIT_ID_ALIASES[serverId];
  if (aliasKey && securityAudits[aliasKey]) return securityAudits[aliasKey];
  return undefined;
}

/**
 * Check if a server is Local-Only (stdio transport AND local_only data residency)
 */
export function isLocalOnly(serverId: string): boolean {
  const audit = getSecurityAudit(serverId);
  if (!audit) return false;
  return audit.transport === 'stdio' && audit.dataResidency === 'local_only';
}

/**
 * Get all audited server IDs
 */
export function getAuditedServerIds(): string[] {
  return Object.keys(securityAudits);
}
