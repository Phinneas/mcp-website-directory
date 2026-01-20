#!/usr/bin/env python3
import requests
import json
import time
from datetime import datetime

# List of broken repositories to find replacements for
broken_repos = [
    {"broken": "pulumi/mcp-server", "type": "infrastructure", "keywords": ["pulumi", "infrastructure", "iac"]},
    {"broken": "ubie-oss/discord-mcp-server", "type": "communication", "keywords": ["discord", "bot", "messaging"]},
    {"broken": "telegram-mcp/server", "type": "communication", "keywords": ["telegram", "bot", "messaging"]},
    {"broken": "hangye/chrome-mcp", "type": "browser", "keywords": ["chrome", "browser", "devtools"]},
    {"broken": "notte/mcp-server", "type": "unknown", "keywords": ["notte"]},
    {"broken": "mongodb/mcp-server", "type": "database", "keywords": ["mongodb", "database", "nosql"]},
    {"broken": "supabase/mcp-server", "type": "database", "keywords": ["supabase", "database", "postgres"]},
    {"broken": "google/database-toolbox-mcp", "type": "database", "keywords": ["google", "database", "toolbox"]},
    {"broken": "docker/mcp-servers", "type": "container", "keywords": ["docker", "container"]},
    {"broken": "vscode-mcp/server", "type": "ide", "keywords": ["vscode", "editor"]},
    {"broken": "idosalomon/gitmcp", "type": "git", "keywords": ["git", "github"]},
    {"broken": "google-drive-mcp/server", "type": "storage", "keywords": ["google-drive", "cloud-storage"]},
    {"broken": "crypto-mcp/binance-server", "type": "crypto", "keywords": ["binance", "crypto", "trading"]},
    {"broken": "tavily-ai/mcp-server", "type": "search", "keywords": ["tavily", "search"]},
    {"broken": "stripe/mcp-server", "type": "payment", "keywords": ["stripe", "payments"]},
    {"broken": "jeomon/windows-desktop-mcp", "type": "desktop", "keywords": ["windows", "desktop"]},
    {"broken": "aws/bedrock-mcp-server", "type": "aws", "keywords": ["aws", "bedrock", "ai"]},
    {"broken": "aws/aws-docs-mcp", "type": "aws", "keywords": ["aws", "documentation"]},
    {"broken": "aws-labs/mcp-aws-secrets-manager", "type": "aws", "keywords": ["aws", "secrets", "security"]},
    {"broken": "mheob/mcp-server-todo-txt", "type": "productivity", "keywords": ["todo", "productivity"]},
    {"broken": "vespaiach/pandoc_mcp_server", "type": "document", "keywords": ["pandoc", "document", "conversion"]},
    {"broken": "dylsteck/farcaster-mcp", "type": "blockchain", "keywords": ["farcaster", "blockchain", "social"]},
    {"broken": "parthpatel6347/rubygems-mcp", "type": "package", "keywords": ["ruby", "rubygems", "packages"]},
    {"broken": "MindscapeHQ/raygun-mcp", "type": "monitoring", "keywords": ["raygun", "monitoring", "errors"]},
    {"broken": "eniehack/gitlab-mcp-server", "type": "git", "keywords": ["gitlab", "git"]},
    {"broken": "apacholik/docker-mcp-server", "type": "container", "keywords": ["docker"]},
    {"broken": "ianho/tmux-mcp-server", "type": "terminal", "keywords": ["tmux", "terminal"]},
    {"broken": "exa-labs/filesystem-tree-mcp", "type": "filesystem", "keywords": ["filesystem", "file"]},
    {"broken": "cloudnative/k8s-mcp-server", "type": "kubernetes", "keywords": ["kubernetes", "k8s"]},
    {"broken": "Homebrew/homebrew-mcp", "type": "package", "keywords": ["homebrew", "packages"]},
    {"broken": "jenkinsci/mcp-plugin", "type": "ci", "keywords": ["jenkins", "ci"]},
    {"broken": "hashicorp/terraform-mcp", "type": "infrastructure", "keywords": ["terraform", "iac"]},
    {"broken": "firebase/firebase-mcp", "type": "database", "keywords": ["firebase"]},
    {"broken": "redis/redis-mcp", "type": "database", "keywords": ["redis"]},
    {"broken": "elastic/elasticsearch-mcp", "type": "database", "keywords": ["elasticsearch", "search"]},
    {"broken": "supabase/supabase-mcp", "type": "database", "keywords": ["supabase"]},
    {"broken": "vercel/vercel-mcp", "type": "deployment", "keywords": ["vercel"]},
    {"broken": "mongodb/mongodb-mcp", "type": "database", "keywords": ["mongodb"]}
]

