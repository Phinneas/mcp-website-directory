# Implementation Tasks: Icon/Logo System for MCP Directory

**Feature:** MCP Server Logo/Icon System  
**Phase:** 1 (GitHub Avatars)  
**Estimated Duration:** 8-12 hours  
**Status:** Ready to Start

---

## Phase 1: GitHub Avatars (Week 1)

### 1. Worker Enhancement

#### 1.1 Update GitHub Stats Worker
- [ ] Open `/workers/github-repo-stats.js`
- [ ] Add `logoUrl` field to response object
- [ ] Add `logoSource` field to response object
- [ ] Extract `owner.avatar_url` from GitHub API response
- [ ] Append `&s=128` to avatar URL for 128px size
- [ ] Handle case where avatar_url is unavailable
- [ ] Update KV cache structure to include logo fields
- [ ] Test worker locally with sample GitHub URLs
- [ ] Verify response includes both stats and logo data

**Acceptance Criteria:**
- [ ] Worker returns `logoUrl` and `logoSource` in response
- [ ] Avatar URL is properly formatted with size parameter
- [ ] Null values handled gracefully
- [ ] Cache includes logo data

#### 1.2 Add GitHub Token Authentication
- [ ] Check if `GITHUB_TOKEN` environment variable exists
- [ ] Add token to GitHub API request headers
- [ ] Increase rate limit from 60 to 5000 requests/hour
- [ ] Document token setup in README

**Acceptance Criteria:**
- [ ] Worker uses authenticated requests
- [ ] Rate limit increased to 5000/hour
- [ ] Token is securely stored in environment

### 2. Logo Resolver Utility

#### 2.1 Create logoResolver.js
- [ ] Create `/src/utils/logoResolver.js` file
- [ ] Implement `resolveServerLogo(server)` function
- [ ] Parse GitHub URL from `server.fields.github_url`
- [ ] Extract owner and repo from URL
- [ ] Fetch from `/api/github-stats` endpoint
- [ ] Return logo data object with url, source, cachedAt
- [ ] Handle errors gracefully (return null values)
- [ ] Add JSDoc comments for all functions

**Acceptance Criteria:**
- [ ] Function accepts server object
- [ ] Returns object with url, source, cachedAt properties
- [ ] Handles invalid GitHub URLs
- [ ] Handles API errors without throwing

#### 2.2 Implement Batch Resolution
- [ ] Implement `batchResolveLogos(servers)` function
- [ ] Accept array of server objects
- [ ] Resolve logos in parallel using Promise.all()
- [ ] Return Map of server IDs to logo data
- [ ] Handle partial failures gracefully

**Acceptance Criteria:**
- [ ] Function accepts array of servers
- [ ] Returns Map with all server IDs
- [ ] Parallel resolution improves performance
- [ ] Partial failures don't block other resolutions

#### 2.3 Add Error Handling
- [ ] Catch network errors
- [ ] Catch JSON parsing errors
- [ ] Log errors to console
- [ ] Return null values on error
- [ ] Never throw exceptions

**Acceptance Criteria:**
- [ ] All error cases handled
- [ ] Errors logged for debugging
- [ ] Function never crashes

### 3. Frontend Component Update

#### 3.1 Update FeaturedMcpServers Component
- [ ] Open `/src/components/FeaturedMcpServers.astro`
- [ ] Add `getServerLogo()` helper function
- [ ] Check for `logoUrl` in server data
- [ ] Return URL if available, null otherwise

**Acceptance Criteria:**
- [ ] Helper function correctly identifies logo URLs
- [ ] Returns null for missing logos

#### 3.2 Add Logo Display Logic
- [ ] Add conditional rendering for logo image
- [ ] Render `<img>` tag when logoUrl exists
- [ ] Set `src` to logoUrl
- [ ] Set `alt` to "{Server Name} logo"
- [ ] Add `loading="lazy"` attribute
- [ ] Set `width="48"` and `height="48"`
- [ ] Add `onerror` handler for broken images

