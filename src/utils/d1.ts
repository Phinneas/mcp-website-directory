/**
 * D1 query helpers for MCP server data
 */

export interface MCPServerRow {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  category: string;
  language: string;
  stars: number;
  github_url: string | null;
  npm_package: string | null;
  downloads: number;
  logo_url: string | null;
  updated_at: string | null;
  deployment_type: string | null;
  security_audit_json: string | null;
  green_score_json: string | null;
  reliability_score_json: string | null;
  badge_tier: string | null;
  last_scan_at: string | null;
  scan_summary_json: string | null;
  install_count: number | null;
  installs_24h: number | null;
  installs_7d: number | null;
  composite_trust_json: string | null;
}

/** Consolidated per-server recheck record (written by composite-trust-monitor). */
export interface CompositeTrustData {
  score: number;
  tier: 'trusted' | 'verified' | 'review' | 'caution';
  label: string;
  flags: string[];
  subscores: {
    staleness: { score: number; tier: string; lastCommitDays?: number | null; commits90d?: number };
    green: { score: number; tier: string; label?: string; hostingProvider?: string | null };
    security: { score: number; tier: string; cveMatches?: number };
    toolDiff: { score: number; tier: string; added?: string[]; modified?: string[]; suspicious?: string[] };
  };
  assessedAt: string;
}

export interface SecurityAuditData {
  transport: 'stdio' | 'sse_http' | 'both';
  authMethod: 'None' | 'API Key' | 'OAuth2' | 'SSO-SAML';
  tokenLifecycle: 'short-lived' | 'long-lived' | 'N/A';
  inputHandling: 'parameterized' | 'shell_strings' | 'mixed';
  dataResidency: 'local_only' | 'cloud' | 'hybrid' | 'unknown';
  auditScore: number;
  auditDate: string;
  auditorNotes?: string;
}

export interface GreenScoreData {
  tier: 'green_verified' | 'user_dependent' | 'unknown';
  label: string;
  description: string;
  hostingProvider: string | null;
}

export interface ReliabilityBreakdownStars {
  weight: number;
  score: number;
  stars: number;
  commits90d: number;
}

export interface ReliabilityBreakdownIssues {
  weight: number;
  score: number;
  medianDays: number | null;
  closedCount: number;
}

export interface ReliabilityBreakdownForks {
  weight: number;
  score: number;
  forks: number;
  recentForks: number;
}

export interface ReliabilityBreakdownDownloads {
  weight: number;
  score: number;
  weeklyDownloads: number;
  prevWeeklyDownloads?: number;
  growthPercent?: number;
  trend: 'growing' | 'stable' | 'declining' | 'no_package' | 'error';
}

export interface ReliabilityBreakdownCommits {
  weight: number;
  score: number;
  commits90d: number;
  avgPerWeek: number;
}

export interface ReliabilityScoreData {
  score: number;
  tier: 'excellent' | 'strong' | 'moderate' | 'limited' | 'minimal';
  label: string;
  breakdown: {
    starsTrajectory: ReliabilityBreakdownStars;
    issueResponse: ReliabilityBreakdownIssues;
    forkActivity: ReliabilityBreakdownForks;
    downloadTrend: ReliabilityBreakdownDownloads;
    commitFrequency: ReliabilityBreakdownCommits;
  };
  assessedAt: string;
}

export interface MCPServer {
  id: string;
  deployment: string;
  securityAudit?: SecurityAuditData | null;
  greenScore?: GreenScoreData | null;
  reliability?: ReliabilityScoreData | null;
  compositeTrust?: CompositeTrustData | null;
  scanData?: any | null;
  installCount?: number;
  installs24h?: number;
  installs7d?: number;
  fields: {
    name: string;
    description: string;
    author: string;
    category: string;
    language: string;
    stars: number;
    github_url: string;
    npm_package: string | null;
    downloads: number;
    logoUrl: string | null;
    updated: string | null;
  };
}

