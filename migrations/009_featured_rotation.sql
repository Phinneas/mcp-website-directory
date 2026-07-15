-- Migration 009: Featured-MCP rotation fields
--
-- The /api/v1/featured?weekly=true endpoint powers Brainscriblr's recurring
-- "Featured MCP" segment. It picks one server per week with no repeats
-- (trailing 12-month exclusion), weighted toward newly-verified / newly-surfaced
-- servers, with occasional thematic weeks drawn from the Skill Stacks.
--
-- These two columns persist the "why" alongside each weekly pick so the
-- newsletter repo (AINEWSTOOL) can render the rationale without recomputing it.
ALTER TABLE featured_mcp_weekly ADD COLUMN reason TEXT;
ALTER TABLE featured_mcp_weekly ADD COLUMN theme TEXT;

-- Fast lookup of recently-featured server_ids (the no-repeats exclusion window).
CREATE INDEX IF NOT EXISTS idx_featured_weekly_at ON featured_mcp_weekly(featured_at DESC);

INSERT OR IGNORE INTO schema_migrations (version, description, executed_at)
VALUES ('009', 'Featured-MCP rotation: reason + theme columns, history index', datetime('now'));
