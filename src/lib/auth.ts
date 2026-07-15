/**
 * Shared GitHub OAuth authentication utility.
 * Used by reviews, votes, bookmarks, reports, and moderation APIs.
 */
export interface AuthUser {
  userId: string;           // gh_{github_id}
  githubId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputationScore: number;
  isModerator: boolean;
  isBanned: boolean;
  accountAgeDays: number | null;
  publicRepos: number | null;
  followers: number | null;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  public_repos: number;
  followers: number;
  created_at: string;
}

/** Verify a GitHub OAuth token and upsert the user into the DB. Returns null if invalid or banned. */
export async function verifyAndUpsertUser(
  token: string,
  db: D1Database,
  moderatorGithubIds?: string[],
): Promise<AuthUser | null> {
  // 1. Validate token with GitHub API
  let ghUser: GitHubUserResponse;
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'MCP-Directory-Auth',
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) return null;
    ghUser = await res.json() as GitHubUserResponse;
  } catch {
    return null;
  }

  const userId = `gh_${ghUser.id}`;
  const now = new Date().toISOString();

  // 2. Compute GitHub-derived reputation signals
  const accountAgeDays = ghUser.created_at
    ? Math.floor((Date.now() - new Date(ghUser.created_at).getTime()) / 86_400_000)
    : null;

  // Reputation score: weighted blend of account age, public repos, followers, and review history
  // Max theoretical: ~100 (100 days * 0.1 = 10, 50 repos * 0.3 = 15, 1000 followers * 0.01 = 10, 50 reviews * 1 = 50, moderator + 15)
  const existing = await db
    .prepare('SELECT review_count, is_moderator, is_banned FROM users WHERE id = ?')
    .bind(userId)
    .first<{ review_count: number; is_moderator: number; is_banned: number }>();

  const reviewCount = existing?.review_count ?? 0;
  const reputationScore = Math.round(
    Math.min(10, (accountAgeDays ?? 0) * 0.01) +       // account age: max 10
    Math.min(15, (ghUser.public_repos ?? 0) * 0.3) +    // public repos: max 15
    Math.min(10, (ghUser.followers ?? 0) * 0.01) +      // followers: max 10
    Math.min(50, reviewCount * 1) +                      // review history: max 50
    (existing?.is_moderator ? 15 : 0),                   // moderator bonus
  );

  // 3. Check moderator status from env-configured list
  const isModerator = moderatorGithubIds?.includes(userId) ?? (existing?.is_moderator === 1);

  // 4. Upsert user profile
  await db
    .prepare(`INSERT INTO users (id, github_id, github_username, display_name, avatar_url, email,
              reputation_score, github_account_age_days, github_public_repos, github_followers,
              is_moderator, is_banned, review_count, first_seen, last_seen, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                github_username = excluded.github_username,
                display_name = excluded.display_name,
                avatar_url = excluded.avatar_url,
                email = excluded.email,
                reputation_score = excluded.reputation_score,
                github_account_age_days = excluded.github_account_age_days,
                github_public_repos = excluded.github_public_repos,
                github_followers = excluded.github_followers,
                is_moderator = excluded.is_moderator,
                last_seen = excluded.last_seen,
                updated_at = excluded.updated_at`)
    .bind(
      userId,
      ghUser.id,
      ghUser.login,
      ghUser.name,
      ghUser.avatar_url,
      ghUser.email ?? null,
      reputationScore,
      accountAgeDays,
      ghUser.public_repos,
      ghUser.followers,
      isModerator ? 1 : 0,
      existing?.is_banned ?? 0,
      reviewCount,
      existing ? (await db.prepare('SELECT first_seen FROM users WHERE id = ?').bind(userId).first<{ first_seen: string }>())?.first_seen ?? now : now,
      now,
      now,
    )
    .run();

  // 5. Check ban status
  const banCheck = await db
    .prepare('SELECT is_banned FROM users WHERE id = ?')
    .bind(userId)
    .first<{ is_banned: number }>();

  if (banCheck?.is_banned === 1) {
    return null;
  }

  return {
    userId,
    githubId: ghUser.id,
    username: ghUser.login,
    displayName: ghUser.name,
    avatarUrl: ghUser.avatar_url,
    reputationScore,
    isModerator,
    isBanned: false,
    accountAgeDays,
    publicRepos: ghUser.public_repos,
    followers: ghUser.followers,
  };
}

/** Extract Bearer token from Authorization header. Returns null if missing or malformed. */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/** Standard 401 JSON response for unauthenticated requests. */
export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'Authentication required' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Standard 403 JSON response for non-moderator access attempts. */
export function forbiddenResponse(): Response {
  return new Response(JSON.stringify({ error: 'Moderator access required' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Standard 503 JSON response when DB is unavailable. */
export function dbUnavailableResponse(): Response {
  return new Response(JSON.stringify({ error: 'Database unavailable' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}
