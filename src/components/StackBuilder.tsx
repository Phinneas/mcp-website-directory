import React, { useState, useEffect, useMemo } from 'react';
import { dockerMappings, generateDockerCompose, generateEnvExample } from '../data/dockerMapping.js';

interface MCPServer {
  id: string;
  fields: {
    name: string;
    description: string;
    category?: string;
  };
}

interface DockerConfig {
  image: string;
  ports: string[];
  environment: Record<string, string>;
  volumes: string[];
  command?: string;
  healthcheck?: object;
  shm_size?: string;
}

interface StackBuilderProps {
  servers: MCPServer[];
}

export default function StackBuilder({ servers }: StackBuilderProps) {
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [projectName, setProjectName] = useState('mcp-stack');
  const [networkName, setNetworkName] = useState('mcp-network');
  const [includeHealthchecks, setIncludeHealthchecks] = useState(true);
  const [generatedYaml, setGeneratedYaml] = useState<string>('');
  const [envExample, setEnvExample] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState<'yaml' | 'env' | null>(null);

  // Filter servers based on Docker availability and search
  const availableServers = useMemo(() => {
    const dockerServerIds = new Set(Object.keys(dockerMappings));
    
    return servers
      .filter(server => dockerServerIds.has(server.id))
      .filter(server =>
        !searchTerm ||
        server.fields.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        server.fields.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [servers, searchTerm]);

  // Generate YAML and .env when selection changes
  useEffect(() => {
    if (selectedServers.size === 0) {
      setGeneratedYaml('');
      setEnvExample('');
      return;
    }

    const { compose, envVars } = generateDockerCompose(Array.from(selectedServers), {
      projectName,
      networkName,
      includeHealthchecks
    });

    // Convert to YAML
    const yaml = jsonToYaml(compose);
    setGeneratedYaml(yaml);

    // Generate .env.example
    if (envVars.length > 0) {
      setEnvExample(generateEnvExample(envVars));
    } else {
      setEnvExample('# No environment variables required for selected servers');
    }
  }, [selectedServers, projectName, networkName, includeHealthchecks]);

  // Toggle server selection
  const toggleServer = (serverId: string) => {
    const newSelection = new Set(selectedServers);
    if (newSelection.has(serverId)) {
      newSelection.delete(serverId);
    } else {
      newSelection.add(serverId);
    }
    setSelectedServers(newSelection);
  };

  // Select all visible servers
  const selectAll = () => {
    const allIds = new Set(availableServers.map(s => s.id));
    setSelectedServers(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedServers(new Set());
  };

  // Copy to clipboard
  const handleCopy = async (type: 'yaml' | 'env') => {
    const text = type === 'yaml' ? generatedYaml : envExample;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download as file
  const handleDownload = (type: 'yaml' | 'env') => {
    const text = type === 'yaml' ? generatedYaml : envExample;
    const filename = type === 'yaml' ? 'docker-compose.yml' : '.env.example';
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get Docker config for a server
  const getDockerConfig = (serverId: string): DockerConfig | null => {
    return dockerMappings[serverId] || null;
  };

  return (
    <div className="stack-builder">
      <div className="stack-builder-header">
        <h2>Docker Stack Builder</h2>
        <p>Multi-select MCP servers and export a ready-to-run docker-compose.yml</p>
      </div>

      {/* Configuration Options */}
      <div className="config-options">
        <div className="option-group">
          <label htmlFor="project-name">Project Name:</label>
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="mcp-stack"
          />
        </div>

        <div className="option-group">
          <label htmlFor="network-name">Network Name:</label>
          <input
            id="network-name"
            type="text"
            value={networkName}
            onChange={(e) => setNetworkName(e.target.value)}
            placeholder="mcp-network"
          />
        </div>

        <div className="option-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={includeHealthchecks}
              onChange={(e) => setIncludeHealthchecks(e.target.checked)}
            />
            Include Health Checks
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search Docker-enabled servers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="search-info">
          {availableServers.length} of {Object.keys(dockerMappings).length} Docker servers available
        </div>
      </div>

      {/* Server Selection */}
      <div className="server-selection">
        <div className="selection-actions">
          <button onClick={selectAll} className="action-btn">
            Select All ({availableServers.length})
          </button>
          <button onClick={clearSelection} className="action-btn clear-btn">
            Clear ({selectedServers.size} selected)
          </button>
        </div>

        <div className="server-list">
          {availableServers.length === 0 ? (
            <div className="no-results">
              No Docker-enabled servers found. Try a different search term.
            </div>
          ) : (
            availableServers.map(server => {
              const config = getDockerConfig(server.id);
              const isSelected = selectedServers.has(server.id);

              return (
                <div
                  key={server.id}
                  className={`server-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleServer(server.id)}
                >
                  <div className="checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleServer(server.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="server-info">
                    <div className="server-header">
                      <span className="server-name">{server.fields.name}</span>
                      {server.fields.category && (
                        <span className="category-badge">{server.fields.category}</span>
                      )}
                    </div>

                    {config && (
                      <div className="docker-details">
                        <div className="docker-detail">
                          <strong>Image:</strong> <code>{config.image}</code>
                        </div>
                        <div className="docker-detail">
                          <strong>Ports:</strong>{' '}
                          {config.ports.map((p, i) => <code key={i}>{p}</code>).reduce((prev, curr) => [prev, ', ', curr] as any)}
                        </div>
                        {Object.keys(config.environment).length > 0 && (
                          <div className="docker-detail env-warning">
                            <span className="warning-icon">⚠️</span>
                            Requires {Object.keys(config.environment).length} environment variable(s)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Generated Output */}
      {generatedYaml && (
        <div className="generated-output">
          <div className="output-tabs">
            <button className="tab active">
              docker-compose.yml
            </button>
            <button className="tab">
              .env.example
            </button>
          </div>

          {/* YAML Output */}
          <div className="output-section">
            <div className="output-header">
              <h3>docker-compose.yml</h3>
              <div className="output-actions">
                <button
                  onClick={() => handleCopy('yaml')}
                  className={`action-btn ${copied === 'yaml' ? 'copied' : ''}`}
                >
                  {copied === 'yaml' ? '✓ Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => handleDownload('yaml')}
                  className="action-btn download-btn"
                >
                  Download
                </button>
              </div>
            </div>

            <div className="output-instructions">
              <p><strong>Quick Start:</strong></p>
              <ol>
                <li>Download or copy the <code>docker-compose.yml</code> file</li>
                {envExample && (
                  <li>Create a <code>.env</code> file from the example below</li>
                )}
                <li>Run <code>docker-compose up -d</code></li>
                <li>Check status with <code>docker-compose ps</code></li>
              </ol>
            </div>

            <pre className="output-code">{generatedYaml}</pre>
          </div>

          {/* .env.example Output */}
          {envExample && (
            <div className="output-section">
              <div className="output-header">
                <h3>.env.example</h3>
                <div className="output-actions">
                  <button
                    onClick={() => handleCopy('env')}
                    className={`action-btn ${copied === 'env' ? 'copied' : ''}`}
                  >
                    {copied === 'env' ? '✓ Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleDownload('env')}
                    className="action-btn download-btn"
                  >
                    Download
                  </button>
                </div>
              </div>

              <div className="output-instructions">
                <p><strong>Setup:</strong></p>
                <ol>
                  <li>Copy this file to <code>.env</code></li>
                  <li>Replace placeholder values with your actual credentials</li>
                  <li>Never commit <code>.env</code> to version control</li>
                </ol>
              </div>

              <pre className="output-code">{envExample}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Convert JSON object to YAML string
 */
function jsonToYaml(obj: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  if (typeof obj !== 'object' || obj === null) {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        yaml += `${spaces}-\n${jsonToYaml(item, indent + 1)}`;
      } else {
        yaml += `${spaces}- ${item}\n`;
      }
    });
  } else {
    Object.entries(obj).forEach(([key, value]) => {
      if (key === 'version') {
        yaml += `${key}: "${value}"\n`;
      } else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
        yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
      } else if (typeof value === 'string') {
        // Quote strings that contain special characters
        if (value.includes(':') || value.includes('#') || value.includes('{') || value.includes('}')) {
          yaml += `${spaces}${key}: "${value}"\n`;
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      } else if (typeof value === 'boolean') {
        yaml += `${spaces}${key}: ${value}\n`;
      } else if (value === null || value === undefined) {
        // Skip null/undefined values
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    });
  }

  return yaml;
}

// Styles
const styles = `
.stack-builder {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, hsl(220, 40%, 12%) 0%, hsl(215, 30%, 18%) 100%);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  color: white;
}

.stack-builder-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.stack-builder-header p {
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.config-options {
  margin: 1.5rem 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.option-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
  font-size: 0.875rem;
}

.option-group input[type="text"] {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.9rem;
}

.option-group input[type="text"]::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.checkbox-group {
  display: flex;
  align-items: flex-end;
  padding-bottom: 0.35rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
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

.search-info {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: hsl(var(--muted-foreground));
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

.action-btn.copied {
  background: hsl(142, 71%, 45%);
  border-color: hsl(142, 71%, 45%);
}

.action-btn.clear-btn {
  border-color: rgba(239, 68, 68, 0.3);
}

.action-btn.clear-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.download-btn {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

.download-btn:hover {
  background: hsl(var(--primary), 0.9);
}

.server-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: hsl(var(--muted-foreground));
  font-style: italic;
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

.server-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.server-name {
  font-weight: 600;
  font-size: 1rem;
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

.docker-details {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.875rem;
}

.docker-detail {
  color: hsl(var(--muted-foreground));
}

.docker-detail strong {
  color: hsl(var(--foreground));
  margin-right: 0.25rem;
}

.docker-detail code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.8rem;
  color: hsl(var(--primary));
}

.env-warning {
  color: #f59e0b !important;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.warning-icon {
  font-size: 1rem;
}

.generated-output {
  margin-top: 2rem;
}

.output-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab.active {
  background: hsl(var(--primary), 0.2);
  border-color: hsl(var(--primary), 0.3);
  color: hsl(var(--primary));
}

.output-section {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.output-header h3 {
  margin: 0;
  font-size: 1.125rem;
}

.output-actions {
  display: flex;
  gap: 0.5rem;
}

.output-instructions {
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid hsl(var(--primary));
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.output-instructions p {
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.output-instructions ol {
  margin: 0;
  padding-left: 1.5rem;
}

.output-instructions li {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.output-instructions code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.85rem;
  color: hsl(var(--primary));
}

.output-code {
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
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
