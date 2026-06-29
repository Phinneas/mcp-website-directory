#!/usr/bin/env node
/**
 * Seed the CVE watchlist into D1 from the cveWatchlist.ts data module.
 *
 * Usage:
 *   node scripts/seed-watchlist.js
 *
 * Requires D1_DATABASE_ID env var or falls back to the one in wrangler.toml.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the watchlist data by importing the TS file's JSON array
// Since we can't directly import TS in Node, we extract the array via regex
const watchlistSource = readFileSync(join(__dirname, '../src/data/cveWatchlist.ts'), 'utf-8');

// Parse the CVE_WATCHLIST array from the TS source
// This is a simplified approach — in production, you'd use tsx or esbuild
const arrayMatch = watchlistSource.match(/export const CVE_WATCHLIST:\s*WatchlistEntry\[\]\s*=\s*(\[[\s\S]*?\n\]);/);
if (!arrayMatch) {
  console.error('Could not parse CVE_WATCHLIST from source');
  process.exit(1);
}

// Clean up TypeScript-specific syntax for JSON parsing
const jsonStr = arrayMatch[1]
  .replace(/,\s*\]/g, ']')           // trailing commas
  .replace(/'/g, '"')                 // single quotes to double
  .replace(/(\w+):/g, '"$1":')        // unquoted keys
  .replace(/""/g, '"')               // double-escaped quotes fix
  ;

let watchlist: any[];
try {
  watchlist = JSON.parse(jsonStr);
} catch (err) {
  console.error('Failed to parse watchlist JSON. Using manual approach.');
  // Fallback: generate SQL INSERTs directly
  console.log('-- Run these SQL statements manually against D1:');
  console.log('-- Or use: npx wrangler d1 execute mcp-directory --file=watchlist-seed.sql');
  process.exit(1);
}

console.log(`Parsed ${watchlist.length} watchlist entries`);

// Generate SQL INSERT statements
const inserts = watchlist.map(entry => {
  const cveId = entry.cve_id || 'NULL';
  const pkgName = entry.package_name.replace(/'/g, "''");
  const desc = entry.description.replace(/'/g, "''");
  const sourceUrl = entry.source_url || 'NULL';
  const patched = entry.patched_versions || 'NULL';
  const expires = entry.expires_at || 'NULL';

  return `INSERT OR IGNORE INTO cve_watchlist (cve_id, package_name, severity, category, description, affected_versions, patched_versions, source, source_url, discovered_at, expires_at) VALUES ('${cveId}', '${pkgName}', '${entry.severity}', '${entry.category}', '${desc}', '${entry.affected_versions}', '${patched}', '${entry.source}', '${sourceUrl}', '${entry.discovered_at}', '${expires}');`;
});

const sql = `-- CVE/IOC Watchlist Seed\n-- Generated: ${new Date().toISOString()}\n-- Entries: ${watchlist.length}\n\n${inserts.join('\n')}`;

// Write to file
const outPath = join(__dirname, 'watchlist-seed.sql');
import { writeFileSync } from 'node:fs';
writeFileSync(outPath, sql);
console.log(`Written SQL seed to ${outPath}`);
console.log(`To apply: npx wrangler d1 execute mcp-directory --file=${outPath}`);
