---
title: "Building an MCP Gateway with FastMCP: Setup, Routing, and Deployment"
description: "A step-by-step guide to building an MCP gateway using FastMCP: server setup, tool-level routing, server registration, configuration patterns, and connecting AI clients to a unified endpoint."
author: "Chester Beard"
date: "2026-11-10T00:00:00.000Z"
tags: ["fastmcp gateway", "mcp gateway", "mcp server routing", "mcp sse gateway", "mcp infrastructure"]
---

> **Part of the [MCP Gateway Guide](/mcp-gateway-guide) content cluster** — this article walks through building a custom MCP gateway with the FastMCP framework.

A gateway is the difference between managing N×M connections and managing N+1. But the hardest part of adopting a gateway isn't picking SSO or writing allowlist policies — it's getting the first one running. This guide walks through building an MCP gateway with [FastMCP](https://github.com/jlowin/fastmcp), the Python framework that makes MCP server and gateway construction straightforward.

By the end, you'll have a working gateway that routes tool calls to upstream servers, manages server discovery, and presents a single SSE endpoint to clients — with code you can adapt to your own infrastructure.

## FastMCP Gateway Architecture

A FastMCP gateway is itself an MCP server: it speaks the MCP protocol to downstream AI clients and also connects to upstream MCP servers. When a client calls a tool on the gateway, the gateway resolves which upstream server owns that tool, forwards the call, and returns the result. The client never talks to upstream servers directly.

```
┌──────────────┐     MCP/SSE     ┌────────────────────┐
│              │  ◄──────────►  │                    │
│   AI Client  │                 │  FastMCP Gateway   │
│ (Claude,     │                 │                    │
│  Cursor,     │                 │  ┌──────────────┐  │
│  Custom)     │                 │  │ Tool Router   │  │
│              │                 │  │              │  │
└──────────────┘                 │  │ server_map   │  │
                                 │  │  → Tools     │  │
                                 │  └──────┬───────┘  │
                                 │         │          │
                                 │    ┌────▼───────┐  │
                                 │    │ Upstream   │  │
                                 │    │ Connectors │  │
                                 │    └────┬───────┘  │
                                 └─────────┼──────────┘
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
                   ┌────▼────┐       ┌─────▼─────┐      ┌────▼────┐
                   │ GitHub  │       │PostgreSQL │      │  Slack  │
                   │ MCP     │       │MCP Server │      │ MCP     │
                   │ Server  │       │           │      │ Server  │
                   └─────────┘       └───────────┘      └─────────┘
```

The gateway's three responsibilities are straightforward: accept client connections, route tool invocations to the right upstream server, and return responses. Everything else — auth, audit, rate limiting — builds on this core.

Why FastMCP? It abstracts away the MCP protocol negotiation, JSON-RPC message formatting, and transport management that a raw implementation would force you to handle. You write Python functions decorated with `@gateway.tool()`, and FastMCP handles the `tools/list`, `tools/call`, `resources/list`, and `resources/read` protocol messages automatically. For a gateway, this means you focus on routing logic — not on serializing and deserializing protocol frames.

FastMCP also supports both stdio and SSE transport natively, which matters for a gateway. Clients connect via SSE (the gateway exposes an HTTP endpoint), while upstream servers may be stdio child processes (local) or SSE endpoints (remote). FastMCP's transport abstraction lets the gateway bridge between them without custom code.

## Setting Up a FastMCP Gateway Server

FastMCP provides a `Server` class that handles MCP protocol negotiation, transport management, and tool registration. A gateway server starts the same way any FastMCP server does, with one difference: instead of implementing tools directly, the gateway registers proxy tools that forward calls to upstream servers.

### Installation

```bash
pip install fastmcp httpx
```

`fastmcp` is the framework. `httpx` handles async HTTP calls to upstream MCP servers over SSE or HTTP transport.

### Basic gateway scaffold

A minimal gateway server registers itself, accepts connections, and exposes a `tools/list` endpoint. Here's the scaffold that gives you the routing core in about 60 lines:

```python
# gateway/server.py
import asyncio
import json
from typing import Any
from mcp import StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.sse import sse_client
from fastmcp import FastMCP

# Create the gateway MCP server
gateway = FastMCP("mcp-gateway")

# Upstream server registry
# Maps tool names to (server_id, connection_params, transport_type)
SERVER_REGISTRY: dict[str, dict[str, Any]] = {}

def register_server(
    server_id: str,
    tools: list[str],
    transport: str,
    params: dict[str, Any],
) -> None:
    """Register an upstream MCP server and its tools."""
    for tool_name in tools:
        SERVER_REGISTRY[tool_name] = {
            "server_id": server_id,
            "transport": transport,
            "params": params,
        }

async def proxy_tool_call(tool_name: str, arguments: dict[str, Any]) -> str:
    """Look up the upstream server for a tool and forward the call."""
    entry = SERVER_REGISTRY.get(tool_name)
    if not entry:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    if entry["transport"] == "stdio":
        params = StdioServerParameters(
            command=entry["params"]["command"],
            args=entry["params"].get("args", []),
        )
        async with stdio_client(params) as (read, write):
            # Forward invocation using MCP client primitives
            await write.send(json.dumps({
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {"name": tool_name, "arguments": arguments},
                "id": 1,
            }))
            response = await read.receive()
            return response

    elif entry["transport"] == "sse":
        async with sse_client(entry["params"]["url"]) as (read, write):
            await write.send(json.dumps({
                "jsonrpc": "2.0",
                "method": "tools/call",
                "params": {"name": tool_name, "arguments": arguments},
                "id": 1,
            }))
            response = await read.receive()
            return response

    return json.dumps({"error": f"Unsupported transport: {entry['transport']}"})

if __name__ == "__main__":
    gateway.run(transport="sse", host="0.0.0.0", port=8000)
```

This scaffold handles the routing core. The real work lives in how you register servers and how the gateway manages their lifecycle.

The proxy pattern here is deliberately simple: the gateway receives a `tools/call` request, looks up the tool name in its registry, opens a connection to the owning upstream server, forwards the call, and returns the result. The client has no idea the call was forwarded — from its perspective, the gateway _is_ the MCP server.

A few design decisions in this scaffold are worth noting. First, server registration is separate from tool registration: you register a server once, and all its tools are mapped individually. This lets you later add per-tool authorization, rate limits, or allowlists without changing the server registration. Second, the transport abstraction (`stdio` vs `sse`) is captured per server, so the same gateway can mix local stdio servers and remote SSE servers behind a single endpoint.

## Server Registration and Discovery

Servers can be registered statically (via config file) or discovered dynamically (via a registry service). Static registration is simpler for initial deployments; dynamic discovery matters once you have more than a handful of servers.

### Static registration from config

Static registration is the right choice for most teams starting out. You maintain a single YAML or JSON file that lists every upstream server, its transport type, the command to start it (for stdio servers), or its URL (for SSE servers), and the tools it exposes.

Create a YAML configuration file that lists each upstream server and its tools:

```yaml
# gateway/config/servers.yaml
servers:
  github-mcp-server:
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    tools:
      - create_issue
      - search_repositories
      - get_pull_request
      - list_issues

  filesystem-mcp-server:
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
    tools:
      - read_file
      - list_directory
      - search_files
      - write_file

  postgres-mcp-server:
    transport: sse
    url: "http://localhost:5433/mcp"
    tools:
      - query
      - list_tables
```

Load this config and register each server at startup:

```python
def load_server_config(path: str) -> None:
    """Load server registrations from a YAML config file."""
    import yaml
    with open(path) as f:
        config = yaml.safe_load(f)

    for server_id, cfg in config.get("servers", {}).items():
        params = dict(cfg)
        tools = params.pop("tools", [])
        transport = params.pop("transport", "stdio")
        register_server(server_id, tools, transport, params)
        print(f"Registered {server_id} ({len(tools)} tools) via {transport}")
```

Load this at gateway startup:

```python
if __name__ == "__main__":
    load_server_config("gateway/config/servers.yaml")
    gateway.run(transport="sse", host="0.0.0.0", port=8000)
```

Now every upstream server and its tools are registered before the gateway accepts its first connection.

### Dynamic discovery via a registry endpoint

For larger deployments, servers register themselves with a discovery endpoint at startup. The gateway queries this endpoint periodically or on client connect:

```python
async def discover_servers(registry_url: str) -> None:
    """Fetch registered servers from a discovery endpoint."""
    async with httpx.AsyncClient() as client:
        response = await client.get(registry_url)
        servers = response.json()

    for entry in servers:
        register_server(
            server_id=entry["id"],
            tools=entry["tools"],
            transport=entry["transport"],
            params=entry["params"],
        )
```

The discovery endpoint approach means you can add servers without restarting the gateway. A server starts, writes its registration to the registry, and the gateway picks it up on the next discovery poll. Servers that shut down gracefully deregister themselves; the gateway detects stale registrations via health checks.

The registry service itself is straightforward — a key-value store (Redis, DynamoDB, or even a SQLite table) that servers write to on boot and the gateway reads from on demand. The minimum API is two endpoints: `POST /register` (payload: server id, tools, transport params) and `GET /discover` (returns all active registrations).

## Routing Configuration Patterns

Tool-level routing is the gateway's most important job. FastMCP lets you register tools dynamically, so the gateway can generate proxy handlers for every tool its upstream servers expose.

### Auto-generated proxy tools

Instead of manually writing a tool function for each upstream tool, the gateway can inspect registered servers and generate proxy tools automatically:

```python
def register_proxy_tools() -> None:
    """Register a FastMCP tool for every known upstream tool."""
    for tool_name, entry in SERVER_REGISTRY.items():
        # Create a closure over tool_name to capture the current value
        async def make_proxy(name=tool_name, **kwargs):
            return await proxy_tool_call(name, kwargs)

        # Register with FastMCP as a tool, using the tool_name as the display name
        # In practice, use FastMCP's programmatic tool registration
        gateway.tool(name=tool_name)(make_proxy)
```

Each registered server's `tools/list` response feeds into this registration step: you call `tools/list` on each upstream server at startup, extract the tool names and input schemas, and register matching proxy tools on the gateway.

This auto-registration is important for correctness: if an upstream server adds or removes tools in a new version, the gateway picks up the change automatically on restart or re-registration, without manual config updates. It also means the gateway's `tools/list` response is always in sync with what its upstream servers actually support.

### Namespaced tools for disambiguation

When two upstream servers expose tools with the same name (for example, two different databases each have a `query` tool), the gateway namespaces them by server identifier:

```python
def register_proxy_tools(prefix: bool = True) -> None:
    """Register proxy tools, optionally namespaced by server_id."""
    for tool_name, entry in SERVER_REGISTRY.items():
        display_name = tool_name
        if prefix:
            display_name = f"{entry['server_id']}/{tool_name}"

        async def make_proxy(name=display_name, **kwargs):
            return await proxy_tool_call(name, kwargs)

        gateway.tool(name=display_name)(make_proxy)
```

The client sees `github-mcp-server/search_repositories` and `postgres-mcp-server/query` rather than bare `search_repositories` and `query`. This eliminates ambiguity without requiring upstream servers to coordinate naming.

## Connecting Clients to the Gateway

Once the gateway is running, any MCP client that supports SSE transport can connect to it. The connection string is the gateway's URL — no per-server URLs needed.

### Claude Desktop

In Claude Desktop's MCP configuration, point to the gateway's SSE endpoint:

```json
{
  "mcpServers": {
    "mcp-gateway": {
      "type": "sse",
      "url": "http://gateway.my-org.com:8000/mcp"
    }
  }
}
```

Claude Desktop calls `tools/list` on the gateway, receives the combined tool list from all upstream servers, and can invoke any of them through the single connection.

### Cursor

Cursor supports SSE MCP servers natively. In your project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mcp-gateway": {
      "type": "sse",
      "url": "http://gateway.my-org.com:8000/mcp"
    }
  }
}
```

### Custom Python client

If you're building your own agent, connect using the MCP Python SDK's `SSEClient`:

```python
from mcp.client.sse import sse_client

