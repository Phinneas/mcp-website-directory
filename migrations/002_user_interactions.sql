-- User interaction tables for authenticated community features
-- Trigger condition: 1,000+ monthly active users (met June 2026)

-- Reviews: authenticated users can write one review per server
CREATE TABLE IF NOT EXISTS user_reviews (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  usage_context TEXT,           -- 'production', 'staging', 'development', 'evaluation'
  deployment_type TEXT,          -- 'local_stdio', 'cloud_native', 'self_hosted', 'enterprise_saas'
  verified_usage INTEGER NOT NULL DEFAULT 0,  -- 1 if user demonstrated actual usage
  helpful_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',      -- 'active', 'hidden', 'flagged'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(server_id, user_id)
);

-- Bookmarks: users can save servers to their shelf
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(server_id, user_id)
);

-- Votes: upvote/downvote on reviews (one per user per review)
CREATE TABLE IF NOT EXISTS user_votes (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  created_at TEXT NOT NULL,
  UNIQUE(review_id, user_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reviews_server ON user_reviews(server_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_server ON user_bookmarks(server_id);
CREATE INDEX IF NOT EXISTS idx_votes_review ON user_votes(review_id);

-- Community stats cache (aggregated per server, updated on write)
-- Avoids expensive COUNT queries on every page load
CREATE TABLE IF NOT EXISTS community_stats (
  server_id TEXT PRIMARY KEY,
  review_count INTEGER NOT NULL DEFAULT 0,
  avg_rating REAL,
  rating_distribution TEXT,     -- JSON: {"1": 0, "2": 0, "3": 1, "4": 5, "5": 10}
  bookmark_count INTEGER NOT NULL DEFAULT 0,
  usage_contexts TEXT,          -- JSON: {"production": 3, "staging": 2, "development": 5}
  updated_at TEXT NOT NULL
);