export interface ServersPage {
  servers: MCPServer[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
}

function rowToServer(row: MCPServerRow): MCPServer {
  let securityAudit: SecurityAuditData | null = null;
  if (row.security_audit_json) {
    try {
      securityAudit = JSON.parse(row.security_audit_json) as SecurityAuditData;
    } catch {
      // invalid JSON — leave as null
    }
  }

  let greenScore: GreenScoreData | null = null;
  if (row.green_score_json) {
    try {
      greenScore = JSON.parse(row.green_score_json) as GreenScoreData;
    } catch {
      // invalid JSON — leave as null
    }
  }

  let reliability: ReliabilityScoreData | null = null;
  if (row.reliability_score_json) {
    try {
      reliability = JSON.parse(row.reliability_score_json) as ReliabilityScoreData;
    } catch {
      // invalid JSON — leave as null
    }
  }

  let compositeTrust: CompositeTrustData | null = null;
  if (row.composite_trust_json) {
    try {
      compositeTrust = JSON.parse(row.composite_trust_json) as CompositeTrustData;
    } catch {
      // invalid JSON — leave as null
    }
  }

  let scanData: any = null;
  if (row.scan_summary_json) {
    try {
      const parsed = JSON.parse(row.scan_summary_json);
      scanData = {
        overall_score: parsed.overall_score ?? null,
        badge_tier: row.badge_tier || parsed.badge_tier || 'unverified',
        last_scan_at: row.last_scan_at || parsed.scanned_at || null,
        static_analysis: parsed.static_analysis ?? null,
        socket_dev: parsed.socket_dev ?? null,
        mcp_scan: parsed.mcp_scan ?? null,
        cve_watchlist: parsed.cve_watchlist ?? null,
      };
    } catch {}
  } else if (row.badge_tier && row.badge_tier !== 'unverified') {
    scanData = { badge_tier: row.badge_tier, last_scan_at: row.last_scan_at };
  } else if (compositeTrust) {
    // Derive verification badge from task-19 unified recheck record when no scan exists yet
    const tier = compositeTrust.tier;
    const badgeTier = tier === 'trusted' || tier === 'verified' || tier === 'review'
      ? 'scanned'
      : 'unverified';
    scanData = {
      overall_score: compositeTrust.score ?? null,
      badge_tier: badgeTier,
      last_scan_at: compositeTrust.assessedAt || null,
      static_analysis: null,
      socket_dev: null,
      mcp_scan: null,
      cve_watchlist: null,
    };
  } else if (securityAudit && securityAudit.auditScore >= 50) {
    // Fallback to security audit score if composite trust is absent
    scanData = {
      overall_score: securityAudit.auditScore,
      badge_tier: 'scanned',
      last_scan_at: securityAudit.auditDate || null,
      static_analysis: null,
      socket_dev: null,
      mcp_scan: null,
      cve_watchlist: null,
    };
  }

  return {
    id: row.id,
    deployment: row.deployment_type || 'local_stdio',
    securityAudit,
    greenScore,
    reliability,
    compositeTrust,
    scanData,
    installCount: row.install_count || 0,
    installs24h: row.installs_24h || 0,
    installs7d: row.installs_7d || 0,
    fields: {
      name: row.name,
      description: row.description || '',
      author: row.author || '@unknown',
      category: row.category || 'development',
      language: row.language || 'Unknown',
      stars: row.stars || 0,
      github_url: row.github_url || '#',
      npm_package: row.npm_package || null,
      downloads: row.downloads || 0,
      logoUrl: row.logo_url || null,
      updated: row.updated_at || null,
    },
  };
}

export async function getServersPage(
  db: D1Database,
  {
    offset = 0,
    limit = 24,
    category = '',
    search = '',
    deployment = '',
    localOnly = false,
    sort = 'stars',
  }: {
    offset?: number;
    limit?: number;
    category?: string;
    search?: string;
    deployment?: string;
    localOnly?: boolean;
    sort?: 'stars' | 'installs' | 'trending';
  } = {}
): Promise<ServersPage> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (category && category !== 'all') {
    conditions.push('category = ?');
    params.push(category);
  }

  if (deployment && deployment !== 'all') {
    conditions.push('deployment_type = ?');
    params.push(deployment);
  }

  if (localOnly) {
    // Graceful fallback: if security_audit_json column doesn't exist yet,
    // filter by deployment_type only. Once migrated, the LIKE clause also
    // catches audited servers with stdio transport.
    conditions.push("(deployment_type = 'local_stdio')");
  }

