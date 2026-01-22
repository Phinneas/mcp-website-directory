# Logo System API Documentation

## GitHub Stats Endpoint

### Overview

The GitHub Stats endpoint provides repository statistics and logo information for MCP servers.

**Endpoint**: `/api/github-stats`  
**Method**: `GET`  
**Cache**: 6 hours (Cloudflare KV)

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | string | Yes | Repository in format `owner/repo` |

### Request Examples

```bash
# Fetch stats for a repository
curl "https://api.example.com/api/github-stats?repo=modelcontextprotocol/servers"

# With authentication (if GITHUB_TOKEN is set)
curl -H "Authorization: token YOUR_TOKEN" \
  "https://api.example.com/api/github-stats?repo=modelcontextprotocol/servers"
```

### Response Format

#### Success Response (200 OK)

```json
{
  "pushedAt": "2026-01-15T10:30:00Z",
  "openIssues": 12,
  "stars": 1234,
  "updatedAt": "2026-01-21T08:00:00Z",
  "logoUrl": "https://avatars.githubusercontent.com/u/12345?v=4&s=128",
  "logoSource": "github"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `pushedAt` | string (ISO 8601) | Timestamp of last commit |
| `openIssues` | number | Count of open issues |
| `stars` | number | GitHub star count |
| `updatedAt` | string (ISO 8601) | Timestamp of last API call |
| `logoUrl` | string \| null | URL to organization avatar (128px) |
| `logoSource` | string \| null | Source of logo (`"github"` or `null`) |

#### Error Response (400 Bad Request)

```json
{
  "error": "Missing repo parameter"
}
```

#### Error Response (404 Not Found)

```json
{
  "error": "GitHub API error",
  "status": 404
}
```

#### Error Response (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "message": "Error details here"
}
```

### Response Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Response format |
| `Access-Control-Allow-Origin` | `*` | CORS header |
| `Cache-Control` | `public, max-age=21600` | Browser cache (6 hours) |
| `X-Cache` | `HIT` \| `MISS` | Cache status |

### Rate Limiting

**Unauthenticated**: 60 requests/hour (GitHub API limit)  
**Authenticated**: 5000 requests/hour (with `GITHUB_TOKEN`)

### Caching Behavior

1. **Cache Hit**: Returns cached response with `X-Cache: HIT` header
2. **Cache Miss**: Fetches from GitHub API, stores in KV, returns with `X-Cache: MISS` header
3. **Cache Expiry**: 6 hours (21600 seconds)
4. **Cache Key**: `repo:{owner}/{repo}`

### Examples

#### JavaScript/Node.js

```javascript
// Fetch logo for a server
async function getServerLogo(owner, repo) {
  const response = await fetch(
    `/api/github-stats?repo=${owner}/${repo}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  
  const data = await response.json();
  return data.logoUrl; // Returns URL or null
}

// Usage
const logoUrl = await getServerLogo('modelcontextprotocol', 'servers');
console.log(logoUrl); // https://avatars.githubusercontent.com/...
```

#### Python

```python
import requests

def get_server_logo(owner, repo):
    response = requests.get(
        f'/api/github-stats?repo={owner}/{repo}'
    )
    response.raise_for_status()
    data = response.json()
    return data.get('logoUrl')

# Usage
logo_url = get_server_logo('modelcontextprotocol', 'servers')
print(logo_url)  # https://avatars.githubusercontent.com/...
```

#### cURL

```bash
# Basic request
curl "https://api.example.com/api/github-stats?repo=modelcontextprotocol/servers"

# With pretty printing
curl "https://api.example.com/api/github-stats?repo=modelcontextprotocol/servers" | jq

# Check cache status
curl -i "https://api.example.com/api/github-stats?repo=modelcontextprotocol/servers" | grep X-Cache
```

## Logo Resolver Utility

### resolveServerLogo(server)

Resolves logo URL for a single server.

**Parameters**:
```typescript
server: {
  id?: string;
  fields?: {
    github_url?: string;
    [key: string]: any;
  };
}
```

**Returns**:
```typescript
Promise<{
  url: string | null;
  source: string | null;
  cachedAt: string;
}>
```

**Example**:
```javascript
import { resolveServerLogo } from '@/utils/logoResolver.js';

