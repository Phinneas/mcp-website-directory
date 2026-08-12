/**
 * Agent Hygiene Score Data
 *
 * A separate, independent score from the existing verification/security-audit system.
 * This judges whether an MCP server is safe to hand an AI agent — not just whether it's maintained.
 *
 * Rubric (5 dimensions, scored 0-2 each, sum /10):
 *   1. Schema strictness    — typed inputs, enums, required fields declared
 *   2. Least-privilege      — per-tool auth scopes documented, vs one blanket API key
 *   3. Declared boundaries  — security policy, rate limits, or explicit "won't do" statement
 *   4. Auditability         — logs tool calls or supports idempotency keys
 *   5. Maintenance signal  — reuse existing verification data (GitHub activity, etc.)
 *
 * Score interpretation:
 *   8-10 = Excellent — safe to give an autonomous agent broad permissions
 *   6-7  = Good     — reasonable with scoped permissions
 *   4-5  = Fair     — use with caution, limit tool access
 *   0-3  — Poor     — not recommended for autonomous agent use
 */

export interface HygieneDimension {
  name: string;
  key: string;
  icon: string;
  description: string;
  /** How the 0/1/2 levels map */
  levels: Array<{ score: number; label: string; description: string }>;
}

export const HYGIENE_DIMENSIONS: HygieneDimension[] = [
  {
    name: 'Schema Strictness',
    key: 'schema',
    icon: '📋',
    description:
      'Does the server declare typed inputs, enums for constrained choices, and required fields in its tool definitions? Strict schemas prevent malformed agent requests from causing unexpected behavior.',
    levels: [
      {
        score: 2,
        label: 'Typed + Enumerated',
        description:
          'All tool inputs use strong types. Enums constrain choices where applicable. Required/optional fields are explicit. JSON Schema or language-native type annotations are complete.',
      },
      {
        score: 1,
        label: 'Partially Typed',
        description:
          'Some tools have typed inputs but gaps exist. Enums may be missing. Required fields may not be explicitly declared. Acceptable for simpler servers.',
      },
      {
        score: 0,
        label: 'Untyped / Loose',
        description:
          'Tool inputs accept arbitrary strings or objects with no validation. No type constraints, no enums. The agent must guess valid inputs.',
      },
    ],
  },
  {
    name: 'Least-Privilege Scoping',
    key: 'scoping',
    icon: '🔑',
    description:
      'Does the server support per-tool or per-resource authorization scopes, or does one credential unlock everything? Fine-grained scoping lets you give an agent only the access it actually needs.',
    levels: [
      {
        score: 2,
        label: 'Per-Tool Scopes',
        description:
          'Each tool or toolset can be individually authorized. OAuth scopes, IAM roles, or tool-level RBAC limit what a connected agent can do. The agent can be granted "read repos" without "write issues".',
      },
      {
        score: 1,
        label: 'Single Credential',
        description:
          'One API key or token grants access to all tools. No per-tool scoping. Acceptable for local-only servers where the agent runs on the user\'s machine.',
      },
      {
        score: 0,
        label: 'No Scoping',
        description:
          'Broad credentials with no way to limit access. The same token that reads data can also delete it. Dangerous for autonomous agents.',
      },
    ],
  },
  {
    name: 'Declared Boundaries',
    key: 'boundaries',
    icon: '🚧',
    description:
      'Has the author published a security policy, documented rate limits, or explicitly stated what the server will not do? Boundaries tell you what happens when things go wrong.',
    levels: [
      {
        score: 2,
        label: 'Documented Policy',
        description:
          'The server has a published security policy, rate limiting, and explicit scope documentation. There is a clear statement of what the server won\'t do (e.g., "this server never writes to your repo").',
      },
      {
        score: 1,
        label: 'Basic Docs',
        description:
          'The README documents what the server does and some configuration options, but does not include an explicit security policy or scope boundaries.',
      },
      {
        score: 0,
        label: 'No Boundaries',
        description:
          'No documentation about what the server will or won\'t do. No rate limits. No guardrails mentioned. The agent has no documented constraints.',
      },
    ],
  },
  {
    name: 'Auditability',
    key: 'auditability',
    icon: '🔍',
    description:
      'Does the server log tool calls, support idempotency keys, or provide observability hooks? Without auditability, you cannot tell what an agent did through the server.',
    levels: [
      {
        score: 2,
        label: 'Full Audit Trail',
        description:
          'The server logs tool calls, supports idempotency keys, or integrates with observability platforms (OpenTelemetry, CloudTrail). You can reconstruct what the agent did.',
      },
      {
        score: 1,
        label: 'Partial Observability',
        description:
          'Some logging or output that lets you infer tool usage, but no structured audit trail. May rely on the MCP client\'s own logging.',
      },
      {
        score: 0,
        label: 'No Observability',
        description:
          'Tool calls are opaque. No logging, no idempotency, no way to tell what the agent did besides checking external side effects.',
      },
    ],
  },
  {
    name: 'Maintenance Signal',
    key: 'maintenance',
    icon: '🛠️',
    description:
      'Is the server actively maintained with recent commits, responsive issue handling, and a growing user base? Abandoned servers may have unpatched vulnerabilities.',
    levels: [
      {
        score: 2,
        label: 'Active & Official',
        description:
          'Actively maintained by the project team or an official vendor. Recent commits, responsive issues, and significant GitHub activity. Backed by an organization.',
      },
      {
        score: 1,
        label: 'Community Maintained',
        description:
          'Maintained by community contributors. Some recent activity but may have slower response times. Not backed by an official organization.',
      },
      {
        score: 0,
        label: 'Stale / Unknown',
        description:
          'No recent commits, unresponsive issues, or unknown maintenance status. Security issues may go unpatched.',
      },
    ],
  },
];

