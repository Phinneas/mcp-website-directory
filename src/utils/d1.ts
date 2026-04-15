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
}

export interface MCPServer {
  id: string;
  deployment: string;
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

// Infer deployment type from name/description/category when the DB column is NULL.
// Checked in order — most specific first so enterprise/self-hosted aren't
// swallowed by the broader cloud_native keywords.
function inferDeploymentType(row: MCPServerRow): string {
  if (row.deployment_type) return row.deployment_type;
  const text = `${row.name} ${row.description ?? ''} ${row.category ?? ''}`.toLowerCase();
  if ([
    'enterprise', 'compliance', 'audit', ' sso', 'saml', 'okta', 'sla',
    'rbac', 'white-glove', 'multi-tenant saas',
  ].some(kw => text.includes(kw))) return 'enterprise_saas';
  if ([
    'self-host', 'self host', 'on-premise', 'on premise', 'on-prem',
    ' vpc', 'private cloud', 'air-gap', 'byok', 'byoc',
  ].some(kw => text.includes(kw))) return 'self_hosted';
  if ([
    'cloud-native', 'cloud native', ' sse', 'server-sent', 'websocket',
    'web socket', 'http transport', 'managed service', 'hosted service',
    'serverless', 'cloud run', 'lambda', 'azure function', 'multi-user',
    'saas platform',
  ].some(kw => text.includes(kw))) return 'cloud_native';
  return 'local_stdio';
}

function rowToServer(row: MCPServerRow): MCPServer {
  return {
    id: row.id,
    deployment: inferDeploymentType(row),
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
  }: {
    offset?: number;
    limit?: number;
    category?: string;
    search?: string;
    deployment?: string;
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
