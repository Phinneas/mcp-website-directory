/**
 * Skill Security Scanner
 *
 * Deterministic static analysis for AI agent skills (SKILL.md packages).
 * Four layers:
 *   1. Prompt-injection pattern detection in descriptions
 *   2. Embedded-script static analysis (install commands + descriptions)
 *   3. Exposed-secret scanning
 *   4. Dependency/install command analysis (CVE watchlist + typosquat)
 *
 * No external dependencies. Runs at build time and in CI.
 */

import { CVE_WATCHLIST, type WatchlistEntry } from '../data/cveWatchlist';

// ── Types ──────────────────────────────────────────────────────────────────

export interface SkillRecord {
  name: string;
  title: string;
  description: string;
  repo: string;
  install: string;
  category: string;
  source: string;
  publisher: string;
  url: string;
  [key: string]: any;
}

export type SkillFindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SkillFindingCategory =
  | 'prompt_injection'
  | 'dangerous_script'
  | 'exposed_secret'
  | 'dependency_risk'
  | 'typosquat';

export interface SkillFinding {
  category: SkillFindingCategory;
  severity: SkillFindingSeverity;
  message: string;
  context: string;
}

export interface SkillLayerResult {
  score: number;
  findings: SkillFinding[];
}

export interface SkillScanResult {
  score: number;
  tier: 'unverified' | 'scanned' | 'manually_reviewed';
  findings: SkillFinding[];
  layers: {
    promptInjection: SkillLayerResult;
    scriptSafety: SkillLayerResult;
    secretExposure: SkillLayerResult;
    dependencyRisk: SkillLayerResult;
  };
  scannedAt: string;
}

export type BadgeTier = 'unverified' | 'scanned' | 'manually_reviewed';

// ── Detection Rules ────────────────────────────────────────────────────────

interface PromptRule {
  id: string;
  pattern: RegExp;
  severity: SkillFindingSeverity;
  message: string;
}

const PROMPT_RULES: PromptRule[] = [
  {
    id: 'PI-001',
    pattern: /\bignore\s+(all\s+)?previous\s+instructions?\b/gi,
    severity: 'critical',
    message: 'Skill description contains explicit instruction-override pattern ("ignore previous instructions").',
  },
  {
    id: 'PI-002',
    pattern: /\bdisregard\s+your\s+(training|instructions|programming)\b/gi,
    severity: 'critical',
    message: 'Skill description contains training-override pattern.',
  },
  {
    id: 'PI-003',
    pattern: /\b(system\s+prompt|developer\s+mode|DAN\s+mode|jailbreak)\b/gi,
    severity: 'high',
    message: 'Skill description references system-prompt manipulation or jailbreak concepts.',
  },
  {
    id: 'PI-004',
    pattern: /\b(send\s+to\s+webhook|POST\s+to\s+URL|exfiltrat|forward\s+this\s+(data|conversation|message))\b/gi,
    severity: 'high',
    message: 'Skill description contains potential data-exfiltration instruction.',
  },
  {
    id: 'PI-005',
    pattern: /\byou\s+are\s+now\s+(a|an)\s+\w+\b/gi,
    severity: 'medium',
    message: 'Skill description uses role-confusion pattern ("you are now a...").',
  },
  {
    id: 'PI-006',
    pattern: /\bswitch\s+to\s+(developer|admin|root|unrestricted)\s+mode\b/gi,
    severity: 'high',
    message: 'Skill description requests mode-switch to privileged state.',
  },
  {
    id: 'PI-007',
    pattern: /\boverride\s+your\s+(safety|guidelines|constraints|rules)\b/gi,
    severity: 'critical',
    message: 'Skill description explicitly requests safety override.',
  },
  {
    id: 'PI-008',
    pattern: /\bbypass\s+your\s+(restrictions|filters|safety)\b/gi,
    severity: 'high',
    message: 'Skill description requests restriction bypass.',
  },
  {
    id: 'PI-009',
    pattern: /\bignore\s+(safety|security|ethical)\s+(guidelines|rules)\b/gi,
    severity: 'critical',
    message: 'Skill description requests ignoring safety guidelines.',
  },
  {
    id: 'PI-010',
    pattern: /\b(leak|expose|reveal)\s+(token|key|password|credential|secret)\b/gi,
    severity: 'high',
    message: 'Skill description contains credential-exposure instruction.',
  },
];

