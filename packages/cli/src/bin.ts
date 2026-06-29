/**
 * mymcpshelf CLI — One-command installer for verified MCP servers.
 *
 * Usage:
 *   npx mymcpshelf add <server-id>     Install a verified MCP server
 *   npx mymcpshelf add-stack <slug>    Install a verified topic stack
 *   npx mymcpshelf search <query>       Search the catalog
 *   npx mymcpshelf list                 Show installed servers
 *   npx mymcpshelf remove <server-id>   Remove a server
 *   npx mymcpshelf verify <server-id>   Re-check security status
 */

import { addCommand } from './commands/add.js';
import { addStackCommand } from './commands/add-stack.js';
import { searchCommand } from './commands/search.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { verifyCommand } from './commands/verify.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';

function printHelp(): void {
  console.log(`
${BOLD}mymcpshelf${RESET} ${DIM}v0.1.0${RESET} — One-command installer for verified MCP servers

${BOLD}Usage:${RESET}
  mymcpshelf <command> [options]

${BOLD}Commands:${RESET}
  ${GREEN}add${RESET} <server-id>        Install a verified MCP server
  ${GREEN}add-stack${RESET} <slug>       Install a verified topic stack (multiple servers)
  ${GREEN}search${RESET} <query>          Search the server catalog
  ${GREEN}list${RESET}                    Show installed servers
  ${GREEN}remove${RESET} <server-id>      Remove a server from client config
  ${GREEN}verify${RESET} <server-id>      Re-check security status

${BOLD}Options:${RESET}
  --client <id>           Target client (claude-desktop, cursor, vscode, windsurf, cline)
  --force                 Skip security confirmation prompts
  --limit <n>             Search result limit (default: 20)
  --api-url <url>         Custom API base URL (default: https://www.mymcpshelf.com)
  -h, --help              Show help
  -V, --version           Show version

${BOLD}Examples:${RESET}
  ${CYAN}npx mymcpshelf add github-official-mcp-new${RESET}
  ${CYAN}npx mymcpshelf add-stack coding-agent-mcp${RESET}
  ${CYAN}npx mymcpshelf add github-official-mcp-new --client cursor${RESET}
  ${CYAN}npx mymcpshelf search postgres${RESET}
  ${CYAN}npx mymcpshelf list${RESET}
  ${CYAN}npx mymcpshelf verify zen-mcp-server${RESET}

${DIM}Security-checked installs powered by mymcpshelf.com${RESET}
`);
}

function parseArgs(argv: string[]): {
  command: string;
  positional: string[];
  flags: Record<string, string>;
} {
  const args = argv.slice(2); // strip node + script
  let command = '';
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      flags.help = 'true';
    } else if (arg === '-V' || arg === '--version') {
      flags.version = 'true';
    } else if (arg.startsWith('--') && i + 1 < args.length) {
      flags[arg.slice(2)] = args[++i];
    } else if (!command) {
      command = arg;
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, flags };
}

export async function main(): Promise<void> {
  const { command, positional, flags } = parseArgs(process.argv);

  if (flags.help) {
    printHelp();
    return;
  }

  if (flags.version) {
    console.log('mymcpshelf v0.1.0');
    return;
  }

  // Allow custom API base URL
  if (flags['api-url']) {
    const { setApiBase } = await import('./lib/api.js');
    setApiBase(flags['api-url']);
  }

  switch (command) {
    case 'add': {
      const serverId = positional[0];
      if (!serverId) {
        console.error('Error: Server ID required. Usage: mymcpshelf add <server-id>');
        process.exit(1);
      }
      await addCommand(serverId, {
        client: flags.client,
        force: flags.force === 'true',
        yes: flags.yes === 'true',
      });
      break;
    }

    case 'add-stack': {
      const slug = positional[0];
      if (!slug) {
        console.error('Error: Stack slug required. Usage: mymcpshelf add-stack <slug>');
        process.exit(1);
      }
      await addStackCommand(slug, {
        client: flags.client,
        force: flags.force === 'true',
      });
      break;
    }

    case 'search': {
      const query = positional.join(' ');
      if (!query) {
        console.error('Error: Search query required. Usage: mymcpshelf search <query>');
        process.exit(1);
      }
      await searchCommand(query, {
        limit: flags.limit ? parseInt(flags.limit, 10) : undefined,
      });
      break;
    }

    case 'list':
    case 'ls': {
      await listCommand();
      break;
    }

    case 'remove':
    case 'rm': {
      const serverId = positional[0];
      if (!serverId) {
        console.error('Error: Server ID required. Usage: mymcpshelf remove <server-id>');
        process.exit(1);
      }
      await removeCommand(serverId, {
        client: flags.client,
      });
      break;
    }

    case 'verify': {
      const serverId = positional[0];
      if (!serverId) {
        console.error('Error: Server ID required. Usage: mymcpshelf verify <server-id>');
        process.exit(1);
      }
      await verifyCommand(serverId);
      break;
    }

    default:
      printHelp();
      break;
  }
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
