/**
 * Build static fallback data for the MCP search server package.
 *
 * Generates mcp-search-server/data/static-data.json from the curated
 * staticServers.js dataset enriched with manual security audits.
 * Also copies src/lib/search-engine.js into the package so the MCP
 * server can import it without ../src/ relative paths.
 */
import * as fs from 'fs';
import * as path from 'path';
import { staticServers } from '../src/data/staticServers.js';
import { getSecurityAudit } from '../src/data/securityAudit';

const enrichedServers = (staticServers as any[]).map((s) => {
  const audit = getSecurityAudit(s.id);
  return audit ? { ...s, securityAudit: audit } : s;
});

const staticData = {
  generatedAt: new Date().toISOString(),
  serverCount: enrichedServers.length,
  servers: enrichedServers,
};

const dataDir = path.join(process.cwd(), 'mcp-search-server', 'data');
const libDir = path.join(process.cwd(), 'mcp-search-server', 'lib');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(libDir, { recursive: true });

fs.writeFileSync(
  path.join(dataDir, 'static-data.json'),
  JSON.stringify(staticData, null, 2)
);

const engineSrc = path.join(process.cwd(), 'src', 'lib', 'search-engine.js');
const engineDest = path.join(libDir, 'search-engine.js');
fs.copyFileSync(engineSrc, engineDest);

console.log(`Built mcp-search-server/data/static-data.json (${enrichedServers.length} servers)`);
console.log(`Copied search-engine.js to mcp-search-server/lib/search-engine.js`);
