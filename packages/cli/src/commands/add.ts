/**
 * `mymcpshelf add <server-id>` — Install a verified MCP server.
 */
import { getServer, reportInstall } from '../lib/api.js';
import { addServerToConfig, isServerInstalled, type MCPServerEntry } from '../lib/config-writer.js';
import { selectClient } from '../lib/client-detect.js';
import { securityGate } from '../lib/security-gate.js';
import { promptEnvVars } from '../lib/env-prompt.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

export async function addCommand(
  serverId: string,
  options: { client?: string; force?: boolean; yes?: boolean }
): Promise<void> {
  console.log(`\n${BOLD}mymcpshelf add${RESET} ${serverId}\n`);

  // 1. Resolve server from API
  let server;
  try {
    server = await getServer(serverId);
  } catch (err: any) {
    console.error(`  ${RED}Error:${RESET} ${err.message}`);
    console.error(`  ${DIM}Server "${serverId}" not found. Try: mymcpshelf search <query>${RESET}`);
    process.exit(1);
  }

  console.log(`  ${BOLD}${server.name}${RESET}`);
  console.log(`  ${server.description.slice(0, 120)}${server.description.length > 120 ? '...' : ''}`);
  if (server.stars > 0) console.log(`  ★ ${server.stars.toLocaleString()} stars  ${server.category}  ${server.language}`);
  console.log('');

  // 2. Security gate
  const gate = await securityGate(server, options.force || false);
  if (!gate.proceed) {
    process.exit(1);
  }

  // 3. Select client
  const client = await selectClient(options.client);

  // 4. Check if already installed
  if (isServerInstalled(client.id, serverId)) {
    console.log(`  ${CYAN}${server.name}${RESET} is already installed in ${client.name}.`);
    console.log(`  To update, remove it first: ${DIM}mymcpshelf remove ${serverId} --client ${client.id}${RESET}`);
    process.exit(0);
  }

  // 5. Prompt for env vars
  const envValues = await promptEnvVars(server);

  // 6. Build the config entry
  const entry: MCPServerEntry = {
    command: server.command,
    args: server.args,
  };
  if (Object.keys(envValues).length > 0) {
    entry.env = envValues;
  }

  // 7. Write config
  try {
    const configPath = addServerToConfig(client.id, serverId, entry);
    console.log(`\n  ${GREEN}✓ Installed${RESET} ${server.name} into ${BOLD}${client.name}${RESET}`);
    console.log(`  Config: ${DIM}${configPath}${RESET}`);
  } catch (err: any) {
    console.error(`  ${RED}Error writing config:${RESET} ${err.message}`);
    process.exit(1);
  }

  // 8. Report telemetry (best-effort, don't block on failure)
  try {
    await reportInstall(serverId, client.id, server.security ? {
      score: server.security.audit_score,
      tier: server.security.tier,
      dep_health: server.security.dependency_health,
    } : null);
  } catch {
    // Telemetry is optional
  }

  // 9. Print next steps
  console.log('');
  console.log(`  ${BOLD}Next steps:${RESET}`);
  console.log(`  1. Restart ${client.name}`);
  console.log(`  2. Verify: ${CYAN}mymcpshelf verify ${serverId}${RESET}`);
  if (server.github_url) {
    console.log(`  3. Docs: ${DIM}${server.github_url}${RESET}`);
  }
  console.log(`  4. Details: ${DIM}${server.shelf_url}${RESET}`);
  console.log('');
}

const RED = '\x1b[31m';
