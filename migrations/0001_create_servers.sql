-- Health monitoring columns (SQLite requires one ADD COLUMN per ALTER TABLE)
ALTER TABLE servers ADD COLUMN last_commit_date TEXT;
ALTER TABLE servers ADD COLUMN sdk_version TEXT;
ALTER TABLE servers ADD COLUMN open_issues_count INTEGER;
ALTER TABLE servers ADD COLUMN health_status TEXT;
ALTER TABLE servers ADD COLUMN health_updated_at TEXT;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category);
CREATE INDEX IF NOT EXISTS idx_servers_stars ON servers(stars DESC);
CREATE INDEX IF NOT EXISTS idx_servers_name ON servers(name);
CREATE INDEX IF NOT EXISTS idx_servers_downloads ON servers(downloads DESC);
