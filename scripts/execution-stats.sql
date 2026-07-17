-- Execution Test Statistics
-- Run with: wrangler d1 execute mcp-directory --command "$(cat scripts/execution-stats.sql)"

-- 1. Overall pass/fail breakdown
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pct
FROM (
  SELECT
    CASE
      WHEN json_extract(execution_json, '$.status') = 'tested' THEN 'tested'
      WHEN json_extract(execution_json, '$.status') = 'handshake' THEN 'handshake'
      WHEN json_extract(execution_json, '$.status') = 'failed' THEN 'failed'
      ELSE 'untested'
    END as status
  FROM servers
)
GROUP BY status;

-- 2. Headline stat: % of servers that don't complete a handshake
SELECT
  ROUND(
    SUM(CASE WHEN json_extract(execution_json, '$.score') = 0 OR execution_json IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    1
  ) as untested_rate_pct,
  COUNT(*) as total_servers
FROM servers;

-- 3. Breakdown by category
SELECT
  category,
  SUM(CASE WHEN json_extract(execution_json, '$.status') = 'tested' THEN 1 ELSE 0 END) as tested,
  SUM(CASE WHEN json_extract(execution_json, '$.status') = 'handshake' THEN 1 ELSE 0 END) as handshake,
  SUM(CASE WHEN json_extract(execution_json, '$.score') = 0 OR execution_json IS NULL THEN 1 ELSE 0 END) as failed_or_untested,
  COUNT(*) as total
FROM servers
GROUP BY category
ORDER BY total DESC;
