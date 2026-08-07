/**
 * Reads for posts published directly into D1 by external Worker pipelines
 * (Signal Field, Brainscriblr, OpenSourceScribes) — see migrations/015_external_posts.sql.
 * These posts are never committed to this repo; the Worker writes them and
 * the site reads them at request time, merged alongside the git-backed blog
 * content collection.
 */
import type { BlogTrack } from '../data/newsletters';

export interface ExternalPost {
  slug: string;
  track: string;
  title: string;
  description: string;
  body_markdown: string;
  author: string;
  image: string | null;
  published_at: string;
}

export async function getExternalPosts(
  db: D1Database | undefined,
  track?: BlogTrack
): Promise<ExternalPost[]> {
  if (!db) return [];
  try {
    const stmt = track
      ? db.prepare('SELECT * FROM external_posts WHERE track = ? ORDER BY published_at DESC').bind(track)
      : db.prepare('SELECT * FROM external_posts ORDER BY published_at DESC');
    const { results } = await stmt.all<ExternalPost>();
    return results;
  } catch (error) {
    // Table may not exist yet (fresh local D1) — degrade to "no external posts".
    console.error('getExternalPosts failed:', error);
    return [];
  }
}

export async function getExternalPostBySlug(
  db: D1Database | undefined,
  slug: string
): Promise<ExternalPost | null> {
  if (!db) return null;
  try {
    return await db.prepare('SELECT * FROM external_posts WHERE slug = ?').bind(slug).first<ExternalPost>();
  } catch (error) {
    console.error('getExternalPostBySlug failed:', error);
    return null;
  }
}

/**
 * Minimal markdown -> HTML. Matches the shape the newsletter generator
 * produces (## headers, **bold**, *italic*, [links](url), - lists, --- rules,
 * plain paragraphs) — ported from signalfield's publish.ts, which this same
 * content already passes through cleanly for the Beehiiv/Ghost paths.
 * Not a general-purpose markdown parser; do not feed it arbitrary markdown.
 */
export function externalPostToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>'); // demoted: page template owns the only <h1>

  html = html.replace(/^---$/gm, '<hr>');

  html = html.replace(/(^- .+\n?)+/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map((item) => `<li>${item.replace(/^- /, '')}</li>`)
      .join('\n');
    return `<ul>\n${items}\n</ul>`;
  });

  html = html
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  const lines = html.split('\n');
  const result: string[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) {
      result.push('<p>' + paragraph.join(' ') + '</p>');
      paragraph = [];
    }
  };

  for (const line of lines) {
    const isBlock = /^<(h[1-3]|ul|hr)/.test(line) || /<\/(h[1-3]|ul)>$/.test(line);
    if (isBlock) {
      flush();
      result.push(line);
    } else if (line.trim() === '') {
      flush();
    } else {
      paragraph.push(line.trim());
    }
  }
  flush();

  return result.join('\n');
}
