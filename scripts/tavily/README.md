# MCP Intelligence System

Automated monitoring and analysis platform for Model Context Protocol (MCP) servers. This system automatically detects new commercial and official vendor MCP servers, surfaces niche servers, generates competitive gap analysis, and feeds editorial calendars with demand-driven content topics.

## Features

- **Weekly Server Discovery**: Automated scans every Monday at 8:00am UTC
- **Vendor Watchlist**: 50+ SaaS vendors across 9 categories
- **Niche Detection**: Identifies valuable but underappreciated servers
- **Monthly Analysis**: Comprehensive reports with gap analysis, category health, vendor momentum, and emerging use cases
- **Human-in-the-loop**: Automation finds, humans decide
- **GitHub Actions Integration**: Fully automated scheduled jobs

## Architecture

```
scripts/tavily/
├── weekly-scan.ts          # Weekly discovery script
├── monthly-review.ts       # Monthly analysis script
├── api.ts                  # Tavily API client
├── config.ts               # Configuration management
├── storage.ts              # Data storage and deduplication
├── utils.ts                # Utility functions
├── types.ts                # TypeScript interfaces
├── vendor-watchlist.json   # 50+ vendor database
└── analysis/               # Analysis modules
    ├── gap-analysis.ts     # Competitive gap analysis
    ├── category-health.ts  # Category distribution analysis
    ├── vendor-momentum.ts  # Vendor activity tracking
    └── emerging-use-cases.ts # Use case detection

data/
├── new-servers/           # Weekly discovery results
└── monthly-reports/       # Monthly analysis reports

.github/workflows/
├── mcp-weekly-scan.yml    # Weekly GitHub Actions workflow
└── mcp-monthly-review.yml # Monthly GitHub Actions workflow
```

## Setup

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
TAVILY_API_KEY=your_tavily_api_key_here
```

### 2. Installation

```bash
npm install
```

### 3. Configuration

The system is pre-configured with:
- 50+ vendor watchlist across 9 categories
- Weekly scan schedule: Every Monday at 8:00am UTC
- Monthly review schedule: First Monday of each month at 8:00am UTC

## Usage

### Manual Execution

```bash
# Run weekly scan
npm run weekly-scan

# Run monthly review
npm run monthly-review

# Run tests
npm run test:tavily
```

### GitHub Actions

The system includes two automated workflows:

1. **Weekly Scan** (`mcp-weekly-scan.yml`):
   - Runs every Monday at 8:00am UTC
   - Discovers new MCP servers
   - Commits results to repository

2. **Monthly Review** (`mcp-monthly-review.yml`):
   - Runs first Monday of each month at 8:00am UTC
   - Generates comprehensive analysis reports
   - Commits reports to repository

### Testing

```bash
# Run all tests
npm run test:tavily

# Run tests with coverage
npm run test:tavily:coverage

# Watch mode
npm run test:tavily:watch
```

## Data Structure

### Server Object
```typescript
interface Server {
  id: string;                    // UUID v4
  name: string;                  // Server name
  vendor: string;                // Vendor name
  vendorCategory: string;        // AI/ML, Database, etc.
  discoveryDate: string;         // ISO 8601 date
  discoverySource: string;       // 'tavily', 'manual', 'competitor'
  confidenceScore: number;       // 0-1 confidence in discovery
  githubUrl?: string;            // GitHub repository URL
  documentationUrl?: string;     // Official documentation
  description: string;           // Brief description
  tags: string[];                // Categorization tags
  useCases: string[];            // Primary use cases
  githubStars?: number;          // GitHub star count
  status: 'pending' | 'approved' | 'rejected';
  // ... additional fields
}
```

### Vendor Watchlist
The system includes 50+ vendors across 9 categories:
- Payments & Commerce (Stripe, PayPal, Shopify, etc.)
- Cloud Infrastructure (AWS, Azure, GCP, Cloudflare, etc.)
- Dev Tools (GitHub, GitLab, Linear, Sentry, etc.)
- Databases (MongoDB, Supabase, PlanetScale, Pinecone, etc.)
- Productivity (Notion, Airtable, Asana, Monday.com, etc.)
- Communication (Slack, Twilio, Intercom, HubSpot, etc.)
- AI / ML (Hugging Face, Replicate, Cohere, Mistral, etc.)
- Analytics (Segment, Amplitude, Mixpanel, PostHog, etc.)
- Finance / Legal (Plaid, Brex, Mercury, Carta, etc.)

## Analysis Modules

### 1. Gap Analysis
Compares our MCP server directory against competitor directories to identify coverage gaps.

### 2. Category Health Check
Analyzes server distribution across categories and identifies underrepresented areas.

### 3. Vendor Momentum Scan
Tracks vendor activity and identifies growing, stable, and declining vendors.

### 4. Emerging Use Case Detection
Identifies new patterns in MCP server development and generates content topics.

## Error Handling

The system implements graceful degradation:
- **API Failures**: Retry with exponential backoff
- **Data Validation**: Skip invalid entries, continue processing
- **File System Errors**: Attempt backup locations
- **Network Issues**: Fall back to cached data when available

## Monitoring

- All operations are logged with timestamps and levels
- Error metrics are tracked and reported
- Completion notifications are sent for scheduled jobs
- Performance metrics are collected for optimization

## Contributing

1. Follow TypeScript best practices
2. Write tests for new functionality
3. Update documentation
4. Use the existing code style and patterns

## License

Part of the MyMCPShelf.com project.