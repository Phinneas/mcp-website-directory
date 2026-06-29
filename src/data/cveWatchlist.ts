/**
 * CVE/IOC Watchlist — curated from vulnerablemcp.info (50 entries),
 * NVD, GHSA, Snyk, and known malicious package campaigns.
 *
 * This data is loaded into the cve_watchlist D1 table by the seed-watchlist script.
 * The security scanner cross-references every listed server's npm_package and
 * github_url against this watchlist on each scan.
 *
 * Categories map to the attack patterns in the OWASP MCP Top 10:
 *   command_injection  — unsanitized exec/execSync/shell string construction
 *   rce                — remote code execution via crafted MCP input
 *   ssrf               — server-side request forgery via URL fetch tools
 *   path_traversal     — escaping configured directory boundaries
 *   prompt_injection   — tool descriptions containing hidden instructions
 *   tool_poisoning     — malicious tool descriptions that subvert agent behavior
 *   typosquat          — packages mimicking popular names to install malware
 *   malicious_package  — packages with deliberate backdoors/exfiltration
 *   dns_rebinding      — bypassing Same-Origin Policy on localhost SSE
 *   credential_theft   — exfiltrating API keys, SSH keys, tokens
 *   data_exfiltration  — silently sending user data to attacker endpoints
 *   auth_bypass        — circumventing authentication/authorization
 */

export interface WatchlistEntry {
  cve_id: string | null;
  package_name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  affected_versions: string;
  patched_versions: string | null;
  source: string;
  source_url: string | null;
  discovered_at: string;
  expires_at: string | null;
}

/**
 * The master watchlist. Sourced from:
 * - vulnerablemcp.info (50 entries, 13 critical)
 * - JFrog, Check Point, Snyk, Lakera, CyberArk, Imperva, Unit 42 research
 * - Known malicious campaigns: Sandworm_Mode, postmark-mcp
 */