interface ScriptRule {
  id: string;
  pattern: RegExp;
  severity: SkillFindingSeverity;
  message: string;
}

const SCRIPT_RULES: ScriptRule[] = [
  {
    id: 'SCRIPT-001',
    pattern: /curl\s+[^|]*\|\s*(bash|sh|zsh)/gi,
    severity: 'critical',
    message: 'Install command pipes curl output directly into shell (supply-chain risk).',
  },
  {
    id: 'SCRIPT-002',
    pattern: /wget\s+[^|]*\|\s*(bash|sh|zsh)/gi,
    severity: 'critical',
    message: 'Install command pipes wget output directly into shell.',
  },
  {
    id: 'SCRIPT-003',
    pattern: /\beval\s*\(/gi,
    severity: 'high',
    message: 'Description or install contains eval() — dynamic code execution.',
  },
  {
    id: 'SCRIPT-004',
    pattern: /\bexec\s*\(/gi,
    severity: 'high',
    message: 'Description or install contains exec() — arbitrary command execution.',
  },
  {
    id: 'SCRIPT-005',
    pattern: /\bchild_process\b/gi,
    severity: 'medium',
    message: 'Description references child_process module.',
  },
  {
    id: 'SCRIPT-006',
    pattern: /\brm\s+-rf\s+\/(\s|$)/gi,
    severity: 'critical',
    message: 'Install command contains destructive rm -rf / pattern.',
  },
  {
    id: 'SCRIPT-007',
    pattern: /\brm\s+-rf\s+~\//gi,
    severity: 'high',
    message: 'Install command contains home-directory destruction pattern.',
  },
  {
    id: 'SCRIPT-008',
    pattern: /\bsudo\s+/gi,
    severity: 'medium',
    message: 'Install command requires sudo escalation.',
  },
  {
    id: 'SCRIPT-009',
    pattern: /\bchmod\s+777\b/gi,
    severity: 'medium',
    message: 'Install command uses overly permissive chmod 777.',
  },
  {
    id: 'SCRIPT-010',
    pattern: /base64\s+(-d|--decode)\s*\|/gi,
    severity: 'high',
    message: 'Install command decodes base64 and pipes to shell (obfuscation vector).',
  },
  {
    id: 'SCRIPT-011',
    pattern: /\b(powerShell|cmd\.exe|bash\s+-c)\b/gi,
    severity: 'low',
    message: 'Install command invokes shell explicitly.',
  },
];

interface SecretRule {
  id: string;
  pattern: RegExp;
  severity: SkillFindingSeverity;
  message: string;
}

const SECRET_RULES: SecretRule[] = [
  {
    id: 'SECRET-001',
    pattern: /\bsk-[a-zA-Z0-9]{20,}\b/g,
    severity: 'high',
    message: 'Possible OpenAI API key exposed in skill content.',
  },
  {
    id: 'SECRET-002',
    pattern: /\bghp_[a-zA-Z0-9]{36}\b/g,
    severity: 'high',
    message: 'Possible GitHub personal access token exposed.',
  },
  {
    id: 'SECRET-003',
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
    severity: 'high',
    message: 'Possible AWS access key ID exposed.',
  },
  {
    id: 'SECRET-004',
    pattern: /\bnpm_[a-zA-Z0-9]{36}\b/g,
    severity: 'high',
    message: 'Possible npm access token exposed.',
  },
  {
    id: 'SECRET-005',
    pattern: /\bBearer\s+[a-zA-Z0-9_\-\.]{20,}\b/gi,
    severity: 'medium',
    message: 'Possible bearer token exposed.',
  },
  {
    id: 'SECRET-006',
    pattern: /\b(password|passwd|pwd)\s*=\s*[^&\s]{8,}\b/gi,
    severity: 'medium',
    message: 'Possible hardcoded password in skill content.',
  },
  {
    id: 'SECRET-007',
    pattern: /\btoken\s*=\s*[^&\s]{8,}\b/gi,
    severity: 'medium',
    message: 'Possible hardcoded token in skill content.',
  },
  {
    id: 'SECRET-008',
    pattern: /\bapi[_-]?key\s*=\s*[^&\s]{8,}\b/gi,
    severity: 'medium',
    message: 'Possible hardcoded API key in skill content.',
  },
  {
    id: 'SECRET-009',
    pattern: /\bprivate[_-]?key\b/gi,
    severity: 'low',
    message: 'Skill content references private keys.',
  },
];

// ── Known-good packages for typosquat detection ────────────────────────────

const KNOWN_PACKAGES: string[] = [
  '@modelcontextprotocol/server-github',
  '@modelcontextprotocol/inspector',
  '@anthropic-ai/mcp-server-git',
  'fastmcp',
  'mcp-use',
  'playwright-mcp',
  'puppeteer-mcp',
  'postgres-mcp',
  'sqlite-mcp',
  'mcp-gsuite',
  'mcp-jetbrains',
  'mcp-alchemy',
  '@upstash/context7',
  '@aws-sdk/mcp-server',
  '@cloudflare/mcp-server',
  'skills',
  'mcp-builder',
  'superpowers',
  'gitnexus',
  'marketingskills',
];

// ── Scoring helpers ────────────────────────────────────────────────────────

const SEVERITY_PENALTIES: Record<SkillFindingSeverity, number> = {
  critical: 30,
  high: 15,
  medium: 5,
  low: 2,
  info: 0,
};

function applyPenalties(baseScore: number, findings: SkillFinding[]): number {
  let score = baseScore;
  for (const f of findings) {
    score -= SEVERITY_PENALTIES[f.severity];
  }
  return Math.max(0, score);
}

// ── Layer scanners ─────────────────────────────────────────────────────────

function scanPromptInjection(skill: SkillRecord): SkillLayerResult {
  const findings: SkillFinding[] = [];
  const text = `${skill.description} ${skill.title}`;

  for (const rule of PROMPT_RULES) {
    const matches = text.match(rule.pattern);
    if (matches) {
      findings.push({
        category: 'prompt_injection',
        severity: rule.severity,
        message: rule.message,
        context: matches[0].slice(0, 80),
      });
    }
  }

  return {
    score: applyPenalties(100, findings),
    findings,
  };
}

function scanScriptSafety(skill: SkillRecord): SkillLayerResult {
  const findings: SkillFinding[] = [];
  const text = `${skill.description} ${skill.install}`;

  for (const rule of SCRIPT_RULES) {
    const matches = text.match(rule.pattern);
    if (matches) {
      findings.push({
        category: 'dangerous_script',
        severity: rule.severity,
        message: rule.message,
        context: matches[0].slice(0, 80),
      });
    }
  }

  return {
    score: applyPenalties(100, findings),
    findings,
  };
}

function scanSecretExposure(skill: SkillRecord): SkillLayerResult {
  const findings: SkillFinding[] = [];
  const text = `${skill.description} ${skill.install}`;

  for (const rule of SECRET_RULES) {
    const matches = text.match(rule.pattern);
    if (matches) {
      findings.push({
        category: 'exposed_secret',
        severity: rule.severity,
        message: rule.message,
        context: '[REDACTED]',
      });
    }
  }

  return {
    score: applyPenalties(100, findings),
    findings,
  };
}

// ── Levenshtein distance for typosquat detection ───────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function extractPackagesFromInstall(install: string): string[] {
  const packages: string[] = [];

  // npx skills add [repo] --skill [name]  → repo is the package
  const skillsAddMatch = install.match(/npx\s+skills\s+add\s+(\S+)/);
  if (skillsAddMatch) {
    packages.push(skillsAddMatch[1]);
  }

  // npx -y [package] or npx [package]
  const npxMatch = install.match(/npx\s+(?:-y\s+)?(\S+)/);
  if (npxMatch && npxMatch[1] !== 'skills') {
    packages.push(npxMatch[1]);
  }

  // npm install [package]
  const npmMatch = install.match(/npm\s+(?:install|i)\s+(\S+)/);
  if (npmMatch) {
    packages.push(npmMatch[1]);
  }

  return Array.from(new Set(packages));
}

function scanDependencyRisk(skill: SkillRecord): SkillLayerResult {
  const findings: SkillFinding[] = [];
  const packages = extractPackagesFromInstall(skill.install);

  for (const pkg of packages) {
    // Check CVE watchlist
    const watchlistMatches = CVE_WATCHLIST.filter(
      (entry) => entry.package_name.toLowerCase() === pkg.toLowerCase()
    );
    for (const match of watchlistMatches) {
      findings.push({
        category: 'dependency_risk',
        severity: match.severity,
        message: `Package "${pkg}" matches CVE watchlist: ${match.cve_id || match.description.slice(0, 60)}`,
        context: pkg,
      });
    }

    // Check for typosquatting
    for (const known of KNOWN_PACKAGES) {
      const dist = levenshtein(pkg.toLowerCase(), known.toLowerCase());
      if (dist > 0 && dist <= 2 && pkg.toLowerCase() !== known.toLowerCase()) {
        findings.push({
          category: 'typosquat',
          severity: 'high',
          message: `Package "${pkg}" is a close match to known package "${known}" (distance ${dist}) — possible typosquat.`,
          context: `${pkg} ~ ${known}`,
        });
      }
    }
  }

  return {
    score: applyPenalties(100, findings),
    findings,
  };
}

// ── Manual audit lookup ────────────────────────────────────────────────────

export interface SkillAudit {
  name: string;
  promptInjectionRisk: 'low' | 'medium' | 'high';
  scriptSafety: 'clean' | 'warning' | 'critical';
  secretExposure: boolean;
  installTrust: 'trusted' | 'suspicious';
  notes?: string;
}

const SKILL_AUDITS: Map<string, SkillAudit> = new Map();

export function registerSkillAudit(audit: SkillAudit): void {
  SKILL_AUDITS.set(audit.name, audit);
}

export function getSkillAudit(name: string): SkillAudit | undefined {
  return SKILL_AUDITS.get(name);
}

// ── Badge tier computation ─────────────────────────────────────────────────

function computeBadgeTier(
  score: number,
  findings: SkillFinding[],
  skillName: string
): BadgeTier {
  const audit = getSkillAudit(skillName);

  const hasCriticalFinding = findings.some((f) => f.severity === 'critical');

  if (audit) {
    if (!hasCriticalFinding && audit.scriptSafety !== 'critical') {
      return 'manually_reviewed';
    }
  }

  const anyLayerFailed = hasCriticalFinding;

  // All skills that go through the scanner are considered "scanned"
  // (unverified only applies if scanning was explicitly skipped)
  if (anyLayerFailed) {
    return 'scanned'; // scanned but with critical findings
  }

  return 'scanned';
}

// ── Main entry point ───────────────────────────────────────────────────────

export function scanSkill(skill: SkillRecord): SkillScanResult {
  const promptInjection = scanPromptInjection(skill);
  const scriptSafety = scanScriptSafety(skill);
  const secretExposure = scanSecretExposure(skill);
  const dependencyRisk = scanDependencyRisk(skill);

  const allFindings = [
    ...promptInjection.findings,
    ...scriptSafety.findings,
    ...secretExposure.findings,
    ...dependencyRisk.findings,
  ];

  // Overall score: weighted average of layer scores
  const weights = {
    promptInjection: 0.30,
    scriptSafety: 0.30,
    secretExposure: 0.20,
    dependencyRisk: 0.20,
  };

  const overallScore = Math.round(
    promptInjection.score * weights.promptInjection +
    scriptSafety.score * weights.scriptSafety +
    secretExposure.score * weights.secretExposure +
    dependencyRisk.score * weights.dependencyRisk
  );

  const tier = computeBadgeTier(overallScore, allFindings, skill.name);

  return {
    score: overallScore,
    tier,
    findings: allFindings,
    layers: {
      promptInjection,
      scriptSafety,
      secretExposure,
      dependencyRisk,
    },
    scannedAt: new Date().toISOString(),
  };
}

// ── Batch scan ─────────────────────────────────────────────────────────────

export interface SkillScanBatch {
  generatedAt: string;
  totalSkills: number;
  badgeSummary: Record<BadgeTier, number>;
  flagRate: number;
  results: Record<string, SkillScanResult>;
}

export function scanSkills(skills: SkillRecord[]): SkillScanBatch {
  const results: Record<string, SkillScanResult> = {};
  const badgeSummary: Record<BadgeTier, number> = {
    unverified: 0,
    scanned: 0,
    manually_reviewed: 0,
  };

  let flaggedCount = 0;

  for (const skill of skills) {
    const result = scanSkill(skill);
    results[skill.name] = result;
    badgeSummary[result.tier]++;

    const hasCriticalOrHigh = result.findings.some(
      (f) => f.severity === 'critical' || f.severity === 'high'
    );
    if (hasCriticalOrHigh) {
      flaggedCount++;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalSkills: skills.length,
    badgeSummary,
    flagRate: skills.length > 0 ? flaggedCount / skills.length : 0,
    results,
  };
}
