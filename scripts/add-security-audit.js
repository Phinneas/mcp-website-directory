#!/usr/bin/env node
/**
 * Migration: Add security_audit_json column to servers table
 * and populate it for the top 20 audited servers.
 *
 * Usage:
 *   node scripts/add-security-audit.js
 *
 * This generates add-security-audit.sql which you then run with:
 *   npx wrangler d1 execute mcp-directory --file=add-security-audit.sql
 *   # or for local dev:
 *   npx wrangler d1 execute mcp-directory --local --file=add-security-audit.sql
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const OUTPUT_SQL = join(rootDir, 'add-security-audit.sql');

// Validation schema for security audit data
const VALID_TRANSPORTS = ['stdio', 'sse_http', 'both'];
const VALID_AUTH_METHODS = ['None', 'API Key', 'OAuth2'];
const VALID_TOKEN_LIFECYCLES = ['N/A', 'short-lived', 'long-lived'];
const VALID_INPUT_HANDLING = ['parameterized', 'shell_strings', 'mixed'];
const VALID_DATA_RESIDENCY = ['local_only', 'cloud'];

function validateAuditData(id, audit) {
  const errors = [];
  
  if (!VALID_TRANSPORTS.includes(audit.transport)) {
    errors.push(`Invalid transport: ${audit.transport}`);
  }
  
  if (!VALID_AUTH_METHODS.includes(audit.authMethod)) {
    errors.push(`Invalid authMethod: ${audit.authMethod}`);
  }
  
  if (!VALID_TOKEN_LIFECYCLES.includes(audit.tokenLifecycle)) {
    errors.push(`Invalid tokenLifecycle: ${audit.tokenLifecycle}`);
  }
  
  if (!VALID_INPUT_HANDLING.includes(audit.inputHandling)) {
    errors.push(`Invalid inputHandling: ${audit.inputHandling}`);
  }
  
  if (!VALID_DATA_RESIDENCY.includes(audit.dataResidency)) {
    errors.push(`Invalid dataResidency: ${audit.dataResidency}`);
  }
  
  if (typeof audit.auditScore !== 'number' || audit.auditScore < 0 || audit.auditScore > 100) {
    errors.push(`Invalid auditScore: must be number 0-100, got ${audit.auditScore}`);
  }
  
  if (!audit.auditDate || !/^\d{4}-\d{2}-\d{2}$/.test(audit.auditDate)) {
    errors.push(`Invalid auditDate: must be YYYY-MM-DD format, got ${audit.auditDate}`);
  }
  
  if (!audit.auditorNotes || typeof audit.auditorNotes !== 'string' || audit.auditorNotes.length < 10) {
    errors.push(`Invalid auditorNotes: must be string with at least 10 characters`);
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed for server '${id}': ${errors.join(', ')}`);
  }
}

// Security audit data for top 20 servers
const securityAudits = {
  'mindsdb-mcp': { transport: 'stdio', authMethod: 'API Key', tokenLifecycle: 'long-lived', inputHandling: 'parameterized', dataResidency: 'cloud', auditScore: 56, auditDate: '2026-05-22', auditorNotes: 'Requires MindsDB API key for cloud instance. Data queries routed to MindsDB cloud. Local self-hosted option available.' },
  'panel-1panel': { transport: 'stdio', authMethod: 'API Key', tokenLifecycle: 'long-lived', inputHandling: 'shell_strings', dataResidency: 'local_only', auditScore: 52, auditDate: '2026-05-22', auditorNotes: 'Server management tool. Executes shell commands for panel operations. API key for 1Panel REST API. Data stays local.' },
  'playwright-browser-automation': { transport: 'stdio', authMethod: 'None', tokenLifecycle: 'N/A', inputHandling: 'parameterized', dataResidency: 'local_only', auditScore: 60, auditDate: '2026-05-22', auditorNotes: 'Pure local browser automation via Playwright API. No auth needed for stdio transport. All data stays on local machine.' },
  'upstash-context7': { transport: 'sse_http', authMethod: 'API Key', tokenLifecycle: 'long-lived', inputHandling: 'parameterized', dataResidency: 'cloud', auditScore: 49, auditDate: '2026-05-22', auditorNotes: 'SSE transport to Upstash cloud. Static API key authentication. Queries external documentation APIs. Data flows to/from cloud.' },
  'mastra-docs': { transport: 'stdio', authMethod: 'None', tokenLifecycle: 'N/A', inputHandling: 'parameterized', dataResidency: 'cloud', auditScore: 46, auditDate: '2026-05-22', auditorNotes: 'Stdio transport but fetches documentation from remote web sources. No authentication required for server itself. Outbound cloud data flow.' },
  'github-official-mcp-new': { transport: 'stdio', authMethod: 'OAuth2', tokenLifecycle: 'short-lived', inputHandling: 'parameterized', dataResidency: 'cloud', auditScore: 82, auditDate: '2026-05-22', auditorNotes: 'Official GitHub server. Supports OAuth2 flow with short-lived access tokens + refresh. GitHub PAT also supported (long-lived). Parameterized API calls. Data flows to GitHub cloud.' },
  'microsoft-playwright-mcp': { transport: 'stdio', authMethod: 'None', tokenLifecycle: 'N/A', inputHandling: 'parameterized', dataResidency: 'local_only', auditScore: 60, auditDate: '2026-05-22', auditorNotes: 'Microsoft official Playwright MCP. Pure local browser automation. No auth. Parameterized Playwright API. Data stays local.' },
  'activepieces-mcp': { transport: 'both', authMethod: 'API Key', tokenLifecycle: 'long-lived', inputHandling: 'parameterized', dataResidency: 'cloud', auditScore: 49, auditDate: '2026-05-22', auditorNotes: 'Supports stdio and SSE. API key auth with long-lived tokens. Integrates with 280+ services. Data flows through Activepieces cloud platform.' },
  'fastmcp': { transport: 'stdio', authMethod: 'None', tokenLifecycle: 'N/A', inputHandling: 'parameterized', dataResidency: 'local_only', auditScore: 60, auditDate: '2026-05-22', auditorNotes: 'MCP server framework (not a standalone server). Provides Python SDK for building servers. No built-in auth. Local-only by default. Parameterized tool definitions.' },
  'figma-context-mcp': { transport: 'stdio', authMethod: 'API Key', tokenLifecycle: 'long-lived', inputHandling: 'parameterized', dataResidency: 'cloud', auditScore: 56, auditDate: '2026-05-22', auditorNotes: 'Reads Figma design data via Figma Personal Access Token (long-lived). Stdio transport. Data fetched from Figma cloud APIs.' },
  'googleapis-genai-toolbox': { transport: 'sse_http', authMethod: 'OAuth2', tokenLifecycle: 'short-lived', inputHandling: 'parameterized', dataResidency: 'cloud', auditScore: 77, auditDate: '2026-05-22', auditorNotes: 'Google official. SSE transport for remote deployment. OAuth2 with short-lived access tokens. Data flows through Google Cloud APIs.' },
  'serena-mcp': { transport: 'stdio', authMethod: 'None', tokenLifecycle: 'N/A', inputHandling: 'parameterized', dataResidency: 'local_only', auditScore: 60, auditDate: '2026-05-22', auditorNotes: 'AI-powered code analysis. Stdio transport. No auth. Operates on local codebase. Data stays on local machine.' },
  'mcp-use': { transport: 'stdio', authMethod: 'None', tokenLifecycle: 'N/A', inputHandling: 'parameterized', dataResidency: 'local_only', auditScore: 60, auditDate: '2026-05-22', auditorNotes: 'MCP client framework for Python agents. Stdio transport. No built-in auth. Local-only by design. Parameterized tool calls.' },
  'zen-mcp-server': { transport: 'stdio', authMethod: 'None', tokenLifecycle: 'N/A', inputHandling: 'mixed', dataResidency: 'local_only', auditScore: 50, auditDate: '2026-05-22', auditorNotes: 'Multi-tool MCP server. Stdio transport. No auth. Some tools use shell commands (mixed input handling). Data stays local.' },
  'mcp-inspector': { transport: 'both', authMethod: 'None', tokenLifecycle: 'N/A', inputHandling: 'parameterized', dataResidency: 'local_only', auditScore: 45, auditDate: '2026-05-22', auditorNotes: 'Debugging/inspection tool. SSE for web UI + stdio for MCP protocol. No auth (dev tool). Parameterized. Local-only data.' },
  'ghidra-mcp': { transport: 'stdio', authMethod: 'None', tokenLifecycle: 'N/A', inputHandling: 'parameterized', dataResidency: 'local_only', auditScore: 60, auditDate: '2026-05-22', auditorNotes: 'Reverse engineering with Ghidra. Stdio transport. No auth. Operates on local binary files. Data stays local.' },
  'awslabs-mcp-official': { transport: 'both', authMethod: 'API Key', tokenLifecycle: 'long-lived', inputHandling: 'parameterized', dataResidency: 'cloud', auditScore: 49, auditDate: '2026-05-22', auditorNotes: 'AWS official MCP servers. Supports stdio and SSE. AWS access keys (long-lived IAM credentials). Parameterized API calls. Data flows through AWS cloud.' },
  'mcp-chrome-hangwin': { transport: 'stdio', authMethod: 'None', tokenLifecycle: 'N/A', inputHandling: 'parameterized', dataResidency: 'local_only', auditScore: 60, auditDate: '2026-05-22', auditorNotes: 'Chrome DevTools Protocol integration. Stdio transport. No auth. Controls local Chrome browser. Data stays local.' },
  'whatsapp-mcp': { transport: 'stdio', authMethod: 'API Key', tokenLifecycle: 'long-lived', inputHandling: 'parameterized', dataResidency: 'cloud', auditScore: 56, auditDate: '2026-05-22', auditorNotes: 'WhatsApp Web integration. Stdio transport. Uses WhatsApp session credentials (long-lived). Data flows through WhatsApp cloud. Parameterized message API.' },
  'git-mcp-idosal': { transport: 'both', authMethod: 'API Key', tokenLifecycle: 'long-lived', inputHandling: 'parameterized', dataResidency: 'cloud', auditScore: 49, auditDate: '2026-05-22', auditorNotes: 'GitHub repository management. Supports stdio and SSE. GitHub PAT (long-lived). Parameterized Git operations. Data flows through GitHub API.' },
};

function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

console.log('Generating migration SQL...');

try {
  // Validate all audit data first
  console.log('Validating audit data...');
  let validatedCount = 0;
  for (const [id, audit] of Object.entries(securityAudits)) {
    try {
      validateAuditData(id, audit);
      validatedCount++;
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  }
  console.log(`✅ Validated ${validatedCount} audit records`);

  const lines = [];

  // Step 1: Add column if not exists
  lines.push('-- Migration: Add security_audit_json column');
  lines.push('ALTER TABLE servers ADD COLUMN security_audit_json TEXT;');
  lines.push('');

  // Step 2: Populate audit data for each server
  console.log('Generating SQL statements...');
  for (const [id, audit] of Object.entries(securityAudits)) {
    try {
      const jsonStr = JSON.stringify(audit);
      lines.push(`UPDATE servers SET security_audit_json = ${escape(jsonStr)} WHERE id = ${escape(id)};`);
    } catch (error) {
      console.error(`❌ Failed to serialize audit data for '${id}': ${error.message}`);
      process.exit(1);
    }
  }

  lines.push('');
  lines.push('-- Done: 20 servers audited');

  // Write file with error handling
  try {
    writeFileSync(OUTPUT_SQL, lines.join('\n'), 'utf-8');
    console.log(`✅ Written ${OUTPUT_SQL}`);
    console.log(`📋 Run with: npx wrangler d1 execute mcp-directory --file=add-security-audit.sql`);
  } catch (error) {
    console.error(`❌ Failed to write SQL file: ${error.message}`);
    process.exit(1);
  }

} catch (error) {
  console.error(`❌ Unexpected error: ${error.message}`);
  process.exit(1);
}
