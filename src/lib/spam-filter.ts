/**
 * Spam filter for review submissions.
 * Runs heuristics before inserting a review to prevent low-quality or abusive content.
 */
import type { AuthUser } from './auth';

export interface SpamFilterResult {
  allowed: boolean;
  status: 'active' | 'pending' | 'rejected';
  reason?: string;
}

const MAX_REVIEWS_PER_DAY = 3;
const MAX_URLS_IN_BODY = 3;
const MIN_TITLE_LENGTH = 5;
const MIN_BODY_LENGTH = 10;
const NEW_ACCOUNT_THRESHOLD_DAYS = 7;

/** Count URLs in a string (http/https links) */
function countUrls(text: string): number {
  const urlPattern = /https?:\/\/[^\s]+/gi;
  return (text.match(urlPattern) || []).length;
}

/** Check if a string is mostly uppercase (shouting) */
function isMostlyUppercase(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 10) return false;
  const upper = text.replace(/[^A-Z]/g, '').length;
  return upper / letters.length > 0.7;
}

/**
 * Run spam heuristics against a review submission.
 * @param db D1 database
 * @param user Authenticated user from verifyAndUpsertUser
 * @param serverId Target server ID
 * @param title Review title
 * @param body Review body (may be empty)
 */
export async function checkReviewSpam(
  db: D1Database,
  user: AuthUser,
  serverId: string,
  title: string,
  body: string,
): Promise<SpamFilterResult> {
  // 1. Rate limit: max N reviews per user per 24h
  const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const recentCount = await db
    .prepare('SELECT COUNT(*) as cnt FROM user_reviews WHERE user_id = ? AND created_at > ?')
    .bind(user.userId, oneDayAgo)
    .first<{ cnt: number }>();

  if ((recentCount?.cnt ?? 0) >= MAX_REVIEWS_PER_DAY) {
    return { allowed: false, status: 'rejected', reason: `Rate limit: max ${MAX_REVIEWS_PER_DAY} reviews per day` };
  }

  // 2. Duplicate content: same title+body on a different server
  if (title.length > 0) {
    const dup = await db
      .prepare('SELECT id FROM user_reviews WHERE user_id = ? AND title = ? AND body = ? AND server_id != ? LIMIT 1')
      .bind(user.userId, title, body, serverId)
      .first();

    if (dup) {
      return { allowed: false, status: 'rejected', reason: 'Duplicate review content across servers' };
    }
  }

  // 3. Link spam: too many URLs in body
  if (body && countUrls(body) > MAX_URLS_IN_BODY) {
    return { allowed: false, status: 'rejected', reason: `Too many links (max ${MAX_URLS_IN_BODY})` };
  }

  // 4. Minimal content checks
  if (title.length < MIN_TITLE_LENGTH) {
    return { allowed: false, status: 'rejected', reason: `Title too short (min ${MIN_TITLE_LENGTH} chars)` };
  }

  if (body && body.length > 0 && body.length < MIN_BODY_LENGTH) {
    return { allowed: false, status: 'rejected', reason: `Body too short (min ${MIN_BODY_LENGTH} chars if provided)` };
  }

  // 5. All-caps shouting
  if (isMostlyUppercase(title)) {
    return { allowed: false, status: 'rejected', reason: 'Title appears to be all-caps shouting' };
  }

  // 6. New GitHub account: auto-pending for human review
  if (user.accountAgeDays !== null && user.accountAgeDays < NEW_ACCOUNT_THRESHOLD_DAYS) {
    return { allowed: true, status: 'pending', reason: 'New GitHub account — review held for moderation' };
  }

  // 7. Low reputation with no review history: soft pending
  if (user.reputationScore < 5 && (user.publicRepos ?? 0) < 1) {
    return { allowed: true, status: 'pending', reason: 'Low reputation — review held for moderation' };
  }

  return { allowed: true, status: 'active' };
}
