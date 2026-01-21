/**
 * Server data fetching and transformation utilities
 * Handles fetching from PulseMCP API and managing fallback data
 */

import { fetchAllMCPServers, transformPulseMCPData } from './pulsemcpApi.js';
import { slugify, createSlugMap } from './slugify.js';

// Cache for server data to avoid repeated API calls
let serverCache = null;
let slugToServerMap = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all MCP servers with caching
 * @param {Array} fallbackServers - Static fallback servers if API fails
 * @returns {Promise<Array>} Array of MCP servers
 */
export async function getAllServers(fallbackServers = []) {
  const now = Date.now();
  
  // Return cached data if still valid
  if (serverCache && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
    return serverCache;
  }
  
  try {
    const apiServers = await fetchAllMCPServers();
    
    if (apiServers && apiServers.length > 0) {
      serverCache = transformPulseMCPData(apiServers);
      lastFetchTime = now;
      return serverCache;
    }
  } catch (error) {
    console.error('Error fetching servers:', error);
  }
  
  // Fall back to static data
  serverCache = fallbackServers;
  lastFetchTime = now;
  return serverCache;
}

/**
 * Build a map of slug -> server for efficient lookup
 * @param {Array} servers - Array of MCP servers
 * @returns {Map<string, Object>} Map of slug to server object
 */
export function buildSlugToServerMap(servers) {
  const map = new Map();
  const usedSlugs = new Set();
  
  for (const server of servers) {
    const name = server.fields?.name || server.name || server.id;
    let slug = slugify(name);
    
    // Handle duplicate slugs by appending counter
    if (usedSlugs.has(slug)) {
      let counter = 2;
      while (usedSlugs.has(`${slug}-${counter}`)) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }
    
    usedSlugs.add(slug);
    
    // Store both the server and its computed slug
    map.set(slug, { ...server, slug });
  }
  
  return map;
}

/**
 * Get a single server by slug
 * @param {string} slug - Server slug
 * @param {Array} servers - Array of all servers
 * @returns {Object|null} Server object or null if not found
 */
export function getServerBySlug(slug, servers) {
  const map = buildSlugToServerMap(servers);
  return map.get(slug) || null;
}

/**
 * Get related servers based on category
 * @param {Object} server - Current server
 * @param {Array} allServers - All servers
 * @param {number} limit - Max number of related servers
 * @returns {Array} Array of related servers
 */
export function getRelatedServers(server, allServers, limit = 5) {
  const category = server.fields?.category;
  
  if (!category) {
    // If no category, return top servers by stars excluding current
    return allServers
      .filter(s => s.id !== server.id)
      .sort((a, b) => (b.fields?.stars || 0) - (a.fields?.stars || 0))
      .slice(0, limit);
  }
  
  // Filter by same category, exclude current, sort by stars
  const related = allServers
    .filter(s => s.id !== server.id && s.fields?.category === category)
    .sort((a, b) => (b.fields?.stars || 0) - (a.fields?.stars || 0))
    .slice(0, limit);
  
  // If not enough related servers, fill with top servers from other categories
  if (related.length < limit) {
    const additionalCount = limit - related.length;
    const relatedIds = new Set(related.map(s => s.id));
    relatedIds.add(server.id);
    
    const additional = allServers
      .filter(s => !relatedIds.has(s.id))
      .sort((a, b) => (b.fields?.stars || 0) - (a.fields?.stars || 0))
      .slice(0, additionalCount);
    
    return [...related, ...additional];
  }
  
  return related;
}

/**
 * Generate installation command for a server
 * @param {Object} server - Server object
 * @returns {Object} Installation commands for different methods
 */
export function getInstallationCommands(server) {
  const npmPackage = server.fields?.npm_package;
  const installCommand = server.fields?.installation_command;
  
  const commands = {
    npx: null,
    npm: null,
    manual: null
  };
  
  if (installCommand) {
    // Use provided installation command
    if (installCommand.includes('npx')) {
      commands.npx = installCommand;
    } else if (installCommand.includes('npm install')) {
      commands.npm = installCommand;
    } else {
      commands.manual = installCommand;
    }
  }
  
  if (npmPackage) {
    // Generate standard commands from npm package
    if (!commands.npx) {
      commands.npx = `npx -y ${npmPackage}`;
    }
    if (!commands.npm) {
      commands.npm = `npm install ${npmPackage}`;
    }
  }
  
  // Manual/Git install from GitHub
  const githubUrl = server.fields?.github_url;
  if (githubUrl && !commands.manual) {
    commands.manual = `git clone ${githubUrl}`;
  }
  
  return commands;
}

/**
 * Generate Claude Desktop configuration example
 * @param {Object} server - Server object
 * @returns {Object} Configuration object for Claude Desktop
 */
export function generateClaudeConfig(server) {
  const name = server.fields?.name || 'server';
  const npmPackage = server.fields?.npm_package;
  const envVars = server.fields?.environment_variables || [];
  
  // Create a safe key name for the config
  const configKey = slugify(name);
  
  const config = {
    mcpServers: {}
  };
  
  if (npmPackage) {
    config.mcpServers[configKey] = {
      command: 'npx',
      args: ['-y', npmPackage]
    };
    
    // Add environment variables if any
    if (envVars.length > 0) {
      config.mcpServers[configKey].env = {};
      for (const envVar of envVars) {
        config.mcpServers[configKey].env[envVar.name] = envVar.default || `<YOUR_${envVar.name}>`;
      }
    }
  } else {
    // Fallback for non-npm packages
    config.mcpServers[configKey] = {
      command: 'node',
      args: ['path/to/server.js']
    };
  }
  
  return config;
}

/**
 * Format star count for display
 * @param {number} stars - Star count
 * @returns {string} Formatted star count
 */
export function formatStars(stars) {
  if (!stars) return '0';
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars.toString();
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Unknown';
  }
}

/**
 * Get category display name
 * @param {string} category - Category slug
 * @returns {string} Display name
 */
export function getCategoryDisplayName(category) {
  const categoryNames = {
    'aggregators': 'Aggregators & Platforms',
    'ai-tools': 'AI Tools',
    'browser-automation': 'Browser Automation',
    'cloud': 'Cloud & Infrastructure',
    'communication': 'Communication',
    'databases': 'Databases',
    'development': 'Development Tools',
    'file-systems': 'File Systems',
    'finance': 'Finance',
    'knowledge-rag': 'Knowledge & RAG',
    'media': 'Media & Multimedia',
    'productivity': 'Productivity',
    'search': 'Search & Web Scraping',
    'security': 'Security',
    'data-analytics': 'Data & Analytics',
    'other': 'Other'
  };
  
  return categoryNames[category] || category || 'Other';
}

/**
 * Get status badge info
 * @param {string} status - Server status
 * @returns {Object} Badge color and label
 */
export function getStatusBadge(status) {
  const badges = {
    'official': { color: 'blue', label: 'Official' },
    'community': { color: 'green', label: 'Community' },
    'beta': { color: 'yellow', label: 'Beta' },
    'deprecated': { color: 'red', label: 'Deprecated' }
  };
  
  return badges[status] || badges['community'];
}
