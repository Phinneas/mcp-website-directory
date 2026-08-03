/**
 * Stable, unique slug generation for MCP server detail pages.
 *
 * Background: server.id is NOT unique (528 duplicate ids in the dataset,
 * e.g. 11 distinct "Google Calendar" repos share id "google-calendar").
 * The previous scheme used slugify(server.fields.name) + a dedup counter
 * (-2, -3...), but server.fields.name mutates between data refreshes, so
 * every refresh broke old URLs and accumulated 404s in Google Search Console.
 *
 * This module derives slugs from IMMUTABLE fields so URLs never drift:
 *   - base = slugify(server.id)            // stable; id never changes
 *   - if id is unique  -> base is the slug
 *   - if id collides   -> append a disambiguator from an immutable field:
 *        prefer github owner-repo  -> "amornpan-py-mcp-gcalendar"
 *        else npm package          -> "cablate-mcp-google-calendar"
 *        else author without '@'   -> "amornpan"
 *   Result examples: "google-calendar", "google-calendar-amornpan-py-mcp-gcalendar"
 *
 * Also provides buildLegacySlugMap() to map the OLD name-based slugs
 * (slugify(name) + dedup counter) to the new stable slugs, so the
 * /server/[slug] route can 301-redirect old URLs that Google has indexed.
 */

import { slugify } from './slugify.js';

interface ServerLike {
  id: string;
  fields?: {
    name?: string;
    github_url?: string | null;
    npm_package?: string | null;
    author?: string | null;
  };
}

/**
 * Extract a stable disambiguator for a server from its immutable fields.
 * Returns null if no disambiguator is available (should be rare).
 */
export function serverDisambiguator(server: ServerLike): string | null {
  const f = server.fields || {};

  // Prefer GitHub owner/repo — stable and unique per repo
  if (f.github_url) {
    const m = f.github_url.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?(?:\/.*)?$/i);
    if (m && m[1]) {
      return slugify(m[1]);
    }
  }

  // Fallback to npm package name — stable
  if (f.npm_package) {
    return slugify(f.npm_package);
  }

  // Last resort: author handle (strip leading @)
  if (f.author) {
    const a = f.author.replace(/^@+/, '').trim();
    if (a) return slugify(a);
  }

  return null;
}

/**
 * Compute the stable slug for a single server.
 * Does NOT deduplicate against a set — use buildStableSlugMap() for that.
 */
export function stableSlugForServer(server: ServerLike): string {
  const base = slugify(server.id) || 'unknown';
  const disamb = serverDisambiguator(server);
  // Disambiguate only when needed; callers should use buildStableSlugMap
  // to decide whether the id collides. This base function appends the
  // disambiguator only if the id looks like a generic word that commonly
  // collides — but the authoritative dedup happens in buildStableSlugMap.
  return base;
}

/**
 * Build a map of stableSlug -> server for the full dataset, with
 * collision resolution. The FIRST occurrence (by dataset order) of a
 * duplicate id gets the bare base slug; subsequent occurrences get
 * base + disambiguator. If the disambiguator also collides, append a counter.
 */
export function buildStableSlugMap<T extends ServerLike>(servers: T[]): Map<string, T> {
  const idCounts = new Map<string, number>();
  for (const s of servers) {
    const id = slugify(s.id) || 'unknown';
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
  }

  const used = new Set<string>();
  const seenCount = new Map<string, number>();
  const map = new Map<string, T>();

  for (const s of servers) {
    const base = slugify(s.id) || 'unknown';
    const total = idCounts.get(base) || 1;
    const seen = (seenCount.get(base) || 0) + 1;
    seenCount.set(base, seen);

    let slug = base;
    if (total > 1) {
      // First occurrence keeps the bare slug only if it has a disambiguator
      // available too (so all duplicates are disambiguated consistently).
      // Simpler & safer: disambiguate EVERY occurrence when id collides.
      const disamb = serverDisambiguator(s);
      if (disamb) {
        slug = `${base}-${disamb}`;
      }
      // Resolve any remaining collision with a counter
      let n = 2;
      while (used.has(slug)) {
        slug = `${base}${disamb ? `-${disamb}` : ''}-${n}`;
        n++;
      }
    }
    // Guard against collisions even for unique ids (defensive)
    let n = 2;
    while (used.has(slug)) {
      slug = `${base}-${n}`;
      n++;
    }
    used.add(slug);
    map.set(slug, s);
  }

  return map;
}

/**
 * Build the reverse lookup: server -> its stable slug.
 */
export function buildServerToSlugMap<T extends ServerLike>(servers: T[]): Map<T, string> {
  const stable = buildStableSlugMap(servers);
  const reverse = new Map<T, string>();
  for (const [slug, s] of stable) {
    reverse.set(s, slug);
  }
  return reverse;
}

/**
 * Build a map from OLD name-based slugs (slugify(name) + dedup counter,
 * matching the legacy [slug].astro logic) to NEW stable slugs.
 * Used by /server/[slug].astro to 301-redirect URLs Google has already
 * indexed under the old scheme.
 *
 * The legacy dedup logic (from the old [slug].astro):
 *   usedSlugs = Set, for each server: s = slugify(name); if used, append -2,-3...
 */
export function buildLegacyToStableSlugMap<T extends ServerLike>(servers: T[]): Map<string, string> {
  const stable = buildStableSlugMap(servers);
  const stableByServer = new Map<T, string>();
  for (const [slug, s] of stable) stableByServer.set(s, slug);

  const legacyUsed = new Set<string>();
  const legacyToStable = new Map<string, string>();

  for (const s of servers) {
    const name = s.fields?.name || s.id;
    let leg = slugify(name);
    if (!leg) leg = 'unknown';
    if (legacyUsed.has(leg)) {
      let counter = 2;
      while (legacyUsed.has(`${leg}-${counter}`)) counter++;
      leg = `${leg}-${counter}`;
    }
    legacyUsed.add(leg);
    const stableSlug = stableByServer.get(s);
    if (stableSlug && stableSlug !== leg) {
      legacyToStable.set(leg, stableSlug);
    }
  }

  return legacyToStable;
}

/**
 * Convenience: get the stable slug for a single server in the context
 * of a full dataset (needed to know whether the id collides).
 */
export function getStableSlug<T extends ServerLike>(server: T, allServers: T[]): string {
  const map = buildServerToSlugMap(allServers);
  return map.get(server) || slugify(server.id) || 'unknown';
}
