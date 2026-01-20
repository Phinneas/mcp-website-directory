#!/usr/bin/env node

import fs from 'fs';

// Read the index.astro file
const filePath = '/Users/chesterbeard/Desktop/mcp-directory/src/pages/index.astro';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Removing unavailable MCP servers...\n');

// List of server IDs to remove (those with no suitable replacement)
const serversToRemove = [
  'telegram-mcp',
  'stripe-mcp',
  'farcaster-mcp',
  'raygun-mcp'
];

let removedCount = 0;

// Helper function to find and remove a server entry
function removeServer(serverId) {
  // Pattern to find server entry: starts with id: 'server-id' and goes until the closing },
  const pattern = new RegExp(`\\s*\\{\\s*id:\\s*'${serverId}'[\\s\\S]*?\\n\\s*\\},`, 'g');
  
  const matches = content.match(pattern);
  if (matches) {
    content = content.replace(pattern, '');
    console.log(`✅ Removed server: ${serverId}`);
    removedCount++;
    return true;
  } else {
    console.log(`⚠️  Server not found: ${serverId}`);
    return false;
  }
}

// Remove each server
for (const serverId of serversToRemove) {
  removeServer(serverId);
}

// Clean up any extra blank lines (up to 3 consecutive newlines)
content = content.replace(/\n{3,}/g, '\n\n');

console.log(`\nTotal servers removed: ${removedCount}`);

// Verify removal by checking if any remain
const remaining = [];
for (const serverId of serversToRemove) {
  if (content.includes(`id: '${serverId}'`)) {
    remaining.push(serverId);
  }
}

if (remaining.length > 0) {
  console.log(`⚠️  WARNING: These servers were not fully removed: ${remaining.join(', ')}`);
} else {
  console.log('✅ All specified servers successfully removed');
}

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ Changes saved to index.astro');

// Show diff stats
const originalLength = fs.readFileSync(filePath + '.backup.linkcanary', 'utf8').split('\n').length;
const newLength = content.split('\n').length;
const diff = originalLength - newLength;
console.log(`📊 Line count reduced by: ${diff} lines`);