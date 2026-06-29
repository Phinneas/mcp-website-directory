/**
 * GET /api/v1/security/scan-status?server_id=X
 * GET /api/v1/security/scan-status?ids=X,Y,Z  (batch)
 *
 * Returns security scan status and badge tier for one or more servers.
 * This reads from the D1 tables populated by the security scanner worker.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) {
    return new Response(
      JSON.stringify({ error: 'Database unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const idsParam = url.searchParams.get('ids');
  const serverId = url.searchParams.get('server_id');

  // Batch mode
  if (idsParam) {
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 100);
    if (ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid server IDs' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const placeholders = ids.map(() => '?').join(', ');
    const rows = await db
      .prepare(
        `SELECT id, name, badge_tier, last_scan_at, scan_summary_json
         FROM servers WHERE id IN (${placeholders})`
      )
      .bind(...ids)
      .all<{ id: string; name: string; badge_tier: string; last_scan_at: string | null; scan_summary_json: string | null }>();

    const servers: Record<string, any> = {};
    for (const row of rows.results || []) {
      let summary = null;
      if (row.scan_summary_json) {
        try { summary = JSON.parse(row.scan_summary_json); } catch {}
      }
      servers[row.id] = {
        name: row.name,
        badge_tier: row.badge_tier || 'unverified',
        last_scan_at: row.last_scan_at,
        scan_summary: summary,
      };
    }

    return new Response(JSON.stringify({ servers }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  }

  // Single server mode
  if (serverId) {
    const row = await db
      .prepare(
        'SELECT id, name, badge_tier, last_scan_at, scan_summary_json FROM servers WHERE id = ?'
      )
      .bind(serverId)
      .first<{ id: string; name: string; badge_tier: string; last_scan_at: string | null; scan_summary_json: string | null }>();

    if (!row) {
      return new Response(
        JSON.stringify({ error: 'Server not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    let summary = null;
    if (row.scan_summary_json) {
      try { summary = JSON.parse(row.scan_summary_json); } catch {}
    }

    // Also get individual scan results
    const scans = await db
      .prepare(
        `SELECT scan_type, status, score, details_json, scanned_at
         FROM security_scans WHERE server_id = ?
         ORDER BY scanned_at DESC LIMIT 10`
      )
      .bind(serverId)
      .all<{ scan_type: string; status: string; score: number | null; details_json: string | null; scanned_at: string }>();

    const scanResults: any[] = [];
    for (const scan of scans.results || []) {
      let details = null;
      if (scan.details_json) {
        try { details = JSON.parse(scan.details_json); } catch {}
      }
      scanResults.push({
        type: scan.scan_type,
        status: scan.status,
        score: scan.score,
        details,
        scanned_at: scan.scanned_at,
      });
    }

    // Get CVE matches from watchlist
    const cveMatches = await db
      .prepare(
        `SELECT cve_id, package_name, severity, category, description
         FROM cve_watchlist WHERE package_name = ?
         ORDER BY severity DESC`
      )
      .bind(serverId)
      .all<{ cve_id: string | null; package_name: string; severity: string; category: string; description: string }>();

    return new Response(JSON.stringify({
      server_id: row.id,
      name: row.name,
      badge_tier: row.badge_tier || 'unverified',
      last_scan_at: row.last_scan_at,
      scan_summary: summary,
      scans: scanResults,
      cve_matches: cveMatches.results || [],
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  }

  return new Response(
    JSON.stringify({ error: 'Provide server_id or ids parameter' }),
    { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};
