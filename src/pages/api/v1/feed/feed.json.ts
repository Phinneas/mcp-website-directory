/**
 * GET /api/v1/feed/feed.json
 *
 * Public JSON feed of directory activity:
 *   • newly_verified — servers that reached scanned/manually_reviewed in the last 7 days
 *   • security_flags — servers with composite-trust caution flags or open issues
 *
 * Consumed by newsletters, monitoring tools, and the Brainscriblr integration (task 21).
 * Same dataset powers the RSS feed and the /changelog page.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
};

interface FeedItem {
  id: string;
  name: string;
  author: string | null;
  category: 'verified' | 'security';
  slug: string;
  stars: number;
  badge_tier: string | null;
  score: number | null;
  flags: string[];
  url: string;
  published_at: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) {
    return new Response(
      JSON.stringify({ newly_verified: [], security_flags: [], generated_at: new Date().toISOString() }),
      { status: 200, headers: CORS }
    );
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // ── Newly verified (scanned or manually_reviewed in last 7 days) ──
    const verifiedRows = await db
      .prepare(
        `SELECT id, name, author, category, stars, badge_tier, composite_trust_json, last_scan_at
         FROM servers
         WHERE badge_tier IN ('scanned', 'manually_reviewed')
           AND last_scan_at > ?
         ORDER BY stars DESC
         LIMIT 50`
      )
      .bind(weekAgo)
      .all<any>();

    const newlyVerified: FeedItem[] = (verifiedRows.results || []).map((r) => {
      let score: number | null = null;
      let flags: string[] = [];
      if (r.composite_trust_json) {
        try {
          const ct = JSON.parse(r.composite_trust_json);
          score = ct?.score ?? null;
          flags = ct?.flags ?? [];
        } catch {}
      }
      return {
        id: r.id,
        name: r.name,
        author: r.author,
        category: 'verified',
        slug: slugify(r.name),
        stars: r.stars || 0,
        badge_tier: r.badge_tier,
        score,
        flags,
        url: `https://www.mymcpshelf.com/server/${slugify(r.name)}`,
        published_at: r.last_scan_at || new Date().toISOString(),
      };
    });

    // ── Security flags (composite trust tier = caution or flags present) ──
    const flaggedRows = await db
      .prepare(
        `SELECT id, name, author, category, stars, badge_tier, composite_trust_json, last_scan_at
         FROM servers
         WHERE composite_trust_json IS NOT NULL
         ORDER BY stars DESC
         LIMIT 200`
      )
      .all<any>();

    const securityFlags: FeedItem[] = (flaggedRows.results || [])
      .map((r) => {
        let score: number | null = null;
        let flags: string[] = [];
        let tier = '';
        if (r.composite_trust_json) {
          try {
            const ct = JSON.parse(r.composite_trust_json);
            score = ct?.score ?? null;
            flags = ct?.flags ?? [];
            tier = ct?.tier ?? '';
          } catch {}
        }
        return { r, score, flags, tier };
      })
      .filter(({ tier, flags }) => tier === 'caution' || flags.length > 0)
      .slice(0, 50)
      .map(({ r, score, flags }) => ({
        id: r.id,
        name: r.name,
        author: r.author,
        category: 'security' as const,
        slug: slugify(r.name),
        stars: r.stars || 0,
        badge_tier: r.badge_tier,
        score,
        flags,
        url: `https://www.mymcpshelf.com/server/${slugify(r.name)}`,
        published_at: r.last_scan_at || new Date().toISOString(),
      }));

    const body = {
      title: 'My MCP Shelf — Verified & Security Feed',
      description:
        'Newly verified MCP servers and security flags from the unified recheck pipeline. Updated continuously.',
      home_page_url: 'https://www.mymcpshelf.com',
      feed_url: 'https://www.mymcpshelf.com/api/v1/feed/feed.json',
      changelog_url: 'https://www.mymcpshelf.com/changelog',
      generated_at: new Date().toISOString(),
      newly_verified: newlyVerified,
      security_flags: securityFlags,
    };

    return new Response(JSON.stringify(body), { status: 200, headers: CORS });
  } catch (err: any) {
    console.error('feed.json error:', err);
    return new Response(
      JSON.stringify({ error: 'Feed generation failed', details: err.message }),
      { status: 500, headers: CORS }
    );
  }
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
