/**
 * search-engine.js — Natural-language search for the MCP server directory.
 *
 * Zero-dependency ESM. This is the SINGLE source of truth for search: it is
 * imported by the website's AI-search API endpoint AND by the dogfooded
 * `mcp-search-server` MCP server, so the directory's own search is literally
 * powered by an MCP server exposing this engine. (See the case study
 * "Our directory's search is built on MCP".)
 *
 * Design goals
 *  - Plain-English input works WITHOUT an LLM call: deterministic, fast, offline.
 *  - Uses the directory's existing tags — category, deployment_type, and the
 *    manual security audit (transport / auth / input handling / data residency) —
 *    as retrieval signals and boosters, not just keywords.
 *  - Every result carries a human-readable "why" so the UI can explain its
 *    ranking (the trust layer that keyword search can't provide).
 *
 * @typedef {Object} ServerLike
 * @property {string} id
 * @property {string} [deployment]        — local_stdio | cloud_native | self_hosted | enterprise_saas
 * @property {{name:string, description:string, author:string, category:string, language:string, stars:number, [key:string]:any}} fields
 * @property {any} [securityAudit]        — optional manual audit (see securityAudit.ts)
 *
 * @typedef {Object} QueryUnderstanding
 * @property {string[]} tokens            — query terms after stopwording
 * @property {string[]} categories        — inferred categories (boost)
 * @property {string[]} deployments       — inferred deployment preferences
 * @property {{readonly:boolean, safe:boolean, local:boolean, authed:boolean, parameterized:boolean}} security
 * @property {string[]} languages         — inferred language filters
 *
 * @typedef {Object} SearchHit
 * @property {number} score
 * @property {string[]} reasons           — human-readable ranking signals
 * @property {boolean} matched            — true if a relevance signal fired
 * @property {ServerLike} server
 */

// ────────────────────────────────────────────────────────────────────────────
// Query understanding lexicons
// ────────────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'a', 'an', 'the', 'i', 'we', 'you', 'me', 'my', 'our', 'is', 'are', 'be',
  'to', 'of', 'for', 'with', 'and', 'or', 'but', 'in', 'on', 'at', 'by',
  'that', 'this', 'it', 'its', 'as', 'so', 'do', 'does', 'did', 'can',
  'could', 'would', 'should', 'will', 'want', 'wants', 'need', 'needs',
  'needed', 'something', 'some', 'any', 'all', 'get', 'got', 'have', 'has',
  'help', 'helping', 'using', 'use', 'used', 'let', 'find', 'looking',
  'show', 'give', 'make', 'able', 'into', 'from', 'about', 'what', 'which',
  'how', 'who', 'where', 'there', 'their', 'they', 'them', 'one', 'two',
  'very', 'really', 'just', 'also', 'than', 'then', 'too', 'up', 'out',
  'over', 'off', 'down', 'now', 'like', 'kind', 'type', 'thing', 'things',
  'way', 'ways', 'good', 'best', 'tool', 'tools', 'server', 'servers', 'mcp',
  // generic verbs that cause substring noise (read/reader, write/writer)
  'read', 'reading', 'reads', 'write', 'writing', 'writes',
]);

/** Meaningful short tokens allowed through text matching despite length < 4. */
const SHORT_DOMAIN = new Set([
  'sql', 'db', 'api', 'rls', 'sso', 's3', 'ci', 'cd', 'ai', 'ml', 'ui',
  'pdf', 'ssh', 'dns', 'csv', 'jwt', 'aws', 'gcp', 'ec2', 'iam', 'vpc',
  'k8s', 'crm', 'erp', 'seo', 'sms',
]);

