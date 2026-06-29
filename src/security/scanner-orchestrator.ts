/**
 * Security Scanner Orchestrator
 *
 * Coordinates the four scanning layers and computes the final badge tier:
 *
 *   Layer 1: Static Analysis  — RCE/command-injection pattern detection
 *   Layer 2: Socket.dev       — Dependency health + typosquat detection
 *   Layer 3: mcp-scan         — Tool poisoning / rug pull / description injection
 *   Layer 4: CVE Watchlist    — Cross-reference against known vulnerabilities
 *
 * Badge tiers:
 *   "unverified"         — No scan has been run yet
 *   "scanned"            — All automated scans passed (score >= 60, no critical findings)
 *   "manually_reviewed"  — Human audit exists in securityAudit.ts (tasks 3/6 data)
 *
 * The badge tier is the single summary that users see at a glance.
 * Detailed findings are available on the server detail page.
 */

import { analyzeSource, type StaticAnalysisResult } from './static-analyzer';
import { scanWithSocketDev, type SocketDevResult } from './socket-dev-scanner';
import { parseMcpScanJson, analyzeToolDescriptions, type McpScanResult } from './mcp-scan-integration';
import { matchWatchlist, getHighestSeverity, type WatchlistEntry } from '../data/cveWatchlist';
import { getSecurityAudit } from '../data/securityAudit';

export type BadgeTier = 'unverified' | 'scanned' | 'manually_reviewed';

export interface ScanSummary {
  overall_score: number;       // 0-100, weighted average across all layers
  badge_tier: BadgeTier;
  static_analysis: StaticAnalysisResult | null;
  socket_dev: SocketDevResult | null;
  mcp_scan: McpScanResult | null;
  cve_watchlist: {
    status: 'passed' | 'failed' | 'warning';
    matches: WatchlistEntry[];
    highest_severity: 'critical' | 'high' | 'medium' | 'low' | null;
  } | null;
  scanned_at: string;
}

// ── Scoring weights ────────────────────────────────────────────────────

const LAYER_WEIGHTS = {
  static_analysis: 0.30,
  socket_dev: 0.25,
  mcp_scan: 0.25,
  cve_watchlist: 0.20,
};

/**
 * Run a full security scan on a server.
 *
 * This is the main entry point for the scanning worker.
 */
export async function runFullScan(params: {
  serverId: string;
  serverName: string;
  serverDescription: string;
  npmPackage: string | null;
  githubUrl: string | null;
  sourceFiles?: Array<{ path: string; content: string }>;
  toolDescriptions?: Array<{ name: string; description: string }>;
  mcpScanJsonOutput?: string;
  socketApiKey?: string;
}): Promise<ScanSummary> {
  const { serverId, npmPackage, githubUrl } = params;
  const scannedAt = new Date().toISOString();

  // ── Layer 1: Static Analysis ───────────────────────────────────
  let staticResult: StaticAnalysisResult | null = null;
  if (params.sourceFiles && params.sourceFiles.length > 0) {
    staticResult = analyzeSource(serverId, params.sourceFiles);
  }

  // ── Layer 2: Socket.dev ────────────────────────────────────────
  let socketResult: SocketDevResult | null = null;
  try {
    socketResult = await scanWithSocketDev(serverId, npmPackage, params.socketApiKey);
  } catch (err) {
    console.warn(`Socket.dev scan failed for ${serverId}:`, err);
  }

  // ── Layer 3: mcp-scan ──────────────────────────────────────────
  let mcpScanResult: McpScanResult | null = null;
  if (params.mcpScanJsonOutput) {
    mcpScanResult = parseMcpScanJson(params.mcpScanJsonOutput, serverId);
  } else if (params.toolDescriptions && params.toolDescriptions.length > 0) {
    mcpScanResult = analyzeToolDescriptions(serverId, params.toolDescriptions);
  }

  // ── Layer 4: CVE Watchlist ─────────────────────────────────────
  let cveResult: ScanSummary['cve_watchlist'] = null;
  const watchlistMatches = matchWatchlist(npmPackage, githubUrl, serverId);
  if (watchlistMatches.length > 0) {
    const highest = getHighestSeverity(watchlistMatches);
    cveResult = {
      status: highest === 'critical' ? 'failed' : highest === 'high' ? 'warning' : 'passed',
      matches: watchlistMatches,
      highest_severity: highest,
    };
  } else {
    cveResult = {
      status: 'passed',
      matches: [],
      highest_severity: null,
    };
  }

  // ── Compute overall score ──────────────────────────────────────
  const scores: { weight: number; score: number }[] = [];

  if (staticResult) {
    scores.push({ weight: LAYER_WEIGHTS.static_analysis, score: staticResult.score });
  }
  if (socketResult) {
    scores.push({ weight: LAYER_WEIGHTS.socket_dev, score: socketResult.score });
  }
  if (mcpScanResult) {
    scores.push({ weight: LAYER_WEIGHTS.mcp_scan, score: mcpScanResult.score });
  }
  if (cveResult) {
    // CVE watchlist score: 100 if passed, 0 if critical match, 40 if high, 70 if medium
    const cveScore = cveResult.status === 'passed' ? 100
      : cveResult.highest_severity === 'critical' ? 0
      : cveResult.highest_severity === 'high' ? 40
      : 70;
    scores.push({ weight: LAYER_WEIGHTS.cve_watchlist, score: cveScore });
  }

  // Normalize weights for available layers
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const overallScore = totalWeight > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.score * (s.weight / totalWeight), 0))
    : 0;

  // ── Compute badge tier ──────────────────────────────────────────
  const badgeTier = computeBadgeTier(
    overallScore,
    staticResult,
    socketResult,
    mcpScanResult,
    cveResult,
    serverId
  );

  return {
    overall_score: overallScore,
    badge_tier: badgeTier,
    static_analysis: staticResult,
    socket_dev: socketResult,
    mcp_scan: mcpScanResult,
    cve_watchlist: cveResult,
    scanned_at: scannedAt,
  };
}

