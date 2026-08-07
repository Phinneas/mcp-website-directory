-- Posts published by external Worker pipelines (Signal Field, Brainscriblr,
-- OpenSourceScribes) directly into D1 at request time — no git commit, not
-- part of this repo. Site reads these alongside the git-backed blog content
-- collection; see src/utils/externalPosts.ts.
CREATE TABLE IF NOT EXISTS external_posts (
  slug TEXT PRIMARY KEY,
  track TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Chester Beard',
  image TEXT,
  published_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_external_posts_track ON external_posts(track);
CREATE INDEX IF NOT EXISTS idx_external_posts_published_at ON external_posts(published_at DESC);
