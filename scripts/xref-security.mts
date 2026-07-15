import { staticServers } from '../src/data/staticServers.js';
import { CVE_WATCHLIST, matchWatchlist, getHighestSeverity } from '../src/data/cveWatchlist';

const servers = staticServers as any[];
const withNpm = servers.filter((s: any) => s.fields?.npm_package);
const withGh = servers.filter((s: any) => s.fields?.github_url);

const flagged = servers
  .map((s: any) => ({ s, m: matchWatchlist(s.fields?.npm_package || null, s.fields?.github_url || null, s.id) }))
  .filter((x: any) => x.m.length > 0);

const bySev: Record<string, number> = {};
const byCat: Record<string, number> = {};
for (const { m } of flagged) {
  const top = getHighestSeverity(m)!;
  bySev[top] = (bySev[top] || 0) + 1;
  for (const e of m) byCat[e.category] = (byCat[e.category] || 0) + 1;
}

console.log('DIRECTORY EXPOSURE ANALYSIS (own pipeline, own data)');
console.log('====================================================');
console.log(`Total listed servers:        ${servers.length}`);
console.log(`With npm_package:            ${withNpm.length} (${(100*withNpm.length/servers.length).toFixed(1)}%)`);
console.log(`With github_url:             ${withGh.length}`);
console.log(`Watchlist entries:           ${CVE_WATCHLIST.filter((e:any)=>e.package_name!=='*').length}`);
console.log(`FLAGGED servers (any match): ${flagged.length}  (${(100*flagged.length/servers.length).toFixed(1)}% of directory)`);
console.log(`By highest severity:`, JSON.stringify(bySev));
console.log(`By category:`, JSON.stringify(byCat));
console.log(`\n--- Flagged servers (real, from our data) ---`);
for (const { s, m } of flagged) {
  const top = getHighestSeverity(m)!;
  console.log(`  [${top.toUpperCase().padEnd(8)}] ${s.fields.name.padEnd(34)} id=${s.id}  npm=${s.fields.npm_package||'-'}`);
  for (const e of m) console.log(`              ↳ ${e.cve_id||'IOC'} (${e.severity}, ${e.category}): ${(e.description||'').slice(0,95)}`);
}
