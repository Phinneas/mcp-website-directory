/**
 * GET /api/v1/search-ai
 *
 * Natural-language search across the curated My MCP Shelf directory.
 *
 * This endpoint is the website half of our dogfooded search: it runs the SAME
 * engine (`src/lib/search-engine.js`) that the `mcp-search-server` MCP server
 * exposes as a tool. One engine, two surfaces — website + MCP.
 *
 * Unlike the legacy `/api/search` (which depends on an external MeiliSearch
 * instance and returns 503 when it's down), this is fully self-contained: it
 * searches the bundled curated dataset in-process with zero external deps, so
 * it is always available.
 *
 * Query params:
 *   q     — plain-English query (empty → returns popular servers)
 *   limit — max results (1–24, default 12)
 */
import type { APIRoute } from 'astro';
import { staticServers } from '../../../data/staticServers.js';
import { searchServers, summarizeFilters } from '../../../lib/search-engine.js';
import { getSecurityAudit } from '../../../data/securityAudit';

export const prerender = false;

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=60',
};

// Build badge data from the static security audit (offline-friendly)
function buildBadges(server: any) {
  const audit = getSecurityAudit(server.id);
  const auditScore = audit?.auditScore ?? 0;

  const compositeTrust = audit
    ? {
        score: auditScore,
        tier: auditScore >= 80 ? 'trusted' : auditScore >= 50 ? 'verified' : 'caution',
        label: auditScore >= 80 ? 'Trusted' : auditScore >= 50 ? 'Verified' : 'Caution',
      }
    : null;

  const stars = server.fields?.stars ?? 0;
  const reliability = {
    score: Math.min(100, Math.round(Math.log10((stars || 0) + 1) * 25)),
    tier: stars >= 5000 ? 'excellent' : stars >= 1000 ? 'strong' : stars >= 100 ? 'moderate' : 'limited',
    label: stars >= 5000 ? 'High Activity' : stars >= 1000 ? 'Active' : stars >= 100 ? 'Moderate' : 'Low Activity',
  };

  const greenScore = audit
    ? {
        tier: audit.dataResidency === 'local_only' ? 'green_verified' : 'user_dependent',
        label: audit.dataResidency === 'local_only' ? 'Local / Green' : 'Cloud / User-Dependent',
      }
    : null;

  const scanBadge = audit
    ? {
        badge_tier: auditScore >= 50 ? 'scanned' : 'unverified',
        overall_score: auditScore,
      }
    : { badge_tier: 'unverified', overall_score: null };

  return { compositeTrust, reliability, greenScore, scanBadge, securityAudit: audit };
}

// Enrich servers with their manual security audits so the engine can reason
// about input handling / data residency / auth on audited servers.
const corpus = (staticServers as any[]).map((s) => {
  const audit = getSecurityAudit(s.id);
  return audit ? { ...s, securityAudit: audit } : s;
});

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const query = params.get('q') || '';
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '12', 10), 1), 24);

  try {
    const result = searchServers(query, corpus, { limit });

    const hits = result.hits.map((h) => {
      const f = h.server.fields;
      const badges = buildBadges(h.server);
      return {
        id: h.server.id,
        name: f.name,
        description: f.description,
        category: f.category,
        deployment: h.server.deployment || null,
        language: f.language || null,
        stars: f.stars,
        github_url: f.github_url || null,
        npm_package: f.npm_package || null,
        score: h.score,
        reasons: h.reasons,
        composite_trust: badges.compositeTrust,
        reliability: badges.reliability,
        green_score: badges.greenScore,
        scan_badge: badges.scanBadge,
        security_audit: badges.securityAudit,
      };
    });

    const body = {
      query,
      inferredFilters: summarizeFilters(result.inferredFilters),
      total: result.total,
      tookMs: result.tookMs,
      hits,
    };

    return new Response(JSON.stringify(body), { status: 200, headers: CORS });
  } catch (err) {
    console.error('search-ai error:', err);
    return new Response(
      JSON.stringify({ error: 'Search failed', query, hits: [], total: 0 }),
      { status: 500, headers: CORS }
    );
  }
};

// Preflight for cross-origin callers (e.g. the dogfooded MCP server / CLIs).
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
