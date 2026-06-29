/**
 * `mymcpshelf add-stack <slug>` — Install a verified topic stack.
 *
 * Fetches the stack definition from the API, then installs each
 * server in sequence with security verification.
 */

import { getServer, reportInstall } from '../lib/api.js';
import { selectClient } from '../lib/client-detect.js';
import { addServerToConfig, isServerInstalled } from '../lib/config-writer.js';
import { securityGate } from '../lib/security-gate.js';
import { promptEnvVars } from '../lib/env-prompt.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';

interface StackServer {
  id: string;
  name: string;
  npm_package: string | null;
  badge_tier: string;
  stars: number;
}

interface StackDetail {
  name: string;
  slug: string;
  description: string;
  serverIds: string[];
  servers: StackServer[];
  envVars: Record<string, { required: boolean; description: string }>;
  benefits: string[];
  difficulty: string;
  estimatedSetupMinutes: number;
}

export async function addStackCommand(
  slug: string,
  options: { client?: string; force?: boolean } = {}
): Promise<void> {
  console.log(`\n${BOLD}📦 Fetching stack: ${slug}${RESET}\n`);

  // Fetch stack definition from API
  let stack: StackDetail;
  try {
    const { getApiBase } = await import('../lib/api.js');
    const baseUrl = getApiBase();
    const url = `${baseUrl}/api/v1/stacks/${slug}`;
    const httpModule = await (url.startsWith('https') ? import('node:https') : import('node:http'));
    const response = await new Promise<any>((resolve, reject) => {
      const req = httpModule.default.request(url, { method: 'GET', headers: { 'Accept': 'application/json' } }, (res: any) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON response')); }
        });
      });
      req.on('error', reject);
      req.end();
    });

    if (response.error) {
      console.error(`${RED}Error: ${response.error}${RESET}`);
      process.exit(1);
    }

    stack = response;
  } catch (err: any) {
    console.error(`${RED}Failed to fetch stack: ${err.message}${RESET}`);
    process.exit(1);
  }

  // Display stack overview
  console.log(`${BOLD}${stack.name}${RESET}`);
  console.log(`${DIM}${stack.description}${RESET}`);
  console.log(`  Difficulty: ${stack.difficulty}`);
  console.log(`  Estimated setup: ~${stack.estimatedSetupMinutes} min`);
  console.log(`  Servers: ${stack.serverIds.length}`);

  // Show servers with badge tiers
  console.log(`\n${BOLD}Stack servers:${RESET}`);
  for (const server of stack.servers || []) {
    const badge = server.badge_tier === 'manually_reviewed' ? '🛡️ Reviewed'
      : server.badge_tier === 'scanned' ? '🟢 Scanned'
      : '⚪ Unverified';
    console.log(`  ${badge}  ${server.name}${server.stars ? ` (★${server.stars})` : ''}`);
  }

  if (stack.benefits?.length) {
    console.log(`\n${BOLD}Benefits:${RESET}`);
    for (const b of stack.benefits) {
      console.log(`  ✓ ${b}`);
    }
  }

  // Select client
  const clientId = await selectClient(options.client);
  if (!clientId) {
    console.error(`${RED}No MCP client detected. Install Claude Desktop, Cursor, VS Code, Windsurf, or Cline.${RESET}`);
    process.exit(1);
  }

  console.log(`\n${CYAN}Installing to: ${clientId}${RESET}\n`);

  // Install each server
  let installed = 0;
  let skipped = 0;
  let failed = 0;
  const envValues: Record<string, string> = {};

  for (const serverId of stack.serverIds) {
    console.log(`${BOLD}── Installing ${serverId} ──${RESET}`);

    try {
      // Resolve server details
      const server = await getServer(serverId);
      if (!server) {
        console.log(`${YELLOW}  ⚠ Server "${serverId}" not found in catalog — skipping${RESET}`);
        skipped++;
        continue;
      }

      // Check if already installed
      if (await isServerInstalled(clientId, serverId)) {
        console.log(`${GREEN}  ✓ Already installed${RESET}`);
        installed++;
        continue;
      }

      // Security gate
      if (!options.force) {
        const blocked = await securityGate(server, false);
        if (blocked) {
          console.log(`${YELLOW}  ⚠ Skipped due to security concerns${RESET}`);
          skipped++;
          continue;
        }
      }

      // Prompt for env vars (deduplicate across servers)
      const env = { ...envValues };
      const newEnv = await promptEnvVars(server);
      Object.assign(env, newEnv);
      Object.assign(envValues, newEnv);

      // Write config
      const entry: Record<string, any> = {
        command: server.command,
        args: server.args,
      };
      if (Object.keys(env).length > 0) {
        entry.env = env;
      }

      await addServerToConfig(clientId, serverId, entry);

      // Telemetry
      try {
        await reportInstall(serverId, clientId, {
          score: server.security?.audit_score,
          tier: server.security?.tier,
          dep_health: server.security?.dependency_health,
        });
      } catch {}

      console.log(`${GREEN}  ✓ Installed ${server.name}${RESET}`);
      installed++;
    } catch (err: any) {
      console.error(`${RED}  ✗ Failed: ${err.message}${RESET}`);
      failed++;
    }
  }

  // Summary
  console.log(`\n${BOLD}── Stack Complete ──${RESET}`);
  console.log(`${GREEN}  Installed: ${installed}${RESET}`);
  if (skipped > 0) console.log(`${YELLOW}  Skipped: ${skipped}${RESET}`);
  if (failed > 0) console.log(`${RED}  Failed: ${failed}${RESET}`);

  if (installed > 0) {
    console.log(`\n${DIM}Stack installed! Restart your MCP client to load the new servers.${RESET}`);
  }
}
