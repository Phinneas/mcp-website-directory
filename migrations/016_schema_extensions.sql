-- Migration 016: Schema extensions — license, mcp_primitives, compatible_clients
--
-- Adds three metadata columns to the servers table that unblock:
--   Task 42 — expose in /api/v1/search-ai, llms.txt and the npm MCP server
--   Task 41 — primitive filter pages (sampling, elicitation, resources, prompts)
--
-- Design rationale
-- ---------------
-- License:        Free-text SPDX identifier (e.g. "MIT", "Apache-2.0", "custom").
--                 Stored as TEXT; null = unknown (not yet populated).
--
-- mcp_primitives: JSON array of protocol primitives the server exposes, drawn
--                 from the fixed set ["resources", "tools", "prompts", "sampling", "elicitation"].
--                 Stored as TEXT (JSON) to match the project's existing pattern
--                 for list/struct columns (green_score_json, scan_summary_json, …).
--                 null = unknown; '[]' = declared empty; '["tools"]' = one primitive.
--                 A join table is unnecessary at this scale — the D1 query pattern
--                 is WHERE mcp_primitives LIKE '%"tools"%' which the cost- and
--                 row-count profile of this directory (<10K servers) absorbs easily.
--
-- compatible_clients: JSON array of client IDs where the server's transport
--                     and configuration are known to work, from the controlled
--                     vocabulary: ["claude-desktop", "cursor", "cline", "windsurf",
--                     "github-copilot", "continue", "warp", "enclave", "custom"].
--                     Same storage rationale as mcp_primitives.
--                     null = unknown; '[]' = none declared.
--
-- Both list columns use TEXT-with-JSON rather than a join table because:
--   a) The existing schema already uses TEXT/JSON for array-shaped data
--      (scan_summary_json, composite_trust_json, etc.).
--   b) The lookup pattern is equality/containment on a small set of values,
--      well served by LIKE / json_each on a local D1.
--   c) No other entity needs to reference individual primitives or clients
--      in a relational way (no FK, no cascade).
--
-- All columns are nullable; null means "not yet populated" (different from
-- empty array "has none"). This lets the backfill distinguish servers that
-- haven't been scanned from those that have been confirmed empty.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE servers ADD COLUMN license TEXT;
ALTER TABLE servers ADD COLUMN mcp_primitives TEXT;
ALTER TABLE servers ADD COLUMN compatible_clients TEXT;

-- Index on license is useful for filtering/counting by license type
CREATE INDEX IF NOT EXISTS idx_servers_license ON servers(license);