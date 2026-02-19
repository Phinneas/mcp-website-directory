/**
 * Ghost CMS API Integration for MCP Server Metadata
 * Fetches server configuration data from Ghost CMS Content API
 */

import GhostContentAPI from '@tryghost/content-api';

// Ghost API configuration from environment variables
const ghostUrl = import.meta.env.GHOST_API_URL || 'https://ghost.mymcpshelf.com';
const ghostKey = import.meta.env.GHOST_CONTENT_API_KEY;

// Initialize Ghost Content API client
let ghostApi: ReturnType<typeof GhostContentAPI> | null = null;

function getGhostApi() {
  if (!ghostApi && ghostKey) {
    ghostApi = new GhostContentAPI({
      url: ghostUrl,
      key: ghostKey,
      version: 'v5.0'
    });
  }
  return ghostApi;
}

/**
 * Ghost MCP Server Post Structure
 */
export interface GhostMCPServer {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  feature_image: string | null;
  tags: GhostTag[];
  published_at: string;
  updated_at: string;
  url: string;
  // Custom fields stored in code injection or front matter
  npm_package?: string;
  github_url?: string;
  category?: string;
  language?: string;
  docker_image?: string;
  config_command?: string;
  config_args?: string[];
  env_vars?: string[];
  stars?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

/**
 * Fetch all MCP servers from Ghost CMS
 */
export async function fetchGhostMCPServers(): Promise<GhostMCPServer[]> {
  const api = getGhostApi();
  if (!api) {
    console.warn('Ghost API not configured, falling back to static data');
    return [];
  }

  try {
    const posts = await api.posts.browse({
      filter: 'tag:mcp-server',
      fields: ['id', 'slug', 'title', 'excerpt', 'feature_image', 'published_at', 'updated_at', 'url'],
      include: ['tags'],
      limit: 'all'
    });

    return posts.map(post => parseGhostServer(post));
  } catch (error) {
    console.error('Failed to fetch MCP servers from Ghost:', error);
    return [];
  }
}

/**
 * Fetch a single MCP server by slug
 */
export async function fetchGhostMCPServer(slug: string): Promise<GhostMCPServer | null> {
  const api = getGhostApi();
  if (!api) {
    return null;
  }

  try {
    const post = await api.posts.read({
      slug
    }, {
      include: ['tags']
    });

    return post ? parseGhostServer(post) : null;
  } catch (error) {
    console.error(`Failed to fetch MCP server ${slug}:`, error);
    return null;
  }
}

/**
 * Parse Ghost post into MCP server format
 */
function parseGhostServer(post: any): GhostMCPServer {
  const server: GhostMCPServer = {
    id: post.slug,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    feature_image: post.feature_image,
    tags: post.tags || [],
    published_at: post.published_at,
    updated_at: post.updated_at,
    url: post.url
  };

  // Extract custom fields from tags
  const tags = post.tags || [];
  
  // Find category tag (not system tags)
  const categoryTag = tags.find((t: GhostTag) => 
    !['mcp-server', 'hash-mcp'].includes(t.slug) && 
    !t.slug.startsWith('hash-')
  );
  if (categoryTag) {
    server.category = categoryTag.slug;
  }

  // Parse metadata from code injection head (if available)
  if (post.codeinjection_head) {
    const metadata = extractMetadataFromHTML(post.codeinjection_head);
    Object.assign(server, metadata);
  }

  // Parse metadata from excerpt if formatted as key:value pairs
  const excerptMeta = parseExcerptMetadata(post.excerpt);
  if (excerptMeta) {
    Object.assign(server, excerptMeta);
  }

  return server;
}

/**
 * Extract metadata from HTML code injection
 */
function extractMetadataFromHTML(html: string): Partial<GhostMCPServer> {
  const metadata: Partial<GhostMCPServer> = {};
  
  // Look for meta tags with mcp- prefix
  const metaRegex = /<meta name="mcp-(\w+)" content="([^"]+)"/g;
  let match;
  
  while ((match = metaRegex.exec(html)) !== null) {
    const key = match[1].replace(/-/g, '_');
    const value = match[2];
    
    if (key === 'npm_package' || key === 'github_url' || key === 'docker_image' || 
        key === 'config_command' || key === 'category' || key === 'language') {
      metadata[key] = value;
    } else if (key === 'stars') {
      metadata[key] = parseInt(value, 10);
    } else if (key === 'env_vars') {
      metadata[key] = value.split(',').map(v => v.trim());
    }
  }
  
  return metadata;
}

/**
 * Parse metadata from excerpt (key: value format)
 */
function parseExcerptMetadata(excerpt: string | null): Partial<GhostMCPServer> | null {
  if (!excerpt) return null;
  
  const metadata: Partial<GhostMCPServer> = {};
  const lines = excerpt.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      const normalizedKey = key.toLowerCase().replace(/-/g, '_');
      
      if (normalizedKey === 'npm' || normalizedKey === 'npm_package') {
        metadata.npm_package = value.trim();
      } else if (normalizedKey === 'github' || normalizedKey === 'github_url') {
        metadata.github_url = value.trim();
      } else if (normalizedKey === 'docker' || normalizedKey === 'docker_image') {
        metadata.docker_image = value.trim();
      } else if (normalizedKey === 'category') {
        metadata.category = value.trim();
      } else if (normalizedKey === 'language') {
        metadata.language = value.trim();
      } else if (normalizedKey === 'env' || normalizedKey === 'env_vars') {
        metadata.env_vars = value.split(',').map(v => v.trim());
      }
    }
  }
  
  return Object.keys(metadata).length > 0 ? metadata : null;
}

/**
 * Get MCP servers by category from Ghost
 */
export async function fetchGhostMCPServersByCategory(category: string): Promise<GhostMCPServer[]> {
  const api = getGhostApi();
  if (!api) {
    return [];
  }

  try {
    const posts = await api.posts.browse({
      filter: `tag:mcp-server+tag:${category}`,
      limit: 'all'
    });

    return posts.map(post => parseGhostServer(post));
  } catch (error) {
    console.error(`Failed to fetch MCP servers for category ${category}:`, error);
    return [];
  }
}

/**
 * Search MCP servers in Ghost
 */
export async function searchGhostMCPServers(query: string): Promise<GhostMCPServer[]> {
  const api = getGhostApi();
  if (!api) {
    return [];
  }

  try {
    const posts = await api.posts.browse({
      filter: `tag:mcp-server+title:~'${query}'+excerpt:~'${query}'`,
      limit: 'all'
    });

    return posts.map(post => parseGhostServer(post));
  } catch (error) {
    console.error(`Failed to search MCP servers for "${query}":`, error);
    return [];
  }
}

/**
 * Transform Ghost server to internal format
 */
export function transformGhostServerToInternal(ghost: GhostMCPServer) {
  return {
    id: ghost.slug,
    fields: {
      name: ghost.title,
      description: ghost.excerpt,
      category: ghost.category || 'other',
      language: ghost.language,
      stars: ghost.stars || 0,
      github_url: ghost.github_url,
      npm_package: ghost.npm_package,
      logoUrl: ghost.feature_image,
      logoSource: 'ghost',
      updated: ghost.updated_at
    }
  };
}

/**
 * Check if Ghost integration is available
 */
export function isGhostAvailable(): boolean {
  return !!(ghostUrl && ghostKey);
}

/**
 * Get Ghost configuration status
 */
export function getGhostConfig() {
  return {
    url: ghostUrl,
    configured: !!(ghostUrl && ghostKey),
    keyPresent: !!ghostKey
  };
}