export const CVE_WATCHLIST: WatchlistEntry[] = [
  // ── CRITICAL ──────────────────────────────────────────────────────────────

  // CVE-2026-25536: MCP TypeScript SDK Cross-Client Data Leak
  {
    cve_id: 'CVE-2026-25536',
    package_name: '@modelcontextprotocol/sdk',
    severity: 'critical',
    category: 'data_exfiltration',
    description: 'Cross-client data leak when McpServer with StreamableHTTPServerTransport is reused across multiple clients. One client may receive data intended for another. Affects v1.10.0-1.25.3. CVSS 7.1.',
    affected_versions: '>=1.10.0 <=1.25.3',
    patched_versions: '>=1.25.4',
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2026-25536-sdk-cross-client-data-leak.html',
    discovered_at: '2026-02-04',
    expires_at: null,
  },

  // CVE-2026-23744: MCPJam Inspector RCE
  {
    cve_id: 'CVE-2026-23744',
    package_name: '@mcpjam/inspector',
    severity: 'critical',
    category: 'rce',
    description: 'MCPJam inspector <=1.4.2 listens on 0.0.0.0 with no auth. Crafted HTTP request installs MCP server and executes arbitrary code. CVSS 9.8.',
    affected_versions: '<=1.4.2',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2026-23744-mcpjam-inspector-rce.html',
    discovered_at: '2026-02-01',
    expires_at: null,
  },

  // CVE-2025-68145/68143/68144: Anthropic Git MCP Server RCE Chain
  {
    cve_id: 'CVE-2025-68145',
    package_name: '@anthropic-ai/mcp-server-git',
    severity: 'critical',
    category: 'rce',
    description: 'Three chained vulns in Anthropic mcp-server-git: path validation bypass (68145), unrestricted git_init turning .ssh into git repo (68143), argument injection in git_diff (68144). Combined with Filesystem MCP = full RCE.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-68145-anthropic-git-mcp-rce-chain.html',
    discovered_at: '2026-01-20',
    expires_at: null,
  },

  // CVE-2026-0756: GitHub Kanban MCP Server RCE
  {
    cve_id: 'CVE-2026-0756',
    package_name: 'mcp-server-kanban',
    severity: 'critical',
    category: 'command_injection',
    description: 'Remote code execution via arbitrary command execution through MCP tool interface.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2026-0756-github-kanban-mcp-rce.html',
    discovered_at: '2026-01-20',
    expires_at: null,
  },

  // CVE-2026-0755: gemini-mcp-tool Command Injection
  {
    cve_id: 'CVE-2026-0755',
    package_name: 'gemini-mcp-tool',
    severity: 'critical',
    category: 'command_injection',
    description: 'Passes unsanitized user input to execAsync shell commands. Network-exploitable, no auth required. CVSS 9.8. Zero-day at time of disclosure.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2026-0755-gemini-mcp-command-injection.html',
    discovered_at: '2026-01-09',
    expires_at: null,
  },

  // CVE-2025-54994: Command Injection in create-mcp-server-stdio
  {
    cve_id: 'CVE-2025-54994',
    package_name: 'create-mcp-server-stdio',
    severity: 'critical',
    category: 'command_injection',
    description: 'Command injection in create-mcp-server-stdio allows arbitrary code execution during server scaffolding. CVSS 10.0.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-54994-command-injection-mcp-stdio.html',
    discovered_at: '2025-06-20',
    expires_at: null,
  },

  // CVE-2025-49596: MCP Inspector Remote Code Execution
  {
    cve_id: 'CVE-2025-49596',
    package_name: '@modelcontextprotocol/inspector',
    severity: 'critical',
    category: 'rce',
    description: 'MCP Inspector RCE — arbitrary code execution via the inspector interface. CVSS 10.0.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/mcp-inspector-rce-cve-2025-49596.html',
    discovered_at: '2025-06-13',
    expires_at: null,
  },

  // CVE-2025-6514: mcp-remote OS Command Injection
  {
    cve_id: 'CVE-2025-6514',
    package_name: 'mcp-remote',
    severity: 'critical',
    category: 'command_injection',
    description: 'mcp-remote proxy (0.0.5-0.1.15) allows full RCE on client OS via crafted authorization_endpoint from untrusted MCP server. 437,000+ installs affected. CVSS 9.6.',
    affected_versions: '>=0.0.5 <=0.1.15',
    patched_versions: '>=0.1.16',
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-6514-mcp-remote-rce.html',
    discovered_at: '2025-07-09',
    expires_at: null,
  },

  // CVE-2025-53355: Kubernetes MCP Server Command Injection
  {
    cve_id: 'CVE-2025-53355',
    package_name: 'mcp-server-kubernetes',
    severity: 'critical',
    category: 'command_injection',
    description: 'Unsanitized input in execSync calls within kubectl_scale, kubectl_patch, and explain_resource tools. Shell metacharacters allow arbitrary command execution. CVSS 7.5.',
    affected_versions: '<=2.4.9',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-53355-k8s-mcp-command-injection.html',
    discovered_at: '2025-07-08',
    expires_at: null,
  },

  // CVE-2025-65513: Fetch MCP Server SSRF
  {
    cve_id: 'CVE-2025-65513',
    package_name: 'mcp-fetch-server',
    severity: 'critical',
    category: 'ssrf',
    description: 'is_ip_private() fails to validate private IPs, allowing SSRF to internal services. CVSS 9.3.',
    affected_versions: '<=1.0.2',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-65513-fetch-mcp-ssrf.html',
    discovered_at: '2025-12-09',
    expires_at: null,
  },

  // Zero-Click RCE via Google Docs MCP
  {
    cve_id: null,
    package_name: 'gdrive-mcp',
    severity: 'critical',
    category: 'prompt_injection',
    description: 'Malicious Google Doc with embedded prompt injection auto-executes when Cursor fetches via Google Docs MCP. Zero-click RCE, credential theft, persistent access.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/zero-click-rce-google-docs-mcp.html',
    discovered_at: '2025-09-05',
    expires_at: null,
  },

  // thirdweb MCP Unauthorized Crypto Transactions
  {
    cve_id: null,
    package_name: 'thirdweb-mcp',
    severity: 'critical',
    category: 'credential_theft',
    description: 'Enables unauthorized cryptocurrency transactions from connected wallets without proper authorization.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/thirdweb-mcp-unauthorized-crypto.html',
    discovered_at: '2025-09-03',
    expires_at: null,
  },

  // Tool Poisoning to RCE (Rug Pull Method)
  {
    cve_id: null,
    package_name: '*',
    severity: 'critical',
    category: 'tool_poisoning',
    description: 'Generic: tool poisoning attacks can achieve RCE via rug pull method — silently redefining tool behavior after initial approval to execute arbitrary code.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/tool-poisoning-rce-rug-pull.html',
    discovered_at: '2025-04-17',
    expires_at: null,
  },

  // ── MALICIOUS PACKAGES / CAMPAIGNS ─────────────────────────────────────

  // postmark-mcp: First malicious MCP in the wild
  {
    cve_id: null,
    package_name: 'postmark-mcp',
    severity: 'critical',
    category: 'malicious_package',
    description: 'First known malicious MCP server. Silently BCC\'d every email sent by AI agents to attacker address. Typosquat of legitimate Postmark service.',
    affected_versions: '*',
    patched_versions: null,
    source: 'snyk',
    source_url: 'https://snyk.io/blog/malicious-mcp-server-on-npm-postmark-mcp-harvests-emails/',
    discovered_at: '2025-09-25',
    expires_at: null,
  },

  // Sandworm_Mode campaign
  {
    cve_id: null,
    package_name: 'sandworm-mcp',
    severity: 'critical',
    category: 'typosquat',
    description: 'Sandworm_Mode campaign: typosquatted legitimate npm packages to install rogue MCP servers. Exfiltrated SSH keys, AWS credentials, and npm tokens.',
    affected_versions: '*',
    patched_versions: null,
    source: 'snyk',
    source_url: null,
    discovered_at: '2025-09-20',
    expires_at: null,
  },

  // ── HIGH ──────────────────────────────────────────────────────────────────

  // CVE-2025-54136: MCPoison (Cursor)
  {
    cve_id: 'CVE-2025-54136',
    package_name: 'cursor',
    severity: 'high',
    category: 'tool_poisoning',
    description: 'Cursor IDE <=1.2.4 trusts previously approved MCP configs indefinitely without re-approval on modification. Bait-and-switch enables persistent RCE. CVSS 7.2-8.8.',
    affected_versions: '<=1.2.4',
    patched_versions: '>=1.2.5',
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-54136-cursor-mcpoison.html',
    discovered_at: '2025-08-01',
    expires_at: null,
  },

  // CVE-2025-54135: CurXecute (Cursor)
  {
    cve_id: 'CVE-2025-54135',
    package_name: 'cursor',
    severity: 'high',
    category: 'rce',
    description: 'CurXecute: unverified configuration modification in Cursor allows RCE via MCP definition bypass. CVSS 7.2.',
    affected_versions: '<=1.2.4',
    patched_versions: '>=1.2.5',
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-54135-curxecute.html',
    discovered_at: '2025-08-01',
    expires_at: null,
  },

  // CVE-2025-53967: Framelink Figma MCP RCE
  {
    cve_id: 'CVE-2025-53967',
    package_name: 'figma-developer-mcp',
    severity: 'high',
    category: 'command_injection',
    description: 'Command injection in fetch-with-retry.ts: falls back to child_process.exec(curl) without URL sanitization. 600K+ downloads, 10K+ stars. CVSS 8.0.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-53967-figma-mcp-rce.html',
    discovered_at: '2025-10-01',
    expires_at: null,
  },

  // CVE-2025-53372: Docker Sandbox Escape
  {
    cve_id: 'CVE-2025-53372',
    package_name: 'node-code-sandbox-mcp',
    severity: 'high',
    category: 'rce',
    description: 'Command injection bypassing Docker sandbox via unsanitized execSync. Exploitable through indirect prompt injection. CVSS 7.5.',
    affected_versions: '<=1.2.0',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-53372-sandbox-escape-mcp.html',
    discovered_at: '2025-07-08',
    expires_at: null,
  },

  // CVE-2025-59944: Cursor Case-Sensitivity Bypass
  {
    cve_id: 'CVE-2025-59944',
    package_name: 'cursor',
    severity: 'high',
    category: 'auth_bypass',
    description: 'Case-sensitivity bug allows bypassing file protection on case-insensitive filesystems to inject malicious MCP servers into .cursor/mcp.json.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-59944-cursor-case-sensitivity-bypass.html',
    discovered_at: '2025-10-10',
    expires_at: null,
  },

  // CVE-2025-66689: Zen MCP Path Traversal
  {
    cve_id: 'CVE-2025-66689',
    package_name: 'zen-mcp-server',
    severity: 'high',
    category: 'path_traversal',
    description: 'is_dangerous_path() uses exact string matching against blacklist, allowing trivial bypass via subdirectory traversal. Reads SSH keys and API credentials.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-66689-zen-mcp-path-traversal.html',
    discovered_at: '2026-01-15',
    expires_at: null,
  },

  // CVE-2025-67366: filesystem-mcp Path Traversal
  {
    cve_id: 'CVE-2025-67366',
    package_name: 'filesystem-mcp',
    severity: 'high',
    category: 'path_traversal',
    description: 'Escapes configured directory boundaries to read or write arbitrary files on host.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-67366-filesystem-mcp-path-traversal.html',
    discovered_at: '2026-01-15',
    expires_at: null,
  },

  // CVE-2025-66414/66416: DNS Rebinding in Official MCP SDKs
  {
    cve_id: 'CVE-2025-66414',
    package_name: '@modelcontextprotocol/sdk',
    severity: 'high',
    category: 'dns_rebinding',
    description: 'Official TypeScript SDK <1.24.0 lacks DNS rebinding protection for localhost-bound SSE/StreamableHTTP servers. Malicious websites pivot to local MCP servers.',
    affected_versions: '<1.24.0',
    patched_versions: '>=1.24.0',
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-66414-66416-dns-rebinding-mcp-sdks.html',
    discovered_at: '2025-07-10',
    expires_at: null,
  },

  // CVE-2025-59163: Vet MCP Server DNS Rebinding
  {
    cve_id: 'CVE-2025-59163',
    package_name: 'vet-mcp',
    severity: 'high',
    category: 'dns_rebinding',
    description: 'DNS rebinding in SSE transport allows external websites to interact with locally running MCP server, bypassing Same-Origin Policy.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cve-2025-59163-vet-mcp-dns-rebinding.html',
    discovered_at: '2025-10-06',
    expires_at: null,
  },

  // Microsoft MarkItDown SSRF
  {
    cve_id: null,
    package_name: 'markitdown-mcp',
    severity: 'high',
    category: 'ssrf',
    description: 'Unpatched SSRF can compromise AWS EC2 instances via metadata service. Fetches arbitrary URLs without validation. Microsoft classified as low-risk despite EC2 metadata access.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/microsoft-markitdown-mcp-ssrf.html',
    discovered_at: '2026-01-20',
    expires_at: null,
  },

  // Microsoft Learn MCP SSRF
  {
    cve_id: null,
    package_name: 'microsoft-learn-mcp',
    severity: 'high',
    category: 'ssrf',
    description: 'microsoft_docs_fetch tool lacks URL validation, allowing requests to any host instead of microsoft.com. Enables SSRF via MCP server.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/tra-2025-36-microsoft-learn-mcp-ssrf.html',
    discovered_at: '2025-09-19',
    expires_at: null,
  },

  // Grafana MCP Unauthenticated SSE
  {
    cve_id: null,
    package_name: 'grafana-mcp',
    severity: 'high',
    category: 'auth_bypass',
    description: 'Binds to 0.0.0.0:8000 with unauthenticated SSE interface. Network attackers can create, update, delete dashboards without credentials.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/grafana-mcp-unauthenticated-sse-access.html',
    discovered_at: '2025-09-02',
    expires_at: null,
  },

  // Universal Output Poisoning
  {
    cve_id: null,
    package_name: '*',
    severity: 'high',
    category: 'tool_poisoning',
    description: 'All MCP output vectors (return values, errors, metadata, resources, logging) can carry hidden prompt injection payloads. No output channel is safe.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cyberark-universal-output-poisoning.html',
    discovered_at: '2025-07-18',
    expires_at: null,
  },

  // Cursor + Jira MCP 0-Click Credential Exfiltration
  {
    cve_id: null,
    package_name: 'jira-mcp',
    severity: 'high',
    category: 'credential_theft',
    description: 'Malicious Jira tickets with obfuscated prompt injection trick Cursor into leaking JWT tokens and credentials. Zero-click.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cursor-jira-mcp-zero-click.html',
    discovered_at: '2025-08-20',
    expires_at: null,
  },

  // Neo4j MCP DNS Rebinding
  {
    cve_id: null,
    package_name: 'mcp-neo4j',
    severity: 'high',
    category: 'dns_rebinding',
    description: 'DNS rebinding bypasses Same-Origin Policy enabling unauthorized tool invocations and complete database takeover of locally running Neo4j. CVSS 7.4.',
    affected_versions: '>=0.2.2 <=0.3.1',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/neo4j-mcp-dns-rebinding-database-takeover.html',
    discovered_at: '2025-09-11',
    expires_at: null,
  },

  // WhatsApp MCP Message Exfiltration
  {
    cve_id: null,
    package_name: 'whatsapp-mcp',
    severity: 'high',
    category: 'data_exfiltration',
    description: 'WhatsApp MCP server enables message exfiltration through MCP tool interface.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/whatsapp-message-exfiltration.html',
    discovered_at: '2025-04-07',
    expires_at: null,
  },

  // GitHub MCP Private Repo Data Exfiltration
  {
    cve_id: null,
    package_name: '@modelcontextprotocol/server-github',
    severity: 'high',
    category: 'data_exfiltration',
    description: 'GitHub MCP server can be exploited to exfiltrate data from private repositories.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/github-mcp-exploit.html',
    discovered_at: '2025-05-26',
    expires_at: null,
  },

  // MCP Registry Hijacking (Supply Chain)
  {
    cve_id: null,
    package_name: '*',
    severity: 'high',
    category: 'malicious_package',
    description: 'Academic analysis of 67,057 MCP servers across 6 registries found substantial number can be hijacked due to lack of vetted submission. Untrusted servers exfiltrate data from co-connected trusted servers.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/mcp-registry-hijacking.html',
    discovered_at: '2025-10-18',
    expires_at: null,
  },

  // Rogue MCP Browser Injection in Cursor
  {
    cve_id: null,
    package_name: 'cursor',
    severity: 'high',
    category: 'rce',
    description: 'Malicious MCP server injects JavaScript into Cursor built-in browser. No integrity checks on runtime components loaded through MCP.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/cursor-browser-injection-rogue-mcp.html',
    discovered_at: '2025-07-22',
    expires_at: null,
  },

  // Conversation History Theft
  {
    cve_id: null,
    package_name: '*',
    severity: 'high',
    category: 'data_exfiltration',
    description: 'MCP servers can access and exfiltrate conversation history from the agent context window.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/conversation-history-theft.html',
    discovered_at: '2025-04-23',
    expires_at: null,
  },

  // Amp AI Agent API Key Exfiltration
  {
    cve_id: null,
    package_name: 'amp-mcp',
    severity: 'high',
    category: 'credential_theft',
    description: 'Prompt injection exfiltrates API keys from Amp AI Agent environment. Sends credentials to attacker-controlled endpoints.',
    affected_versions: '*',
    patched_versions: null,
    source: 'vulnerablemcp.info',
    source_url: 'https://vulnerablemcp.info/vuln/amp-ai-agent-api-key-exfiltration.html',
    discovered_at: '2025-10-03',
    expires_at: null,
  },
];

