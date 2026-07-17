/**
 * Agent-specific "Best MCP Servers for [Agent]" page configuration.
 *
 * Each entry drives a programmatic page at /best-mcp-servers-for/{slug}
 * with verified server picks, one-command install, agent-specific config,
 * and security context.
 */

export interface AgentPageConfig {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  configClientKey: 'claude-desktop' | 'cursor' | 'cline' | 'continue' | 'vscode' | 'windsurf' | 'zed' | 'roo' | 'copilot' | 'gemini';
  configPath: string;
  installCommand: string;
  categoryWeights: Record<string, number>;
  editorialUrl?: string;
  minStars: number;
  maxPicks: number;
}

/** Top 10 agents by search volume / market presence.
 *  DataForSEO validation should be run before expanding beyond these 10.
 */
export const AGENT_PAGE_CONFIGS: AgentPageConfig[] = [
  {
    slug: 'claude-code',
    name: 'Claude Code',
    tagline: 'The agent-native coding assistant',
    description:
      'Claude Code is Anthropic\'s agentic coding tool that runs directly in your terminal. These MCP servers extend its capabilities with file system access, GitHub integration, database querying, and web automation — all with verified security scores.',
    configClientKey: 'claude-desktop',
    configPath: '~/Library/Application Support/Claude/claude_desktop_config.json',
    installCommand: 'npx mymcpshelf add',
    categoryWeights: {
      development: 1.5,
      'ai-tools': 1.3,
      databases: 1.2,
      cloud: 1.1,
      security: 1.0,
    },
    editorialUrl: '/blog/best-mcp-servers-for-claude-code',
    minStars: 10,
    maxPicks: 12,
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    tagline: 'The AI-native code editor',
    description:
      'Cursor integrates MCP servers directly into its IDE experience. These verified picks give you database introspection, API testing, documentation search, and cloud deployment — without leaving your editor.',
    configClientKey: 'cursor',
    configPath: '~/.cursor/mcp_config.json',
    installCommand: 'npx mymcpshelf add --client cursor',
    categoryWeights: {
      development: 1.5,
      databases: 1.3,
      cloud: 1.2,
      'ai-tools': 1.1,
      productivity: 1.0,
    },
    editorialUrl: '/blog/best-mcp-servers-for-cursor',
    minStars: 10,
    maxPicks: 12,
  },
  {
    slug: 'cline',
    name: 'Cline',
    tagline: 'Autonomous coding agent for VS Code',
    description:
      'Cline is an open-source autonomous coding agent that runs inside VS Code. These MCP servers supercharge its ability to read codebases, query databases, and interact with external APIs — all security-verified.',
    configClientKey: 'cline',
    configPath: '~/.cline/mcp_config.json',
    installCommand: 'npx mymcpshelf add --client cline',
    categoryWeights: {
      development: 1.5,
      databases: 1.3,
      cloud: 1.1,
      'ai-tools': 1.1,
      security: 1.0,
    },
    minStars: 5,
    maxPicks: 10,
  },
  {
    slug: 'github-copilot',
    name: 'GitHub Copilot',
    tagline: 'The most widely deployed AI pair programmer',
    description:
      'GitHub Copilot now supports MCP tools in Chat and agent mode. These verified servers extend Copilot with repository-aware operations, CI/CD integration, and production debugging capabilities.',
    configClientKey: 'vscode',
    configPath: '~/.vscode/mcp_config.json',
    installCommand: 'npx mymcpshelf add --client vscode',
    categoryWeights: {
      development: 1.5,
      cloud: 1.3,
      databases: 1.2,
      security: 1.1,
      communication: 1.0,
    },
    minStars: 15,
    maxPicks: 10,
  },
  {
    slug: 'windsurf',
    name: 'Windsurf',
    tagline: 'The agentic IDE by Codeium',
    description:
      'Windsurf combines deep codebase understanding with autonomous agent capabilities. These MCP servers give it direct access to databases, cloud APIs, and developer tools — all scanned for security issues.',
    configClientKey: 'vscode',
    configPath: '~/.vscode/mcp_config.json',
    installCommand: 'npx mymcpshelf add --client vscode',
    categoryWeights: {
      development: 1.5,
      'ai-tools': 1.3,
      databases: 1.2,
      cloud: 1.1,
    },
    minStars: 5,
    maxPicks: 10,
  },
  {
    slug: 'zed',
    name: 'Zed',
    tagline: 'The high-performance collaborative editor',
    description:
      'Zed is a Rust-based editor built for speed and real-time collaboration. These MCP servers extend its AI assistant with file system operations, terminal access, and external API integrations.',
    configClientKey: 'vscode',
    configPath: '~/.vscode/mcp_config.json',
    installCommand: 'npx mymcpshelf add --client vscode',
    categoryWeights: {
      development: 1.5,
      databases: 1.2,
      cloud: 1.1,
      productivity: 1.0,
    },
    minStars: 5,
    maxPicks: 10,
  },
  {
    slug: 'continue',
    name: 'Continue',
    tagline: 'Open-source autopilot for VS Code',
    description:
      'Continue is the leading open-source AI code assistant for VS Code. These verified MCP servers give it context-aware access to your databases, APIs, and documentation — with full security transparency.',
    configClientKey: 'continue',
    configPath: '~/.continue/mcp_config.json',
    installCommand: 'npx mymcpshelf add --client continue',
    categoryWeights: {
      development: 1.5,
      databases: 1.3,
      cloud: 1.1,
      'ai-tools': 1.1,
    },
    minStars: 5,
    maxPicks: 10,
  },
  {
    slug: 'roo-code',
    name: 'Roo Code',
    tagline: 'Autonomous coding agent for VS Code',
    description:
      'Roo Code is a community fork of Cline focused on reliability and extensibility. These MCP servers give it direct access to databases, APIs, and developer tools with verified security scores.',
    configClientKey: 'vscode',
    configPath: '~/.vscode/mcp_config.json',
    installCommand: 'npx mymcpshelf add --client vscode',
    categoryWeights: {
      development: 1.5,
      databases: 1.3,
      cloud: 1.1,
      security: 1.0,
    },
    minStars: 3,
    maxPicks: 10,
  },
  {
    slug: 'gemini',
    name: 'Gemini',
    tagline: 'Google\'s multimodal AI with MCP support',
    description:
      'Google Gemini supports MCP servers through its API and IDE integrations. These verified picks give Gemini access to Google Cloud APIs, databases, and developer tools with full security context.',
    configClientKey: 'vscode',
    configPath: '~/.vscode/mcp_config.json',
    installCommand: 'npx mymcpshelf add --client vscode',
    categoryWeights: {
      cloud: 1.4,
      development: 1.3,
      databases: 1.2,
      'ai-tools': 1.1,
    },
    minStars: 5,
    maxPicks: 10,
  },
  {
    slug: 'goose',
    name: 'Goose',
    tagline: 'Open-source AI agent by Block',
    description:
      'Goose is an open-source AI agent that runs locally and connects to MCP servers. These verified picks extend Goose with database access, API integrations, and cloud operations — all with security badges.',
    configClientKey: 'claude-desktop',
    configPath: '~/.config/goose/config.json',
    installCommand: 'npx mymcpshelf add',
    categoryWeights: {
      development: 1.4,
      databases: 1.3,
      cloud: 1.2,
      security: 1.1,
    },
    minStars: 3,
    maxPicks: 10,
  },
];