**Acceptance Criteria:**
- [ ] Logo displays when URL available
- [ ] Alt text is descriptive
- [ ] Lazy loading attribute present
- [ ] Image dimensions specified

#### 3.3 Add Fallback Logic
- [ ] Keep existing gradient avatar code
- [ ] Hide gradient when logo available
- [ ] Show gradient when logo unavailable
- [ ] Show gradient on image error (via onerror)
- [ ] Use `style` attribute to toggle display

**Acceptance Criteria:**
- [ ] Gradient shows when no logo
- [ ] Gradient shows on image error
- [ ] No broken image icons displayed

#### 3.4 Add CSS Styles
- [ ] Add `.server-logo` class for image styling
- [ ] Set width/height to 48px
- [ ] Add border-radius for circular shape
- [ ] Set object-fit to cover
- [ ] Add subtle border
- [ ] Add dark mode support
- [ ] Ensure gradient fallback maintains same size

**Acceptance Criteria:**
- [ ] Logo displays as 48x48px circle
- [ ] Border visible for definition
- [ ] Dark mode appearance acceptable
- [ ] Fallback same size as logo

### 4. Data Integration

#### 4.1 Update PulseMCP Transform
- [ ] Open `/src/utils/pulsemcpApi.js`
- [ ] Update `transformPulseMCPData()` function
- [ ] Add `logoUrl` to fields
- [ ] Add `logoSource` to fields
- [ ] Add `logoCachedAt` to fields
- [ ] Set to null if not provided

**Acceptance Criteria:**
- [ ] Transform function includes logo fields
- [ ] Fields default to null if missing
- [ ] No breaking changes to existing fields

#### 4.2 Update Server Data Interface
- [ ] Update TypeScript interface for MCPServer
- [ ] Add optional `logo_url` field
- [ ] Add optional `logo_source` field
- [ ] Add optional `logo_cached_at` field
- [ ] Document new fields

**Acceptance Criteria:**
- [ ] Interface includes logo fields
- [ ] Fields are optional (backward compatible)
- [ ] Types are correct

### 5. Testing

#### 5.1 Unit Tests for Logo Resolver
- [ ] Create `/tests/utils/logoResolver.test.js`
- [ ] Test valid GitHub URL resolution
- [ ] Test invalid GitHub URL handling
- [ ] Test missing GitHub URL handling
- [ ] Test error handling
- [ ] Test batch resolution
- [ ] Run tests locally

**Acceptance Criteria:**
- [ ] All unit tests pass
- [ ] Coverage ≥90%
- [ ] Error cases covered

#### 5.2 Integration Tests for Component
- [ ] Create `/tests/integration/logo-display.test.js`
- [ ] Test logo display when URL provided
- [ ] Test gradient fallback when no URL
- [ ] Test image error handling
- [ ] Test alt text presence
- [ ] Test lazy loading attribute
- [ ] Run tests locally

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] Component renders correctly
- [ ] Fallback works as expected

#### 5.3 Manual Testing
- [ ] Test on staging environment
- [ ] Verify logos display on homepage
- [ ] Test with 10+ different servers
- [ ] Test on mobile (responsive)
- [ ] Test on tablet
- [ ] Test on desktop
- [ ] Test dark mode
- [ ] Test with slow network (DevTools throttling)
- [ ] Test image error scenarios

**Acceptance Criteria:**
- [ ] Logos display correctly on all devices
- [ ] Fallback works on all devices
- [ ] No console errors
- [ ] Performance acceptable

#### 5.4 Performance Testing
- [ ] Measure LCP before implementation
- [ ] Measure LCP after implementation
- [ ] Verify LCP increase ≤ 200ms
- [ ] Measure cache hit rate
- [ ] Verify cache hit rate ≥ 90%
- [ ] Test with 100+ servers
- [ ] Run Lighthouse audit

**Acceptance Criteria:**
- [ ] LCP increase ≤ 200ms
- [ ] Cache hit rate ≥ 90%
- [ ] Lighthouse score maintained
- [ ] No performance regression

### 6. Deployment

