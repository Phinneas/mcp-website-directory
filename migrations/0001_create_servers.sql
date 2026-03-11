-- MCP Directory: servers table
CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  author TEXT,
  category TEXT DEFAULT 'development',
  language TEXT DEFAULT 'Unknown',
  stars INTEGER DEFAULT 0,
  github_url TEXT,
  npm_package TEXT,
  downloads INTEGER DEFAULT 0,
  logo_url TEXT,
  updated_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category);
CREATE INDEX IF NOT EXISTS idx_servers_stars ON servers(stars DESC);
CREATE INDEX IF NOT EXISTS idx_servers_name ON servers(name);
CREATE INDEX IF NOT EXISTS idx_servers_downloads ON servers(downloads DESC);
