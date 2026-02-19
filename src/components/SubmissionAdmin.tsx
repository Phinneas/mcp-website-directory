import React, { useState, useEffect } from 'react';
import {
  getAllSubmissions,
  getPendingSubmissions,
  getSubmissionStats,
  approveSubmission,
  rejectSubmission,
  deleteSubmission,
  exportSubmissions,
  submissionToServerFormat,
  MCPServerSubmission
} from '../data/serverSubmissions.js';

export default function SubmissionAdmin() {
  const [submissions, setSubmissions] = useState<MCPServerSubmission[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<MCPServerSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const loadData = () => {
    const all = getAllSubmissions();
    setSubmissions(all);
    setStats(getSubmissionStats());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSubmissions = filter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filter);

  const handleApprove = (id: string) => {
    if (confirm('Approve this submission?')) {
      approveSubmission(id, 'admin', reviewNotes);
      setReviewNotes('');
      loadData();
      setSelectedSubmission(null);
    }
  };

  const handleReject = (id: string) => {
    if (confirm('Reject this submission?')) {
      rejectSubmission(id, 'admin', reviewNotes);
      setReviewNotes('');
      loadData();
      setSelectedSubmission(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Permanently delete this submission?')) {
      deleteSubmission(id);
      loadData();
      setSelectedSubmission(null);
    }
  };

  const handleExport = () => {
    const json = exportSubmissions();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-submissions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!stats || stats.total === 0) {
    return (
      <div className="submission-admin empty">
        <h3>No Submissions Yet</h3>
        <p>Server submissions will appear here for review.</p>
      </div>
    );
  }

  return (
    <div className="submission-admin">
      <div className="admin-header">
        <h3>Submission Review Queue</h3>
        <button onClick={handleExport} className="export-btn">
          Export All ({stats.total})
        </button>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item pending" onClick={() => setFilter('pending')}>
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item approved" onClick={() => setFilter('approved')}>
          <span className="stat-value">{stats.approved}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-item rejected" onClick={() => setFilter('rejected')}>
          <span className="stat-value">{stats.rejected}</span>
          <span className="stat-label">Rejected</span>
        </div>
        <div className="stat-item total" onClick={() => setFilter('all')}>
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? stats.total : stats[f === 'all' ? 'total' : f]})
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="submissions-list">
        {filteredSubmissions.length === 0 ? (
          <div className="no-submissions">No {filter} submissions</div>
        ) : (
          filteredSubmissions.map(submission => (
            <div 
              key={submission.id} 
              className={`submission-card ${submission.status} ${selectedSubmission?.id === submission.id ? 'selected' : ''}`}
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="submission-header">
                <h4>{submission.name}</h4>
                <span className={`status-badge ${submission.status}`}>
                  {submission.status}
                </span>
              </div>
              
              <div className="submission-meta">
                <span className="category">{submission.category}</span>
                <span className="language">{submission.language}</span>
                <span className="transport">{submission.transport.toUpperCase()}</span>
              </div>

              <div className="submission-links">
                <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer">
                  GitHub ↗
                </a>
                {submission.npmPackage && (
                  <a href={`https://www.npmjs.com/package/${submission.npmPackage}`} target="_blank" rel="noopener noreferrer">
                    npm ↗
                  </a>
                )}
              </div>

              <div className="submission-info">
                <p className="description">{submission.description}</p>
                <div className="author">by {submission.author}</div>
                <div className="date">{formatDate(submission.submittedAt)}</div>
              </div>

              {selectedSubmission?.id === submission.id && (
                <div className="submission-details">
                  <div className="detail-row">
                    <strong>Author:</strong> {submission.author}
                    {submission.email && <span className="email">({submission.email})</span>}
                  </div>
                  
                  {submission.homepageUrl && (
                    <div className="detail-row">
                      <strong>Homepage:</strong> 
                      <a href={submission.homepageUrl} target="_blank" rel="noopener noreferrer">
                        {submission.homepageUrl}
                      </a>
                    </div>
                  )}
                  
                  {submission.dockerImage && (
                    <div className="detail-row">
                      <strong>Docker:</strong> {submission.dockerImage}
                    </div>
                  )}
                  
                  {submission.requiredEnvVars && submission.requiredEnvVars.length > 0 && (
                    <div className="detail-row">
                      <strong>Env Vars:</strong> {submission.requiredEnvVars.join(', ')}
                    </div>
                  )}
                  
                  {submission.tags && submission.tags.length > 0 && (
                    <div className="detail-row">
                      <strong>Tags:</strong> {submission.tags.join(', ')}
                    </div>
                  )}

                  {submission.notes && (
                    <div className="detail-row notes">
                      <strong>Notes:</strong> {submission.notes}
                    </div>
                  )}

                  <div className="review-section">
                    <textarea
                      placeholder="Review notes (optional)"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="review-actions">
                      {submission.status === 'pending' && (
                        <>
                          <button 
                            className="approve-btn"
                            onClick={(e) => { e.stopPropagation(); handleApprove(submission.id); }}
                          >
                            ✓ Approve
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={(e) => { e.stopPropagation(); handleReject(submission.id); }}
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      <button 
                        className="delete-btn"
                        onClick={(e) => { e.stopPropagation(); handleDelete(submission.id); }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Styles
const styles = `
.submission-admin {
  font-family: 'Inter', -apple-system, sans-serif;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin: 2rem 0;
  color: white;
}

.submission-admin.empty {
  text-align: center;
  padding: 3rem;
}

.submission-admin.empty h3 {
  margin-bottom: 0.5rem;
}

.submission-admin.empty p {
  color: rgba(255, 255, 255, 0.6);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.admin-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.export-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.85rem;
  cursor: pointer;
}

.export-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.stat-item.pending .stat-value { color: #f59e0b; }
.stat-item.approved .stat-value { color: #22c55e; }
.stat-item.rejected .stat-value { color: #ef4444; }

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter-tab {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  cursor: pointer;
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.05);
}

.filter-tab.active {
  background: hsl(var(--primary), 0.2);
  border-color: hsl(var(--primary), 0.3);
  color: hsl(var(--primary));
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.no-submissions {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.5);
}

.submission-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submission-card:hover {
  background: rgba(255, 255, 255, 0.06);
}

.submission-card.selected {
  background: rgba(255, 255, 255, 0.08);
  border-color: hsl(var(--primary), 0.3);
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.submission-header h4 {
  margin: 0;
  font-size: 1rem;
}

.status-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.status-badge.approved {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.submission-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.submission-meta span {
  padding: 0.15rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
}

.submission-links {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.submission-links a {
  color: hsl(var(--primary));
  font-size: 0.85rem;
  text-decoration: none;
}

.submission-links a:hover {
  text-decoration: underline;
}

.submission-info .description {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.submission-info .author {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.submission-info .date {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.25rem;
}

.submission-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-row {
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.detail-row strong {
  color: rgba(255, 255, 255, 0.8);
  margin-right: 0.5rem;
}

.detail-row a {
  color: hsl(var(--primary));
}

.detail-row .email {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}

.detail-row.notes {
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
}

.review-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.review-section textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-family: inherit;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  resize: vertical;
  min-height: 60px;
}

.review-actions {
  display: flex;
  gap: 0.5rem;
}

.review-actions button {
  flex: 1;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.approve-btn {
  background: #22c55e;
  color: white;
}

.approve-btn:hover {
  background: #16a34a;
}

.reject-btn {
  background: #ef4444;
  color: white;
}

.reject-btn:hover {
  background: #dc2626;
}

.delete-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.delete-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 640px) {
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-tabs {
    flex-wrap: wrap;
  }

  .review-actions {
    flex-wrap: wrap;
  }

  .review-actions button {
    flex-basis: 100%;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
