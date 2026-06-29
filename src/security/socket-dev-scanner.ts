/**
 * Socket.dev Integration — Dependency Health + Typosquat Detection
 *
 * This was flagged as "Phase 2 — Socket.dev" in securityAudit.ts.
 * This IS that build.
 *
 * Socket.dev provides:
 * - Dependency health scoring (clean/warnings/critical)
 * - Typosquat detection (packages mimicking popular names)
 * - Install source analysis (npm install counts)
 * - Malicious package detection (behavioral analysis)
 * - Supply chain risk scoring
 *
 * Free tier: Open source projects get free API access.
 * API docs: https://docs.socket.dev/docs/api
 *
 * For servers without an npm_package, this scan is skipped.
 */

export interface SocketDevResult {
  server_id: string;
  score: number;              // 0-100
  status: 'passed' | 'failed' | 'warning' | 'error' | 'skipped';
  dependency_health: 'clean' | 'warnings' | 'critical' | 'unscanned';
  typosquat_risk: boolean;
  typosquat_similar: string[];
  install_count: number | null;
  malicious: boolean;
  findings: SocketFinding[];
  scanned_at: string;
}

export interface SocketFinding {
  type: 'typosquat' | 'malicious_dependency' | 'critical_vulnerability' | 'suspicious_behavior' | 'deprecated';
  severity: 'critical' | 'high' | 'medium' | 'low';
  package: string;
  description: string;
}

// ── Known typosquat patterns for popular MCP packages ──────────────────

const POPULAR_MCP_PACKAGES: Record<string, string> = {
  '@modelcontextprotocol/sdk': 'MCP TypeScript SDK',
  '@anthropic-ai/mcp-server-git': 'Anthropic Git MCP',
  '@anthropic-ai/mcp-server-postgres': 'Anthropic Postgres MCP',
  '@anthropic-ai/mcp-server-filesystem': 'Anthropic Filesystem MCP',
  '@anthropic-ai/mcp-server-puppeteer': 'Anthropic Puppeteer MCP',
  '@anthropic-ai/mcp-server-slack': 'Anthropic Slack MCP',
  '@modelcontextprotocol/server-github': 'MCP GitHub Server',
  'mcp-remote': 'MCP Remote Proxy',
  'figma-developer-mcp': 'Figma Context MCP',
  'fastmcp': 'FastMCP Framework',
  'whatsapp-mcp': 'WhatsApp MCP',
  'node-code-sandbox-mcp': 'Code Sandbox MCP',
  'mcp-server-kubernetes': 'Kubernetes MCP',
};

/**
 * Check if a package name is a typosquat of a known popular package.
 * Uses Levenshtein distance for close matches and pattern matching for common tricks.
 */
