import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Loading page...');
  await page.goto('https://mcp.so/clients', { waitUntil: 'networkidle2', timeout: 30000 });

  // Take a screenshot
  await page.screenshot({ path: 'debug_screenshot.png', fullPage: true });
  console.log('Screenshot saved as debug_screenshot.png');

  // Wait a bit more for any late-loading content
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Get all link hrefs to see what's on the page
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      href: a.getAttribute('href'),
      text: a.textContent.trim().substring(0, 50),
      className: a.className
    })).slice(0, 20);
  });

  console.log('\nFirst 20 links on page:');
  console.log(JSON.stringify(links, null, 2));

  // Try different selectors
  const selectors = [
    'a.card',
    'a[href*="/clients/"]',
    '[class*="card"]',
    'div.card',
    'article'
  ];

  for (const selector of selectors) {
    const count = await page.evaluate((sel) => {
      return document.querySelectorAll(sel).length;
    }, selector);
    console.log(`Selector "${selector}": ${count} elements found`);
  }

  // Get the page HTML to inspect
  const html = await page.content();
  fs.writeFileSync('debug_page.html', html);
  console.log('Page HTML saved as debug_page.html');

  await browser.close();
})();
