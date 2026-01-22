# Requirements: Icon/Logo System for MCP Directory

**Feature:** MCP Server Logo/Icon System  
**Version:** 1.0  
**Date:** 2026-01-21  
**Status:** Draft

## 1. User Stories

### 1.1 As a user browsing the MCP directory
**I want to** see distinctive logos for each MCP server  
**So that** I can quickly identify and recognize servers visually

**Acceptance Criteria:**
- [ ] Each server displays a logo or icon on the homepage
- [ ] Logos are at least 48x48px and clearly visible
- [ ] Logos load without blocking page rendering
- [ ] A fallback (gradient avatar) displays if logo unavailable

### 1.2 As a server maintainer
**I want to** have my server's logo displayed automatically  
**So that** my project gets proper brand recognition without manual setup

**Acceptance Criteria:**
- [ ] GitHub organization avatars are automatically fetched
- [ ] No configuration required from maintainers
- [ ] Logo updates reflect changes in GitHub profile
- [ ] System checks multiple sources for logos

### 1.3 As a performance-conscious user
**I want to** load the page quickly even with logos  
**So that** I can browse servers without delays

**Acceptance Criteria:**
- [ ] Page LCP doesn't increase by more than 200ms
- [ ] Logos load lazily (only when scrolled into view)
- [ ] Cache hit rate is ≥90%
- [ ] No render-blocking logo requests

### 1.4 As an accessibility user
**I want to** understand what each logo represents  
**So that** I can navigate the directory effectively with assistive technology

**Acceptance Criteria:**
- [ ] All logos have descriptive alt text
- [ ] Alt text follows format: "{Server Name} logo"
- [ ] Gradient fallback has aria-label
- [ ] Color contrast meets WCAG AA standards

## 2. Functional Requirements

### 2.1 Logo Resolution (Phase 1)
**Requirement:** Automatically fetch GitHub organization avatars

- [ ] Extract GitHub owner from repository URL
- [ ] Fetch owner avatar from GitHub API
- [ ] Cache avatar URL for 6 hours
- [ ] Return null if GitHub URL unavailable
- [ ] Support both `github.com/owner/repo` formats

**Data Source:** GitHub API `/repos/{owner}/{repo}` endpoint  
**Cache:** Cloudflare KV with 6-hour TTL  
**Fallback:** Gradient avatar with first letter

### 2.2 Logo Display (Phase 1)
**Requirement:** Display logos in server cards with proper fallback

- [ ] Show `<img>` tag with logo URL if available
- [ ] Display gradient avatar if logo URL is null
- [ ] Handle image load errors gracefully
- [ ] Use `onerror` handler to show fallback on broken images
- [ ] Apply lazy loading to defer image requests

**Component:** `FeaturedMcpServers.astro`  
**Image Size:** 48x48px  
**Loading:** `loading="lazy"` attribute

### 2.3 Caching Strategy (Phase 1)
**Requirement:** Cache logo URLs to minimize API calls

- [ ] Store logo URLs in Cloudflare KV
- [ ] Use key pattern: `logo:{server_id}`
- [ ] Set TTL to 6 hours for GitHub avatars
- [ ] Implement cache hit/miss tracking
- [ ] Support manual cache invalidation

**Cache Structure:**
```json
{
  "url": "https://avatars.githubusercontent.com/u/12345?v=4&s=128",
  "source": "github",
  "cachedAt": "2026-01-21T10:00:00Z"
}
```

### 2.4 Favicon Support (Phase 2)
**Requirement:** Use favicon from server homepage as fallback

- [ ] Extract homepage URL from GitHub repository
- [ ] Generate favicon URL using Google Favicon API
- [ ] Cache favicon URLs for 24 hours
- [ ] Try favicon if GitHub avatar unavailable
- [ ] Support multiple favicon API services

**Priority Order:**
1. GitHub organization avatar
2. Favicon from homepage
3. Gradient fallback

### 2.5 Multi-Source Strategy (Phase 3)
**Requirement:** Check multiple sources for high-quality logos

- [ ] Search GitHub repo for custom logo files
- [ ] Extract Open Graph image from homepage
- [ ] Support common logo paths (`/logo.svg`, `/logo.png`, etc.)
- [ ] Parse HTML meta tags for OG images
- [ ] Implement priority cascade

