/**
 * Install Count Aggregation Worker
 *
 * Runs on a cron schedule to aggregate raw install_events
 * into the pre-computed install_counts table for the leaderboard.
 *
 * Also provides the /api/v1/leaderboard endpoint.
 */

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // POST /aggregate — trigger manual aggregation
    if (url.pathname === '/aggregate' && request.method === 'POST') {
      if (env.AGGREGATOR_SECRET) {
        const auth = request.headers.get('Authorization');
        if (auth !== `Bearer ${env.AGGREGATOR_SECRET}`) {
          return json({ error: 'Unauthorized' }, 401);
        }
      }

      try {
        const { aggregateInstallCounts } = await import('../src/utils/d1');
        const updated = await aggregateInstallCounts(env.DB);
        return json({ success: true, servers_updated: updated });
      } catch (err: any) {
        return json({ error: 'Aggregation failed', details: err.message }, 500);
      }
    }

    // GET /status — aggregation status
    if (url.pathname === '/status' && request.method === 'GET') {
      const row = await env.DB
        .prepare('SELECT COUNT(*) as server_count, SUM(total_installs) as total_installs, MAX(updated_at) as last_aggregated FROM install_counts')
        .first<{ server_count: number; total_installs: number | null; last_aggregated: string | null }>();

      return json({
        server_count: row?.server_count || 0,
        total_installs: row?.total_installs || 0,
        last_aggregated: row?.last_aggregated || null,
      });
    }

    return json({ error: 'Not found' }, 404);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Aggregate install counts every 15 minutes
    console.log('Running install count aggregation...');
    try {
      const { aggregateInstallCounts } = await import('../src/utils/d1');
      const updated = await aggregateInstallCounts(env.DB);
      console.log(`Aggregation complete: ${updated} servers updated`);

      // Also aggregate client breakdowns
      await aggregateClientBreakdowns(env.DB);

      // Also aggregate hourly snapshots
      await aggregateHourly(env.DB);
    } catch (err) {
      console.error('Aggregation failed:', err);
    }
  },
};

interface Env {
  DB: D1Database;
  AGGREGATOR_SECRET?: string;
}

async function aggregateClientBreakdown(db: D1Database): Promise<void> {
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT OR REPLACE INTO install_client_breakdown (server_id, client, count, updated_at)
     SELECT server_id, client, COUNT(*) as count, ? FROM install_events GROUP BY server_id, client`
  ).bind(now).run();
}

async function aggregateHourly(db: D1Database): Promise<void> {
  const hourKey = new Date().toISOString().slice(0, 13); // "2026-06-29T14"

  await db.prepare(
    `INSERT OR REPLACE INTO install_hourly (server_id, hour_key, count)
     SELECT server_id, ?, COUNT(*) FROM install_events
     WHERE created_at >= datetime('now', '-1 hour')
     GROUP BY server_id`
  ).bind(hourKey).run();

  // Clean up hourly data older than 90 days
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 13);
  await db.prepare(
    `DELETE FROM install_hourly WHERE hour_key < ?`
  ).bind(cutoff).run();
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-cache',
    },
  });
}
