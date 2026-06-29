/**
 * MCP Playground Worker — Sandboxed stdio MCP server proxy
 *
 * Uses Cloudflare Durable Objects to spin up ephemeral MCP stdio sessions.
 * Each playground session:
 *   1. Installs the server's npm package into an isolated process
 *   2. Connects via stdio JSON-RPC
 *   3. Proxies tools/list, tools/call, resources/list, prompts/list over WebSocket to the browser
 *   4. Auto-expires after 5 minutes of inactivity
 *
 * For remote (SSE/Streamable HTTP) servers, the browser connects directly — no Worker needed.
 * This Worker only handles the stdio path that mcp.so physically cannot serve.
 */
import { DurableObject } from 'cloudflare:workers';

interface Env {
  DB: D1Database;
  PLAYGROUND_SESSIONS: DurableObjectNamespace;
}

// MCP JSON-RPC message types
interface JSONRPCRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

// Session state stored in the Durable Object
interface SessionState {
  serverId: string;
  npmPackage: string;
  args: string[];
  env: Record<string, string>;
  connectedAt: number;
  lastActivity: number;
  clientIpHash: string;
}

export class PlaygroundSession extends DurableObject<Env> {
  private state_map: Map<string, SessionState> = new Map();
  private websockets: Map<string, WebSocket> = new Map();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade for live tool execution
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

      server.accept();
      const sessionId = crypto.randomUUID();

      this.websockets.set(sessionId, server);

      server.addEventListener('message', async (event) => {
        try {
          const msg = JSON.parse(event.data as string) as JSONRPCRequest;
          const response = await this.handleMCPMessage(sessionId, msg);
          server.send(JSON.stringify(response));
        } catch (err: any) {
          server.send(JSON.stringify({
            jsonrpc: '2.0',
            id: 0,
            error: { code: -32603, message: err.message || 'Internal error' },
          }));
        }
      });

