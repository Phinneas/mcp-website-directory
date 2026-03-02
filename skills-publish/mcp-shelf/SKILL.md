---
name: mcp-shelf
description: >
  Search, discover, and evaluate MCP (Model Context Protocol) servers on mymcpshelf.com.
  Use when the user asks to find an MCP server, add MCP tools to their agent setup,
  or configure MCP integrations for Claude Code, Cursor, Windsurf, or any MCP-compatible client.
license: MIT
metadata:
  version: 1.0.0
  site: https://www.mymcpshelf.com
---

# MCP Shelf — Finding and Using MCP Servers

MCP (Model Context Protocol) servers give AI agents access to external tools: databases, APIs, file systems, browser automation, and more. mymcpshelf.com is a searchable directory of 1,000+ MCP servers.

## When to use this skill

Activate when the user says things like:
- "Find me an MCP server for X"
- "I want to add GitHub tools to my agent"
- "How do I configure MCP for Cursor?"
- "What MCP servers are available for databases?"

## How to search

Navigate to https://www.mymcpshelf.com or use the API:

```
GET https://www.mymcpshelf.com/api/servers?q={query}
```

Browse by category: Filesystem, Databases, APIs, Communication, Development, Browser Automation, AI/LLM, Document Processing.

## Evaluating a server

Check these signals in order:
1. **GitHub stars** — proxy for adoption and trust
2. **Last commit date** — is it actively maintained?
3. **Author / org** — official publisher (e.g. `anthropics`, `vercel`) vs community
4. **License** — MIT or Apache 2.0 preferred for commercial use
5. **README quality** — clear install instructions and config examples

## Installing an MCP server

Once the user selects a server, generate the correct config using:
https://www.mymcpshelf.com/mcp-config-generator

Or use the `mcp-config-generator` skill for inline config generation.

## MCP vs Skills

| | MCP Servers | Agent Skills |
|---|---|---|
| What they provide | Tools (functions the agent can call) | Instructions (context the agent loads) |
| Install method | Config JSON in client settings | `npx skills add` |
| Example | GitHub MCP → can read/write PRs | `git-workflow` skill → knows branching strategy |
| Use together? | Yes — they complement each other |  |

## Common MCP categories

- **Filesystem** — read/write local files
- **Databases** — Postgres, SQLite, MySQL query tools
- **APIs** — GitHub, Slack, Linear, Notion, Google Workspace
- **Browser** — Playwright, Puppeteer automation
- **AI/LLM** — inference, embeddings, vector DBs
- **Document** — PDF, DOCX, XLSX processing
- **Communication** — email, Slack, Discord

## Config file locations by client

| Client | Config path |
|---|---|
| Claude Desktop (Mac) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor | `.cursor/mcp.json` in project root |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Roo | `.roo/mcp.json` in project root |
