-- Migration 010: discovered_servers — the first-party discovery queue (task 22).
--
-- Populated by scripts/discovery/run-discovery.mjs (npm registry + GitHub search
-- + the official MCP registry — never a competing directory's API). Candidates
-- flow new → scanned (tasks 13/14) → promoted into the directory (or rejected).

CREATE TABLE IF NOT EXISTS discovered_servers (
  id TEXT PRIMARY KEY,            -- slug from owner/repo or npm package
  owner_repo TEXT,                -- "owner/repo" (primary dedup key)
  npm_package TEXT,
  github_url TEXT,
  name TEXT,
  description TEXT,
  stars INTEGER DEFAULT 0,
  sources TEXT,                   -- csv: "npm,github,registry"
  sdk_verified INTEGER DEFAULT 0, -- 1 = depends on an official MCP SDK (high precision)
  official INTEGER DEFAULT 0,     -- 1 = vendor / registry-official
  score INTEGER DEFAULT 0,        -- discovery ranking score
  status TEXT DEFAULT 'new',      -- 'new' | 'scanned' | 'promoted' | 'rejected'
  discovered_at TEXT NOT NULL,
  scanned_at TEXT,
  promoted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_discovered_status ON discovered_servers(status);
CREATE INDEX IF NOT EXISTS idx_discovered_score ON discovered_servers(score DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_owner ON discovered_servers(owner_repo);
CREATE INDEX IF NOT EXISTS idx_discovered_sdk ON discovered_servers(sdk_verified DESC, score DESC);

INSERT OR IGNORE INTO schema_migrations (version, description, executed_at)
VALUES ('010', 'discovered_servers — first-party discovery queue', datetime('now'));
