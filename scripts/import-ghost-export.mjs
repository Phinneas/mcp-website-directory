#!/usr/bin/env node
/**
 * One-off importer: Ghost JSON export → src/content/blog/*.md
 *
 * Usage:
 *   node scripts/import-ghost-export.mjs path/to/brainscriblr.ghost.json [--dry-run]
 *
 * Get the export from Ghost admin → Settings → Labs → Export your content.
 * Every imported post is written with `track: ""` (blank) — triage each post's
 * track (ai-field-notes / signal-field / oss-spotlight / none) by hand afterwards,
 * per the migration brief: not everything from Brainscriblr is ai-field-notes.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';

const [exportPath, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');

if (!exportPath) {
  console.error('Usage: node scripts/import-ghost-export.mjs <ghost-export.json> [--dry-run]');
  process.exit(1);
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'blog');
const raw = JSON.parse(readFileSync(exportPath, 'utf8'));

// Ghost export shape: { db: [{ data: { posts, posts_authors, users, ... } }] }
const data = raw.db?.[0]?.data ?? raw.data ?? raw;
const posts = (data.posts ?? []).filter((p) => p.type === 'post');
if (posts.length === 0) {
  console.error('No posts found in export — is this a Ghost content export?');
  process.exit(1);
}

const usersById = new Map((data.users ?? []).map((u) => [u.id, u.name]));
const authorByPost = new Map(
  (data.posts_authors ?? []).map((pa) => [pa.post_id, usersById.get(pa.author_id)])
);

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
const yamlEscape = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');

let written = 0;
let skipped = 0;

for (const post of posts) {
  const slug = post.slug;
  const outPath = join(outDir, `${slug}.md`);
  if (existsSync(outPath)) {
    console.warn(`skip (exists): ${slug}`);
    skipped++;
    continue;
  }

  const html = post.html ?? '';
  if (!html) {
    console.warn(`skip (no html body): ${slug}`);
    skipped++;
    continue;
  }

  const markdown = turndown.turndown(html);
  const description = post.custom_excerpt || post.plaintext?.slice(0, 160).replace(/\s+/g, ' ').trim() || post.title;
  const date = post.published_at || post.created_at;
  const author = authorByPost.get(post.id) || 'Buzz';
  const isDraft = post.status !== 'published';

  const frontmatter = [
    '---',
    `title: "${yamlEscape(post.title)}"`,
    `description: "${yamlEscape(description)}"`,
    `date: "${date}"`,
    `author: "${yamlEscape(author)}"`,
    ...(post.feature_image ? [`image: "${yamlEscape(post.feature_image)}"`] : []),
    ...(isDraft ? ['draft: true'] : []),
    '# TODO: assign track (oss-spotlight | signal-field | ai-field-notes) or delete this line',
    '# track: ai-field-notes',
    '---',
    '',
  ].join('\n');

  if (dryRun) {
    console.log(`would write: ${slug}.md (${isDraft ? 'draft' : 'published'}, ${date?.slice(0, 10)})`);
  } else {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, frontmatter + markdown + '\n');
    console.log(`wrote: ${slug}.md`);
  }
  written++;
}

console.log(`\n${dryRun ? 'Would import' : 'Imported'} ${written} posts, skipped ${skipped}.`);
console.log('Next: assign track per post, check image URLs (feature images still point at the Ghost host), then rebuild.');
