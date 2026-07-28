#!/usr/bin/env node
/**
 * Normalize the blog byline to a single author.
 *
 * Usage:
 *   node scripts/normalize-author.mjs [--dry-run] [--author="Chester Beard"]
 *
 * Only rewrites the `author:` key inside the frontmatter block. Several posts
 * contain `author:` lines inside fenced YAML examples in the body (see
 * understanding-skill-md.md) — a naive find-and-replace would corrupt those.
 *
 * Posts with no author key are left alone; they inherit the collection default
 * in src/content/config.ts, which should match --author.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const flags = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const author =
  flags.find((f) => f.startsWith('--author='))?.split('=').slice(1).join('=') ?? 'Chester Beard';

const blogDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'blog');

let changed = 0;
let already = 0;
let noField = 0;
const from = new Map();

for (const file of readdirSync(blogDir).filter((f) => /\.mdx?$/.test(f))) {
  const path = join(blogDir, file);
  const original = readFileSync(path, 'utf8');

  // Delimiters may carry trailing whitespace (`--- `), which Astro's YAML parser
  // tolerates — match loosely so those files are not silently skipped.
  const match = original.match(/^(---[ \t]*\n)([\s\S]*?)(\n---[ \t]*\n)([\s\S]*)$/);
  if (!match) {
    console.warn(`skip (no frontmatter): ${file}`);
    continue;
  }
  const [, open, frontmatter, close, body] = match;

  const authorLine = frontmatter.match(/^author:[ \t]*(.*)$/m);
  if (!authorLine) {
    noField++;
    continue;
  }

  const current = authorLine[1].trim().replace(/^["']|["']$/g, '');
  if (current === author) {
    already++;
    continue;
  }

  from.set(current, (from.get(current) ?? 0) + 1);
  const updated = frontmatter.replace(/^author:[ \t]*.*$/m, `author: "${author}"`);
  changed++;
  if (!dryRun) writeFileSync(path, open + updated + close + body);
}

console.log(`${dryRun ? '[dry run] would rewrite' : 'rewrote'} ${changed} files -> "${author}"`);
console.log(`already correct: ${already} | no author key (uses schema default): ${noField}`);
if (from.size) {
  console.log('replaced values:');
  for (const [value, n] of [...from].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}x  ${value}`);
  }
}
