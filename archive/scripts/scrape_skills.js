import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Loading GitHub page...');
  await page.goto('https://github.com/ComposioHQ/awesome-claude-skills', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Wait for README to load
  await page.waitForSelector('article', { timeout: 10000 });

  const skills = await page.evaluate(() => {
    const results = [];
    const article = document.querySelector('article');
    if (!article) return results;

    // Find all links in the README
    const links = Array.from(article.querySelectorAll('a'));

    // Track current category
    let currentCategory = 'General';

    // Get all headings and content
    const elements = article.querySelectorAll('h2, h3, li, p');

    elements.forEach(el => {
      // Update category when we hit a heading
      if (el.tagName === 'H2' || el.tagName === 'H3') {
        currentCategory = el.textContent.trim();
        return;
      }

      // Process list items that contain skills
      if (el.tagName === 'LI') {
        const link = el.querySelector('a');
        if (link && link.href) {
          const title = link.textContent.trim();
          const url = link.href;

          // Get description (text after the link)
          let description = el.textContent.replace(title, '').trim();
          description = description.replace(/^[-–—:]\s*/, '').trim();

          // Skip table of contents and navigation links
          if (url.includes('#') && !url.includes('github.com')) return;
          if (title.toLowerCase().includes('table of contents')) return;

          // Only include if it has a meaningful description or is a GitHub link
          if (description || url.includes('github.com')) {
            results.push({
              title: title,
              url: url,
              description: description || title,
              category: currentCategory
            });
          }
        }
      }
    });

    return results;
  });

  await browser.close();

  // Filter out duplicates and non-skill entries
  const uniqueSkills = [];
  const seen = new Set();

  for (const skill of skills) {
    const key = skill.url;
    if (!seen.has(key) &&
        !skill.title.toLowerCase().includes('contributing') &&
        !skill.title.toLowerCase().includes('license') &&
        skill.url.includes('github.com')) {
      seen.add(key);
      uniqueSkills.push(skill);
    }
  }

  // Save to JSON
  fs.writeFileSync('skills.json', JSON.stringify(uniqueSkills, null, 2));
  console.log(`\n✓ Scraped ${uniqueSkills.length} Claude skills`);
  console.log('✓ Saved to skills.json');

  // Show sample
  console.log('\nFirst 5 skills:');
  uniqueSkills.slice(0, 5).forEach((skill, i) => {
    console.log(`${i + 1}. ${skill.title}`);
    console.log(`   ${skill.description.substring(0, 80)}...`);
  });
})();
