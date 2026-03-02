# Requirements Document

## Introduction

The Agent Skills feature builds a comprehensive directory system for MCP (Model Context Protocol) agent skills. This feature replaces the existing /claude-skills page with a broader scope that covers all MCP agent skills, not just Claude-specific ones. The system will scrape skills from skills.sh, enrich the data from GitHub SKILL.md files, and provide a user-friendly interface for browsing, searching, and discovering agent skills. The feature also includes cross-linking capabilities to show related skills on MCP server cards.

## Glossary

- **Agent Skills Directory**: The main data structure containing all MCP agent skills with metadata
- **Skills.sh**: The external website (skills.sh) that lists MCP agent skills
- **SKILL.md**: Standardized markdown files that describe MCP skills in a repository
- **MCP Server**: An MCP server that provides tools and capabilities to LLMs
- **MCP Skill**: A specific capability or function that an MCP server provides
- **Related Skills**: Skills that are conceptually or functionally connected to each other
- **Publisher Badge**: A visual indicator showing who published the skill
- **Rank Badge**: A numerical ranking indicator for popular skills

## Requirements

### Requirement 1: Data Collection - Scrape skills.sh

**User Story:** As a developer, I want to automatically scrape skills from skills.sh, so that we can build a comprehensive directory of MCP agent skills.

#### Acceptance Criteria

1. WHEN the scrape script runs, THE Scraper SHALL fetch the HTML content from skills.sh
2. THE Scraper SHALL extract all skill entries from the skills.sh page
3. IF the scrape fails, THEN THE Scraper SHALL log the error and retry up to 3 times
4. WHEN all retries are exhausted, THEN THE Scraper SHALL return a failure status with error details

### Requirement 2: Data Collection - Enrich from GitHub

**User Story:** As a developer, I want to enrich scraped skills with data from GitHub SKILL.md files, so that we have complete and accurate skill information.

#### Acceptance Criteria

1. WHEN a skill's GitHub repository URL is available, THE Enricher SHALL fetch the SKILL.md file
2. THE Enricher SHALL extract the skill description, installation command, and metadata from SKILL.md
3. IF the SKILL.md file is not found, THEN THE Enricher SHALL continue with the scraped data
4. THE Enricher SHALL merge GitHub data with scraped data, prioritizing GitHub data when available

### Requirement 3: Data Storage - Agent Skills JSON

**User Story:** As a developer, I want to store all agent skills in a JSON file, so that the application can efficiently load and display skill data.

#### Acceptance Criteria

1. THE System SHALL create a data/agent-skills.json file
2. THE System SHALL include at least 100 skill entries in the JSON file
3. EACH skill entry SHALL include the following required fields:
   - name: The skill name
   - description: A brief description of the skill
   - installationCommand: The npm install command
   - githubUrl: The GitHub repository URL
   - publisher: The publisher name
   - rank: The skill rank (optional, may be null)
   - category: The skill category
   - relatedMcpServers: An array of related MCP server names
4. THE System SHALL validate all entries before writing to the JSON file
5. IF validation fails, THEN THE System SHALL log the error and skip the invalid entry

### Requirement 4: Data Storage - MCP Skill Map

**User Story:** As a developer, I want to create a mapping between MCP server categories and related skills, so that we can show related skills on MCP cards.

#### Acceptance Criteria

1. THE System SHALL create a data/mcp-skill-map.json file
2. EACH entry SHALL map an MCP server category to an array of related skill names
3. THE System SHALL use the relatedMcpServers field from agent-skills.json to populate this mapping
4. THE System SHALL ensure the mapping is bidirectional where applicable

### Requirement 5: Data API - Agent Skills API

**User Story:** As a developer, I want a clean API to access agent skills data, so that the frontend can easily retrieve and filter skills.

#### Acceptance Criteria

1. THE System SHALL create a src/utils/agentSkillsApi.js file
2. THE API SHALL provide a function to get all skills
3. THE API SHALL provide a function to get skills by category
4. THE API SHALL provide a function to search skills by name or description
5. THE API SHALL provide a function to get a skill by name
6. THE API SHALL provide a function to get related skills for a given skill
7. THE API SHALL cache data after the first load for performance

### Requirement 6: Data API - MCP Skill Map API

**User Story:** As a developer, I want a clean API to access the MCP skill mapping, so that the frontend can display related skills on MCP cards.

#### Acceptance Criteria

1. THE System SHALL provide a function to get skills related to an MCP server
2. THE System SHALL provide a function to get MCP servers related to a skill
3. THE API SHALL use the same caching mechanism as the Agent Skills API

### Requirement 7: Page - Agent Skills Page

**User Story:** As a user, I want to browse all agent skills in a clean interface, so that I can discover new skills for my MCP servers.

#### Acceptance Criteria

1. THE System SHALL create a src/pages/agent-skills.astro page
2. THE System SHALL replace the existing /claude-skills page
3. THE Page SHALL display all skills in a grid of cards
4. EACH skill card SHALL show: name, description, publisher badge, rank badge (if rank ≤ 100), and installation command
5. EACH skill card SHALL include a copy button that copies the installation command to the clipboard
6. WHEN the copy button is clicked, THE System SHALL show a visual confirmation
7. THE Page SHALL include a "Submit a Skill" CTA that links to the GitHub issues page
8. THE Page SHALL be mobile responsive
9. THE Page SHALL support dark mode

