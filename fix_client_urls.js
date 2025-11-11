import fs from 'fs';

// Load existing clients data
const clients = JSON.parse(fs.readFileSync('clients.json', 'utf-8'));

console.log(`Processing ${clients.length} clients...`);

for (const client of clients) {
  // Extract repo and owner from mcp.so URL
  // Format: https://mcp.so/client/{repo}/{owner}
  const match = client.url.match(/\/client\/([^\/]+)\/([^\/]+)/);

  if (match) {
    const [, repo, owner] = match;
    // Construct GitHub URL
    client.github_url = `https://github.com/${owner}/${repo}`;
    // Keep the mcp.so URL for reference but rename it
    client.mcp_url = client.url;
    // Replace url with GitHub URL
    client.url = client.github_url;
  }

  // Remove the github_url field since we moved it to url
  delete client.github_url;
}

// Save updated clients data
fs.writeFileSync('clients.json', JSON.stringify(clients, null, 2));
console.log(`✓ Updated ${clients.length} clients with GitHub URLs`);
console.log('✓ Original mcp.so URLs saved in "mcp_url" field');