/**
 * Package name aliases — maps server IDs to npm packages that appear in the watchlist.
 * This is used by the scanner to cross-reference servers that don't have an npm_package
 * column value matching the watchlist entry.
 */
export const PACKAGE_ALIASES: Record<string, string[]> = {
  'github-official-mcp-new': ['@modelcontextprotocol/server-github', '@anthropic-ai/mcp-server-git'],
  'microsoft-playwright-mcp': ['@anthropic-ai/mcp-server-playwright'],
  'figma-context-mcp': ['figma-developer-mcp', '@anthropic-ai/mcp-server-figma'],
  'upstash-context7': ['@upstash/context7-mcp'],
  'zen-mcp-server': ['zen-mcp-server'],
  'whatsapp-mcp': ['whatsapp-mcp'],
  'mcp-inspector': ['@modelcontextprotocol/inspector'],
  'awslabs-mcp-official': ['@aws/mcp-server'],
  'gdrive-mcp': ['gdrive-mcp'],
  'slack-mcp': ['@modelcontextprotocol/server-slack'],
  'notion-mcp-official': ['@modelcontextprotocol/server-notion'],
  'brave-search-mcp': ['@anthropic-ai/mcp-server-brave-search'],
  'postgres-mcp': ['@anthropic-ai/mcp-server-postgres'],
  'sqlite-mcp': ['@anthropic-ai/mcp-server-sqlite'],
  'puppeteer-mcp': ['@anthropic-ai/mcp-server-puppeteer'],
};

