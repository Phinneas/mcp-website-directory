#!/bin/bash

echo "🔧 Fixing Critical LinkCanary Issues"
echo "====================================="
echo ""

cd /Users/chesterbeard/Desktop/mcp-directory

# Fix 1: Terraform backend redirect chain (CRITICAL)
echo "Fixing terraform backend link..."
sed -i '' 's|https://www.terraform.io/language/settings/backends|https://developer.hashicorp.com/terraform/language/backend|g' src/content/blog/best-github-alternatives.md
echo "✅ Fixed: terraform backend link"

# Fix 2: Gitea docs redirect chain (HIGH)
echo "Fixing gitea docs link..."
sed -i '' 's|https://docs.gitea.io|https://docs.gitea.com/|g' src/content/blog/best-github-alternatives.md
echo "✅ Fixed: gitea docs link"

# Fix 3: Slack webhook redirect chain (HIGH)
echo "Fixing slack webhook docs..."
sed -i '' 's|https://api.slack.com/messaging/webhooks|https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/|g' src/content/blog/best-github-alternatives.md
echo "✅ Fixed: slack webhook docs"

# Fix 4: GitLab docs redirect chain (HIGH)
echo "Fixing gitlab docs links..."
sed -i '' 's|https://docs.gitlab.com/ee/ci/pipelines/pipeline_efficiency.html|https://docs.gitlab.com/ci/pipelines/pipeline_efficiency/|g' src/content/blog/best-github-alternatives.md
sed -i '' 's|https://docs.gitlab.com/ee/administration/reference_architectures/|https://docs.gitlab.com/administration/reference_architectures/|g' src/content/blog/best-github-alternatives.md
sed -i '' 's|https://docs.gitlab.com/ee/ci/|https://docs.gitlab.com/ci/|g' src/content/blog/best-github-alternatives.md
sed -i '' 's|https://docs.gitlab.com/ee/raketasks/backup_restore.html|https://docs.gitlab.com/raketasks/backup_restore/|g' src/content/blog/best-github-alternatives.md
echo "✅ Fixed: gitlab docs links"

# Fix 5: ModelContextProtocol redirect
echo "Fixing MCP docs link..."
sed -i '' 's|https://modelcontextprotocol.io|https://modelcontextprotocol.io/docs/getting-started/intro|g' src/content/blog/*.mdx src/content/blog/*.md 2>/dev/null || true
echo "✅ Fixed: MCP docs redirect"

# Fix 6: Fix broken internal FAQ link
echo "Fixing broken FAQ link to mcp-client-comparison..."
# Either remove the link or point to a valid page
sed -i '' 's|/blog/mcp-client-comparison|/blog/mcp-client-complete-guide|g' src/components/FAQSection.astro
echo "✅ Fixed: broken FAQ link"

echo ""
echo "====================================="
echo "✅ Critical LinkCanary fixes complete!"
echo ""
echo "Issues fixed:"
echo "  - Terraform backend redirect chain (CRITICAL)"
echo "  - Gitea docs redirect chain (HIGH)"
echo "  - Slack webhook redirect chain (HIGH)"
echo "  - GitLab docs redirect chains (HIGH)"
echo "  - MCP docs redirect (redirect)"
echo "  - Broken FAQ internal link (404)"
echo ""
echo "Next steps:"
echo "1. Review the changes made"
echo "2. Test the site locally"
echo "3. Commit and push changes"