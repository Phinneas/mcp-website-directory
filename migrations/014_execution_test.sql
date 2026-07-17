-- Migration 014: execution_json — MCP handshake/endpoint test results
-- Added by the composite-trust-monitor as a 6th check layer.

ALTER TABLE servers ADD COLUMN execution_json TEXT;
