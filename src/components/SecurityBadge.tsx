/**
 * SecurityBadge — 3-tier badge display component
 *
 * Badge tiers:
 *   "unverified"         — Grey, no scan run yet
 *   "scanned"            — Green, automated scan passed
 *   "manually_reviewed"  — Purple/indigo, human audit + automated scan passed
 *
 * Shows:
 * - Badge icon + label
 * - Overall scan score (if scanned)
 * - Expandable detail panel with per-layer results
 * - CVE watchlist matches (if any)
 */

import { useState } from 'react';

type BadgeTier = 'unverified' | 'scanned' | 'manually_reviewed';

interface ScanLayer {
  status: 'passed' | 'failed' | 'warning' | 'error' | 'skipped' | null;
  score: number | null;
}

interface ScanData {
  overall_score: number | null;
  badge_tier: BadgeTier;
  last_scan_at: string | null;
  static_analysis: ScanLayer | null;
  socket_dev: ScanLayer & { dependency_health?: string; typosquat_risk?: boolean } | null;
  mcp_scan: ScanLayer | null;
  cve_watchlist: ScanLayer & { match_count?: number } | null;
}

interface SecurityBadgeProps {
  serverId: string;
  scan?: ScanData | null;
  compact?: boolean;
}

const TIER_CONFIG: Record<BadgeTier, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  unverified: {
    label: 'Unverified',
    color: '#94a3b8',
    bgColor: 'rgba(148,163,184,0.1)',
    borderColor: 'rgba(148,163,184,0.3)',
    icon: '⚪',
  },
  scanned: {
    label: 'Scanned',
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
    icon: '🟢',
  },
  manually_reviewed: {
    label: 'Manually Reviewed',
    color: '#818cf8',
    bgColor: 'rgba(129,140,248,0.1)',
    borderColor: 'rgba(129,140,248,0.3)',
    icon: '🛡️',
  },
};

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  passed: { label: 'Passed', color: '#22c55e' },
  failed: { label: 'Failed', color: '#ef4444' },
  warning: { label: 'Warning', color: '#eab308' },
  error: { label: 'Error', color: '#f97316' },
  skipped: { label: 'Skipped', color: '#64748b' },
};

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  if (score === null) return null;
  const barColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
      <span style={{ fontSize: '0.75rem', color: '#94a3b8', width: '120px' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: barColor, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: barColor, fontWeight: 600, width: '35px', textAlign: 'right' }}>{score}</span>
    </div>
  );
}

function LayerStatus({ status, label }: { status: string | null; label: string }) {
  const s = status || 'skipped';
  const display = STATUS_DISPLAY[s] || STATUS_DISPLAY.skipped;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: display.color }} />
      <span style={{ color: '#cbd5e1' }}>{label}</span>
      <span style={{ color: display.color, marginLeft: 'auto', fontWeight: 500 }}>{display.label}</span>
    </div>
  );
}

export default function SecurityBadge({ serverId, scan, compact = false }: SecurityBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const tier = scan?.badge_tier || 'unverified';
  const config = TIER_CONFIG[tier];

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.15rem 0.5rem',
          borderRadius: '9999px',
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          fontSize: '0.7rem',
          fontWeight: 600,
          color: config.color,
          cursor: 'pointer',
          title: tier === 'unverified'
            ? 'No security scan run yet'
            : tier === 'scanned'
              ? `Automated scan: ${scan?.overall_score ?? 'N/A'}/100`
              : 'Manually reviewed + automated scan passed',
        }}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
        {scan?.overall_score !== null && scan?.overall_score !== undefined && tier !== 'unverified' && (
          <span style={{ opacity: 0.7 }}>{scan.overall_score}</span>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Badge header */}
      <div
        onClick={() => tier !== 'unverified' && setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          cursor: tier !== 'unverified' ? 'pointer' : 'default',
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>{config.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: config.color, fontSize: '0.9rem' }}>{config.label}</div>
          {tier === 'unverified' && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
              No automated security scan has been run on this server yet.
            </div>
          )}
          {tier !== 'unverified' && scan?.overall_score !== null && scan?.overall_score !== undefined && (
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
              Security score: {scan.overall_score}/100
              {scan.last_scan_at && ` — scanned ${new Date(scan.last_scan_at).toLocaleDateString()}`}
            </div>
          )}
        </div>
        {tier !== 'unverified' && (
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && scan && (
        <div style={{
          marginTop: '0.5rem',
          padding: '1rem',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Overall score bar */}
          {scan.overall_score !== null && (
            <div style={{ marginBottom: '1rem' }}>
              <ScoreBar score={scan.overall_score} label="Overall" />
            </div>
          )}

          {/* Per-layer results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <LayerStatus status={scan.static_analysis?.status} label="Static Analysis (RCE/Injection)" />
            <LayerStatus status={scan.socket_dev?.status} label="Socket.dev (Dependencies/Typosquat)" />
            <LayerStatus status={scan.mcp_scan?.status} label="mcp-scan (Tool Poisoning)" />
            <LayerStatus status={scan.cve_watchlist?.status} label="CVE Watchlist" />
          </div>

          {/* Per-layer scores */}
          {(scan.static_analysis?.score !== null || scan.socket_dev?.score !== null || scan.mcp_scan?.score !== null) && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>Layer Scores</div>
              {scan.static_analysis && <ScoreBar score={scan.static_analysis.score} label="Static" />}
              {scan.socket_dev && <ScoreBar score={scan.socket_dev.score} label="Socket.dev" />}
              {scan.mcp_scan && <ScoreBar score={scan.mcp_scan.score} label="mcp-scan" />}
            </div>
          )}

          {/* Socket.dev details */}
          {scan.socket_dev && (scan.socket_dev.dependency_health || scan.socket_dev.typosquat_risk) && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {scan.socket_dev.dependency_health && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Dependency health: <span style={{
                    color: scan.socket_dev.dependency_health === 'clean' ? '#22c55e'
                      : scan.socket_dev.dependency_health === 'critical' ? '#ef4444'
                      : '#eab308',
                    fontWeight: 600,
                  }}>
                    {scan.socket_dev.dependency_health}
                  </span>
                </div>
              )}
              {scan.socket_dev.typosquat_risk && (
                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                  ⚠ Typosquat risk detected — this package may be mimicking a popular name
                </div>
              )}
            </div>
          )}

          {/* CVE matches */}
          {scan.cve_watchlist && scan.cve_watchlist.match_count && scan.cve_watchlist.match_count > 0 && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                ⚠ {scan.cve_watchlist.match_count} CVE/watchlist match(es) found
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                This server's package matches known vulnerabilities. Review the security details before installing.
              </div>
            </div>
          )}

          {/* Tier explanation */}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.5 }}>
              {tier === 'scanned' && 'Scanned: Automated security scanning passed (static analysis, dependency health, tool poisoning detection, CVE watchlist). This does not guarantee safety — always review server code before trusting with sensitive data.'}
              {tier === 'manually_reviewed' && 'Manually Reviewed: This server has been audited by the MyMCPShelf security team AND passed automated scanning. The highest confidence tier, but always verify before granting access to sensitive resources.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
