#!/usr/bin/env python3

import csv
import json
from collections import defaultdict

# Read the CSV file
csv_file = '/Users/chesterbeard/Downloads/linkcanary_report_MCPSHELF_20260120.csv'

# Data structures to track issues
issues_by_type = defaultdict(lambda: defaultdict(int))
internal_404s = set()
github_urls_to_update = {}
all_issues = []

# Priority mapping
priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}

print("Analyzing LinkCanary report...")

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        issue_type = row['issue_type']
        priority = row['priority']
        link_url = row['link_url']
        status_code = row['status_code']
        source_page = row['source_page']
        
        # Count by type and priority
        issues_by_type[issue_type][priority] += 1
        
        # Track the issue for fixing
        issue = {
            'source_page': source_page,
            'link_url': link_url,
            'link_text': row['link_text'],
            'status_code': status_code,
            'issue_type': issue_type,
            'priority': priority,
            'final_url': row['final_url'],
            'recommended_fix': row['recommended_fix']
        }
        all_issues.append(issue)
        
        # Track internal 404s (high priority)
        if issue_type == 'broken' and status_code == '404' and 'mymcpshelf.com' in link_url:
            internal_404s.add(link_url)
        
        # Track GitHub URLs from main page that need updating
        if 'mymcpshelf.com' in source_page and 'github.com' in link_url:
            if issue_type in ['broken', 'redirect'] and status_code in ['404', '301', '302']:
                github_urls_to_update[link_url] = {
                    'status_code': status_code,
                    'final_url': row['final_url'],
                    'recommended_fix': row['recommended_fix'],
                    'source_pages': set()
                }
            if link_url in github_urls_to_update:
                github_urls_to_update[link_url]['source_pages'].add(source_page)

# Convert sets to lists for JSON serialization
for url_data in github_urls_to_update.values():
    url_data['source_pages'] = list(url_data['source_pages'])

# Create final analysis
analysis = {
    'summary': {
        'total_issues': len(all_issues),
        'by_issue_type': {k: dict(v) for k, v in issues_by_type.items()},
    },
    'internal_404s': list(internal_404s),
    'github_urls_to_update': github_urls_to_update,
    'all_issues': sorted(all_issues, key=lambda x: (priority_order.get(x['priority'], 4), x['issue_type']))
}

# Save to JSON
output_file = 'linkcanary_analysis.json'
with open(output_file, 'w') as f:
    json.dump(analysis, f, indent=2)

# Print summary
print(f"\n{'='*60}")
print("LINKCANARY REPORT ANALYSIS")
print(f"{'='*60}")
print(f"Total issues found: {len(all_issues)}")
print(f"\nIssues by type and priority:")
for issue_type in ['broken', 'redirect_chain', 'redirect', 'canonical_redirect', 'error']:
    if issue_type in issues_by_type:
        counts = issues_by_type[issue_type]
        total = sum(counts.values())
        print(f"\n  {issue_type.replace('_', ' ').title()}: {total}")
        for pri in ['critical', 'high', 'medium', 'low']:
            if pri in counts:
                print(f"    {pri}: {counts[pri]}")

print(f"\n{'='*60}")
print(f"Internal 404 URLs to fix ({len(internal_404s)}):")
print(f"{'='*60}")
for url in sorted(internal_404s):
    print(f"  - {url}")

print(f"\n{'='*60}")
print(f"GitHub URLs to update ({len(github_urls_to_update)}):")
print(f"{'='*60}")
for url, data in github_urls_to_update.items():
    print(f"\n  {url}")
    print(f"    Status: {data['status_code']}")
    if data['final_url']:
        print(f"    Final URL: {data['final_url']}")
    print(f"    Fix: {data['recommended_fix']}")

print(f"\n✅ Analysis complete! Saved to: {output_file}")