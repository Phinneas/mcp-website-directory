#!/usr/bin/env node
/**
 * set-deployment-types.js
 *
 * Reads all servers from Cloudflare D1, infers a deployment_type for each
 * one based on keyword matching, then writes a SQL file you can review
 * before executing it.
 *
 * Usage:
 *   node scripts/set-deployment-types.js            # dry run — prints summary
 *   node scripts/set-deployment-types.js --apply    # writes update.sql + runs it
 *   node scripts/set-deployment-types.js --preview  # prints every assignment
 *
 * The script always writes update.sql so you can inspect it before running:
 *   npx wrangler d1 execute mcp-directory --remote --file=scripts/update.sql
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_NAME = 'mcp-directory';
const PAGE_SIZE = 200; // wrangler JSON output limit per query
const OUTPUT_SQL = join(__dirname, 'update.sql');
const APPLY = process.argv.includes('--apply');
const PREVIEW = process.argv.includes('--preview');

// ─── Keyword tables (ordered: enterprise → self_hosted → cloud_native → local_stdio) ──
// Order matters — first match wins.
const RULES = [
  {
    type: 'enterprise_saas',
    keywords: [
      'enterprise', 'compliance', 'audit', 'sso', 'saml', 'okta', 'sla',
      'uptime guarantee', 'dedicated support', 'role-based', 'rbac',
      'on-boarding', 'procurement', 'white-glove', 'multi-tenant saas',
    ],
  },
  {
    type: 'self_hosted',
    keywords: [
      'self-hosted', 'self hosted', 'on-premise', 'on premise', 'on-prem',
      'vpc', 'private cloud', 'air-gap', 'air gap', 'behind firewall',
      'bring your own', 'byok', 'byoc',
    ],
  },
  {
    type: 'cloud_native',
    keywords: [
      'cloud-native', 'cloud native', 'sse', 'server-sent events',
      'websocket', 'web socket', 'http transport', 'remote server',
      'managed service', 'hosted service', 'serverless', 'cloud run',
      'lambda', 'azure function', 'distributed', 'multi-user',
      'real-time collaboration', 'saas platform',
    ],
  },
  // Everything else falls through to local_stdio
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wranglerQuery(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  const raw = execSync(
    `npx wrangler d1 execute ${DB_NAME} --remote --json --command="${escaped}"`,
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const parsed = JSON.parse(raw);
  // wrangler wraps results in an array
  return (parsed[0]?.results) ?? [];
}

function inferType(server) {
  const haystack = [
    server.name ?? '',
    server.description ?? '',
    server.category ?? '',
  ].join(' ').toLowerCase();

  for (const { type, keywords } of RULES) {
    if (keywords.some(kw => haystack.includes(kw))) return type;
  }
  return 'local_stdio';
}

function escape(str) {
  return String(str ?? '').replace(/'/g, "''");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📡  Connecting to D1…');

  // 1. Count rows
  const [{ total }] = wranglerQuery('SELECT COUNT(*) as total FROM servers');
  console.log(`    Found ${total} servers in D1\n`);

  // 2. Fetch all rows in pages
  const allServers = [];
  let offset = 0;
  while (offset < total) {
    process.stdout.write(`    Fetching rows ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)}…\r`);
    const rows = wranglerQuery(
      `SELECT id, name, description, category, deployment_type
       FROM servers
       ORDER BY rowid
       LIMIT ${PAGE_SIZE} OFFSET ${offset}`
    );
    allServers.push(...rows);
    offset += PAGE_SIZE;
    if (rows.length < PAGE_SIZE) break;
  }
  console.log(`\n    Fetched ${allServers.length} rows\n`);

  // 3. Infer types and build summary
  const counts = { local_stdio: 0, cloud_native: 0, self_hosted: 0, enterprise_saas: 0 };
  const changes = []; // rows where the inferred type differs from existing

  for (const row of allServers) {
    const inferred = inferType(row);
    counts[inferred] = (counts[inferred] ?? 0) + 1;

    const existing = row.deployment_type ?? null;
    if (existing !== inferred) {
      changes.push({ id: row.id, name: row.name, from: existing, to: inferred });
    }

    if (PREVIEW) {
      const marker = existing !== inferred ? ' ← CHANGE' : '';
      console.log(`  ${inferred.padEnd(16)} ${row.name}${marker}`);
    }
  }

  // 4. Print summary
  console.log('── Inferred distribution ─────────────────────────');
  for (const [type, count] of Object.entries(counts)) {
    console.log(`  ${type.padEnd(18)} ${count}`);
  }
  console.log(`\n── Changes from current D1 values ────────────────`);
  console.log(`  ${changes.length} row(s) need updating\n`);

  if (changes.length === 0) {
    console.log('✅  Nothing to update.');
    return;
  }

  // Show first 20 changes as a preview
  const sample = changes.slice(0, 20);
  console.log(`  Sample (showing ${sample.length} of ${changes.length}):`);
  for (const c of sample) {
    console.log(`    ${String(c.from ?? 'NULL').padEnd(18)} → ${c.to.padEnd(18)} ${c.name}`);
  }
  if (changes.length > 20) console.log(`    … and ${changes.length - 20} more`);

  // 5. Generate SQL — batch UPDATEs grouped by type to keep it concise
  const byType = {};
  for (const c of changes) {
    (byType[c.to] ??= []).push(c.id);
  }

  const lines = [
    '-- Generated by scripts/set-deployment-types.js',
    `-- ${new Date().toISOString()}`,
    `-- ${changes.length} rows to update`,
    '',
  ];

  for (const [type, ids] of Object.entries(byType)) {
    // D1 doesn't support very long IN lists — chunk into batches of 100
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const inList = chunk.map(id => `'${escape(id)}'`).join(', ');
      lines.push(`UPDATE servers SET deployment_type = '${type}' WHERE id IN (${inList});`);
    }
    lines.push('');
  }

  const sql = lines.join('\n');
  writeFileSync(OUTPUT_SQL, sql, 'utf8');
  console.log(`\n📄  SQL written to scripts/update.sql`);

  // 6. Apply if --apply flag was passed
  if (APPLY) {
    console.log('\n🚀  Applying updates to D1…');
    try {
      execSync(
        `npx wrangler d1 execute ${DB_NAME} --remote --file="${OUTPUT_SQL}"`,
        { stdio: 'inherit' }
      );
      console.log('\n✅  Done — deployment_type values updated in D1.');
    } catch (err) {
      console.error('\n❌  wrangler execute failed. The SQL file is still at scripts/update.sql');
      console.error('    Run manually: npx wrangler d1 execute mcp-directory --remote --file=scripts/update.sql');
      process.exit(1);
    }
  } else {
    console.log('\nRun with --apply to execute, or manually:');
    console.log('  npx wrangler d1 execute mcp-directory --remote --file=scripts/update.sql');
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
