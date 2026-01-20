#!/usr/bin/env node

import fs from 'fs';

// Load the replacement mappings
const replacements = JSON.parse(fs.readFileSync('mcp_replacements_final.json', 'utf8'));

// Read the index.astro file
const filePath = '/Users/chesterbeard/Desktop/mcp-directory/src/pages/index.astro';
let content = fs.readFileSync(filePath, 'utf8');

// Create a list of URLs to replace (only those with actual replacements)
const urlReplacements = [];
for (const [brokenPath, data] of Object.entries(replacements)) {
  if (data.replacement && data.status !== 'no_suitable_replacement') {
    const brokenUrl = `https://github.com/${brokenPath}`;
    let replacementUrl;
    
    if (data.status === 'official' || data.status === 'community_alternative') {
      replacementUrl = `https://github.com/${data.replacement}`;
    } else {
      // For community_official and others, link to the specific archived path
      replacementUrl = `https://github.com/${data.replacement}/tree/main/src/${brokenPath.split('/')[1] || brokenPath}`;
    }
    
    // Special cases for directly replaced repos
    if (brokenPath === 'hangye/chrome-mcp') {
      replacementUrl = `https://github.com/${data.replacement}`;
    } else if (brokenPath === 'google/database-toolbox-mcp') {
      replacementUrl = `https://github.com/${data.replacement}`;
    } else if (brokenPath === 'docker/mcp-servers') {
      replacementUrl = `https://github.com/${data.replacement}`;
    } else if (brokenPath === 'idosalomon/gitmcp') {
      replacementUrl = `https://github.com/${data.replacement}`;
    } else if (brokenPath === 'apacholik/docker-mcp-server') {
      replacementUrl = `https://github.com/${data.replacement}`;
    } else if (brokenPath === 'jenkinsci/mcp-plugin') {
      replacementUrl = `https://github.com/${data.replacement}`;
    } else if (brokenPath === 'hashicorp/terraform-mcp') {
      replacementUrl = `https://github.com/${data.replacement}`;
    } else if (brokenPath === 'supabase/mcp-server' || brokenPath === 'supabase/supabase-mcp') {
      continue; // Skip these as they'll be handled by the category tag logic
    }
    
    urlReplacements.push({
      broken: brokenUrl,
      replacement: replacementUrl,
      path: brokenPath
    });
    console.log(`Will replace: ${brokenUrl} → ${replacementUrl}`);
  }
}

// Perform replacements
let totalReplacements = 0;
urlReplacements.forEach(({ broken, replacement, path }) => {
  const regex = new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, replacement);
    const count = matches.length;
    totalReplacements += count;
    console.log(`✅ Replaced ${count} occurrence(s) of ${path}`);
  }
});

// Special handling for some patterns
// Fix the Discord MCP URL
content = content.replace(
  'https://github.com/ubie-oss/discord-mcp-server',
  'https://github.com/v-3/discordmcp'
);

console.log(`\nTotal replacements made: ${totalReplacements}`);

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ All broken URLs have been updated in index.astro');

// Summary
const withoutReplacement = Object.entries(replacements).filter(([_, data]) => data.status === 'no_suitable_replacement').length;
console.log(`\n⚠️ Note: ${withoutReplacement} repositories have no suitable replacement and should be removed from the list`);