import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useGitHubAuth } from './useGitHubAuth';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  usage_context: string | null;
  deployment_type: string | null;
  verified_usage: number;
  helpful_count: number;
  report_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  display_name?: string;
  github_username?: string;
  avatar_url?: string;
  reputation_score?: number;
  github_account_age_days?: number;
  github_public_repos?: number;
  userVote: 'up' | 'down' | null;
}

interface CommunityStats {
  reviewCount: number;
  avgRating: number | null;
  ratingDistribution: Record<number, number> | null;
  bookmarkCount: number;
  usageContexts: Record<string, number> | null;
}

interface Props {
  serverId: string;
  initialStats?: CommunityStats | null;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'abusive', label: 'Abusive / Harassment' },
  { value: 'irrelevant', label: 'Irrelevant' },
  { value: 'misleading', label: 'Misleading' },
  { value: 'other', label: 'Other' },
];

function StarRating({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            fontSize: interactive ? '1.5rem' : '1rem',
            color: i <= (hover || rating) ? '#f59e0b' : '#334155',
            transition: 'color 0.15s',
          }}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(i)}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function contextLabel(ctx: string | null): string {
  const labels: Record<string, string> = {
    production: '🏭 Production',
    staging: '🧪 Staging',
    development: '💻 Development',
    evaluation: '🔍 Evaluation',
  };
  return ctx ? labels[ctx] || ctx : '';
}

function repBadge(score?: number): { label: string; color: string; bg: string } | null {
  if (score == null) return null;
  if (score >= 50) return { label: 'Trusted Reviewer', color: '#22c55e', bg: '#22c55e22' };
  if (score >= 20) return { label: 'Established', color: '#3b82f6', bg: '#3b82f622' };
  if (score >= 5) return { label: 'Active', color: '#f59e0b', bg: '#f59e0b22' };
  if (score < 5 && score >= 0) return { label: 'New', color: '#64748b', bg: '#64748b22' };
  return null;
}

