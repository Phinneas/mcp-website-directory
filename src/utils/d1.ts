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

function rowToServer(row: MCPServerRow): MCPServer {
  return {
    id: row.id,
    deployment: row.deployment_type || 'local_stdio',
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
  }: {
    offset?: number;
    limit?: number;
    category?: string;
    search?: string;
  } = {}
): Promise<ServersPage> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (category && category !== 'all') {
    conditions.push('category = ?');
    params.push(category);
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
