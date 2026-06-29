/**
 * mcp-scan Integration — Tool Poisoning / Rug Pull / Cross-Origin Detection
 *
 * Uses Invariant Labs' open-source mcp-scan tool to detect:
 * - Tool poisoning attacks (hidden instructions in tool descriptions)
 * - Rug pulls (silent tool redefinition after initial approval)
 * - Cross-origin escalation (tool shadowing across servers)
 * - Description injection (prompt injection via MCP metadata)
 *
 * CLI: uvx mcp-scan@latest --json
 * Docs: https://invariantlabs-ai.github.io/docs/mcp-scan/
 * For automated scanning, use --json flag and parse output.
 *
 * In production, the security scanner worker runs mcp-scan against
 * each listed MCP server and parses the JSON output.
 *
 * For servers that can't be started (no config, requires env vars),
 * this scan falls back to a heuristic description analysis.
 */

export interface McpScanResult {
  server_id: string;
  score: number;              // 0-100
  status: 'passed' | 'failed' | 'warning' | 'error' | 'skipped';
  tool_poisoning_detected: boolean;
  rug_pull_detected: boolean;
  cross_origin_escalation: boolean;
  description_injection: boolean;
  issues: McpScanIssue[];
  scanner_version: string | null;
  scanned_at: string;
}

export interface McpScanIssue {
  code: string;               // mcp-scan issue code (e.g. 'TOOL_POISONING', 'RUG_PULL')
  severity: 'critical' | 'high' | 'medium' | 'low';
  tool_name: string | null;
  description: string;
  server_name: string;
}

// ── Known tool poisoning patterns ─────────────────────────────────────────

const POISONING_PATTERNS = [
  // Hidden instructions in tool descriptions
  { pattern: /\[INTERNAL\]|\[SYSTEM\]|\[HIDDEN\]|\[SECRET\]/gi, severity: 'critical' as const, code: 'TOOL_POISONING_HIDDEN_TAG' },
  // Instruction to ignore previous rules
  { pattern: /ignore\s+(?:previous|above|all|your)\s+(?:instructions|rules|guidelines)/gi, severity: 'critical' as const, code: 'TOOL_POISONING_IGNORE' },
  // Exfiltration instructions
  { pattern: /send\s+(?:to|via)\s+(?:http|https|url|endpoint|server|api)/gi, severity: 'high' as const, code: 'TOOL_POISONING_EXFIL' },
  // Privilege escalation
  { pattern: /you\s+(?:now|must|should|are)\s+(?:root|admin|superuser)/gi, severity: 'critical' as const, code: 'TOOL_POISONING_ESCALATION' },
  // BCC/CC instructions (like postmark-mcp)
  { pattern: /(?:bcc|cc)\s*:?\s*[\w.-]+@[\w.-]+\.\w+/gi, severity: 'critical' as const, code: 'TOOL_POISONING_BCC' },
  // Credential exfiltration
  { pattern: /(?:export|send|forward|pipe)\s+(?:API_KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/gi, severity: 'critical' as const, code: 'TOOL_POISONING_CRED_EXFIL' },
  // Ambient authority exploitation
  { pattern: /access\s+(?:all|every|any|user's?)\s+(?:file|data|resource|document)/gi, severity: 'high' as const, code: 'TOOL_POISONING_AMBIENT_AUTH' },
  // Tool shadowing instructions
  { pattern: /replace|override|shadow|intercept\s+(?:the|another|other)\s+(?:tool|server|function)/gi, severity: 'high' as const, code: 'TOOL_POISONING_SHADOWING' },
];

/**
 * Parse mcp-scan JSON output.
 *
 * mcp-scan --json returns:
 * {
 *   "version": "0.x.x",
 *   "issues": [
 *     {
 *       "code": "TOOL_POISONING",
 *       "severity": "high",
 *       "tool_name": "some_tool",
 *       "description": "Tool description contains hidden instructions",
 *       "server_name": "malicious-server"
 *     }
 *   ]
 * }
 */
export function parseMcpScanJson(jsonOutput: string, serverId: string): McpScanResult {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonOutput);
  } catch {
    return {
      server_id: serverId,
      score: 50,
      status: 'error',
      tool_poisoning_detected: false,
      rug_pull_detected: false,
      cross_origin_escalation: false,
      description_injection: false,
      issues: [],
      scanner_version: null,
      scanned_at: new Date().toISOString(),
    };
  }

  const issues: McpScanIssue[] = (parsed.issues || []).map((issue: any) => ({
    code: issue.code || 'UNKNOWN',
    severity: issue.severity || 'medium',
    tool_name: issue.tool_name || null,
    description: issue.description || '',
    server_name: issue.server_name || serverId,
  }));

  const hasToolPoisoning = issues.some(i =>
    i.code.includes('TOOL_POISONING') || i.code.includes('DESCRIPTION_INJECTION')
  );
  const hasRugPull = issues.some(i => i.code.includes('RUG_PULL'));
  const hasCrossOrigin = issues.some(i => i.code.includes('CROSS_ORIGIN') || i.code.includes('SHADOWING'));
  const hasDescInjection = issues.some(i => i.code.includes('DESCRIPTION_INJECTION'));

  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 40;
    else if (issue.severity === 'high') score -= 20;
    else if (issue.severity === 'medium') score -= 10;
    else score -= 5;
  }
  score = Math.max(0, score);

  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasHigh = issues.some(i => i.severity === 'high');

  return {
    server_id: serverId,
    score,
    status: hasCritical ? 'failed' : hasHigh ? 'warning' : issues.length > 0 ? 'warning' : 'passed',
    tool_poisoning_detected: hasToolPoisoning,
    rug_pull_detected: hasRugPull,
    cross_origin_escalation: hasCrossOrigin,
    description_injection: hasDescInjection,
    issues,
    scanner_version: parsed.version || null,
    scanned_at: new Date().toISOString(),
  };
}

