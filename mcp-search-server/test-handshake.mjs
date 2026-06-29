/**
 * test-handshake.mjs — verify the search MCP server works end-to-end.
 *
 * Spawns `server.mjs` as a child process, performs the MCP initialize
 * handshake via the official SDK client, lists tools, and calls
 * `search_mcp_servers` with a sample plain-English query.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, 'server.mjs');

const transport = new StdioClientTransport({
  command: process.execPath, // the node binary currently running
  args: [serverPath],
});

const client = new Client({ name: 'handshake-test', version: '1.0.0' });

let exitCode = 1;
try {
  await client.connect(transport);

  const { tools } = await client.listTools();
  console.log('✅ Connected. Tools exposed:', tools.map((t) => t.name).join(', '));

  const { content } = await client.callTool({
    name: 'search_mcp_servers',
    arguments: { query: 'read Postgres safely with row-level limits', limit: 3 },
  });

  console.log('\n──────── search_mcp_servers result ────────');
  console.log(content[0]?.text || '(no text)');
  console.log('───────────────────────────────────────────\n');

  exitCode = 0;
} catch (err) {
  console.error('❌ Handshake/tool call failed:', err);
} finally {
  await client.close().catch(() => {});
  process.exit(exitCode);
}
