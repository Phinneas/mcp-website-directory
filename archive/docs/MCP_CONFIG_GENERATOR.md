# MCP Config Generator Documentation

## Overview

The MCP Config Generator is a client-side JavaScript tool that allows users to select their MCP client and servers, then generate ready-to-use configuration JSON blocks instantly.

## Quick Presets

Pre-packaged server combinations for common use cases - select multiple servers with one click!

### Available Presets (15 Total)

| Preset | Icon | Servers | Difficulty | Time | Target User |
|--------|------|---------|-----------|------|-------------|
| **Claude Code Assistant** | 🤖 | GitHub, File System, Commander | Beginner | 3 min | Developers new to MCP |
| **Minimal Setup** | ⚡ | GitHub, File System | Beginner | 2 min | Quick start for beginners |
| **Full Development Stack** | 👨‍💻 | GitHub, File System, PostgreSQL, Puppeteer | Intermediate | 5 min | Full-stack developers |
| **The Notion Alternative** | 📝 | SQLite, File System, Obsidian | Beginner | 5 min | Knowledge management users |
| **Local-First Privacy** | 🔒 | File System, Ollama, Local PDF | Intermediate | 5 min | Privacy-conscious users |
| **Local First** | 🏠 | File System, SQLite, Puppeteer | Beginner | 3 min | Offline/privacy users |
| **Web Automation** | 🌐 | Puppeteer, GitHub, File System | Beginner | 5 min | QA and web scrapers |
| **AI Development** | 🤖 | LangChain, LlamaIndex, GitHub, File System | Intermediate | 8 min | AI/ML developers |
| **AI Engineering** | 🧠 | LangSmith, Pinecone, ChromaDB, GitHub | Advanced | 12 min | AI builders (RAG/LLM) |
| **Database Admin** | 🗄️ | PostgreSQL, SQLite, MongoDB, Redis | Intermediate | 10 min | DBAs and backend devs |
| **Team Collaboration** | 👥 | Slack, Discord, Google Workspace | Intermediate | 10 min | Team communication |
| **Marketing Ops Stack** | 📈 | Airtable, Slack, Webflow, Analytics | Intermediate | 10 min | Growth/marketing teams |
| **Data Pipeline** | 📊 | MindsDB, Activepieces, PostgreSQL, Redis | Advanced | 15 min | Data engineers |
| **Cloud Infrastructure** | ☁️ | AWS, Azure, GCP, Kubernetes | Advanced | 15 min | DevOps engineers |
| **Security Tools** | 🔒 | GitHub, AWS, Kubernetes | Advanced | 12 min | Security teams |

### Preset Categories

#### Beginner (5 presets)
- 🤖 Claude Code Assistant - Perfect starter for MCP newcomers
- ⚡ Minimal Setup - GitHub + File system essentials
- 📝 The Notion Alternative - Knowledge management without the cloud
- 🏠 Local First - Offline-first development
- 🌐 Web Automation - Browser testing and scraping

#### Intermediate (5 presets)
- 👨‍💻 Full Development Stack - Complete developer toolkit
- 🔒 Local-First Privacy - AI without the cloud
- 🤖 AI Development - LLM application building
- 🗄️ Database Admin - Multi-database management
- 👥 Team Collaboration - Communication tools
- 📈 Marketing Ops Stack - Growth team automation

#### Advanced (4 presets)
- 🧠 AI Engineering - RAG pipelines and vector stores
- 📊 Data Pipeline - ETL and data engineering
- ☁️ Cloud Infrastructure - Multi-cloud management
- 🔒 Security Tools - Auditing and compliance

### Using Presets

1. Open the Config Generator (`/mcp-tools`)
2. Browse available presets or click "View All" to see all options
3. Click on any preset card to auto-select servers
4. Review preset details (benefits, required env vars)
5. Select your MCP client
6. Click "Copy to Clipboard"
7. Paste into your config file

### Preset Benefits

Each preset includes:
- **Quick Selection** - One click selects multiple servers
- **Curated Combinations** - Expert-recommended setups
- **Difficulty Rating** - Beginner/Intermediate/Advanced
- **Setup Time Estimate** - Know how long configuration will take
- **Required Credentials** - See what env vars you'll need upfront

## Features

### Supported Clients
- **Claude Desktop** - `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- **Cursor** - `~/.cursor/mcp_config.json`
- **Cline (VS Code Extension)** - `~/.cline/mcp_config.json`
- **Continue (VS Code Extension)** - `~/.continue/mcp_config.json`
- **VS Code Official** - `~/.vscode/mcp_config.json`

### Key Capabilities

1. **Quick Presets** - One-click server combinations for common use cases
2. **One-Click Setup** - No manual JSON editing required
3. **Client-Specific Formats** - Automatically generates correct config for each client
4. **Copy to Clipboard** - Instant copy with clear save instructions
5. **Search & Filter** - Quickly find servers by name or description
6. **Bulk Selection** - Select all or clear all with one click
7. **Environment Variables** - Includes example env vars for servers that need them

## Usage

### Web Interface

1. Visit `/mcp-config-generator` or `/mcp-tools` on your MyMCPShelf site
2. **Choose a Preset** (Optional) - Click on any preset card for quick setup
3. **Select Your Client** - Choose from the dropdown (Claude Desktop, Cursor, Cline, Continue, VS Code)
4. **Search Servers** (Optional) - Use the search bar to filter by name or description
5. **Select Servers** - Click on servers to add them, or use "Select All"
6. **Generate Config** - Configuration appears automatically when servers are selected
7. **Copy & Save** - Click "Copy to Clipboard", then save to the indicated config path

### Example Generated Config

```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "npx @modelcontextprotocol/server-github"
    },
    "filesystem-mcp": {
      "command": "npx file-system-mcp-server",
      "args": []
    }
  }
}
```

### Configuration File Locations

| Client | Config Path |
|--------|-------------|
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\\Claude\\claude_desktop_config.json` |
| Claude Desktop (Linux) | `~/.config/Claude/claude_desktop_config.json` |
| Cursor | `~/.cursor/mcp_config.json` |
| Cline | `~/.cline/mcp_config.json` |
| Continue | `~/.continue/mcp_config.json` |
| VS Code | `~/.vscode/mcp_config.json` |

