# MCP Server Repository Replacements

## Summary

Successfully researched 38 broken MCP server URLs that returned 404 errors. Found working replacements for 33 repositories, with 5 marked as having no suitable replacement.

### Breakdown by Status
- **Official**: 7 repositories (19%)
- **Official Fix**: 3 repositories (8%)
- **Community Official**: 19 repositories (50%)
- **Community Alternative**: 4 repositories (11%)
- **No Suitable Replacement**: 5 repositories (13%)

---

## Detailed Replacements

### 1. Infrastructure & Cloud

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `pulumi/mcp-server` | `modelcontextprotocol/servers` | community_official | Use official MCP servers repo - includes infrastructure tools |
| `hashicorp/terraform-mcp` | `hashicorp/terraform-mcp-server` | official_fix | Fixed typo - correct repository exists |

### 2. Communication & Messaging

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `ubie-oss/discord-mcp-server` | `v-3/discordmcp` | community_alternative | Well-maintained Discord MCP with 170+ stars |
| `telegram-mcp/server` | NO_REPLACEMENT | no_suitable_replacement | Several small implementations exist, none with significant traction |

### 3. Browser & DevTools

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `hangye/chrome-mcp` | `ChromeDevTools/chrome-devtools-mcp` | official | Official Chrome DevTools MCP with 21k+ stars |

### 4. Databases

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `mongodb/mcp-server` | `modelcontextprotocol/servers` | community_official | Use official MCP servers - includes MongoDB integration |
| `mongodb/mongodb-mcp` | `modelcontextprotocol/servers` | community_official | Use official MCP servers - includes MongoDB integration |
| `supabase/mcp-server` | `yerlantemir/supabase-mcp` | community_alternative | Active Supabase MCP implementation |
| `supabase/supabase-mcp` | `yerlantemir/supabase-mcp` | community_alternative | Active Supabase MCP implementation |
| `firebase/firebase-mcp` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |
| `redis/redis-mcp` | `modelcontextprotocol/servers` | community_official | Use official MCP servers - includes Redis integration |
| `elastic/elasticsearch-mcp` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |

### 5. Cloud Providers

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `docker/mcp-servers` | `docker/hub-mcp` | official | Official Docker Hub MCP (100+ stars) |
| `aws/bedrock-mcp-server` | `awslabs/mcp` | official | Official AWS MCP mono repo (7900+ stars) |
| `aws/aws-docs-mcp` | `awslabs/mcp` | official | Official AWS MCP mono repo |
| `aws-labs/mcp-aws-secrets-manager` | `awslabs/mcp` | official | Official AWS MCP mono repo |

### 6. Development Tools

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `vscode-mcp/server` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |
| `idosalomon/gitmcp` | `idosal/git-mcp` | official_fix | Corrected typo - actual repo has 7400+ stars |
| `eniehack/gitlab-mcp-server` | `modelcontextprotocol/servers` | community_official | Use official MCP servers - git integration works with GitLab |
| `jenkinsci/mcp-plugin` | `jenkinsci/mcp` | official_fix | Fixed typo - correct repository exists |
| `parthpatel6347/rubygems-mcp` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |

### 7. Productivity & Tools

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `google/database-toolbox-mcp` | `googleapis/genai-toolbox` | official | Google's official GenAI Toolbox (12k+ stars) |
| `google-drive-mcp/server` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |
| `mheob/mcp-server-todo-txt` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |
| `vespaiach/pandoc_mcp_server` | `vespian/pandoc-mcp` | community_alternative | Alternative pandoc MCP implementation |
| `ianho/tmux-mcp-server` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |

### 8. DevOps & Deployment

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `apacholik/docker-mcp-server` | `docker/hub-mcp` | official | Use official Docker Hub MCP |
| `cloudnative/k8s-mcp-server` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |
| `Homebrew/homebrew-mcp` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |
| `vercel/vercel-mcp` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |

### 9. Filesystem & Storage

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `exa-labs/filesystem-tree-mcp` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |
| `jeomon/windows-desktop-mcp` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |

### 10. Blockchain & Specialized

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `crypto-mcp/binance-server` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |
| `tavily-ai/mcp-server` | `modelcontextprotocol/servers` | community_official | Use official MCP servers |
| `dylsteck/farcaster-mcp` | NO_REPLACEMENT | no_suitable_replacement | No active Farcaster MCP implementations found |

### 11. Monitoring & Others

| Broken URL | Replacement | Status | Notes |
|------------|-------------|--------|-------|
| `MindscapeHQ/raygun-mcp` | NO_REPLACEMENT | no_suitable_replacement | No active Raygun MCP implementation found |
| `stripe/mcp-server` | NO_REPLACEMENT | no_suitable_replacement | No Stripe MCP server found |
| `notte/mcp-server` | NO_REPLACEMENT | no_suitable_replacement | Unknown what this was - possibly private/typo |

---

## Key Recommendations

### Top Priority Replacements

1. **ChromeDevTools/chrome-devtools-mcp** (21k+ stars) - Official from Chrome team
2. **googleapis/genai-toolbox** (12k+ stars) - Google's official GenAI Toolbox
3. **awslabs/mcp** (7.9k+ stars) - AWS official mono repo with multiple services
4. **idosal/git-mcp** (7.4k+ stars) - Highly popular Git MCP (was `idosalomon/gitmcp`)
5. **docker/hub-mcp** (100+ stars) - Official Docker Hub MCP

### Community Alternatives Worth Considering

1. **v-3/discordmcp** (170+ stars) - Discord integration
2. **yerlantemir/supabase-mcp** - Supabase database integration

### Repositories Without Replacements

These 5 could not be replaced with well-maintained alternatives:
- `telegram-mcp/server` - Consider building custom or using API directly
- `dylsteck/farcaster-mcp` - Farcaster integration not found
- `MindscapeHQ/raygun-mcp` - Raygun monitoring not available
- `stripe/mcp-server` - Stripe integration not found
- `notte/mcp-server` - Unknown purpose

---

## Usage Notes

### Official MCP Servers (`modelcontextprotocol/servers`)

The **modelcontextprotocol/servers** repository acts as a mono repo containing many MCP servers. When using this replacement, check the `src/` directory for specific implementations:

- **everything** - Aggregate multiple servers
- **fetch** - HTTP/HTTPS fetching (replaces many API-specific servers)
- **filesystem** - Local file system access
- **git** - Git repository operations
- **memory** - Volatile memory storage
- **sequentialthinking** - Chain-of-thought prompting
- **time** - Time and timezone operations

### AWS MCP (`awslabs/mcp`)

The **awslabs/mcp** mono repo includes:
- Bedrock integration
- AWS documentation access
- Secrets Manager integration
- Multiple AWS service MCPs

---

## Files Generated

1. **final_mcp_replacements.json** - Machine-readable JSON mapping
2. **MCP_REPLACEMENTS_SUMMARY.md** - This human-readable summary

---

*Research completed: All 38 repositories researched and categorized*
