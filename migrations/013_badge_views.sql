-- Migration 013: badge_views — adoption tracking for embeddable badges
-- Tracks how many times each server's badge is requested (sampled 1:10)

CREATE TABLE IF NOT EXISTS badge_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_slug TEXT NOT NULL,
  badge_state TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  viewed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_badge_views_slug ON badge_views(server_slug);
CREATE INDEX IF NOT EXISTS idx_badge_views_state ON badge_views(badge_state);
CREATE INDEX IF NOT EXISTS idx_badge_views_date ON badge_views(viewed_at DESC);

-- Aggregated adoption metric (updated by a cron or computed on read)
CREATE TABLE IF NOT EXISTS badge_adoption (
  server_slug TEXT PRIMARY KEY,
  total_views INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TEXT,
  updated_at TEXT NOT NULL
);
