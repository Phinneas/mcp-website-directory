---
name: mcp-config-generator
description: >
  Generate correct MCP config JSON for any MCP-compatible AI client (Claude Desktop, Cursor,
  Windsurf, Roo, etc.). Use when the user wants to add an MCP server to their agent setup
  and needs the configuration snippet.
license: MIT
metadata:
  version: 1.0.0
  site: https://www.mymcpshelf.com/mcp-config-generator
---

# MCP Config Generator

Generates the correct JSON configuration block to add an MCP server to any supported AI client.

## When to use this skill

- User says "add X MCP server to my setup"
- User asks "how do I configure this MCP?"
- User has an MCP server URL/package and needs the config JSON

## Use the web tool first

Before generating manually, check:
https://www.mymcpshelf.com/mcp-config-generator

Select the server and client — it outputs the ready-to-paste config.

## MCP config JSON schema

```json
{
  "mcpServers": {
    "<server-name>": {
      "command": "<executable>",
      "args": ["<arg1>", "<arg2>"],
      "env": {
        "API_KEY": "<value>"
      }
    }
  }
}
```

## Common patterns

**npx-based server:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

**uvx-based server (Python):**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "uvx",
      "args": ["mcp-server-filesystem", "/Users/username/projects"]
    }
  }
}
```

**Docker-based server:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

## Config file locations by client

| Client | Config path |
|---|---|
| Claude Desktop (Mac) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Cursor | `.cursor/mcp.json` in project root, or global `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Roo | `.roo/mcp.json` in project root |
| Claude Code | `~/.claude.json` (global) or `.claude.json` (project) |

## Troubleshooting

| Problem | Fix |
|---|---|
| Server not appearing in agent | Restart the client after editing config |
| `command not found` error | Ensure `npx` or `uvx` is in PATH; try full path |
| Auth errors | Double-check env var names match what the server expects |
| Server crashes on start | Check server README for required args; missing args cause silent crashes |
| Config not loading | Validate JSON syntax — trailing commas break parsing |