/** keyword → category. */
const CATEGORY_LEXICON = {
  databases: ['postgres', 'postgresql', 'mysql', 'sqlite', 'mongo', 'mongodb', 'database', 'db', 'sql', 'query', 'supabase', 'redis', 'dynamodb', 'elasticsearch', 'clickhouse', 'snowflake', 'cassandra', 'mariadb', 'prisma', 'table', 'row-level', 'rls'],
  'browser-automation': ['browser', 'playwright', 'puppeteer', 'selenium', 'scrape', 'scraping', 'automation', 'chrome', 'chromium', 'dom', 'crawl', 'headless'],
  cloud: ['aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'k8s', 'docker', 'terraform', 'deploy', 'deployment', 's3', 'lambda', 'serverless', 'ec2', 'cdn'],
  communication: ['slack', 'discord', 'email', 'gmail', 'whatsapp', 'telegram', 'message', 'messaging', 'chat', 'teams', 'notion', 'outlook'],
  development: ['github', 'git', 'code', 'ide', 'lint', 'linting', 'test', 'testing', 'build', 'ci', 'cd', 'commit', 'repo', 'repository', 'refactor', 'debug'],
  'file-systems': ['file', 'files', 'filesystem', 'folder', 'directory', 'disk', 'storage', 'fs', 'path'],
  finance: ['stripe', 'payment', 'payments', 'finance', 'financial', 'bank', 'banking', 'invoice', 'invoicing', 'accounting', 'stock', 'trading', 'crypto'],
  'knowledge-rag': ['rag', 'embedding', 'embeddings', 'vector', 'knowledge', 'memory', 'semantic', 'pinecone', 'chroma', 'weaviate', 'retrieval', 'document'],
  media: ['image', 'images', 'video', 'audio', 'ffmpeg', 'music', 'render', 'rendering', '3d', 'blender', 'figma', 'photoshop'],
  productivity: ['todo', 'task', 'tasks', 'calendar', 'note', 'notes', 'jira', 'linear', 'project', 'trello', 'asana', 'planner', 'scheduling'],
  search: ['search', 'web-search', 'google', 'bing', 'duckduckgo', 'serp', 'perplexity'],
  security: ['security', 'vulnerability', 'vulnerabilities', 'auth', 'authentication', 'pentest', 'scan', 'scanner', 'cve', 'secret', 'secrets', 'firewall'],
  'ai-tools': ['ai', 'llm', 'model', 'models', 'embedding', 'agent', 'agents', 'gpt', 'claude', 'gemini', 'ml', 'machine-learning', 'inference'],
  'data-analytics': ['analytics', 'analysis', 'chart', 'charts', 'dashboard', 'metric', 'metrics', 'report', 'reporting', 'bi', 'visualization', 'tableau'],
};

/** Multiword phrases normalized to single tokens before tokenizing. */
const PHRASE_MAP = {
  'read only': 'read-only',
  'read-only': 'read-only',
  'row level': 'row-level',
  'row-level': 'row-level',
  'self hosted': 'self-hosted',
  'self-hosted': 'self-hosted',
  'on premise': 'on-prem',
  'on-premise': 'on-prem',
  'machine learning': 'machine-learning',
  'web search': 'web-search',
};

/** keyword → deployment preference. */
const DEPLOYMENT_LEXICON = {
  local_stdio: ['local', 'offline', 'on-prem', 'self-hosted', 'stdio', 'cli', 'terminal', 'desktop', 'standalone'],
  self_hosted: ['self-hosted', 'on-prem', 'vpc', 'private', 'self-host'],
  cloud_native: ['cloud', 'hosted', 'remote', 'sse', 'serverless', 'managed', 'api', 'saas'],
  enterprise_saas: ['enterprise', 'sso', 'saml', 'compliance', 'soc2', 'soc-2', 'audit', 'gdpr'],
};

const LANGUAGE_LEXICON = {
  typescript: ['typescript', 'ts', 'node', 'nodejs', 'node.js', 'javascript', 'js'],
  python: ['python', 'py', 'pip', 'uvx', 'uv'],
  go: ['go', 'golang'],
  rust: ['rust', 'rustlang', 'cargo'],
  java: ['java', 'jvm', 'kotlin'],
};

// ────────────────────────────────────────────────────────────────────────────
// Tokenization & matching helpers
// ────────────────────────────────────────────────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(query) {
  if (!query) return '';
  let q = String(query).toLowerCase().trim();
  for (const [phrase, token] of Object.entries(PHRASE_MAP)) {
    q = q.split(phrase).join(token);
  }
  return q;
}

