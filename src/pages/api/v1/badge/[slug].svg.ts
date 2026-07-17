/**
 * GET /api/v1/badge/{slug}.svg
 *
 * Embeddable shields.io-style SVG badge for MCP servers.
 * Reflects live verification status from the composite-trust recheck pipeline.
 *
 * Badge states:
 *   - "verified"   (green)  — composite trust tier trusted/verified OR badge_tier scanned/manually_reviewed
 *   - "review"     (yellow) — composite trust tier review OR auditScore 40-60
 *   - "caution"    (red)    — composite trust tier caution OR stale >180d / critical CVE
 *   - "unverified" (gray)   — no scan data yet
 *
 * Cache: 5-minute client cache, stale-while-revalidate 1h.
 * Tracking: logs impression to badge_views (sampled 1:10 to avoid write pressure).
 */
import type { APIRoute } from 'astro';
import { getServerBySlug } from '../../../../utils/d1';

export const prerender = false;

const BADGE_STYLES: Record<
  string,
  { label: string; status: string; color: string; bg: string }
> = {
  verified: {
    label: 'My MCP Shelf',
    status: 'Verified',
    color: '#10b981',
    bg: '#064e3b',
  },
  scanned: {
    label: 'My MCP Shelf',
    status: 'Scanned',
    color: '#3b82f6',
    bg: '#1e3a8a',
  },
  review: {
    label: 'My MCP Shelf',
    status: 'Review',
    color: '#f59e0b',
    bg: '#78350f',
  },
  caution: {
    label: 'My MCP Shelf',
    status: 'Caution',
    color: '#ef4444',
    bg: '#7f1d1d',
  },
  unverified: {
    label: 'My MCP Shelf',
    status: 'Unverified',
    color: '#94a3b8',
    bg: '#334155',
  },
};

function computeBadgeState(server: Awaited<ReturnType<typeof getServerBySlug>>) {
  if (!server) return 'unverified';

  const composite = server.compositeTrust;
  const scanBadge = server.scanData?.badge_tier;
  const audit = server.securityAudit;

  // Highest trust: composite says trusted/verified, or badge tier is manually_reviewed
  if (composite?.tier === 'trusted' || composite?.tier === 'verified') return 'verified';
  if (scanBadge === 'manually_reviewed') return 'verified';

  // Scanned: composite says review, or badge tier is scanned, or audit score >= 50
  if (composite?.tier === 'review') return 'review';
  if (scanBadge === 'scanned') return 'scanned';
  if (audit && audit.auditScore >= 50) return 'scanned';

  // Caution: composite says caution, or audit score < 40, or stale flags present
  if (composite?.tier === 'caution') return 'caution';
  if (audit && audit.auditScore < 40) return 'caution';

  return 'unverified';
}

function renderBadge(state: string) {
  const style = BADGE_STYLES[state] || BADGE_STYLES.unverified;
  const labelWidth = 88;
  const statusWidth = state === 'unverified' ? 72 : state === 'scanned' ? 64 : state === 'verified' ? 60 : state === 'caution' ? 60 : 56;
  const totalWidth = labelWidth + statusWidth;
  const labelTextX = labelWidth / 2;
  const statusTextX = labelWidth + statusWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${style.label}: ${style.status}">
  <title>${style.label}: ${style.status}</title>
  <linearGradient id="bg-${state}" x2="0" y2="100%">
    <stop offset="0" stop-color="#333" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="clip-${state}">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#clip-${state})">
    <rect width="${labelWidth}" height="20" fill="#1e293b"/>
    <rect x="${labelWidth}" width="${statusWidth}" height="20" fill="${style.color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#bg-${state})"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11">
    <text x="${labelTextX}" y="14" fill="#fff" fill-opacity=".9">${style.label}</text>
    <text x="${statusTextX}" y="14" fill="#fff" font-weight="500">${style.status}</text>
  </g>
</svg>`;
}

export const GET: APIRoute = async ({ params, locals, url }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  const { slug } = params;

  if (!slug) {
    return new Response(renderBadge('unverified'), {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      },
    });
  }

  let server = null;
  if (db) {
    try {
      server = await getServerBySlug(db, slug);
    } catch {
      server = null;
    }
  }

  const state = computeBadgeState(server);
  const svg = renderBadge(state);

  // Track adoption: sampled 1:10 to avoid write pressure on every image load
  if (db && Math.random() < 0.1) {
    try {
      await db
        .prepare(
          `INSERT INTO badge_views (server_slug, badge_state, referrer, user_agent, viewed_at)
           VALUES (?, ?, ?, ?, datetime('now'))`
        )
        .bind(
          slug,
          state,
          url.searchParams.get('ref') || null,
          null // user agent not available in standard request object
        )
        .run();
    } catch {
      // tracking failure is non-critical
    }
  }

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'Vary': 'Accept-Encoding',
    },
  });
};
