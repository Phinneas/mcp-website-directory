# My MCP Shelf — Search MCP Server

An **MCP server that searches our own directory** of curated MCP servers — in plain
English. This is us dogfooding: the My MCP Shelf website's natural-language search is
powered by the exact same engine this server exposes.

> **The pitch:** "Our directory's search is built on MCP." This package is the proof —
> the same `searchServers()` engine that the website's `/api/v1/search-ai` endpoint calls
> is what this MCP server exposes as a tool. One engine, two surfaces.

## What it does

Exposes two tools over stdio:

| Tool | Description |
| --- | --- |
| `search_mcp_servers(query, limit?)` | Plain-English search → ranked servers, each with a human-readable **why** (name/category/deployment/security signals) and the filters inferred from the query. |
| `get_server(id)` | Full details for a single server by id. |

The engine is **deterministic** — no LLM call, no API key, fully offline. It's designed to
be *consumed by* an LLM as a tool, which is precisely the dogfooding point. It ranks using:

- TF-IDF text relevance over name + description (word-boundary matched, so `postgres` finds
  `postgresql` without `ai` matching `email`),
- the directory's existing **category** and **deployment-type** tags as boosters,
- the manual **security audit** (input handling, data residency, auth) when a query signals
  safety intent (e.g. *"safely"*, *"row-level"*, *"read-only"*),
- and adoption (stars/downloads) as a tiebreaker.

## Run it

```bash
# from this directory (resolves the shared engine + data from the repo root)
node server.mjs
```

It speaks MCP over stdio, so point any MCP-compatible client at it.

## Add it to Claude Desktop

Edit `claude_desktop_config.json`:

```jsonc
{
  "mcpServers": {
    "mymcpshelf-search": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-search-server/server.mjs"]
    }
  }
}
```

Restart Claude Desktop, then ask things like:

- *"Find me an MCP server to read Postgres safely with row-level limits"*
- *"What can automate a headless browser to scrape a page?"*
- *"I want a local Python tool to query SQLite"*

Claude will call `search_mcp_servers` and return curated, ranked answers with reasons.

## Verify it works

```bash
npm test
# or: node test-handshake.mjs
```

This spins up the server with the official MCP SDK client, lists the tools, and runs a
sample `search_mcp_servers` call so you can see the ranked output.

## Architecture (single source of truth)

```
                 ┌─────────────────────────────────────────┐
                 │   src/lib/search-engine.js  (shared)    │
                 │   understandQuery() · searchServers()   │
                 └───────────────┬─────────────┬───────────┘
                                 │             │
            ┌────────────────────┘             └────────────────────┐
            ▼                                                       ▼
  src/pages/api/v1/search-ai.ts                        mcp-search-server/server.mjs
   (the website's "Ask in plain English" bar)           (this MCP server — stdio tool)
                                 │
                                 ▼
                  src/data/staticServers.js  (574 curated servers)
```

Both the website and this MCP server import the same engine and the same data — so a result
you get from Claude via this tool is identical to one on the website.

## License

MIT.
