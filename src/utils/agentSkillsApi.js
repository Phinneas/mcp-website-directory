// Agent Skills API client for loading and filtering agent skills data

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, '../../data/agent-skills.json');
const MCP_MAP_PATH = join(__dirname, '../../data/mcp-skill-map.json');

// Cache for loaded data
let skillsCache = null;
let mcpMapCache = null;

/**
 * Load agent skills from JSON file
 * @returns {Array} Array of agent skills
 */
export function loadAgentSkills() {
  if (skillsCache) {
    return skillsCache;
  }

  if (!existsSync(DATA_PATH)) {
    console.warn('data/agent-skills.json not found - run scripts/scrape_agent_skills.js first');
    return [];
  }

  try {
    const raw = readFileSync(DATA_PATH, 'utf-8');
    skillsCache = JSON.parse(raw);
    return skillsCache;
  } catch (error) {
    console.error('Error loading agent skills:', error.message);
    return [];
  }
}

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
 * Get all skills
 * @returns {Array} All skills
 */
export function getAllSkills() {
  return loadAgentSkills();
}

/**
 * Get skills by category
 * @param {string} category - Category name
 * @returns {Array} Skills in the category
 */
export function getSkillsByCategory(category) {
  const skills = loadAgentSkills();
  if (category === 'All' || !category) {
    return skills;
  }
  return skills.filter(s => s.category === category);
}

/**
 * Search skills by name or description
 * @param {string} query - Search query
 * @returns {Array} Matching skills
 */
export function searchSkills(query) {
  const skills = loadAgentSkills();
  if (!query || query.trim() === '') {
    return skills;
  }

  const searchTerm = query.toLowerCase().trim();
  return skills.filter(s => 
    s.name.toLowerCase().includes(searchTerm) ||
    s.title.toLowerCase().includes(searchTerm) ||
    s.description.toLowerCase().includes(searchTerm) ||
    s.category.toLowerCase().includes(searchTerm) ||
    s.publisher.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get skill by name
 * @param {string} name - Skill name
 * @returns {Object|null} Skill object or null if not found
 */
export function getSkillByName(name) {
  const skills = loadAgentSkills();
  return skills.find(s => s.name === name) || null;
}

/**
 * Get skills by category
 * @returns {Array} Unique sorted categories with 'All' first
 */
export function getSkillCategories() {
  const skills = loadAgentSkills();
  const categories = ['All', ...new Set(skills.map(s => s.category).filter(Boolean))].sort();
  return categories;
}

/**
 * Get related skills for a given skill
 * @param {string} skillName - Skill name
 * @returns {Array} Related skills
 */
export function getRelatedSkills(skillName) {
  const skills = loadAgentSkills();
  const skill = skills.find(s => s.name === skillName);
  if (!skill) return [];

  // Find skills with same category
  return skills.filter(s => 
    s.category === skill.category && s.name !== skillName
  ).slice(0, 5); // Limit to 5 related skills
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
 * Clear the cache
 */
export function clearCache() {
  skillsCache = null;
  mcpMapCache = null;
}
