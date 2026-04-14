-- Migration: Add deployment type metadata to mcp_servers table
-- This migration enables navigation reorganization by deployment target

-- Add deployment_type column with categories matching the navigation structure
ALTER TABLE mcp_servers 
ADD COLUMN deployment_type TEXT NOT NULL DEFAULT 'hybrid';

-- Add comments for documentation
COMMENT ON COLUMN mcp_servers.deployment_type IS 
'Deployment target category: local_stdio, cloud_native, self_hosted, enterprise_saas, or hybrid';

-- Add deployment_metadata JSONB column for extensible deployment configuration
ALTER TABLE mcp_servers 
ADD COLUMN deployment_metadata JSONB;

COMMENT ON COLUMN mcp_servers.deployment_metadata IS 
'JSON blob containing deployment-specific configuration like ports, auth requirements, etc.';

-- Add enterprise_features array to tag enterprise-ready capabilities
ALTER TABLE mcp_servers 
ADD COLUMN enterprise_features TEXT[] DEFAULT '{}';

COMMENT ON COLUMN mcp_servers.enterprise_features IS 
'Array of enterprise features like ["sso", "audit_logs", "sla", "support"]'; 

-- Create composite index for fast filtering by deployment type
CREATE INDEX idx_servers_deployment_category 
ON mcp_servers(deployment_type, category, stars DESC);

COMMENT ON INDEX idx_servers_deployment_category IS 
'Composite index for deployment-based navigation queries';

-- Create index for metadata queries (GIN for JSONB)
CREATE INDEX idx_servers_deployment_metadata 
ON mcp_servers USING GIN (deployment_metadata);

COMMENT ON INDEX idx_servers_deployment_metadata IS 
'GIN index for deployment_metadata JSONB queries';

-- Add check constraint to ensure valid deployment types
ALTER TABLE mcp_servers 
ADD CONSTRAINT check_deployment_type 
CHECK (deployment_type IN (
  'local_stdio', 
  'cloud_native', 
  'self_hosted', 
  'enterprise_saas', 
  'hybrid'
));

-- Insert migration metadata for tracking
INSERT INTO schema_migrations (version, description, executed_at)
VALUES ('001', 'Add deployment type columns and indexes', NOW());