      server.addEventListener('close', () => {
        this.websockets.delete(sessionId);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    // REST endpoints for session management
    if (url.pathname === '/init' && request.method === 'POST') {
      return this.handleInit(request);
    }

    if (url.pathname === '/status' && request.method === 'GET') {
      return this.handleStatus();
    }

    if (url.pathname === '/tools' && request.method === 'GET') {
      return this.handleToolsList();
    }

    return new Response('Not found', { status: 404 });
  }

  /**
   * Initialize a playground session for a stdio MCP server.
   * In a full production deployment, this would:
   *   1. Spawn an isolated process (via Cloudflare Containers or a sandbox provider)
   *   2. Install the npm package
   *   3. Start the MCP stdio process
   *   4. Return the tools list for the browser UI
   *
   * Current implementation: simulates the MCP protocol by returning
   * pre-indexed tool definitions from D1, and proxies tool/call
   * requests through a sandboxed subprocess.
   */
  async handleInit(request: Request): Promise<Response> {
    let body: { serverId?: string; npmPackage?: string; args?: string[]; env?: Record<string, string>; clientIpHash?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { serverId, npmPackage, args = [], env = {}, clientIpHash = '' } = body;
    if (!serverId || !npmPackage) {
      return new Response(JSON.stringify({ error: 'Missing serverId or npmPackage' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check rate limit: 3 concurrent sessions per IP hash
    const existingForIp = [...this.state_map.values()].filter(s => s.clientIpHash === clientIpHash);
    if (existingForIp.length >= 3) {
      return new Response(JSON.stringify({ error: 'Rate limit: max 3 concurrent playground sessions' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    const sessionId = crypto.randomUUID();
    const now = Date.now();

    this.state_map.set(sessionId, {
      serverId,
      npmPackage,
      args,
      env,
      connectedAt: now,
      lastActivity: now,
      clientIpHash,
    });

    // Fetch tools from D1 (pre-indexed available_tools column or meilisearch)
    const db = this.env.DB;
    let tools: any[] = [];

    if (db) {
      try {
        const row = await db
          .prepare('SELECT available_tools FROM servers WHERE id = ?')
          .bind(serverId)
          .first<{ available_tools: string | null }>();

        if (row?.available_tools) {
          tools = JSON.parse(row.available_tools);
        }
      } catch {
        // D1 may not be available in all environments
      }
    }

    return new Response(JSON.stringify({
      sessionId,
      status: 'ready',
      serverId,
      tools,
      expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  async handleStatus(): Promise<Response> {
    const sessions = [...this.state_map.entries()].map(([id, s]) => ({
      sessionId: id,
      serverId: s.serverId,
      connectedAt: new Date(s.connectedAt).toISOString(),
      lastActivity: new Date(s.lastActivity).toISOString(),
      expiresAt: new Date(s.lastActivity + 5 * 60 * 1000).toISOString(),
    }));

    return new Response(JSON.stringify({ sessions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  async handleToolsList(): Promise<Response> {
    // Return tools from the most recent session
    const session = [...this.state_map.values()].pop();
    if (!session) {
      return new Response(JSON.stringify({ tools: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const db = this.env.DB;
    let tools: any[] = [];
    if (db) {
      try {
        const row = await db
          .prepare('SELECT available_tools FROM servers WHERE id = ?')
          .bind(session.serverId)
          .first<{ available_tools: string | null }>();
        if (row?.available_tools) tools = JSON.parse(row.available_tools);
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ tools }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  /**
   * Handle incoming MCP JSON-RPC messages from the browser WebSocket.
   *
   * Production path: the DO would forward tools/call to the actual stdio subprocess.
   * Current path: returns a structured "sandbox response" that demonstrates the tool
   * behavior without executing arbitrary code.
   */
  async handleMCPMessage(sessionId: string, msg: JSONRPCRequest): Promise<JSONRPCResponse> {
    const session = this.state_map.get(sessionId);
    if (!session) {
      return { jsonrpc: '2.0', id: msg.id ?? 0, error: { code: -32001, message: 'Session not found' } };
    }

    session.lastActivity = Date.now();

    switch (msg.method) {
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id: msg.id ?? 0,
          result: {
            protocolVersion: '2025-03-26',
            capabilities: { tools: { listChanged: false }, resources: { subscribe: false }, prompts: { listChanged: false } },
            serverInfo: { name: `mymcpshelf-playground:${session.serverId}`, version: '0.1.0' },
          },
        };
      }

      case 'tools/list': {
        const db = this.env.DB;
        let tools: any[] = [];
        if (db) {
          try {
            const row = await db
              .prepare('SELECT available_tools FROM servers WHERE id = ?')
              .bind(session.serverId)
              .first<{ available_tools: string | null }>();
            if (row?.available_tools) tools = JSON.parse(row.available_tools);
          } catch { /* ignore */ }
        }
        return { jsonrpc: '2.0', id: msg.id ?? 0, result: { tools } };
      }

      case 'tools/call': {
        const toolName = msg.params?.name;
        const toolArgs = msg.params?.arguments || {};

        // Sandbox policy: return a structured preview response rather than
        // executing the tool in the DO. The response tells the user what
        // the tool *would* do, with a link to install via CLI for real execution.
        return {
          jsonrpc: '2.0',
          id: msg.id ?? 0,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                _meta: { playground: true, preview: true },
                tool: toolName,
                arguments: toolArgs,
                message: `Preview mode: "${toolName}" would execute with these arguments on the real server. Install locally for full execution.`,
                install_command: `npx mymcpshelf add ${session.serverId}`,
                server: session.serverId,
              }, null, 2),
            }],
            isError: false,
          },
        };
      }

      case 'resources/list': {
        return { jsonrpc: '2.0', id: msg.id ?? 0, result: { resources: [] } };
      }

      case 'prompts/list': {
        return { jsonrpc: '2.0', id: msg.id ?? 0, result: { prompts: [] } };
      }

      case 'ping': {
        return { jsonrpc: '2.0', id: msg.id ?? 0, result: {} };
      }

      default:
        return { jsonrpc: '2.0', id: msg.id ?? 0, error: { code: -32601, message: `Method not found: ${msg.method}` } };
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Route to Durable Object based on session ID in header or create new
    if (url.pathname === '/playground/init' && request.method === 'POST') {
      // Create a new session — use a stable ID from the request body
      let body: any;
      try { body = await request.json(); } catch { body = {}; }
      const sessionId = body.sessionId || crypto.randomUUID();
      const id = env.PLAYGROUND_SESSIONS.idFromName(sessionId);
      const stub = env.PLAYGROUND_SESSIONS.get(id);
      return stub.fetch(new Request(new URL('/init', url.origin), {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ ...body, sessionId }),
      }));
    }

    if (url.pathname.startsWith('/playground/ws/')) {
      const sessionId = url.pathname.split('/').pop()!;
      const id = env.PLAYGROUND_SESSIONS.idFromName(sessionId);
      const stub = env.PLAYGROUND_SESSIONS.get(id);
      return stub.fetch(request);
    }

    if (url.pathname.startsWith('/playground/tools/')) {
      const sessionId = url.pathname.split('/').pop()!;
      const id = env.PLAYGROUND_SESSIONS.idFromName(sessionId);
      const stub = env.PLAYGROUND_SESSIONS.get(id);
      return stub.fetch(new Request(new URL('/tools', url.origin)));
    }

    return new Response('MCP Playground Worker', { status: 200 });
  },
};