export interface AgentHygieneScore {
  serverId: string;
  scores: {
    schema: number;      // 0-2
    scoping: number;     // 0-2
    boundaries: number;  // 0-2
    auditability: number; // 0-2
    maintenance: number; // 0-2
  };
  /** Total score (0-10) */
  total: number;
  /** Assessed date */
  assessedAt: string;
  /** Human-readable note per dimension, if needed */
  notes?: Record<string, string>;
}

function makeScore(
  serverId: string,
  schema: number,
  scoping: number,
  boundaries: number,
  auditability: number,
  maintenance: number,
  notes?: Record<string, string>
): AgentHygieneScore {
  return {
    serverId,
    scores: { schema, scoping, boundaries, auditability, maintenance },
    total: schema + scoping + boundaries + auditability + maintenance,
    assessedAt: '2026-08-12',
    notes,
  };
}

/**
 * Get score tier label based on total score (0-10)
 */
export function getHygieneTier(score: number): {
  label: string;
  color: string;
  emoji: string;
  description: string;
} {
  if (score >= 8) return { label: 'Excellent', color: '#22c55e', emoji: '🟢', description: 'Safe for autonomous agent use with broad permissions.' };
  if (score >= 6) return { label: 'Good', color: '#3b82f6', emoji: '🔵', description: 'Reasonable with scoped permissions. Review tool access before deploying.' };
  if (score >= 4) return { label: 'Fair', color: '#eab308', emoji: '🟡', description: 'Use with caution. Limit tool access and monitor agent behavior.' };
  return { label: 'Poor', color: '#ef4444', emoji: '🔴', description: 'Not recommended for autonomous agent use. Manually review every action.' };
}

/**
 * Scored flagship servers
 *
 * These are the initial 14 servers scored from public README/schema inspection.
 * Maintenance dimension reuses existing verification data (GitHub activity).
 */