export function detectTyposquat(packageName: string): { isTyposquat: boolean; similarTo: string[] } {
  const similar: string[] = [];
  const pkg = packageName.toLowerCase().replace(/^@[^/]+\//, ''); // strip scope

  for (const [popular, _] of Object.entries(POPULAR_MCP_PACKAGES)) {
    const pop = popular.toLowerCase().replace(/^@[^/]+\//, '');

    // Skip exact matches
    if (pkg === pop) continue;

    // Common typosquat patterns
    const tricks = [
      () => pkg === pop + '-mcp' && !popular.includes('-mcp'),
      () => pkg === pop.replace(/-/g, '') && pop.includes('-'),
      () => pkg === pop + 'server' && !popular.includes('server'),
      () => pkg === 'mcp-' + pop && !popular.startsWith('mcp-'),
      () => pkg === pop + '-server' && !popular.endsWith('-server'),
      () => levenshtein(pkg, pop) <= 2 && pkg.length >= 4 && Math.abs(pkg.length - pop.length) <= 1,
      () => pkg === pop.replace(/s$/, '') && pop.endsWith('s'),     // singular/plural
      () => pkg === pop + 's' && !pop.endsWith('s'),               // plural/singular
      () => pkg.includes('postmark') && pop.includes('postmark'),  // postmark-mcp pattern
    ];

    for (const trick of tricks) {
      if (trick()) {
        similar.push(popular);
        break;
      }
    }
  }

  return { isTyposquat: similar.length > 0, similarTo: similar };
}

/**
 * Fetch package security data from Socket.dev API.
 *
 * In production, this calls the Socket.dev API. For the initial build,
 * we implement the full API call but fall back to a conservative
 * heuristic scan if the API key is not configured.
 */
export async function scanWithSocketDev(
  serverId: string,
  npmPackage: string | null,
  socketApiKey?: string
): Promise<SocketDevResult> {
  if (!npmPackage) {
    return {
      server_id: serverId,
      score: 50,  // neutral — can't scan without package
      status: 'skipped',
      dependency_health: 'unscanned',
      typosquat_risk: false,
      typosquat_similar: [],
      install_count: null,
      malicious: false,
      findings: [],
      scanned_at: new Date().toISOString(),
    };
  }

  const findings: SocketFinding[] = [];
  let depHealth: SocketDevResult['dependency_health'] = 'unscanned';
  let typosquatRisk = false;
  let typosquatSimilar: string[] = [];
  let installCount: number | null = null;
  let isMalicious = false;

  // ── Typosquat detection (always runs, no API key needed) ──────────
  const typoResult = detectTyposquat(npmPackage);
  typosquatRisk = typoResult.isTyposquat;
  typosquatSimilar = typoResult.similarTo;

  if (typosquatRisk) {
    findings.push({
      type: 'typosquat',
      severity: 'critical',
      package: npmPackage,
      description: `Package "${npmPackage}" appears to be a typosquat of: ${typosquatSimilar.join(', ')}`,
    });
    isMalicious = true; // typosquat = assumed malicious until proven otherwise
  }

  // ── Socket.dev API call (if key available) ──────────────────────────
  if (socketApiKey) {
    try {
      const response = await fetch(
        `https://api.socket.dev/v0/pnpm/packages?name=${encodeURIComponent(npmPackage)}`,
        {
          headers: {
            'Authorization': `Bearer ${socketApiKey}`,
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json() as any;

        // Extract Socket.dev scores
        const score = data?.score ?? {};
        const supplyChainRisk = score?.supplyChainRisk ?? {};
        const overall = supplyChainRisk?.value ?? 'unknown';

        if (overall === 'high' || overall === 'critical') {
          depHealth = 'critical';
          findings.push({
            type: 'suspicious_behavior',
            severity: 'critical',
            package: npmPackage,
            description: `Socket.dev supply chain risk: ${overall}`,
          });
        } else if (overall === 'medium') {
          depHealth = 'warnings';
        } else {
          depHealth = 'clean';
        }

        // Check for malicious flag
        if (data?.malicious === true) {
          isMalicious = true;
          findings.push({
            type: 'malicious_dependency',
            severity: 'critical',
            package: npmPackage,
            description: `Socket.dev flagged this package as malicious`,
          });
        }

        // Extract install count
        installCount = data?.installCount ?? null;
      }
    } catch (err) {
      // API failure — fall through to heuristic
      console.warn(`Socket.dev API error for ${npmPackage}:`, err);
    }
  }

  // ── Heuristic scan (no API key or API failure) ────────────────────
  if (depHealth === 'unscanned' && !isMalicious) {
    // Check against known malicious package patterns
    const MALICIOUS_PATTERNS = [
      'postmark-mcp',    // known BCC exfiltration
      'sandworm',        // Sandworm_Mode campaign
    ];

    const pkgLower = npmPackage.toLowerCase();
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pkgLower.includes(pattern)) {
        isMalicious = true;
        depHealth = 'critical';
        findings.push({
          type: 'malicious_dependency',
          severity: 'critical',
          package: npmPackage,
          description: `Package matches known malicious campaign pattern: ${pattern}`,
        });
        break;
      }
    }

    // If no malicious match, give benefit of doubt but mark as unscanned
    if (!isMalicious) {
      // Can't verify without API — neutral score
      depHealth = 'unscanned';
    }
  }

  // Compute score
  let score = 100;
  if (isMalicious) score = 0;
  else if (depHealth === 'critical') score = 20;
  else if (depHealth === 'warnings') score = 60;
  else if (depHealth === 'clean') score = 95;
  else if (depHealth === 'unscanned') score = 50; // neutral

  if (typosquatRisk) score = Math.min(score, 10); // typosquat caps score at 10

  const status: SocketDevResult['status'] =
    isMalicious || depHealth === 'critical' ? 'failed' :
    typosquatRisk || depHealth === 'warnings' ? 'warning' :
    depHealth === 'clean' ? 'passed' :
    'skipped';

  return {
    server_id: serverId,
    score,
    status,
    dependency_health: depHealth,
    typosquat_risk: typosquatRisk,
    typosquat_similar: typosquatSimilar,
    install_count: installCount,
    malicious: isMalicious,
    findings,
    scanned_at: new Date().toISOString(),
  };
}

// ── Utility ────────────────────────────────────────────────────────────

/**
 * Compute Levenshtein distance between two strings.
 * Used for typosquat detection.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
