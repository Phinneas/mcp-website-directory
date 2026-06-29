-- Topic Stacks (Task 15 — Verified MCP Stacks)
-- Pre-verified, security-scanned bundles of MCP servers organized by job-to-be-done.
-- Counter to mcpservers.org's static topic pages: ours are one-command installable.

CREATE TABLE IF NOT EXISTS topic_stacks (
  id TEXT PRIMARY KEY,           -- e.g. 'browser-automation', 'rag', 'coding-agent'
  name TEXT NOT NULL,            -- e.g. 'Browser Automation MCP'
  slug TEXT NOT NULL UNIQUE,     -- URL slug
  description TEXT NOT NULL,     -- Short description for the topic index
  long_description TEXT,         -- Longer description for the topic detail page
  icon TEXT NOT NULL,            -- Emoji icon
  category TEXT,                  -- Primary category for filtering
  difficulty TEXT NOT NULL DEFAULT 'intermediate',  -- 'beginner' | 'intermediate' | 'advanced'
  estimated_setup_minutes INTEGER DEFAULT 5,
  server_ids TEXT NOT NULL,       -- JSON array of server IDs: ["github-mcp", "filesystem-mcp"]
  env_vars TEXT,                  -- JSON: shared env vars needed: {"GITHUB_TOKEN": {"required": true, "description": "..."}}
  benefits TEXT,                  -- JSON array: ["Access GitHub repos", "Read local files"]
  prerequisites TEXT,             -- JSON array: ["Node.js 18+", "PostgreSQL running locally"]
  mcpservers_org_equivalent TEXT, -- The mcpservers.org topic slug we're countering
  install_count INTEGER DEFAULT 0,
  featured INTEGER DEFAULT 0,    -- 1 = show on homepage
  sort_order INTEGER DEFAULT 100,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stacks_slug ON topic_stacks(slug);
CREATE INDEX IF NOT EXISTS idx_stacks_featured ON topic_stacks(featured);
CREATE INDEX IF NOT EXISTS idx_stacks_category ON topic_stacks(category);

-- Per-stack install telemetry (separate from single-server installs)
CREATE TABLE IF NOT EXISTS stack_installs (
  id TEXT PRIMARY KEY,
  stack_id TEXT NOT NULL,
  client TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  servers_installed INTEGER,      -- How many of the stack's servers were actually installed
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stackinstalls_stack ON stack_installs(stack_id);
