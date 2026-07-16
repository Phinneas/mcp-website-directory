/**
 * Scan Skills — Build-time script
 *
 * Runs the skill security scanner against all listed skills and writes
 * src/data/skill-scans.json for static import by Astro pages.
 *
 * Usage:
 *   npx tsx scripts/scan-skills.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { scanSkills, type SkillRecord } from '../src/security/skill-scanner';
import '../src/data/skillAudits';

import agentSkills from '../src/data/agent-skills.json';
import cursorSkills from '../src/data/cursor-skills.json';

// Deduplicate by name (agent and cursor lists may overlap)
const byName = new Map<string, SkillRecord>();
for (const skill of agentSkills as SkillRecord[]) {
  byName.set(skill.name, skill);
}
for (const skill of cursorSkills as SkillRecord[]) {
  if (!byName.has(skill.name)) {
    byName.set(skill.name, skill);
  }
}

const allSkills = Array.from(byName.values());
const batch = scanSkills(allSkills);

const outputPath = path.join(process.cwd(), 'src', 'data', 'skill-scans.json');
fs.writeFileSync(outputPath, JSON.stringify(batch, null, 2));

console.log(`Scanned ${batch.totalSkills} skills`);
console.log(`  manually_reviewed: ${batch.badgeSummary.manually_reviewed}`);
console.log(`  scanned:           ${batch.badgeSummary.scanned}`);
console.log(`  unverified:        ${batch.badgeSummary.unverified}`);
console.log(`  flag rate:         ${(batch.flagRate * 100).toFixed(1)}% (critical/high findings)`);
console.log(`Wrote ${outputPath}`);
