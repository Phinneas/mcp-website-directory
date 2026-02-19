import React, { useState } from 'react';
import { 
  CompatibilityReportInput, 
  submitReport, 
  getReportsForPair,
  getAggregateStatus 
} from '../data/compatibilityReports.js';
import { compatibilityMatrix } from '../data/compatibilityMatrix.js';

interface CompatibilityReportFormProps {
  clientId?: string;
  serverId?: string;
  onSubmit?: () => void;
}

export default function CompatibilityReportForm({ 
  clientId: initialClientId, 
  serverId: initialServerId,
  onSubmit 
}: CompatibilityReportFormProps) {
  const [clientId, setClientId] = useState(initialClientId || '');
  const [serverId, setServerId] = useState(initialServerId || '');
  const [status, setStatus] = useState<'works' | 'partial' | 'broken' | 'unknown'>('works');
  const [transport, setTransport] = useState<'stdio' | 'sse' | 'both'>('stdio');
  const [notes, setNotes] = useState('');
  const [version, setVersion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clients = Object.entries(compatibilityMatrix.clients);
  const servers = Object.entries(compatibilityMatrix.serverTransports);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !serverId) {
      setError('Please select both a client and server');
      return;
    }

    const clientInfo = compatibilityMatrix.clients[clientId];
    const serverInfo = servers.find(([id]) => id === serverId);

    const input: CompatibilityReportInput = {
      clientId,
      clientName: clientInfo?.name || clientId,
      serverId,
      serverName: serverId,
      status,
      transport,
      notes: notes.trim(),
      version: version.trim()
    };

    try {
      submitReport(input);
      setSubmitted(true);
      setError(null);
      onSubmit?.();
      
      // Reset form after delay
      setTimeout(() => {
        setSubmitted(false);
        setNotes('');
        setVersion('');
      }, 3000);
    } catch (err) {
      setError('Failed to submit report. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="report-form success">
        <div className="success-icon">✓</div>
        <h4>Report Submitted!</h4>
        <p>Thank you for contributing to the compatibility database.</p>
      </div>
    );
  }

  return (
    <form className="compatibility-report-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h4>Submit Compatibility Report</h4>
        <p>Help the community by reporting your test results</p>
      </div>

      {error && (
        <div className="form-error">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="client">MCP Client *</label>
        <select
          id="client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
        >
          <option value="">Select a client...</option>
          {clients.map(([id, client]) => (
            <option key={id} value={id}>
              {client.icon} {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="server">MCP Server *</label>
        <select
          id="server"
          value={serverId}
          onChange={(e) => setServerId(e.target.value)}
          required
        >
          <option value="">Select a server...</option>
          {servers.map(([id]) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="status">Compatibility Status *</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          required
        >
          <option value="works">✓ Works perfectly</option>
          <option value="partial">◐ Partial / has issues</option>
          <option value="broken">✗ Broken / doesn't work</option>
          <option value="unknown">? Not tested yet</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="transport">Transport Type</label>
        <select
          id="transport"
          value={transport}
          onChange={(e) => setTransport(e.target.value as any)}
        >
          <option value="stdio">STDIO</option>
          <option value="sse">SSE (Server-Sent Events)</option>
          <option value="both">Both supported</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="version">Client Version</label>
        <input
          id="version"
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="e.g., Claude Desktop 0.4.0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional details, issues, or workarounds..."
          rows={3}
        />
      </div>

      {clientId && serverId && (
        <div className="existing-reports">
          <ExistingReportsSummary clientId={clientId} serverId={serverId} />
        </div>
      )}

      <button type="submit" className="submit-btn">
        Submit Report
      </button>
    </form>
  );
}

// Show existing reports for selected pair
function ExistingReportsSummary({ clientId, serverId }: { clientId: string; serverId: string }) {
  const reports = getReportsForPair(clientId, serverId);
  const aggregate = getAggregateStatus(clientId, serverId);

  if (reports.length === 0) {
    return (
      <div className="no-reports">
        <span>ℹ️</span> No user reports yet. Be the first!
      </div>
    );
  }

  return (
    <div className="reports-summary">
      <div className="summary-header">
        <strong>{reports.length} report{reports.length > 1 ? 's' : ''}</strong>
        <span className={`status-badge ${aggregate.status}`}>
          {aggregate.status === 'works' ? '✓' : aggregate.status === 'broken' ? '✗' : '◐'} 
          {aggregate.confidence.toFixed(0)}% confidence
        </span>
      </div>
      <ul className="report-list">
        {reports.slice(0, 3).map(report => (
          <li key={report.id} className="report-item">
            <span className={`status ${report.status}`}>
              {report.status === 'works' ? '✓' : report.status === 'broken' ? '✗' : '◐'}
            </span>
            <span className="version">{report.version || 'Unknown version'}</span>
            <span className="votes">👍 {report.upvotes} 👎 {report.downvotes}</span>
          </li>
        ))}
        {reports.length > 3 && (
          <li className="more">+ {reports.length - 3} more</li>
        )}
      </ul>
    </div>
  );
}

// Styles
const styles = `
.compatibility-report-form {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  font-family: 'Inter', -apple-system, sans-serif;
}

.form-header {
  margin-bottom: 1.25rem;
}

.form-header h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  color: white;
}

.form-header p {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.form-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  color: #f87171;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.form-group select,
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-group select option {
  background: #1e293b;
  color: white;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-group select:focus,
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: hsl(var(--primary));
}

.existing-reports {
  margin: 1rem 0;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.no-reports {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

.reports-summary .summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.works {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-badge.partial {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.status-badge.broken {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.report-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.report-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.report-item .status {
  font-size: 1rem;
}

.report-item .status.works { color: #22c55e; }
.report-item .status.partial { color: #f59e0b; }
.report-item .status.broken { color: #ef4444; }

.report-item .version {
  flex: 1;
}

.report-item .votes {
  font-size: 0.75rem;
}

.more {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  font-size: 0.8rem;
  padding-top: 0.25rem;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: hsl(var(--primary));
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:hover {
  background: hsl(var(--primary), 0.9);
  transform: translateY(-1px);
}

.report-form.success {
  text-align: center;
  padding: 2rem;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #22c55e;
}

.report-form.success h4 {
  color: white;
  margin: 0 0 0.5rem 0;
}

.report-form.success p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
