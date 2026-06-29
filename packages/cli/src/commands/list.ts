/**
 * `mymcpshelf list` — Show installed MCP servers across all clients.
 */
import { listInstalledServers } from '../lib/config-writer.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

export async function listCommand(): Promise<void> {
  const installed = listInstalledServers();

  if (installed.length === 0) {
    console.log(`\n  ${DIM}No MCP servers installed in any detected client.${RESET}`);
    console.log(`  Install one with: npx mymcpshelf add <server-id>\n`);
    return;
  }

  console.log(`\n${BOLD}Installed MCP Servers${RESET}\n`);

  for (const { client, servers } of installed) {
    console.log(`  ${CYAN}${client.name}${RESET} ${DIM}(${client.configPath})${RESET}`);
    const entries = Object.entries(servers);
    if (entries.length === 0) {
      console.log(`    ${DIM}(empty)${RESET}`);
    }
    for (const [name, entry] of entries) {
      const cmd = entry.command + (entry.args?.length ? ` ${entry.args.join(' ')}` : '');
      console.log(`    ${BOLD}${name}${RESET}  ${DIM}${cmd}${RESET}`);
      if (entry.env && Object.keys(entry.env).length > 0) {
        const envKeys = Object.keys(entry.env).join(', ');
        console.log(`      env: ${DIM}${envKeys}${RESET}`);
      }
    }
    console.log('');
  }
}
