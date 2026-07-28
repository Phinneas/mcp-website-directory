#!/usr/bin/env node
/**
 * Strip email-only boilerplate from newsletter issues imported out of Ghost.
 *
 * Usage:
 *   node scripts/clean-newsletter-boilerplate.mjs [--dry-run] [--track=ai-field-notes]
 *
 * Fixes four defects that only matter once an email becomes a web page:
 *   1. leading `* * *` rule before the first paragraph
 *   2. the "Stay Connected" subscribe block — carries a literal {{email}} merge
 *      tag and points at the retired BrainScriblr brand. The site appends its
 *      own track-matched CTA (TrackSubscribe.astro), so this is a duplicate.
 *   3. "In today's BrainScriblr:" table-of-contents heading -> "In this issue:"
 *   4. body `# H1` per story -> `## H2` (the post template already renders the
 *      title as the page's only H1)
 *
 * Deliberately left alone — these are editorial/revenue calls, not defects:
 *   "Partner Spotlight" (disclosed affiliate links) and "Worth Your Inbox"
 *   (newsletter referral swaps).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const flags = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const track = flags.find((f) => f.startsWith('--track='))?.split('=')[1] ?? 'ai-field-notes';

const blogDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'blog');
const trackRe = new RegExp(`^track:\\s*${track}\\s*$`, 'm');

const tally = { leadRule: 0, stayConnected: 0, toc: 0, demotedH1: 0, files: 0 };

for (const file of readdirSync(blogDir).filter((f) => f.endsWith('.md'))) {
  const path = join(blogDir, file);
  const original = readFileSync(path, 'utf8');
  if (!trackRe.test(original)) continue;

  // Split frontmatter from body so transformations never touch the frontmatter.
  const match = original.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!match) {
    console.warn(`skip (no frontmatter): ${file}`);
    continue;
  }
  const [, frontmatter] = match;
  let body = match[2];
  const before = body;

  // 1. leading horizontal rule
  const deLed = body.replace(/^\s*\*\s\*\s\*\s*\n+/, '');
  if (deLed !== body) tally.leadRule++;
  body = deLed;

  // 2. "Stay Connected" block, through the trailing rule that closes it
  const deStay = body.replace(
    /\*\*Stay Connected\*\*\n+\[[^\]]*\]\([^)]*\)[^\n]*\n+(\*\s\*\s\*\n+)?/g,
    ''
  );
  if (deStay !== body) tally.stayConnected++;
  body = deStay;
  // that block was usually preceded by its own rule — collapse the orphan pair
  body = body.replace(/(\*\s\*\s\*\n+)(\*\s\*\s\*\n+)/g, '$1');

  // 3. dead-brand TOC heading
  const deToc = body.replace(/\*\*In today's BrainScriblr:\*\*/gi, '**In this issue:**');
  if (deToc !== body) tally.toc++;
  body = deToc;

  // 4. demote body H1s (skip fenced code blocks)
  let inFence = false;
  let demoted = 0;
  body = body
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) inFence = !inFence;
      if (!inFence && /^# \S/.test(line)) {
        demoted++;
        return line.replace(/^# /, '## ');
      }
      return line;
    })
    .join('\n');
  tally.demotedH1 += demoted;

  if (body === before) continue;
  tally.files++;
  if (!dryRun) writeFileSync(path, frontmatter + body);
}

console.log(
  `${dryRun ? '[dry run] would change' : 'changed'} ${tally.files} files — ` +
    `leading rules: ${tally.leadRule}, Stay Connected blocks: ${tally.stayConnected}, ` +
    `TOC headings: ${tally.toc}, H1s demoted: ${tally.demotedH1}`
);