const server = {
  id: 'my-server',
  fields: {
    name: 'My Server',
    github_url: 'https://github.com/owner/repo'
  }
};

const logo = await resolveServerLogo(server);
// {
//   url: 'https://avatars.githubusercontent.com/u/12345?v=4&s=128',
//   source: 'github',
//   cachedAt: '2026-01-21T10:00:00Z'
// }
```

### batchResolveLogos(servers)

Resolves logos for multiple servers in parallel.

**Parameters**:
```typescript
servers: Array<{
  id: string;
  fields?: {
    github_url?: string;
    [key: string]: any;
  };
}>
```

**Returns**:
```typescript
Promise<Map<string, {
  url: string | null;
  source: string | null;
  cachedAt: string;
}>>
```

**Example**:
```javascript
import { batchResolveLogos } from '@/utils/logoResolver.js';

const servers = [
  { id: 'srv-1', fields: { github_url: 'https://github.com/owner1/repo1' } },
  { id: 'srv-2', fields: { github_url: 'https://github.com/owner2/repo2' } }
];

const logos = await batchResolveLogos(servers);
// Map {
//   'srv-1' => { url: 'https://avatars.githubusercontent.com/...', source: 'github', ... },
//   'srv-2' => { url: 'https://avatars.githubusercontent.com/...', source: 'github', ... }
// }

// Access individual logos
const srv1Logo = logos.get('srv-1');
console.log(srv1Logo.url);
```

## Error Handling

### Common Errors

#### Missing Repository Parameter

```
Request: GET /api/github-stats
Response: 400 Bad Request
{
  "error": "Missing repo parameter"
}
```

**Solution**: Include `repo` parameter in query string.

#### Repository Not Found

```
Request: GET /api/github-stats?repo=invalid/repo
Response: 404 Not Found
{
  "error": "GitHub API error",
  "status": 404
}
```

**Solution**: Verify repository exists and is accessible.

#### Rate Limit Exceeded

```
Request: GET /api/github-stats?repo=owner/repo
Response: 403 Forbidden
{
  "error": "GitHub API error",
  "status": 403
}
```

**Solution**: 
- Wait for rate limit to reset (1 hour)
- Set `GITHUB_TOKEN` environment variable for higher limits

#### Network Error

```javascript
try {
  const logo = await resolveServerLogo(server);
} catch (error) {
  console.error('Network error:', error.message);
  // Returns { url: null, source: null, cachedAt: null }
}
```

**Solution**: Check network connectivity and retry.

## Performance Considerations

### Caching Strategy

1. **First Request**: Fetches from GitHub API (~200-500ms)
2. **Subsequent Requests**: Served from cache (<10ms)
3. **Cache Expiry**: 6 hours

### Batch Processing

Batch resolution uses `Promise.all()` for parallel processing:

```javascript
// Resolves all logos in parallel
const logos = await batchResolveLogos(servers);
// Time: ~max(individual times), not sum
```

### Lazy Loading

Component uses `loading="lazy"` attribute:

```html
<img src="..." loading="lazy" />
```

Images load only when scrolled into view, reducing initial page load time.

## Monitoring

### Metrics to Track

- **Cache Hit Rate**: % of requests served from cache
- **Logo Fetch Time**: p50 and p95 latency
- **Error Rate**: % of failed requests
- **Image Load Success**: % of images loading successfully

### Logging

Errors are logged to console:

```javascript
console.error(`Failed to resolve logo for ${owner}/${repo}:`, error.message);
console.warn(`No logo found for ${serverId}, using fallback`);
```

## Troubleshooting

### Logos Not Loading

1. Check browser console for errors
2. Verify GitHub URL format: `https://github.com/owner/repo`
3. Check network tab for failed requests
4. Verify GitHub API is accessible

### Slow Performance

1. Check cache hit rate in response headers
2. Monitor GitHub API response times
3. Verify network connectivity
4. Check for rate limiting

### Broken Images

1. Verify image URL is valid
2. Check CORS headers
3. Verify image format is supported
4. Check fallback gradient displays

## References

- [GitHub REST API](https://docs.github.com/en/rest)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
