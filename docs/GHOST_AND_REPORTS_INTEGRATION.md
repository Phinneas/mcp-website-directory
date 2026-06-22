# Ghost CMS & User Reports Integration

## Overview

This document describes two new features for the MCP Tools Suite:

1. **Ghost CMS Integration** - Store server metadata in Ghost CMS
2. **User-Submitted Compatibility Reports** - Crowdsourced compatibility data

---

## 1. Ghost CMS Integration

### What It Does

Instead of hardcoding MCP server metadata in JavaScript files, you can store it in Ghost CMS. This enables:

- Non-technical users to add/edit servers
- Instant updates without code changes
- Scheduling server announcements
- Better SEO with Ghost's built-in features

### Setup

#### 1. Add Ghost Credentials

Add to `.env.local`:

```env
GHOST_API_URL=https://your-ghost-site.com
GHOST_CONTENT_API_KEY=your_content_api_key_here
```

#### 2. Create Ghost Content API Key

1. Go to Ghost Admin → Settings → Integrations
2. Add new integration: "MCP Directory"
3. Copy the Content API Key

#### 3. Create MCP Server Posts

In Ghost Admin:

1. Create new post
2. Set title: "GitHub MCP Server"
3. Set slug: `github-mcp-server`
4. Add tag: `mcp-server`
5. Add category tag: `development`
6. Set feature image (optional - server logo)

#### 4. Add Metadata

**Option A: Via Code Injection (Recommended)**

In post settings → Code Injection → Head:

```html
<meta name="mcp-npm-package" content="@modelcontextprotocol/server-github">
<meta name="mcp-github-url" content="https://github.com/github/github-mcp-server">
<meta name="mcp-category" content="development">
<meta name="mcp-language" content="TypeScript">
<meta name="mcp-docker-image" content="modelcontextprotocol/server-github:latest">
<meta name="mcp-env-vars" content="GITHUB_TOKEN">
<meta name="mcp-stars" content="1200">
```

**Option B: Via Excerpt**

```
npm: @modelcontextprotocol/server-github
github: https://github.com/github/github-mcp-server
category: development
language: TypeScript
env: GITHUB_TOKEN
```

### API Usage

```javascript
import { 
  fetchGhostMCPServers, 
  fetchGhostMCPServer,
  transformGhostServerToInternal 
} from '../utils/ghostApi.js';

// Fetch all servers
const ghostServers = await fetchGhostMCPServers();

// Fetch single server
const server = await fetchGhostMCPServer('github-mcp-server');

// Transform to internal format
const internalServer = transformGhostServerToInternal(ghostServers[0]);
```

### Available Functions

| Function | Description |
|----------|-------------|
| `fetchGhostMCPServers()` | Get all MCP servers from Ghost |
| `fetchGhostMCPServer(slug)` | Get single server by slug |
| `fetchGhostMCPServersByCategory(category)` | Get servers by category |
| `searchGhostMCPServers(query)` | Search servers |
| `transformGhostServerToInternal(ghost)` | Convert Ghost format to internal |
| `isGhostAvailable()` | Check if Ghost is configured |
| `getGhostConfig()` | Get Ghost configuration status |

### Ghost Post Structure

| Ghost Field | MCP Field | Description |
|-------------|-----------|-------------|
| `slug` | `id` | Server identifier |
| `title` | `name` | Server display name |
| `excerpt` | `description` | Server description |
| `feature_image` | `logoUrl` | Server logo |
| `published_at` | - | Release date |
| `updated_at` | `updated` | Last update |
| `tags` | `category` | Server category |

### Fallback Behavior

If Ghost is not configured or API fails, the system automatically falls back to static server data from `src/data/staticServers.js`.

---

## 2. User-Submitted Compatibility Reports

### What It Does

Users can submit their own compatibility test results, which are:

- Stored in browser localStorage
- Displayed in the Compatibility Matrix
- Used to calculate aggregate status
- Voted on by other users

### Report Structure

```typescript
interface CompatibilityReport {
  id: string;                    // Unique report ID
  clientId: string;              // Client identifier (e.g., 'claude-desktop')
  clientName: string;            // Client display name
  serverId: string;              // Server identifier (e.g., 'github-mcp')
  serverName: string;            // Server display name
  status: 'works' | 'partial' | 'broken' | 'unknown';
  transport: 'stdio' | 'sse' | 'both';
  notes: string;                 // User notes
  version: string;               // Client version tested
  timestamp: number;             // Submission timestamp
  verified: boolean;             // Admin verified
  upvotes: number;               // Upvote count
  downvotes: number;             // Downvote count
}
```

### API Usage

