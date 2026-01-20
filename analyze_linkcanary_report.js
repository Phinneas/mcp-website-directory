#!/usr/bin/env node

/**
 * LinkCanary Crawl Report Analyzer
 * Analyzes CSV exports from LinkCanary and generates structured reports
 */

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Configuration
const INPUT_CSV = process.argv[2] || 'linkcanary_report.csv';
const OUTPUT_JSON = process.argv[3] || 'linkcanary_analysis.json';

if (!fs.existsSync(INPUT_CSV)) {
  console.error(`Error: Input CSV file '${INPUT_CSV}' not found`);
  console.error('Usage: node analyze_linkcanary_report.js [input.csv] [output.json]');
  console.error('\nExpected CSV columns:');
  console.error('  - source_page: where the link was found');
  console.error('  - link_url: the problematic link');
  console.error('  - status_code: HTTP status');
  console.error('  - issue_type: broken, redirect_chain, redirect, canonical_redirect, error');
  console.error('  - priority: critical, high, medium, low');
  process.exit(1);
}

// Data structures
const issues = [];
const stats = {
  byIssueType: {},
  byPriority: {},
  byIssueTypeAndPriority: {},
  internal404s: new Set(),
  githubUrls: new Set()
};

// Helper functions
function isInternalUrl(url, baseDomain = 'mcp.so') {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes(baseDomain);
  } catch (e) {
    // Relative URLs are internal
    return !url.startsWith('http') || url.startsWith('/');
  }
}

function isGitHubUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com';
  } catch (e) {
    return false;
  }
}

function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

function updateStats(issue) {
  const { issue_type, priority, link_url } = issue;
  
  // Count by issue type
  stats.byIssueType[issue_type] = (stats.byIssueType[issue_type] || 0) + 1;
  
  // Count by priority
  stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
  
  // Count by issue type and priority
  const key = `${issue_type}_${priority}`;
  stats.byIssueTypeAndPriority[key] = (stats.byIssueTypeAndPriority[key] || 0) + 1;
  
  // Track internal 404s
  if (issue_type === 'broken' && priority === 'high' || priority === 'critical') {
    if (isInternalUrl(link_url)) {
      stats.internal404s.add(link_url);
    }
  }
  
  // Track GitHub URLs from 404s and redirects
  if (isGitHubUrl(link_url)) {
    if (issue_type === 'broken' || issue_type === 'redirect' || issue_type === 'redirect_chain') {
      stats.githubUrls.add(link_url);
    }
  }
}

function getPriorityOrder(priority) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return order[priority] || 999;
}

function getIssueTypeOrder(issueType) {
  const order = { broken: 0, error: 1, redirect_chain: 2, redirect: 3, canonical_redirect: 4 };
  return order[issueType] || 999;
}

function generateFixPriority(issue) {
  const priorityScore = getPriorityOrder(issue.priority);
  const typeScore = getIssueTypeOrder(issue.issue_type);
  return priorityScore * 10 + typeScore;
}

// Main processing
console.log(`Analyzing LinkCanary report: ${INPUT_CSV}`);

const results = [];

fs.createReadStream(INPUT_CSV)
  .pipe(csv())
  .on('data', (row) => {
    try {
      // Validate required fields
      if (!row.source_page || !row.link_url || !row.issue_type || !row.priority) {
        console.warn('Skipping invalid row:', row);
        return;
      }
      
      const issue = {
        source_page: row.source_page,
        link_url: row.link_url,
        status_code: row.status_code ? parseInt(row.status_code) : null,
        issue_type: row.issue_type,
        priority: row.priority
      };
      
      issues.push(issue);
      updateStats(issue);
      
    } catch (error) {
      console.error('Error processing row:', row, error);
    }
  })
  .on('end', () => {
    console.log(`Processed ${issues.length} issues`);
    
    // Generate analysis
    const analysis = {
      summary: {
        total_issues: issues.length,
        by_issue_type: stats.byIssueType,
        by_priority: stats.byPriority,
        by_issue_type_and_priority: Object.entries(stats.byIssueTypeAndPriority)
          .map(([key, count]) => {
            const [issue_type, priority] = key.split('_');
            return { issue_type, priority, count };
          })
          .sort((a, b) => {
            if (a.priority !== b.priority) {
              return getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
            }
            return getIssueTypeOrder(b.issue_type) - getIssueTypeOrder(a.issue_type);
          })
      },
      internal_404s: Array.from(stats.internal404s).sort(),
      github_urls_needing_updates: Array.from(stats.githubUrls).sort(),
      recommended_fix_order: issues
        .map(issue => ({
          ...issue,
          fix_priority: generateFixPriority(issue)
        }))
        .sort((a, b) => a.fix_priority - b.fix_priority)
        .map(({ fix_priority, ...issue }) => issue),
      details: {
        critical_broken_links: issues.filter(i => i.priority === 'critical' && i.issue_type === 'broken'),
        high_priority_redirect_chains: issues.filter(i => 
          i.priority === 'high' && i.issue_type === 'redirect_chain'
        ),
        canonical_redirects: issues.filter(i => i.issue_type === 'canonical_redirect'),
        external_404s: issues.filter(i => 
          i.issue_type === 'broken' && !isInternalUrl(i.link_url)
        )
      }
    };
    
    // Save analysis to JSON
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(analysis, null, 2));
    console.log(`\nAnalysis complete! Report saved to: ${OUTPUT_JSON}`);
    
    // Print summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total issues: ${analysis.summary.total_issues}`);
    console.log('\nBy issue type:');
    Object.entries(analysis.summary.by_issue_type).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\nBy priority:');
    Object.entries(analysis.summary.by_priority).forEach(([priority, count]) => {
      console.log(`  ${priority}: ${count}`);
    });
    
    console.log(`\nInternal 404s: ${analysis.internal_404s.length}`);
    console.log(`GitHub URLs needing updates: ${analysis.github_urls_needing_updates.length}`);
    
    // Print fix priority order
    console.log('\n=== FIX PRIORITY ORDER ===');
    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    priorityOrder.forEach(priority => {
      const count = analysis.summary.by_priority[priority] || 0;
      if (count > 0) {
        console.log(`\n${priority.toUpperCase()} priority (${count} issues):`);
        analysis.recommended_fix_order
          .filter(issue => issue.priority === priority)
          .slice(0, 10) // Show top 10 per priority
          .forEach((issue, index) => {
            console.log(`  ${index + 1}. ${issue.issue_type} - ${issue.link_url}`);
            console.log(`     Found on: ${issue.source_page}`);
          });
      }
    });
    
    // Save CSV of critical fixes
    const criticalFixes = analysis.recommended_fix_order.filter(i => i.priority === 'critical');
    if (criticalFixes.length > 0) {
      const csvContent = [
        'priority,issue_type,source_page,link_url,status_code',
        ...criticalFixes.map(i => 
          `${i.priority},${i.issue_type},"${i.source_page}","${i.link_url}",${i.status_code || ''}`
        )
      ].join('\n');
      
      fs.writeFileSync('critical_fixes.csv', csvContent);
      console.log('\nCritical fixes CSV saved to: critical_fixes.csv');
    }
  })
  .on('error', (error) => {
    console.error('Error reading CSV:', error);
    process.exit(1);
  });
