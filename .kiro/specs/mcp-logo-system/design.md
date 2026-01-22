# Design: Icon/Logo System for MCP Directory

**Feature:** MCP Server Logo/Icon System  
**Version:** 1.0  
**Date:** 2026-01-21

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│ Browser / Frontend                                          │
│  - FeaturedMcpServers.astro component                       │
│  - Logo display with lazy loading                           │
│  - Gradient fallback rendering                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Astro SSR / Build Time                                      │
│  - logoResolver.js utility                                  │
│  - Logo URL resolution logic                                │
│  - Cache lookup and population                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Workers / Edge                                   │
│  - github-repo-stats.js worker                              │
│  - GitHub API integration                                   │
│  - KV cache management                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ External APIs                                               │
│  - GitHub API (owner.avatar_url)                            │
│  - Google Favicon API (Phase 2)                             │
│  - Homepage HTML parsing (Phase 3)                          │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
1. Build Time (Astro SSR)
   ├─ Fetch server list from PulseMCP API
   ├─ For each server:
   │  ├─ Extract GitHub URL
   │  ├─ Call logoResolver.resolveServerLogo()
   │  └─ Add logo_url to server data
   └─ Pass servers to FeaturedMcpServers component

2. Runtime (Browser)
   ├─ Render server cards
   ├─ For each server:
   │  ├─ If logo_url exists:
   │  │  └─ Render <img src={logo_url} loading="lazy">
   │  └─ Else:
   │     └─ Render gradient avatar <div>
   └─ On image error:
      └─ Hide <img>, show gradient fallback

3. Caching (Cloudflare KV)
   ├─ Check cache for logo:{server_id}
   ├─ If HIT: return cached URL
   └─ If MISS:
      ├─ Fetch from GitHub API
      ├─ Store in KV (6-hour TTL)
      └─ Return URL
```

## 2. Phase 1: GitHub Avatars Implementation

### 2.1 Worker Enhancement

**File:** `/workers/github-repo-stats.js`

**Current Response:**
```javascript
{
  pushedAt: "2026-01-15T10:30:00Z",
  openIssues: 12,
  stars: 1234,
  updatedAt: "2026-01-21T08:00:00Z"
}
```

**Enhanced Response:**
```javascript
{
  pushedAt: "2026-01-15T10:30:00Z",
  openIssues: 12,
  stars: 1234,
  updatedAt: "2026-01-21T08:00:00Z",
  logoUrl: "https://avatars.githubusercontent.com/u/12345?v=4&s=128",
  logoSource: "github"
}
```

**Implementation:**
```javascript
// In github-repo-stats.js worker

async function handleRequest(request) {
  const url = new URL(request.url);
  const owner = url.searchParams.get('owner');
  const repo = url.searchParams.get('repo');

  // Check cache first
  const cacheKey = `github:stats:${owner}/${repo}`;
  const cached = await LOGO_CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=21600',
        'X-Cache': 'HIT'
      }
    });
  }

  // Fetch from GitHub API
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  const data = await response.json();

  // Build response with logo
  const result = {
    pushedAt: data.pushed_at,
    openIssues: data.open_issues_count,
    stars: data.stargazers_count,
    updatedAt: new Date().toISOString(),
    logoUrl: data.owner?.avatar_url 
      ? `${data.owner.avatar_url}&s=128`
      : null,
    logoSource: data.owner?.avatar_url ? 'github' : null
  };

  // Cache for 6 hours
  await LOGO_CACHE.put(cacheKey, JSON.stringify(result), {
    expirationTtl: 21600
  });

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=21600',
      'X-Cache': 'MISS'
    }
  });
}
```

### 2.2 Logo Resolver Utility

**File:** `/src/utils/logoResolver.js`

```javascript
/**
 * Logo resolution utility for MCP servers
 * Phase 1: GitHub organization avatars
 */

const CACHE_TTL = 86400; // 24 hours in seconds

/**
 * Resolve logo URL for a server
 * @param {Object} server - Server object with github_url
 * @returns {Promise<Object>} Logo data {url, source, cachedAt}
 */
export async function resolveServerLogo(server) {
  const githubUrl = server.fields?.github_url;
  
  if (!githubUrl) {
    return { url: null, source: null, cachedAt: null };
  }

  // Parse GitHub URL
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    return { url: null, source: null, cachedAt: null };
  }

  const [, owner, repo] = match;

  try {
    // Fetch from GitHub stats worker (already cached)
    const response = await fetch(
      `/api/github-stats?owner=${owner}&repo=${repo}`
    );
    
    if (!response.ok) {
      throw new Error(`GitHub stats fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      url: data.logoUrl || null,
      source: data.logoSource || null,
      cachedAt: data.updatedAt || new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to resolve logo for ${owner}/${repo}:`, error);
    return { url: null, source: null, cachedAt: null };
  }
}

/**
 * Batch resolve logos for multiple servers
 * @param {Array} servers - Array of server objects
 * @returns {Promise<Map>} Map of server IDs to logo data
 */
