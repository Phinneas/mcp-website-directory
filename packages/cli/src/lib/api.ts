/**
 * API client for mymcpshelf public API.
 * Zero dependencies — uses node:https only.
 */

const DEFAULT_API_BASE = 'https://www.mymcpshelf.com';

export interface ServerDetail {
  id: string;
  name: string;
  description: string;
  npm_package: string | null;
  command: string;
  args: string[];
  env_schema: Record<string, { required: boolean; description: string }>;
  security: {
    audit_score: number;
    tier: string;
    transport: string;
    auth_method: string;
    token_lifecycle: string;
    input_handling: string;
    data_residency: string;
    dependency_health: string;
    dependency_score: number;
  } | null;
  reliability: { score: number; tier: string; label: string } | null;
  verified: boolean;
  category: string;
  language: string;
  stars: number;
  github_url: string;
  shelf_url: string;
}

export interface ServerSearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  language: string;
  stars: number;
  npm_package: string | null;
  audit_score: number;
  tier: string | null;
  dependency_health: string;
  verified: boolean;
}

export interface SearchResponse {
  servers: ServerSearchResult[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface FeaturedServer {
  id: string;
  name: string;
  description: string;
  stars: number;
  github_url: string | null;
  npm_package: string | null;
  author: string;
  shelf_url: string;
  week?: string;
  featured_at?: string;
}

let apiBase = process.env.MYMCPSHELF_API_URL || DEFAULT_API_BASE;

export function setApiBase(url: string): void {
  apiBase = url.replace(/\/+$/, '');
}

export function getApiBase(): string {
  return apiBase;
}

async function getHttpModule(url: URL) {
  if (url.protocol === 'https:') return await import('node:https');
  return await import('node:http');
}

function fetchJson<T>(path: string): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const url = new URL(path, apiBase);
    const mod = await getHttpModule(url);

    mod.get(url.toString(), { headers: { 'Accept': 'application/json', 'User-Agent': 'mymcpshelf-cli/0.1.0' } }, (res: any) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson<T>(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode && res.statusCode >= 400) {
        let body = '';
        res.on('data', (c: Buffer) => (body += c));
        res.on('end', () => {
          try {
            const err = JSON.parse(body);
            reject(new Error(err.error || `HTTP ${res.statusCode}`));
          } catch {
            reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
          }
        });
        return;
      }
      let body = '';
      res.on('data', (c: Buffer) => (body += c));
      res.on('end', () => {
        try { resolve(JSON.parse(body) as T); }
        catch (e) { reject(new Error(`Invalid JSON from ${path}: ${body.slice(0, 100)}`)); }
      });
    }).on('error', reject);
  });
}

function postJson<T>(path: string, body: any): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const url = new URL(path, apiBase);
    const mod = await getHttpModule(url);
    const data = JSON.stringify(body);

    const req = mod.request(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'mymcpshelf-cli/0.1.0',
      },
    }, (res: any) => {
      let responseBody = '';
      res.on('data', (c: Buffer) => (responseBody += c));
      res.on('end', () => {
        try { resolve(JSON.parse(responseBody) as T); }
        catch { resolve({ ok: true } as T); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export async function getServer(id: string): Promise<ServerDetail> {
  return fetchJson<ServerDetail>(`/api/v1/servers/${encodeURIComponent(id)}`);
}

export async function searchServers(query: string, limit = 20, offset = 0): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, limit: String(limit), offset: String(offset) });
  return fetchJson<SearchResponse>(`/api/v1/servers?${params}`);
}

export async function reportInstall(serverId: string, client: string, auditSnapshot?: any): Promise<{ ok: boolean }> {
  return postJson<{ ok: boolean }>('/api/v1/installs', {
    server_id: serverId,
    client,
    timestamp: new Date().toISOString(),
    audit_snapshot: auditSnapshot || null,
  });
}

export async function getFeatured(weekly = false, count = 1, exclude: string[] = []): Promise<{ featured: FeaturedServer[] }> {
  const params = new URLSearchParams();
  if (weekly) params.set('weekly', 'true');
  if (count > 1) params.set('count', String(count));
  if (exclude.length) params.set('exclude', exclude.join(','));
  return fetchJson<{ featured: FeaturedServer[] }>(`/api/v1/featured?${params}`);
}
