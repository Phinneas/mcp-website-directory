# Logo System Monitoring & Validation Guide

## Overview

This guide provides instructions for monitoring the MCP Logo System in production, including key metrics, alert thresholds, troubleshooting steps, and rollback procedures.

## Key Metrics

### Coverage Metrics

#### Logo Display Rate
**Target**: ≥95% of servers show actual logos

```
Calculation: (servers_with_logos / total_servers) * 100
```

**How to Monitor**:
- Track in analytics dashboard
- Alert if drops below 90%
- Investigate if multiple servers lose logos

**Causes of Low Rate**:
- GitHub API downtime
- Invalid GitHub URLs
- Cache expiration without refresh
- Network connectivity issues

#### Fallback Rate
**Target**: ≤5% of servers use gradient fallback

```
Calculation: (servers_without_logos / total_servers) * 100
```

**How to Monitor**:
- Track in analytics dashboard
- Alert if exceeds 10%
- Investigate if rate increases suddenly

**Causes of High Rate**:
- GitHub API errors
- Missing GitHub URLs
- Logo resolution failures
- Cache issues

### Performance Metrics

#### Logo Fetch Time (p50)
**Target**: <200ms

```
Measurement: Median time to fetch logo from GitHub API
```

**How to Monitor**:
- Track in performance dashboard
- Alert if exceeds 300ms
- Investigate if consistently slow

**Optimization**:
- Verify cache hit rate
- Check GitHub API performance
- Monitor network latency

#### Logo Fetch Time (p95)
**Target**: <500ms

```
Measurement: 95th percentile time to fetch logo
```

**How to Monitor**:
- Track in performance dashboard
- Alert if exceeds 750ms
- Investigate outliers

**Optimization**:
- Increase cache TTL if appropriate
- Optimize GitHub API calls
- Consider CDN for image delivery

#### Cache Hit Rate
**Target**: ≥90%

```
Calculation: (cache_hits / total_requests) * 100
```

**How to Monitor**:
- Check `X-Cache` header in responses
- Track in analytics dashboard
- Alert if drops below 80%

**Optimization**:
- Verify cache is configured correctly
- Check cache expiration settings
- Monitor cache size

#### Image Error Rate
**Target**: <2%

```
Calculation: (failed_image_loads / total_images) * 100
```

**How to Monitor**:
- Track in browser error logs
- Monitor image load failures
- Alert if exceeds 5%

**Causes**:
- Broken image URLs
- CORS issues
- Network errors
- GitHub API changes

### Reliability Metrics

#### GitHub API Error Rate
**Target**: <1%

```
Calculation: (api_errors / total_api_calls) * 100
```

**How to Monitor**:
- Track in worker logs
- Alert if exceeds 2%
- Investigate error patterns

**Common Errors**:
- 404: Repository not found
- 403: Rate limit exceeded
- 500: GitHub API error
- Network timeout

#### Page LCP Impact
**Target**: ≤200ms increase

```
Measurement: LCP with logos - LCP without logos
```

**How to Monitor**:
- Use Lighthouse CI
- Monitor in analytics
- Alert if exceeds 300ms

**Optimization**:
- Verify lazy loading is working
- Check image sizes
- Monitor network requests

## Monitoring Setup

### Dashboard Configuration

Create a monitoring dashboard with the following panels:

1. **Coverage Panel**
   - Logo display rate (gauge)
   - Fallback rate (gauge)
   - Servers with logos (counter)

2. **Performance Panel**
   - Logo fetch time p50 (line chart)
   - Logo fetch time p95 (line chart)
   - Cache hit rate (line chart)

3. **Reliability Panel**
   - GitHub API error rate (line chart)
   - Image error rate (line chart)
   - Page LCP impact (line chart)

4. **Alerts Panel**
   - Active alerts (list)
   - Alert history (timeline)
   - Alert severity (color coded)

### Alert Configuration

#### Critical Alerts (Page Down)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Logo display rate | <80% | Page down, investigate immediately |
| Cache hit rate | <50% | Page down, check cache configuration |
| GitHub API error rate | >10% | Page down, check GitHub status |

#### Warning Alerts (Investigate)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Logo display rate | <90% | Investigate within 1 hour |
| Logo fetch time p95 | >750ms | Investigate performance |
| Image error rate | >5% | Investigate image issues |

#### Info Alerts (Monitor)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Logo fetch time p50 | >300ms | Monitor trend |
| Cache hit rate | <85% | Monitor cache performance |
| Fallback rate | >10% | Monitor fallback usage |

### Logging Configuration

#### Worker Logs

```javascript
// Successful resolution
console.info(`Logo resolved for ${serverId}: ${source} - ${url}`);

// Fallback used
console.warn(`No logo found for ${serverId}, using fallback`);

// API error
console.error(`Failed to fetch logo for ${serverId}:`, error);
```

#### Browser Logs

```javascript
// Image load success
console.debug(`Logo loaded: ${url}`);

// Image load error
console.warn(`Logo failed to load: ${url}`);

// Fallback displayed
console.info(`Using fallback for ${serverId}`);
```

## Validation Checklist

### Pre-Deployment Validation

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No console errors in staging
- [ ] Logos display correctly on all devices
- [ ] Fallback works as expected
- [ ] Performance metrics acceptable
- [ ] Accessibility requirements met
- [ ] Documentation complete

