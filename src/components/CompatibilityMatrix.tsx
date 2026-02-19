import React, { useState, useMemo } from 'react';
import { 
  compatibilityMatrix, 
  getCompatibility, 
  getCompatibilityNote,
  getTransportInfo 
} from '../data/compatibilityMatrix.js';
import { 
  getReportsForPair, 
  getAggregateStatus, 
  upvoteReport, 
  downvoteReport 
} from '../data/compatibilityReports.js';
import CompatibilityReportForm from './CompatibilityReportForm';

interface MCPServer {
  id: string;
  fields: {
    name: string;
    category?: string;
  };
}

interface CompatibilityMatrixProps {
  servers: MCPServer[];
}

type FilterMode = 'all' | 'compatible' | 'incompatible' | 'unknown';

export default function CompatibilityMatrix({ servers }: CompatibilityMatrixProps) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{ client: string; server: string } | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

  const clients = Object.keys(compatibilityMatrix.clients);
  const serverIds = Object.keys(compatibilityMatrix.serverTransports);

  // Filter servers based on search
  const filteredServerIds = useMemo(() => {
    if (!searchTerm) return serverIds;
    
    return serverIds.filter(serverId => {
      const server = servers.find(s => s.id === serverId);
      return server?.fields.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [serverIds, searchTerm, servers]);

  // Get status display
  const getStatusDisplay = (status: 'yes' | 'partial' | 'no' | 'unknown') => {
    switch (status) {
      case 'yes':
        return { icon: '✓', label: 'Works', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'partial':
        return { icon: '◐', label: 'Partial', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'no':
        return { icon: '✗', label: 'No', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'unknown':
        return { icon: '?', label: 'Unknown', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
    }
  };

  // Render compatibility cell
  const renderCell = (clientId: string, serverId: string) => {
    const status = getCompatibility(clientId, serverId);
    const display = getStatusDisplay(status);
    const isSelected = selectedClient === clientId || selectedServer === serverId;
    const isHovered = hoveredCell?.client === clientId && hoveredCell?.server === serverId;

    return (
      <div
        key={`${clientId}-${serverId}`}
        className={`matrix-cell ${status} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
        onClick={() => {
          setSelectedClient(clientId);
          setSelectedServer(serverId);
        }}
        onMouseEnter={() => setHoveredCell({ client: clientId, server: serverId })}
        onMouseLeave={() => setHoveredCell(null)}
        style={{
          backgroundColor: display.bg,
          borderColor: isSelected ? display.color : 'transparent'
        }}
      >
        <span className="status-icon" style={{ color: display.color }}>
          {display.icon}
        </span>
      </div>
    );
  };

  // Get selected cell info
  const selectedInfo = useMemo(() => {
    if (!selectedClient || !selectedServer) return null;

    const status = getCompatibility(selectedClient, selectedServer);
    const display = getStatusDisplay(status);
    const note = getCompatibilityNote(selectedClient, selectedServer);
    const transport = getTransportInfo(selectedClient, selectedServer);
    const clientInfo = compatibilityMatrix.clients[selectedClient];
    const serverInfo = servers.find(s => s.id === selectedServer);

    return {
      client: clientInfo,
      server: serverInfo,
      status,
      display,
      note,
      transport
    };
  }, [selectedClient, selectedServer, servers]);

  // Count statistics
  const stats = useMemo(() => {
    let yes = 0, no = 0, partial = 0, unknown = 0;
    
    clients.forEach(clientId => {
      filteredServerIds.forEach(serverId => {
        const status = getCompatibility(clientId, serverId);
        if (status === 'yes') yes++;
        else if (status === 'no') no++;
        else if (status === 'partial') partial++;
        else unknown++;
      });
    });

    return { yes, no, partial, unknown, total: yes + no + partial + unknown };
  }, [clients, filteredServerIds]);

  return (
    <div className="compatibility-matrix">
      <div className="matrix-header">
        <h2>Client × Server Compatibility Matrix</h2>
        <p>Visual grid showing which MCP servers work with which clients</p>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <div className="legend-cell" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <span style={{ color: '#10b981' }}>✓</span>
          </div>
          <span>Works</span>
        </div>
        <div className="legend-item">
          <div className="legend-cell" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <span style={{ color: '#f59e0b' }}>◐</span>
          </div>
          <span>Partial</span>
        </div>
        <div className="legend-item">
          <div className="legend-cell" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <span style={{ color: '#ef4444' }}>✗</span>
          </div>
          <span>Incompatible</span>
        </div>
        <div className="legend-item">
          <div className="legend-cell" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)' }}>
            <span style={{ color: '#6b7280' }}>?</span>
          </div>
          <span>Unknown</span>
        </div>

        <div className="stats">
          <span className="stat">{stats.yes} compatible</span>
          <span className="stat">{stats.no} incompatible</span>
          <span className="stat">{stats.unknown} untested</span>
        </div>
      </div>

      {/* Controls */}
      <div className="matrix-controls">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            Show All
          </button>
          <button 
            className={`filter-btn ${filterMode === 'compatible' ? 'active' : ''}`}
            onClick={() => setFilterMode('compatible')}
          >
            Compatible Only
          </button>
          <button 
            className={`filter-btn ${filterMode === 'incompatible' ? 'active' : ''}`}
            onClick={() => setFilterMode('incompatible')}
          >
            Incompatible
          </button>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="matrix-container">
        <div className="matrix-grid">
          {/* Header Row - Server Names */}
          <div className="matrix-row header-row">
            <div className="matrix-cell corner-cell">
              <span>Client / Server</span>
            </div>
            {filteredServerIds.map(serverId => {
              const server = servers.find(s => s.id === serverId);
              const isSelected = selectedServer === serverId;
              
              return (
                <div
                  key={serverId}
                  className={`matrix-cell server-header ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedServer(isSelected ? null : serverId)}
                >
                  <div className="server-header-content">
                    <span className="server-short-name">
                      {server?.fields.name.substring(0, 12) || serverId}
                      {server?.fields.name.length > 12 && '...'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Rows */}
          {clients.map(clientId => {
            const client = compatibilityMatrix.clients[clientId];
            const isSelected = selectedClient === clientId;
            const isHighlighted = hoveredCell?.client === clientId;

            return (
              <div 
                key={clientId} 
                className={`matrix-row ${isHighlighted ? 'highlighted' : ''}`}
              >
                <div
                  className={`matrix-cell client-header ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedClient(isSelected ? null : clientId)}
                >
                  <span className="client-icon">{client.icon}</span>
                  <span className="client-name">{client.name}</span>
                </div>
                
                {filteredServerIds.map(serverId => renderCell(clientId, serverId))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selection Details */}
      {selectedInfo && (
        <div className="selection-details">
          <div className="details-header">
            <h3>Compatibility Details</h3>
            <button 
              className="clear-btn"
              onClick={() => {
                setSelectedClient(null);
                setSelectedServer(null);
              }}
            >
              Clear Selection
            </button>
          </div>

          <div className="details-content">
            <div className="detail-section">
              <h4>{selectedInfo.client.icon} {selectedInfo.client.name}</h4>
              <div className="detail-info">
                <div className="info-row">
                  <span className="label">Transport Support:</span>
                  <span className="value">
                    {selectedInfo.client.transport.map(t => (
                      <span key={t} className={`transport-badge ${t}`}>
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Min Version:</span>
                  <span className="value">{selectedInfo.client.version}</span>
                </div>
                <div className="info-row">
                  <span className="label">Popularity:</span>
                  <div className="popularity-bar">
                    <div 
                      className="popularity-fill"
                      style={{ width: `${selectedInfo.client.popularity}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>📦 {selectedInfo.server?.fields.name || selectedServer}</h4>
              <div className="detail-info">
                <div className="info-row">
                  <span className="label">Transport Support:</span>
                  <span className="value">
                    {selectedInfo.transport.serverTransports.map(t => (
                      <span key={t} className={`transport-badge ${t}`}>
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Recommended:</span>
                  <span className="value">{selectedInfo.transport.recommendedTransport.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="compatibility-result">
              <div className={`result-badge ${selectedInfo.status}`}>
                <span className="result-icon">{selectedInfo.display.icon}</span>
                <span className="result-text">{selectedInfo.display.label}</span>
              </div>
              
              {/* User Reports Summary */}
              {selectedClient && selectedServer && (
                <UserReportsSection 
                  clientId={selectedClient} 
                  serverId={selectedServer}
                />
              )}
              
              {selectedInfo.note && (
                <div className="compatibility-note">
                  <span className="note-icon">ℹ️</span>
                  <span>{selectedInfo.note}</span>
                </div>
              )}

              {!selectedInfo.transport.compatible && (
                <div className="compatibility-note warning">
                  <span className="note-icon">⚠️</span>
                  <span>
                    Transport mismatch: Client supports {selectedInfo.transport.clientTransports.join('/')}, 
                    but server only supports {selectedInfo.transport.serverTransports.join('/')}.
                  </span>
                </div>
              )}
              
              {/* Submit Report Button */}
              {selectedClient && selectedServer && (
                <button 
                  className="submit-report-btn"
                  onClick={() => setShowReportForm(!showReportForm)}
                >
                  {showReportForm ? 'Hide Form' : '📝 Submit Your Report'}
                </button>
              )}
              
              {/* Report Form */}
              {showReportForm && selectedClient && selectedServer && (
                <CompatibilityReportForm 
                  clientId={selectedClient}
                  serverId={selectedServer}
                  onSubmit={() => setShowReportForm(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Crowdsource CTA */}
      <div className="crowdsource-section">
        <h3>Help Improve This Data</h3>
        <p>
          This compatibility matrix is crowdsourced. If you've tested a client-server combination, 
          please contribute your results!
        </p>
        <div className="crowdsource-actions">
          <a 
            href="https://github.com/anthropics/mcp-directory/issues/new?labels=compatibility&title=Compatibility+Report"
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn primary"
          >
            Report Compatibility
          </a>
          <a 
            href="https://github.com/anthropics/mcp-directory/blob/main/compatibility-matrix.md"
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn"
          >
            View Raw Data
          </a>
        </div>
      </div>
    </div>
  );
}

// User Reports Section Component
function UserReportsSection({ clientId, serverId }: { clientId: string; serverId: string }) {
  const reports = getReportsForPair(clientId, serverId);
  const aggregate = getAggregateStatus(clientId, serverId);
  
  if (reports.length === 0) {
    return (
      <div className="user-reports-section empty">
        <div className="reports-header">
          <span>👥 User Reports</span>
        </div>
        <p className="no-reports">No user reports yet. Be the first to contribute!</p>
      </div>
    );
  }
  
  return (
    <div className="user-reports-section">
      <div className="reports-header">
        <span>👥 User Reports ({reports.length})</span>
        <span className={`aggregate-status ${aggregate.status}`}>
          {aggregate.confidence.toFixed(0)}% agree
        </span>
      </div>
      <div className="reports-list">
        {reports.slice(0, 5).map(report => (
          <div key={report.id} className="report-card">
            <div className="report-main">
              <span className={`report-status ${report.status}`}>
                {report.status === 'works' ? '✓' : report.status === 'broken' ? '✗' : '◐'}
              </span>
              <div className="report-details">
                {report.version && <span className="report-version">{report.version}</span>}
                {report.notes && <span className="report-notes">{report.notes}</span>}
              </div>
            </div>
            <div className="report-actions">
              <button 
                className="vote-btn upvote"
                onClick={() => upvoteReport(report.id)}
              >
                👍 {report.upvotes}
              </button>
              <button 
                className="vote-btn downvote"
                onClick={() => downvoteReport(report.id)}
              >
                👎 {report.downvotes}
              </button>
            </div>
          </div>
        ))}
        {reports.length > 5 && (
          <div className="more-reports">
            + {reports.length - 5} more reports
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const styles = `
.compatibility-matrix {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, hsl(220, 40%, 12%) 0%, hsl(215, 30%, 18%) 100%);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  color: white;
}

.matrix-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.matrix-header p {
  color: hsl(var(--muted-foreground));
  margin: 0 0 1.5rem 0;
}

.legend {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.legend-cell {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 0.9rem;
}

.stats {
  margin-left: auto;
  display: flex;
  gap: 1rem;
}

.stat {
  font-size: 0.85rem;
  color: hsl(var(--muted-foreground));
}

.matrix-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-filter {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.9rem;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.625rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-btn.active {
  background: hsl(var(--primary), 0.2);
  border-color: hsl(var(--primary), 0.3);
  color: hsl(var(--primary));
}

.matrix-container {
  overflow-x: auto;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
}

.matrix-grid {
  display: flex;
  flex-direction: column;
  min-width: 800px;
}

.matrix-row {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.matrix-row:last-child {
  border-bottom: none;
}

.matrix-row.highlighted {
  background: rgba(255, 255, 255, 0.05);
}

.matrix-cell {
  min-width: 90px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
  transition: all 0.2s ease;
}

.matrix-cell:last-child {
  border-right: none;
}

.corner-cell {
  min-width: 180px;
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  font-size: 0.85rem;
}

.server-header, .client-header {
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
}

.server-header:hover, .client-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.server-header.selected {
  background: hsl(var(--primary), 0.2);
}

.client-header.selected {
  background: hsl(var(--primary), 0.2);
}

.server-header-content {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-size: 0.75rem;
}

.server-short-name {
  font-weight: 500;
}

.client-header {
  flex-direction: row;
  justify-content: flex-start;
  gap: 0.5rem;
  padding-left: 1rem;
}

.client-icon {
  font-size: 1.25rem;
}

.client-name {
  font-size: 0.85rem;
  font-weight: 500;
}

.matrix-cell.yes, .matrix-cell.no, .matrix-cell.partial, .matrix-cell.unknown {
  cursor: pointer;
}

.matrix-cell.yes:hover, .matrix-cell.no:hover, .matrix-cell.partial:hover, .matrix-cell.unknown:hover {
  transform: scale(1.1);
  z-index: 1;
}

.matrix-cell.selected {
  border: 2px solid;
}

.matrix-cell.hovered {
  transform: scale(1.15);
  z-index: 2;
}

.status-icon {
  font-size: 1.25rem;
  font-weight: 600;
}

.selection-details {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.details-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.clear-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  background: transparent;
  color: #ef4444;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.details-content {
  display: grid;
  gap: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: hsl(var(--primary));
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.info-row .label {
  color: hsl(var(--muted-foreground));
  min-width: 150px;
}

.info-row .value {
  color: hsl(var(--foreground));
}

.transport-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 0.25rem;
}

.transport-badge.stdio {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.transport-badge.sse {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.popularity-bar {
  flex: 1;
  max-width: 150px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.popularity-fill {
  height: 100%;
  background: hsl(var(--primary));
  transition: width 0.3s ease;
}

.compatibility-result {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.result-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
}

.result-badge.yes {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.result-badge.no {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.result-badge.partial {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.result-badge.unknown {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

.compatibility-note {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.9rem;
}

.compatibility-note.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.note-icon {
  font-size: 1rem;
}

.crowdsource-section {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.crowdsource-section h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
}

.crowdsource-section p {
  color: hsl(var(--muted-foreground));
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
}

.crowdsource-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  display: inline-block;
  padding: 0.625rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.action-btn.primary {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

.action-btn.primary:hover {
  background: hsl(var(--primary), 0.9);
}

/* User Reports Section */
.user-reports-section {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-reports-section.empty {
  text-align: center;
  padding: 0.75rem;
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.aggregate-status {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.aggregate-status.works {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.aggregate-status.partial {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.aggregate-status.broken {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.no-reports {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  margin: 0;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.report-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.report-main {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  flex: 1;
}

.report-status {
  font-size: 1.25rem;
}

.report-status.works { color: #22c55e; }
.report-status.partial { color: #f59e0b; }
.report-status.broken { color: #ef4444; }

.report-details {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.report-version {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.report-notes {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-actions {
  display: flex;
  gap: 0.25rem;
}

.vote-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
}

.vote-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.vote-btn.upvote:hover {
  border-color: #22c55e;
  color: #22c55e;
}

.vote-btn.downvote:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.more-reports {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  padding: 0.5rem 0;
}

.submit-report-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: hsl(var(--primary));
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-report-btn:hover {
  background: hsl(var(--primary), 0.9);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