/** Config format helpers (mirrors MCPConfigGenerator.tsx CLIENT_CONFIGS). */
export const AGENT_CONFIG_FORMATS: Record<
  AgentPageConfig['configClientKey'],
  { name: string; format: (servers: Array<{ name: string; command?: string; args?: string[]; env?: Record<string, string> }>) => object }
> = {
  'claude-desktop': {
    name: 'Claude Desktop',
    format: (servers) => ({
      mcpServers: servers.reduce(
        (acc, s) => ({
          ...acc,
          [s.name]: {
            ...(s.command && { command: s.command }),
            ...(s.args && s.args.length > 0 && { args: s.args }),
            ...(s.env && Object.keys(s.env).length > 0 && { env: s.env }),
          },
        }),
        {}
      ),
    }),
  },
  cursor: {
    name: 'Cursor',
    format: (servers) => ({
      mcpServers: servers.reduce(
        (acc, s) => ({
          ...acc,
          [s.name]: {
            ...(s.command && { command: s.command }),
            ...(s.args && s.args.length > 0 && { args: s.args }),
            ...(s.env && Object.keys(s.env).length > 0 && { env: s.env }),
          },
        }),
        {}
      ),
    }),
  },
  cline: {
    name: 'Cline (VS Code)',
    format: (servers) => ({
      mcpServers: servers.reduce(
        (acc, s) => ({
          ...acc,
          [s.name]: {
            ...(s.command && { command: s.command }),
            ...(s.args && s.args.length > 0 && { args: s.args }),
            ...(s.env && Object.keys(s.env).length > 0 && { env: s.env }),
          },
        }),
        {}
      ),
    }),
  },
  continue: {
    name: 'Continue (VS Code)',
    format: (servers) => ({
      mcpServers: servers.reduce(
        (acc, s) => ({
          ...acc,
          [s.name]: {
            ...(s.command && { command: s.command }),
            ...(s.args && s.args.length > 0 && { args: s.args }),
            ...(s.env && Object.keys(s.env).length > 0 && { env: s.env }),
          },
        }),
        {}
      ),
    }),
  },
  vscode: {
    name: 'VS Code (Official)',
    format: (servers) => ({
      mcpServers: servers.reduce(
        (acc, s) => ({
          ...acc,
          [s.name]: {
            ...(s.command && { command: s.command }),
            ...(s.args && s.args.length > 0 && { args: s.args }),
            ...(s.env && Object.keys(s.env).length > 0 && { env: s.env }),
          },
        }),
        {}
      ),
    }),
  },
  windsurf: {
    name: 'Windsurf',
    format: (servers) => ({
      mcpServers: servers.reduce(
        (acc, s) => ({
          ...acc,
          [s.name]: {
            ...(s.command && { command: s.command }),
            ...(s.args && s.args.length > 0 && { args: s.args }),
            ...(s.env && Object.keys(s.env).length > 0 && { env: s.env }),
          },
        }),
        {}
      ),
    }),
  },
  zed: {
    name: 'Zed',
    format: (servers) => ({
      mcpServers: servers.reduce(
        (acc, s) => ({
          ...acc,
          [s.name]: {
            ...(s.command && { command: s.command }),
            ...(s.args && s.args.length > 0 && { args: s.args }),
            ...(s.env && Object.keys(s.env).length > 0 && { env: s.env }),
          },
        }),
        {}
      ),
    }),
  },
  roo: {
    name: 'Roo Code',
    format: (servers) => ({
      mcpServers: servers.reduce(
        (acc, s) => ({
          ...acc,
          [s.name]: {
            ...(s.command && { command: s.command }),
            ...(s.args && s.args.length > 0 && { args: s.args }),
            ...(s.env && Object.keys(s.env).length > 0 && { env: s.env }),
          },
        }),
        {}
      ),
    }),
  },
  copilot: {
    name: 'GitHub Copilot',
    format: (servers) => ({
      mcpServers: servers.reduce(
        (acc, s) => ({
          ...acc,
          [s.name]: {
            ...(s.command && { command: s.command }),
            ...(s.args && s.args.length > 0 && { args: s.args }),
            ...(s.env && Object.keys(s.env).length > 0 && { env: s.env }),
          },
        }),
        {}
      ),
    }),
  },
  gemini: {
    name: 'Gemini',
    format: (servers) => ({
      mcpServers: servers.reduce(
        (acc, s) => ({
          ...acc,
          [s.name]: {
            ...(s.command && { command: s.command }),
            ...(s.args && s.args.length > 0 && { args: s.args }),
            ...(s.env && Object.keys(s.env).length > 0 && { env: s.env }),
          },
        }),
        {}
      ),
    }),
  },
};

/** Select top servers for an agent using weighted scoring.
 *  Score = stars × categoryWeight + (verified ? 50 : 0)
 */
export function selectServersForAgent(
  allServers: Array<{
    id: string;
    fields: {
      name: string;
      description: string;
      category: string;
      language: string;
      stars: number;
      github_url: string;
      npm_package: string | null;
    };
    securityAudit?: { auditScore: number } | null;
    scanData?: { badge_tier: string } | null;
  }>,
  config: AgentPageConfig
) {
  const scored = allServers
    .filter((s) => s.fields.stars >= config.minStars)
    .map((s) => {
      const weight = config.categoryWeights[s.fields.category] || 1.0;
      const verifiedBonus =
        s.scanData?.badge_tier === 'scanned' ||
        s.scanData?.badge_tier === 'manually_reviewed'
          ? 50
          : s.securityAudit && s.securityAudit.auditScore >= 50
            ? 30
            : 0;
      const score = s.fields.stars * weight + verifiedBonus;
      return { server: s, score };
    });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, config.maxPicks).map((s) => s.server);
}