### Post-Deployment Validation

- [ ] Logo display rate ≥95%
- [ ] Fallback rate ≤5%
- [ ] Cache hit rate ≥90%
- [ ] Image error rate <2%
- [ ] LCP increase ≤200ms
- [ ] GitHub API error rate <1%
- [ ] No critical errors in logs
- [ ] User feedback positive

## Troubleshooting

### Logos Not Displaying

**Symptoms**:
- All servers show gradient fallback
- Logo display rate <50%

**Investigation Steps**:
1. Check GitHub API status
2. Verify cache is working
3. Check worker logs for errors
4. Verify GitHub URLs are valid
5. Check network connectivity

**Resolution**:
```bash
# Clear cache
wrangler kv:key delete --namespace-id=<ID> "repo:*"

# Restart worker
wrangler publish

# Monitor metrics
# Wait for cache to repopulate
```

### Slow Logo Loading

**Symptoms**:
- Logo fetch time p95 >750ms
- Cache hit rate <80%

**Investigation Steps**:
1. Check GitHub API response times
2. Verify cache hit rate
3. Check network latency
4. Monitor worker CPU usage
5. Check for rate limiting

**Resolution**:
```bash
# Increase cache TTL
# Update worker: expirationTtl: 43200 (12 hours)

# Verify cache is working
# Check X-Cache headers in responses

# Monitor GitHub API
# Check for rate limiting
```

### Broken Images

**Symptoms**:
- Image error rate >5%
- Broken image icons displayed

**Investigation Steps**:
1. Check image URLs in browser
2. Verify CORS headers
3. Check image format
4. Verify GitHub API response
5. Check network errors

**Resolution**:
```bash
# Verify image URLs
curl -I "https://avatars.githubusercontent.com/..."

# Check CORS headers
curl -i "https://avatars.githubusercontent.com/..."

# Clear cache and retry
wrangler kv:key delete --namespace-id=<ID> "repo:*"
```

### High Error Rate

**Symptoms**:
- GitHub API error rate >5%
- Multiple servers failing

**Investigation Steps**:
1. Check GitHub API status page
2. Verify authentication token
3. Check rate limiting
4. Review error logs
5. Check network connectivity

**Resolution**:
```bash
# Check GitHub status
# https://www.githubstatus.com/

# Verify token is valid
# Check GITHUB_TOKEN environment variable

# Wait for rate limit reset
# Monitor error rate

# If persistent, escalate to GitHub support
```

## Rollback Procedure

### Quick Rollback (5 minutes)

If critical issues occur:

```bash
# 1. Disable feature flag (if implemented)
# Set LOGO_SYSTEM_ENABLED=false

# 2. Revert worker changes
git revert <worker-commit>
wrangler publish

# 3. Revert frontend changes
git revert <frontend-commit>
npm run build
vercel deploy --prod

# 4. Monitor metrics
# Verify logo display rate returns to 0%
# Verify no errors in logs
```

### Full Rollback (15 minutes)

If partial rollback insufficient:

```bash
# 1. Revert all changes
git revert <all-commits>

# 2. Clear cache
wrangler kv:key delete --namespace-id=<ID> "repo:*"

# 3. Redeploy
wrangler publish
npm run build
vercel deploy --prod

# 4. Verify
# Check metrics
# Check logs
# Test manually
```

### Rollback Verification

After rollback, verify:

- [ ] Logo display rate = 0% (all fallbacks)
- [ ] No errors in worker logs
- [ ] No errors in browser console
- [ ] Page loads normally
- [ ] Performance metrics normal
- [ ] Users can browse servers

## Success Criteria

### Phase 1 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Logo display rate | ≥95% | ✓ |
| Fallback rate | ≤5% | ✓ |
| Cache hit rate | ≥90% | ✓ |
| Image error rate | <2% | ✓ |
| LCP increase | ≤200ms | ✓ |
| GitHub API error rate | <1% | ✓ |
| Uptime | ≥99.9% | ✓ |
| User satisfaction | Positive feedback | ✓ |

### Deployment Checklist

- [ ] All metrics meet targets
- [ ] No critical errors
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Documentation complete
- [ ] Team trained
- [ ] Monitoring configured
- [ ] Rollback plan ready

## Maintenance

### Regular Tasks

**Daily**:
- Monitor dashboard for alerts
- Check error logs
- Verify metrics are normal

**Weekly**:
- Review performance trends
- Check cache effectiveness
- Analyze error patterns

**Monthly**:
- Review success metrics
- Plan optimizations
- Update documentation

### Optimization Opportunities

1. **Increase Cache TTL**: From 6 to 12 hours
2. **Add CDN**: For image delivery
3. **Batch Requests**: Reduce API calls
4. **Preload Logos**: For featured servers
5. **Optimize Images**: Reduce file size

## References

- [Monitoring Best Practices](https://cloud.google.com/architecture/best-practices-for-monitoring)
- [Alert Design](https://www.atlassian.com/incident-management/on-call/alerting-best-practices)
- [Performance Monitoring](https://web.dev/performance-monitoring/)
- [Error Tracking](https://sentry.io/for/error-tracking/)
