/**
 * data.ts — load the bundled curated snapshot (+ optional live enrichment).
 *
 * The snapshot (data/servers.json) is bundled into the extension so browsing
 * works instantly and offline. When the user enables `myMcpShelf.liveData`, we
 * best-effort fetch fresh staleness / green / security scores from
 * mymcpshelf.com and merge them in; any fetch failure falls back silently to
 * the bundled data.
 */
import type { ShelfServer, Snapshot } from './types';
// Inlined by esbuild at build time (loader: '.json').
import snapshot from '../data/servers.json';

const SNAPSHOT = snapshot as Snapshot;

/** All curated servers from the bundled snapshot. */
export function loadServers(): ShelfServer[] {
  return SNAPSHOT.servers;
}

export function snapshotMeta(): { source: string; generatedAt: string; count: number; auditedCount: number } {
  return {
    source: SNAPSHOT.source,
    generatedAt: SNAPSHOT.generatedAt,
    count: SNAPSHOT.count,
    auditedCount: SNAPSHOT.auditedCount,
  };
}

/** Distinct categories present in the snapshot. */
export function categories(): string[] {
  return [...new Set(SNAPSHOT.servers.map((s) => s.fields.category).filter(Boolean))];
}

const API_BASE = 'https://www.mymcpshelf.com';

/**
 * Best-effort live enrichment from the site API. Never throws — on any error it
 * returns the bundled servers unchanged. Only called when liveData is enabled.
 *
 * (The website's /api/v1/servers returns servers with the same ids; we overlay
 * the freshest reliability / green / security fields where present.)
 */
export async function tryEnrichLive(
  bundled: ShelfServer[],
  fetchImpl: typeof fetch = fetch
): Promise<ShelfServer[]> {
  try {
    const res = await fetchImpl(`${API_BASE}/api/v1/servers?limit=600`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return bundled;
    const data = (await res.json()) as { servers?: any[] };
    const live = data.servers;
    if (!Array.isArray(live)) return bundled;

    const byId = new Map(live.map((s: any) => [s.id ?? s.fields?.id, s]));
    return bundled.map((s) => {
      const l = byId.get(s.id);
      if (!l) return s;
      // Overlay any richer score fields the live API carries.
      return {
        ...s,
        securityAudit: l.securityAudit ?? l.security_audit ?? s.securityAudit,
      };
    });
  } catch {
    return bundled; // offline / blocked — fall back to bundled snapshot
  }
}
