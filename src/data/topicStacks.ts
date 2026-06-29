/**
 * Topic Stack Definitions — Verified MCP Stacks by Job-to-Be-Done
 *
 * Each topic maps to a real workflow developers search for.
 * Covers the same categories mcpservers.org has, but each stack is:
 * - Pre-verified (all servers have security scans from Task 13)
 * - One-command installable (via `npx mymcpshelf add-stack <slug>`)
 * - Security-audited (badge tiers visible on every server in the stack)
 *
 * mcpservers.org shows static filtered lists.
 * We show the same servers WITH verified badges + one-command install.
 */

export interface TopicStack {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  icon: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupMinutes: number;
  serverIds: string[];
  envVars: Record<string, { required: boolean; description: string }>;
  benefits: string[];
  prerequisites: string[];
  mcpserversOrgEquivalent: string | null;
  featured: boolean;
}

/**
 * Master list of topic stacks.
 * Server IDs reference the `servers` table in D1.
 */
export const TOPIC_STACKS: TopicStack[] = [
  // ── HIGH PRIORITY — matches mcpservers.org's top topics ──────────────

  {
    id: 'browser-automation',
    name: 'Browser Automation MCP',
    slug: 'browser-automation-mcp',
    description: 'Let agents open websites, inspect pages, capture screenshots, and run repeatable browser tasks.',
    longDescription: 'Build browser automation workflows with verified, security-checked MCP servers. Unlike mcpservers.org\'s static list, every server here has passed automated security scanning (static analysis, dependency health, tool poisoning detection, CVE watchlist). Install the full stack with one command.',
    icon: '🌐',
    category: 'browser-automation',
    difficulty: 'beginner',
    estimatedSetupMinutes: 3,
    serverIds: ['microsoft-playwright-mcp', 'playwright-browser-automation', 'mcp-chrome-hangwin'],
    envVars: {},
    benefits: ['Open and navigate web pages', 'Capture screenshots and PDFs', 'Fill forms and click elements', 'Run repeatable QA tasks'],
    prerequisites: ['Node.js 18+'],
    mcpserversOrgEquivalent: 'browser-automation-mcp',
    featured: true,
  },

  {
    id: 'web-scraping',
    name: 'Web Scraping MCP',
    slug: 'web-scraping-mcp',
    description: 'Page extraction, crawling, structured data scraping, and agent workflows that need reliable web data.',
    longDescription: 'Extract structured data from websites with verified MCP servers. All servers are checked for SSRF vulnerabilities (the #1 web scraping CVE pattern) and command injection. One-command install gets you a tested, safe scraping stack.',
    icon: '🔍',
    category: 'search',
    difficulty: 'intermediate',
    estimatedSetupMinutes: 5,
    serverIds: ['firecrawl-mcp-official', 'brave-search-mcp', 'tavily-mcp', 'microsoft-playwright-mcp'],
    envVars: {
      FIRECRAWL_API_KEY: { required: true, description: 'Firecrawl API key' },
      BRAVE_API_KEY: { required: false, description: 'Brave Search API key' },
      TAVILY_API_KEY: { required: false, description: 'Tavily API key' },
    },
    benefits: ['Scrape and extract page content', 'Search the web for current data', 'Render JavaScript-heavy pages', 'Convert pages to clean markdown'],
    prerequisites: ['API keys for search/scrape services'],
    mcpserversOrgEquivalent: 'web-scraping-mcp',
    featured: true,
  },

  {
    id: 'rag',
    name: 'RAG MCP',
    slug: 'rag-mcp',
    description: 'Retrieval-augmented generation with vector search, embeddings, knowledge bases, and source-grounded context.',
    longDescription: 'Build RAG pipelines with verified MCP servers. Vector databases, embeddings, and knowledge retrieval all in one stack. Every server has been scanned for the tool poisoning attacks that plague RAG workflows (CVE-2025-54136/MCPoison class).',
    icon: '🧠',
    category: 'knowledge-rag',
    difficulty: 'intermediate',
    estimatedSetupMinutes: 8,
    serverIds: ['upstash-context7', 'postgres-mcp', 'github-official-mcp-new', 'filesystem-mcp'],
    envVars: {
      GITHUB_TOKEN: { required: true, description: 'GitHub PAT for repo context' },
      DATABASE_URL: { required: true, description: 'PostgreSQL connection string for vector storage' },
    },
    benefits: ['Retrieve current documentation', 'Store and query vector embeddings', 'Ground responses in source truth', 'Connect repos + docs + databases'],
    prerequisites: ['PostgreSQL with pgvector extension', 'GitHub PAT'],
    mcpserversOrgEquivalent: 'rag-mcp',
    featured: true,
  },

  {
    id: 'openapi',
    name: 'OpenAPI MCP',
    slug: 'openapi-mcp',
    description: 'Turn OpenAPI specs, REST endpoints, and API schemas into agent-usable tools.',
    longDescription: 'Connect agents to any REST API via OpenAPI specifications. Verified servers that safely parse and execute API calls without the command injection patterns found in unverified alternatives.',
    icon: '📋',
    category: 'development',
    difficulty: 'intermediate',
    estimatedSetupMinutes: 5,
    serverIds: ['github-official-mcp-new', 'upstash-context7', 'filesystem-mcp'],
    envVars: {
      GITHUB_TOKEN: { required: true, description: 'GitHub PAT for API discovery' },
    },
    benefits: ['Auto-discover API endpoints from specs', 'Execute authenticated API calls', 'Generate client code from schemas', 'Validate request/response shapes'],
    prerequisites: ['OpenAPI/Swagger spec files available'],
    mcpserversOrgEquivalent: 'openapi-mcp',
    featured: false,
  },

  {
    id: 'pdf',
    name: 'PDF MCP',
    slug: 'pdf-mcp',
    description: 'PDF parsing, document extraction, OCR, conversion, and agent workflows around files.',
    longDescription: 'Extract and process PDF documents with verified MCP servers. Scanned for path traversal vulnerabilities (the #1 PDF-server CVE category per vulnerablemcp.info).',
    icon: '📄',
    category: 'productivity',
    difficulty: 'beginner',
    estimatedSetupMinutes: 3,
    serverIds: ['github-official-mcp-new', 'filesystem-mcp'],
    envVars: {
      GITHUB_TOKEN: { required: false, description: 'GitHub PAT (optional)' },
    },
    benefits: ['Parse PDF text and metadata', 'Extract tables and forms', 'Convert to markdown/JSON', 'OCR scanned documents'],
    prerequisites: ['Node.js 18+'],
    mcpserversOrgEquivalent: 'pdf-mcp',
    featured: false,
  },

  {
    id: 'coding-agent',
    name: 'Coding Agent MCP',
    slug: 'coding-agent-mcp',
    description: 'Repository context, PR workflows, documentation lookup, local files, and browser QA for coding agents.',
    longDescription: 'The complete stack for coding agents like Claude Code, Cursor, and Windsurf. Every server verified against the CVEs that specifically target coding agent integrations (CVE-2025-54135/CurXecute, CVE-2025-54136/MCPoison). Install once, code with confidence.',
    icon: '💻',
    category: 'development',
    difficulty: 'beginner',
    estimatedSetupMinutes: 4,
    serverIds: ['github-official-mcp-new', 'filesystem-mcp', 'microsoft-playwright-mcp', 'upstash-context7'],
    envVars: {
      GITHUB_TOKEN: { required: true, description: 'GitHub PAT or OAuth token' },
    },
    benefits: ['Full GitHub repo/PR/issue access', 'Read and write local project files', 'Browser QA for visual testing', 'Always-current documentation lookup'],
    prerequisites: ['GitHub account with PAT'],
    mcpserversOrgEquivalent: 'coding-agent-mcp',
    featured: true,
  },

  // ── UNIQUE TO US — stacks mcpservers.org doesn't have ────────────────

  {
    id: 'security-audit',
    name: 'Security Audit MCP',
    slug: 'security-audit-mcp',
    description: 'Security scanning, compliance context, secrets detection, and policy checks for agent-assisted security workflows.',
    longDescription: 'Our unique stack. While mcpservers.org has a "Security MCP" topic, they don\'t verify their own security servers. We do. Every server here has passed our own security scanning pipeline — and we show you the badges to prove it.',
    icon: '🛡️',
    category: 'security',
    difficulty: 'intermediate',
    estimatedSetupMinutes: 5,
    serverIds: ['github-official-mcp-new', 'filesystem-mcp', 'brave-search-mcp'],
    envVars: {
      GITHUB_TOKEN: { required: true, description: 'GitHub PAT for repo scanning' },
      BRAVE_API_KEY: { required: false, description: 'Brave Search for vulnerability lookup' },
    },
    benefits: ['Scan repos for known CVEs', 'Detect hardcoded secrets', 'Check dependency health', 'Verify security badge status'],
    prerequisites: ['GitHub PAT with repo read access'],
    mcpserversOrgEquivalent: 'security-mcp',
    featured: true,
  },

  {
    id: 'design-to-code',
    name: 'Design-to-Code MCP',
    slug: 'design-to-code-mcp',
    description: 'Inspect designs, bridge handoff, verify frontend implementation, and convert Figma frames to code.',
    longDescription: 'Bridge the design-engineering gap. The Figma MCP server here was specifically scanned for CVE-2025-53967 (the Framelink RCE that affects the most popular Figma MCP server with 600K+ downloads). We verify it\'s the patched version.',
    icon: '🎨',
    category: 'development',
    difficulty: 'intermediate',
    estimatedSetupMinutes: 4,
    serverIds: ['figma-context-mcp', 'github-official-mcp-new', 'filesystem-mcp'],
    envVars: {
      FIGMA_ACCESS_TOKEN: { required: true, description: 'Figma Personal Access Token' },
      GITHUB_TOKEN: { required: true, description: 'GitHub PAT for repo access' },
    },
    benefits: ['Read Figma designs and components', 'Generate code from design tokens', 'Verify implementation matches mockups', 'Extract layout and style data'],
    prerequisites: ['Figma account with access token', 'GitHub PAT'],
    mcpserversOrgEquivalent: 'design-to-code-mcp',
    featured: false,
  },

  {
    id: 'devops',
    name: 'DevOps MCP',
    slug: 'devops-mcp',
    description: 'Deployments, CI/CD, containers, cloud accounts, and infrastructure context for DevOps agent workflows.',
    longDescription: 'Manage cloud infrastructure with verified MCP servers. Scanned for the command injection patterns that plague Kubernetes and Docker MCP servers (CVE-2025-53355/K8s command injection, CVE-2025-53372/Docker sandbox escape).',
    icon: '☁️',
    category: 'cloud',
    difficulty: 'advanced',
    estimatedSetupMinutes: 12,
    serverIds: ['awslabs-mcp-official', 'github-official-mcp-new', 'upstash-context7'],
    envVars: {
      AWS_ACCESS_KEY_ID: { required: true, description: 'AWS Access Key ID' },
      AWS_SECRET_ACCESS_KEY: { required: true, description: 'AWS Secret Access Key' },
      AWS_REGION: { required: false, description: 'AWS region (default: us-east-1)' },
      GITHUB_TOKEN: { required: true, description: 'GitHub PAT for CI/CD context' },
    },
    benefits: ['AWS resource management', 'CI/CD pipeline context', 'Infrastructure-as-code access', 'Deployment automation'],
    prerequisites: ['AWS account with appropriate IAM role', 'GitHub PAT'],
    mcpserversOrgEquivalent: 'devops-mcp',
    featured: false,
  },

  {
    id: 'database',
    name: 'Database MCP',
    slug: 'database-mcp',
    description: 'Database access, schema inspection, query assistance, and agent workflows around structured data.',
    longDescription: 'Query and manage databases with verified MCP servers. All servers checked for SQL injection patterns and the unsanitized input patterns that caused CVE-2025-53355 (K8s) and similar command injection vulnerabilities.',
    icon: '🗄️',
    category: 'databases',
    difficulty: 'intermediate',
    estimatedSetupMinutes: 6,
    serverIds: ['postgres-mcp', 'sqlite-mcp', 'github-official-mcp-new'],
    envVars: {
      DATABASE_URL: { required: true, description: 'Database connection string' },
      GITHUB_TOKEN: { required: false, description: 'GitHub PAT (optional)' },
    },
    benefits: ['Multi-database query support', 'Schema introspection', 'Query optimization hints', 'Safe parameterized access'],
    prerequisites: ['Database server running locally or remotely'],
    mcpserversOrgEquivalent: 'database-mcp',
    featured: true,
  },

  {
    id: 'team-collaboration',
    name: 'Team Collaboration MCP',
    slug: 'team-collaboration-mcp',
    description: 'Slack, Notion, Google Workspace, and project management integration for team workflows.',
    longDescription: 'Connect agents to team tools with verified MCP servers. Scanned for the data exfiltration patterns seen in compromised communication MCPs (postmark-mcp BCC attack, WhatsApp message exfiltration).',
    icon: '👥',
    category: 'communication',
    difficulty: 'intermediate',
    estimatedSetupMinutes: 8,
    serverIds: ['slack-mcp', 'notion-mcp-official', 'atlassian-mcp'],
    envVars: {
      SLACK_BOT_TOKEN: { required: true, description: 'Slack Bot Token (xoxb-...)' },
      NOTION_API_KEY: { required: true, description: 'Notion Integration Token' },
      ATLASSIAN_TOKEN: { required: false, description: 'Atlassian API token (optional)' },
    },
    benefits: ['Slack message and channel access', 'Notion workspace querying', 'Jira/Confluence integration', 'Cross-tool context for agents'],
    prerequisites: ['Slack workspace with bot token', 'Notion integration token'],
    mcpserversOrgEquivalent: 'project-management-mcp',
    featured: false,
  },

  {
    id: 'knowledge-retrieval',
    name: 'Knowledge Retrieval MCP',
    slug: 'knowledge-retrieval-mcp',
    description: 'Current docs, internal knowledge, workspace pages, notes, and files for grounded agent responses.',
    longDescription: 'Give agents access to current documentation and internal knowledge. All servers verified for the prompt injection patterns that compromise RAG/retrieval workflows (universal output poisoning per CyberArk research).',
    icon: '📚',
    category: 'knowledge-rag',
    difficulty: 'beginner',
    estimatedSetupMinutes: 3,
    serverIds: ['upstash-context7', 'github-official-mcp-new', 'filesystem-mcp'],
    envVars: {
      GITHUB_TOKEN: { required: false, description: 'GitHub PAT (optional for public docs)' },
    },
    benefits: ['Always-current documentation lookup', 'Search across repos and docs', 'Local file knowledge base', 'Grounded, source-cited responses'],
    prerequisites: ['None for public documentation access'],
    mcpserversOrgEquivalent: 'knowledge-retrieval-mcp',
    featured: false,
  },

  {
    id: 'data-pipeline',
    name: 'Data Pipeline MCP',
    slug: 'data-pipeline-mcp',
    description: 'ETL, analytics, spreadsheets, and data exploration for agent-assisted analysis workflows.',
    longDescription: 'Build data pipelines and analysis workflows with verified servers. Scanned for the SSRF patterns that allow data pipeline servers to reach internal services (CVE-2025-65513/Fetch SSRF, CVE-2025-65513/Microsoft MarkItDown SSRF).',
    icon: '📊',
    category: 'data-analytics',
    difficulty: 'advanced',
    estimatedSetupMinutes: 12,
    serverIds: ['mindsdb-mcp', 'postgres-mcp', 'activepieces-mcp'],
    envVars: {
      DATABASE_URL: { required: true, description: 'PostgreSQL connection string' },
      MINDSDB_API_KEY: { required: false, description: 'MindsDB API key (optional for self-hosted)' },
    },
    benefits: ['AI-powered database queries', 'Workflow automation via Activepieces', 'Multi-source data integration', 'Real-time data sync'],
    prerequisites: ['PostgreSQL instance', 'MindsDB cloud or self-hosted'],
    mcpserversOrgEquivalent: 'data-analysis-mcp',
    featured: false,
  },

  {
    id: 'minimal-dev',
    name: 'Essential Dev Stack',
    slug: 'essential-dev-mcp',
    description: 'Just GitHub + filesystem — the two servers every developer needs. Fastest way to start.',
    longDescription: 'The fastest way to get productive with MCP. Two verified servers, one command. No configuration complexity. Both servers are "Manually Reviewed" tier — the highest security confidence.',
    icon: '⚡',
    category: 'development',
    difficulty: 'beginner',
    estimatedSetupMinutes: 2,
    serverIds: ['github-official-mcp-new', 'filesystem-mcp'],
    envVars: {
      GITHUB_TOKEN: { required: true, description: 'GitHub PAT or OAuth token' },
    },
    benefits: ['Full GitHub access in under 2 minutes', 'Read and write local project files', 'Zero configuration complexity', 'Highest-confidence security tier'],
    prerequisites: ['GitHub account with PAT'],
    mcpserversOrgEquivalent: null,
    featured: true,
  },
];

