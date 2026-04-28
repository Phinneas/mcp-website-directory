-- Migration: Add health monitoring columns for MCP server maintenance tracking
-- This tracks commit activity, issues, release cadence, and SDK versions

-- Add health monitoring columns individually (D1 SQLite requires separate statements)
ALTER TABLE servers ADD COLUMN last_commit_date TEXT;
ALTER TABLE servers ADD COLUMN open_issues_count INTEGER DEFAULT 0;
ALTER TABLE servers ADD COLUMN health_status TEXT DEFAULT 'unknown';
ALTER TABLE servers ADD COLUMN health_updated_at TEXT;
ALTER TABLE servers ADD COLUMN release_cadence TEXT;
ALTER TABLE servers ADD COLUMN current_release_version TEXT;
ALTER TABLE servers ADD COLUMN mcp_sdk_version TEXT;

-- Add index for health status queries
CREATE INDEX IF NOT EXISTS idx_servers_health_status ON servers(health_status);
CREATE INDEX IF NOT EXISTS idx_servers_last_commit_date ON servers(last_commit_date DESC);

-- Migration tracking (handle D1 SQLite syntax)
INSERT OR IGNORE INTO schema_migrations (version, description, executed_at)
VALUES ('003', 'Add health monitoring columns for maintenance tracking', datetime('now'));

-- Health status values: 'active', 'maintained', 'maintenance_required', 'unknown'
