#!/usr/bin/env node

import fs from 'fs';
import https from 'https';
import http from 'http';
import url from 'url';

// Read the index.astro file
const filePath = '/Users/chesterbeard/Desktop/mcp-directory/src/pages/index.astro';
const content = fs.readFileSync(filePath, 'utf8');

// Extract all GitHub URLs using regex
const githubUrlRegex = /github_url:\s*['"](https?:\/\/github\.com\/[^'"]+)['"]/g;
const matches = [];
let match;

while ((match = githubUrlRegex.exec(content)) !== null) {
  matches.push(match[1]);
}

console.log(`Found ${matches.length} GitHub URLs to check...\n`);

// Function to check URL
function checkUrl(urlStr, index, total) {
  return new Promise((resolve) => {
    const parsedUrl = url.parse(urlStr);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'HEAD',
      host: parsedUrl.host,
      path: parsedUrl.path,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MCP-Directory-Checker/1.0)'
      }
    };

    const req = client.request(options, (res) => {
      const status = res.statusCode;
      const result = {
        url: urlStr,
        status: status,
        ok: status >= 200 && status < 400
      };
      
      if (status === 404) {
        console.log(`❌ 404: ${urlStr}`);
      } else if (status >= 400) {
        console.log(`⚠️  ${status}: ${urlStr}`);
      } else {
        console.log(`✅ ${status}: ${urlStr}`);
      }
      
      resolve(result);
    });

    req.on('error', (err) => {
      console.log(`❌ ERROR: ${urlStr} - ${err.message}`);
      resolve({ url: urlStr, status: 'ERROR', error: err.message, ok: false });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`⏰ TIMEOUT: ${urlStr}`);
      resolve({ url: urlStr, status: 'TIMEOUT', ok: false });
    });

    req.end();
  });
}

// Check all URLs with concurrency limit
async function checkAllUrls() {
  const results = [];
  const concurrencyLimit = 10; // Check 10 URLs at a time
  
  for (let i = 0; i < matches.length; i += concurrencyLimit) {
    const chunk = matches.slice(i, i + concurrencyLimit);
    const chunkResults = await Promise.all(
      chunk.map((url, index) => checkUrl(url, i + index + 1, matches.length))
    );
    results.push(...chunkResults);
    
    // Add a small delay to be respectful to GitHub's servers
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n========== SUMMARY ==========\n');
  
  const failures = results.filter(r => !r.ok);
  const successes = results.filter(r => r.ok);
  
  console.log(`Total URLs checked: ${results.length}`);
  console.log(`✅ Successful: ${successes.length}`);
  console.log(`❌ Failed: ${failures.length}`);
  
  if (failures.length > 0) {
    console.log('\nFailed URLs (404 or errors):');
    failures.forEach(r => {
      if (r.status === 404) {
        console.log(`  404: ${r.url}`);
      } else if (r.status === 'ERROR') {
        console.log(`  ERROR: ${r.url} - ${r.error}`);
      } else if (r.status === 'TIMEOUT') {
        console.log(`  TIMEOUT: ${r.url}`);
      } else {
        console.log(`  ${r.status}: ${r.url}`);
      }
    });
  }
  
  // Write detailed report to file
  const report = {
    total: results.length,
    successes: successes.length,
    failures: failures.length,
    failedUrls: failures.map(r => ({
      url: r.url,
      status: r.status,
      error: r.error || undefined
    }))
  };
  
  fs.writeFileSync('github_url_check_report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to: github_url_check_report.json');
}

// Run the check
console.log('Starting GitHub URL validation...\n');
checkAllUrls().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

// Run the check
console.log('Starting GitHub URL validation...\n');
checkAllUrls().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});