```javascript
import {
  submitReport,
  getAllReports,
  getReportsForPair,
  getReportsForClient,
  getReportsForServer,
  upvoteReport,
  downvoteReport,
  getAggregateStatus,
  mergeWithBaseMatrix,
  exportReports,
  importReports
} from '../data/compatibilityReports.js';

// Submit a report
submitReport({
  clientId: 'claude-desktop',
  clientName: 'Claude Desktop',
  serverId: 'github-mcp',
  serverName: 'GitHub MCP',
  status: 'works',
  transport: 'stdio',
  notes: 'Works perfectly',
  version: '0.4.0'
});

// Get reports for a client-server pair
const reports = getReportsForPair('claude-desktop', 'github-mcp');

// Get aggregate status
const aggregate = getAggregateStatus('claude-desktop', 'github-mcp');
// Returns: { status: 'works', confidence: 95, reportCount: 5 }

// Vote on a report
upvoteReport('report_123');
downvoteReport('report_123');

// Export reports for backup
const json = exportReports();

// Import reports
importReports(json);
```

### Available Functions

| Function | Description |
|----------|-------------|
| `submitReport(input)` | Submit new compatibility report |
| `getAllReports()` | Get all stored reports |
| `getReportsForPair(client, server)` | Get reports for a pair |
| `getReportsForClient(client)` | Get reports for a client |
| `getReportsForServer(server)` | Get reports for a server |
| `upvoteReport(id)` | Upvote a report |
| `downvoteReport(id)` | Downvote a report |
| `getAggregateStatus(client, server)` | Calculate combined status |
| `getReportStats()` | Get report statistics |
| `mergeWithBaseMatrix(base)` | Merge reports with base matrix |
| `exportReports()` | Export as JSON |
| `importReports(json)` | Import from JSON |
| `clearAllReports()` | Delete all reports |

### User Flow

1. User clicks cell in Compatibility Matrix
2. Details panel shows existing user reports
3. User clicks "Submit Your Report"
4. Form appears with client/server pre-filled
5. User selects status, transport, adds notes
6. Report saved to localStorage
7. Aggregate status recalculated

### Voting System

- Users can upvote or downvote reports
- Weighted voting: `weight = 1 + upvotes - downvotes`
- Reports with negative weight have minimum weight of 1
- Aggregate status uses weighted voting

### Storage Limits

- Maximum 500 reports stored locally
- Older reports automatically removed when limit reached
- Reports can be exported/imported for backup

### Statistics Available

```javascript
const stats = getReportStats();
// Returns:
{
  total: 150,
  byStatus: { works: 80, partial: 30, broken: 20, unknown: 20 },
  byClient: { 'claude-desktop': 50, 'cursor': 40, ... },
  byServer: { 'github-mcp': 30, 'filesystem-mcp': 25, ... },
  verified: 10
}
```

---

## Integration Guide

### Adding to Compatibility Matrix

The `CompatibilityMatrix` component now includes:

1. **User Reports Section** - Shows existing reports
2. **Submit Report Form** - Allows new submissions
3. **Voting Buttons** - Upvote/downvote functionality
4. **Aggregate Status** - Combined status from all reports

### Adding Ghost Data to Tools

```astro
---
import { fetchGhostMCPServers, transformGhostServerToInternal } from '../utils/ghostApi.js';
import { staticServers } from '../data/staticServers.js';

// Try Ghost first, fallback to static
let servers = [];
try {
  const ghostServers = await fetchGhostMCPServers();
  if (ghostServers.length > 0) {
    servers = ghostServers.map(transformGhostServerToInternal);
  } else {
    servers = staticServers;
  }
} catch {
  servers = staticServers;
}
---

<MCPConfigGenerator servers={servers} />
<StackBuilder servers={servers} />
<CompatibilityMatrix servers={servers} />
```

---

## Environment Variables Required

Add to `.env.local`:

```env
# Ghost CMS Integration
GHOST_API_URL=https://your-ghost-site.com
GHOST_CONTENT_API_KEY=your_content_api_key

# Optional - for higher GitHub API limits
GITHUB_TOKEN=ghp_your_token
```

---

## Security Considerations

### Ghost CMS
- Uses Content API Key (read-only)
- No Admin API access needed
- Public content only

### User Reports
- Stored locally in browser
- No server transmission
- No PII collected
- Users control their own data

---

## Performance

| Operation | Time |
|-----------|------|
| Fetch Ghost servers | < 500ms |
| Submit report | < 10ms |
| Load reports | < 5ms |
| Calculate aggregate | < 5ms |

---

## Troubleshooting

### Ghost Not Loading

1. Check `GHOST_API_URL` is correct
2. Verify `GHOST_CONTENT_API_KEY` is valid
3. Ensure posts are tagged with `mcp-server`
4. Check Ghost site is publicly accessible

### Reports Not Saving

1. Check localStorage is enabled
2. Clear old reports: `clearAllReports()`
3. Check browser storage quota

### Import/Export Failing

1. Verify JSON format is correct
2. Check file size (max ~5MB for localStorage)
3. Ensure report structure matches schema

---

## Future Enhancements

- Sync reports to cloud/API
- Ghost webhook support
- Report verification workflow
- Historical report trends
- Email notifications for new reports
