import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping based on skill name keywords
const CATEGORY_MAP = {
  Framework: ['react', 'next', 'vue', 'svelte', 'angular', 'frontend', 'component', 'ui', 'css', 'tailwind', 'shadcn', 'design'],
  Deployment: ['deploy', 'vercel', 'expo', 'ci', 'cd', 'workflow', 'build', 'release'],
  Testing: ['test', 'vitest', 'jest', 'playwright', 'review', 'quality'],
  'AI/LLM Tools': ['ai', 'sdk', 'llm', 'gpt', 'claude', 'gemini', 'agent', 'mcp'],
  'Agent Workflow': ['git', 'github', 'branch', 'pr', 'commit', 'memory', 'episodic', 'context', 'prompt'],
  'Data & Analysis': ['sql', 'database', 'db', 'postgres', 'mysql'],
  'Document Processing': ['pdf', 'docx', 'xlsx', 'pptx', 'document', 'file'],
  'Development & Code Tools': ['python', 'node', 'backend', 'api', 'server']
};

function getCategory(skillName) {
  const lowerName = skillName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(kw => lowerName.includes(kw))) {
      return category;
    }
  }
  return 'Development & Code Tools';
}

function toTitleCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function fetchWithRetry(url, retries = 3, delay = 500) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn(`Fetch attempt ${attempt + 1} failed for ${url}:`, error.message);
    }
    if (attempt < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  return null;
}

async function fetchSKILLMd(owner, repo, skillName) {
  const urls = [
    `https://raw.githubusercontent.com/${owner}/${repo}/main/skills/${skillName}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/${skillName}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/SKILL.md`
  ];

  for (const url of urls) {
    const content = await fetchWithRetry(url);
    if (content) {
      return content;
    }
  }
  return null;
}

function parseSKILLMd(content) {
  if (!content) return {};

  // Extract YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return {};

  try {
    const frontmatter = {};
    const lines = frontmatterMatch[1].split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        frontmatter[key.trim()] = valueParts.join(':').trim().replace(/^"|"$/g, '');
      }
    }
    return frontmatter;
  } catch (error) {
    console.warn('Error parsing frontmatter:', error.message);
    return {};
  }
}

async function scrapeSkills() {
  console.log('Starting skills.sh scrape...');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  try {
    console.log('Navigating to skills.sh...');
    await page.goto('https://skills.sh', { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Wait for content to load
    await page.waitForSelector('h3', { timeout: 10000 });

    // Scrape skills from page
    const skills = await page.evaluate(() => {
      const results = [];
      const entries = document.querySelectorAll('h3');
      
      entries.forEach((h3, index) => {
        const rank = index + 1;
        const name = h3.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        const title = h3.textContent.trim();
        
        // Find the next sibling that contains the repo info
        let sibling = h3.nextElementSibling;
        let repo = '';
        let size = '';
        
        while (sibling && sibling.tagName !== 'H3') {
          const text = sibling.textContent.trim();
          if (text.includes('/') && text.length < 50) {
            repo = text.split(' ')[0]; // Get owner/repo
          }
          if (text.match(/\d+K/)) {
            size = text;
          }
          sibling = sibling.nextElementSibling;
        }

        if (repo) {
          results.push({ rank, name, title, repo, size });
        }
      });

      return results;
    });

    console.log(`Found ${skills.length} skills on skills.sh`);

    // Enrich each skill with GitHub data
    const enrichedSkills = [];
    
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      const [owner, repo] = skill.repo.split('/');
      
      console.log(`[${i + 1}/${skills.length}] Enriching ${skill.name}...`);
      
      // Fetch SKILL.md
      const skillMdContent = await fetchSKILLMd(owner, repo, skill.name);
      const skillMdData = skillMdContent ? parseSKILLMd(skillMdContent) : {};
      
      // Build enriched skill object
      const enrichedSkill = {
        name: skill.name,
        title: skill.title,
        description: skillMdData.description || '',
        repo: skill.repo,
        install: `npx skills add ${skill.repo} --skill ${skill.name}`,
        category: getCategory(skill.name),
        source: 'skills.sh',
        publisher: owner,
        rank: skill.rank,
        license: skillMdData.license || '',
        version: skillMdData['metadata.version'] || '1.0.0',
        url: `https://github.com/${skill.repo}/tree/main/skills/${skill.name}`,
        skillsShUrl: 'https://skills.sh'
      };

      enrichedSkills.push(enrichedSkill);

      // Rate limiting - 200ms delay between requests
      if (i < skills.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write to JSON file
    const outputPath = path.join(dataDir, 'agent-skills.json');
    fs.writeFileSync(outputPath, JSON.stringify(enrichedSkills, null, 2));
    
    console.log(`\n✓ Successfully scraped ${enrichedSkills.length} skills`);
    console.log(`✓ Saved to ${outputPath}`);
    
    // Show sample
    console.log('\nFirst 5 skills:');
    enrichedSkills.slice(0, 5).forEach((skill, i) => {
      console.log(`${i + 1}. ${skill.title}`);
      console.log(`   Category: ${skill.category}`);
      console.log(`   Publisher: ${skill.publisher}`);
    });

  } catch (error) {
    console.error('Error during scrape:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

scrapeSkills();
