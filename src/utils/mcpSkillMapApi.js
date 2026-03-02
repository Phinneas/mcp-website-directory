// MCP Skill Map API client for loading and querying MCP-skill relationships

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MCP_MAP_PATH = join(__dirname, '../../data/mcp-skill-map.json');

// Cache for loaded data
let mcpMapCache = null;

/**
 * Load MCP skill map from JSON file
 * @returns {Object} MCP skill mapping object
 */
export function loadMcpSkillMap() {
  if (mcpMapCache) {
    return mcpMapCache;
  }

  if (!existsSync(MCP_MAP_PATH)) {
    console.warn('data/mcp-skill-map.json not found');
    return {};
  }

  try {
    const raw = readFileSync(MCP_MAP_PATH, 'utf-8');
    mcpMapCache = JSON.parse(raw);
    return mcpMapCache;
  } catch (error) {
    console.error('Error loading MCP skill map:', error.message);
    return {};
  }
}

/**
 * Get skills related to an MCP server
 * @param {string} serverName - MCP server name
 * @returns {Array} Related skill names
 */
export function getSkillsForServer(serverName) {
  const mcpMap = loadMcpSkillMap();
  return mcpMap[serverName] || [];
}

/**
 * Get MCP servers related to a skill
 * @param {string} skillName - Skill name
 * @returns {Array} Related MCP server names
 */
export function getServersForSkill(skillName) {
  const mcpMap = loadMcpSkillMap();
  const servers = [];
  
  for (const [server, skills] of Object.entries(mcpMap)) {
    if (skills.includes(skillName)) {
      servers.push(server);
    }
  }
  
  return servers;
}

/**
 * Get all MCP servers from the map
 * @returns {Array} All MCP server names
 */
export function getAllServers() {
  const mcpMap = loadMcpSkillMap();
  return Object.keys(mcpMap);
}

/**
 * Get all skills from the map
 * @returns {Array} All skill names
 */
export function getAllSkills() {
  const mcpMap = loadMcpSkillMap();
  const skills = new Set();
  
  for (const skillList of Object.values(mcpMap)) {
    skillList.forEach(skill => skills.add(skill));
  }
  
  return Array.from(skills);
}

/**
 * Clear the cache
 */
export function clearCache() {
  mcpMapCache = null;
}