export const agentHygieneScores: Record<string, AgentHygieneScore> = {
  // --- Excellent (8-10) ---

  'googleapis-genai-toolbox': makeScore(
    'googleapis-genai-toolbox',
    2, // Schema: typed, YAML tools with structured params
    2, // Scoping: IAM per-tool, toolsets, restricted access
    2, // Boundaries: structured queries, restricted access modes, security docs
    2, // Auditability: OpenTelemetry built-in, connection pooling
    2, // Maintenance: Google official, active
    { boundaries: 'Structured queries and restricted access modes documented. IAM integration.' }
  ),

  'github-official-mcp-new': makeScore(
    'github-official-mcp-new',
    2, // Schema: Go, typed inputs, enum constraints on toolsets
    2, // Scoping: OAuth2 with per-toolset configuration, GitHub PAT alternative
    2, // Boundaries: policies-and-governance.md, toolset scoping docs
    1, // Auditability: GitHub Actions logs exist, but no per-tool idempotency keys
    2, // Maintenance: GitHub official, 20.6k★
    { auditability: 'GitHub Actions / Copilot audit logs exist externally. No built-in idempotency keys in MCP layer.' }
  ),

  'microsoft-playwright-mcp': makeScore(
    'microsoft-playwright-mcp',
    2, // Schema: TypeScript, typed tool params
    2, // Scoping: local-only stdio, --allow/--deny for URL patterns
    2, // Boundaries: explicit allow/deny flags, local-only guarantee
    1, // Auditability: verbose mode available, no structured audit trail
    2, // Maintenance: Microsoft official, 16.7k★
    { auditability: 'Verbose mode logs actions to stdout. No structured audit or idempotency.', scoping: 'Local-only stdio means no network auth needed. URL allow/deny for web scope.' }
  ),

  'awslabs-mcp-official': makeScore(
    'awslabs-mcp-official',
    2, // Schema: typed inputs, IAM-aware parameters
    2, // Scoping: per-server IAM roles, per-tool IAM policies
    2, // Boundaries: Security section in README, scope documentation per server
    1, // Auditability: CloudTrail logging exists at AWS level, no per-tool MCP audit
    2, // Maintenance: AWS Labs official, 5.3k★
    { auditability: 'AWS CloudTrail provides audit at the API level. No idempotency keys at MCP layer.' }
  ),

  // --- Good (6-7) ---

  'fastmcp': makeScore(
    'fastmcp',
    2, // Schema: Python typed, auto-generates JSON Schema from type hints
    1, // Scoping: framework — scoping is the server author's job, not FastMCP's
    1, // Boundaries: well-documented but no explicit security policy doc
    1, // Auditability: no built-in logging/audit framework
    2, // Maintenance: 16k★, 1M+ daily downloads, Prefect-backed
    { scoping: 'As a framework, auth/scoping is delegated to server implementers. Horizon adds SSO/RBAC separately.', boundaries: 'Excellent documentation but no standalone security policy page.' }
  ),

  'serena-mcp': makeScore(
    'serena-mcp',
    2, // Schema: typed, symbol-level operations via LSP
    2, // Scoping: local-only, file/workspace-scoped operations
    1, // Boundaries: well-documented, but no explicit "won't do" security policy
    0, // Auditability: no built-in logging or idempotency
    2, // Maintenance: 8.3k★, active development
    { auditability: 'Operations are local file edits. No structured audit trail. LSP provides some safety net.', boundaries: 'File/workspace scoping is implicit via local-only architecture. No explicit security policy.' }
  ),

  // --- Fair (4-5) ---

  'upstash-context7': makeScore(
    'upstash-context7',
    1, // Schema: basic params for library/version lookups
    1, // Scoping: single API key, read-only but no per-tool scope
    1, // Boundaries: documented but no explicit security policy
    0, // Auditability: no logging or idempotency
    2, // Maintenance: 25.1k★, active
    { schema: 'Simple typed params (library name, version tokens). No enums for library names.' }
  ),

  'activepieces-mcp': makeScore(
    'activepieces-mcp',
    1, // Schema: basic params for workflow/execution tools
    1, // Scoping: single API key for all 280+ integrations
    1, // Boundaries: some docs, no explicit security policy
    0, // Auditability: no logging or idempotency
    2, // Maintenance: 16.3k★, active
    { scoping: 'One API key unlocks all 280+ integrations. No per-tool scoping.' }
  ),

  'mastra-docs': makeScore(
    'mastra-docs',
    1, // Schema: basic path/query params
    2, // Scoping: local docs only, no external auth needed
    1, // Boundaries: documented, but no security policy
    0, // Auditability: no logging
    1, // Maintenance: framework docs, maintained as part of Mastra ecosystem
    { maintenance: 'Maintained as part of the broader Mastra ecosystem. Not a standalone server.' }
  ),

  'figma-context-mcp': makeScore(
    'figma-context-mcp',
    1, // Schema: PAT-based, basic file/node params
    1, // Scoping: PAT grants full Figma access, no per-tool scope
    1, // Boundaries: some docs, no explicit security policy
    0, // Auditability: no logging or idempotency
    2, // Maintenance: 9.8k★, active
    { scoping: 'Figma PAT grants full read access to all files. No per-file or per-tool scoping.' }
  ),

  'playwright-browser-automation': makeScore(
    'playwright-browser-automation',
    1, // Schema: basic browser automation params
    2, // Scoping: local-only stdio, no network auth
    0, // Boundaries: minimal docs, no security policy
    0, // Auditability: no logging
    2, // Maintenance: 28.4k★, community project
    { boundaries: 'Community wrapper. No explicit security policy or scope documentation.', schema: 'Simpler schema than the Microsoft official version.' }
  ),

  'panel-1panel': makeScore(
    'panel-1panel',
    1, // Schema: basic params, some shell-string inputs
    1, // Scoping: API key = full panel access
    1, // Boundaries: documented tools, server management scope
    0, // Auditability: no logging or idempotency
    2, // Maintenance: 30.6k★, 1Panel official
    { scoping: 'One API key grants full 1Panel access (websites, databases, apps).', schema: 'Shell-string inputs flagged in existing security audit.' }
  ),

  // --- Poor (0-3) ---

  'zen-mcp-server': makeScore(
    'zen-mcp-server',
    1, // Schema: basic params for multi-tool server
    1, // Scoping: local-only, no auth
    0, // Boundaries: minimal docs, no security policy
    0, // Auditability: no logging
    1, // Maintenance: 6k★, community
    { boundaries: 'Minimal documentation. No explicit security policy or scope constraints.', scoping: 'Local-only helps, but mixed shell-string inputs are a risk factor.' }
  ),

  'ghidra-mcp': makeScore(
    'ghidra-mcp',
    1, // Schema: basic params for decompilation/analysis
    2, // Scoping: local-only, bound to Ghidra instance
    0, // Boundaries: no security policy, HTTP on localhost
    0, // Auditability: no logging
    1, // Maintenance: 5.6k★, community
    { boundaries: 'HTTP server on localhost with no auth. No documented security policy.', scoping: 'Local-only and bound to Ghidra, which limits scope naturally.' }
  ),
};

