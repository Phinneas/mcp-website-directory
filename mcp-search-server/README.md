# mymcpshelf-mcp

An installable MCP server that queries the **My MCP Shelf** directory of curated,
security-graded MCP servers. Every result includes trust badges: composite trust
score, reliability tier, green-hosting status, and security scan grade.

## Quick start

```bash
npx -y mymcpshelf-mcp
```

It speaks MCP over stdio, so point any MCP-compatible client at it.

## Add to Claude Desktop

Edit `claude_desktop_config.json`:

```jsonc
{
  "mcpServers": {
    "mymcpshelf": {
      "command": "npx",
      "args": ["-y", "mymcpshelf-mcp"]
    }
  }
}
```

## Tools

| Tool | Description |
| --- | --- |
| `search_mcp_servers(query, limit?)` | Plain-English search → ranked servers with trust badges (composite trust, reliability, green score, scan badge) and a human-readable "why". |
| `get_server(id)` | Full details for a single server including security grade, reliability, green-hosting status, and CLI-installable command/args. |
| `get_server_security_grade(id)` | Detailed security grade: composite trust score, reliability tier, green-hosting status, individual scan results, and CVE matches. |

### Example output

```
1. Playwright Browser Automation  (id: playwright-browser-automation)
   browser-automation · local_stdio · ★28403 · score 95
   Pure local browser automation via Playwright API...
   why: name match: "playwright" | Browser Automation category | local stdio
   trust: Trusted (82/100) · High Activity · Local / Green · Scanned 82/100
   repo: https://github.com/microsoft/playwright-mcp
```

## Architecture

```
┌─────────────────────────────┐
│   mymcpshelf-mcp (this pkg) │
│   search_mcp_servers()      │
│   get_server()              │
│   get_server_security_grade │
└──────────────┬──────────────┘
               │  fetch() live API (default)
               │  ↓ fallback to bundled static-data.json
    ┌──────────┴──────────┐
    ▼                     ▼
/api/v1/search-ai   /api/v1/servers/{id}
/api/v1/security/scan-status
```

The server **queries the live API by default** so results are always fresh.
If the API is unreachable, it falls back to a bundled static dataset
(574 curated servers with manual security audits).

Set `MYMCPSHELF_API_URL` to point to a different instance:

```bash
MYMCPSHELF_API_URL=https://staging.mymcpshelf.com npx -y mymcpshelf-mcp
```

## Public JSON API

The same data is available as plain HTTP JSON endpoints (no auth required):

- `GET https://www.mymcpshelf.com/api/v1/search-ai?q=postgres+safe&limit=5`
- `GET https://www.mymcpshelf.com/api/v1/servers/{id}`
- `GET https://www.mymcpshelf.com/api/v1/security/scan-status?server_id={id}`

See `https://www.mymcpshelf.com/llms.txt` for full endpoint documentation.

## Registry submissions

- [ ] Official MCP registry — https://registry.modelcontextprotocol.io
- [ ] mcpservers.org
- [ ] mcp.so
- [ ] Glama — https://glama.ai/mcp/servers
- [ ] PulseMCP — https://www.pulsemcp.com

## License

MIT.
