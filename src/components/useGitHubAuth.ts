import { useState, useEffect, useCallback } from 'react';

const GITHUB_CLIENT_ID = 'Ov23liJvX3zJAqXwCIWR'; // MCP Directory GitHub App
const AUTH_STORAGE_KEY = 'mcp_dir_auth';
const SCOPES = 'read:user,user:email';

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  token: string;
}

interface AuthState {
  user: GitHubUser | null;
  loading: boolean;
}

export function useGitHubAuth() {
  const [auth, setAuth] = useState<AuthState>({ user: null, loading: true });

  // Check stored auth on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as GitHubUser;
        // Validate token with GitHub API
        fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${parsed.token}`,
            'User-Agent': 'MCP-Directory',
            'Accept': 'application/vnd.github.v3+json',
          },
        })
          .then(res => {
            if (res.ok) {
              setAuth({ user: parsed, loading: false });
            } else {
              localStorage.removeItem(AUTH_STORAGE_KEY);
              setAuth({ user: null, loading: false });
            }
          })
          .catch(() => {
            setAuth({ user: parsed, loading: false });
          });
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuth({ user: null, loading: false });
      }
    } else {
      setAuth({ user: null, loading: false });
    }
  }, []);

  // Check URL for OAuth callback code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && !auth.user) {
      // Exchange code for token via our server endpoint
      fetch(`/api/auth/callback?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.token && data.user) {
            const user: GitHubUser = { ...data.user, token: data.token };
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
            setAuth({ user, loading: false });
            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('code');
            url.searchParams.delete('state');
            window.history.replaceState({}, '', url.toString());
          }
        })
        .catch(() => {
          setAuth({ user: null, loading: false });
        });
    }
  }, [auth.user]);

  const login = useCallback(() => {
    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem('oauth_state', state);
    const redirectUri = `${window.location.origin}/api/auth/callback`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${SCOPES}&state=${state}`;
    window.location.href = authUrl;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth({ user: null, loading: false });
  }, []);

  const authHeaders = useCallback(() => {
    if (!auth.user?.token) return {};
    return { 'Authorization': `Bearer ${auth.user.token}` };
  }, [auth.user]);

  const userId = auth.user ? `gh_${auth.user.id}` : null;

  return { user: auth.user, userId, loading: auth.loading, login, logout, authHeaders };
}
