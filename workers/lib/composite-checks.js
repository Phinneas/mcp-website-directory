/**
 * composite-checks.js — pure, node-runnable scoring for the consolidated
 * per-server recheck pipeline.
 *
 * This is the SINGLE source of truth for the four checks the pipeline runs on
 * each server: staleness, green-hosting, security, and tool-description diff
 * (rug-pull / tool-poisoning). Everything here is pure (no I/O) so it can be
 * unit-tested directly; the composite-trust-monitor worker fetches the inputs
 * (GitHub / npm / Greencheck / D1) and feeds them in.
 *
 * It also computes the Composite Trust Score — the single clean number that the
 * four separate pipelines previously could not produce because each wrote its
 * own independent record.
 */

// ── 1. Staleness (maintenance pulse) ────────────────────────────────────────
// Driven by commit recency + 90-day commit volume + archived flag. This is the
// "Staleness Pulse" (task 2) folded into the consolidated run.
//
// metrics: { lastCommitDays:number|null, commits90d:number, archived:boolean, openIssues?:number }

export function scoreStaleness(m) {
  if (m.archived) return { score: 0, tier: 'minimal', reason: 'repository archived', lastCommitDays: m.lastCommitDays, commits90d: m.commits90d };
  if (m.lastCommitDays == null) return { score: 20, tier: 'minimal', reason: 'no commit data', lastCommitDays: null, commits90d: m.commits90d };

  const days = m.lastCommitDays;
  const c = m.commits90d || 0;

  let score, tier, reason;
  if (days <= 30 && c >= 20) { score = 95; tier = 'excellent'; reason = 'actively developed'; }
  else if (days <= 30) { score = 85; tier = 'strong'; reason = 'recent commits'; }
  else if (days <= 90 && c >= 5) { score = 75; tier = 'strong'; reason = 'regular activity'; }
  else if (days <= 90) { score = 65; tier = 'moderate'; reason = 'active but low volume'; }
  else if (days <= 180) { score = 50; tier = 'moderate'; reason = 'slowdown in activity'; }
  else if (days <= 365) { score = 30; tier = 'limited'; reason = 'stale — no recent commits'; }
  else { score = 12; tier = 'minimal'; reason = 'likely abandoned'; }

  return { score, tier, reason, lastCommitDays: days, commits90d: c, openIssues: m.openIssues ?? null };
}

// ── 2. Green hosting ────────────────────────────────────────────────────────
// Ported from green-score-monitor.js (computeGreenScore), with a 0–100 score
// added so it can participate in the composite.
//
// opts: { green: boolean|null, deployment: string, hostingProvider?: string|null }

export function scoreGreen(opts) {
  const { green, deployment } = opts;
  if (deployment === 'local_stdio' || green === null) {
    return {
      score: 75, tier: 'user_dependent',
      label: 'User-Dependent',
      description: 'Local stdio server — carbon footprint depends on your own energy source.',
      hostingProvider: null,
    };
  }
  if (green) {
    return {
      score: 100, tier: 'green_verified',
      label: 'Green Verified',
      description: `Hosted by ${opts.hostingProvider || 'a verified green host'} on confirmed renewable energy.`,
      hostingProvider: opts.hostingProvider || null,
    };
  }
  return {
    score: 40, tier: 'unknown',
    label: 'Not Verified',
    description: 'Green hosting status could not be verified by the Green Web Foundation.',
    hostingProvider: opts.hostingProvider || null,
  };
}

// ── 3. Security ─────────────────────────────────────────────────────────────
// Weighting ported from security-scanner.js (static 0.30 / socket 0.25 /
// mcp-scan 0.25 / cve 0.20). The monitor worker runs the actual scans and
// passes the layer results here.
//
// layers: { static?:{status,score}, socket?:{status,score}, mcpScan?:{status,score}, cve:{status,score,matchCount} }

export function scoreSecurity(layers) {
  const weighted = [];
  if (layers.static && layers.static.score != null) weighted.push({ weight: 0.3, score: layers.static.score });
  if (layers.socket && layers.socket.score != null) weighted.push({ weight: 0.25, score: layers.socket.score });
  if (layers.mcpScan && layers.mcpScan.score != null) weighted.push({ weight: 0.25, score: layers.mcpScan.score });
  weighted.push({ weight: 0.2, score: layers.cve.score });

  const total = weighted.reduce((s, w) => s + w.weight, 0) || 1;
  const score = Math.round(weighted.reduce((s, w) => s + w.score * (w.weight / total), 0));

  const anyFailed = [layers.static?.status, layers.socket?.status, layers.mcpScan?.status, layers.cve.status].includes('failed');
  const status = anyFailed ? 'failed' : score >= 80 ? 'passed' : score >= 50 ? 'warning' : 'failed';
  return { score, tier: status, failed: anyFailed, cveMatches: layers.cve.matchCount };
}

