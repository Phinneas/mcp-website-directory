import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Load existing clients data
  const clients = JSON.parse(fs.readFileSync('clients.json', 'utf-8'));

  console.log(`Processing ${clients.length} clients...`);

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    console.log(`[${i + 1}/${clients.length}] Processing: ${client.title}`);

    try {
      // Visit the mcp.so client page
      await page.goto(client.url, { waitUntil: 'networkidle2', timeout: 15000 });

      // Look for GitHub link or official website
      const actualUrl = await page.evaluate(() => {
        // Try to find GitHub link first
        const githubLink = document.querySelector('a[href*="github.com"]');
        if (githubLink) return githubLink.href;

        // Try to find any external link (not mcp.so)
        const externalLinks = Array.from(document.querySelectorAll('a[href^="http"]'))
          .filter(a => !a.href.includes('mcp.so'));
        if (externalLinks.length > 0) return externalLinks[0].href;

        return null;
      });

      if (actualUrl) {
        client.github_url = actualUrl;
        console.log(`  ✓ Found: ${actualUrl}`);
      } else {
        // Try to construct GitHub URL from the mcp.so URL pattern
        // Format: /client/{repo}/{owner}
        const match = client.url.match(/\/client\/([^\/]+)\/([^\/]+)/);
        if (match) {
          const [, repo, owner] = match;
          client.github_url = `https://github.com/${owner}/${repo}`;
          console.log(`  → Constructed: ${client.github_url}`);
        } else {
          console.log(`  ✗ No URL found`);
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
    }
  }

  await browser.close();

  // Save updated clients data
  fs.writeFileSync('clients_with_urls.json', JSON.stringify(clients, null, 2));
  console.log(`\n✓ Saved ${clients.length} clients to clients_with_urls.json`);
})();
