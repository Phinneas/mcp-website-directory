-- Migration 012: Add remote_health_json for uptime/TLS checks on remote servers
-- Run with: wrangler d1 migrations apply mcp-directory-db

ALTER TABLE servers ADD COLUMN remote_health_json TEXT;