// ── 4. Tool-description diff (rug-pull / tool-poisoning) ─────────────────────
// NEW (task 14). Compares a server's advertised tool set + descriptions against
// the previously stored snapshot. Silent additions of tools that can move
// secrets/data — or rewording of a tool's description to coax an agent into
// exfiltration — is the core "tool poisoning" threat. No prior snapshot means
// this is the trusted baseline.
//
// prev: { toolName: description } | null    curr: { toolName: description }

const POISON_KEYWORDS = [
  'exfiltrat', 'upload', 'send email', 'send to', 'webhook', 'pastebin', 'requestbin',
  'base64', 'atob', 'btoa', 'eval(', 'child_process', 'exec(', 'execsync', 'curl ', 'wget ',
  'ssh', 'aws_secret', 'access_key', 'private_key', '.env', 'token', 'password',
  'discord.com/api/webhook', 'ngrok', 'transfer', 'dump',
];

export function checkToolDiff(prev, curr) {
  const currNames = Object.keys(curr);
  const prevNames = prev ? Object.keys(prev) : [];
  const prevDesc = prev || {};

  const added = currNames.filter((n) => !prevNames.includes(n));
  const removed = prevNames.filter((n) => !currNames.includes(n));
  const modified = currNames.filter((n) => prevNames.includes(n) && prevDesc[n] !== curr[n]);

  // Suspicious = new or changed tools whose description contains a poison keyword.
  const suspicious = [];
  for (const name of [...added, ...modified]) {
    const desc = String(curr[name] || '').toLowerCase();
    if (POISON_KEYWORDS.some((k) => desc.includes(k))) suspicious.push(name);
  }

  const firstRun = !prev;
  let score, tier;

  if (firstRun) { score = 100; tier = 'baseline'; }                 // trusted baseline
  else if (suspicious.length > 0) { score = 15; tier = 'poisoned'; } // active tool-poisoning signal
  else if (added.length > 3 || modified.length > 3) { score = 60; tier = 'watch'; } // churn — human look
  else if (added.length || modified.length || removed.length) { score = 80; tier = 'watch'; } // minor
  else { score = 100; tier = 'clean'; }                             // unchanged

  return { score, tier, added, removed, modified, suspicious, snapshot: curr };
}

// ── Composite Trust Score ────────────────────────────────────────────────────
// The payoff of consolidation: one number from one clean data source.
//
// Weights: security 0.35, staleness 0.25, tool-diff 0.20, green 0.20.
// A hard-fail in security or tool-poisoning caps the composite at 'review'
// regardless of the other dimensions — a poisoned tool or critical CVE must not
// be hidden behind good maintenance.
//
// input: { staleness, green, security, toolDiff } — each a subscore { score, tier, ... }

const WEIGHTS = { security: 0.35, staleness: 0.25, toolDiff: 0.2, green: 0.2 };

export function computeCompositeTrust(input) {
  const subscores = {
    staleness: input.staleness.score,
    green: input.green.score,
    security: input.security.score,
    toolDiff: input.toolDiff.score,
  };

  const raw =
    subscores.security * WEIGHTS.security +
    subscores.staleness * WEIGHTS.staleness +
    subscores.toolDiff * WEIGHTS.toolDiff +
    subscores.green * WEIGHTS.green;

  const flags = [];
  let score = Math.round(raw);

  if (input.security.failed || subscores.security < 50) {
    flags.push('security-failed');
    score = Math.min(score, 49);
  }
  if (input.toolDiff.tier === 'poisoned') {
    flags.push('tool-poisoning-detected');
    score = Math.min(score, 39);
  }
  if (input.staleness.tier === 'minimal' && subscores.staleness < 20) {
    flags.push('likely-abandoned');
  }

  let tier, label;
  if (score >= 80) { tier = 'trusted'; label = 'Trusted'; }
  else if (score >= 60) { tier = 'verified'; label = 'Verified'; }
  else if (score >= 40) { tier = 'review'; label = 'Needs Review'; }
  else { tier = 'caution'; label = 'Caution'; }

  return { score, tier, label, weights: { ...WEIGHTS }, subscores, flags };
}

// ── Helper: tier → display for the front-end ─────────────────────────────────

export const COMPOSITE_TIER_META = {
  trusted: { label: 'Trusted', color: '#16a34a', emoji: '🟢' },
  verified: { label: 'Verified', color: '#2563eb', emoji: '🔵' },
  review: { label: 'Needs Review', color: '#d97706', emoji: '🟠' },
  caution: { label: 'Caution', color: '#dc2626', emoji: '🔴' },
};
