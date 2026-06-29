#!/usr/bin/env node
/**
 * My MCP Shelf — Search Server (the dogfooded product)
 * =====================================================
 *
 * This is an MCP server that searches our OWN directory of curated MCP servers
 * using a plain-English query. It imports the SAME search engine
 * (`src/lib/search-engine.js`) and the SAME curated dataset
 * (`src/data/staticServers.js`) that the website's AI-search endpoint uses — so
 * the directory's search is literally powered by an MCP server. (See the case
 * study "Our directory's search is built on MCP".)
 *
 * Tools exposed:
 *   - search_mcp_servers(query, limit?)  → ranked servers + a "why" for each
 *   - get_server(id)                      → full details for one server
 *
 * Run:
 *   node server.mjs            # stdio transport (for Claude Desktop, etc.)
 *
 * The engine is deterministic and needs NO LLM call and NO API key — but it is
 * consumed BY LLMs as a tool, which is exactly the dogfooding point.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { staticServers } from '../src/data/staticServers.js';
import { searchServers, summarizeFilters } from '../src/lib/search-engine.js';

const SERVERS = staticServers;
const BY_ID = new Map(SERVERS.map((s) => [s.id, s]));

const mcp = new McpServer({
  name: 'mymcpshelf-search',
  version: '1.0.0',
});

// ── Tool 1: natural-language search ────────────────────────────────────────
mcp.tool(
  'search_mcp_servers',
  [
    'Search the curated My MCP Shelf directory of MCP servers with a plain-English query.',
    'Returns ranked matches with a human-readable explanation of why each server matched',
    '(name/category/deployment/security signals) plus the filters inferred from the query.',
    'Use this to recommend the right MCP server for a task.',
  ].join(' '),
  {
    query: z
      .string()
      .describe('Natural-language description of what you need, e.g. "read Postgres safely with row-level limits" or "automate a headless browser to scrape a page". Empty returns popular servers.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .describe('Maximum number of results to return (default 8).'),
  },
  async ({ query, limit }) => {
    const res = searchServers(query || '', SERVERS, { limit: limit ?? 8 });
    const filters = summarizeFilters(res.inferredFilters);

    const lines = [];
    lines.push(`My MCP Shelf — ${res.total} match(es) for ${query ? `"${query}"` : '(most popular)'}`);
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
  'Get full details for a single MCP server by its id (the id returned by search_mcp_servers).',
  {
    id: z.string().describe('Server id, e.g. "playwright-browser-automation"'),
  },
  async ({ id }) => {
    const s = BY_ID.get(id);
    if (!s) {
      return {
        isError: true,
        content: [{ type: 'text', text: `No server found with id "${id}".` }],
      };
    }
    const f = s.fields;
    const lines = [
      `${f.name}  (id: ${s.id})`,
      '',
      f.description || '(no description)',
      '',
      `category:   ${f.category}`,
      `language:   ${f.language || 'unknown'}`,
      `author:     ${f.author || 'unknown'}`,
      `stars:      ${f.stars}`,
      `deployment: ${s.deployment || 'unknown'}`,
      f.github_url ? `github:     ${f.github_url}` : null,
      f.npm_package ? `npm:        ${f.npm_package}` : null,
    ].filter((x) => x !== null);
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ── Connect over stdio ─────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await mcp.connect(transport);
