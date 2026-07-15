import { useState, useEffect, useCallback } from 'react';
import { useGitHubAuth } from './useGitHubAuth';

interface ModerationReview {
  id: string;
  server_id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  report_count: number;
  helpful_count: number;
  moderation_note: string | null;
  flagged_at: string | null;
  created_at: string;
  updated_at: string;
  github_username?: string;
  avatar_url?: string;
  reputation_score?: number;
  github_account_age_days?: number;
  github_public_repos?: number;
  github_followers?: number;
  report_count_pending?: number;
}

interface ModerationStats {
  pending: number;
  flagged: number;
  pendingReview: number;
  resolvedToday: number;
  moderators: number;
  bannedUsers: number;
  pendingReports: number;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'abusive', label: 'Abusive / Harassment' },
  { value: 'irrelevant', label: 'Irrelevant' },
  { value: 'misleading', label: 'Misleading' },
  { value: 'other', label: 'Other' },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function repBadge(score?: number) {
  if (score == null) return null;
  if (score >= 50) return { label: 'Trusted', color: '#22c55e', bg: '#22c55e22' };
  if (score >= 20) return { label: 'Established', color: '#3b82f6', bg: '#3b82f622' };
  if (score >= 5) return { label: 'Active', color: '#f59e0b', bg: '#f59e0b22' };
  return { label: 'New', color: '#64748b', bg: '#64748b22' };
}

