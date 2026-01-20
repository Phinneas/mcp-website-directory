#!/usr/bin/env python3
import requests
import json

# List of repos to check directly
direct_checks = [
    "https://github.com/pulumi/mcp-server",
    "https://github.com/ubie-oss/discord-mcp-server",
    "https://github.com/telegram-mcp/server",
    "https://github.com/hangye/chrome-mcp",
    "https://github.com/notte/mcp-server",
    "https://github.com/mongodb/mcp-server",
    "https://github.com/supabase/mcp-server",
    "https://github.com/google/database-toolbox-mcp",
    "https://github.com/docker/mcp-servers",
    "https://github.com/vscode-mcp/server",
    "https://github.com/idosalomon/gitmcp",
    "https://github.com/google-drive-mcp/server",
    "https://github.com/crypto-mcp/binance-server",
    "https://github.com/tavily-ai/mcp-server",
    "https://github.com/stripe/mcp-server",
    "https://github.com/jeomon/windows-desktop-mcp",
    "https://github.com/aws/bedrock-mcp-server",
    "https://github.com/aws/aws-docs-mcp",
    "https://github.com/aws-labs/mcp-aws-secrets-manager",
    "https://github.com/mheob/mcp-server-todo-txt",
    "https://github.com/vespaiach/pandoc_mcp_server",
    "https://github.com/dylsteck/farcaster-mcp",
    "https://github.com/parthpatel6347/rubygems-mcp",
    "https://github.com/MindscapeHQ/raygun-mcp",
    "https://github.com/eniehack/gitlab-mcp-server",
    "https://github.com/apacholik/docker-mcp-server",
    "https://github.com/ianho/tmux-mcp-server",
    "https://github.com/exa-labs/filesystem-tree-mcp",
    "https://github.com/cloudnative/k8s-mcp-server",
    "https://github.com/Homebrew/homebrew-mcp",
    "https://github.com/jenkinsci/mcp-plugin",
    "https://github.com/hashicorp/terraform-mcp",
    "https://github.com/firebase/firebase-mcp",
    "https://github.com/redis/redis-mcp",
    "https://github.com/elastic/elasticsearch-mcp",
    "https://github.com/supabase/supabase-mcp",
    "https://github.com/vercel/vercel-mcp",
    "https://github.com/mongodb/mongodb-mcp"
]

# Known good MCP repositories from awesome-mcp-servers
known_good_mcp_servers = {
    "discord": ["v-3/discordmcp", "modelcontextprotocol/servers"],
    "telegram": ["sesam/telegram-mcp", "MentalGear/telegram-mcp"],
    "chrome": ["lxe/chrome-mcp", "hangwin/mcp-chrome", "ChromeDevTools/chrome-devtools-mcp"],
    "mongodb": ["kdblue/mongodb-mcp", "modelcontextprotocol/servers"],
    "supabase": ["modelcontextprotocol/servers", "yerlantemir/supabase-mcp"],
    "docker": ["docker/hub-mcp", "modelcontextprotocol/servers"],
    "git": ["idosal/git-mcp", "komputerwiz/git-mcp"],
    "google-drive": ["tanarurkerem/google-drive-mcp", "modelcontextprotocol/servers"],
    "stripe": ["stripe/stripe-mcp", "modelcontextprotocol/servers"],
    "aws": ["awslabs/mcp", "modelcontextprotocol/servers"],
    "gitlab": ["modelcontextprotocol/servers"],
    "docker": ["docker/hub-mcp", "modelcontextprotocol/servers"],
    "k8s": ["modelcontextprotocol/servers"],
    "terraform": ["modelcontextprotocol/servers"],
    "firebase": ["modelcontextprotocol/servers"],
    "redis": ["modelcontextprotocol/servers"],
    "elasticsearch": ["modelcontextprotocol/servers"],
    "vercel": ["modelcontextprotocol/servers"],
    "jenkins": ["jenkinsci/mcp"],
    "todo-txt": ["modelcontextprotocol/servers"],
    "pandoc": ["vespian/pandoc-mcp"],
    "farcaster": ["dylsteck/farcaster-mcp"],
    "rubygems": ["modelcontextprotocol/servers"],
    "raygun": ["modelcontextprotocol/servers"],
    "tmux": ["modelcontextprotocol/servers"],
    "filesystem-tree": ["modelcontextprotocol/servers"],
    "homebrew": ["modelcontextprotocol/servers"],
    "pulumi": ["modelcontextprotocol/servers"],
    "vscode": ["modelcontextprotocol/servers"],
    "gitmcp": ["idosal/git-mcp"],
    "crypto": ["modelcontextprotocol/servers"],
    "tavily": ["modelcontextprotocol/servers"],
    "windows-desktop": ["modelcontextprotocol/servers"],
    "todo-txt": ["modelcontextprotocol/servers"],
    "bedrock": ["awslabs/mcp"],
    "aws-docs": ["awslabs/mcp"],
    "aws-secrets": ["awslabs/mcp"],
    "database-toolbox": ["googleapis/genai-toolbox"]
}

results = {}

# Check direct URLs
print("Checking direct URLs...")
for url in direct_checks:
    repo = url.replace("https://github.com/", "")
    print(f"\nChecking {repo}...")
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print(f"  ✓ EXISTS")
            results[repo] = {"status": "found", "url": url}
        elif response.status_code == 404:
            print(f"  ✗ 404 - Not found")
            
            # Try to find alternatives
            parts = repo.split('/')
            if len(parts) == 2:
                org, name = parts
                
                # Search for common patterns
                common_alternatives = [
                    f"{org}/{name}-server",
                    f"{org}/mcp-{name}",
                    f"{org}/{name}-mcp",
                ]
                
                for alt in common_alternatives:
                    alt_url = f"https://github.com/{alt}"
                    try:
                        r = requests.head(alt_url, timeout=5)
                        if r.status_code == 200:
                            print(f"  → Found alternative: {alt}")
                            results[repo] = {"status": "alternative", "url": alt_url}
                            break
                    except:
                        pass
        else:
            print(f"  ? Status: {response.status_code}")
    except Exception as e:
        print(f"  Error: {e}")

print("\n" + "="*80)
print("SECONDARY RESEARCH - Checking known MCP repositories...")
print("="*80)

# Check the modelcontextprotocol/servers mono repo which has many of these
print("\nChecking modelcontextprotocol/servers...")
try:
    response = requests.get("https://api.github.com/repos/modelcontextprotocol/servers/contents/src", timeout=10)
    if response.status_code == 200:
        contents = response.json()
        mcp_servers = [item['name'] for item in contents if item['type'] == 'dir']
        print(f"  Found MCP servers: {', '.join(mcp_servers[:10])}...")
except Exception as e:
    print(f"  Error checking modelcontextprotocol/servers: {e}")

print("\nResults:")
for repo, info in results.items():
    print(f"  {repo}: {info}")
