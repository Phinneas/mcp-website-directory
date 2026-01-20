#!/bin/bash

declare -a repos=(
  "pulumi/mcp-server"
  "ubie-oss/discord-mcp-server"
  "telegram-mcp/server"
  "hangye/chrome-mcp"
  "notte/mcp-server"
  "mongodb/mcp-server"
  "supabase/mcp-server"
  "google/database-toolbox-mcp"
  "docker/mcp-servers"
  "vscode-mcp/server"
  "idosalomon/gitmcp"
  "google-drive-mcp/server"
  "crypto-mcp/binance-server"
  "tavily-ai/mcp-server"
  "stripe/mcp-server"
  "jeomon/windows-desktop-mcp"
  "aws/bedrock-mcp-server"
  "aws/aws-docs-mcp"
  "aws-labs/mcp-aws-secrets-manager"
  "mheob/mcp-server-todo-txt"
  "vespaiach/pandoc_mcp_server"
  "dylsteck/farcaster-mcp"
  "parthpatel6347/rubygems-mcp"
  "MindscapeHQ/raygun-mcp"
  "eniehack/gitlab-mcp-server"
  "apacholik/docker-mcp-server"
  "ianho/tmux-mcp-server"
  "exa-labs/filesystem-tree-mcp"
  "cloudnative/k8s-mcp-server"
  "Homebrew/homebrew-mcp"
  "jenkinsci/mcp-plugin"
  "hashicorp/terraform-mcp"
  "firebase/firebase-mcp"
  "redis/redis-mcp"
  "elastic/elasticsearch-mcp"
  "supabase/supabase-mcp"
  "vercel/vercel-mcp"
  "mongodb/mongodb-mcp"
)

for repo in "${repos[@]}"; do
  echo "=== Searching for: $repo ==="
  org=$(echo $repo | cut -d'/' -f1)
  name=$(echo $repo | cut -d'/' -f2)
  
  # Search for repositories with similar names
  curl -s "https://api.github.com/search/repositories?q=${name}+in:name,description+user:${org}" | jq -r '.items[] | "  ALTERNATIVE: \(.full_name) - \(.stargazers_count) stars - \(.html_url)"'
  
  # General search for the name
  curl -s "https://api.github.com/search/repositories?q=${name}+mcp+in:name,description" | jq -r '.items[0:3][] | "  SIMILAR: \(.full_name) - \(.stargazers_count) stars - \(.html_url)"'
  
  echo ""
done
