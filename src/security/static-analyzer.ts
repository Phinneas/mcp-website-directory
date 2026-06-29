/**
 * Static Analysis Engine for MCP Server Source Code
 *
 * Scans for known RCE/command-injection patterns in MCP server packages.
 * This runs against npm package source code (via the npm registry tarball API)
 * and looks for dangerous patterns that have been exploited in real CVEs:
 *
 * - CVE-2025-6514: unsanitized exec/execSync with user-controlled URLs
 * - CVE-2025-53355: shell metacharacters in execSync calls
 * - CVE-2025-53967: child_process.exec fallback without URL sanitization
 * - CVE-2026-0755: passing unsanitized input to execAsync
 * - CVE-2025-54994: command injection during server scaffolding
 *
 * Pattern categories:
 * 1. COMMAND_INJECTION — unsanitized exec/execSync/spawn with user input
 * 2. SHELL_STRING_CONSTRUCTION — string interpolation into shell commands
 * 3. PATH_TRAVERSAL — unsanitized file path operations
 * 4. UNSANITIZED_URL_FETCH — fetch/fallback-to-curl without URL validation
 * 5. HARDCODED_SECRETS — credentials/keys in source code
 * 6. EXCESSIVE_PERMISSIONS — 0.0.0.0 binding, no auth, root operations
 */

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingCategory =
  | 'command_injection'
  | 'shell_string_construction'
  | 'path_traversal'
  | 'unsanitized_url_fetch'
  | 'hardcoded_secrets'
  | 'excessive_permissions';

export interface StaticFinding {
  category: FindingCategory;
  severity: FindingSeverity;
  pattern: string;
  file: string;
  line: number;
  context: string;
  cve_reference?: string;
  remediation: string;
}

export interface StaticAnalysisResult {
  server_id: string;
  score: number;             // 0-100 (100 = clean)
  status: 'passed' | 'failed' | 'warning' | 'error' | 'skipped';
  findings: StaticFinding[];
  files_scanned: number;
  lines_scanned: number;
  scanned_at: string;
}

// ── Detection Rules ──────────────────────────────────────────────────────

interface DetectionRule {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  pattern: RegExp;
  cve_reference?: string;
  remediation: string;
  // Minimum number of matches to flag (avoid false positives on imports alone)
  minMatches?: number;
}

