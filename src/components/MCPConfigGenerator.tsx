import React, { useState, useEffect } from 'react';
import { configPresets, getPopularPresets, ConfigPreset } from '../data/configPresets.js';

interface MCPServer {
  id: string;
  fields: {
    name: string;
    description: string;
    npm_package?: string;
    github_url?: string;
    category?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
  };
}

interface MCPClientConfig {
  client: string;
  serverId: string;
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

// Client configuration formats
const CLIENT_CONFIGS = {
  'claude-desktop': {
    name: 'Claude Desktop',
    configPath: '~/Library/Application Support/Claude/claude_desktop_config.json',
    format: (servers: MCPClientConfig[]) => ({
      mcpServers: servers.reduce((acc, server) => ({
        ...acc,
        [server.name]: {
          ...(server.command && { command: server.command }),
          ...(server.args && server.args.length > 0 && { args: server.args }),
          ...(server.env && Object.keys(server.env).length > 0 && { env: server.env }),
        }
      }), {})
    })
  },
  'cursor': {
    name: 'Cursor',
    configPath: '~/.cursor/mcp_config.json',
    format: (servers: MCPClientConfig[]) => ({
      mcpServers: servers.reduce((acc, server) => ({
        ...acc,
        [server.name]: {
          ...(server.command && { command: server.command }),
          ...(server.args && server.args.length > 0 && { args: server.args }),
          ...(server.env && Object.keys(server.env).length > 0 && { env: server.env }),
        }
      }), {})
    })
  },
  'cline': {
    name: 'Cline (VS Code)',
    configPath: '~/.cline/mcp_config.json',
    format: (servers: MCPClientConfig[]) => ({
      mcpServers: servers.reduce((acc, server) => ({
        ...acc,
        [server.name]: {
          ...(server.command && { command: server.command }),
          ...(server.args && server.args.length > 0 && { args: server.args }),
          ...(server.env && Object.keys(server.env).length > 0 && { env: server.env }),
        }
      }), {})
    })
  },
  'continue': {
    name: 'Continue (VS Code)',
    configPath: '~/.continue/mcp_config.json',
    format: (servers: MCPClientConfig[]) => ({
      mcpServers: servers.reduce((acc, server) => ({
        ...acc,
        [server.name]: {
          ...(server.command && { command: server.command }),
          ...(server.args && server.args.length > 0 && { args: server.args }),
          ...(server.env && Object.keys(server.env).length > 0 && { env: server.env }),
        }
      }), {})
    })
  },
  'vscode': {
    name: 'VS Code (Official)',
    configPath: '~/.vscode/mcp_config.json',
    format: (servers: MCPClientConfig[]) => ({
      mcpServers: servers.reduce((acc, server) => ({
        ...acc,
        [server.name]: {
          ...(server.command && { command: server.command }),
          ...(server.args && server.args.length > 0 && { args: server.args }),
          ...(server.env && Object.keys(server.env).length > 0 && { env: server.env }),
        }
      }), {})
    })
  }
};

export default function MCPConfigGenerator({ servers }: { servers: MCPServer[] }) {
  const [selectedClient, setSelectedClient] = useState<string>('claude-desktop');
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [generatedConfig, setGeneratedConfig] = useState<object | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAllPresets, setShowAllPresets] = useState(false);

  // Get popular presets for quick access
  const popularPresets = React.useMemo(() => getPopularPresets(6), []);
  const displayPresets = showAllPresets ? Object.values(configPresets) : popularPresets;

