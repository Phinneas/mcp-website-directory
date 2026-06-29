/**
 * Shared types for the My MCP Shelf VS Code/Cursor extension.
 *
 * These mirror the bundled snapshot (data/servers.json) and are deliberately
 * compatible with the shared search engine (src/lib/search-engine.js), which
 * the website and this extension both use.
 */

export interface SecurityAudit {
  transport?: 'stdio' | 'sse_http' | 'both';
  authMethod?: 'None' | 'API Key' | 'OAuth2' | 'SSO-SAML';
  inputHandling?: 'parameterized' | 'shell_strings' | 'mixed';
  dataResidency?: 'local_only' | 'cloud' | 'hybrid' | 'unknown';
  auditScore?: number;
  auditDate?: string;
  auditorNotes?: string;
}

export interface ServerFields {
  name: string;
  description: string;
  author: string;
  category: string;
  language: string;
  stars: number;
  github_url: string | null;
  npm_package: string | null;
}

export interface ShelfServer {
  id: string;
  deployment: string;
  fields: ServerFields;
  securityAudit: SecurityAudit | null;
}

export interface Snapshot {
  source: string;
  generatedAt: string;
  count: number;
  auditedCount: number;
  servers: ShelfServer[];
}

/** The mcpServers entry we generate for one server. */
export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ConfigTarget {
  id: 'cursor' | 'claude-desktop' | 'vscode' | 'clipboard' | 'website';
  label: string;
  /** Absolute-ish path (may contain ~) to the config file we merge into. */
  configPath?: string;
}
