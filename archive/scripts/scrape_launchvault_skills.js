import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Loading LaunchVault blog page...');
  await page.goto('https://www.launchvault.dev/blog/popular-claude-skills-2025', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Wait for main content to load
  await page.waitForSelector('article, main, [class*="content"]', { timeout: 10000 });

  const newSkills = await page.evaluate(() => {
    const results = [];

    // Try to find all headings and list items that might contain skills
    const elements = document.querySelectorAll('h2, h3, h4, li, p');

    let currentCategory = 'General';

    elements.forEach(el => {
      const text = el.textContent.trim();

      // Update category from headings
      if ((el.tagName === 'H2' || el.tagName === 'H3') &&
          (text.includes('Skills') || text.includes('Tools'))) {
        currentCategory = text;
        return;
      }

      // Look for skill entries (usually numbered or bulleted)
      // Pattern: "Name: Description" or "Name - Description"
      const skillMatch = text.match(/^(\d+\.\s*)?(.+?)[\:\-–—]\s*(.+)/);

      if (skillMatch && text.length > 30 && text.length < 500) {
        const [, , name, description] = skillMatch;

        // Find any links in the element
        const link = el.querySelector('a');
        const url = link ? link.href : '';

        // Skip if it's not a skill-like entry
        if (name.length < 3 || name.length > 100) return;

        results.push({
          title: name.trim(),
          url: url || '',
          description: description.trim(),
          category: currentCategory
        });
      }
    });

    return results;
  });

  await browser.close();

  // Load existing skills to check for duplicates
  const existingSkills = JSON.parse(fs.readFileSync('skills.json', 'utf-8'));
  const existingTitles = new Set(existingSkills.map(s => s.title.toLowerCase()));

  // Filter out duplicates
  const uniqueNewSkills = newSkills.filter(skill =>
    !existingTitles.has(skill.title.toLowerCase()) &&
    skill.title.length > 0
  );

  console.log(`\n✓ Found ${newSkills.length} potential skills`);
  console.log(`✓ ${uniqueNewSkills.length} are new (not duplicates)`);

  if (uniqueNewSkills.length > 0) {
    // Save new skills to a separate file for review
    fs.writeFileSync('new_skills_launchvault.json', JSON.stringify(uniqueNewSkills, null, 2));
    console.log('✓ Saved to new_skills_launchvault.json');

    console.log('\nNew skills preview:');
    uniqueNewSkills.slice(0, 10).forEach((skill, i) => {
      console.log(`${i + 1}. ${skill.title}`);
      console.log(`   ${skill.description.substring(0, 80)}...`);
    });
  }
})();