  // Filter servers based on search
  const filteredServers = React.useMemo(() => {
    if (!searchTerm) return servers;
    return servers.filter(server =>
      server.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.fields.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [servers, searchTerm]);

  // Toggle server selection
  const toggleServer = (serverId: string) => {
    const newSelection = new Set(selectedServers);
    if (newSelection.has(serverId)) {
      newSelection.delete(serverId);
    } else {
      newSelection.add(serverId);
    }
    setSelectedServers(newSelection);
    setActivePreset(null); // Clear preset when manually selecting
  };

  // Select a preset
  const selectPreset = (preset: ConfigPreset) => {
    // Filter to only include servers that exist in our server list
    const availableServers = preset.servers.filter(serverId => 
      servers.some(s => s.id === serverId)
    );
    setSelectedServers(new Set(availableServers));
    setActivePreset(preset.id);
  };

  // Select all visible servers
  const selectAll = () => {
    const allIds = new Set(filteredServers.map(s => s.id));
    setSelectedServers(allIds);
    setActivePreset(null);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedServers(new Set());
    setActivePreset(null);
  };

  // Generate configuration when selection or client changes
  useEffect(() => {
    if (selectedServers.size === 0) {
      setGeneratedConfig(null);
      return;
    }

    const clientConfig = CLIENT_CONFIGS[selectedClient as keyof typeof CLIENT_CONFIGS];
    if (!clientConfig) return;

    const selectedServerConfigs: MCPClientConfig[] = servers
      .filter(server => selectedServers.has(server.id))
      .map(server => ({
        client: selectedClient,
        serverId: server.id,
        name: server.id,
        command: `npx ${server.fields.npm_package || server.id}`,
        args: [],
        // Add example environment variables for common servers
        env: getEnvVarsForServer(server)
      }));

    setGeneratedConfig(clientConfig.format(selectedServerConfigs));
  }, [selectedServers, selectedClient, servers]);

  // Copy to clipboard
  const handleCopy = async () => {
    if (!generatedConfig) return;
    
    const configText = JSON.stringify(generatedConfig, null, 2);
    try {
      await navigator.clipboard.writeText(configText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="config-generator">
      <div className="config-generator-header">
        <h2>MCP Config Generator</h2>
        <p>Select your client and servers to generate configuration</p>
      </div>

      {/* Quick Presets */}
      <div className="presets-section">
        <div className="presets-header">
          <h3>⚡ Quick Presets</h3>
          <button 
            className="toggle-presets-btn"
            onClick={() => setShowAllPresets(!showAllPresets)}
          >
            {showAllPresets ? 'Show Less' : 'View All'}
          </button>
        </div>
        <p className="presets-subtitle">One-click server combinations for common use cases</p>
        
        <div className="presets-grid">
          {displayPresets.map(preset => (
            <div
              key={preset.id}
              className={`preset-card ${activePreset === preset.id ? 'active' : ''}`}
              onClick={() => selectPreset(preset)}
            >
              <div className="preset-icon">{preset.icon}</div>
              <div className="preset-content">
                <div className="preset-name">{preset.name}</div>
                <div className="preset-meta">
                  <span className="preset-servers">{preset.servers.length} servers</span>
                  <span className="preset-time">{preset.estimatedSetupTime}</span>
                </div>
                <div className={`preset-difficulty ${preset.difficulty}`}>
                  {preset.difficulty}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activePreset && (
          <div className="preset-details">
            <div className="preset-info">
              <div className="preset-title">
                <span className="preset-icon-lg">{configPresets[activePreset]?.icon}</span>
                <span>{configPresets[activePreset]?.name}</span>
              </div>
              <p className="preset-description">{configPresets[activePreset]?.description}</p>
              <div className="preset-benefits">
                <strong>Includes:</strong>
                <ul>
                  {configPresets[activePreset]?.benefits.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>
              {configPresets[activePreset]?.envVars.length > 0 && (
                <div className="preset-env-vars">
                  <strong>Required Environment Variables:</strong>
                  <div className="env-var-tags">
                    {configPresets[activePreset]?.envVars.map((env, i) => (
                      <span key={i} className="env-var-tag">{env}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Client Selection */}
      <div className="client-selection">
        <label htmlFor="client-select">Client:</label>
        <select
          id="client-select"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="client-select"
        >
          {Object.entries(CLIENT_CONFIGS).map(([key, config]) => (
            <option key={key} value={key}>
              {config.name}
            </option>
          ))}
        </select>

        {/* Config Path Display */}
        <div className="config-path">
          <small>Config save location:</small>
          <code>{CLIENT_CONFIGS[selectedClient as keyof typeof CLIENT_CONFIGS]?.configPath}</code>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search servers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Server Selection */}
      <div className="server-selection">
        <div className="selection-actions">
          <button onClick={selectAll} className="action-btn">Select All ({filteredServers.length})</button>
          <button onClick={clearSelection} className="action-btn clear-btn">
            Clear ({selectedServers.size} selected)
          </button>
        </div>

        <div className="server-list">
          {filteredServers.map(server => (
            <div
              key={server.id}
              className={`server-item ${selectedServers.has(server.id) ? 'selected' : ''}`}
              onClick={() => toggleServer(server.id)}
            >
              <div className="checkbox">
                <input
                  type="checkbox"
                  checked={selectedServers.has(server.id)}
                  onChange={() => toggleServer(server.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="server-info">
                <div className="server-name">{server.fields.name}</div>
                <div className="server-category">
                  {server.fields.category && (
                    <span className="category-badge">{server.fields.category}</span>
                  )}
                </div>
                <div className="server-description">{server.fields.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Config */}
      {generatedConfig && (
        <div className="generated-config">
          <div className="config-header">
            <h3>Generated Configuration</h3>
            <button
              onClick={handleCopy}
              className={`copy-btn ${copied ? 'copied' : ''}`}
              disabled={!generatedConfig}
            >
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          
          <div className="config-instructions">
            <p><strong>Instructions:</strong></p>
            <ol>
              <li>Copy the configuration above</li>
              <li>Create the config file if it doesn't exist:</li>
              <code>{getClientConfigPath(selectedClient)}</code>
              <li>Paste the configuration into the file</li>
              <li>Restart your {CLIENT_CONFIGS[selectedClient as keyof typeof CLIENT_CONFIGS]?.name}</li>
            </ol>
          </div>

          <pre className="config-code">
            {JSON.stringify(generatedConfig, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Helper function to get example environment variables for specific servers
function getEnvVarsForServer(server: MCPServer): Record<string, string> | undefined {
  // Default env vars based on server type
  if (server.id === 'github-mcp') {
    return {
      GITHUB_TOKEN: '<your-github-token>'
    };
  }
  
  if (server.id === 'gdrive-mcp' || server.id === 'gmail-mcp') {
    return {
      'OAUTH_TOKEN': '<your-oauth-token>',
      'CLIENT_ID': '<your-client-id>',
      'CLIENT_SECRET': '<your-client-secret>'
    };
  }
  
  if (server.category === 'databases') {
    return {
      'DATABASE_URL': 'postgresql://user:password@localhost:5432/dbname'
    };
  }
  
  if (server.category === 'cloud' || server.category === 'file-systems') {
    return {
      'API_KEY': '<your-api-key>'
    };
  }
  
  // Most npm-based servers don't need env vars
  return undefined;
}

function getClientConfigPath(client: string): string {
  const config = CLIENT_CONFIGS[client as keyof typeof CLIENT_CONFIGS];
  return config?.configPath || '~/.mcp_config.json';
}

// Styles
const styles = `
.config-generator {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, hsl(220, 40%, 12%) 0%, hsl(215, 30%, 18%) 100%);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  color: white;
}

.config-generator-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.config-generator-header p {
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.client-selection {
  margin: 1.5rem 0;
  background: rgba(255, 255, 255, 0.05);
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.client-selection label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.client-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  cursor: pointer;
}

.client-select option {
  color: black;
}

.config-path {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.config-path small {
  display: block;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.25rem;
}

.config-path code {
  display: block;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  border-radius: 6px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.85rem;
  color: hsl(var(--primary));
  word-break: break-all;
}

.search-bar {
  margin: 1.5rem 0;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.selection-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.action-btn.clear-btn {
  border-color: rgba(239, 68, 68, 0.3);
}

.action-btn.clear-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.server-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
}

.server-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.2s ease;
}

.server-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.server-item.selected {
  background: hsl(var(--primary), 0.1);
  border-color: hsl(var(--primary), 0.3);
}

.checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.server-info {
  flex: 1;
  min-width: 0;
}

.server-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.category-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  background: hsl(var(--primary), 0.2);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: hsl(var(--primary));
}

.server-description {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.generated-config {
  margin-top: 2rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.config-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.copy-btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: hsl(var(--primary));
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.copy-btn:hover {
  background: hsl(var(--primary), 0.9);
  transform: translateY(-1px);
}

.copy-btn.copied {
  background: hsl(142, 71%, 45%);
}

.config-instructions {
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid hsl(var(--primary));
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.config-instructions p {
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.config-instructions ol {
  margin: 0;
  padding-left: 1.5rem;
}

.config-instructions li {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.config-instructions code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.85rem;
  color: hsl(var(--primary));
}

.config-code {
  background: rgba(0, 0, 0, 0.5);
  padding: 1.25rem;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-all;
}

.config-code::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.config-code::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.config-code::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.config-code::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Presets Section */
.presets-section {
  margin: 1.5rem 0;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.presets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.presets-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.presets-subtitle {
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.toggle-presets-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-presets-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.preset-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.preset-card.active {
  background: hsl(var(--primary), 0.15);
  border-color: hsl(var(--primary), 0.5);
}

.preset-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.preset-content {
  flex: 1;
  min-width: 0;
}

.preset-name {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
  line-height: 1.3;
}

.preset-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.35rem;
}

.preset-servers {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.preset-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.preset-difficulty {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.preset-difficulty.beginner {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.preset-difficulty.intermediate {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.preset-difficulty.advanced {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.preset-details {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.preset-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preset-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: hsl(var(--primary));
}

.preset-icon-lg {
  font-size: 1.5rem;
}

.preset-description {
  color: hsl(var(--muted-foreground));
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.preset-benefits {
  font-size: 0.875rem;
}

.preset-benefits strong {
  color: hsl(var(--foreground));
  display: block;
  margin-bottom: 0.35rem;
}

.preset-benefits ul {
  margin: 0;
  padding-left: 1.25rem;
}

.preset-benefits li {
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.preset-env-vars {
  font-size: 0.875rem;
}

.preset-env-vars strong {
  color: hsl(var(--foreground));
  display: block;
  margin-bottom: 0.35rem;
}

.env-var-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.env-var-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'SF Mono', Monaco, monospace;
  color: #f59e0b;
}

@media (max-width: 768px) {
  .presets-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .preset-card {
    padding: 0.75rem;
  }

  .preset-icon {
    font-size: 1.25rem;
  }

  .preset-name {
    font-size: 0.85rem;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
