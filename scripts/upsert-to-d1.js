import { Database } from 'duckdb'; // Or just use the CLI approach as planned
import { execSync } from 'child_process';
import fs from 'fs';

/**
 * A helper script to upsert scraped JSON data into Cloudflare D1.
 * Usage: node scripts/upsert-to-d1.js <json-file> <table>
 */

const [file, tableName] = process.argv.slice(2);

if (!file || !tableName) {
  console.error('Usage: node scripts/upsert-to-d1.js <json-file> <table>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

async function upsertData() {
  console.log(`Upserting ${data.length} records into ${tableName}...`);

  for (const item of data) {
    // Generate SQL for upsert
    // Note: Assuming keys in JSON match table columns
    const columns = Object.keys(item).join(', ');
    const values = Object.values(item)
      .map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v)
      .join(', ');

    const sql = `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${values});`;
    
    try {
      // Execute via wrangler
      execSync(`npx wrangler d1 execute mcp-directory --command="${sql}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Failed to upsert item: ${item.title || item.name}`);
    }
  }
  console.log('Upsert complete.');
}

upsertData();