const RULES: DetectionRule[] = [
  // ── COMMAND INJECTION ──────────────────────────────────────────────────
  {
    id: 'RCE-001',
    category: 'command_injection',
    severity: 'critical',
    pattern: /execSync\s*\(\s*[`'"].*\$\{/g,
    cve_reference: 'CVE-2025-53355',
    remediation: 'Use execFileSync or spawn with args array instead of string interpolation in execSync.',
  },
  {
    id: 'RCE-002',
    category: 'command_injection',
    severity: 'critical',
    pattern: /exec\s*\(\s*[`'"].*\$\{/g,
    cve_reference: 'CVE-2025-53967',
    remediation: 'Never pass user-controlled data to child_process.exec. Use spawn with args array.',
  },
  {
    id: 'RCE-003',
    category: 'command_injection',
    severity: 'critical',
    pattern: /execAsync\s*\(\s*[`'"].*\$\{/g,
    cve_reference: 'CVE-2026-0755',
    remediation: 'Use parameterized command execution instead of string interpolation.',
  },
  {
    id: 'RCE-004',
    category: 'command_injection',
    severity: 'high',
    pattern: /spawn\s*\(\s*['"`](?:sh|bash|cmd|powershell|zsh)['"`]\s*,\s*\[.*\$\{/g,
    remediation: 'Avoid spawning shells with user-controlled arguments. Use direct binary execution with args array.',
  },
  {
    id: 'RCE-005',
    category: 'command_injection',
    severity: 'high',
    pattern: /\.exec\s*\(\s*[^)]*\+[^)]*\)/g,
    remediation: 'String concatenation in exec() calls enables command injection. Use args array.',
  },

  // ── SHELL STRING CONSTRUCTION ──────────────────────────────────────────
  {
    id: 'SHELL-001',
    category: 'shell_string_construction',
    severity: 'high',
    pattern: /[`'"]\s*(?:kubectl|docker|git|npm|pip|curl|wget)\s+.*\$\{/g,
    cve_reference: 'CVE-2025-53355',
    remediation: 'Construct commands as arrays, not interpolated strings. Use spawn/execFile with separate args.',
  },
  {
    id: 'SHELL-002',
    category: 'shell_string_construction',
    severity: 'medium',
    pattern: /new\s+Command\s*\([^)]*\+[^)]*\)/g,
    remediation: 'Avoid string concatenation when constructing shell commands.',
  },
  {
    id: 'SHELL-003',
    category: 'shell_string_construction',
    severity: 'high',
    pattern: /\`.*(?:rm\s+-rf|chmod|chown|mkfs|dd\s+if=).*\$\{/g,
    remediation: 'Never interpolate user input into destructive system commands.',
  },

  // ── PATH TRAVERSAL ────────────────────────────────────────────────────
  {
    id: 'PATH-001',
    category: 'path_traversal',
    severity: 'high',
    pattern: /readFile\s*\(\s*[^)]*\.\.\./g,
    cve_reference: 'CVE-2025-66689',
    remediation: 'Validate and normalize paths before file operations. Reject paths containing "..".',
  },
  {
    id: 'PATH-002',
    category: 'path_traversal',
    severity: 'high',
    pattern: /path\.join\s*\([^)]*\$\{[^}]*(?:args|params|input|query|request)/g,
    cve_reference: 'CVE-2025-67366',
    remediation: 'Sanitize path.join inputs. Use path.resolve + startsWith check to enforce directory boundaries.',
  },
  {
    id: 'PATH-003',
    category: 'path_traversal',
    severity: 'medium',
    pattern: /is_dangerous_path|isSafePath|is_allowed_path/g,
    remediation: 'Custom path validation functions are often bypassed. Use path.resolve + whitelist approach instead.',
  },

  // ── UNSANITIZED URL FETCH ─────────────────────────────────────────────
  {
    id: 'URL-001',
    category: 'unsanitized_url_fetch',
    severity: 'critical',
    pattern: /exec\s*\(\s*['"`]curl\s+.*\$\{.*url/g,
    cve_reference: 'CVE-2025-53967',
    remediation: 'Never fall back to exec("curl " + url). Use fetch() or validated HTTP libraries.',
  },
  {
    id: 'URL-002',
    category: 'unsanitized_url_fetch',
    severity: 'high',
    pattern: /fetch\s*\(\s*(?:args|params|input|request|url)\b/g,
    remediation: 'Validate URLs before fetching. Block private IPs and internal hostnames.',
  },
  {
    id: 'URL-003',
    category: 'unsanitized_url_fetch',
    severity: 'high',
    pattern: /is_ip_private|isPrivateIp|is_local_ip/g,
    cve_reference: 'CVE-2025-65513',
    remediation: 'Custom IP validation functions are often incorrect. Use established libraries like ip-regex or validator.',
  },

  // ── HARDCODED SECRETS ─────────────────────────────────────────────────
  {
    id: 'SEC-001',
    category: 'hardcoded_secrets',
    severity: 'high',
    pattern: /(?:api[_-]?key|secret|token|password|credential)\s*[:=]\s*['"`][^'"`]{8,}/gi,
    remediation: 'Never hardcode secrets. Use environment variables or secret management.',
  },
  {
    id: 'SEC-002',
    category: 'hardcoded_secrets',
    severity: 'medium',
    pattern: /sk-[a-zA-Z0-9]{20,}/g,
    remediation: 'OpenAI API keys found in source. Rotate immediately and use environment variables.',
  },

  // ── EXCESSIVE PERMISSIONS ─────────────────────────────────────────────
  {
    id: 'PERM-001',
    category: 'excessive_permissions',
    severity: 'high',
    pattern: /listen\s*\(\s*(?:0\.0\.0\.0|::)\s*/g,
    cve_reference: 'CVE-2026-23744',
    remediation: 'Never bind to 0.0.0.0 by default. Use 127.0.0.1 for local-only MCP servers.',
  },
  {
    id: 'PERM-002',
    category: 'excessive_permissions',
    severity: 'medium',
    pattern: /chmod\s*\(?\s*0?777/g,
    remediation: 'Never set world-writable permissions (777). Use minimal required permissions.',
  },
];

// ── Scoring ────────────────────────────────────────────────────────────────

const SEVERITY_DEDUCTIONS: Record<FindingSeverity, number> = {
  critical: 30,
  high: 15,
  medium: 5,
  low: 2,
  info: 0,
};

/**
 * Run static analysis on source code files from an npm package.
 *
 * In production, this is called by the security scanner worker which:
 * 1. Fetches the package tarball from the npm registry
 * 2. Extracts the source files
 * 3. Passes each file's content to this function
 *
 * For the initial build, we provide a simplified version that works
 * on pre-fetched source code strings.
 */
export function analyzeSource(
  serverId: string,
  files: Array<{ path: string; content: string }>
): StaticAnalysisResult {
  const findings: StaticFinding[] = [];
  let totalLines = 0;

  for (const file of files) {
    const lines = file.content.split('\n');
    totalLines += lines.length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const rule of RULES) {
        // Reset lastIndex for stateful regexes
        rule.pattern.lastIndex = 0;

        const matches = line.match(rule.pattern);
        if (matches && matches.length >= (rule.minMatches || 1)) {
          findings.push({
            category: rule.category,
            severity: rule.severity,
            pattern: rule.id,
            file: file.path,
            line: i + 1,
            context: line.trim().slice(0, 200),
            cve_reference: rule.cve_reference,
            remediation: rule.remediation,
          });
        }
      }
    }
  }

  // Compute score (starts at 100, deduct per finding)
  let score = 100;
  for (const f of findings) {
    score -= SEVERITY_DEDUCTIONS[f.severity];
  }
  score = Math.max(0, Math.min(100, score));

  // Deduplicate findings (same rule + file)
  const seen = new Set<string>();
  const uniqueFindings = findings.filter(f => {
    const key = `${f.pattern}:${f.file}:${f.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const hasCritical = uniqueFindings.some(f => f.severity === 'critical');
  const hasHigh = uniqueFindings.some(f => f.severity === 'high');

  return {
    server_id: serverId,
    score,
    status: hasCritical ? 'failed' : hasHigh ? 'warning' : uniqueFindings.length > 0 ? 'warning' : 'passed',
    findings: uniqueFindings,
    files_scanned: files.length,
    lines_scanned: totalLines,
    scanned_at: new Date().toISOString(),
  };
}

/**
 * Analyze a single source file (convenience wrapper).
 */
export function analyzeFile(
  serverId: string,
  filePath: string,
  content: string
): StaticFinding[] {
  const result = analyzeSource(serverId, [{ path: filePath, content }]);
  return result.findings;
}

/**
 * Quick heuristic: does the server description or name suggest it's
 * a shell/command execution server? Those get extra scrutiny.
 */
export function isHighRiskCategory(serverDescription: string, serverName: string): boolean {
  const highRiskKeywords = [
    'exec', 'shell', 'command', 'cli executor', 'terminal',
    'ssh', 'kubectl', 'docker', 'sandbox', 'code execution',
    'code runner', 'repl', 'bash', 'powershell',
  ];
  const text = `${serverName} ${serverDescription}`.toLowerCase();
  return highRiskKeywords.some(kw => text.includes(kw));
}