export default function ReviewSection({ serverId, initialStats }: Props) {
  const { user, userId, loading: authLoading, login, authHeaders } = useGitHubAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(initialStats || null);
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formContext, setFormContext] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Load reviews
  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?server_id=${serverId}${userId ? `&user_id=${userId}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {}
  }, [serverId, userId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Load stats if not provided
  useEffect(() => {
    if (!stats) {
      fetch(`/api/community/${serverId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => data && setStats(data))
        .catch(() => {});
    }
  }, [serverId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formRating === 0) { setError('Please select a rating'); return; }
    if (!formTitle.trim()) { setError('Please enter a title'); return; }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          server_id: serverId,
          rating: formRating,
          title: formTitle.trim(),
          body: formBody.trim(),
          usage_context: formContext || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowForm(false);
        setFormRating(0);
        setFormTitle('');
        setFormBody('');
        setFormContext('');
        if (data.status === 'pending') {
          setSuccessMsg('Your review has been submitted and is held for moderation. It will be visible once approved by a moderator.');
        } else {
          setSuccessMsg('Review submitted successfully!');
        }
        loadReviews();
        // Refresh stats
        const statsRes = await fetch(`/api/community/${serverId}`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit review');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (reviewId: string, direction: 'up' | 'down') => {
    if (!userId) { login(); return; }
    try {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ review_id: reviewId, direction }),
      });
      loadReviews();
    } catch {}
  };

  const handleReport = async (reviewId: string) => {
    if (!userId) { login(); return; }
    if (!reportReason) { setError('Please select a reason'); return; }

    setReportSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          review_id: reviewId,
          reason: reportReason,
          detail: reportDetail.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReportingReviewId(null);
        setReportReason('');
        setReportDetail('');
        if (data.auto_flagged) {
          setSuccessMsg('Report submitted. The review has been automatically flagged for moderator review.');
        } else {
          setSuccessMsg('Report submitted. Thank you for helping maintain review quality.');
        }
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit report');
      }
    } catch {
      setError('Network error');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Summary section
  const avgDisplay = stats?.avgRating ? stats.avgRating.toFixed(1) : '—';
  const dist = stats?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalReviews = stats?.reviewCount || 0;

  return (
    <div className="review-section">
      {/* Success message */}
      {successMsg && (
        <div style={{
          background: '#22c55e11',
          border: '1px solid #22c55e33',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: '#22c55e',
          fontSize: '0.85rem',
        }}>
          {successMsg}
        </div>
      )}

      {/* Community Summary */}
      <div className="community-summary" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
        <div className="rating-overview" style={{ textAlign: 'center', minWidth: '100px' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f59e0b', lineHeight: 1 }}>{avgDisplay}</div>
          <StarRating rating={stats?.avgRating ? Math.round(stats.avgRating) : 0} />
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</div>
        </div>
        <div className="rating-bars" style={{ flex: 1 }}>
          {[5, 4, 3, 2, 1].map(star => {
            const count = dist[star] || 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', width: '12px' }}>{star}</span>
                <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>★</span>
                <div style={{ flex: 1, height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', width: '20px', textAlign: 'right' }}>{count}</span>
              </div>
            );
          })}
        </div>
        {stats?.usageContexts && Object.keys(stats.usageContexts).length > 0 && (
          <div className="usage-contexts" style={{ minWidth: '120px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>USAGE CONTEXTS</div>
            {Object.entries(stats.usageContexts).map(([ctx, cnt]) => (
              <div key={ctx} style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                {contextLabel(ctx)} <span style={{ color: '#64748b' }}>({cnt})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write Review CTA */}
      {!showForm && (
        <div style={{ marginBottom: '1.5rem' }}>
          {user ? (
            <button
              onClick={() => { setShowForm(true); setSuccessMsg(''); setError(''); }}
              style={{
                background: 'linear-gradient(135deg, #f59e0b22, #f59e0b11)',
                border: '1px solid #f59e0b44',
                color: '#f59e0b',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              ✍️ Write a Review
            </button>
          ) : (
            <button
              onClick={login}
              style={{
                background: 'linear-gradient(135deg, #6e5494 0%, #333 100%)',
                border: '1px solid #6e549466',
                color: '#fff',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg height="18" viewBox="0 0 16 16" width="18" fill="#fff">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Sign in with GitHub to review
            </button>
          )}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Your Rating
            </label>
            <StarRating rating={formRating} interactive onChange={setFormRating} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Review title (required)"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              maxLength={120}
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '0.6rem 0.8rem',
                color: '#e2e8f0',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <textarea
              placeholder="Share your experience (optional, max 2000 chars)"
              value={formBody}
              onChange={e => setFormBody(e.target.value)}
              maxLength={2000}
              rows={4}
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '0.6rem 0.8rem',
                color: '#e2e8f0',
                fontSize: '0.9rem',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Usage Context (optional)
            </label>
            <select
              value={formContext}
              onChange={e => setFormContext(e.target.value)}
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '0.5rem 0.8rem',
                color: '#e2e8f0',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            >
              <option value="">Select context...</option>
              <option value="production">🏭 Production</option>
              <option value="staging">🧪 Staging</option>
              <option value="development">💻 Development</option>
              <option value="evaluation">🔍 Evaluation</option>
            </select>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: '#f59e0b',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.2rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); }}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#94a3b8',
                borderRadius: '8px',
                padding: '0.5rem 1.2rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Review List */}
      <div className="review-list">
        {reviews.length === 0 && !showForm && (
          <p style={{ color: '#475569', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
            No reviews yet. Be the first to share your experience.
          </p>
        )}
        {reviews.map(review => {
          const badge = repBadge(review.reputation_score);
          const isPending = review.status === 'pending';
          const isOwnReview = userId && review.user_id === userId;
          return (
            <div
              key={review.id}
              style={{
                background: isPending ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.03)',
                border: isPending ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                marginBottom: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {review.avatar_url ? (
                    <img src={review.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                      {(review.github_username || review.display_name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {review.github_username ? (
                    <a
                      href={`https://github.com/${review.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}
                    >
                      {review.github_username}
                    </a>
                  ) : (
                    <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem' }}>
                      {review.display_name || 'Anonymous'}
                    </span>
                  )}
                  {review.verified_usage === 1 && (
                    <span style={{ background: '#22c55e22', color: '#22c55e', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                      ✓ Verified Usage
                    </span>
                  )}
                  {badge && (
                    <span style={{ background: badge.bg, color: badge.color, padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>{formatDate(review.created_at)}</span>
              </div>

              {/* Pending moderation banner for user's own pending reviews */}
              {isPending && isOwnReview && (
                <div style={{
                  background: '#f59e0b11',
                  border: '1px solid #f59e0b33',
                  borderRadius: '6px',
                  padding: '0.4rem 0.6rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#f59e0b',
                }}>
                  ⏳ Pending moderation — your review is awaiting approval from a moderator before it becomes publicly visible.
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <StarRating rating={review.rating} />
                <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' }}>{review.title}</span>
              </div>
              {review.body && (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 0.5rem 0' }}>
                  {review.body}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {review.usage_context && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{contextLabel(review.usage_context)}</span>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => handleVote(review.id, 'up')}
                    style={{
                      background: review.userVote === 'up' ? '#22c55e22' : 'transparent',
                      border: `1px solid ${review.userVote === 'up' ? '#22c55e44' : '#334155'}`,
                      color: review.userVote === 'up' ? '#22c55e' : '#64748b',
                      borderRadius: '6px',
                      padding: '0.15rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    ▲ Helpful ({review.helpful_count})
                  </button>

                  {/* Report button — only for reviews by other users */}
                  {userId && review.user_id !== userId && (
                    <button
                      onClick={() => { setReportingReviewId(review.id); setError(''); }}
                      style={{
                        background: 'transparent',
                        border: '1px solid #334155',
                        color: '#64748b',
                        borderRadius: '6px',
                        padding: '0.15rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                      }}
                    >
                      ⚑ Report
                    </button>
                  )}
                </div>
              </div>

              {/* Report form (inline) */}
              {reportingReviewId === review.id && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#0f172a',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Report this review:</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {REPORT_REASONS.map(r => (
                      <button
                        key={r.value}
                        onClick={() => setReportReason(r.value)}
                        style={{
                          background: reportReason === r.value ? '#ef444422' : 'transparent',
                          border: `1px solid ${reportReason === r.value ? '#ef444444' : '#334155'}`,
                          color: reportReason === r.value ? '#ef4444' : '#94a3b8',
                          borderRadius: '6px',
                          padding: '0.2rem 0.6rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Additional detail (optional, max 500 chars)"
                    value={reportDetail}
                    onChange={e => setReportDetail(e.target.value)}
                    maxLength={500}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      padding: '0.4rem 0.6rem',
                      color: '#e2e8f0',
                      fontSize: '0.8rem',
                      outline: 'none',
                      marginBottom: '0.5rem',
                    }}
                  />
                  {error && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{error}</div>}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleReport(review.id)}
                      disabled={reportSubmitting || !reportReason}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.3rem 0.8rem',
                        cursor: (reportSubmitting || !reportReason) ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        opacity: (reportSubmitting || !reportReason) ? 0.5 : 1,
                      }}
                    >
                      {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                    <button
                      onClick={() => { setReportingReviewId(null); setReportReason(''); setReportDetail(''); setError(''); }}
                      style={{
                        background: 'transparent',
                        border: '1px solid #334155',
                        color: '#94a3b8',
                        borderRadius: '6px',
                        padding: '0.3rem 0.8rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