# Known good MCP repositories that are maintained
known_mcp_repositories = [
    "modelcontextprotocol/servers",  # Official MCP servers mono repo
    "awslabs/mcp",  # AWS MCP servers
    "docker/hub-mcp",  # Docker Hub MCP
    "hashicorp/terraform-mcp-server",  # Terraform MCP
    "idosal/git-mcp",  # Git MCP
]

def search_github_repositories(keywords, count=3):
    """Search GitHub for repositories matching keywords"""
    query = " ".join(keywords) + " mcp"
    url = f"https://api.github.com/search/repositories?q={query}&sort=stars&order=desc"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            items = data.get('items', [])[:count]
            results = []
            for item in items:
                results.append({
                    'full_name': item['full_name'],
                    'url': item['html_url'],
                    'stars': item['stargazers_count'],
                    'description': item.get('description', ''),
                    'updated': item['updated_at'],
                    'is_mcp': 'mcp' in item['name'].lower() or 'model context protocol' in item.get('description', '').lower()
                })
            return results
    except Exception as e:
        print(f"Error searching GitHub: {e}")
    return []

def check_repository_exists(repo):
    """Check if a repository exists"""
    url = f"https://api.github.com/repos/{repo}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return {
                'exists': True,
                'url': data['html_url'],
                'stars': data['stargazers_count'],
                'updated': data['updated_at'],
                'description': data.get('description', '')
            }
    except Exception as e:
        print(f"Error checking {repo}: {e}")
    return {'exists': False}

# Process all broken repositories
final_results = {}

print("="*80)
print("MCP REPOSITORY RESEARCH - Finding Replacements")
print("="*80)

for item in broken_repos:
    broken_repo = item['broken']
    print(f"\n{'='*60}")
    print(f"Researching: {broken_repo}")
    print(f"Type: {item['type']}")
    print(f"Keywords: {', '.join(item['keywords'])}")
    print('-'*60)
    
    # Check if the broken repo actually exists
    print(f"1. Checking if {broken_repo} exists...")
    check_result = check_repository_exists(broken_repo)
    
    if check_result['exists']:
        print(f"   ✓ Repository exists!")
        final_results[broken_repo] = {
            "status": "found",
            "url": check_result['url'],
            "stars": check_result['stars'],
            "updated": check_result['updated']
        }
        continue
    else:
        print(f"   ✗ Repository not found (404)")
    
    # Search for replacements
    print(f"2. Searching for replacements...")
    search_results = search_github_repositories(item['keywords'], count=5)
    
    best_replacements = []
    for result in search_results:
        # Prioritize official orgs and MCP-specific repos
        score = result['stars']
        
        # Boost score for official orgs
        official_orgs = ['modelcontextprotocol', 'awslabs', 'docker', 'hashicorp', 'stripe', 'googleapis']
        if any(result['full_name'].startswith(org) for org in official_orgs):
            score *= 1.5
        
        # Boost for MCP in name
        if result['is_mcp']:
            score *= 1.2
        
        # Recent updates (last 6 months)
        try:
            updated_days = (datetime.now() - datetime.strptime(result['updated'][:10], '%Y-%m-%d')).days
            if updated_days < 180:
                score *= 1.1
        except:
            pass
        
        best_replacements.append((result, score))
    
    # Sort by score
    best_replacements.sort(key=lambda x: x[1], reverse=True)
    
    # Get top 3
    top_replacements = [rep[0] for rep in best_replacements[:3]]
    
    print(f"3. Found {len(top_replacements)} potential replacements:")
    for i, rep in enumerate(top_replacements, 1):
        mcp_badge = " [MCP]" if rep['is_mcp'] else ""
        print(f"   {i}. {rep['full_name']} ({rep['stars']} stars){mcp_badge}")
        print(f"      {rep['url']}")
        print(f"      {rep['description'][:80]}...")
    
    # Store results
    final_results[broken_repo] = {
        "status": "needs_replacement",
        "type": item['type'],
        "replacements": top_replacements
    }
    
    time.sleep(1)  # Rate limiting

# Save final results
with open('mcp_replacements_research.json', 'w') as f:
    json.dump(final_results, f, indent=2)

print(f"\n{'='*80}")
print(f"Research complete! Found replacements for {len(final_results)} repositories.")
print("Results saved to mcp_replacements_research.json")
