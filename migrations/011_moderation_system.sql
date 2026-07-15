-- Moderation system: user profiles, review reports, moderation log
-- Trigger: traffic growth justifies moderation investment for review quality

-- Users table — persists GitHub user profiles (previously missing but JOINed by reviews API)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                          -- gh_{github_id}
  github_id INTEGER NOT NULL UNIQUE,
  github_username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  github_account_age_days INTEGER,
  github_public_repos INTEGER,
  github_followers INTEGER,
  is_moderator INTEGER NOT NULL DEFAULT 0,
  is_banned INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Review reports — users flag reviews for moderator attention
CREATE TABLE IF NOT EXISTS review_reports (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,                         -- 'spam', 'abusive', 'irrelevant', 'misleading', 'other'
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'pending',       -- 'pending', 'resolved', 'dismissed'
  created_at TEXT NOT NULL,
  UNIQUE(review_id, reporter_id)
);

-- Moderation log — audit trail of all moderator actions
CREATE TABLE IF NOT EXISTS moderation_log (
  id TEXT PRIMARY KEY,
  moderator_id TEXT NOT NULL,
  action TEXT NOT NULL,                         -- 'hide', 'restore', 'delete', 'ban_user', 'unban_user', 'dismiss_report'
  target_type TEXT NOT NULL,                    -- 'review', 'user'
  target_id TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);

-- Add moderation columns to existing user_reviews table
ALTER TABLE user_reviews ADD COLUMN moderation_note TEXT;
ALTER TABLE user_reviews ADD COLUMN flagged_at TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON review_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_review ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_modlog_target ON moderation_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON user_reviews(status, flagged_at);
