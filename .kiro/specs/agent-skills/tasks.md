# Implementation Plan: Agent Skills

## Overview

This feature builds a comprehensive directory system for MCP agent skills, replacing the existing /claude-skills page. The implementation includes data scraping, enrichment, API utilities, a new UI page, cross-linking capabilities, and documentation generation.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Verify Node.js version (18+)
  - Install required dependencies: `node-fetch`, `cheerio`, `fast-check` (for testing)
  - Create directory structure: `scripts/`, `data/`, `src/utils/`
  - _Requirements: 1, 2, 3, 4_

- [x] 2. Implement scraper and data collection (Phase 1)
  - [x] 2.1 Write scripts/scrape_agent_skills.js
    - Implement HTML fetching with retry mechanism (up to 3 retries)
    - Parse skills.sh HTML to extract skill entries
    - Handle errors and log appropriately
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 2.2 Implement GitHub enrichment
    - Fetch SKILL.md files from GitHub URLs
    - Extract description, installation command, and metadata
    - Merge GitHub data with scraped data (prioritize GitHub)
    - Handle missing SKILL.md gracefully
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.3 Create data/agent-skills.json
    - Define JSON schema with all required fields
    - Validate entries before writing
    - Include at least 100 skill entries
    - Log validation errors and skip invalid entries
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 2.4 Write property test for scraping
    - **Property 1: Scraping extracts all skills**
    - **Validates: Requirements 1.2**
    - Test HTML parsing with various valid HTML responses
  
  - [x] 2.5 Write property test for retry mechanism
    - **Property 2: Retry mechanism handles failures**
    - **Validates: Requirements 1.3, 1.4**
    - Test retry logic with simulated failures
  
  - [x] 2.6 Write property test for GitHub enrichment
    - **Property 3: GitHub enrichment prioritizes GitHub data**
    - **Validates: Requirements 2.4**
    - Test data merging with GitHub and scraped data
  
  - [x] 2.7 Write property test for validation
    - **Property 4: Validation rejects invalid entries**
    - **Validates: Requirements 3.4, 3.5**
    - Test validation with missing required fields

- [x] 3. Create MCP skill mapping (Phase 1)
  - [x] 3.1 Write data/mcp-skill-map.json
    - Create bidirectional mapping structure
    - Populate from agent-skills.json relatedMcpServers field
    - Ensure consistency between skill-to-server and server-to-skill mappings
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 3.2 Write property test for bidirectional mapping
    - **Property 5: MCP skill map is bidirectional**
    - **Validates: Requirements 4.4**
    - Test that skill-to-server and server-to-skill mappings are consistent

- [x] 4. Implement Agent Skills API (Phase 2)
  - [x] 4.1 Create src/utils/agentSkillsApi.js
    - Implement `getAllSkills()` with caching
    - Implement `getSkillsByCategory(category)`
    - Implement `searchSkills(query)` for name/description search
    - Implement `getSkillByName(name)`
    - Implement `getRelatedSkills(skillName)`
    - Implement `clearCache()` for manual refresh
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 4.2 Create src/utils/mcpSkillMapApi.js
    - Implement `getSkillsForServer(serverName)`
    - Implement `getServersForSkill(skillName)`
    - Implement `getAllServers()`
    - Use same caching mechanism as agentSkillsApi
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 4.3 Write property test for API caching
    - **Property 6: API caching improves performance**
    - **Validates: Requirements 5.7, 6.3, 15.1, 15.2**
    - Test that cached data is returned on subsequent calls

- [x] 5. Implement Agent Skills Page (Phase 2)
  - [x] 5.1 Create src/pages/agent-skills.astro
    - Build page structure with Layout, Hero, Search, CategoryFilter, SkillsGrid, SubmitCTA
    - Implement responsive grid layout (1 column mobile, 2-3 tablet, 4+ desktop)
    - _Requirements: 7.1, 7.2, 7.3, 7.8, 7.9_
  
  - [x] 5.2 Implement skill cards
    - Display name, description, publisher badge, rank badge (if rank ≤ 100)
    - Show installation command
    - Implement copy button with visual confirmation
    - _Requirements: 7.4, 7.5, 7.6, 7.7_
  
  - [x] 5.3 Implement search functionality
    - Add search input field
    - Implement real-time filtering against name and description
    - Display "No skills found" message when no matches
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 5.4 Implement category filtering
    - Add category pills with skill counts
    - Implement "All" category
    - Click to filter/unfilter skills
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 5.5 Implement dark mode support
    - Auto-detect system dark mode preference
    - Add manual dark mode toggle
    - Ensure all UI elements adapt to dark mode
    - Persist user preference
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
  
  - [x] 5.6 Write property test for search functionality
    - **Property 7: Search matches names and descriptions**
    - **Validates: Requirements 8.3**
    - Test search against various queries
  
  - [x] 5.7 Write property test for category filtering
    - **Property 8: Category filtering works correctly**
    - **Validates: Requirements 9.2, 9.3**
    - Test filtering and unfiltering behavior
  
  - [x] 5.8 Write property test for copy button
    - **Property 9: Copy button copies installation command**
    - **Validates: Requirements 7.5**
    - Test clipboard copy functionality
  
  - [x] 5.9 Write property test for dark mode adaptation
    - **Property 13: Dark mode adapts all elements**
    - **Validates: Requirements 17.3**
    - Test all UI elements adapt to dark mode