/**
 * Cross-reference a server's npm_package and github_url against the watchlist.
 * Returns matching entries with their severity and category.
 */
export function matchWatchlist(
  npmPackage: string | null,
  githubUrl: string | null,
  serverId: string,
  aliases: Record<string, string[]> = PACKAGE_ALIASES
): WatchlistEntry[] {
  const matches: WatchlistEntry[] = [];
  const checkedPackages = new Set<string>();

  // Collect all package names to check
  const packagesToCheck: string[] = [];
  if (npmPackage) packagesToCheck.push(npmPackage);
  if (aliases[serverId]) packagesToCheck.push(...aliases[serverId]);

  // Extract org/repo from github_url for matching
  let githubRepo: string | null = null;
  if (githubUrl) {
    const match = githubUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (match) githubRepo = match[1].toLowerCase();
  }

  for (const entry of CVE_WATCHLIST) {
    const entryPkg = entry.package_name.toLowerCase();

    // Skip wildcard entries that match everything — those are pattern-level, not package-level
    if (entry.package_name === '*') continue;

    // Direct package name match
    if (packagesToCheck.some(p => p.toLowerCase() === entryPkg)) {
      if (!checkedPackages.has(entryPkg)) {
        matches.push(entry);
        checkedPackages.add(entryPkg);
      }
      continue;
    }

    // GitHub repo path match
    if (githubRepo && entryPkg.includes('/')) {
      if (entryPkg.includes(githubRepo)) {
        if (!checkedPackages.has(entryPkg)) {
          matches.push(entry);
          checkedPackages.add(entryPkg);
        }
      }
    }
  }

  return matches;
}

/**
 * Get the highest severity from a list of watchlist matches.
 */
export function getHighestSeverity(matches: WatchlistEntry[]): 'critical' | 'high' | 'medium' | 'low' | null {
  const order = ['critical', 'high', 'medium', 'low'] as const;
  for (const sev of order) {
    if (matches.some(m => m.severity === sev)) return sev;
  }
  return null;
}
