#!/usr/bin/env node

/**
 * Script to assign deployment types to servers based on their characteristics
 */

// Keywords for different deployment types
const DEPLOYMENT_KEYWORDS = {
  cloud_native: ['cloud', 'sse', 'websocket', 'api', 'rest', 'http', 'distributed', 'multi-user', 'collaboration', 'team', 'saas', 'kubernetes', 'docker', 'serverless'],
  self_hosted: ['vpc', 'on-premise', 'private', 'self-hosted', 'in-house', 'internal', 'infrastructure', 'deploy', 'docker', 'kubernetes'],
  enterprise_saas: ['enterprise', 'business', 'production', 'scalable', 'sla', 'support', 'audit', 'compliance', 'security', 'ssso', 'saml', 'corporate'],
  local_stdio: ['cli', 'stdio', 'local', 'desktop', 'file', 'filesystem', 'automation', 'script']
};

function inferDeploymentType(server) {
  const text = `${server.name} ${server.description || ''} ${server.category || ''}`.toLowerCase();
  
  let bestMatch = 'local_stdio'; // Default
  let maxMatches = 0;
  
  // Count keyword matches for each deployment type
  for (const [deploymentType, keywords] of Object.entries(DEPLOYMENT_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = deploymentType;
    }
  }
  
  return bestMatch;
}

console.log('Deployment type keywords:');
Object.entries(DEPLOYMENT_KEYWORDS).forEach(([type, keywords]) => {
  console.log(`  ${type}: ${keywords.join(', ')}`);
});

console.log('\nExample server categorization:');
const testServers = [
  { name: 'GitHub MCP Server', description: 'Access GitHub repositories via CLI', category: 'development' },
  { name: 'Cloudflare MCP', description: 'SSE-based cloud communication', category: 'cloud' },
  { name: 'Enterprise AI Server', description: 'Production-ready with SLA and SSO', category: 'aggregators' },
  { name: 'Docker MCP', description: 'Self-hosted deployment', category: 'cloud' },
];

testServers.forEach(server => {
  const type = inferDeploymentType(server);
  console.log(`  ${server.name} -> ${type}`);
});

console.log('\n✓ Deployment type mapping logic ready');
console.log('Note: This script needs DB connection to update deployment_type values');

// Generate SQL UPDATE statements for a sample of servers
console.log('\nSample SQL UPDATE statements:');
console.log(`
-- Update servers with cloud characteristics
UPDATE servers SET deployment_type = 'cloud_native' 
WHERE (name LIKE '%cloud%' OR description LIKE '%cloud%' OR description LIKE '%sse%' OR description LIKE '%websocket%');

-- Update servers with self-hosted characteristics  
UPDATE servers SET deployment_type = 'self_hosted'
WHERE (name LIKE '%self-hosted%' OR description LIKE '%self-hosted%' OR description LIKE '%vpc%' OR description LIKE '%deploy%');

-- Update servers with enterprise characteristics
UPDATE servers SET deployment_type = 'enterprise_saas'
WHERE (name LIKE '%enterprise%' OR description LIKE '%enterprise%' OR description LIKE '%sla%' OR description LIKE '%ssso%');

-- Remaining servers get local_stdio as default
UPDATE servers SET deployment_type = 'local_stdio' WHERE deployment_type = 'hybrid';
`);
