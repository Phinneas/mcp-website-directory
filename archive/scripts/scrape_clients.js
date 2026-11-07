import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const clients = [];
  let pageNo = 1;

  while (true) {
    console.log(`Scraping page ${pageNo}...`);
    await page.goto(`https://mcp.so/clients?page=${pageNo}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    try {
      await page.waitForSelector('a[href^="/client/"]', { timeout: 15000 });
    } catch (e) {
      console.log(`No more pages found at page ${pageNo}`);
      break;
    }

    const chunk = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="/client/"]')].map(card => {
        // Extract title from the card text
        const fullText = card.textContent.trim();
        const titleMatch = fullText.match(/^([^A-Z]+?)(?=[A-Z]|$)/);
        const title = titleMatch ? titleMatch[1].trim() : fullText.split(/(?=[A-Z])/)[0].trim();

        // Extract description (everything after the title)
        const description = fullText.replace(title, '').trim();

        // Extract stars from anywhere in the card
        const starMatch = fullText.match(/★\s*(\d+)/);
        const stars = starMatch ? Number(starMatch[1]) : 0;

        return {
          title: title || '',
          url: 'https://mcp.so' + card.getAttribute('href'),
          stars: stars,
          description: description || '',
          category: 'Client'
        };
      })
    );

    if (chunk.length === 0) break;
    console.log(`Found ${chunk.length} clients on page ${pageNo}`);
    clients.push(...chunk);
    pageNo++;

    // Stop if we've checked enough pages
    if (pageNo > 10) break;
  }

  await browser.close();

  // JSON dump
  fs.writeFileSync('clients.json', JSON.stringify(clients, null, 2));
  console.log(`\nTotal clients scraped: ${clients.length}`);
  console.log('Saved to clients.json');
})();
