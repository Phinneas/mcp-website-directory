/**
 * PlaygroundPanel — Sandboxed in-browser MCP server runtime.
 *
 * Two modes:
 *   1. Remote: Browser connects directly to SSE/Streamable HTTP MCP server URL
 *   2. Stdio: Browser connects via WebSocket to our Cloudflare DO sandbox proxy
 *
 * Shows security/green/reliability badges alongside live tool output.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ToolDef {
  name: string;
  description: string;
  category?: string;
  inputSchema?: any;
}

interface PlaygroundInit {
  sessionId: string;
  serverId: string;
  serverName: string;
  mode: 'remote' | 'stdio';
  remoteUrl: string | null;
  npmPackage: string | null;
  command: string;
  args: string[];
  tools: ToolDef[];
  security: { audit_score: number; tier: string; verified: boolean } | null;
  greenScore: { tier: string; label: string } | null;
  reliability: { score: number; tier: string } | null;
  expiresAt: string;
}

interface PlaygroundPanelProps {
  serverId: string;
  serverName: string;
  compact?: boolean;
}

const TierBadge = ({ label, score, verified }: { label: string; score?: number; verified?: boolean }) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    'Secure': { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.3)' },
    'Moderate': { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    'At Risk': { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  };
  const c = colors[label] || colors['At Risk'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', borderRadius: '14px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {verified !== undefined && (verified ? '✓' : '✗')} {label}{score !== undefined ? ` ${score}/100` : ''}
    </span>
  );
};

const GreenTierBadge = ({ tier, label }: { tier: string; label: string }) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    'green_verified': { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.3)' },
    'user_dependent': { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  };
  const c = colors[tier] || { bg: 'rgba(100,116,139,0.1)', text: '#64748b', border: 'rgba(100,116,139,0.3)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      🌿 {label}
    </span>
  );
};

export default function PlaygroundPanel({ serverId, serverName, compact = false }: PlaygroundPanelProps) {
  const [init, setInit] = useState<PlaygroundInit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, any>>({});
  const [toolResult, setToolResult] = useState<string | null>(null);
  const [toolRunning, setToolRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Initialize playground session
  const startSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/playground/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
        return;
      }
      setInit(data);
      addLog(`Session initialized: ${data.mode} mode`);

      if (data.mode === 'stdio') {
        connectStdio(data.sessionId);
      } else if (data.mode === 'remote' && data.remoteUrl) {
        addLog(`Remote URL: ${data.remoteUrl}`);
        setConnected(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Connect to stdio sandbox via WebSocket
  const connectStdio = (sessionId: string) => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/playground/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      addLog('WebSocket connected to sandbox');

      // Send MCP initialize
      ws.send(JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2025-03-26', clientInfo: { name: 'mymcpshelf-playground', version: '0.1.0' } },
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.error) {
          addLog(`Error: ${msg.error.message}`);
        } else if (msg.result) {
          if (msg.id === 1) {
            addLog('Server initialized');
            // Request tools list
            ws.send(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }));
          } else if (msg.id === 2) {
            const tools = msg.result.tools || [];
            addLog(`Available tools: ${tools.length}`);
          } else {
            // Tool result
            setToolResult(JSON.stringify(msg.result, null, 2));
            addLog('Tool execution complete');
            setToolRunning(false);
          }
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      setConnected(false);
      addLog('WebSocket disconnected');
    };

    ws.onerror = () => {
      setError('WebSocket connection failed');
    };

    wsRef.current = ws;
  };

  // Execute a tool
  const executeTool = () => {
    if (!selectedTool) return;
    setToolRunning(true);
    setToolResult(null);
    addLog(`Calling tool: ${selectedTool.name}`);

    if (init?.mode === 'stdio' && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: selectedTool.name, arguments: toolArgs },
      }));
    } else if (init?.mode === 'remote') {
      // For remote servers, the actual execution happens via SSE/Streamable HTTP
      // Show preview mode with tool details
      setToolResult(JSON.stringify({
        _meta: { playground: true, preview: true },
        tool: selectedTool.name,
        arguments: toolArgs,
        message: 'Remote server preview. Connect your client for full execution.',
        install_command: `npx mymcpshelf add ${serverId}`,
      }, null, 2));
      setToolRunning(false);
    }
  };

  // Reset session
  const resetSession = () => {
    if (wsRef.current) wsRef.current.close();
    setInit(null);
    setConnected(false);
    setSelectedTool(null);
    setToolArgs({});
    setToolResult(null);
    setToolRunning(false);
    setLogs([]);
    setError(null);
  };

  if (compact && !init) {
    return (
      <button
        onClick={startSession}
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: '1px solid rgba(99,102,241,0.4)',
          backgroundColor: 'rgba(99,102,241,0.1)',
          color: '#818cf8',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        {loading ? 'Starting...' : '▶ Try in Playground'}
      </button>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, hsl(220,40%,12%) 0%, hsl(215,30%,18%) 100%)', borderRadius: '16px', padding: '1.5rem', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
          🔬 Playground
        </h3>
        {init && (
          <button onClick={resetSession} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>
            Reset
          </button>
        )}
      </div>

      {/* Safety context badges — our differentiator vs mcp.so */}
      {init && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {init.security && <TierBadge label={init.security.tier} score={init.security.audit_score} verified={init.security.verified} />}
          {init.greenScore && <GreenTierBadge tier={init.greenScore.tier} label={init.greenScore.label} />}
          {init.reliability && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
              📊 {init.reliability.score}/100 {init.reliability.tier}
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
            {init.mode === 'remote' ? '🌐 Remote' : '💻 Stdio Sandbox'}
          </span>
        </div>
      )}

      {/* Connection status */}
      {!init && !loading && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: '#94a3b8', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
            Try {serverName} live in the browser with security context.
          </p>
          <button
            onClick={startSession}
            style={{ padding: '0.65rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}
          >
            ▶ Start Playground
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <p style={{ color: '#94a3b8' }}>Initializing sandbox...</p>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Main playground area */}
      {init && connected && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Left: Tools & Input */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#e2e8f0' }}>Available Tools</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(init.tools || []).map((tool, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedTool(tool); setToolArgs({}); setToolResult(null); }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: `1px solid ${selectedTool?.name === tool.name ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedTool?.name === tool.name ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{tool.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                    {tool.description?.slice(0, 80)}{tool.description?.length > 80 ? '...' : ''}
                  </div>
                </div>
              ))}
              {init.tools.length === 0 && (
                <div style={{ color: '#64748b', fontSize: '0.8rem', padding: '0.5rem' }}>
                  No tools indexed. Install locally to explore: <code style={{ color: '#818cf8' }}>npx mymcpshelf add {serverId}</code>
                </div>
              )}
            </div>

            {/* Tool arguments form */}
            {selectedTool && (
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                  Arguments for <code style={{ color: '#818cf8' }}>{selectedTool.name}</code>
                </h4>
                {selectedTool.inputSchema?.properties ? (
                  Object.entries(selectedTool.inputSchema.properties).map(([key, schema]: [string, any]) => (
                    <div key={key} style={{ marginBottom: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
                        {key} {selectedTool.inputSchema.required?.includes(key) && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={schema.description || key}
                        value={toolArgs[key] || ''}
                        onChange={(e) => setToolArgs(prev => ({ ...prev, [key]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'white',
                          fontSize: '0.8rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>No input schema defined.</div>
                )}
                <button
                  onClick={executeTool}
                  disabled={toolRunning}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: toolRunning ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: toolRunning ? 'wait' : 'pointer',
                  }}
                >
                  {toolRunning ? 'Running...' : '▶ Execute'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Output & Logs */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#e2e8f0' }}>Output</h4>
            {toolResult ? (
              <pre style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                lineHeight: 1.5,
                color: '#e2e8f0',
                maxHeight: '300px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {toolResult}
              </pre>
            ) : (
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.8rem',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                Select a tool and execute it to see output here.
              </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>Session Log</h4>
                <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                  {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Install CTA */}
      {init && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#c7d2fe' }}>Install for full execution:</span>
          <code style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '0.8rem' }}>
            npx mymcpshelf add {serverId}
          </code>
        </div>
      )}
    </div>
  );
}