/**
 * Heuristic tool description analysis.
 * Runs when mcp-scan CLI is unavailable or the server can't be started.
 * Analyzes tool descriptions from the MCP tools/list response.
 */
export function analyzeToolDescriptions(
  serverId: string,
  tools: Array<{ name: string; description: string }>
): McpScanResult {
  const issues: McpScanIssue[] = [];

  for (const tool of tools) {
    for (const rule of POISONING_PATTERNS) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(tool.description)) {
        issues.push({
          code: rule.code,
          severity: rule.severity,
          tool_name: tool.name,
          description: `Potential ${rule.code.toLowerCase().replace(/_/g, ' ')} detected in tool "${tool.name}"`,
          server_name: serverId,
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const uniqueIssues = issues.filter(i => {
    const key = `${i.code}:${i.tool_name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const hasToolPoisoning = uniqueIssues.some(i =>
    i.code.startsWith('TOOL_POISONING') || i.code === 'DESCRIPTION_INJECTION'
  );
  const hasRugPull = uniqueIssues.some(i => i.code.includes('RUG_PULL'));
  const hasCrossOrigin = uniqueIssues.some(i => i.code.includes('SHADOWING'));
  const hasDescInjection = uniqueIssues.some(i => i.code === 'DESCRIPTION_INJECTION');

  let score = 100;
  for (const issue of uniqueIssues) {
    if (issue.severity === 'critical') score -= 40;
    else if (issue.severity === 'high') score -= 20;
    else if (issue.severity === 'medium') score -= 10;
    else score -= 5;
  }
  score = Math.max(0, score);

  const hasCritical = uniqueIssues.some(i => i.severity === 'critical');

  return {
    server_id: serverId,
    score,
    status: hasCritical ? 'failed' : uniqueIssues.some(i => i.severity === 'high') ? 'warning' : 'passed',
    tool_poisoning_detected: hasToolPoisoning,
    rug_pull_detected: hasRugPull,
    cross_origin_escalation: hasCrossOrigin,
    description_injection: hasDescInjection,
    issues: uniqueIssues,
    scanner_version: 'heuristic-v1',
    scanned_at: new Date().toISOString(),
  };
}
