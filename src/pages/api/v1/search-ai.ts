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

// Enrich servers with their manual security audits (where one exists) so the
// engine can reason about input handling / data residency / auth on audited
// servers. Non-audited servers still work — they fall back to the
// deployment-based safety proxy inside the engine.
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
