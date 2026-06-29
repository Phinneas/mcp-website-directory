-- Security scanning infrastructure (Task 13)
-- Adds automated scanning results, CVE watchlist, badge tiers, and scan history

-- Scan results for each server — populated by the security scanner worker
CREATE TABLE IF NOT EXISTS security_scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id TEXT NOT NULL,
  scan_type TEXT NOT NULL,        -- 'static_analysis' | 'socket_dev' | 'mcp_scan' | 'cve_watchlist'
  status TEXT NOT NULL,           -- 'passed' | 'failed' | 'warning' | 'error' | 'skipped'
  score INTEGER,                  -- 0-100 per-scan score (NULL for cve_watchlist which is binary)
  details_json TEXT,              -- JSON: scan-specific findings, e.g. { findings: [...], raw: ... }
  scanned_at TEXT NOT NULL,
  scanner_version TEXT,
  UNIQUE(server_id, scan_type, scanned_at)
);
CREATE INDEX IF NOT EXISTS idx_scans_server ON security_scans(server_id);
CREATE INDEX IF NOT EXISTS idx_scans_type ON security_scans(scan_type);
CREATE INDEX IF NOT EXISTS idx_scans_status ON security_scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_date ON security_scans(scanned_at DESC);

-- Badge tier column on servers
-- 'unverified' = no scan yet, 'scanned' = automated scan passed, 'manually_reviewed' = human audit (task 3/6)
ALTER TABLE servers ADD COLUMN badge_tier TEXT DEFAULT 'unverified';
ALTER TABLE servers ADD COLUMN last_scan_at TEXT;
ALTER TABLE servers ADD COLUMN scan_summary_json TEXT;
-- scan_summary_json shape: {
--   "overall_score": 72,
--   "static_analysis": { "status": "passed", "score": 85, "findings": [] },
--   "socket_dev": { "status": "passed", "score": 90, "dependency_health": "clean", "typosquat": false },
--   "mcp_scan": { "status": "passed", "tool_poisoning": false, "rug_pull": false },
--   "cve_watchlist": { "status": "passed", "matches": [] },
--   "badge_tier": "scanned",
--   "scanned_at": "2026-06-29T..."
-- }

-- CVE/IOC watchlist — curated from vulnerablemcp.info + NVD + known malicious packages
CREATE TABLE IF NOT EXISTS cve_watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cve_id TEXT,                    -- e.g. CVE-2025-6514 (NULL for non-CVE IOC entries)
  package_name TEXT NOT NULL,     -- npm package or GitHub repo path
  severity TEXT NOT NULL,         -- 'critical' | 'high' | 'medium' | 'low'
  category TEXT NOT NULL,         -- 'command_injection' | 'rce' | 'ssrf' | 'path_traversal' | 'prompt_injection' | 'tool_poisoning' | 'typosquat' | 'malicious_package' | 'dns_rebinding' | 'credential_theft' | 'data_exfiltration' | 'auth_bypass'
  description TEXT NOT NULL,
  affected_versions TEXT,          -- e.g. '<=0.1.15' or '*'
  patched_versions TEXT,           -- e.g. '>=0.1.16' or NULL
  source TEXT NOT NULL,            -- 'vulnerablemcp.info' | 'nvd' | 'socket_dev' | 'snyk' | 'ghsa' | 'manual'
  source_url TEXT,
  discovered_at TEXT NOT NULL,
  expires_at TEXT                  -- IOC entries can expire after patch is widely deployed
);
CREATE INDEX IF NOT EXISTS idx_cve_package ON cve_watchlist(package_name);
CREATE INDEX IF NOT EXISTS idx_cve_severity ON cve_watchlist(severity);
CREATE INDEX IF NOT EXISTS idx_cve_category ON cve_watchlist(category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cve_unique ON cve_watchlist(cve_id, package_name);
