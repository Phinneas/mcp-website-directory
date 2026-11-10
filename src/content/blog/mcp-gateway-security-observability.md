---
title: "MCP Gateway Security and Observability: Audit Logs, Rate Limiting, and Monitoring"
description: "Implement security monitoring and observability for MCP gateways: audit log export to SIEM, token bucket rate limiting, Prometheus metrics, health checks, and alerting for production gateway operations."
author: "Chester Beard"
date: "2026-11-10T00:00:00.000Z"
tags: ["mcp gateway monitoring", "mcp audit logging", "mcp rate limiting", "mcp observability", "gateway metrics"]
---

> **Part of the [MCP Gateway Guide](/mcp-gateway-guide) content cluster** — this article covers security monitoring and observability for production MCP gateways.

An MCP gateway is a privileged position in your infrastructure — every tool call, resource read, and prompt flows through it. That makes it the best place to enforce rate limits, log every invocation, and monitor the health of your entire MCP ecosystem. But without the right observability plumbing, a gateway is just a black box that silently drops traffic.

Spoke 1 covered the authentication and allowlisting layer that gates *who* can call *which* tool. This article covers the operational layer that monitors *what happened*, *how fast*, and *whether it is working*: audit logging, SIEM integration, rate limiting, metrics, health checks, and alerting.

## Audit Logging

Every tool invocation that flows through the gateway should leave a record. Audit logs answer the three questions that every incident post-mortem starts with: who called it, what did they call, and what happened?

### Log format

A minimum viable audit log entry for a gateway tool invocation looks like this:

```json
{
  "timestamp": "2026-11-10T14:30:00.123Z",
  "caller": {
    "user_id": "user_abc123",
    "session_id": "sess_def456",
    "ip": "203.0.113.42",
    "auth_method": "sso_okta"
  },
  "request": {
    "tool": "filesystem-mcp-server/read_file",
    "arguments": { "path": "/data/reports/quarterly.pdf" },
    "protocol": "tools/call",
    "request_id": "req_789ghi"
  },
  "response": {
    "status": "success",
    "duration_ms": 342,
    "content_length": 15420,
    "error": null
  },
  "upstream": {
    "server_id": "filesystem-mcp-server",
    "transport": "stdio"
  }
}
```

Each field serves a purpose in incident response or capacity planning:

- `caller.user_id` and `caller.session_id` let you trace every action back to an authenticated identity, even if the AI client reconnects with a new session.
- `request.tool` uses the same namespaced format (`server_id/tool_name`) that the gateway exposes to clients, making it trivially joinable with allowlist configuration.
- `response.duration_ms` is the total round-trip time from the gateway's perspective, including upstream server processing time. A sudden increase across all tools points to a network or upstream infrastructure issue; an increase on a single tool points to that server.
- `upstream.server_id` and `upstream.transport` record which physical server handled the call, which matters when you have multiple replicas of the same server type.

### Log batching and export

Writing one log entry per tool call to disk creates I/O pressure under load. Batch writes in the gateway's proxy layer:

```python
import asyncio
import json
from collections import deque

class AuditLogger:
    """Buffered audit log writer with periodic flush."""
    def __init__(self, batch_size: int = 100, flush_interval: int = 5):
        self.buffer: deque = deque(maxlen=10000)
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self._running = False

    async def log(self, entry: dict) -> None:
        self.buffer.append(entry)
        if len(self.buffer) >= self.batch_size:
            await self._flush()

    async def start_background_flush(self) -> None:
        self._running = True
        while self._running:
            await asyncio.sleep(self.flush_interval)
            if self.buffer:
                await self._flush()

    async def _flush(self) -> None:
        batch = list(self.buffer)
        self.buffer.clear()
        # Write to stdout (for container log collectors) or to a file
        for entry in batch:
            print(json.dumps(entry), flush=True)

    def stop(self) -> None:
        self._running = False
```

The logger writes each entry as a JSON line to stdout. Container runtimes (Docker, Kubernetes) capture stdout and route it to their log aggregation layer (Fluentd, Logstash, CloudWatch). This avoids managing log files, log rotation, and disk space inside the gateway container.

### Log retention and privacy

Audit logs contain sensitive data — file paths, database queries, and user identifiers. Apply retention policies that match your compliance requirements:

