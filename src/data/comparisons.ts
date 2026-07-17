/**
 * Comparison matrix data for MyMCPShelf vs competitor directories.
 *
 * Used by src/pages/vs-[competitor].astro to generate honest feature-comparison
 * pages. Every claim is sourced from public competitor positioning as of July 2026.
 */

export type FeatureValue = true | false | 'partial' | string;

export interface ComparisonRow {
  feature: string;
  us: FeatureValue;
  them: FeatureValue;
  note?: string;
}

export interface CompetitorComparison {
  key: string;
  name: string;
  url: string;
  tagline: string;
  theirScale: string;
  theirPositioning: string;
  rows: ComparisonRow[];
  faq: { q: string; a: string }[];
  cta: {
    headline: string;
    body: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
  };
}

const yes = true;
const no = false;
const partial = 'partial' as const;

export const COMPARISONS: Record<string, CompetitorComparison> = {
  glama: {
    key: 'glama',
    name: 'Glama',
    url: 'https://glama.ai',
    tagline: 'Large-scale MCP directory with broad coverage.',
    theirScale: '10,000+ listed servers',
    theirPositioning:
      'Glama indexes the widest surface area of MCP servers. Their strength is breadth — if a server exists on GitHub, it is probably in Glama.',
    rows: [
      { feature: 'Total listed servers', us: '4,200+', them: '10,000+' },
      { feature: 'Verified / security-scanned subset', us: yes, them: no, note: 'Glama lists broadly; we verify deeply.' },
      { feature: 'Unified recheck pipeline (weekly)', us: yes, them: no },
      { feature: 'Automated execution test (handshake + tools)', us: yes, them: no },
      { feature: 'Staleness scoring (last commit, issue velocity)', us: yes, them: no },
      { feature: 'Green-hosting / data-residency checks', us: yes, them: no },
      { feature: 'Embedddable live status badges', us: yes, them: no },
      { feature: 'Agent-specific pages (Cursor, Claude, etc.)', us: yes, them: no },
      { feature: 'Public JSON API + MCP server package', us: yes, them: partial, note: 'Glama has an API; we also ship an installable MCP server.' },
      { feature: 'Remote-server section (SSE / WebSocket)', us: yes, them: no },
      { feature: 'Auth method & token-lifecycle documentation', us: yes, them: no },
      { feature: 'Server install counts (real CLI telemetry)', us: yes, them: no },
      { feature: 'Open-source directory code', us: partial, them: partial },
    ],
    faq: [
      {
        q: 'Should I use Glama or My MCP Shelf?',
        a: 'Use Glama when you want to discover everything that exists — it is the broadest index. Use My MCP Shelf when you want to choose servers that have passed automated security, activity, and execution tests. We are the filter, not the firehose.',
      },
      {
        q: 'Does Glama verify servers the same way?',
        a: 'As of July 2026, Glama does not publish a verification pipeline equivalent to our unified recheck (staleness + security + green + execution). Their value is coverage; ours is confidence.',
      },
      {
        q: 'Can I search both?',
        a: 'Absolutely. Many developers browse Glama for discovery, then cross-check our security grades and execution badges before installing.',
      },
    ],
    cta: {
      headline: 'Want verified servers, not just listed ones?',
      body: 'Browse servers that have passed our unified recheck pipeline — security scanned, execution tested, and graded for staleness.',
      primaryHref: '/',
      primaryLabel: 'Browse Verified Servers',
      secondaryHref: '/audit-manifesto',
      secondaryLabel: 'Read Our Audit Methodology →',
    },
  },

  smithery: {
    key: 'smithery',
    name: 'Smithery',
    url: 'https://smithery.ai',
    tagline: 'Hosted MCP platform with 7,000+ managed servers.',
    theirScale: '7,000+ hosted servers',
    theirPositioning:
      'Smithery is a hosting platform first and a directory second. Their servers run on their infrastructure, which removes setup friction but adds vendor dependency.',
    rows: [
      { feature: 'Total listed servers', us: '4,200+', them: '7,000+' },
      { feature: 'Self-hostable / local stdio servers', us: yes, them: partial, note: 'Smithery is cloud-hosted; we cover local, remote, and SaaS.' },
      { feature: 'Vendor-agnostic (no lock-in)', us: yes, them: no, note: 'Smithery hosts on their infra; we point you to the source.' },
      { feature: 'Security scan results published per server', us: yes, them: partial, note: 'Smithery does not publish detailed per-server security grades.' },
      { feature: 'Execution test harness (handshake + tool calls)', us: yes, them: no },
      { feature: 'Staleness pulse (commit velocity, issue health)', us: yes, them: no },
      { feature: 'Green hosting / carbon footprint checks', us: yes, them: no },
      { feature: 'Data residency documented', us: yes, them: partial },
      { feature: 'Embedddable live status badges', us: yes, them: no },
      { feature: 'Public JSON API + installable MCP server', us: yes, them: partial },
      { feature: 'Agent-specific config snippets', us: yes, them: no },
      { feature: 'Remote-server auth method taxonomy', us: yes, them: no },
      { feature: 'Enterprise SaaS deployment guide', us: yes, them: partial },
    ],
    faq: [
      {
        q: 'Is Smithery easier to set up?',
        a: 'Yes — if you want zero configuration. Smithery runs servers for you. My MCP Shelf is for teams that want to audit, self-host, or integrate servers into their own infrastructure.',
      },
      {
        q: 'Can I run Smithery servers locally?',
        a: 'Smithery is primarily a hosted platform. We specialize in helping you find and run servers locally, in your VPC, or in your chosen cloud provider.',
      },
      {
        q: 'Which is better for enterprise?',
        a: 'If you need SOC 2, custom compliance, or VPC deployment, our self-hosted and enterprise-SaaS sections are designed for that. Smithery is optimized for speed-to-first-use.',
      },
    ],
    cta: {
      headline: 'Need control, not just convenience?',
      body: 'Find servers you can host yourself — with security grades, execution tests, and per-agent config snippets.',
      primaryHref: '/enterprise-readiness',
      primaryLabel: 'Compare Deployment Options',
      secondaryHref: '/remote-servers',
      secondaryLabel: 'Browse Remote Servers →',
    },
  },

  'mcp.so': {
    key: 'mcp.so',
    name: 'mcp.so',
    url: 'https://mcp.so',
    tagline: 'Lightweight directory with a feed and remote focus.',
    theirScale: 'Broad index, exact count varies',
    theirPositioning:
      'mcp.so is a fast, minimal directory. They recently added a Remote Servers section and a feed — signals that the ecosystem is moving toward hosted MCP.',
    rows: [
      { feature: 'Total listed servers', us: '4,200+', them: 'Large index' },
      { feature: 'Verified security-scanned subset', us: yes, them: no },
      { feature: 'Weekly recheck pipeline', us: yes, them: no },
      { feature: 'Execution test (handshake + tool calls)', us: yes, them: no },
      { feature: 'Staleness scoring', us: yes, them: no },
      { feature: 'Green hosting checks', us: yes, them: no },
      { feature: 'Public feed (RSS / JSON)', us: yes, them: yes, note: 'Both have feeds; ours includes security flags.' },
      { feature: 'Remote server auth taxonomy', us: yes, them: partial, note: 'mcp.so lists remote servers; we document auth method and token lifecycle.' },
      { feature: 'Uptime & TLS monitoring', us: yes, them: no },
      { feature: 'Embedddable live badges', us: yes, them: no },
      { feature: 'Agent-specific pages', us: yes, them: no },
      { feature: 'Installable MCP server package', us: yes, them: no },
      { feature: 'llms.txt for AI agents', us: yes, them: no },
    ],
    faq: [
      {
        q: 'mcp.so has a feed — how is yours different?',
        a: 'Our feed includes security-flag events and newly verified servers, not just new listings. It is designed for monitoring tools and security newsletters, not just human readers.',
      },
      {
        q: 'Which directory loads faster?',
        a: 'mcp.so is intentionally minimal and loads very quickly. We trade a small amount of page weight for security grades, execution badges, and per-server detail that mcp.so does not surface.',
      },
      {
        q: 'Can I use both directories?',
        a: 'Yes. mcp.so is great for quick lookups. Use My MCP Shelf when you need to evaluate trustworthiness before adding a server to a production agent.',
      },
    ],
    cta: {
      headline: 'Want a feed with security context?',
      body: 'Subscribe to our RSS or JSON feed for newly verified servers and security flags — built for monitoring tools and AI newsletters.',
      primaryHref: '/changelog',
      primaryLabel: 'View Changelog & Feeds',
      secondaryHref: '/api/v1/feed/rss.xml',
      secondaryLabel: 'RSS Feed →',
    },
  },

  'skills.sh': {
    key: 'skills.sh',
    name: 'skills.sh',
    url: 'https://skills.sh',
    tagline: 'Agent-skills directory with security grades from multiple auditors.',
    theirScale: '~20 agent pages, broad skill listings',
    theirPositioning:
      'skills.sh is the closest competitor in philosophy: they grade listings (SAFE / CAUTION / UNSAFE / UNAUDITED) and pull audits from Gen Agent Trust Hub, Socket, and Snyk. Their focus is skills; ours is MCP servers.',
    rows: [
      { feature: 'Security grades per listing', us: yes, them: yes, note: 'Both grade listings; we add execution testing and staleness.' },
      { feature: 'Multiple audit sources (Snyk, Socket, etc.)', us: yes, them: yes, note: 'skills.sh uses Gen Agent Trust Hub + Socket + Snyk; we run our own unified pipeline plus external audits.' },
      { feature: 'Execution test (does the server handshake?)', us: yes, them: no },
      { feature: 'Staleness pulse (commit velocity)', us: yes, them: partial },
      { feature: 'Green hosting / carbon checks', us: yes, them: no },
      { feature: 'Agent-specific pages', us: yes, them: yes, note: 'skills.sh has ~20 agent pages; we generate them programmatically from live data.' },
      { feature: 'Public JSON API', us: yes, them: partial },
      { feature: 'Installable MCP server for agents', us: yes, them: no },
      { feature: 'llms.txt for AI agent discovery', us: yes, them: no },
      { feature: 'Embedddable live status badges', us: yes, them: no },
      { feature: 'Server install counts (CLI telemetry)', us: yes, them: no },
      { feature: 'Remote server auth & uptime monitoring', us: yes, them: no },
      { feature: 'Focus area', us: 'MCP servers + skills', them: 'Agent skills + harness components', note: 'We verify the servers agents use; they verify the skills agents wear.' },
    ],
    faq: [
      {
        q: 'Are you trying to replace skills.sh?',
        a: 'No. skills.sh is excellent for agent skills and harness components. We are the directory for the MCP servers underneath those skills. Many developers use both.',
      },
      {
        q: 'Whose security grades are more reliable?',
        a: 'Both use multiple sources. Our differentiator is the execution-test harness: we actually spin up verified servers and confirm they complete an MCP handshake. That is ground truth, not a proxy.',
      },
      {
        q: 'Do you list skills too?',
        a: 'Yes — we have Agent Skills and Cursor Skills sections. But our primary depth is MCP servers, where we run the unified recheck pipeline (tasks 13/14/19).',
      },
    ],
    cta: {
      headline: 'Need servers, not just skills?',
      body: 'Browse MCP servers with execution-tested badges, security grades, and per-agent install commands.',
      primaryHref: '/',
      primaryLabel: 'Browse Verified Servers',
      secondaryHref: '/agent-skills',
      secondaryLabel: 'Browse Agent Skills →',
    },
  },
};

export const COMPETITOR_KEYS = Object.keys(COMPARISONS);
