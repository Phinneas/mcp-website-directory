/**
 * GET /api/v1/servers/:id
 *
 * Public API route for the mymcpshelf CLI.
 * Returns full server detail including security audit, reliability, env schema,
 * and the CLI-installable command/args configuration.
 */
import type { APIRoute } from 'astro';
import { getServerBySlug } from '../../../../utils/d1';

export const prerender = false;

function parseJsonField(raw: string | null): any {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

interface EnvSchemaEntry {
  required: boolean;
  description: string;
}

function buildEnvSchema(
  serverId: string,
  envSchemaJson: string | null,
  category: string | null
): Record<string, EnvSchemaEntry> {
  if (envSchemaJson) {
    const parsed = parseJsonField(envSchemaJson);
    if (parsed && typeof parsed === 'object') return parsed;
  }

  // Fallback: infer from known server IDs / categories
  const KNOWN_ENV: Record<string, Record<string, EnvSchemaEntry>> = {
    'github-official-mcp-new': { GITHUB_TOKEN: { required: true, description: 'GitHub PAT or OAuth token' } },
    'github': { GITHUB_TOKEN: { required: true, description: 'GitHub PAT' } },
    'git-mcp-idosal': { GITHUB_TOKEN: { required: true, description: 'GitHub PAT' } },
    'upstash-context7': { CONTEXT7_API_KEY: { required: false, description: 'Context7 API key (optional for public docs)' } },
    'figma-context-mcp': { FIGMA_ACCESS_TOKEN: { required: true, description: 'Figma Personal Access Token' } },
    'awslabs-mcp-official': { AWS_ACCESS_KEY_ID: { required: true, description: 'AWS Access Key ID' }, AWS_SECRET_ACCESS_KEY: { required: true, description: 'AWS Secret Access Key' }, AWS_REGION: { required: false, description: 'AWS region (default: us-east-1)' } },
    'gdrive-mcp': { GOOGLE_OAUTH_TOKEN: { required: true, description: 'Google OAuth token' }, GOOGLE_CLIENT_ID: { required: true, description: 'Google OAuth Client ID' }, GOOGLE_CLIENT_SECRET: { required: true, description: 'Google OAuth Client Secret' } },
    'whatsapp-mcp': { WHATSAPP_SESSION: { required: true, description: 'WhatsApp session credentials' } },
    'slack-mcp': { SLACK_BOT_TOKEN: { required: true, description: 'Slack Bot Token (xoxb-...)' } },
    'brave-search-mcp': { BRAVE_API_KEY: { required: true, description: 'Brave Search API key' } },
    'tavily-mcp': { TAVILY_API_KEY: { required: true, description: 'Tavily API key' } },
    'firecrawl-mcp-official': { FIRECRAWL_API_KEY: { required: true, description: 'Firecrawl API key' } },
    'notion-mcp-official': { NOTION_API_KEY: { required: true, description: 'Notion Integration Token' } },
    'atlassian-mcp': { CONFLUENCE_URL: { required: true, description: 'Confluence base URL' }, JIRA_URL: { required: true, description: 'Jira base URL' }, ATLASSIAN_TOKEN: { required: true, description: 'Atlassian API token' } },
    'googleapis-genai-toolbox': { GOOGLE_CLOUD_PROJECT: { required: true, description: 'Google Cloud project ID' } },
    'mindsdb-mcp': { MINDSDB_API_KEY: { required: false, description: 'MindsDB API key (optional for self-hosted)' } },
  };

  if (KNOWN_ENV[serverId]) return KNOWN_ENV[serverId];

  // Category-based fallback
  if (category === 'databases') return { DATABASE_URL: { required: true, description: 'Database connection string' } };
  if (category === 'cloud') return { API_KEY: { required: true, description: 'Cloud provider API key' } };
  if (category === 'communication') return { API_TOKEN: { required: true, description: 'Service API token' } };

  return {};
}

export const GET: APIRoute = async ({ params, locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;
  if (!db) {
    return new Response(
      JSON.stringify({ error: 'Database unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const serverId = params.id;
  if (!serverId) {
    return new Response(
      JSON.stringify({ error: 'Missing server ID' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  const server = await getServerBySlug(db, serverId);
  if (!server) {
    return new Response(
      JSON.stringify({ error: 'Server not found', id: serverId }),
      { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Read raw row to access scan columns
  const row = await db
    .prepare('SELECT env_schema_json, badge_tier, last_scan_at, scan_summary_json FROM servers WHERE id = ?')
    .bind(serverId)
    .first<{ env_schema_json: string | null; badge_tier: string | null; last_scan_at: string | null; scan_summary_json: string | null }>();

  const audit = server.securityAudit;
  const reliability = server.reliability;

  // Badge tier from security scanning (Task 13)
  const badgeTier = row?.badge_tier || 'unverified';
  let scanSummary: any = null;
  if (row?.scan_summary_json) {
    try { scanSummary = JSON.parse(row.scan_summary_json); } catch {}
  }

  // Compute verified status: audit ≥ 50 AND dependencyHealth !== 'critical' AND badge_tier !== 'unverified'
  const auditScore = audit?.auditScore ?? 0;
  const depHealth = scanSummary?.socket_dev?.dependency_health ?? (audit as any)?.dependencyHealth ?? 'unscanned';
  const verified = auditScore >= 50 && depHealth !== 'critical' && badgeTier !== 'unverified';

  // Build CLI-installable command/args
  const npmPackage = server.fields.npm_package;
  const command = npmPackage ? 'npx' : '';
  const args = npmPackage ? ['-y', npmPackage] : [];

  const envSchema = buildEnvSchema(
    serverId,
    row?.env_schema_json ?? null,
    server.fields.category
  );

  const response = {
    id: server.id,
    name: server.fields.name,
    description: server.fields.description,
    npm_package: npmPackage,
    command,
    args,
    env_schema: envSchema,
    security: audit ? {
      audit_score: audit.auditScore,
      tier: audit.auditScore >= 80 ? 'Secure' : audit.auditScore >= 50 ? 'Moderate' : 'At Risk',
      transport: audit.transport,
      auth_method: audit.authMethod,
      token_lifecycle: audit.tokenLifecycle,
      input_handling: audit.inputHandling,
      data_residency: audit.dataResidency,
      dependency_health: depHealth,
      dependency_score: (audit as any).dependencyScore ?? 0,
    } : null,
    scan: scanSummary ? {
      overall_score: scanSummary.overall_score,
      badge_tier: badgeTier,
      last_scan_at: row?.last_scan_at,
      static_analysis: scanSummary.static_analysis,
      socket_dev: scanSummary.socket_dev,
      mcp_scan: scanSummary.mcp_scan,
      cve_watchlist: scanSummary.cve_watchlist,
    } : {
      overall_score: null,
      badge_tier: badgeTier,
      last_scan_at: row?.last_scan_at,
      static_analysis: null,
      socket_dev: null,
      mcp_scan: null,
      cve_watchlist: null,
    },
    reliability: reliability ? {
      score: reliability.score,
      tier: reliability.tier,
      label: reliability.label,
    } : null,
    verified,
    category: server.fields.category,
    language: server.fields.language,
    stars: server.fields.stars,
    github_url: server.fields.github_url,
    shelf_url: `https://www.mymcpshelf.com/server/${server.id}`,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
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
