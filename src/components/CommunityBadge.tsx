import { useState, useEffect } from 'react';
import { useGitHubAuth } from './useGitHubAuth';

interface CommunityBadgeProps {
  serverId: string;
  avgRating?: number | null;
  reviewCount?: number;
  bookmarkCount?: number;
}

export function CommunityBadge({ serverId, avgRating, reviewCount, bookmarkCount }: CommunityBadgeProps) {
  const [stats, setStats] = useState<{
    avgRating: number | null;
    reviewCount: number;
    bookmarkCount: number;
  }>({
    avgRating: avgRating ?? null,
    reviewCount: reviewCount ?? 0,
    bookmarkCount: bookmarkCount ?? 0,
  });

  useEffect(() => {
    if (avgRating == null) {
      fetch(`/api/community/${serverId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setStats({
              avgRating: data.avgRating,
              reviewCount: data.reviewCount || 0,
              bookmarkCount: data.bookmarkCount || 0,
            });
          }
        })
        .catch(() => {});
    }
  }, [serverId, avgRating]);

  if (stats.reviewCount === 0 && stats.bookmarkCount === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {stats.reviewCount > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: '#f59e0b22',
            color: '#f59e0b',
            border: '1px solid #f59e0b44',
          }}
          title={`${stats.reviewCount} review${stats.reviewCount !== 1 ? 's' : ''}, avg ${stats.avgRating?.toFixed(1) || '—'}`}
        >
          ★ {stats.avgRating?.toFixed(1) || '—'} ({stats.reviewCount})
        </span>
      )}
      {stats.bookmarkCount > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: '#ef444422',
            color: '#ef4444',
            border: '1px solid #ef444444',
          }}
          title={`${stats.bookmarkCount} user${stats.bookmarkCount !== 1 ? 's' : ''} saved this`}
        >
          ♥ {stats.bookmarkCount}
        </span>
      )}
    </div>
  );
}

/** Compact auth-aware header showing login state */
export function AuthStatus() {
  const { user, loading, login, logout } = useGitHubAuth();

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={login}
        style={{
          background: '#24292e',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '0.35rem 0.75rem',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <svg height="14" viewBox="0 0 16 16" width="14" fill="#fff">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Sign in
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <img src={user.avatar_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
      <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500 }}>{user.login}</span>
      <button
        onClick={logout}
        style={{
          background: 'transparent',
          border: '1px solid #334155',
          color: '#64748b',
          borderRadius: '4px',
          padding: '0.15rem 0.5rem',
          cursor: 'pointer',
          fontSize: '0.7rem',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
