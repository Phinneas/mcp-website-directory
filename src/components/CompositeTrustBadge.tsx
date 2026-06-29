// CompositeTrustBadge — the headline trust signal for an MCP server.
//
// Shows the Composite Trust tier + score produced by the consolidated
// composite-trust-monitor (workers/composite-trust-monitor.js →
// composite_trust_json). One number from one clean data source, replacing the
// need to read four separate badges in your head.
//
// Tiers (see workers/lib/composite-checks.js): trusted · verified · review · caution.

import type { CompositeTrustData } from '../utils/d1';

interface CompositeTrustBadgeProps {
  compositeTrust?: CompositeTrustData | null;
  compact?: boolean;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  trusted: { bg: 'rgba(22, 163, 74, 0.12)', text: '#16a34a', border: 'rgba(22, 163, 74, 0.35)' },
  verified: { bg: 'rgba(37, 99, 235, 0.12)', text: '#2563eb', border: 'rgba(37, 99, 235, 0.35)' },
  review: { bg: 'rgba(217, 119, 6, 0.12)', text: '#d97706', border: 'rgba(217, 119, 6, 0.35)' },
  caution: { bg: 'rgba(220, 38, 38, 0.12)', text: '#dc2626', border: 'rgba(220, 38, 38, 0.4)' },
};

const TIER_EMOJI: Record<string, string> = {
  trusted: '🟢',
  verified: '🔵',
  review: '🟠',
  caution: '🔴',
};

function buildTooltip(ct: CompositeTrustData): string {
  const s = ct.subscores;
  const lines = [
    `${ct.label} — ${ct.score}/100`,
    `  staleness  ${s.staleness.score}/100 (${s.staleness.tier})`,
    `  green      ${s.green.score}/100 (${s.green.tier})`,
    `  security   ${s.security.score}/100 (${s.security.tier}${s.security.cveMatches ? `, ${s.security.cveMatches} CVE match${s.security.cveMatches === 1 ? '' : 'es'}` : ''})`,
    `  tool-diff  ${s.toolDiff.score}/100 (${s.toolDiff.tier})`,
  ];
  if (ct.flags?.length) lines.push(`  ⚠ ${ct.flags.join(', ')}`);
  return lines.join('\n');
}

export function CompositeTrustBadge({ compositeTrust, compact = false }: CompositeTrustBadgeProps) {
  if (!compositeTrust || typeof compositeTrust.score !== 'number') return null;

  const tier = compositeTrust.tier || 'review';
  const style = TIER_STYLES[tier] || TIER_STYLES.review;
  const emoji = TIER_EMOJI[tier] || '🟠';
  const hasFlags = !!compositeTrust.flags?.length;
  const title = buildTooltip(compositeTrust);

  if (compact) {
    return (
      <span
        className="composite-trust-badge-compact"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.2rem 0.55rem',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: 700,
          backgroundColor: style.bg,
          color: style.text,
          border: `1px solid ${style.border}`,
          whiteSpace: 'nowrap',
        }}
        title={title}
      >
        <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>{emoji}</span>
        {compositeTrust.score}
        {hasFlags && <span style={{ opacity: 0.9 }}>⚠</span>}
      </span>
    );
  }

  return (
    <div
      className="composite-trust-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: 700,
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
      title={title}
    >
      <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>{emoji}</span>
      <span>{compositeTrust.label}</span>
      <span style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 700 }}>{compositeTrust.score}/100</span>
      {hasFlags && <span style={{ fontSize: '0.7rem' }}>⚠</span>}
    </div>
  );
}

export default CompositeTrustBadge;
