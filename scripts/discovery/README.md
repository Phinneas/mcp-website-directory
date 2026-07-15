# MCP Server Discovery Pipeline (task 22)

Finds **new** MCP servers from first-party sources only — **never** a competing
directory's API. Curation quality is therefore not capped by anyone else's crawl.

## Why first-party

If discovery ran through Smithery / Glama / PulseMCP / mcp.so / mcpservers.org,
we'd be structurally downstream of the people we're trying to beat. Instead we
source directly from:

| Source | What | Coverage |
|--------|------|----------|
| **npm registry** | packages describing/depending on MCP servers | broad, refreshes continuously |
| **GitHub search** | repos tagged `mcp-server` / `model-context-protocol` | broad (noisy → filtered) |
| **Official MCP Registry** | `registry.modelcontextprotocol.io` | canonical, neutral (competitors read *from* it) |

The high-precision signal is the **SDK-dependency check**: a real MCP server
depends on `@modelcontextprotocol/sdk` (TS) or `mcp` (Python). The runner fetches
each npm candidate's manifest and verifies it — this is what sinks false
positives (e.g. a 194k★ automation tool tagged `mcp-server` but not actually an
MCP server).

## Run

```bash
# Live: fetch all sources, verify SDK deps, dedupe vs the directory, rank.
GITHUB_TOKEN=ghp_... node scripts/discovery/run-discovery.mjs

# Fetch only, don't write files
node scripts/discovery/run-discovery.mjs --dry-run
```

Outputs `discovered.json` (ranked candidates) and `discovered_queue.sql`
(D1 seed for the `discovered_servers` queue, migration 010).

Scheduled weekly via `.github/workflows/mcp-discovery.yml` (Monday 06:00 UTC),
which also seeds the D1 queue (if `CLOUDFLARE_API_TOKEN` is set).

## Pipeline

```
 npm + GitHub + official registry
            │
            ▼
   discovery-engine.js          filter noise → merge corroboration → dedupe vs directory → verify SDK → rank
            │
            ▼
   discovered_servers (D1)      status: new → scanned → promoted | rejected
            │
            ▼
   scan queue (tasks 13/14)     static analysis + Socket.dev + CVE watchlist + tool-poisoning diff
            │
            ▼
   promoted into the directory  → API (task 11) → Skill Stacks (task 16) → newsletter Featured MCP (task 21)
```

## The engine is pure + tested

`src/lib/discovery-engine.js` has no I/O — normalizers, the MCP heuristic, merge,
dedup, and ranking are all unit-tested (`src/lib/discovery-engine.test.mjs`).
The runner only does fetching + verification + persistence.
