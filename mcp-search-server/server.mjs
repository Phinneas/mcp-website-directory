#!/usr/bin/env node
/**
 * mymcpshelf-mcp — My MCP Shelf Search MCP Server
 * =================================================
 *
 * An installable MCP server that queries the live My MCP Shelf directory
 * API for fresh, badge-enriched server data. Falls back to a bundled
 * static dataset when offline.
 *
 * Tools:
 *   - search_mcp_servers(query, limit?)  → ranked servers with trust badges
 *   - get_server(id)                     → full details + security grade
 *   - get_server_security_grade(id)      → composite trust, reliability, green score
 *
 * Quick start:
 *   npx -y mymcpshelf-mcp
 *
 * Environment:
 *   MYMCPSHELF_API_URL — override the live API base URL (default: https://www.mymcpshelf.com)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { searchServers, summarizeFilters } from './lib/search-engine.js';
import staticData from './data/static-data.json' with { type: 'json' };

const BASE_API_URL = process.env.MYMCPSHELF_API_URL || 'https://www.mymcpshelf.com';
const FALLBACK_SERVERS = staticData.servers || [];
const BY_ID = new Map(FALLBACK_SERVERS.map((s) => [s.id, s]));

// ── HTTP helpers ───────────────────────────────────────────────────────────

async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function fetchJSON(path) {
  try {
    const res = await fetchWithTimeout(`${BASE_API_URL}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Format helpers ─────────────────────────────────────────────────────────

function fmtBadge(hit) {
  const badges = [];
  if (hit.composite_trust) {
    badges.push(`${hit.composite_trust.label} (${hit.composite_trust.score}/100)`);
  } else if (hit.security_audit) {
    const s = hit.security_audit;
    const label = s.auditScore >= 80 ? 'Trusted' : s.auditScore >= 50 ? 'Verified' : 'Caution';
    badges.push(`${label} (${s.auditScore}/100)`);
  }
  if (hit.reliability) {
    badges.push(`${hit.reliability.label}`);
  }
  if (hit.green_score) {
    badges.push(hit.green_score.label);
  }
  if (hit.scan_badge) {
    const tier = hit.scan_badge.badge_tier;
    const score = hit.scan_badge.overall_score;
    if (tier === 'scanned' && score != null) badges.push(`Scanned ${score}/100`);
    else if (tier === 'manually_reviewed') badges.push('Manually Reviewed');
    else badges.push('Unverified');
  }
  return badges.length ? `trust: ${badges.join(' · ')}` : '';
}

function fmtServerLine(s) {
  const f = s.fields || s;
  const dep = s.deployment || 'unknown';
  const stars = f.stars ?? 0;
  return `${f.name}  (id: ${s.id})\n   ${f.category || ''} · ${dep} · ★${stars}`;
}

// ── Server ─────────────────────────────────────────────────────────────────

const mcp = new McpServer({
  name: 'mymcpshelf-mcp',
  version: '1.0.0',
});

// ── Tool 1: natural-language search ────────────────────────────────────────
mcp.tool(
  'search_mcp_servers',
  [
    'Search the My MCP Shelf directory of MCP servers with a plain-English query.',
    'Returns ranked matches with security grade, reliability tier, green-hosting status,',
    'and a human-readable explanation of why each server matched.',
    'Use this to recommend the right MCP server for a task.',
  ].join(' '),
  {
    query: z
      .string()
      .describe('Natural-language description of what you need, e.g. "read Postgres safely with row-level limits" or "automate a headless browser".'),
    limit: z.number().int().min(1).max(20).optional().describe('Maximum results (default 8).'),
  },
  async ({ query, limit }) => {
    const lim = limit ?? 8;
    // Try live API first
    const live = await fetchJSON(`/api/v1/search-ai?q=${encodeURIComponent(query)}&limit=${lim}`);
    if (live && Array.isArray(live.hits)) {
      const lines = [];
      lines.push(`My MCP Shelf — ${live.total} match(es) for "${query || '(most popular)'}"`);
      const filters = live.inferredFilters;
      if (filters) lines.push(`Inferred filters: ${filters}`);
      lines.push('');
      if (!live.hits.length) {
        lines.push('No servers matched. Try rephrasing or broadening the query.');
      } else {
        live.hits.forEach((h, i) => {
          lines.push(`${i + 1}. ${h.name}  (id: ${h.id})`);
          lines.push(`   ${h.category || ''} · ${h.deployment || 'unknown'} · ★${h.stars} · score ${h.score}`);
          const desc = (h.description || '').trim();
          lines.push(`   ${desc.length > 200 ? desc.slice(0, 200) + '…' : desc}`);
          lines.push(`   why: ${(h.reasons || []).join(' | ')}`);
          const badge = fmtBadge(h);
          if (badge) lines.push(`   ${badge}`);
          if (h.github_url) lines.push(`   repo: ${h.github_url}`);
          lines.push('');
        });
      }
      return { content: [{ type: 'text', text: lines.join('\n').trim() }] };
    }

    // Fallback: local static search
    const res = searchServers(query || '', FALLBACK_SERVERS, { limit: lim });
    const filters = summarizeFilters(res.inferredFilters);
    const lines = [];
    lines.push(`My MCP Shelf — ${res.total} match(es) for "${query || '(most popular)'}" [offline fallback]`);
    if (filters) lines.push(`Inferred filters: ${filters}`);
    lines.push('');
    if (!res.hits.length) {
      lines.push('No servers matched. Try rephrasing or broadening the query.');
    } else {
      res.hits.forEach((h, i) => {
        const s = h.server;
        const f = s.fields;
        lines.push(`${i + 1}. ${f.name}  (id: ${s.id})`);
        lines.push(`   ${f.category} · ${s.deployment || 'unknown'} · ★${f.stars} · score ${h.score}`);
        const desc = (f.description || '').trim();
        lines.push(`   ${desc.length > 200 ? desc.slice(0, 200) + '…' : desc}`);
        lines.push(`   why: ${h.reasons.join(' | ')}`);
        const badge = fmtBadge(s);
        if (badge) lines.push(`   ${badge}`);
        if (f.github_url) lines.push(`   repo: ${f.github_url}`);
        lines.push('');
      });
    }
    return { content: [{ type: 'text', text: lines.join('\n').trim() }] };
  }
);

// ── Tool 2: fetch one server's full details ────────────────────────────────
mcp.tool(
  'get_server',
  'Get full details for a single MCP server by its id, including security grade, reliability, and green-hosting status.',
  {
    id: z.string().describe('Server id, e.g. "playwright-browser-automation"'),
  },
  async ({ id }) => {
    const live = await fetchJSON(`/api/v1/servers/${encodeURIComponent(id)}`);
    if (live && live.id) {
      const lines = [fmtServerLine(live), ''];
      lines.push(live.description || '(no description)');
      lines.push('');
      lines.push(`category:   ${live.category || 'unknown'}`);
      lines.push(`language:   ${live.language || 'unknown'}`);
      lines.push(`stars:      ${live.stars ?? 0}`);
      if (live.npm_package) lines.push(`npm:        ${live.npm_package}`);
      if (live.github_url) lines.push(`github:     ${live.github_url}`);
      lines.push(`shelf_url:  ${live.shelf_url || `https://www.mymcpshelf.com/server/${live.id}`}`);
      lines.push('');
      if (live.security) {
        const sec = live.security;
        lines.push(`security:   ${sec.tier || 'Unknown'} (${sec.audit_score ?? 0}/100)`);
        lines.push(`transport:  ${sec.transport || 'unknown'} · auth: ${sec.auth_method || 'unknown'}`);
        lines.push(`input:      ${sec.input_handling || 'unknown'} · residency: ${sec.data_residency || 'unknown'}`);
      }
      if (live.scan) {
        lines.push(`scan:       ${live.scan.badge_tier}${live.scan.overall_score != null ? ' (' + live.scan.overall_score + '/100)' : ''}`);
      }
      if (live.reliability) {
        lines.push(`reliability: ${live.reliability.label} (${live.reliability.tier})`);
      }
      if (live.verified != null) {
        lines.push(`verified:   ${live.verified ? 'Yes' : 'No'}`);
      }
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    // Fallback
    const s = BY_ID.get(id);
    if (!s) {
      return {
        isError: true,
        content: [{ type: 'text', text: `No server found with id "${id}".` }],
      };
    }
    const f = s.fields;
    const audit = s.securityAudit;
    const lines = [
      `${f.name}  (id: ${s.id})`,
      '',
      f.description || '(no description)',
      '',
      `category:   ${f.category}`,
      `language:   ${f.language || 'unknown'}`,
      `stars:      ${f.stars}`,
      `deployment: ${s.deployment || 'unknown'}`,
      f.github_url ? `github:     ${f.github_url}` : null,
      f.npm_package ? `npm:        ${f.npm_package}` : null,
      '',
    ].filter((x) => x !== null);
    if (audit) {
      lines.push(`security:   ${audit.auditScore >= 80 ? 'Trusted' : audit.auditScore >= 50 ? 'Verified' : 'Caution'} (${audit.auditScore}/100)`);
      lines.push(`transport:  ${audit.transport} · auth: ${audit.authMethod}`);
      lines.push(`input:      ${audit.inputHandling} · residency: ${audit.dataResidency}`);
    }
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ── Tool 3: security grade ─────────────────────────────────────────────────
mcp.tool(
  'get_server_security_grade',
  'Get the detailed security grade for a server: composite trust score, reliability tier, green-hosting status, and scan badge.',
  {
    id: z.string().describe('Server id, e.g. "playwright-browser-automation"'),
  },
  async ({ id }) => {
    const live = await fetchJSON(`/api/v1/security/scan-status?server_id=${encodeURIComponent(id)}`);
    if (live && live.server_id) {
      const lines = [`Security grade for ${live.name || live.server_id}`, ''];
      lines.push(`badge_tier:     ${live.badge_tier || 'unverified'}`);
      if (live.scan_summary?.overall_score != null) {
        lines.push(`overall_score:  ${live.scan_summary.overall_score}/100`);
      }
      if (live.last_scan_at) lines.push(`last_scan:      ${live.last_scan_at}`);
      if (live.scans?.length) {
        lines.push('');
        lines.push('Individual scans:');
        live.scans.forEach((sc) => {
          lines.push(`  - ${sc.type}: ${sc.status}${sc.score != null ? ' (' + sc.score + '/100)' : ''}`);
        });
      }
      if (live.cve_matches?.length) {
        lines.push('');
        lines.push(`CVE matches: ${live.cve_matches.length}`);
        live.cve_matches.slice(0, 5).forEach((cve) => {
          lines.push(`  - ${cve.cve_id || 'unknown'} (${cve.severity || 'unknown'})`);
        });
      }
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    // Fallback to static audit data
    const s = BY_ID.get(id);
    if (!s) {
      return {
        isError: true,
        content: [{ type: 'text', text: `No server found with id "${id}".` }],
      };
    }
    const audit = s.securityAudit;
    if (!audit) {
      return {
        content: [{ type: 'text', text: `No security audit available for "${s.fields.name}".` }],
      };
    }
    const lines = [
      `Security grade for ${s.fields.name}`,
      '',
      `badge_tier:     scanned`,
      `overall_score:  ${audit.auditScore}/100`,
      `transport:      ${audit.transport}`,
      `auth:           ${audit.authMethod}`,
      `token_lifecycle: ${audit.tokenLifecycle}`,
      `input_handling: ${audit.inputHandling}`,
      `data_residency: ${audit.dataResidency}`,
      `dependency:     ${audit.dependencyHealth}`,
    ];
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ── Connect over stdio ─────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await mcp.connect(transport);
