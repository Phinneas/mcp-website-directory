/**
 * MCP client config file reader/writer.
 *
 * All 5 supported clients use the same JSON shape:
 *   { "mcpServers": { "<server-name>": { "command": "...", "args": [...], "env": {...} } } }
 *
 * This module reads the file, merges entries, and writes it back.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface MCPClientInfo {
  id: string;
  name: string;
  configPath: string;
}

const HOME = os.homedir();

export const CLIENTS: Record<string, MCPClientInfo> = {
  'claude-desktop': {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    configPath: path.join(HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  },
  'cursor': {
    id: 'cursor',
    name: 'Cursor',
    configPath: path.join(HOME, '.cursor', 'mcp_config.json'),
  },
  'vscode': {
    id: 'vscode',
    name: 'VS Code',
    configPath: path.join(HOME, '.vscode', 'mcp_config.json'),
  },
  'windsurf': {
    id: 'windsurf',
    name: 'Windsurf',
    configPath: path.join(HOME, '.codeium', 'windsurf', 'mcp_config.json'),
  },
  'cline': {
    id: 'cline',
    name: 'Cline',
    configPath: path.join(HOME, '.cline', 'mcp_config.json'),
  },
};

export interface MCPServerEntry {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerEntry>;
}

function readConfig(configPath: string): MCPConfig {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed.mcpServers ? parsed : { mcpServers: parsed };
  } catch {
    return { mcpServers: {} };
  }
}

function writeConfig(configPath: string, config: MCPConfig): void {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Detect which MCP clients are installed on this machine.
 * Checks if the config file or the app directory exists.
 */
export function detectInstalledClients(): MCPClientInfo[] {
  const found: MCPClientInfo[] = [];
  for (const client of Object.values(CLIENTS)) {
    // Check config file existence OR app directory existence
    const configExists = fs.existsSync(client.configPath);
    const appDirExists = (() => {
      switch (client.id) {
        case 'claude-desktop': return fs.existsSync(path.join(HOME, 'Library', 'Application Support', 'Claude'));
        case 'cursor': return fs.existsSync(path.join(HOME, '.cursor'));
        case 'vscode': return fs.existsSync(path.join(HOME, '.vscode'));
        case 'windsurf': return fs.existsSync(path.join(HOME, '.codeium', 'windsurf'));
        case 'cline': return fs.existsSync(path.join(HOME, '.cline'));
        default: return false;
      }
    })();
    if (configExists || appDirExists) {
      found.push(client);
    }
  }
  return found;
}

/**
 * Add an MCP server entry to a client's config file.
 * Merges with existing config; does not delete other entries.
 */
export function addServerToConfig(
  clientId: string,
  serverId: string,
  entry: MCPServerEntry
): string {
  const client = CLIENTS[clientId];
  if (!client) throw new Error(`Unknown client: ${clientId}`);

  const config = readConfig(client.configPath);
  config.mcpServers[serverId] = entry;
  writeConfig(client.configPath, config);
  return client.configPath;
}

/**
 * Remove an MCP server entry from a client's config file.
 */
export function removeServerFromConfig(clientId: string, serverId: string): boolean {
  const client = CLIENTS[clientId];
  if (!client) throw new Error(`Unknown client: ${clientId}`);

  const config = readConfig(client.configPath);
  if (!config.mcpServers[serverId]) return false;
  delete config.mcpServers[serverId];
  writeConfig(client.configPath, config);
  return true;
}

/**
 * List all installed servers across all detected clients.
 */
export function listInstalledServers(): { client: MCPClientInfo; servers: Record<string, MCPServerEntry> }[] {
  const results: { client: MCPClientInfo; servers: Record<string, MCPServerEntry> }[] = [];
  for (const client of detectInstalledClients()) {
    const config = readConfig(client.configPath);
    if (Object.keys(config.mcpServers).length > 0) {
      results.push({ client, servers: config.mcpServers });
    }
  }
  return results;
}

/**
 * Check if a server is already installed in a specific client config.
 */
export function isServerInstalled(clientId: string, serverId: string): boolean {
  const client = CLIENTS[clientId];
  if (!client) return false;
  const config = readConfig(client.configPath);
  return serverId in config.mcpServers;
}