function tokenize(normalized) {
  return normalized
    .split(/[^a-z0-9._+-]+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter(Boolean);
}

/**
 * Boundary-prefix test: does `token` appear at a word boundary (optionally as a
 * prefix, so "postgres" matches "postgresql")? Prevents mid-word substring
 * false positives like "ai"→"email" or "sql"→"mysql".
 */
function matchIn(text, token) {
  if (!text || !token) return false;
  const re = new RegExp('(^|[^a-z0-9])' + escapeRegex(token) + '[a-z0-9.]*', 'i');
  return re.test(text);
}

/** Is a query token worth using for text matching? */
function isMatchableToken(t) {
  if (STOPWORDS.has(t)) return false;
  return t.length >= 4 || SHORT_DOMAIN.has(t);
}

// ────────────────────────────────────────────────────────────────────────────
// Query understanding
// ────────────────────────────────────────────────────────────────────────────

/**
 * Understand a natural-language query: extract tokens + structured signals.
 * @param {string} query
 * @returns {QueryUnderstanding}
 */
export function understandQuery(query) {
  const normalized = normalize(query);
  const allTokens = tokenize(normalized);
  const tokens = allTokens.filter((t) => t.length > 1 && !STOPWORDS.has(t));

  const categories = new Set();
  const deployments = new Set();
  const languages = new Set();
  const security = { readonly: false, safe: false, local: false, authed: false, parameterized: false };

  for (const tok of allTokens) {
    for (const [cat, words] of Object.entries(CATEGORY_LEXICON)) {
      if (words.includes(tok)) categories.add(cat);
    }
    for (const [dep, words] of Object.entries(DEPLOYMENT_LEXICON)) {
      if (words.includes(tok)) deployments.add(dep);
    }
    for (const [lang, words] of Object.entries(LANGUAGE_LEXICON)) {
      if (words.includes(tok)) languages.add(lang);
    }
  }

  if (/\b(read-only|readonly|read access|view[- ]?only)\b/.test(normalized)) security.readonly = true;
  if (/\b(safe|safely|secure|securely|security|trusted|sandbox|sanitiz)\b/.test(normalized)) security.safe = true;
  if (/\b(local|offline|on-?prem|self-?host)\b/.test(normalized)) security.local = true;
  if (/\b(auth|authenticated|oauth|sso|saml|login|permission|rbac)\b/.test(normalized)) security.authed = true;
  if (/\b(parameterized|parameterised|prepared|sanitiz|injection|row-level|rls|least-?privilege)\b/.test(normalized)) security.parameterized = true;

  return { tokens, categories: [...categories], deployments: [...deployments], languages: [...languages], security };
}

// ────────────────────────────────────────────────────────────────────────────
// Corpus statistics (IDF)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build a document-frequency index over a corpus for IDF weighting.
 * @param {ServerLike[]} servers
 * @returns {{ df: Map<string, number>, n: number }}
 */
export function buildCorpusIndex(servers) {
  const df = new Map();
  for (const s of servers) {
    const text = `${s.fields?.name || ''} ${s.fields?.description || ''} ${s.fields?.author || ''}`.toLowerCase();
    const seen = new Set(tokenize(text));
    for (const tok of seen) df.set(tok, (df.get(tok) || 0) + 1);
  }
  return { df, n: servers.length || 1 };
}

/** idf(t) = log(1 + N / df(t)); tokens absent from the corpus still get a floor. */
function idf(token, index) {
  const df = index.df.get(token) || 0;
  return Math.log(1 + index.n / (df + 1)) + 0.3;
}

// ────────────────────────────────────────────────────────────────────────────
// Scoring
// ────────────────────────────────────────────────────────────────────────────

const NAME_WEIGHT = 4;
const DESC_WEIGHT = 1;
const AUTHOR_WEIGHT = 1;

/**
 * Text relevance via boundary-prefix TF-IDF.
 * @returns {{ score: number, nameHits: string[] }}
 */
function textRelevance(server, matchTokens, index) {
  const name = (server.fields?.name || '').toLowerCase();
  const desc = (server.fields?.description || '').toLowerCase();
  const author = (server.fields?.author || '').toLowerCase();

  let score = 0;
  const nameHits = [];
  for (const tok of matchTokens) {
    const w = idf(tok, index);
    if (matchIn(name, tok)) {
      score += w * NAME_WEIGHT;
      nameHits.push(tok);
    } else if (matchIn(desc, tok)) {
      score += w * DESC_WEIGHT;
    } else if (matchIn(author, tok)) {
      score += w * AUTHOR_WEIGHT;
    }
  }
  return { score, nameHits };
}

/**
 * Score a single server against an understood query.
 * @returns {{ score:number, reasons:string[], matched:boolean }}
 */
export function scoreServer(server, u, index) {
  let score = 0;
  const reasons = [];
  let matched = false;

  // 1) Text relevance (TF-IDF) — the dominant signal.
  const matchTokens = u.tokens.filter(isMatchableToken);
  const { score: rel, nameHits } = textRelevance(server, matchTokens, index);
  if (rel > 0) {
    score += rel * 10;
    matched = true;
    if (nameHits.length) reasons.push(`name match: ${nameHits.slice(0, 3).map((t) => `"${t}"`).join(', ')}`);
    else reasons.push('keyword match in description');
  }

  // 2) Category alignment.
  const cat = server.fields?.category;
  if (cat && u.categories.includes(cat)) {
    score += 6;
    matched = true;
    reasons.push(`${titleCase(cat)} category`);
  }

  // 3) Deployment preference.
  const dep = server.deployment;
  if (dep && u.deployments.includes(dep)) {
    score += 3;
    matched = true;
    reasons.push(`${deploymentLabel(dep)} deployment`);
  }

  // 4) Security intent — uses the manual audit when available.
  const audit = server.securityAudit;
  if (u.security.safe || u.security.readonly || u.security.parameterized || u.security.local) {
    if (audit) {
      if (u.security.parameterized && audit.inputHandling === 'parameterized') {
        score += 5; matched = true; reasons.push('parameterized / injection-safe input handling');
      }
      if (u.security.parameterized && audit.inputHandling === 'shell_strings') {
        score -= 6; reasons.push('⚠️ uses shell string construction (flagged)');
      }
      if (u.security.readonly && audit.dataResidency === 'local_only') {
        score += 3; matched = true; reasons.push('local-only data residency');
      }
      if (u.security.authed && (audit.authMethod === 'OAuth2' || audit.authMethod === 'SSO-SAML')) {
        score += 3; matched = true; reasons.push(`${audit.authMethod} authentication`);
      }
      if (audit.auditScore >= 70) { score += 2; reasons.push(`security score ${audit.auditScore}/100`); }
    } else if (u.security.local && dep === 'local_stdio') {
      score += 2; matched = true; reasons.push('local stdio (runs on your machine)');
    }
  }

  // 5) Language preference.
  const lang = (server.fields?.language || '').toLowerCase();
  if (u.languages.length && lang) {
    for (const l of u.languages) {
      if (lang.includes(l)) { score += 2; matched = true; reasons.push(titleCase(l)); break; }
    }
  }

  // 6) Quality tiebreaker — adoption, log-scaled so it only breaks near-ties.
  const stars = server.fields?.stars || 0;
  const downloads = server.fields?.downloads || 0;
  score += Math.log10((stars || 0) + 1) * 0.6 + Math.log10((downloads || 0) + 1) * 0.4;
  if (stars >= 5000) reasons.push(`high adoption (${formatStars(stars)}★)`);

  return { score, reasons, matched };
}

// ────────────────────────────────────────────────────────────────────────────
// Public search API
// ────────────────────────────────────────────────────────────────────────────

/**
 * Search curated servers with a natural-language query.
 *
 * - Non-empty query: only servers with a genuine relevance signal are returned,
 *   ranked by score.
 * - Empty query: returns the most popular servers (by adoption).
 *
 * @param {string} query
 * @param {ServerLike[]} servers
 * @param {{limit?: number}} [opts]
 * @returns {{ query:string, inferredFilters:QueryUnderstanding, hits:SearchHit[], total:number, tookMs:number }}
 */
export function searchServers(query, servers, opts = {}) {
  const started = now();
  const limit = opts.limit ?? 12;
  const u = understandQuery(query);
  const hasQuery = u.tokens.some(isMatchableToken) || u.categories.length || u.deployments.length ||
    u.security.safe || u.security.readonly || u.security.parameterized || u.security.authed || u.languages.length;
  const index = buildCorpusIndex(servers);

  const scored = servers
    .map((server) => ({ server, ...scoreServer(server, u, index) }))
    .filter((h) => (hasQuery ? h.matched : true))
    .sort((a, b) => b.score - a.score);

  const hits = scored.slice(0, limit).map((h) => ({
    score: round(h.score),
    reasons: h.reasons,
    matched: h.matched,
    server: h.server,
  }));

  return {
    query,
    inferredFilters: u,
    hits,
    total: scored.length,
    tookMs: round(now() - started),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Display helpers (shared by website + MCP server)
// ────────────────────────────────────────────────────────────────────────────

/** Human-readable filter summary, e.g. "Databases · read-only · local stdio". */
export function summarizeFilters(u) {
  if (!u) return '';
  const parts = [];
  if (u.categories.length) parts.push(...u.categories.map(titleCase));
  if (u.security.readonly) parts.push('read-only');
  if (u.security.safe) parts.push('secure');
  if (u.security.local) parts.push('local');
  if (u.security.parameterized) parts.push('parameterized');
  if (u.languages.length) parts.push(...u.languages.map(titleCase));
  return parts.join(' · ');
}

function deploymentLabel(dep) {
  switch (dep) {
    case 'local_stdio': return 'local stdio';
    case 'cloud_native': return 'cloud-native';
    case 'self_hosted': return 'self-hosted';
    case 'enterprise_saas': return 'enterprise SaaS';
    default: return dep || '';
  }
}

function titleCase(s) {
  return String(s).split(/[-_ ]/).filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

function formatStars(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function round(n) {
  return Math.round(n * 100) / 100;
}
