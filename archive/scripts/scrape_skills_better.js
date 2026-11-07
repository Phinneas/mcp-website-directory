import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Loading GitHub page...');
  await page.goto('https://raw.githubusercontent.com/ComposioHQ/awesome-claude-skills/master/README.md', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  const markdownContent = await page.evaluate(() => document.body.textContent);

  await browser.close();

  // Parse markdown manually
  const lines = markdownContent.split('\n');
  const skills = [];
  let currentCategory = 'General';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect category headers (### headers)
    if (line.startsWith('### ')) {
      currentCategory = line.replace('### ', '').trim();
      continue;
    }

    // Skip ## headers (main sections)
    if (line.startsWith('## ')) {
      continue;
    }

    // Parse skill entries (markdown list items with links)
    // Format: - [**title**](url) - description
    const skillMatch = line.match(/^[-*]\s+\[(?:\*\*)?(.+?)(?:\*\*)?\]\((.+?)\)(?:\s*[-–—]\s*(.+))?/);

    if (skillMatch) {
      const [, title, url, description] = skillMatch;

      // Skip table of contents and internal links
      if (url.startsWith('#')) continue;
      if (title.toLowerCase().includes('table of contents')) continue;
      if (title.toLowerCase().includes('contributing')) continue;

      skills.push({
        title: title.trim(),
        url: url.trim(),
        description: (description || title).trim(),
        category: currentCategory
      });
    }
  }

  // Save to JSON
  fs.writeFileSync('skills.json', JSON.stringify(skills, null, 2));
  console.log(`\n✓ Scraped ${skills.length} Claude skills`);
  console.log('✓ Saved to skills.json');

  // Show breakdown by category
  const categories = {};
  skills.forEach(skill => {
    categories[skill.category] = (categories[skill.category] || 0) + 1;
  });

  console.log('\nSkills by category:');
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  // Show first few skills
  console.log('\nFirst 5 skills:');
  skills.slice(0, 5).forEach((skill, i) => {
    console.log(`${i + 1}. ${skill.title} (${skill.category})`);
    console.log(`   ${skill.description.substring(0, 80)}...`);
  });
})();
