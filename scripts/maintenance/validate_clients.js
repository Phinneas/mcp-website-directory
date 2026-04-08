import fs from 'fs';
import axios from 'axios';

async function validateClients() {
  const clients = JSON.parse(fs.readFileSync('clients.json', 'utf-8'));
  const validatedClients = [];
  const deadClients = [];

  console.log(`Validating ${clients.length} clients...`);

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    console.log(`[${i + 1}/${clients.length}] Checking: ${client.title} (${client.url})`);

    if (!client.url) {
        console.log(`  ✗ Skip: No URL`);
        continue;
    }

    try {
      const response = await axios.get(client.url, { 
        timeout: 10000,
        validateStatus: false, // Don't throw for 404
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.status === 404) {
        console.log(`  ✗ 404: Not Found`);
        deadClients.push({...client, reason: '404'});
        continue;
      }

      if (response.status !== 200) {
        console.log(`  ! Non-200: ${response.status}`);
        // We'll keep them for now but maybe flag them
      }

      const html = response.data;
      
      // Check for Archived status (GitHub specific)
      if (client.url.includes('github.com') && html.includes('This repository has been archived by the owner')) {
        console.log(`  ✗ Archived`);
        deadClients.push({...client, reason: 'archived'});
        continue;
      }

      // Check if it's actually MCP related
      const isMcp = html.toLowerCase().includes('mcp') || 
                   html.toLowerCase().includes('model context protocol') ||
                   client.description.toLowerCase().includes('mcp') ||
                   client.description.toLowerCase().includes('model context protocol');

      if (!isMcp) {
        console.log(`  ? Not clearly MCP related`);
        // Maybe we don't remove it automatically but flag it for review
        // For now, let's keep it but maybe add a flag
        client.possible_non_mcp = true;
      }

      validatedClients.push(client);

    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      // Usually signifies a network error or some other issue
      // We might want to keep these and retry later or flag them
      client.error = error.message;
      validatedClients.push(client);
    }

    // Small delay to avoid rate limiting
    if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\nValidation complete.`);
  console.log(`Remaining: ${validatedClients.length}`);
  console.log(`Removed: ${deadClients.length}`);

  fs.writeFileSync('clients_validated.json', JSON.stringify(validatedClients, null, 2));
  fs.writeFileSync('dead_clients.json', JSON.stringify(deadClients, null, 2));
}

validateClients();
