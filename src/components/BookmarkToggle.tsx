import { useState, useEffect } from 'react';
import { useGitHubAuth } from './useGitHubAuth';

interface Props {
  serverId: string;
  initialBookmarked?: boolean;
  compact?: boolean;
}

export default function BookmarkToggle({ serverId, initialBookmarked = false, compact = false }: Props) {
  const { user, login, authHeaders } = useGitHubAuth();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  // Check bookmark status if not provided
  useEffect(() => {
    if (!initialBookmarked && user) {
      fetch(`/api/bookmarks`, {
        headers: authHeaders(),
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.bookmarks) {
            const found = data.bookmarks.some((b: any) => b.server_id === serverId);
            setBookmarked(found);
          }
        })
        .catch(() => {});
    }
  }, [user, serverId, initialBookmarked]);

  const toggle = async () => {
    if (!user) { login(); return; }
    if (loading) return;

    setLoading(true);
    try {
      const method = bookmarked ? 'DELETE' : 'POST';
      const res = await fetch('/api/bookmarks', {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ server_id: serverId }),
      });

      if (res.ok) {
        setBookmarked(!bookmarked);
      }
    } catch {
      // keep current state on error
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        title={bookmarked ? 'Remove from shelf' : 'Add to shelf'}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1.1rem',
          color: bookmarked ? '#ef4444' : '#475569',
          transition: 'color 0.2s',
          padding: '0.2rem',
          lineHeight: 1,
        }}
      >
        {bookmarked ? '♥' : '♡'}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        background: bookmarked
          ? 'linear-gradient(135deg, #ef444422, #ef444411)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${bookmarked ? '#ef444444' : 'rgba(255,255,255,0.1)'}`,
        color: bookmarked ? '#ef4444' : '#94a3b8',
        borderRadius: '8px',
        padding: '0.4rem 0.8rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.85rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.2s',
      }}
    >
      {bookmarked ? '♥' : '♡'}
      {bookmarked ? 'Saved' : 'Save'}
    </button>
  );
}