  if (search && search.trim()) {
    conditions.push("(name LIKE ? OR description LIKE ? OR author LIKE ?)");
    const q = `%${search.trim()}%`;
    params.push(q, q, q);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total matching
  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM servers ${where}`)
    .bind(...params)
    .first<{ total: number }>();

  const total = countResult?.total ?? 0;

  // Sort order
  let orderBy: string;
  switch (sort) {
    case 'installs':
      orderBy = 'install_count DESC NULLS LAST, stars DESC';
      break;
    case 'trending':
      orderBy = 'installs_24h DESC NULLS LAST, stars DESC';
      break;
    default:
      orderBy = 'stars DESC, downloads DESC';
  }

  // Fetch page
  const rows = await db
    .prepare(
      `SELECT * FROM servers ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
    .bind(...params, limit, offset)
    .all<MCPServerRow>();

  const servers = (rows.results || []).map(rowToServer);

  return {
    servers,
    total,
    hasMore: offset + servers.length < total,
    nextOffset: offset + servers.length,
  };
}

export async function getFeaturedServers(
  db: D1Database,
  featuredIds: string[]
): Promise<MCPServer[]> {
  if (!featuredIds.length) return [];

  const placeholders = featuredIds.map(() => '?').join(', ');
  const rows = await db
    .prepare(`SELECT * FROM servers WHERE id IN (${placeholders})`)
    .bind(...featuredIds)
    .all<MCPServerRow>();

  // Preserve the order of featuredIds
  const byId = new Map((rows.results || []).map(r => [r.id, rowToServer(r)]));
  return featuredIds.map(id => byId.get(id)).filter(Boolean) as MCPServer[];
}

export async function getServerBySlug(
  db: D1Database,
  slug: string
): Promise<MCPServer | null> {
  // Slug matches: exact id OR name-derived slug
  const row = await db
    .prepare(
      `SELECT * FROM servers WHERE id = ? OR
       lower(replace(replace(name, ' ', '-'), '_', '-')) = ?
       LIMIT 1`
    )
    .bind(slug, slug)
    .first<MCPServerRow>();

  return row ? rowToServer(row) : null;
}

export async function getTotalServerCount(db: D1Database): Promise<number> {
  const result = await db
    .prepare('SELECT COUNT(*) as total FROM servers')
    .first<{ total: number }>();
  return result?.total ?? 0;
}

export async function getVerifiedServerCount(db: D1Database): Promise<number> {
  const result = await db
    .prepare("SELECT COUNT(*) as total FROM servers WHERE badge_tier IN ('scanned', 'manually_reviewed')")
    .first<{ total: number }>();
  return result?.total ?? 0;
}

// ── Install Count / Leaderboard Queries ─────────────────────────────────

export interface InstallCountRow {
  server_id: string;
  total_installs: number;
  installs_24h: number;
  installs_7d: number;
  installs_30d: number;
  prev_24h: number;
  peak_24h: number;
  peak_date: string | null;
  first_install_at: string | null;
  last_install_at: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  server: MCPServer;
  total_installs: number;
  installs_24h: number;
  installs_7d: number;
  trend: 'hot' | 'rising' | 'stable' | 'declining' | 'new';
  badge_tier: string;
}

export type LeaderboardSort = 'total' | 'trending' | 'hot';

/**
 * Get the leaderboard — servers sorted by real install counts.
 * Sort modes:
 *   'total'     — all-time install count (like skills.sh's All Time tab)
 *   'trending'  — 24h install count (like skills.sh's Trending tab)
 *   'hot'       — servers with rapidly accelerating installs (24h > 2x prev_24h)
 */
export async function getLeaderboard(
  db: D1Database,
  {
    sort = 'total',
    category = '',
    limit = 50,
    offset = 0,
  }: {
    sort?: LeaderboardSort;
    category?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ entries: LeaderboardEntry[]; total: number }> {
  // Join install_counts with servers
  const categoryFilter = category && category !== 'all'
    ? 'AND s.category = ?'
    : '';

  let orderBy: string;
  switch (sort) {
    case 'trending':
      orderBy = 'ic.installs_24h DESC';
      break;
    case 'hot':
      orderBy = 'ic.installs_24h DESC, ic.peak_24h DESC';
      break;
    default:
      orderBy = 'ic.total_installs DESC';
  }

  const params: (string | number)[] = [];
  if (category && category !== 'all') params.push(category);

  // Count
  const countResult = await db
    .prepare(
      `SELECT COUNT(*) as total FROM install_counts ic
       JOIN servers s ON s.id = ic.server_id
       WHERE ic.total_installs > 0 ${categoryFilter}`
    )
    .bind(...params)
    .first<{ total: number }>();
  const total = countResult?.total ?? 0;

  // Fetch
  const rows = await db
    .prepare(
      `SELECT s.*, ic.total_installs, ic.installs_24h, ic.installs_7d,
              ic.installs_30d, ic.prev_24h, ic.peak_24h, ic.peak_date,
              ic.first_install_at, ic.last_install_at
       FROM install_counts ic
       JOIN servers s ON s.id = ic.server_id
       WHERE ic.total_installs > 0 ${categoryFilter}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
    .bind(...params, limit, offset)
    .all<any>();

  const entries: LeaderboardEntry[] = (rows.results || []).map((row: any, i: number) => {
    const server = rowToServer(row as MCPServerRow);
    const installs24h = row.installs_24h || 0;
    const prev24h = row.prev_24h || 0;
    const totalInst = row.total_installs || 0;

    // Compute trend
    let trend: LeaderboardEntry['trend'] = 'stable';
    if (totalInst > 0 && row.first_install_at && row.last_install_at) {
      const firstDate = new Date(row.first_install_at);
      const now = new Date();
      const ageDays = (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < 7) {
        trend = 'new';
      } else if (installs24h > 0 && prev24h > 0 && installs24h >= prev24h * 2) {
        trend = 'hot';
      } else if (installs24h > prev24h) {
        trend = 'rising';
      } else if (installs24h < prev24h * 0.5) {
        trend = 'declining';
      }
    } else if (installs24h > 0) {
      trend = 'rising';
    }

    return {
      rank: offset + i + 1,
      server,
      total_installs: totalInst,
      installs_24h: installs24h,
      installs_7d: row.installs_7d || 0,
      trend,
      badge_tier: server.scanData?.badge_tier || row.badge_tier || 'unverified',
    };
  });

  return { entries, total };
}

/**
 * Get install count for a single server.
 */
export async function getInstallCount(
  db: D1Database,
  serverId: string
): Promise<InstallCountRow | null> {
  return db
    .prepare('SELECT * FROM install_counts WHERE server_id = ?')
    .bind(serverId)
    .first<InstallCountRow>();
}

/**
 * Get top N servers by install count (lightweight, for embedding).
 */
export async function getTopInstalled(
  db: D1Database,
  limit = 10
): Promise<Array<{ server_id: string; name: string; total_installs: number; installs_24h: number; badge_tier: string }>> {
  const rows = await db
    .prepare(
      `SELECT ic.server_id, s.name, ic.total_installs, ic.installs_24h, s.badge_tier
       FROM install_counts ic
       JOIN servers s ON s.id = ic.server_id
       WHERE ic.total_installs > 0
       ORDER BY ic.total_installs DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<{ server_id: string; name: string; total_installs: number; installs_24h: number; badge_tier: string }>();

  return rows.results || [];
}

/**
 * Aggregate install_events into install_counts.
 * Called by the aggregation cron worker.
 */
export async function aggregateInstallCounts(db: D1Database): Promise<number> {
  const now = new Date();
  const isoNow = now.toISOString();
  const h24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const d7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  // Previous 24h window (24h-48h ago) for trending
  const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  // Aggregate total, 24h, 7d, 30d, prev_24h in one query per server
  const results = await db
    .prepare(
      `SELECT
        server_id,
        COUNT(*) as total,
        SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) as cnt_24h,
        SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) as cnt_7d,
        SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) as cnt_30d,
        SUM(CASE WHEN created_at > ? AND created_at <= ? THEN 1 ELSE 0 END) as prev_24h,
        MIN(created_at) as first_install,
        MAX(created_at) as last_install
       FROM install_events
       GROUP BY server_id`
    )
    .bind(h24Ago, d7Ago, d30Ago, h48Ago, h24Ago)
    .all<{
      server_id: string;
      total: number;
      cnt_24h: number;
      cnt_7d: number;
      cnt_30d: number;
      prev_24h: number;
      first_install: string;
      last_install: string;
    }>();

  let updated = 0;
  for (const row of results.results || []) {
    try {
      await db
        .prepare(
          `INSERT INTO install_counts
           (server_id, total_installs, installs_24h, installs_7d, installs_30d,
            prev_24h, peak_24h, peak_date, first_install_at, last_install_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(server_id) DO UPDATE SET
             total_installs = excluded.total_installs,
             installs_24h = excluded.installs_24h,
             installs_7d = excluded.installs_7d,
             installs_30d = excluded.installs_30d,
             prev_24h = excluded.prev_24h,
             peak_24h = CASE WHEN excluded.installs_24h > install_counts.peak_24h THEN excluded.installs_24h ELSE install_counts.peak_24h END,
             peak_date = CASE WHEN excluded.installs_24h > install_counts.peak_24h THEN ? ELSE install_counts.peak_date END,
             first_install_at = CASE WHEN install_counts.first_install_at IS NULL THEN excluded.first_install_at WHEN excluded.first_install_at < install_counts.first_install_at THEN excluded.first_install_at ELSE install_counts.first_install_at END,
             last_install_at = excluded.last_install_at,
             updated_at = excluded.updated_at`
        )
        .bind(
          row.server_id, row.total, row.cnt_24h, row.cnt_7d, row.cnt_30d,
          row.prev_24h, row.cnt_24h, isoNow.slice(0, 10),
          row.first_install, row.last_install, isoNow,
          isoNow.slice(0, 10)
        )
        .run();
      updated++;
    } catch (err) {
      console.error(`Failed to update install_counts for ${row.server_id}:`, err);
    }
  }

  // Also update the denormalized columns on servers
  await db
    .prepare(
      `UPDATE servers SET
        install_count = (SELECT total_installs FROM install_counts WHERE server_id = servers.id),
        installs_24h = (SELECT installs_24h FROM install_counts WHERE server_id = servers.id),
        installs_7d = (SELECT installs_7d FROM install_counts WHERE server_id = servers.id)`
    )
    .run();

  return updated;
}