async with sse_client("http://gateway.my-org.com:8000/mcp") as (read, write):
    # Receive the full combined tool listing
    tools_response = await read.receive()
    # Invoke any tool through the gateway
    await write.send(json.dumps({
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "github-mcp-server/search_repositories",
            "arguments": {"query": "mcp gateway"},
        },
        "id": 1,
    }))
    result = await read.receive()
```

Every client connection uses the same URL. Adding or removing upstream servers changes only the gateway configuration, never the client configuration.

## Gateway Deployment Considerations

Running a gateway in production means handling connection lifecycle, reconnection, and resource management. Three patterns matter most.

### Process lifecycle management

Each upstream stdio server is a child process. The gateway should start these processes on registration and keep them alive for the gateway's lifetime, restarting them if they crash:

```python
class ServerProcess:
    """Manages an upstream stdio server process."""
    def __init__(self, params: StdioServerParameters):
        self.params = params
        self.process = None

    async def start(self):
        self.process = await asyncio.create_subprocess_exec(
            self.params.command,
            *self.params.args,
        )
```

SSE servers are simpler — the gateway connects to them on demand and manages the HTTP session rather than a process.

### Connection pooling for SSE servers

When multiple concurrent client requests need the same upstream SSE server, the gateway should reuse a single connection rather than opening one per request. A simple connection pool patterns:

```python
class SseConnectionPool:
    """Reuse SSE connections to the same upstream server."""
    def __init__(self):
        self._connections: dict[str, tuple] = {}

    async def get_connection(self, url: str):
        if url not in self._connections:
            ctx = sse_client(url)
            read, write = await ctx.__aenter__()
            self._connections[url] = (read, write, ctx)
        return self._connections[url][:2]
