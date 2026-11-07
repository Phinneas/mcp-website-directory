# MCP Newsletter System

Automated newsletter generation and publishing system for the Model Context Protocol (MCP) ecosystem using Beehiiv.

## Features

### Weekly Newsletter (Automated)
- **SDK Updates**: Servers that have updated to the latest MCP SDK
- **Staleness Alerts**: Servers crossing the 180-day staleness threshold
- **New Servers**: Fresh additions with security and deployment classifications
- **Cross-promotion**: Integration with AI Dispatch

### Monthly Newsletter (Curated)
- **Top 10 Most Maintained**: Leaderboard of best-maintained servers
- **Security Roundup**: Security incidents and resolutions
- **Featured Skill Pack**: Curated server collections for specific use cases
- **Cross-promotion**: Integration with AI Dispatch

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Beehiiv Configuration
BEEHIIV_API_KEY=your_beehiiv_api_key_here
BEEHIIV_PUBLICATION_ID=your_publication_id_here

# Tavily Configuration (for server discovery)
TAVILY_API_KEY=your_tavily_api_key_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. GitHub Secrets

Add the following secrets to your GitHub repository:
- `BEEHIIV_API_KEY`
- `BEEHIIV_PUBLICATION_ID`
- `TAVILY_API_KEY`

## Usage

### Manual Generation

```bash
# Generate and publish weekly newsletter
npm run newsletter:weekly

# Generate and publish monthly newsletter
npm run newsletter:monthly

# Test generation without publishing
npm run newsletter test-weekly
npm run newsletter test-monthly

# Preview newsletter content
npm run newsletter preview-weekly
npm run newsletter preview-monthly
```

### Automated Scheduling

The system includes GitHub Actions workflows that automatically:
- Generate weekly newsletters every Monday at 9 AM UTC
- Generate monthly newsletters on the 1st of each month at 9 AM UTC

### Local Scheduler Daemon

For local development or self-hosted automation:

```bash
npm run newsletter:schedule
```

## Architecture

### Core Components

1. **NewsletterGenerator** (`scripts/newsletter/generator.ts`)
   - Generates newsletter content from MCP server data
   - Handles both weekly and monthly formats
   - Integrates with storage system for server information

2. **BeehiivClient** (`scripts/newsletter/beehiiv-client.ts`)
   - Handles Beehiiv API integration
   - Manages newsletter publishing and scheduling

3. **NewsletterScheduler** (`scripts/newsletter/scheduler.ts`)
   - Manages automated scheduling
   - Prevents duplicate runs
   - Handles error recovery

4. **CLI Interface** (`scripts/newsletter/cli.ts`)
   - Command-line interface for manual operations
   - Testing and preview capabilities

### Data Sources

- **Server Database**: Uses existing storage system for MCP server information
- **GitHub Integration**: Analyzes repositories for maintenance metrics
- **Security Monitoring**: Tracks security incidents and vulnerabilities
- **SDK Tracking**: Monitors MCP SDK adoption and updates

## Newsletter Content

### Weekly Newsletter Sections

1. **SDK Updates**
   - Servers updated to latest MCP SDK version
   - Automatic detection via package.json/requirements.txt analysis

2. **Staleness Alert**
   - Servers with no commits in 180+ days
   - Helps maintain ecosystem health

3. **New Servers**
   - Recently discovered servers
   - Security classification (secure/review_needed/high_risk)
   - Deployment classification (production_ready/development/experimental)

### Monthly Newsletter Sections

1. **Top 10 Most Maintained**
   - Ranked by maintenance score
   - Based on commit frequency, issue resolution, documentation quality

2. **Security Incident Roundup**
   - Security vulnerabilities discovered
   - Incident severity and resolution status
   - Best practices recommendations

3. **Featured Skill Pack**
   - Curated collection of servers for specific use cases
   - Installation and configuration guides
   - Real-world usage examples

## Cross-Promotion Strategy

### AI Dispatch Integration
- **Audience Differentiation**: MCP-focused vs. broader AI industry
- **Minimal Cannibalization**: Different content focus areas
- **Mutual Benefit**: Cross-referral for specialized content

### Content Sharing
- Link to AI Dispatch for broader AI industry news
- Highlight MCP-specific content in AI Dispatch
- Joint coverage of major MCP ecosystem developments

## Customization

### Newsletter Templates

HTML and text templates are embedded in the generator. To customize:

1. Edit `generateWeeklyHTML()` and `generateWeeklyText()` methods
2. Modify CSS styles in the HTML templates
3. Update content sections and formatting

### Scheduling

Modify scheduling in `.github/workflows/newsletter.yml`:

```yaml
schedule:
  # Custom schedule using cron syntax
  - cron: '0 10 * * 2'  # Tuesdays at 10 AM UTC
```

### Content Sources

Extend data gathering methods:

```typescript
// Add custom content sources
private async getCustomContent(): Promise<CustomContent[]> {
  // Your custom logic here
}
```

## Monitoring and Analytics

### Newsletter Metrics
- Open rates and click-through rates (via Beehiiv)
- Subscriber growth and engagement
- Content performance analysis

### System Health
- Newsletter generation success/failure rates
- API response times and error rates
- Data freshness and accuracy metrics

## Troubleshooting

### Common Issues

1. **Beehiiv API Errors**
   - Check API key validity
   - Verify publication ID
   - Review rate limiting

2. **Missing Server Data**
   - Ensure storage system is populated
   - Check Tavily API connectivity
   - Verify data synchronization

3. **Scheduling Issues**
   - Check GitHub Actions permissions
   - Verify cron syntax
   - Review workflow logs

### Debug Mode

Enable detailed logging:

```bash
DEBUG=newsletter:* npm run newsletter:weekly
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

### Development Setup

```bash
# Install development dependencies
npm install

# Run tests
npm test

# Preview newsletter locally
npm run newsletter preview-weekly
```

## License

MIT License - see LICENSE file for details.
