-- Install Count Aggregation (Task 14 — Community Performance Index)
-- Aggregates raw install_events into pre-computed counters for the leaderboard.
-- Avoids expensive COUNT/GROUP BY queries on every page load.

-- Pre-computed install counts per server, updated by the aggregation cron
CREATE TABLE IF NOT EXISTS install_counts (
  server_id TEXT PRIMARY KEY,
  total_installs INTEGER NOT NULL DEFAULT 0,
  installs_24h INTEGER NOT NULL DEFAULT 0,
  installs_7d INTEGER NOT NULL DEFAULT 0,
  installs_30d INTEGER NOT NULL DEFAULT 0,
  prev_24h INTEGER NOT NULL DEFAULT 0,        -- previous 24h for trending calculation
  prev_7d INTEGER NOT NULL DEFAULT 0,        -- previous 7d for trend direction
  peak_24h INTEGER NOT NULL DEFAULT 0,        -- highest single-day count ever
  peak_date TEXT,                               -- date of peak_24h
  first_install_at TEXT,                        -- earliest install event timestamp
  last_install_at TEXT,                         -- most recent install event timestamp
  updated_at TEXT NOT NULL                      -- when this row was last aggregated
);
CREATE INDEX IF NOT EXISTS idx_instcounts_total ON install_counts(total_installs DESC);
CREATE INDEX IF NOT EXISTS idx_instcounts_24h ON install_counts(installs_24h DESC);
CREATE INDEX IF NOT EXISTS idx_instcounts_7d ON install_counts(installs_7d DESC);

-- Client breakdown per server (which MCP clients are used)
CREATE TABLE IF NOT EXISTS install_client_breakdown (
  server_id TEXT NOT NULL,
  client TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (server_id, client)
);

-- Hourly install snapshots for time-series charting
CREATE TABLE IF NOT EXISTS install_hourly (
  server_id TEXT NOT NULL,
  hour_key TEXT NOT NULL,     -- e.g. "2026-06-29T14" (ISO hour)
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (server_id, hour_key)
);
CREATE INDEX IF NOT EXISTS idx_hourly_server ON install_hourly(server_id);
CREATE INDEX IF NOT EXISTS idx_hourly_key ON install_hourly(hour_key DESC);

-- Add install_count column to servers for fast sorting without JOIN
ALTER TABLE servers ADD COLUMN install_count INTEGER DEFAULT 0;
ALTER TABLE servers ADD COLUMN installs_24h INTEGER DEFAULT 0;
ALTER TABLE servers ADD COLUMN installs_7d INTEGER DEFAULT 0;