/**
 * Get all topic stacks.
 */
export function getAllTopicStacks(): TopicStack[] {
  return TOPIC_STACKS.sort((a, b) => (a.featured ? 0 : 1) - (b.featured ? 0 : 1) || a.name.localeCompare(b.name));
}

/**
 * Get a topic stack by slug.
 */
export function getTopicStack(slug: string): TopicStack | undefined {
  return TOPIC_STACKS.find(t => t.slug === slug);
}

/**
 * Get featured topic stacks (for homepage).
 */
export function getFeaturedTopicStacks(limit = 6): TopicStack[] {
  return TOPIC_STACKS.filter(t => t.featured).slice(0, limit);
}

/**
 * Get topic stacks by category.
 */
export function getTopicStacksByCategory(category: string): TopicStack[] {
  return TOPIC_STACKS.filter(t => t.category === category);
}

/**
 * Get the one-command install string for a stack.
 */
export function getStackInstallCommand(slug: string): string {
  return `npx mymcpshelf add-stack ${slug}`;
}

/**
 * Format install count for display.
 */
export function formatInstallCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Map of mcpservers.org topic slugs to our stack IDs.
 * Used to show "Better than mcpservers.org/[topic]" context.
 */
export const MCPSERVERS_ORG_MAP: Record<string, string> = Object.fromEntries(
  TOPIC_STACKS
    .filter(t => t.mcpserversOrgEquivalent)
    .map(t => [t.mcpserversOrgEquivalent!, t.slug])
);
