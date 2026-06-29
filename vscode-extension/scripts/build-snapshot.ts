/**
 * build-snapshot.ts — generate the extension's bundled data snapshot.
 *
 * Run with:  npx tsx vscode-extension/scripts/build-snapshot.ts
 *
 * Produces vscode-extension/data/servers.json: the curated server list
 * (574 servers) enriched with the manual security audits where one exists.
 * The shape is intentionally engine-compatible (it feeds the shared
 * src/lib/search-engine.js), so the extension's natural-language search and
 * the website use identical data.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Repo-root-relative imports (run via tsx from repo root).
import { staticServers } from '../../src/data/staticServers.js';
import { getSecurityAudit } from '../../src/data/securityAudit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'data');
const OUT_FILE = join(OUT_DIR, 'servers.json');

type AuditLite = {
  transport?: string;
  authMethod?: string;
  inputHandling?: string;
  dataResidency?: string;
  auditScore?: number;
  auditDate?: string;
  auditorNotes?: string;
};

const servers = (staticServers as any[]).map((s) => {
  const f = s.fields || {};
  const audit = getSecurityAudit(s.id) as AuditLite | undefined;
  return {
    id: s.id,
    deployment: s.deployment || 'local_stdio',
    fields: {
      name: f.name,
      description: f.description,
      author: f.author,
      category: f.category,
      language: f.language,
      stars: f.stars || 0,
      github_url: f.github_url || null,
      npm_package: f.npm_package || null,
    },
    securityAudit: audit
      ? {
          transport: audit.transport,
          authMethod: audit.authMethod,
          inputHandling: audit.inputHandling,
          dataResidency: audit.dataResidency,
          auditScore: audit.auditScore,
          auditDate: audit.auditDate,
          auditorNotes: audit.auditorNotes,
        }
      : null,
  };
});

const auditedCount = servers.filter((s) => s.securityAudit).length;

const snapshot = {
  source: 'My MCP Shelf (mymcpshelf.com)',
  generatedAt: new Date().toISOString(),
  count: servers.length,
  auditedCount,
  servers,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');

console.log(`✅ Snapshot written: ${OUT_FILE}`);
console.log(`   ${servers.length} servers, ${auditedCount} with manual security audits`);
console.log(`   ${(OUT_FILE.length / 1024).toFixed(0)} categories: ${[...new Set(servers.map((s) => s.fields.category))].join(', ')}`);
