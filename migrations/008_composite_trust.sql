-- Migration 008: Composite Trust — the consolidated per-server recheck record.
--
-- The composite-trust-monitor worker runs staleness, green, security, and
-- tool-description-diff in a single pass per server and writes ONE combined
-- record here, plus the Composite Trust Score. This is the single clean data
-- source that supersedes the four independent per-check columns for future
-- trust scoring.
--
-- composite_trust_json shape (see workers/lib/composite-checks.js):
-- {
--   "score": 0-100, "tier": "trusted|verified|review|caution", "label": "...",
--   "flags": ["tool-poisoning-detected", ...],
--   "subscores": {
--     "staleness":  { "score": ..., "tier": ..., "lastCommitDays": ..., "commits90d": ... },
--     "green":      { "score": ..., "tier": "green_verified|user_dependent|unknown", ... },
--     "security":   { "score": ..., "tier": "passed|warning|failed", "cveMatches": 0 },
--     "toolDiff":   { "score": ..., "tier": "clean|watch|poisoned|baseline", "added": [], "modified": [], "suspicious": [] }
--   },
--   "toolSnapshot": { "<toolname>": "<description>" },  -- stored for next run's diff
--   "assessedAt": "2026-..."
-- }

ALTER TABLE servers ADD COLUMN composite_trust_json TEXT;

-- Fast lookups for the directory UI (browse by trust tier / flag servers for review).
CREATE INDEX IF NOT EXISTS idx_servers_composite_trust ON servers(composite_trust_json);

-- Track that this migration ran (matches the repo's schema_migrations convention).
INSERT OR IGNORE INTO schema_migrations (version, description, executed_at)
VALUES ('008', 'Add composite_trust_json — consolidated per-server recheck record', datetime('now'));
