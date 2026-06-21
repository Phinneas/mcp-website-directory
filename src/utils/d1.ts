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

  return {
    id: row.id,
    deployment: row.deployment_type || 'local_stdio',
    securityAudit,
    greenScore,
    reliability,
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
  }: {
    offset?: number;
    limit?: number;
    category?: string;
    search?: string;
    deployment?: string;
    localOnly?: boolean;
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

  // Fetch page
  const rows = await db
    .prepare(
      `SELECT * FROM servers ${where}
       ORDER BY stars DESC, downloads DESC
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