#### 6.1 Deploy to Staging
- [ ] Commit all changes
- [ ] Push to staging branch
- [ ] Deploy to staging environment
- [ ] Run full test suite
- [ ] Verify all tests pass
- [ ] Manual QA on staging

**Acceptance Criteria:**
- [ ] All tests pass on staging
- [ ] No console errors
- [ ] Logos display correctly
- [ ] Performance acceptable

#### 6.2 Deploy to Production (Canary)
- [ ] Create feature flag for logo display
- [ ] Deploy to production with flag disabled
- [ ] Enable flag for 10% of traffic
- [ ] Monitor metrics for 24 hours
- [ ] Check error rates
- [ ] Check performance metrics
- [ ] Verify cache hit rate

**Acceptance Criteria:**
- [ ] Feature flag working
- [ ] 10% traffic receiving logos
- [ ] No errors or performance issues
- [ ] Metrics look good

#### 6.3 Full Production Rollout
- [ ] Enable feature flag for 100% of traffic
- [ ] Monitor metrics for 48 hours
- [ ] Verify logo display rate ≥ 95%
- [ ] Verify fallback rate ≤ 5%
- [ ] Verify cache hit rate ≥ 90%
- [ ] Verify image error rate < 2%

**Acceptance Criteria:**
- [ ] Logo display rate ≥ 95%
- [ ] Fallback rate ≤ 5%
- [ ] Cache hit rate ≥ 90%
- [ ] Image error rate < 2%
- [ ] No performance regression

#### 6.4 Remove Feature Flag
- [ ] Remove feature flag code
- [ ] Simplify component logic
- [ ] Deploy final version
- [ ] Verify everything still works

**Acceptance Criteria:**
- [ ] Feature flag removed
- [ ] Code simplified
- [ ] All tests pass
- [ ] Production working correctly

### 7. Documentation

#### 7.1 Update Developer Documentation
- [ ] Document logo resolution algorithm
- [ ] Document cache structure
- [ ] Document error handling
- [ ] Add code examples
- [ ] Document testing approach

**Acceptance Criteria:**
- [ ] Documentation complete
- [ ] Examples provided
- [ ] Clear and understandable

#### 7.2 Update API Documentation
- [ ] Document `/api/github-stats` endpoint
- [ ] Document response format
- [ ] Document cache headers
- [ ] Document error codes
- [ ] Document rate limiting

**Acceptance Criteria:**
- [ ] API documentation complete
- [ ] Response format documented
- [ ] Error cases documented

#### 7.3 Create Monitoring Guide
- [ ] Document key metrics
- [ ] Document alert thresholds
- [ ] Document troubleshooting steps
- [ ] Document rollback procedure

**Acceptance Criteria:**
- [ ] Monitoring guide complete
- [ ] Metrics documented
- [ ] Rollback procedure clear

### 8. Monitoring & Validation

#### 8.1 Set Up Monitoring
- [ ] Create dashboard for logo metrics
- [ ] Set up alerts for critical issues
- [ ] Set up alerts for warnings
- [ ] Configure logging
- [ ] Test alert notifications

**Acceptance Criteria:**
- [ ] Dashboard created
- [ ] Alerts configured
- [ ] Logging working

#### 8.2 Validate Success Metrics
- [ ] Logo display rate ≥ 95%
- [ ] Fallback rate ≤ 5%
- [ ] Cache hit rate ≥ 90%
- [ ] Image error rate < 2%
- [ ] LCP increase ≤ 200ms
- [ ] GitHub API error rate < 1%

**Acceptance Criteria:**
- [ ] All success metrics met
- [ ] No critical issues
- [ ] Performance acceptable

---

## Summary

**Total Tasks:** 8 main sections with 40+ subtasks  
**Estimated Time:** 8-12 hours  
**Dependencies:** None (can start immediately)  
**Blockers:** None identified

**Next Steps:**
1. Review requirements and design documents
2. Set up development environment
3. Start with Worker enhancement (Task 1)
4. Follow sequential order for best results

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-21  
**Status:** Ready for Implementation
