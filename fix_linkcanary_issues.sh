#!/bin/bash

echo "🔧 Fixing LinkCanary Issues - Prioritized Order"
echo "================================================"
echo ""

# Change to project directory
cd /Users/chesterbeard/Desktop/mcp-directory

# Create backup
echo "📦 Creating backup..."
cp src/pages/index.astro src/pages/index.astro.backup.linkcanary

# Fix Priority 1: Update GitHub URLs that we have replacements for
echo ""
echo "🔥 Priority 1: Fixing GitHub URLs with replacements..."
echo ""

# These are the GitHub URLs we fixed in the previous task
# Run the fix script again to ensure all are updated
node fix_broken_urls_v2.js

# Fix Priority 2: Remove entries that have no replacements
echo ""
echo "🔥 Priority 2: Removing unavailable MCP servers..."
echo ""

# List of servers to remove (those with no suitable replacement found)
REMOVE_SERVERS=(
  "telegram-mcp"
  "stripe-mcp" 
  "farcaster-mcp"
  "raygun-mcp"
)

for server in "${REMOVE_SERVERS[@]}"; do
  echo "Removing $server..."
  # Use sed to find and remove the server entry
  # This is complex - we'll do it manually with a Python script
  python3 remove_server.py "$server"
done

# Fix Priority 3: Fix internal 404s - update or remove broken internal links
echo ""
echo "🔥 Priority 3: Fixing internal 404s..."
echo ""

# These are broken internal links that need to be fixed
# We'll need to identify where these are used and fix them
echo "Internal 404 URLs that need fixing:"
echo "  - /contact"
echo "  - /servers" 
echo "  - /blog/mcp-client-comparison"
echo "  - /category/* (multiple)"
echo "  - /claude-skills/* (multiple)"
echo ""
echo "⚠️  These require content creation or link removal - manual review needed"

# Fix Priority 4: Fix redirect chains
echo ""
echo "⚡ Priority 4: Fixing redirect chains..."
echo ""

# Update terraform backend link (critical redirect chain)
sed -i '' 's|https://www.terraform.io/language/settings/backends|https://developer.hashicorp.com/terraform/language/backend|g' src/pages/index.astro
echo "✅ Fixed terraform backend link"

# Update gogs docs link
sed -i '' 's|https://gogs.io/docs|https://gogs.io/|g' src/pages/index.astro
echo "✅ Fixed gogs docs link"

# Fix Priority 5: Fix canonical redirects (trailing slashes)
echo ""
echo "⚡ Priority 5: Fixing canonical redirects..."
echo ""

# Note: These are mostly 308 redirects which are fine - they're canonical redirects
# The site is already handling these correctly, just adding/removing trailing slashes
# We don't need to fix these as they're working as intended

echo "✅ Analysis complete! Review the changes above."
echo ""
echo "Next steps:"
echo "1. Review the changes made"
echo "2. Test the site locally"
echo "3. Commit and push if everything looks good"