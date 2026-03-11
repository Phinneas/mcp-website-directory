#!/usr/bin/env node
/**
 * Seed Cloudflare D1 from servers.json
 *
 * Usage:
 *   node scripts/seed-d1.js
 *
 * This generates seed.sql which you then run with:
 *   npx wrangler d1 execute mcp-directory --file=seed.sql
 *   # or for local dev:
 *   npx wrangler d1 execute mcp-directory --local --file=seed.sql
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const SERVERS_JSON = join(rootDir, 'src/data/servers.json');
const OUTPUT_SQL = join(rootDir, 'seed.sql');
const BATCH_SIZE = 50; // D1 has limits per statement

function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  // Escape single quotes for SQL
  return `'${String(val).replace(/'/g, "''")}'`;
}

function serverToRow(server) {
  const f = server.fields || {};
  return [
    escape(server.id),
    escape(f.name || 'Unknown Server'),
    escape(f.description || ''),
    escape(f.author || null),
    escape(f.category || 'development'),
    escape(f.language || 'Unknown'),
    f.stars || 0,
    escape(f.github_url || null),
    escape(f.npm_package || null),
    f.downloads || 0,
    escape(f.logoUrl || null),
    escape(f.updated || new Date().toISOString()),
  ].join(', ');
}

console.log('Reading servers.json...');
let parsed;
try {
  const raw = readFileSync(SERVERS_JSON, 'utf-8');
  parsed = JSON.parse(raw);
} catch (e) {
  console.error('Failed to read servers.json:', e.message);
  process.exit(1);
}

const raw_servers = parsed.servers || parsed;
// Deduplicate by id, keeping first occurrence
const seen = new Set();
const servers = raw_servers.filter(s => {
  if (seen.has(s.id)) return false;
  seen.add(s.id);
  return true;
});
console.log(`Found ${raw_servers.length} servers, ${servers.length} unique`);

const lines = [
  '-- Auto-generated seed file for Cloudflare D1',
  `-- Generated: ${new Date().toISOString()}`,
  `-- Servers: ${servers.length}`,
  '',
  'DELETE FROM servers;',
  '',
];

// Batch into groups of BATCH_SIZE
for (let i = 0; i < servers.length; i += BATCH_SIZE) {
  const batch = servers.slice(i, i + BATCH_SIZE);
  const values = batch.map(s => `(${serverToRow(s)})`).join(',\n  ');
  lines.push(
    `INSERT INTO servers (id, name, description, author, category, language, stars, github_url, npm_package, downloads, logo_url, updated_at) VALUES`,
    `  ${values};`,
    ''
  );
}

const sql = lines.join('\n');
writeFileSync(OUTPUT_SQL, sql, 'utf-8');
console.log(`\nWrote ${OUTPUT_SQL}`);
console.log('\nNext steps:');
console.log('  1. Create D1 database (if not done):');
console.log('     npx wrangler d1 create mcp-directory');
console.log('  2. Update wrangler.toml with the database_id from step 1');
console.log('  3. Run migration:');
console.log('     npx wrangler d1 execute mcp-directory --file=migrations/0001_create_servers.sql');
console.log('  4. Seed data:');
console.log('     npx wrangler d1 execute mcp-directory --file=seed.sql');
console.log('  5. For local dev, add --local to each command above');