export async function batchResolveLogos(servers) {
  const logoPromises = servers.map(async (server) => {
    const logo = await resolveServerLogo(server);
    return [server.id, logo];
  });

  const results = await Promise.all(logoPromises);
  return new Map(results);
}
```

### 2.3 Frontend Component Update

**File:** `/src/components/FeaturedMcpServers.astro`

**Current Code:**
```astro
const getServerIcon = (name: string) => name.charAt(0).toUpperCase();

<div class="server-icon">{getServerIcon(server.fields.name)}</div>
```

**Updated Code:**
```astro
---
const getServerIcon = (name: string) => name.charAt(0).toUpperCase();

const getServerLogo = (server: any) => {
  // Check if logoUrl exists in server data
  if (server.fields?.logoUrl || server.logoUrl) {
    return server.fields?.logoUrl || server.logoUrl;
  }
  return null;
};
---

<div class="icon-wrapper">
  {getServerLogo(server) ? (
    <img
      src={getServerLogo(server)}
      alt={`${server.fields.name} logo`}
      class="server-logo"
      loading="lazy"
      width="48"
      height="48"
      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
    />
  ) : null}
  <div
    class="gradient-icon"
    style={getServerLogo(server) ? 'display:none;' : ''}
  >
    {getServerIcon(server.fields?.name || server.name)}
  </div>
</div>
```

**CSS Updates:**
```css
.icon-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.server-logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: block;
}

.gradient-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

@media (prefers-color-scheme: dark) {
  .server-logo {
    border-color: rgba(255, 255, 255, 0.2);
  }
}
```

### 2.4 Data Integration

**File:** `/src/utils/pulsemcpApi.js`

**Update transformPulseMCPData():**
```javascript
export function transformPulseMCPData(pulsemcpServers) {
  return pulsemcpServers.map(server => ({
    id: server.id || generateId(server.fields?.name),
    fields: {
      name: server.fields?.name || 'Unnamed Server',
      description: server.fields?.description || '',
      author: server.fields?.author || 'Unknown',
      category: server.fields?.category || 'other',
      language: server.fields?.language || '',
      stars: server.fields?.stars || 0,
      github_url: server.fields?.github_url || '',
      npm_package: server.fields?.npm_package || '',
      downloads: server.fields?.downloads || 0,
      updated: server.fields?.updated || '',
      logoUrl: server.fields?.logoUrl || null,        // NEW
      logoSource: server.fields?.logoSource || null,  // NEW
      logoCachedAt: server.fields?.logoCachedAt || null // NEW
    }
  }));
}
```

## 3. Correctness Properties

### 3.1 Logo Resolution Properties

**Property 1: Logo URL Validity**
```
For any server with a valid GitHub URL:
  - resolveServerLogo() returns either:
    a) A valid HTTPS URL starting with "https://avatars.githubusercontent.com"
    b) null (if GitHub avatar unavailable)
  - Never returns invalid or malformed URLs
```

**Property 2: Cache Consistency**
```
For the same server ID within 6 hours:
  - First call: Fetches from GitHub API
  - Subsequent calls: Return cached URL
  - Cached URL matches original fetch result
```

**Property 3: Fallback Reliability**
```
For any server without a logo URL:
  - Component renders gradient avatar
  - Gradient avatar displays first letter of server name
  - Gradient avatar is always visible (never blank)
```

**Property 4: Image Error Handling**
```
When an image fails to load:
  - onerror handler triggers
  - <img> element is hidden
  - Gradient fallback becomes visible
  - No broken image icon displayed
```

### 3.2 Performance Properties

**Property 5: Lazy Loading**
```
For images below the fold:
  - Images don't load until scrolled into view
  - Initial page load time not affected by below-fold images
  - LCP metric not impacted by logo loading
```

**Property 6: Cache Hit Rate**
```
For repeated page loads within 6 hours:
  - ≥90% of logo requests served from cache
  - Cache misses only occur on first load or after TTL expiry
  - Cache hit rate improves over time
```

### 3.3 Accessibility Properties

**Property 7: Alt Text Presence**
```
For every logo image:
  - alt attribute is present and non-empty
  - alt text follows format: "{Server Name} logo"
  - alt text is descriptive and meaningful
```

**Property 8: Fallback Accessibility**
```
For gradient fallback avatars:
  - aria-label attribute is present
  - aria-label describes the server
  - Fallback is keyboard accessible
```

## 4. Component Specifications

### 4.1 FeaturedMcpServers Component

**Input Props:**
```typescript
interface Props {
  servers: MCPServer[];
}

