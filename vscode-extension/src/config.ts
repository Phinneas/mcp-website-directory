/**
 * config.ts — MCP config generation for one-click install.
 *
 * This reproduces the website's Config Generator output exactly
 * (src/components/MCPConfigGenerator.tsx):
 *
 *   { "mcpServers": { "<id>": { "command": "npx <pkg>", "args": [], "env": {...} } } }
 *
 * so a config produced by the extension is byte-for-byte compatible with one a
 * user would build on the site.
 */
import * as os from 'node:os';
import * as path from 'node:path';
import type { ShelfServer, McpServerConfig, ConfigTarget } from './types';

/** Env-var inference — mirrors getEnvVarsForServer() in the web Config Generator. */
function envVarsFor(server: ShelfServer): Record<string, string> | undefined {
  const id = server.id;
  const category = server.fields.category;

  if (id === 'github-mcp' || id === 'github' || /github/i.test(id)) {
    return { GITHUB_TOKEN: '<your-github-token>' };
  }
  if (id === 'gdrive-mcp' || id === 'gmail-mcp' || /gdrive|gmail|gsuite|workspace/i.test(id)) {
    return {
      OAUTH_TOKEN: '<your-oauth-token>',
      CLIENT_ID: '<your-client-id>',
      CLIENT_SECRET: '<your-client-secret>',
    };
  }
  if (category === 'databases') {
    return { DATABASE_URL: 'postgresql://user:password@localhost:5432/dbname' };
  }
  if (category === 'cloud' || category === 'file-systems') {
    return { API_KEY: '<your-api-key>' };
  }
  return undefined;
}

/** Build the mcpServers entry for one server (the "Config Generator output"). */
export function generateServerConfig(server: ShelfServer): McpServerConfig {
  const pkg = server.fields.npm_package || server.id;
  return {
    command: `npx ${pkg}`,
    args: [],
    env: envVarsFor(server),
  };
}

/** Build the full { mcpServers: {...} } block for one server (single-server install). */
export function generateConfigBlock(server: ShelfServer): { mcpServers: Record<string, McpServerConfig> } {
  return { mcpServers: { [server.id]: generateServerConfig(server) } };
}

/** Build the full block for many servers (multi-select / presets). */
export function generateConfigBlockMany(servers: ShelfServer[]): { mcpServers: Record<string, McpServerConfig> } {
  const mcpServers: Record<string, McpServerConfig> = {};
  for (const s of servers) mcpServers[s.id] = generateServerConfig(s);
  return { mcpServers };
}

/** Pretty-printed JSON, 2-space indent (matches the website's output). */
export function stringifyConfig(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

/** Resolve a `~`-prefixed path to an absolute path. */
export function resolveHome(p: string): string {
  return p.startsWith('~/') || p === '~' ? path.join(os.homedir(), p.slice(1)) : p;
}

/** Claude Desktop config path, platform-aware. */
function claudeDesktopPath(): string {
  const home = os.homedir();
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
  }
  return path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
}

/** Cursor's MCP config path (cross-platform). */
function cursorPath(): string {
  return path.join(os.homedir(), '.cursor', 'mcp.json');
}

/** The install targets surfaced by the one-click install flow. */
export const CONFIG_TARGETS: ConfigTarget[] = [
  { id: 'cursor', label: 'Cursor (~/.cursor/mcp.json)', configPath: cursorPath() },
  { id: 'claude-desktop', label: 'Claude Desktop (claude_desktop_config.json)', configPath: claudeDesktopPath() },
  { id: 'vscode', label: 'VS Code — workspace (.vscode/mcp.json)' },
  { id: 'clipboard', label: 'Copy JSON to clipboard' },
  { id: 'website', label: 'Open on mymcpshelf.com' },
];

/** Category display names (mirrors getCategoryDisplayName on the website). */
export const CATEGORY_NAMES: Record<string, string> = {
  aggregators: 'Aggregators & Platforms',
  'ai-tools': 'AI Tools',
  'browser-automation': 'Browser Automation',
  cloud: 'Cloud & Infrastructure',
  communication: 'Communication',
  databases: 'Databases',
  development: 'Development Tools',
  'file-systems': 'File Systems',
  finance: 'Finance',
  'knowledge-rag': 'Knowledge & RAG',
  media: 'Media & Multimedia',
  productivity: 'Productivity',
  search: 'Search & Web Scraping',
  security: 'Security',
  'data-analytics': 'Data & Analytics',
  'ai-ml': 'AI / Machine Learning',
  other: 'Other',
};

export function categoryLabel(category: string): string {
  return CATEGORY_NAMES[category] || category || 'Other';
}
