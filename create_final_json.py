#!/usr/bin/env python3
import json

# Create the final clean JSON output
replacements = {
    "pulumi/mcp-server": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "ubie-oss/discord-mcp-server": {
        "replacement": "v-3/discordmcp",
        "status": "community_alternative"
    },
    "telegram-mcp/server": {
        "replacement": None,
        "status": "no_suitable_replacement"
    },
    "hangye/chrome-mcp": {
        "replacement": "ChromeDevTools/chrome-devtools-mcp",
        "status": "official"
    },
    "notte/mcp-server": {
        "replacement": None,
        "status": "no_suitable_replacement"
    },
    "mongodb/mcp-server": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "supabase/mcp-server": {
        "replacement": "yerlantemir/supabase-mcp",
        "status": "community_alternative"
    },
    "google/database-toolbox-mcp": {
        "replacement": "googleapis/genai-toolbox",
        "status": "official"
    },
    "docker/mcp-servers": {
        "replacement": "docker/hub-mcp",
        "status": "official"
    },
    "vscode-mcp/server": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "idosalomon/gitmcp": {
        "replacement": "idosal/git-mcp",
        "status": "official_fix"
    },
    "google-drive-mcp/server": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "crypto-mcp/binance-server": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "tavily-ai/mcp-server": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "stripe/mcp-server": {
        "replacement": None,
        "status": "no_suitable_replacement"
    },
    "jeomon/windows-desktop-mcp": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "aws/bedrock-mcp-server": {
        "replacement": "awslabs/mcp",
        "status": "official"
    },
    "aws/aws-docs-mcp": {
        "replacement": "awslabs/mcp",
        "status": "official"
    },
    "aws-labs/mcp-aws-secrets-manager": {
        "replacement": "awslabs/mcp",
        "status": "official"
    },
    "mheob/mcp-server-todo-txt": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "vespaiach/pandoc_mcp_server": {
        "replacement": "vespian/pandoc-mcp",
        "status": "community_alternative"
    },
    "dylsteck/farcaster-mcp": {
        "replacement": None,
        "status": "no_suitable_replacement"
    },
    "parthpatel6347/rubygems-mcp": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "MindscapeHQ/raygun-mcp": {
        "replacement": None,
        "status": "no_suitable_replacement"
    },
    "eniehack/gitlab-mcp-server": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "apacholik/docker-mcp-server": {
        "replacement": "docker/hub-mcp",
        "status": "official"
    },
    "ianho/tmux-mcp-server": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "exa-labs/filesystem-tree-mcp": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "cloudnative/k8s-mcp-server": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "Homebrew/homebrew-mcp": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "jenkinsci/mcp-plugin": {
        "replacement": "jenkinsci/mcp",
        "status": "official_fix"
    },
    "hashicorp/terraform-mcp": {
        "replacement": "hashicorp/terraform-mcp-server",
        "status": "official_fix"
    },
    "firebase/firebase-mcp": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "redis/redis-mcp": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "elastic/elasticsearch-mcp": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "supabase/supabase-mcp": {
        "replacement": "yerlantemir/supabase-mcp",
        "status": "community_alternative"
    },
    "vercel/vercel-mcp": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    },
    "mongodb/mongodb-mcp": {
        "replacement": "modelcontextprotocol/servers",
        "status": "community_official"
    }
}

# Save to file
with open('mcp_replacements_final.json', 'w') as f:
    json.dump(replacements, f, indent=2)

print("✓ Generated final JSON: mcp_replacements_final.json")
print(f"  - {len(replacements)} repositories mapped")

# Create a readable summary
summary = {}
for repo, info in replacements.items():
    status = info["status"]
    if status not in summary:
        summary[status] = []
    summary[status].append(repo)

print("\nSummary by status:")
for status, repos in summary.items():
    print(f"  {status}: {len(repos)} repos")