- **Short-term storage (30 days)** — Full detail logs in hot storage (Elasticsearch hot tier, Splunk indexed). Supports incident investigation and rate limit tuning.
- **Medium-term storage (1 year)** — Aggregated metrics retained; individual tool call details may be truncated or anonymized. Supports capacity planning and usage trend analysis.
- **Long-term storage (7 years)** — Retention required by SOC 2, HIPAA, or other regulations. Store only metadata (user_id, count of invocations, error rate) rather than raw request arguments. Archive as compressed JSON in object storage (S3, R2) rather than in the SIEM index.

For fields that contain customer data (file paths, SQL queries in tool arguments), consider a hashing or redaction step before the log entry reaches long-term storage. The gateway can write two log streams: a full-detail stream to short-term storage and a redacted stream to long-term storage.

## SIEM Integration

Audit logs are only useful if they reach your security information and event management (SIEM) system within minutes, not hours. The integration path depends on how your SIEM ingests data.

### ELK Stack (Elasticsearch, Logstash, Kibana)

With JSON-line stdout, Logstash parses each line natively:

```ruby
# logstash.conf for MCP gateway audit logs
input {
  beats {
    port => 5044
  }
}

filter {
  json {
    source => "message"
  }
  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }
}

output {
  elasticsearch {
    hosts => ["https://elasticsearch:9200"]
    index => "mcp-gateway-audit-%{+YYYY.MM.dd}"
  }
}
```

Filebeat or Metricbeat on the gateway host ships the container's stdout to Logstash. The JSON structure maps directly to Elasticsearch fields, so every field in the audit log is searchable without field extraction configuration.

Key Elasticsearch queries you will run repeatedly:

- **User activity report**: `caller.user_id: "user_abc123"` grouped by `request.tool` over a time range — reveals which tools each user relies on and which they have stopped using.
- **Error correlation**: `response.status: "error"` grouped by `upstream.server_id` — shows which upstream servers fail most frequently.
- **Latency anomaly**: `response.duration_ms: > 5000` filtered by normal baseline — catches slow upstream servers before they trigger timeouts.

### Splunk

Splunk ingests JSON via the HTTP Event Collector (HEC). Configure the gateway to send audit log batches directly to Splunk's HEC endpoint:

```python
import httpx

class SplunkAuditExporter:
    def __init__(self, hec_url: str, hec_token: str):
        self.client = httpx.AsyncClient()
        self.hec_url = hec_url
        self.hec_token = hec_token

    async def export_batch(self, entries: list[dict]) -> None:
        payload = {
            "host": "mcp-gateway",
            "sourcetype": "_json",
            "event": entries,
        }
        await self.client.post(
            self.hec_url,
            json=payload,
            headers={"Authorization": f"Splunk {self.hec_token}"},
        )
```

Splunk's field extraction automatically recognizes the JSON structure. Create a data model for MCP gateway events to build dashboards showing tool invocation rates, error rates by server, and top users by request count.

## Rate Limiting

A runaway agent loop can exhaust API quotas on upstream servers, trigger abuse detection, and spike cloud costs — all within minutes. Gateway-level rate limiting is the circuit breaker that stops this before it reaches the upstream.

### Token bucket algorithm

The token bucket algorithm is the most practical rate limiter for gateway workloads. It allows bursts up to a configured size while enforcing a steady-state rate:

```python
import time
from collections import defaultdict

class TokenBucket:
    """Per-user token bucket rate limiter."""
    def __init__(self, rate: float, burst: int):
        self.rate = rate          # tokens per second
        self.burst = burst        # max accumulated tokens
        self.tokens: dict[str, float] = defaultdict(lambda: burst)
        self.last_refill: dict[str, float] = defaultdict(time.monotonic)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        elapsed = now - self.last_refill[key]
        self.last_refill[key] = now

        # Refill tokens based on elapsed time
        self.tokens[key] = min(self.burst, self.tokens[key] + elapsed * self.rate)

        if self.tokens[key] >= 1.0:
            self.tokens[key] -= 1.0
            return True
        return False

# Per-user: 10 tool calls per second, burst of 20
rate_limiter = TokenBucket(rate=10, burst=20)

async def check_rate_limit(user_id: str) -> bool:
    if not rate_limiter.allow(user_id):
        log_rate_limit_breach(user_id)
        return False
    return True
```

