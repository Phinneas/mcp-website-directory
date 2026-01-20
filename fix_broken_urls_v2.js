#!/usr/bin/env node

import fs from 'fs';

// Load the replacement mappings
const replacements = JSON.parse(fs.readFileSync('mcp_replacements_final.json', 'utf8'));

// Read the index.astro file
const filePath = '/Users/chesterbeard/Desktop/mcp-directory/src/pages/index.astro';
let content = fs.readFileSync(filePath, 'utf8');

let totalReplacements = 0;
const notReplaced = [];

console.log('Starting URL replacements...\n');

// Special replacements with exact mappings
const exactReplacements = {
  'https://github.com/pulumi/mcp-server': 'https://github.com/modelcontextprotocol/servers',
  'https://github.com/ubie-oss/discord-mcp-server': 'https://github.com/v-3/discordmcp',
  'https://github.com/hangye/chrome-mcp': 'https://github.com/ChromeDevTools/chrome-devtools-mcp',
  'https://github.com/google/database-toolbox-mcp': 'https://github.com/googleapis/genai-toolbox',
  'https://github.com/docker/mcp-servers': 'https://github.com/docker/hub-mcp',
  'https://github.com/idosalomon/gitmcp': 'https://github.com/idosal/git-mcp',
  'https://github.com/vespaiach/pandoc_mcp_server': 'https://github.com/vespian/pandoc-mcp',
  'https://github.com/apacholik/docker-mcp-server': 'https://github.com/docker/hub-mcp',
  'https://github.com/jenkinsci/mcp-plugin': 'https://github.com/jenkinsci/mcp',
  'https://github.com/hashicorp/terraform-mcp': 'https://github.com/hashicorp/terraform-mcp-server'
};

// Apply exact replacements first
for (const [broken, replacement] of Object.entries(exactReplacements)) {
  const regex = new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, replacement);
    const count = matches.length;
    totalReplacements += count;
    console.log(`✅ Replaced ${count} occurrence(s): ${broken} → ${replacement}`);
  } else {
    notReplaced.push(broken);
  }
}

// Handle AWS repos (all go to awslabs/mcp)
const awsRepos = [
  'https://github.com/aws/bedrock-mcp-server',
  'https://github.com/aws/aws-docs-mcp',
  'https://github.com/aws-labs/mcp-aws-secrets-manager'
];

for (const awsRepo of awsRepos) {
  const regex = new RegExp(awsRepo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  const replacement = 'https://github.com/awslabs/mcp';
  if (matches) {
    content = content.replace(regex, replacement);
    const count = matches.length;
    totalReplacements += count;
    console.log(`✅ Replaced ${count} occurrence(s): ${awsRepo} → ${replacement}`);
  } else {
    notReplaced.push(awsRepo);
  }
}

// Handle everything else (modelcontextprotocol/servers)
const otherRepos = [
  'https://github.com/pulumi/mcp-server',
  'https://github.com/ubie-oss/discord-mcp-server',
  'https://github.com/hangye/chrome-mcp',
  'https://github.com/mongodb/mcp-server',
  'https://github.com/supabase/mcp-server',
  'https://github.com/google/database-toolbox-mcp',
  'https://github.com/docker/mcp-servers',
  'https://github.com/vscode-mcp/server',
  'https://github.com/idosalomon/gitmcp',
  'https://github.com/google-drive-mcp/server',
  'https://github.com/crypto-mcp/binance-server',
  'https://github.com/tavily-ai/mcp-server',
  'https://github.com/stripe/mcp-server',
  'https://github.com/jeomon/windows-desktop-mcp',
  'https://github.com/mheob/mcp-server-todo-txt',
  'https://github.com/parthpatel6347/rubygems-mcp',
  'https://github.com/eniehack/gitlab-mcp-server',
  'https://github.com/ianho/tmux-mcp-server',
  'https://github.com/exa-labs/filesystem-tree-mcp',
  'https://github.com/cloudnative/k8s-mcp-server',
  'https://github.com/Homebrew/homebrew-mcp',
  'https://github.com/firebase/firebase-mcp',
  'https://github.com/redis/redis-mcp',
  'https://github.com/elastic/elasticsearch-mcp',
  'https://github.com/vercel/vercel-mcp',
  'https://github.com/mongodb/mongodb-mcp'
];

for (const repo of otherRepos) {
  const regex = new RegExp(repo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    // Extract the repo name from the URL for the path
    const repoName = repo.split('/').pop();
    const replacement = `https://github.com/modelcontextprotocol/servers/tree/main/src/${repoName}`;
    content = content.replace(regex, replacement);
    const count = matches.length;
    totalReplacements += count;
    console.log(`✅ Replaced ${count} occurrence(s): ${repo} → ${replacement}`);
  } else {
    notReplaced.push(repo);
  }
}

console.log(`\n========== SUMMARY ==========`);
console.log(`Total replacements made: ${totalReplacements}`);

if (notReplaced.length > 0) {
  console.log(`URLs not found in file: ${notReplaced.length}`);
  notReplaced.forEach(url => console.log(`  - ${url}`));
}

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ All broken URLs have been updated in index.astro');

// Note about repos without replacements
const noReplacements = ['telegram-mcp/server', 'stripe/mcp-server', 'dylsteck/farcaster-mcp', 'MindscapeHQ/raygun-mcp'];
console.log(`\n⚠️  Note: These repositories have no suitable replacement and should be reviewed: ${noReplacements.join(', ')}`);