/**
 * Compute badge tier from scan results.
 */
function computeBadgeTier(
  overallScore: number,
  staticResult: StaticAnalysisResult | null,
  socketResult: SocketDevResult | null,
  mcpScanResult: McpScanResult | null,
  cveResult: ScanSummary['cve_watchlist'],
  serverId: string
): BadgeTier {
  // If a human audit exists (from securityAudit.ts), the server is "manually reviewed"
  // This takes precedence over "scanned" because human review > automated scan
  const humanAudit = getSecurityAudit(serverId);
  if (humanAudit) {
    // But only if the human audit score is >= 50 AND no scan found critical issues
    const hasCriticalFinding =
      staticResult?.status === 'failed' ||
      socketResult?.status === 'failed' ||
      mcpScanResult?.status === 'failed' ||
      cveResult?.status === 'failed';

    if (!hasCriticalFinding) {
      return 'manually_reviewed';
    }
    // If scan found critical issues after human review, downgrade to "scanned"
    // (the human review is now stale/overridden by automated findings)
  }

  // "scanned" tier requires:
  // - Overall score >= 60
  // - No layer returned "failed"
  // - At least one layer was actually run (not all null/skipped)
  const anyLayerRan =
    (staticResult && staticResult.status !== 'skipped') ||
    (socketResult && socketResult.status !== 'skipped') ||
    (mcpScanResult && mcpScanResult.status !== 'skipped');

  const anyLayerFailed =
    staticResult?.status === 'failed' ||
    socketResult?.status === 'failed' ||
    mcpScanResult?.status === 'failed' ||
    cveResult?.status === 'failed';

  if (anyLayerRan && overallScore >= 60 && !anyLayerFailed) {
    return 'scanned';
  }

  // If a scan ran but failed or scored < 60, it's still "scanned" tier
  // (the badge just shows the score/warnings). Only truly un-scanned servers
  // get "unverified".
  if (anyLayerRan) {
    return 'scanned';
  }

  return 'unverified';
}

/**
 * Lightweight check: can this server be promoted to "scanned" tier
 * given its current scan results?
 */
export function canPromoteToScanned(summary: ScanSummary): boolean {
  return summary.badge_tier === 'scanned' || summary.badge_tier === 'manually_reviewed';
}

/**
 * Format scan summary for D1 storage.
 */
export function serializeScanSummary(summary: ScanSummary): string {
  return JSON.stringify({
    overall_score: summary.overall_score,
    static_analysis: summary.static_analysis ? {
      status: summary.static_analysis.status,
      score: summary.static_analysis.score,
      findings_count: summary.static_analysis.findings.length,
      findings: summary.static_analysis.findings.slice(0, 10), // cap at 10 for storage
    } : null,
    socket_dev: summary.socket_dev ? {
      status: summary.socket_dev.status,
      score: summary.socket_dev.score,
      dependency_health: summary.socket_dev.dependency_health,
      typosquat_risk: summary.socket_dev.typosquat_risk,
      malicious: summary.socket_dev.malicious,
    } : null,
    mcp_scan: summary.mcp_scan ? {
      status: summary.mcp_scan.status,
      score: summary.mcp_scan.score,
      tool_poisoning_detected: summary.mcp_scan.tool_poisoning_detected,
      rug_pull_detected: summary.mcp_scan.rug_pull_detected,
      cross_origin_escalation: summary.mcp_scan.cross_origin_escalation,
      issues_count: summary.mcp_scan.issues.length,
    } : null,
    cve_watchlist: summary.cve_watchlist ? {
      status: summary.cve_watchlist.status,
      match_count: summary.cve_watchlist.matches.length,
      highest_severity: summary.cve_watchlist.highest_severity,
      cve_ids: summary.cve_watchlist.matches.map(m => m.cve_id).filter(Boolean),
    } : null,
    badge_tier: summary.badge_tier,
    scanned_at: summary.scanned_at,
  });
}

/**
 * Badge tier display configuration.
 */
export const BADGE_TIER_CONFIG: Record<BadgeTier, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}> = {
  unverified: {
    label: 'Unverified',
    color: '#94a3b8',
    bgColor: 'rgba(148,163,184,0.1)',
    borderColor: 'rgba(148,163,184,0.3)',
    icon: '⚪',
    description: 'No automated security scan has been run on this server yet.',
  },
  scanned: {
    label: 'Scanned',
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
    icon: '🟢',
    description: 'This server has passed automated security scanning (static analysis, dependency check, tool poisoning detection, CVE watchlist).',
  },
  manually_reviewed: {
    label: 'Manually Reviewed',
    color: '#818cf8',
    bgColor: 'rgba(129,140,248,0.1)',
    borderColor: 'rgba(129,140,248,0.3)',
    icon: '🛡️',
    description: 'This server has been manually audited by the MyMCPShelf security team AND passed automated scanning.',
  },
};