- [x] 6. Implement redirect from /claude-skills (Phase 2)
  - [x] 6.1 Update netlify.toml
    - Add redirect rule from /claude-skills to /agent-skills
    - Set 301 permanent redirect
    - Preserve query parameters
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 6.2 Update claude-skills.astro
    - Replace existing page with redirect implementation
    - Ensure 301 status code
    - Preserve query parameters
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 6.3 Write property test for redirect
    - **Property 10: Redirect preserves query parameters**
    - **Validates: Requirements 12.3**
    - Test redirect with various query parameters

- [x] 7. Implement cross-linking (Phase 3)
  - [x] 7.1 Enrich skills with related MCPs in agentSkillsApi.js
    - Add function to join skills with MCP servers
    - Implement enrichment logic
    - _Requirements: 3.1_
  
  - [x] 7.2 Update MCP cards to render related skills
    - Display related skills as pills on MCP cards
    - Link to corresponding skill in agent-skills page
    - Show "No related skills" message when none exist
    - _Requirements: 3.2, 10.1, 10.2, 10.3, 10.4_
  
  - [x] 7.3 Write property test for grid responsiveness
    - **Property 14: Grid adapts to screen size**
    - **Validates: Requirements 18.2**
    - Test grid columns at various screen widths

- [x] 8. Implement documentation generation (Phase 4)
  - [x] 8.1 Write scripts/generate-skill-md.js
    - Generate SKILL.md files from agent-skills.json
    - Follow standard SKILL.md format
    - Include name, description, installation command, usage examples
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [x] 8.2 Create skills-publish/mcp-shelf/SKILL.md
    - Generate SKILL.md for mcp-shelf skill
    - Include all required sections
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [x] 8.3 Create skills-publish/mcp-config-generator/SKILL.md
    - Generate SKILL.md for mcp-config-generator skill
    - Include all required sections
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 9. Data validation and integrity (Phase 1-2)
  - [x] 9.1 Implement validation for required fields
    - Validate all skill entries have required fields
    - Log warnings and use default values for missing fields
    - Generate validation report
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [x] 9.2 Implement data integrity checks
    - Validate URLs are accessible
    - Validate installation commands are valid npm commands
    - Check for duplicate skill names and resolve conflicts
    - Log data integrity issues
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [x] 9.3 Write property test for validation defaults
    - **Property 11: Validation uses default values**
    - **Validates: Requirements 13.2**
    - Test default value assignment for missing fields
  
  - [x] 9.4 Write property test for duplicate detection
    - **Property 12: Duplicate detection resolves conflicts**
    - **Validates: Requirements 14.3**
    - Test duplicate skill name resolution

- [x] 10. Accessibility implementation
  - [x] 10.1 Keyboard navigation
    - Ensure all interactive elements are accessible via keyboard
    - _Requirements: 16.1_
  
  - [x] 10.2 ARIA labels
    - Add proper ARIA labels to all interactive elements
    - _Requirements: 16.2_
  
  - [x] 10.3 Color contrast
    - Ensure sufficient color contrast for text
    - _Requirements: 16.3_
  
  - [x] 10.4 Screen reader support
    - Ensure page is navigable with screen readers
    - _Requirements: 16.4_
  
  - [x] 10.5 Search input label
    - Add label associated with search input
    - _Requirements: 16.5_

- [x] 11. Mobile responsiveness
  - [x] 11.1 Responsive grid
    - Display correctly on screen widths from 320px to 1920px
    - _Requirements: 18.1, 18.2_
  
  - [x] 11.2 Touch-friendly elements
    - Ensure adequate spacing for touch targets
    - _Requirements: 18.3_
  
  - [x] 11.3 Mobile search accessibility
    - Ensure search input is easily accessible on mobile
    - _Requirements: 18.4_

- [x] 12. Performance optimization
  - [x] 12.1 Implement caching
    - Cache agent skills data after first load
    - Persist across page reloads during session
    - _Requirements: 15.1, 15.2_
  
  - [x] 12.2 Add refresh button
    - Provide button to clear cache and reload data
    - _Requirements: 15.3_

- [x] 13. Checkpoint - Ensure all tests pass
  - Run all property tests and unit tests
  - Ensure all acceptance criteria are met
  - Fix any failing tests or validation errors
  - Ask the user if questions arise.

- [x] 14. Final checkpoint - Ensure all tests pass
  - Run full test suite
  - Verify all requirements are met
  - Verify accessibility compliance
  - Verify mobile responsiveness
  - Ensure all tests pass
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All implementation tasks must pass diagnostics before proceeding
- The feature is complete once all non-optional tasks are implemented and tested
