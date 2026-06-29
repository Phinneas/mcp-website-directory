/**
 * Detect installed MCP clients on the user's machine.
 * Delegates to config-writer's detectInstalledClients() for actual detection.
 * This module adds user-facing output (printing detected clients, prompting selection).
 */

import { detectInstalledClients, CLIENTS, type MCPClientInfo } from './config-writer.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';

export async function selectClient(target?: string): Promise<MCPClientInfo> {
  // If a specific client was requested
  if (target) {
    const client = CLIENTS[target];
    if (!client) {
      throw new Error(`Unknown client "${target}". Valid: ${Object.keys(CLIENTS).join(', ')}`);
    }
    return client;
  }

  // Auto-detect installed clients
  const installed = detectInstalledClients();

  if (installed.length === 0) {
    console.log(`  ${DIM}No MCP clients detected automatically.${RESET}`);
    console.log(`  ${DIM}Available clients: ${Object.values(CLIENTS).map(c => c.name).join(', ')}${RESET}`);
    return await promptClientSelection();
  }

  if (installed.length === 1) {
    console.log(`  ${GREEN}✓${RESET} Detected: ${BOLD}${installed[0].name}${RESET}`);
    return installed[0];
  }

  // Multiple clients detected
  console.log(`  ${GREEN}✓${RESET} Detected ${installed.length} MCP clients:`);
  installed.forEach((c, i) => console.log(`    ${i + 1}. ${c.name}`));

  return await promptClientSelection(installed);
}

async function promptClientSelection(suggested?: MCPClientInfo[]): Promise<MCPClientInfo> {
  const allClients = Object.values(CLIENTS);
  const options = suggested?.length ? suggested : allClients;

  const readline = await import('node:readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    console.log(`  Select a client:`);
    options.forEach((c, i) => console.log(`    ${i + 1}. ${c.name} (${c.id})`));

    rl.question(`  Enter number or client ID [1]: `, (answer) => {
      rl.close();
      const trimmed = answer.trim();

      // Try as client ID first
      if (CLIENTS[trimmed]) {
        resolve(CLIENTS[trimmed]);
        return;
      }

      // Try as number
      const num = parseInt(trimmed || '1', 10);
      if (num >= 1 && num <= options.length) {
        resolve(options[num - 1]);
        return;
      }

      // Default to first
      resolve(options[0]);
    });
  });
}
