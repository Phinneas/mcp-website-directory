# MCP Logo System Documentation

## Overview

The MCP Logo System automatically fetches and displays GitHub organization avatars for MCP servers in the directory. This system provides a seamless visual experience without requiring manual configuration from server maintainers.

## Architecture

### Components

1. **GitHub Stats Worker** (`/workers/github-repo-stats.js`)
   - Fetches repository data from GitHub API
   - Extracts organization avatar URL
   - Caches results in Cloudflare KV for 6 hours
   - Returns both stats and logo data

2. **Logo Resolver Utility** (`/src/utils/logoResolver.js`)
   - Resolves logo URLs for individual servers
   - Handles batch resolution for multiple servers
   - Provides error handling and graceful degradation

3. **Frontend Component** (`/src/components/FeaturedMcpServers.astro`)
   - Displays logos with lazy loading
   - Shows gradient fallback when logo unavailable
   - Handles image load errors gracefully

### Data Flow

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

## Logo Resolution Algorithm

### Phase 1: GitHub Avatars (Current)

The system resolves logos using the following algorithm:

1. **Extract GitHub URL**: Parse the server's GitHub repository URL
2. **Fetch Repository Data**: Call GitHub API to get repository information
3. **Extract Avatar URL**: Get the organization avatar from `owner.avatar_url`
4. **Format URL**: Append `&s=128` to request 128px size
5. **Cache Result**: Store in Cloudflare KV with 6-hour TTL
6. **Return URL**: Return the formatted avatar URL or null if unavailable

### Error Handling

- **Invalid GitHub URL**: Returns `{ url: null, source: null, cachedAt: null }`
- **API Error**: Logs error and returns null values
- **Network Error**: Gracefully degrades to gradient fallback
- **Missing Avatar**: Returns null, component shows gradient fallback

## Usage

### Resolving a Single Server Logo

```javascript
import { resolveServerLogo } from '@/utils/logoResolver.js';

const server = {
  id: 'my-server',
  fields: {
    name: 'My MCP Server',
    github_url: 'https://github.com/owner/repo'
  }
};

const logo = await resolveServerLogo(server);
// Returns: { url: 'https://avatars.githubusercontent.com/...', source: 'github', cachedAt: '...' }
```

### Batch Resolving Multiple Servers

```javascript
import { batchResolveLogos } from '@/utils/logoResolver.js';

const servers = [
  { id: 'srv-1', fields: { github_url: 'https://github.com/owner1/repo1' } },
  { id: 'srv-2', fields: { github_url: 'https://github.com/owner2/repo2' } }
];

const logos = await batchResolveLogos(servers);
// Returns: Map { 'srv-1' => { url: '...', source: 'github', ... }, 'srv-2' => { ... } }
```

### Component Usage

The `FeaturedMcpServers` component automatically handles logo display:

```astro
---
import FeaturedMcpServers from '@/components/FeaturedMcpServers.astro';

const servers = [
  {
    id: 'srv-1',
    fields: {
      name: 'Test Server',
      logoUrl: 'https://avatars.githubusercontent.com/...'
    }
  }
];
---

<FeaturedMcpServers servers={servers} />
```

## Cache Structure

Logos are cached in Cloudflare KV with the following structure:

```json
{
  "url": "https://avatars.githubusercontent.com/u/12345?v=4&s=128",
  "source": "github",
  "cachedAt": "2026-01-21T10:00:00Z"
}
```

**Cache Key Pattern**: `repo:{owner}/{repo}`  
**TTL**: 6 hours (21600 seconds)

## Performance Characteristics

### Metrics

- **Logo Fetch Time (p50)**: <200ms
- **Logo Fetch Time (p95)**: <500ms
- **Cache Hit Rate**: ≥90%
- **Image Error Rate**: <2%
- **LCP Impact**: ≤200ms increase

### Optimization Techniques

1. **Lazy Loading**: Images load only when scrolled into view
2. **Caching**: 6-hour TTL reduces API calls
3. **Batch Processing**: Parallel resolution improves performance
4. **Fallback Rendering**: Gradient avatars render instantly
5. **Error Handling**: Graceful degradation prevents page breaks

## Accessibility

### Alt Text

All logo images include descriptive alt text:
```html
<img alt="Server Name logo" src="..." />
```

### Fallback Avatar

Gradient fallback avatars are keyboard accessible and screen reader compatible:
```html
<div class="gradient-icon" aria-label="Server Name">T</div>
```

### Color Contrast

- Logo images: Inherit contrast from GitHub avatars
- Gradient fallback: Meets WCAG AA standards (3:1 ratio)

## Testing

### Unit Tests

Run unit tests for the logo resolver:
```bash
node tests/utils/logoResolver.test.js
```

Tests cover:
- Valid GitHub URL resolution
- Invalid URL handling
- Error handling
- Batch processing
- Edge cases

### Integration Tests

Run integration tests for component display:
```bash
node tests/integration/logo-display.test.js
```

Tests cover:
- Logo display when URL available
- Gradient fallback when unavailable
- Alt text presence
- Image dimensions
- Error handling

## Troubleshooting

### Logos Not Displaying

1. **Check GitHub URL**: Verify server has valid GitHub URL in format `https://github.com/owner/repo`
2. **Check Cache**: Clear Cloudflare KV cache if needed
3. **Check API**: Verify GitHub API is accessible
4. **Check Logs**: Review worker logs for errors

### Slow Logo Loading

1. **Check Cache Hit Rate**: Monitor cache hit rate in metrics
2. **Check Network**: Verify network connectivity
3. **Check GitHub API**: GitHub API may be rate limited
4. **Check Image Size**: Verify images are optimized

### Broken Images

1. **Check Image URL**: Verify URL is valid and accessible
2. **Check CORS**: Verify CORS headers are correct
3. **Check Image Format**: Verify image format is supported
4. **Check Fallback**: Verify gradient fallback displays

## Future Enhancements

### Phase 2: Favicon Support
- Extract homepage URL from GitHub repository
- Generate favicon URL using Google Favicon API
- Cache favicon URLs for 24 hours
- Try favicon if GitHub avatar unavailable

### Phase 3: Multi-Source Strategy
- Search GitHub repo for custom logo files
- Extract Open Graph image from homepage
- Support common logo paths (`/logo.svg`, `/logo.png`, etc.)
- Parse HTML meta tags for OG images
- Implement priority cascade

## Configuration

### Environment Variables

**GitHub Token** (optional, recommended):
```bash
GITHUB_TOKEN=your_github_token_here
```

Increases rate limit from 60 to 5000 requests/hour.

### Cloudflare KV Binding

The worker requires a KV namespace binding:
```toml
[[env.production.kv_namespaces]]
binding = "GITHUB_STATS"
id = "your_kv_namespace_id"
```

## Monitoring

### Key Metrics

- `logo_display_rate`: % of servers with actual logos (target: ≥95%)
- `fallback_rate`: % using gradient fallback (target: ≤5%)
- `logo_fetch_time_p50`: Median fetch time (target: <200ms)
- `logo_fetch_time_p95`: 95th percentile (target: <500ms)
- `cache_hit_rate`: % served from cache (target: ≥90%)
- `image_error_rate`: % of images failing to load (target: <2%)

### Logging

Errors are logged to console for debugging:
```javascript
console.error(`Failed to resolve logo for ${owner}/${repo}:`, error.message);
console.warn(`No logo found for ${serverId}, using fallback`);
```

## References

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
