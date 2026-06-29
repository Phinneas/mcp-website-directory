/**
 * scores.ts — trust/security scoring + display helpers.
 *
 * Computes a composite trust score and security tier from the bundled data so
 * the command palette can rank and badge curated servers the way the website
 * does. Honest by design: servers without a manual audit are flagged
 * "Unverified" rather than given a misleading pass.
 */
import type { ShelfServer, SecurityAudit } from './types';

export type SecurityTier = 'secure' | 'moderate' | 'at-risk' | 'unverified';

export interface Scored {
  /** Composite trust score, 0–100. */
  trust: number;
  trustLabel: string;
  security: SecurityTier;
  securityLabel: string;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Security tier from the manual audit score (matches website getScoreTier). */
export function securityTier(audit: SecurityAudit | null | undefined): SecurityTier {
  if (!audit || typeof audit.auditScore !== 'number') return 'unverified';
  if (audit.auditScore >= 80) return 'secure';
  if (audit.auditScore >= 50) return 'moderate';
  return 'at-risk';
}

export function scoreServer(server: ShelfServer): Scored {
  const tier = securityTier(server.securityAudit);

  // Adoption component (0–45): log-scaled stars, since star count spans 0 → 35k.
  const adoption = clamp(Math.log10((server.fields.stars || 0) + 1) * 18, 0, 45);

  // Security component (0–40): only audited servers earn credit here.
  const security =
    tier === 'secure' ? 40 : tier === 'moderate' ? 25 : tier === 'at-risk' ? 5 : 0;

  // Maintenance/official signal proxy (0–15): recognizable official orgs.
  const author = (server.fields.author || '').toLowerCase();
  const official =
    /microsoft|github|google|aws|modelcontextprotocol|anthropic|upstash/.test(author) ? 15 : 0;

  const trust = clamp(Math.round(adoption + security + official));

  return {
    trust,
    trustLabel: trust >= 75 ? 'High trust' : trust >= 50 ? 'Moderate' : 'Emerging',
    security: tier,
    securityLabel:
      tier === 'secure'
        ? 'Secure'
        : tier === 'moderate'
          ? 'Moderate'
          : tier === 'at-risk'
            ? 'At risk'
            : 'Unverified',
  };
}

/** A compact single-line summary for QuickPick `detail`, e.g. "Secure · 1.2k★ · databases". */
export function summaryLine(server: ShelfServer, scored: Scored): string {
  const parts: string[] = [scored.securityLabel];
  parts.push(`${formatStars(server.fields.stars)}★`);
  if (server.fields.language) parts.push(server.fields.language);
  if (server.deployment) parts.push(deploymentLabel(server.deployment));
  return parts.join(' · ');
}

/** Rank servers: trust first, then adoption, so the palette surfaces good picks. */
export function rankByTrust(servers: ShelfServer[]): ShelfServer[] {
  return [...servers]
    .map((s) => ({ s, sc: scoreServer(s) }))
    .sort((a, b) => b.sc.trust - a.sc.trust || b.s.fields.stars - a.s.fields.stars)
    .map((x) => x.s);
}

function deploymentLabel(dep: string): string {
  switch (dep) {
    case 'local_stdio':
      return 'local';
    case 'cloud_native':
      return 'cloud';
    case 'self_hosted':
      return 'self-hosted';
    case 'enterprise_saas':
      return 'enterprise';
    default:
      return dep;
  }
}

function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
