/**
 * `mymcpshelf search <query>` — Search the MCP server catalog.
 */
import { searchServers } from '../lib/api.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

export async function searchCommand(query: string, options: { limit?: number }): Promise<void> {
  const limit = options.limit || 20;

  let results;
  try {
    results = await searchServers(query, limit);
  } catch (err: any) {
    console.error(`  Error: ${err.message}`);
    process.exit(1);
  }

  if (results.servers.length === 0) {
    console.log(`  No servers found matching "${query}"`);
    return;
  }

  console.log(`\n${BOLD}Search results${RESET} for "${query}" (${results.total} total)\n`);

  for (const server of results.servers) {
    const tierColor = server.tier === 'Secure' ? GREEN : server.tier === 'Moderate' ? YELLOW : RED;
    const verifiedBadge = server.verified ? `${GREEN}✓${RESET}` : `${YELLOW}~${RESET}`;

    console.log(
      `  ${verifiedBadge} ${BOLD}${server.id}${RESET}  ${server.name}`
    );
    console.log(
      `    ${server.description.slice(0, 80)}${server.description.length > 80 ? '...' : ''}`
    );
    console.log(
      `    ${tierColor}[${server.tier || 'N/A'}]${RESET} score:${server.audit_score}  ★${server.stars.toLocaleString()}  ${server.category}  ${DIM}${server.npm_package || ''}${RESET}`
    );
    console.log('');
  }

  if (results.has_more) {
    console.log(`  ${DIM}... and ${results.total - results.servers.length} more. Use --limit to see more.${RESET}`);
  }

  console.log(`  Install with: ${GREEN}npx mymcpshelf add <server-id>${RESET}\n`);
}
