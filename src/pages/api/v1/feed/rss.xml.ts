/**
 * GET /api/v1/feed/rss.xml
 *
 * RSS 2.0 feed of directory activity. Same dataset as feed.json:
 *   • newly_verified — servers that reached scanned/manually_reviewed in the last 7 days
 *   • security_flags — servers with composite-trust caution flags or open issues
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const RSS_HEADERS = {
  'Content-Type': 'application/rss+xml; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let items = '';

  if (db) {
    try {
      // ── Newly verified ──
      const verifiedRows = await db
        .prepare(
          `SELECT id, name, author, description, category, stars, badge_tier, composite_trust_json, last_scan_at
           FROM servers
           WHERE badge_tier IN ('scanned', 'manually_reviewed')
             AND last_scan_at > ?
           ORDER BY stars DESC
           LIMIT 50`
        )
        .bind(weekAgo)
        .all<any>();

      for (const r of verifiedRows.results || []) {
        let score: number | null = null;
        if (r.composite_trust_json) {
          try {
            const ct = JSON.parse(r.composite_trust_json);
            score = ct?.score ?? null;
          } catch {}
        }
        const title = escapeXml(`${r.name} — Verified`);
        const desc = escapeXml(
          `${r.description || 'MCP server'} verified with ${r.stars || 0} stars. ` +
            (score != null ? `Composite trust score: ${score}/100. ` : '') +
            `Badge: ${r.badge_tier || 'unverified'}.`
        );
        const link = `https://www.mymcpshelf.com/server/${slugify(r.name)}`;
        const pubDate = new Date(r.last_scan_at || now).toUTCString();
        const guid = `verified-${r.id}-${r.last_scan_at?.slice(0, 10) || ''}`;
        items += `    <item>
      <title>${title}</title>
      <description>${desc}</description>
      <link>${link}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>verified</category>
    </item>\n`;
      }

      // ── Security flags ──
      const flaggedRows = await db
        .prepare(
          `SELECT id, name, author, description, category, stars, badge_tier, composite_trust_json, last_scan_at
           FROM servers
           WHERE composite_trust_json IS NOT NULL
           ORDER BY stars DESC
           LIMIT 200`
        )
        .all<any>();

      for (const r of flaggedRows.results || []) {
        let flags: string[] = [];
        let tier = '';
        if (r.composite_trust_json) {
          try {
            const ct = JSON.parse(r.composite_trust_json);
            flags = ct?.flags ?? [];
            tier = ct?.tier ?? '';
          } catch {}
        }
        if (tier !== 'caution' && flags.length === 0) continue;

        const title = escapeXml(`${r.name} — Security Flag`);
        const desc = escapeXml(
          `${r.description || 'MCP server'} flagged during unified recheck. ` +
            (flags.length ? `Flags: ${flags.join(', ')}. ` : '') +
            `Stars: ${r.stars || 0}.`
        );
        const link = `https://www.mymcpshelf.com/server/${slugify(r.name)}`;
        const pubDate = new Date(r.last_scan_at || now).toUTCString();
        const guid = `security-${r.id}-${r.last_scan_at?.slice(0, 10) || ''}`;
        items += `    <item>
      <title>${title}</title>
      <description>${desc}</description>
      <link>${link}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>security</category>
    </item>\n`;
      }
    } catch (err: any) {
      console.error('rss.xml error:', err);
    }
  }

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>My MCP Shelf — Verified &amp; Security Feed</title>
    <link>https://www.mymcpshelf.com/changelog</link>
    <description>Newly verified MCP servers and security flags from the unified recheck pipeline.</description>
    <language>en</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="https://www.mymcpshelf.com/api/v1/feed/rss.xml" rel="self" type="application/rss+xml" />
    <atom:link href="https://www.mymcpshelf.com/api/v1/feed/feed.json" rel="alternate" type="application/json" />
${items}  </channel>
</rss>`;

  return new Response(feed, { status: 200, headers: RSS_HEADERS });
};

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