The key insight is to rate-limit per user, not globally. One user's runaway loop should not block another user's legitimate tool calls. If an upstream server has a hard API rate limit (GitHub: 5,000 requests/hour), configure a stricter bucket for that server's tools specifically.

### Leaky bucket for upstream protection

The leaky bucket algorithm is more conservative — it processes requests at a fixed rate regardless of arrival pattern. Use it for upstream servers that cannot handle bursts:

```python
import asyncio

class LeakyBucket:
    """Fixed-rate processor queue for upstream protection."""
    def __init__(self, rate: float):
        self.interval = 1.0 / rate  # seconds between requests
        self.last_request: float = 0

    async def wait(self) -> None:
        now = time.monotonic()
        wait_time = self.interval - (now - self.last_request)
        if wait_time > 0:
            await asyncio.sleep(wait_time)
        self.last_request = time.monotonic()
```

Apply this per-upstream-server. A PostgreSQL server that can handle 100 queries per second gets a leaky bucket with `rate=100`. The GitHub API gets a separate bucket at its rate limit. This prevents one aggressive agent from degrading performance for all users of the same upstream.

### Rate limit headers

When the gateway rejects a tool call due to rate limiting, it should return informative headers so clients can back off:

```python
{
    "error": "rate_limit_exceeded",
    "retry_after_ms": 500,
    "rate_limit": {
        "limit": 10,
        "remaining": 0,
        "reset_at": "2026-11-10T14:30:05.000Z"
    }
}
```

Clients that respect rate limit headers can queue the request and retry instead of failing and requiring user intervention.

## Prometheus Metrics

A gateway exposes metrics in three categories: traffic, errors, and resources. Prometheus is the standard collector for all three.

### Core metrics to expose

```python
# Pseudo-code for Prometheus metric registration
from prometheus_client import Counter, Histogram, Gauge

# Traffic metrics
tool_calls_total = Counter(
    "mcp_gateway_tool_calls_total",
    "Total tool calls routed through the gateway",
    ["tool_name", "upstream_server", "status"],
)

# Latency metrics
tool_call_duration = Histogram(
    "mcp_gateway_tool_call_duration_seconds",
    "Tool call latency in seconds",
    ["tool_name", "upstream_server"],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# Resource metrics
active_connections = Gauge(
    "mcp_gateway_active_connections",
    "Number of active SSE client connections",
)

upstream_server_up = Gauge(
    "mcp_gateway_upstream_server_up",
    "Whether each upstream server is reachable",
    ["server_id"],
)
```

The `tool_calls_total` counter with `status` label (`success`, `error`, `rate_limited`, `unauthorized`) gives you a live error rate. The `tool_call_duration` histogram captures latency distribution — the p99 latency is more informative than the average when diagnosing slow tools.

### Health check endpoint

Every gateway instance should expose a health endpoint that returns its status in a structured format:

```json
GET /health
{
  "status": "healthy",
  "uptime_seconds": 84321,
  "active_connections": 12,
  "upstream_servers": {
    "github-mcp-server": { "status": "up", "latency_ms": 45, "tools_registered": 4 },
    "postgres-mcp-server": { "status": "up", "latency_ms": 12, "tools_registered": 2 },
    "filesystem-mcp-server": { "status": "degraded", "latency_ms": 3200, "tools_registered": 5 }
  },
  "rate_limits": {
    "active_buckets": 8,
    "total_throttled": 142
  }
}
```

This endpoint feeds into your orchestration layer's liveness and readiness probes (as shown in the Docker and Kubernetes examples in Spoke 4) and can be polled by external monitoring tools for a high-level health summary.

## Alerting

Metrics without alerts are a historical record, not an operational tool. The alert rules that matter for a production gateway are:

### Must-alert conditions

1. **Gateway down** — Alert if the `/health` endpoint returns non-200 for more than 30 seconds. This means no client can reach any upstream server.
2. **Upstream server degraded** — Alert if any upstream server's health check latency exceeds 5 seconds or returns errors for more than 1% of requests over a 5-minute window. This catches failing upstreams before they cause widespread timeouts.
3. **Rate limit saturation** — Alert if more than 5% of tool calls are rate-limited in a 1-minute window. This indicates either a runaway agent or an undersized rate limit configuration.
4. **Error rate spike** — Alert if the error rate (non-success `status` values) exceeds 5% over any 5-minute period. Errors include upstream failures, auth rejections, and malformed requests. A spike in auth rejections may indicate a credential rotation that was not propagated to the gateway.
5. **Latency anomaly** — Alert if the p99 tool call latency exceeds 2x the baseline for any upstream server. This catches infrastructure degradation before it becomes a timeout.