export default function ModerationPanel() {
  const { user, loading: authLoading, authHeaders, login } = useGitHubAuth();
  const [reviews, setReviews] = useState<ModerationReview[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [filter, setFilter] = useState<'flagged' | 'pending' | 'hidden'>('flagged');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionReason, setActionReason] = useState<Record<string, string>>({});
  const [isModerator, setIsModerator] = useState(false);
  const [checkedModerator, setCheckedModerator] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/moderation?status=${filter}`, {
        headers: { ...authHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else if (res.status === 403) {
        setIsModerator(false);
        setError('You do not have moderator access.');
      } else {
        setError('Failed to load moderation queue');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [filter, authHeaders]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/moderation?endpoint=stats', { headers: { ...authHeaders() } });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {}
  }, [authHeaders]);

  // Check if user is a moderator by attempting to load the queue
  useEffect(() => {
    if (authLoading || !user) return;
    loadQueue().then(() => {
      setCheckedModerator(true);
      if (error !== 'You do not have moderator access.') {
        setIsModerator(true);
      }
    });
    loadStats();
  }, [user, authLoading]);

  // Reload when filter changes
  useEffect(() => {
    if (isModerator) {
      loadQueue();
    }
  }, [filter]);

  const handleAction = async (reviewId: string, action: string, userId?: string) => {
    const reason = actionReason[reviewId] || '';
    try {
      const res = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action, review_id: reviewId, user_id: userId, reason }),
      });
      if (res.ok) {
        setActionReason(prev => { const n = { ...prev }; delete n[reviewId]; return n; });
        loadQueue();
        loadStats();
      } else {
        const data = await res.json();
        setError(data.error || `Failed to ${action}`);
      }
    } catch {
      setError('Network error');
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm('Ban this user? All their active reviews will be hidden.')) return;
    const reason = prompt('Reason for ban?');
    if (reason === null) return;
    try {
      const res = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'ban', user_id: userId, reason }),
      });
      if (res.ok) {
        loadQueue();
        loadStats();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to ban user');
      }
    } catch {
      setError('Network error');
    }
  };

  if (authLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <button
          onClick={login}
          style={{
            background: 'linear-gradient(135deg, #6e5494 0%, #333 100%)',
            border: '1px solid #6e549466',
            color: '#fff',
            padding: '0.8rem 1.6rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Sign in with GitHub to access moderation
        </button>
      </div>
    );
  }

  if (checkedModerator && !isModerator) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
        You do not have moderator access. Contact an administrator to be designated as a moderator.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>
        Moderation Panel
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Review flagged content, manage user bans, and maintain review quality.
      </p>

      {/* Stats bar */}
      {stats && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Flagged', value: stats.flagged, color: '#ef4444' },
            { label: 'Pending Review', value: stats.pendingReview, color: '#f59e0b' },
            { label: 'Pending Reports', value: stats.pendingReports, color: '#f97316' },
            { label: 'Resolved Today', value: stats.resolvedToday, color: '#22c55e' },
            { label: 'Banned Users', value: stats.bannedUsers, color: '#64748b' },
            { label: 'Moderators', value: stats.moderators, color: '#3b82f6' },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${stat.color}33`,
                borderRadius: '10px',
                padding: '0.75rem 1.25rem',
                textAlign: 'center',
                minWidth: '120px',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['flagged', 'pending', 'hidden'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              background: filter === tab ? '#f59e0b22' : 'transparent',
              border: `1px solid ${filter === tab ? '#f59e0b44' : '#334155'}`,
              color: filter === tab ? '#f59e0b' : '#94a3b8',
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'flagged' ? 'Flagged' : tab === 'pending' ? 'Pending Review' : 'Hidden'}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
      )}

      {/* Review queue */}
      {loading ? (
        <div style={{ color: '#64748b', padding: '2rem', textAlign: 'center' }}>Loading queue...</div>
      ) : reviews.length === 0 ? (
        <div style={{ color: '#475569', padding: '3rem', textAlign: 'center', fontSize: '0.9rem' }}>
          No {filter} reviews. The queue is clear.
        </div>
      ) : (
        <div>
          {reviews.map(review => {
            const badge = repBadge(review.reputation_score);
            return (
              <div
                key={review.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${review.status === 'flagged' ? '#ef444433' : '#f59e0b33'}`,
                  borderRadius: '10px',
                  padding: '1.25rem',
                  marginBottom: '0.75rem',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {review.avatar_url ? (
                      <img src={review.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                        {(review.github_username || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <a
                          href={`https://github.com/${review.github_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}
                        >
                          {review.github_username || 'Unknown'}
                        </a>
                        {badge && (
                          <span style={{ background: badge.bg, color: badge.color, padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                            {badge.label}
                          </span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: '#475569' }}>
                          Rep: {review.reputation_score ?? 0}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.15rem' }}>
                        Account: {review.github_account_age_days ?? '?'}d old
                        {' | '}
                        Repos: {review.github_public_repos ?? '?'}
                        {' | '}
                        Server: {review.server_id}
                        {' | '}
                        {formatDate(review.created_at)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                    {review.report_count_pending != null && review.report_count_pending > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.15rem' }}>
                        {review.report_count_pending} pending report{review.report_count_pending !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Review content */}
                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                  {review.title}
                </div>
                {review.body && (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 0.5rem 0' }}>
                    {review.body}
                  </p>
                )}
                {review.moderation_note && (
                  <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    Mod note: {review.moderation_note}
                  </div>
                )}

                {/* Action row */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={actionReason[review.id] || ''}
                    onChange={e => setActionReason(prev => ({ ...prev, [review.id]: e.target.value }))}
                    style={{
                      flex: 1,
                      minWidth: '150px',
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '6px',
                      padding: '0.3rem 0.6rem',
                      color: '#e2e8f0',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  />
                  {review.status !== 'active' && (
                    <button
                      onClick={() => handleAction(review.id, 'restore')}
                      style={actionBtnStyle('#22c55e')}
                    >
                      Restore
                    </button>
                  )}
                  {review.status !== 'hidden' && (
                    <button
                      onClick={() => handleAction(review.id, 'hide')}
                      style={actionBtnStyle('#f59e0b')}
                    >
                      Hide
                    </button>
                  )}
                  {review.status === 'flagged' && (
                    <button
                      onClick={() => handleAction(review.id, 'dismiss')}
                      style={actionBtnStyle('#3b82f6')}
                    >
                      Dismiss Reports
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(review.id, 'delete')}
                    style={actionBtnStyle('#ef4444')}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleBan(review.user_id)}
                    style={actionBtnStyle('#dc2626')}
                  >
                    Ban User
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    background: `${color}22`,
    border: `1px solid ${color}44`,
    color,
    borderRadius: '6px',
    padding: '0.3rem 0.7rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 600,
  };
}