**Priority Order:**
1. Custom repository logo
2. Open Graph image
3. GitHub organization avatar
4. Favicon from homepage
5. Gradient fallback

## 3. Non-Functional Requirements

### 3.1 Performance
- [ ] Logo fetch time p50: <200ms
- [ ] Logo fetch time p95: <500ms
- [ ] Cache hit rate: ≥90%
- [ ] Page LCP increase: ≤200ms
- [ ] Image error rate: <2%

### 3.2 Reliability
- [ ] Logo display rate: ≥95%
- [ ] Fallback rate: ≤5%
- [ ] GitHub API error handling: graceful degradation
- [ ] Cache failure handling: continue without cache
- [ ] Image load failure handling: show gradient fallback

### 3.3 Accessibility
- [ ] All images have alt text
- [ ] Alt text is descriptive and meaningful
- [ ] Color contrast ratio: ≥3:1 for large graphics
- [ ] Fallback avatar is keyboard accessible
- [ ] Screen reader compatible

### 3.4 Scalability
- [ ] Support 1000+ servers without performance degradation
- [ ] Cache can handle 10,000+ entries
- [ ] API calls scale with server count
- [ ] Lazy loading prevents loading all logos at once

## 4. Data Requirements

### 4.1 Input Data
- **GitHub Repository URL:** `https://github.com/{owner}/{repo}`
- **Server ID:** Unique identifier for each server
- **Server Name:** Display name for alt text

### 4.2 Output Data
- **Logo URL:** Full URL to logo image
- **Logo Source:** Type of source (github/favicon/og/custom)
- **Cached At:** ISO timestamp of cache time

### 4.3 Data Schema Extension
```typescript
interface MCPServer {
  id: string;
  fields: {
    // Existing fields
    name: string;
    github_url: string;
    
    // New fields
    logo_url?: string;
    logo_source?: 'github' | 'favicon' | 'og-image' | 'repo-custom';
    logo_cached_at?: string;
    homepage_url?: string;
  };
}
```

## 5. Integration Points

### 5.1 GitHub API Integration
- **Endpoint:** `GET /repos/{owner}/{repo}`
- **Data Used:** `owner.avatar_url`
- **Rate Limit:** 60/hour (unauthenticated), 5000/hour (authenticated)
- **Caching:** 6-hour TTL in Cloudflare KV

### 5.2 Cloudflare Workers Integration
- **File:** `/workers/github-repo-stats.js`
- **Enhancement:** Add `logoUrl` and `logoSource` to response
- **Cache:** Store in KV with 6-hour TTL

### 5.3 Frontend Component Integration
- **File:** `/src/components/FeaturedMcpServers.astro`
- **Changes:** Add logo display logic with fallback
- **CSS:** Add styles for logo container and fallback

## 6. Success Metrics

### 6.1 Coverage Metrics
- **Logo Display Rate:** ≥95% of servers show actual logos
- **Fallback Rate:** ≤5% of servers use gradient fallback
- **Source Distribution:** Track breakdown by source type

### 6.2 Performance Metrics
- **Logo Fetch Time:** p50 <200ms, p95 <500ms
- **Cache Hit Rate:** ≥90%
- **Image Error Rate:** <2%
- **LCP Impact:** ≤200ms increase

### 6.3 Quality Metrics
- **Logo Resolution:** Minimum 128x128px
- **Logo Visibility:** Clearly distinguishable from background
- **Alt Text Coverage:** 100% of images have alt text

## 7. Constraints & Assumptions

### 7.1 Constraints
- Cannot modify server data without maintainer consent
- GitHub API rate limits apply
- External APIs may have downtime
- Image hosting depends on external services
- Browser support for lazy loading required

### 7.2 Assumptions
- All servers have GitHub repository URLs
- GitHub API is reliable (99.9% uptime)
- Favicon API is available and responsive
- Servers maintain their GitHub profiles
- Users have JavaScript enabled

## 8. Out of Scope (v1.0)

- [ ] Custom logo upload system
- [ ] Logo moderation/approval workflow
- [ ] Logo animation or interactive effects
- [ ] Logo editing or transformation
- [ ] User-specific logo preferences
- [ ] Logo versioning/history tracking

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-21  
**Status:** Ready for Design Phase