### Server Configuration Format

Each server in the generated config includes:

```json
{
  "command": "npx packageName",  // The npx command to start the server
  "args": [],                   // Optional arguments (empty by default)
  "env": {}                     // Optional environment variables
}
```

#### Special Configuration Examples

**GitHub MCP Server** (requires token):
```json
{
  "github-mcp": {
    "command": "npx @modelcontextprotocol/server-github",
    "env": {
      "GITHUB_TOKEN": "<your-github-token>"
    }
  }
}
```

**PostgreSQL MCP Server** (requires connection string):
```json
{
  "postgres-mcp": {
    "command": "npx postgres-mcp",
    "env": {
      "DATABASE_URL": "postgresql://user:password@localhost:5432/dbname"
    }
  }
}
```

**Google Workspace MCP Server** (requires OAuth):
```json
{
  "gdrive-mcp": {
    "command": "npx gdrive-mcp-server",
    "env": {
      "OAUTH_TOKEN": "<your-oauth-token>",
      "CLIENT_ID": "<your-client-id>",
      "CLIENT_SECRET": "<your-client-secret>"
    }
  }
}
```

## Integration Guide

### In Astro Pages

```astro
---
import MCPConfigGenerator from '../components/MCPConfigGenerator';
import { staticServers } from '../data/staticServers.js';
---

<MCPConfigGenerator 
  client:load
  servers={staticServers}
/>
```

### Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `servers` | `MCPServer[]` | Yes | Array of MCP server objects with configuration data |
| - | - | - | Servers must have: `id`, `fields.name`, `fields.description`, `fields.npm_package` |

### MCPServer Interface

```typescript
interface MCPServer {
  id: string;
  fields: {
    name: string;
    description: string;
    npm_package?: string;
    github_url?: string;
    category?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
  };
}
```

## Implementation Details

### Client-Side Generation

The config generator runs entirely in the browser using React. This means:
- ✅ No server-side rendering required
- ✅ Instant response times
- ✅ Works with Ghost CMS or any CMS
- ✅ No API calls needed

### State Management

Uses React hooks for:
- Server selection (Set<string>)
- Client selection (string)
- Search filtering
- Config generation

### Configuration Formatting

Each client format is defined in `CLIENT_CONFIGS` with:
- `name` - Display name
- `configPath` - Where to save the config file
- `format(servers)` - Function to transform server configs to client format

## Future Enhancements

### Potential Additions

1. **Presets** - Pre-configured server groups (e.g., "Development", "Database", "Cloud")
2. **Config Validation** - Check if servers are installed before generating
3. **Export Options** - Download as JSON file
4. **Import Exisitng Config** - Load and edit existing configs
5. **Version Control** - Track config changes
6. **Cloud Sync** - Save configs to account
7. **Server Dependencies** - Show servers that depend on others
8. **Advanced Configuration** - Support for non-npx servers, Docker, local paths

### Integration with Ghost CMS

To store server connection details in Ghost:

```json
{
  "server": "github-mcp",
  "fields": {
    "name": "GitHub MCP Server",
    "config": {
      "command": "npx @modelcontextprotocol/server-github",
      "args": [],
      "env": {
        "GITHUB_TOKEN": "PLACEHOLDER"
      }
    }
  }
}
```

Use Ghost tags/metadata:
- `mcp-server:github-mcp` - Tag for quick filtering
- `category:development` - Tag for categorization
- `requires-token:true` - Metadata for auth requirements

## Troubleshooting

### Config Not Loading in Client

1. **Check file location** - Verify path is correct for your OS
2. **Validate JSON** - Use a JSON validator to ensure no syntax errors
3. **Restart client** - Required for config changes to take effect
4. **Server not running** - Ensure `npx` can connect to internet
5. **Permissions** - Config file must be readable by the client

### Common Errors

**"Server not found"**:
- Verify the server npm package name is correct
- Try installing globally first: `npm install -g package-name`

**"Permission denied"**:
- Check file permissions: `chmod 644 ~/.config/Client/config.json`
- Ensure directory exists: `mkdir -p ~/.config/Client`

**"Invalid JSON"**:
- Use a JSON validator to check syntax
- Make sure no trailing commas

## Performance

- **Initial Load**: < 100ms (with 100+ servers)
- **Search**: Instant (< 10ms)
- **Config Generation**: < 20ms
- **Copy to Clipboard**: < 5ms

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Security Notes

- Generated configs use placeholder values for sensitive data (tokens, API keys)
- Users must replace placeholders with actual credentials
- Configs are generated client-side, never sent to server
- No credentials stored or logged

## Contributing

To add support for a new client:

1. Add to `CLIENT_CONFIGS` in `src/components/MCPConfigGenerator.tsx`:
```typescript
'new-client': {
  name: 'New Client',
  configPath: '~/.newclient/mcp_config.json',
  format: (servers) => ({
    // Client-specific format here
    mcpServers: servers.reduce(...)
  })
}
```

2. Update docs with config path and format requirements

## License

MIT
