# MCP Directory Maintenance Tools

This directory contains scripts to keep the MCP Clients and Servers data clean and valid.

## Scripts

### 1. `validate_clients.js`
- **Purpose**: Checks all URLs in `clients.json` for 404 errors and archived status on GitHub.
- **Output**: 
  - `clients_validated.json`: Valid clients.
  - `dead_clients.json`: Clients removed due to 404 or archiving.
- **Run**: `node scripts/maintenance/validate_clients.js`

### 2. `cleanup_clients.js`
- **Purpose**: Fixes truncated or junk titles (like "M", "A"), removes duplicates, and filters out misclassified entries.
- **Input**: `clients_validated.json`
- **Output**: Updated `clients.json`
- **Run**: `node scripts/maintenance/cleanup_clients.js`

### 3. `final_polish.js`
- **Purpose**: Removes standalone emojis from titles and ensures proper title casing.
- **Input**: `clients.json`
- **Run**: `node scripts/maintenance/final_polish.js`

## Full Pipeline
To refresh and clean the entire clients list:
1. Run discovery scripts (e.g. `scrape_clients.js` and `extract_github_urls.js`).
2. `node scripts/maintenance/validate_clients.js`
3. `node scripts/maintenance/cleanup_clients.js`
4. `node scripts/maintenance/final_polish.js`

## Best Practices
- Run the validation pipeline weekly to catch dead links.
- Review `dead_clients.json` to see if any prominent projects were mistakenly flagged.
- Update the `verifiedClients` list in `src/pages/mcp-clients.astro` when new high-quality clients are identified.
