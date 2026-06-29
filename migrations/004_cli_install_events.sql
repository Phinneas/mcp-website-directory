-- CLI install events + weekly featured MCP feed
-- Task 11: npx mymcpshelf add CLI + Public API

-- Anonymous install telemetry from the CLI
CREATE TABLE IF NOT EXISTS install_events (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  client TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  audit_snapshot TEXT,  -- JSON: { score, tier, dep_health }
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_installs_server ON install_events(server_id);
CREATE INDEX IF NOT EXISTS idx_installs_created ON install_events(created_at);

-- Weekly Featured MCP (task 21 feed, shared with newsletter)
CREATE TABLE IF NOT EXISTS featured_mcp_weekly (
  week_key TEXT PRIMARY KEY,  -- e.g. "2026-W27"
  server_id TEXT NOT NULL,
  featured_at TEXT NOT NULL
);

-- Env schema for CLI install prompts
ALTER TABLE servers ADD COLUMN env_schema_json TEXT;
