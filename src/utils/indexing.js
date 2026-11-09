/**
 * Indexing policy for MCP server pages.
 *
 * One shared predicate used by both the server detail page's robots meta
 * and the dynamic sitemap, so they can never disagree.
 *
 * Tier A (current): stars >= 20 AND description >= 300 chars.
 * To move to Tier B, change INDEXING_MIN_STARS and INDEXING_MIN_DESC_LENGTH.
 */
import { slugify } from './slugify.js';

/** Minimum GitHub stars for a server to be indexable. */
export const INDEXING_MIN_STARS = 20;

/** Minimum description length (characters) for a server to be indexable. */
export const INDEXING_MIN_DESC_LENGTH = 300;

/**
 * Whether a single server page should be indexed by search engines.
 * @param {{ fields: { stars?: number, description?: string } }} server
 * @returns {boolean}
 */
export function isIndexableServer(server) {
  const stars = server.fields?.stars ?? 0;
  const descLen = (server.fields?.description ?? '').length;
  return stars >= INDEXING_MIN_STARS && descLen >= INDEXING_MIN_DESC_LENGTH;
}

/**
 * Build a slug→id and id→slug map from ALL servers using the same dedup logic
 * as the server detail page ([slug].astro). Then filter to only indexable
 * servers. Deduplicating over all servers first guarantees every slug in the
 * sitemap resolves to the SAME server as the SSR page router, even when a thin
 * server and an indexable server share a name (F1 fix).
 *
 * @param {Array<{ id: string, fields: { name: string, ... } }>} servers
 * @returns {Array<{ id: string, name: string, slug: string }>}
 */
export function getIndexableServers(servers) {
  // Phase 1: build id→slug across ALL servers (same order as [slug].astro)
  const usedSlugs = new Set();
  const idToSlug = new Map();
  const idToName = new Map();

  for (const srv of servers) {
    const name = srv.fields?.name || srv.id;
    let s = slugify(name);
    if (!s) continue;

    if (usedSlugs.has(s)) {
      let counter = 2;
      while (usedSlugs.has(`${s}-${counter}`)) counter++;
      s = `${s}-${counter}`;
    }
    usedSlugs.add(s);
    idToSlug.set(srv.id, s);
    idToName.set(srv.id, name);
  }

  // Phase 2: keep only indexable servers
  const result = [];

  for (const srv of servers) {
    if (!isIndexableServer(srv)) continue;
    const slug = idToSlug.get(srv.id);
    if (!slug) continue;
    result.push({ id: srv.id, name: idToName.get(srv.id), slug });
  }

  return result;
}