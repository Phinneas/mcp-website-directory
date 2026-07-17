/**
 * get-badge-outreach-targets.mjs
 *
 * Identifies the top 25 verified MCP servers for badge outreach.
 * Outputs a CSV-ready list with server name, slug, author, GitHub URL,
 * stars, badge state, and composite score.
 *
 * Usage:
 *   node scripts/get-badge-outreach-targets.mjs
 */

import { staticServers } from '../src/data/staticServers.js';

function getBadgeState(server) {
  const composite = server.compositeTrust;
  const scanBadge = server.scanData?.badge_tier;
  const audit = server.securityAudit;

  if (composite?.tier === 'trusted' || composite?.tier === 'verified') return 'verified';
  if (scanBadge === 'manually_reviewed') return 'verified';
  if (composite?.tier === 'review') return 'review';
  if (scanBadge === 'scanned') return 'scanned';
  if (audit && audit.auditScore >= 50) return 'scanned';
  if (composite?.tier === 'caution') return 'caution';
  if (audit && audit.auditScore < 40) return 'caution';
  return 'unverified';
}

function computeScore(server) {
  const composite = server.compositeTrust;
  const scanBadge = server.scanData?.badge_tier;
  const audit = server.securityAudit;

  if (composite?.tier === 'trusted') return 100;
  if (composite?.tier === 'verified') return 90;
  if (scanBadge === 'manually_reviewed') return 85;
  if (composite?.tier === 'review') return 70;
  if (scanBadge === 'scanned') return 65;
  if (audit && audit.auditScore >= 50) return 60;
  if (composite?.tier === 'caution') return 40;
  if (audit && audit.auditScore < 40) return 35;
  return 20;
}

// Note: For the full verified list with live badge states, run against D1:
//   wrangler d1 execute mcp-directory --command "SELECT id, name, author, github_url, stars, badge_tier, composite_trust_json FROM servers WHERE badge_tier IN ('scanned', 'manually_reviewed') OR composite_trust_json IS NOT NULL ORDER BY stars DESC LIMIT 25;"
//
// This script uses static data as a fallback — it picks top servers by stars
// and marks badge_state as 'unknown' since static data lacks scan results.

const targets = staticServers
  .filter((s) => s.fields?.stars >= 10)
  .map((s) => ({
    id: s.id,
    name: s.fields?.name || s.id,
    slug: (s.fields?.name || s.id).toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
    author: s.fields?.author || '',
    github_url: s.fields?.github_url || '',
    stars: s.fields?.stars || 0,
    badge_state: getBadgeState(s),
    score: computeScore(s),
  }))
  .sort((a, b) => b.stars - a.stars)
  .slice(0, 25);

console.log('id,name,slug,author,github_url,stars,badge_state,score');
for (const t of targets) {
  console.log(
    `"${t.id}","${t.name}","${t.slug}","${t.author}","${t.github_url}",${t.stars},"${t.badge_state}",${t.score}`
  );
}

console.error(`\nFound ${targets.length} verified servers for badge outreach.`);