/**
 * Alternate ID aliases — match servers.json/D1 IDs to canonical hygiene key.
 * Copied from securityAudit.ts AUDIT_ID_ALIASES + additional static JSON IDs.
 */
const HYGIENE_ID_ALIASES: Record<string, string> = {
  // D1 / canonical aliases (matching securityAudit.ts)
  'github': 'github-official-mcp-new',
  'playwright': 'playwright-browser-automation',
  'playwright-mcp': 'microsoft-playwright-mcp',
  'aws-mcp': 'awslabs-mcp-official',
  'context7': 'upstash-context7',
  '1panel': 'panel-1panel',
  'activepieces': 'activepieces-mcp',
  'ghidramcp': 'ghidra-mcp',
  'zen': 'zen-mcp-server',
  'mindsdb': 'mindsdb-mcp',
  'fastmcp': 'fastmcp',
  'figma-context': 'figma-context-mcp',
  'chrome-mcp': 'mcp-chrome-hangwin',
  'whatsapp': 'whatsapp-mcp',
  'git-mcp': 'git-mcp-idosal',
  'serena': 'serena-mcp',
  // Static servers.json variants
  'secure-github-ops': 'github-official-mcp-new',
  'aws-cli': 'awslabs-mcp-official',
  'ghidra-bridge': 'ghidra-mcp',
  'ghidra': 'ghidra-mcp',
  'toolbox': 'googleapis-genai-toolbox',
  'zenmoney': 'zen-mcp-server',
  'playwright-scraper': 'playwright-browser-automation',
  'fastmcp-pdftools': 'fastmcp',
  'fastmcp-todo': 'fastmcp',
  'fastmcp-sql-tools': 'fastmcp',
};

/**
 * Get hygiene score for a server by ID (with alias resolution)
 */
export function getAgentHygieneScore(serverId: string): AgentHygieneScore | undefined {
  if (agentHygieneScores[serverId]) return agentHygieneScores[serverId];
  const aliasKey = HYGIENE_ID_ALIASES[serverId];
  if (aliasKey && agentHygieneScores[aliasKey]) return agentHygieneScores[aliasKey];
  return undefined;
}

/**
 * Get all scored server IDs
 */
export function getHygieneScoredServerIds(): string[] {
  return Object.keys(agentHygieneScores);
}