interface MCPServer {
  id: string;
  fields: {
    name: string;
    description: string;
    logoUrl?: string;
    logoSource?: string;
    // ... other fields
  };
}
```

**Output:**
- Renders 6 featured server cards
- Each card displays logo or gradient fallback
- Cards are responsive (3 columns on desktop, 1 on mobile)

**Behavior:**
- If `logoUrl` exists: render `<img>` with lazy loading
- If `logoUrl` is null: render gradient avatar
- On image error: hide `<img>`, show gradient fallback

### 4.2 Logo Resolver Utility

**Function:** `resolveServerLogo(server)`

**Input:**
```typescript
{
  fields: {
    github_url: "https://github.com/owner/repo"
  }
}
```

**Output:**
```typescript
{
  url: "https://avatars.githubusercontent.com/u/12345?v=4&s=128" | null,
  source: "github" | null,
  cachedAt: "2026-01-21T10:00:00Z"
}
```

**Error Handling:**
- Returns `{ url: null, source: null, cachedAt: null }` on any error
- Logs errors to console for debugging
- Never throws exceptions

## 5. Testing Strategy

### 5.1 Unit Tests

**Test File:** `/tests/utils/logoResolver.test.js`

```javascript
describe('resolveServerLogo', () => {
  it('should resolve GitHub avatar for valid repo', async () => {
    const server = {
      fields: {
        github_url: 'https://github.com/modelcontextprotocol/servers'
      }
    };
    const result = await resolveServerLogo(server);
    expect(result.url).toContain('avatars.githubusercontent.com');
    expect(result.source).toBe('github');
  });

  it('should return null for missing GitHub URL', async () => {
    const server = { fields: {} };
    const result = await resolveServerLogo(server);
    expect(result.url).toBeNull();
    expect(result.source).toBeNull();
  });

  it('should cache results', async () => {
    // First call
    const result1 = await resolveServerLogo(server);
    // Second call (should be cached)
    const result2 = await resolveServerLogo(server);
    expect(result1).toEqual(result2);
  });
});
```

### 5.2 Integration Tests

**Test File:** `/tests/integration/logo-display.test.js`

```javascript
describe('Logo Display', () => {
  it('should display logo when logoUrl provided', async () => {
    const servers = [{
      id: 'srv-1',
      fields: {
        name: 'Test Server',
        logoUrl: 'https://example.com/logo.png'
      }
    }];
    const { container } = await render(FeaturedMcpServers, {
      props: { servers }
    });
    const img = container.querySelector('img.server-logo');
    expect(img).toBeDefined();
    expect(img.src).toBe('https://example.com/logo.png');
  });

  it('should display gradient fallback when no logoUrl', async () => {
    const servers = [{
      id: 'srv-2',
      fields: { name: 'Test Server' }
    }];
    const { container } = await render(FeaturedMcpServers, {
      props: { servers }
    });
    const fallback = container.querySelector('.gradient-icon');
    expect(fallback).toBeDefined();
    expect(fallback.textContent).toBe('T');
  });
});
```

### 5.3 Performance Tests

**Metrics to Measure:**
- LCP before/after implementation
- Total page size increase
- Number of network requests
- Cache hit rate

**Acceptance Criteria:**
- LCP increase ≤ 200ms
- Page size increase ≤ 100KB
- Network requests increase ≤ 10
- Cache hit rate ≥ 90%

## 6. Deployment Strategy

### 6.1 Phased Rollout

**Phase 1: Staging (Day 1)**
- Deploy to staging environment
- Run full test suite
- Manual QA with 10 servers
- Performance testing with Lighthouse

**Phase 2: Canary (Day 2)**
- Deploy to production with feature flag
- Enable for 10% of traffic
- Monitor metrics for 24 hours
- Check error rates and performance

**Phase 3: Full Rollout (Day 3)**
- Enable for 100% of traffic
- Monitor metrics for 48 hours
- Prepare rollback plan if needed

### 6.2 Rollback Procedure

If critical issues occur:
```bash
# 1. Revert worker changes
git revert <worker-commit>
wrangler publish

# 2. Revert frontend changes
git revert <frontend-commit>
npm run build
vercel deploy --prod

# 3. Clear KV cache
wrangler kv:key delete --namespace-id=<ID> "logo:*"
```

## 7. Monitoring & Observability

### 7.1 Key Metrics

**Coverage:**
- `logo_display_rate` - % of servers with actual logos (target: ≥95%)
- `fallback_rate` - % using gradient fallback (target: ≤5%)

**Performance:**
- `logo_fetch_time_p50` - Median fetch time (target: <200ms)
- `logo_fetch_time_p95` - 95th percentile (target: <500ms)
- `cache_hit_rate` - % served from cache (target: ≥90%)

**Reliability:**
- `image_error_rate` - % of images failing to load (target: <2%)
- `github_api_error_rate` - GitHub API failures (target: <1%)

### 7.2 Logging

```javascript
// Successful resolution
console.info(`Logo resolved for ${serverId}: ${source} - ${url}`);

// Fallback used
console.warn(`No logo found for ${serverId}, using fallback`);

// API error
console.error(`Failed to fetch logo for ${serverId}:`, error);
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-21  
**Status:** Ready for Implementation
