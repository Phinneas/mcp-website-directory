-- Migration: Update deployment types based on server characteristics
-- This migration categorizes servers by deployment target using keyword analysis

-- Update servers with cloud-native characteristics (SSE/WebSocket/API-based)
UPDATE servers 
SET deployment_type = 'cloud_native' 
WHERE deployment_type = 'hybrid'
AND (
  LOWER(name) LIKE '%cloud%' OR 
  LOWER(description) LIKE '%cloud%' OR 
  LOWER(description) LIKE '%sse%' OR 
  LOWER(description) LIKE '%websocket%' OR
  LOWER(description) LIKE '%distributed%' OR
  LOWER(description) LIKE '%multi-user%' OR
  LOWER(description) LIKE '%api%' OR
  LOWER(description) LIKE '%saas%'
);

-- Update servers with self-hosted characteristics  
UPDATE servers 
SET deployment_type = 'self_hosted'
WHERE deployment_type = 'hybrid'
AND (
  LOWER(name) LIKE '%self-hosted%' OR 
  LOWER(name) LIKE '%docker%' OR
  LOWER(description) LIKE '%self-hosted%' OR 
  LOWER(description) LIKE '%vpc%' OR 
  LOWER(description) LIKE '%on-premise%' OR
  LOWER(description) LIKE '%deploy%'
);

-- Update servers with enterprise characteristics
UPDATE servers 
SET deployment_type = 'enterprise_saas'
WHERE deployment_type = 'hybrid'
AND (
  LOWER(name) LIKE '%enterprise%' OR 
  LOWER(description) LIKE '%enterprise%' OR 
  LOWER(description) LIKE '%sla%' OR 
  LOWER(description) LIKE '%ssso%' OR
  LOWER(description) LIKE '%compliance%' OR
  LOWER(description) LIKE '%production%'
);

-- Update specific enterprise platforms
UPDATE servers 
SET deployment_type = 'enterprise_saas'
WHERE deployment_type = 'hybrid'
AND id IN (
  'mindsdb', 'activepieces', 'mastra', 'mastra-docs', 
  'jetstream', 'fastmcp', 'metamcp'
);

-- Remaining hybrid servers become local_stdio (default CLI/stdio-based)
UPDATE servers 
SET deployment_type = 'local_stdio' 
WHERE deployment_type = 'hybrid';

-- Verify the distribution
SELECT deployment_type, COUNT(*) as count 
FROM servers 
GROUP BY deployment_type
ORDER BY count DESC;

-- Add migration tracking
INSERT INTO schema_migrations (version, description, executed_at)
VALUES ('002', 'Update deployment types based on server characteristics', NOW())
ON CONFLICT (version) DO NOTHING;
