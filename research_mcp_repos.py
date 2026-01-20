#!/usr/bin/env python3
import requests
import json
import time

repos = [
    "pulumi/mcp-server",
    "ubie-oss/discord-mcp-server",
    "telegram-mcp/server",
    "hangye/chrome-mcp",
    "notte/mcp-server",
    "mongodb/mcp-server",
    "supabase/mcp-server",
    "google/database-toolbox-mcp",
    "docker/mcp-servers",
    "vscode-mcp/server",
    "idosalomon/gitmcp",
    "google-drive-mcp/server",
    "crypto-mcp/binance-server",
    "tavily-ai/mcp-server",
    "stripe/mcp-server",
    "jeomon/windows-desktop-mcp",
    "aws/bedrock-mcp-server",
    "aws/aws-docs-mcp",
    "aws-labs/mcp-aws-secrets-manager",
    "mheob/mcp-server-todo-txt",
    "vespaiach/pandoc_mcp_server",
    "dylsteck/farcaster-mcp",
    "parthpatel6347/rubygems-mcp",
    "MindscapeHQ/raygun-mcp",
    "eniehack/gitlab-mcp-server",
    "apacholik/docker-mcp-server",
    "ianho/tmux-mcp-server",
    "exa-labs/filesystem-tree-mcp",
    "cloudnative/k8s-mcp-server",
    "Homebrew/homebrew-mcp",
    "jenkinsci/mcp-plugin",
    "hashicorp/terraform-mcp",
    "firebase/firebase-mcp",
    "redis/redis-mcp",
    "elastic/elasticsearch-mcp",
    "supabase/supabase-mcp",
    "vercel/vercel-mcp",
    "mongodb/mongodb-mcp"
]

results = {}

for repo in repos:
    print(f"\n{'='*60}")
    print(f"Searching for: {repo}")
    print('='*60)
    
    org, name = repo.split('/')
    results[repo] = {"status": "not_found", "alternatives": []}
    
    # First check if the repo exists directly
    try:
        response = requests.get(f"https://api.github.com/repos/{repo}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Found: {repo}")
            print(f"  Stars: {data.get('stargazers_count', 0)}")
            print(f"  Last updated: {data.get('updated_at')}")
            results[repo] = {
                "status": "found",
                "url": f"https://github.com/{repo}",
                "stars": data.get('stargazers_count', 0),
                "updated": data.get('updated_at')
            }
            continue
    except Exception as e:
        print(f"Error checking {repo}: {e}")
    
    # Search for similar repositories by the same org
    try:
        print(f"  Searching for alternatives in {org}...")
        search_url = f"https://api.github.com/search/repositories?q=user:{org}+{name}+in:name,description"
        response = requests.get(search_url)
        if response.status_code == 200:
            data = response.json()
            if data.get('items'):
                for item in data['items'][:2]:
                    alt = {
                        "full_name": item['full_name'],
                        "url": item['html_url'],
                        "stars": item['stargazers_count'],
                        "description": item.get('description', '')
                    }
                    results[repo]['alternatives'].append(alt)
                    print(f"  → {item['full_name']} ({item['stargazers_count']} stars)")
    except Exception as e:
        print(f"  Error searching in org: {e}")
    
    # General search for the MCP functionality
    try:
        print(f"  Searching globally for similar MCP servers...")
        search_terms = name.replace('-', '+')
        search_url = f"https://api.github.com/search/repositories?q={search_terms}+mcp+in:name,description&sort=stars&order=desc"
        response = requests.get(search_url)
        if response.status_code == 200:
            data = response.json()
            if data.get('items'):
                for item in data['items'][:3]:
                    if item['full_name'] != repo:
                        alt = {
                            "full_name": item['full_name'],
                            "url": item['html_url'],
                            "stars": item['stargazers_count'],
                            "description": item.get('description', '')
                        }
                        results[repo]['alternatives'].append(alt)
                        print(f"  → {item['full_name']} ({item['stargazers_count']} stars)")
    except Exception as e:
        print(f"  Error global search: {e}")
    
    time.sleep(1)  # Rate limiting

# Save results
with open('mcp_research_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\n" + "="*60)
print("Research complete! Results saved to mcp_research_results.json")