### Requirement 8: Page - Search Functionality

**User Story:** As a user, I want to search for skills by name or description, so that I can quickly find the skill I need.

#### Acceptance Criteria

1. THE Page SHALL include a search input field
2. WHEN the user types in the search field, THE System SHALL filter skills in real-time
3. THE Search SHALL match against skill names and descriptions
4. IF no skills match, THE System SHALL display a "No skills found" message

### Requirement 9: Page - Category Filtering

**User Story:** As a user, I want to filter skills by category, so that I can explore skills in a specific domain.

#### Acceptance Criteria

1. THE Page SHALL include category pills for filtering
2. WHEN a category pill is clicked, THE System SHALL filter skills to show only that category
3. WHEN a category pill is clicked again, THE System SHALL remove the filter
4. THE Page SHALL show the count of skills in each category
5. THE Page SHALL include an "All" category that shows all skills

### Requirement 10: Page - Related Skills Display

**User Story:** As a user, I want to see related skills on MCP cards, so that I can discover complementary skills.

#### Acceptance Criteria

1. WHEN an MCP card is displayed, THE System SHALL show related skills as pills
2. EACH related skill pill SHALL link to the corresponding skill in the agent-skills page
3. THE System SHALL use the mcp-skill-map.json to determine related skills
4. IF no related skills exist, THE System SHALL display a "No related skills" message

### Requirement 11: Documentation - SKILL.md Files

**User Story:** As a developer, I want to create SKILL.md files for the skills repository, so that the skills can be properly documented and published.

#### Acceptance Criteria

1. THE System SHALL create two SKILL.md files in a separate mymcpshelf/skills GitHub repository
2. EACH SKILL.md file SHALL follow the standard SKILL.md format
3. EACH SKILL.md file SHALL include: name, description, installation command, and usage examples
4. THE System SHALL generate SKILL.md files from the agent-skills.json data

### Requirement 12: Redirect - Claude Skills

**User Story:** As a user, I want the old /claude-skills URL to redirect to the new /agent-skills page, so that existing bookmarks and links continue to work.

#### Acceptance Criteria

1. THE System SHALL create a redirect from /claude-skills to /agent-skills
2. THE Redirect SHALL be a 301 permanent redirect
3. THE Redirect SHALL preserve any query parameters

### Requirement 13: Data Validation - Required Fields

**User Story:** As a developer, I want to ensure all skill entries have required fields, so that the application doesn't break due to missing data.

#### Acceptance Criteria

1. THE System SHALL validate that each skill entry has all required fields
2. IF a required field is missing, THEN THE System SHALL log a warning and use a default value
3. THE System SHALL generate a validation report after data processing

### Requirement 14: Data Validation - Data Integrity

**User Story:** As a developer, I want to ensure data integrity in the agent skills directory, so that users can trust the information displayed.

#### Acceptance Criteria

1. THE System SHALL validate that all URLs are valid and accessible
2. THE System SHALL validate that all installation commands are valid npm commands
3. THE System SHALL check for duplicate skill names and resolve conflicts
4. THE System SHALL log any data integrity issues

### Requirement 15: Performance - Caching

**User Story:** As a user, I want the agent skills page to load quickly, so that I can start exploring skills immediately.

#### Acceptance Criteria

1. THE System SHALL cache agent skills data after the first load
2. THE Cache SHALL persist across page reloads during the same session
3. THE System SHALL provide a refresh button to clear the cache and reload data

### Requirement 16: Accessibility - WCAG Compliance

**User Story:** As a user with disabilities, I want the agent skills page to be accessible, so that I can use the feature effectively.

#### Acceptance Criteria

1. THE Page SHALL be navigable using keyboard only
2. THE Page SHALL have proper ARIA labels for all interactive elements
3. THE Page SHALL have sufficient color contrast for text
4. THE Page SHALL support screen readers
5. THE Search input SHALL have a label associated with it

### Requirement 17: Dark Mode Support

**User Story:** As a user, I want the agent skills page to support dark mode, so that I can use it in low-light environments.

#### Acceptance Criteria

1. THE Page SHALL automatically detect the user's system dark mode preference
2. THE Page SHALL provide a manual dark mode toggle
3. ALL UI elements SHALL adapt to dark mode styling
4. THE System SHALL persist the user's dark mode preference

### Requirement 18: Mobile Responsiveness

**User Story:** As a mobile user, I want the agent skills page to work on my device, so that I can explore skills on the go.

#### Acceptance Criteria

1. THE Page SHALL display correctly on screen widths from 320px to 1920px
2. THE Grid SHALL adapt to show 1 column on mobile, 2-3 columns on tablet, and 4+ columns on desktop
3. ALL interactive elements SHALL be touch-friendly with adequate spacing
4. THE Search input SHALL be easily accessible on mobile devices
