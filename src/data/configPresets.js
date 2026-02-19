/**
 * Config Presets for MCP Config Generator
 * Pre-packaged server combinations for common use cases
 */

export interface ConfigPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  servers: string[];
  tags: string[];
  popularity: number;
  estimatedSetupTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  useCase: string;
  benefits: string[];
  envVars: string[];
}

export const configPresets: Record<string, ConfigPreset> = {
  'full-development': {
    id: 'full-development',
    name: 'Full Development Stack',
    description: 'Everything a developer needs: GitHub integration, file system access, database management, and web automation.',
    icon: '👨‍💻',
    servers: ['github-mcp', 'filesystem-mcp', 'postgres-mcp', 'puppeteer-mcp'],
    tags: ['development', 'popular', 'recommended'],
    popularity: 95,
    estimatedSetupTime: '5 min',
    difficulty: 'intermediate',
    useCase: 'Perfect for developers building full-stack applications',
    benefits: [
      'Access GitHub repos, issues, and PRs',
      'Read and write local files safely',
      'Query and manage PostgreSQL databases',
      'Automate browser tasks and web scraping'
    ],
    envVars: ['GITHUB_TOKEN', 'DATABASE_URL']
  },

  'minimal-setup': {
    id: 'minimal-setup',
    name: 'Minimal Setup',
    description: 'Just the essentials to get started: GitHub and file system access. Great for beginners.',
    icon: '⚡',
    servers: ['github-mcp', 'filesystem-mcp'],
    tags: ['beginner', 'quick-start', 'essential'],
    popularity: 90,
    estimatedSetupTime: '2 min',
    difficulty: 'beginner',
    useCase: 'Best for developers new to MCP or simple projects',
    benefits: [
      'Quick and easy setup',
      'Essential GitHub operations',
      'Basic file system access',
      'Minimal configuration required'
    ],
    envVars: ['GITHUB_TOKEN']
  },

  'database-admin': {
    id: 'database-admin',
    name: 'Database Administrator',
    description: 'Manage multiple database types with MCP. PostgreSQL, SQLite, MongoDB, and Redis all in one config.',
    icon: '🗄️',
    servers: ['postgres-mcp', 'sqlite-mcp', 'mongodb-mcp', 'redis-mcp'],
    tags: ['database', 'dba', 'data'],
    popularity: 65,
    estimatedSetupTime: '10 min',
    difficulty: 'intermediate',
    useCase: 'Ideal for database administrators and backend developers',
    benefits: [
      'Multi-database support',
      'Query optimization tools',
      'Schema introspection',
      'Performance monitoring'
    ],
    envVars: ['DATABASE_URL', 'MONGO_URL', 'REDIS_URL']
  },

  'cloud-infrastructure': {
    id: 'cloud-infrastructure',
    name: 'Cloud Infrastructure',
    description: 'AWS, Azure, GCP, and Kubernetes management. Deploy and manage cloud resources through MCP.',
    icon: '☁️',
    servers: ['aws-mcp', 'azure-mcp', 'gcp-mcp', 'kubernetes-mcp'],
    tags: ['cloud', 'devops', 'infrastructure'],
    popularity: 50,
    estimatedSetupTime: '15 min',
    difficulty: 'advanced',
    useCase: 'For DevOps engineers managing multi-cloud deployments',
    benefits: [
      'Multi-cloud support',
      'Infrastructure as Code',
      'Resource management',
      'Deployment automation'
    ],
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'GOOGLE_CLOUD_PROJECT']
  },

  'ai-development': {
    id: 'ai-development',
    name: 'AI Development',
    description: 'Build AI applications with LangChain, LlamaIndex, and essential dev tools. Includes file system and GitHub access.',
    icon: '🤖',
    servers: ['langchain-mcp', 'llamaindex-mcp', 'github-mcp', 'filesystem-mcp'],
    tags: ['ai', 'ml', 'llm'],
    popularity: 70,
    estimatedSetupTime: '8 min',
    difficulty: 'intermediate',
    useCase: 'Perfect for AI/ML engineers and LLM application developers',
    benefits: [
      'LangChain integration',
      'LlamaIndex support',
      'RAG pipeline tools',
      'Vector database support'
    ],
    envVars: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN']
  },

  'team-collaboration': {
    id: 'team-collaboration',
    name: 'Team Collaboration',
    description: 'Slack, Discord, and Google Workspace integration for team communication and document management.',
    icon: '👥',
    servers: ['slack-mcp', 'discord-mcp', 'gdrive-mcp'],
    tags: ['communication', 'productivity', 'team'],
    popularity: 55,
    estimatedSetupTime: '10 min',
    difficulty: 'intermediate',
    useCase: 'Great for teams wanting AI-assisted communication',
    benefits: [
      'Slack message automation',
      'Discord bot capabilities',
      'Google Drive file access',
      'Calendar integration'
    ],
    envVars: ['SLACK_BOT_TOKEN', 'DISCORD_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
  },

  'web-automation': {
    id: 'web-automation',
    name: 'Web Automation',
    description: 'Puppeteer and web scraping tools for browser automation, testing, and data extraction.',
    icon: '🌐',
    servers: ['puppeteer-mcp', 'github-mcp', 'filesystem-mcp'],
    tags: ['automation', 'testing', 'scraping'],
    popularity: 60,
    estimatedSetupTime: '5 min',
    difficulty: 'beginner',
    useCase: 'Ideal for QA engineers and web scrapers',
    benefits: [
      'Browser automation',
      'Screenshot capture',
      'Form filling',
      'Web testing'
    ],
    envVars: ['GITHUB_TOKEN']
  },

  'data-pipeline': {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description: 'Build data pipelines with MindsDB, Activepieces, and database connectors. ETL and automation made easy.',
    icon: '📊',
    servers: ['mindsdb-mcp', 'activepieces-mcp', 'postgres-mcp', 'redis-mcp'],
    tags: ['data', 'etl', 'automation'],
    popularity: 45,
    estimatedSetupTime: '15 min',
    difficulty: 'advanced',
    useCase: 'For data engineers building ETL pipelines',
    benefits: [
      'AI-powered queries',
      'Workflow automation',
      'Real-time data sync',
      'Multi-source integration'
    ],
    envVars: ['DATABASE_URL', 'REDIS_URL', 'MINDSDB_API_KEY']
  },

  'security-tools': {
    id: 'security-tools',
    name: 'Security Tools',
    description: 'Security-focused servers for code scanning, secrets management, and infrastructure auditing.',
    icon: '🔒',
    servers: ['github-mcp', 'aws-mcp', 'kubernetes-mcp'],
    tags: ['security', 'audit', 'compliance'],
    popularity: 40,
    estimatedSetupTime: '12 min',
    difficulty: 'advanced',
    useCase: 'For security engineers and compliance teams',
    benefits: [
      'Code vulnerability scanning',
      'Secrets detection',
      'Infrastructure auditing',
      'Compliance checks'
    ],
    envVars: ['GITHUB_TOKEN', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
  },

  'local-first': {
    id: 'local-first',
    name: 'Local First',
    description: 'All local tools with no external API dependencies. File system, SQLite, and Puppeteer - runs entirely offline.',
    icon: '🏠',
    servers: ['filesystem-mcp', 'sqlite-mcp', 'puppeteer-mcp'],
    tags: ['local', 'offline', 'privacy'],
    popularity: 75,
    estimatedSetupTime: '3 min',
    difficulty: 'beginner',
    useCase: 'Best for privacy-focused users or offline environments',
    benefits: [
      'No external APIs required',
      'Works offline',
      'Complete data privacy',
      'Fast local execution'
    ],
    envVars: []
  },

  'claude-code-assistant': {
    id: 'claude-code-assistant',
    name: 'Claude Code Assistant',
    description: 'Perfect starter kit for developers new to MCP. GitHub integration, file system access, and terminal commands.',
    icon: '🤖',
    servers: ['github-mcp', 'filesystem-mcp', 'commander-mcp'],
    tags: ['beginner', 'claude', 'developer', 'starter'],
    popularity: 92,
    estimatedSetupTime: '3 min',
    difficulty: 'beginner',
    useCase: 'Ideal for developers new to MCP or getting started with Claude',
    benefits: [
      'GitHub repo management',
      'Read and write files safely',
      'Execute terminal commands',
      'Quick setup for Claude Desktop'
    ],
    envVars: ['GITHUB_TOKEN']
  },

  'notion-alternative': {
    id: 'notion-alternative',
    name: 'The Notion Alternative',
    description: 'Build a local-first knowledge management system. SQLite database, file organization, and Obsidian integration.',
    icon: '📝',
    servers: ['sqlite-mcp', 'filesystem-mcp', 'obsidian-mcp'],
    tags: ['knowledge', 'productivity', 'local', 'notes'],
    popularity: 70,
    estimatedSetupTime: '5 min',
    difficulty: 'beginner',
    useCase: 'Perfect for knowledge management and personal productivity',
    benefits: [
      'Local database for notes',
      'File organization tools',
      'Obsidian vault integration',
      'No cloud dependency'
    ],
    envVars: []
  },

  'marketing-ops': {
    id: 'marketing-ops',
    name: 'Marketing Ops Stack',
    description: 'Everything marketing teams need: Airtable databases, Slack notifications, Webflow CMS, and analytics.',
    icon: '📈',
    servers: ['airtable-mcp', 'slack-mcp', 'webflow-mcp', 'google-analytics-mcp'],
    tags: ['marketing', 'growth', 'automation', 'business'],
    popularity: 55,
    estimatedSetupTime: '10 min',
    difficulty: 'intermediate',
    useCase: 'Built for growth marketers and marketing operations teams',
    benefits: [
      'Airtable database automation',
      'Slack campaign notifications',
      'Webflow content management',
      'Analytics and reporting'
    ],
    envVars: ['AIRTABLE_API_KEY', 'SLACK_BOT_TOKEN', 'WEBFLOW_API_TOKEN', 'GOOGLE_ANALYTICS_KEY']
  },

  'local-privacy': {
    id: 'local-privacy',
    name: 'Local-First Privacy',
    description: 'Complete privacy with local AI. File system, Ollama for local LLM, and PDF processing - nothing leaves your machine.',
    icon: '🔒',
    servers: ['filesystem-mcp', 'ollama-mcp', 'local-pdf-mcp'],
    tags: ['privacy', 'local', 'offline', 'ai'],
    popularity: 80,
    estimatedSetupTime: '5 min',
    difficulty: 'intermediate',
    useCase: 'For privacy-conscious users who want AI without cloud services',
    benefits: [
      '100% local processing',
      'Ollama for offline AI',
      'PDF analysis locally',
      'No data leaves your machine'
    ],
    envVars: []
  },

  'ai-engineering': {
    id: 'ai-engineering',
    name: 'AI Engineering',
    description: 'Build AI applications with LangSmith tracing, Pinecone vector search, and vector store integrations.',
    icon: '🧠',
    servers: ['langsmith-mcp', 'pinecone-mcp', 'chromadb-mcp', 'github-mcp'],
    tags: ['ai', 'ml', 'llm', 'vectors', 'rag'],
    popularity: 65,
    estimatedSetupTime: '12 min',
    difficulty: 'advanced',
    useCase: 'For AI engineers building RAG applications and LLM pipelines',
    benefits: [
      'LangSmith for LLM tracing',
      'Pinecone vector search',
      'ChromaDB local vectors',
      'GitHub for code management'
    ],
    envVars: ['LANGSMITH_API_KEY', 'PINECONE_API_KEY', 'GITHUB_TOKEN']
  }
};

/**
 * Get preset by ID
 */
export function getPreset(id: string): ConfigPreset | undefined {
  return configPresets[id];
}

/**
 * Get all presets
 */
export function getAllPresets(): ConfigPreset[] {
  return Object.values(configPresets);
}

/**
 * Get presets by tag
 */
export function getPresetsByTag(tag: string): ConfigPreset[] {
  return Object.values(configPresets).filter(preset => 
    preset.tags.includes(tag)
  );
}

/**
 * Get most popular presets
 */
export function getPopularPresets(limit: number = 8): ConfigPreset[] {
  return Object.values(configPresets)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/**
 * Get presets by difficulty
 */
export function getPresetsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): ConfigPreset[] {
  return Object.values(configPresets).filter(preset => 
    preset.difficulty === difficulty
  );
}

/**
 * Get beginner-friendly presets
 */
export function getBeginnerPresets(): ConfigPreset[] {
  return getPresetsByDifficulty('beginner');
}

/**
 * Search presets by keyword
 */
export function searchPresets(query: string): ConfigPreset[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(configPresets).filter(preset =>
    preset.name.toLowerCase().includes(lowerQuery) ||
    preset.description.toLowerCase().includes(lowerQuery) ||
    preset.useCase.toLowerCase().includes(lowerQuery) ||
    preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get total env vars needed for a preset
 */
export function getPresetEnvVars(presetId: string): string[] {
  const preset = configPresets[presetId];
  return preset?.envVars || [];
}

/**
 * Estimate setup complexity score (0-100)
 */
export function getPresetComplexityScore(presetId: string): number {
  const preset = configPresets[presetId];
  if (!preset) return 0;

  let score = 0;

  // Difficulty factor
  if (preset.difficulty === 'beginner') score += 10;
  else if (preset.difficulty === 'intermediate') score += 30;
  else score += 50;

  // Server count factor
  score += preset.servers.length * 5;

  // Env vars factor
  score += preset.envVars.length * 10;

  return Math.min(score, 100);
}