### PrometheusAlertManager rule example

```yaml
groups:
  - name: mcp-gateway
    rules:
      - alert: GatewayDown
        expr: up{job="mcp-gateway"} == 0
        for: 30s
        annotations:
          summary: "MCP gateway instance {{ $labels.instance }} is down"

      - alert: UpstreamServerDegraded
        expr: rate(mcp_gateway_tool_calls_total{status="error"}[5m])
          / rate(mcp_gateway_tool_calls_total[5m]) > 0.01
        for: 5m
        annotations:
          summary: "Upstream server {{ $labels.upstream_server }} error rate above 1%"

      - alert: RateLimitSaturation
        expr: rate(mcp_gateway_tool_calls_total{status="rate_limited"}[1m])
          / rate(mcp_gateway_tool_calls_total[1m]) > 0.05
        for: 1m
        annotations:
          summary: "Rate limit saturation above 5% for user {{ $labels.user_id }}"
```

Route these alerts to your team's on-call rotation. The audit log entries from the same time window provide the context needed to diagnose each alert — the `caller.user_id` for the rate limit saturation, the `upstream.server_id` for the degraded server, and the `response.duration_ms` for the latency anomaly.

### Tuning alert thresholds

Alert thresholds are not one-size-fits-all. A team running a gateway for internal development tools has different tolerance for errors than a team serving customer-facing AI features. Three practical tuning guidelines:

- **Start high, ratchet down** — Begin with alert thresholds that only fire on clear outages (5% error rate, 10-second p99 latency). After two weeks of stable operations, tighten the thresholds based on observed baselines.
- **Seasonal baselines** — Gateway traffic patterns often follow business hours. An alert threshold that fires correctly at 3 PM may fire falsely at 3 AM when baseline traffic drops. Use separate thresholds for peak and off-peak hours, or set alerts on relative deviation (2x the trailing 7-day median) rather than absolute values.
- **Upstream-specific thresholds** — A filesystem server with millisecond latency should alert at 500ms. A remote API server with 2-second baseline latency should alert at 5 seconds. Configure per-upstream thresholds in the alert rules rather than a single global threshold.

### Runbook integration

Every alert should link to a runbook that tells the on-call engineer what to do. The runbook for each gateway alert follows a standard structure:

1. **Check the gateway health endpoint** — Is the gateway itself healthy, or has the process crashed?
2. **Check upstream server health** — Use the health endpoint's per-server status to identify which upstream is failing.
3. **Query audit logs** — Search the last 5 minutes of audit logs for the affected server or user. Look for error patterns in the `response.error` field.
4. **Check upstream server logs** — If the upstream server is self-hosted, check its own logs. The error may be in the upstream, not the gateway.
5. **Escalate if unresolved** — If the upstream is a third-party service (GitHub API, Slack API), check their status page and escalate to the platform team if needed.

## Deeper Reading

This article is Spoke 5, the final spoke of the MCP Gateway content cluster. The complete cluster covers the full lifecycle of MCP gateway adoption:

- [MCP Gateway Guide](/mcp-gateway-guide) — the cluster pillar: gateway overview, comparison table, evaluation criteria, and deployment options
- [Securing MCP in Production](/blog/securing-mcp-gateway-production) — the authentication and allowlisting layer that produces the audit log entries (Spoke 1)
- [Building an MCP Gateway with FastMCP](/blog/building-mcp-gateway-fastmcp) — the gateway implementation that these observability patterns monitor (Spoke 2)
- [MCP Gateway Comparison](/blog/mcp-gateway-comparison) — choosing between FastMCP, managed gateways, and reverse proxy (Spoke 3)
- [MCP Gateway Deployment Models](/blog/mcp-gateway-deployment-models) — self-hosted, serverless, and sidecar deployment (Spoke 4)
- [Agent Hygiene Score](/agent-hygiene) — the least-privilege scoping rubric that rate limiting and audit logging operationalize