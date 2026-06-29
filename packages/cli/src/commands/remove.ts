/**
 * `mymcpshelf remove <server-id>` — Remove an MCP server from client config.
 */
import { removeServerFromConfig, detectInstalledClients, CLIENTS, type MCPClientInfo } from '../lib/config-writer.js';
import { selectClient } from '../lib/client-detect.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

export async function removeCommand(
  serverId: string,
  options: { client?: string }
): Promise<void> {
  let client: MCPClientInfo;

  if (options.client) {
    const c = CLIENTS[options.client];
    if (!c) {
      console.error(`  ${RED}Error:${RESET} Unknown client "${options.client}"`);
      process.exit(1);
    }
    client = c;
  } else {
    client = await selectClient(undefined);
  }

  const removed = removeServerFromConfig(client.id, serverId);

  if (removed) {
    console.log(`  ${GREEN}✓ Removed${RESET} ${serverId} from ${BOLD}${client.name}${RESET}`);
    console.log(`  Config: ${DIM}${client.configPath}${RESET}`);
  } else {
    console.log(`  ${serverId} was not found in ${client.name} config.`);
  }
}