```

### Health checks and circuit breaking

A gateway should detect unresponsive upstream servers and stop routing tools to them until they recover. This prevents cascading failures where a slow upstream blocks all gateway operations:

```python
async def health_check(interval: int = 30) -> None:
    """Periodically check upstream server health."""
    while True:
        healthy = set()
        for tool_name, entry in list(SERVER_REGISTRY.items()):
            # Basic check: can we reach the server?
            # For stdio servers, check process liveness
            # For SSE servers, attempt a connection
            healthy.add(tool_name)

        # Remove tools belonging to unhealthy servers
        for tool_name in list(SERVER_REGISTRY.keys()):
            if tool_name not in healthy:
                SERVER_REGISTRY.pop(tool_name, None)
                print(f"Removed {tool_name} — server unreachable")

        await asyncio.sleep(interval)
```

A full implementation would add exponential backoff (retry after 10s, then 30s, then 60s), alerting (notify when a server has been down for more than N minutes), and automatic re-registration when servers recover. The health check loop also feeds into a status endpoint that operators can query to see which servers are online, which tools are available, and how many invocations each server has handled.

For teams operating at scale, the health check loop should also measure latency: if an upstream server's response time degrades past a threshold (say, 5 seconds for a typical tool call), the gateway should route around it before it times out. This is the same circuit-breaking pattern used in service mesh architectures, adapted for MCP tool routing.

## Putting It All Together: A Gateway Startup Sequence

Here's how the full startup sequence looks when you combine all these patterns:

1. The gateway starts and loads its YAML server configuration (static registration).
2. For each static server entry, the gateway starts the server process (stdio) or validates the SSE endpoint URL.
3. For each server, the gateway calls `tools/list` to discover available tools and their input schemas.
4. The gateway registers a proxy tool for each discovered tool name, optionally namespaced by server ID.
5. If a dynamic discovery registry URL is configured, the gateway polls it in a background task and registers any newly discovered servers.
6. The gateway starts its SSE listener on the configured port and begins accepting client connections.
7. A background health check loop monitors upstream servers and removes unhealthy ones from the routing table.
8. On each `tools/call` request, the gateway resolves the tool name, forwards the call, and returns the result.

This sequence runs in under a second for most configurations. The gateway is stateless in the routing path — all server state lives in the SERVER_REGISTRY dict, which can be serialized and reloaded if the gateway restarts.

## When to Build vs When to Buy

A FastMCP gateway gives you full control over routing, server selection, and deployment. It's the right choice when:

- You need to route to servers that aren't publicly accessible (internal databases, private APIs)
- You want to mix stdio and SSE servers behind a single endpoint
- You need custom routing logic that off-the-shelf gateways don't support
- You're already using Python in your MCP infrastructure

It's probably not the right choice when:

- You need SSO, audit logging, and allowlisting today (those features are part of a separate layer — see the auth patterns in Spoke 1)
- You want a managed service rather than a container you operate
- Your upstream servers are all public SSE endpoints and you just need a reverse proxy

The pillar guide's comparison table covers the full evaluation — FastMCP sits in the "build your own" row, which offers maximum flexibility at the cost of operational responsibility.

## Deeper Reading

This article is Spoke 2 of the MCP Gateway content cluster. Continue with:

- [MCP Gateway Guide](/mcp-gateway-guide) — the cluster pillar: gateway overview, comparison table, evaluation criteria, and deployment options
- [Securing MCP in Production](/blog/securing-mcp-gateway-production) — SSO integration, per-server credential management, and tool-level allowlisting for the gateway built here
- [Agent Hygiene Score](/agent-hygiene) — the least-privilege scoping rubric applicable to gateway tool access
- [Building a Production Notion MCP Gateway](/blog/notion-mcp-gateway) — a step-by-step tutorial for a custom gateway implementation against a specific service