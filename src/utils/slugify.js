/**
 * Slug generation utility for MCP server reference pages
 * Converts server names to URL-friendly slugs
 */

/**
 * Generate a URL-friendly slug from a server name
 * @param {string} name - The server name
 * @returns {string} URL-friendly slug
 */
export function slugify(name) {
  if (!name) return 'unknown';
  
  return name
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');
}

/**
 * Generate a unique slug, appending a suffix if needed
 * @param {string} name - The server name
 * @param {Set<string>} existingSlugs - Set of existing slugs to check against
 * @returns {string} Unique URL-friendly slug
 */
export function slugifyUnique(name, existingSlugs) {
  const baseSlug = slugify(name);
  
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }
  
  // Append incrementing number until unique
  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.has(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

/**
 * Create a slug map from an array of servers
 * Maps slugs to server IDs for lookup
 * @param {Array} servers - Array of server objects with id and fields.name
 * @returns {Map<string, string>} Map of slug -> server id
 */
export function createSlugMap(servers) {
  const slugMap = new Map();
  const usedSlugs = new Set();
  
  for (const server of servers) {
    const name = server.fields?.name || server.name || server.id;
    const slug = slugifyUnique(name, usedSlugs);
    usedSlugs.add(slug);
    slugMap.set(slug, server.id);
  }
  
  return slugMap;
}

/**
 * Get slug for a specific server
 * @param {Object} server - Server object
 * @returns {string} Slug for the server
 */
export function getServerSlug(server) {
  const name = server.fields?.name || server.name || server.id;
  return slugify(name);
}
