---
title: "MCP Gateway Deployment Models: Self-Hosted, Serverless, Sidecar, and Hybrid"
description: "Compare MCP gateway deployment models: Docker and Kubernetes self-hosting, Cloudflare Workers and AWS Lambda serverless, sidecar patterns, and hybrid approaches. Includes scaling, HA, and multi-region guidance."
author: "Chester Beard"
date: "2026-11-10T00:00:00.000Z"
tags: ["mcp gateway deployment", "mcp kubernetes", "mcp serverless", "mcp infrastructure", "gateway scaling"]
---

> **Part of the [MCP Gateway Guide](/mcp-gateway-guide) content cluster** — this article covers deployment architectures for production MCP gateways.

An MCP gateway in development runs on your laptop with a `python server.py` command. An MCP gateway in production runs on infrastructure that you don't think about — until it breaks at 2 AM. The deployment model you choose determines how you handle scaling, failures, updates, and multi-region traffic, and each model makes different trade-offs between operational overhead and control.

This guide covers four deployment models for the custom FastMCP gateway from Spoke 2 and the managed gateway options from Spoke 3. The same patterns apply whether you are running a FastMCP Python server, proxying through nginx, or operating a managed gateway from Cloudflare or AWS.

## Deployment Architecture Overview

A gateway deployment has three logical layers, regardless of the model:

1. **Gateway process** — The MCP server that routes tool calls, handles authentication, and enforces policies.
2. **Upstream server connections** — The stdio processes or SSE connections to the MCP servers behind the gateway.
3. **Client-facing endpoint** — The SSE or HTTP endpoint that AI clients connect to.

The deployment model determines how each layer runs, scales, and recovers from failure.

```
                         ┌──────────────────────────────┐
                         │      Client-Facing Layer      │
                         │  SSE endpoint, TLS, routing   │
                         └──────────┬───────────────────┘
                                    │
                         ┌──────────▼───────────────────┐
                         │      Gateway Process Layer    │
                         │  Tool routing, auth, policy  │
                         └──────────┬───────────────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
     ┌─────────▼──────┐   ┌────────▼───────┐   ┌────────▼──────┐
     │  stdio Server  │   │   SSE Server    │   │  stdio Server │
     │   (child proc) │   │  (remote HTTP)  │   │  (child proc) │
     └────────────────┘   └────────────────┘   └───────────────┘
```

In a self-hosted model, all three layers run in your infrastructure. In a serverless model, the gateway layer runs as a stateless function and the upstream connections are external. In a sidecar model, the gateway layer runs alongside each AI client instance.

## Self-Hosted: Docker

Docker is the simplest production deployment model for a FastMCP gateway. The gateway runs as a container, upstream stdio servers run as sidecar containers or sibling containers, and a reverse proxy (nginx, Caddy, or Traefik) terminates TLS and forwards SSE traffic.

### Docker Compose for a single-host gateway

For teams starting out with a handful of upstream servers, a Docker Compose setup gives you process isolation, restart policies, and log management without Kubernetes complexity:

```yaml
# docker-compose.yml
version: "3.8"
services:
  gateway:
    build: .
    ports:
      - "8000:8000"
    environment:
      - GATEWAY_CONFIG=/config/servers.yaml
      - LOG_LEVEL=info
    volumes:
      - ./config:/config
      - gateway-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 15s
      timeout: 5s
      retries: 3

  # Upstream servers as sibling containers
  github-server:
    image: ghcr.io/modelcontextprotocol/server-github:latest
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    restart: unless-stopped

  filesystem-server:
    image: ghcr.io/modelcontextprotocol/server-filesystem:latest
    command: ["/allowed/data"]
    volumes:
      - ./data:/allowed/data
    restart: unless-stopped

  # Reverse proxy for TLS termination
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - gateway
    restart: unless-stopped

volumes:
  gateway-data:
```

The gateway container connects to upstream containers over the Docker network. For stdio upstreams, the gateway starts the server process inside its own container or connects to a sibling container's exposed port. For SSE upstreams, it connects over HTTP to the sibling's URL.

### Scaling with Docker Compose

Docker Compose is single-host. To scale the gateway horizontally, you add a load balancer in front of multiple gateway replicas. Each replica runs the same server configuration and connects to the same upstream servers:

```yaml
  gateway-replica:
    build: .
    deploy:
      replicas: 3
    # Same config as gateway
```

The upstream servers are the shared bottleneck — each replica connects to the same PostgreSQL server or GitHub API. Rate limiting and connection pooling (from Spoke 2) become essential at this point to avoid overwhelming upstream servers with N concurrent connections from N gateway replicas.

## Self-Hosted: Kubernetes

Once a gateway serves multiple teams or crosses the single-host resource boundary, Kubernetes provides the orchestration that Docker Compose lacks: auto-scaling, rolling updates, service discovery, and multi-node resource scheduling.

### Gateway as a Deployment

A Kubernetes deployment for the FastMCP gateway follows standard patterns:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-gateway
  labels:
    app: mcp-gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mcp-gateway
  template:
    metadata:
      labels:
        app: mcp-gateway
    spec:
      containers:
      - name: gateway
        image: my-registry/mcp-gateway:latest
        ports:
        - containerPort: 8000
          name: sse
        env:
        - name: GATEWAY_CONFIG
          value: /config/servers.yaml
        - name: LOG_LEVEL
          value: info
        volumeMounts:
        - name: config
          mountPath: /config
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 3
          periodSeconds: 10
      volumes:
      - name: config
        configMap:
          name: gateway-config
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-gateway
spec:
  selector:
    app: mcp-gateway
  ports:
  - port: 443
    targetPort: 8000
    name: sse
  type: ClusterIP
```

### Upstream servers as sidecars or separate Deployments

For stdio upstream servers, the Kubernetes pattern depends on whether the server is ephemeral (starts and stops with the gateway) or persistent (long-lived, shared across gateway replicas):

- **Sidecar containers** — stdio servers that are tied to a specific gateway instance run as a sidecar in the same pod. They share the pod lifecycle and network namespace, so the gateway accesses them over localhost.
- **Separate Deployments** — SSE upstream servers that outlive individual gateway instances run as their own Deployment with a Service. The gateway connects to them over the cluster network.

```yaml
# Sidecar example: stdio server in the same pod
spec:
  containers:
  - name: gateway
    # ... gateway container
  - name: filesystem-server
    image: ghcr.io/modelcontextprotocol/server-filesystem:latest
    args: ["/data"]
    volumeMounts:
    - name: data
      mountPath: /data
```

The sidecar pattern minimizes latency (localhost stdio) but means restarting the gateway pod also restarts the upstream server. For databases or stateful servers, that is not always desirable — use a separate Deployment with persistent storage instead.

### Horizontal Pod Autoscaling

CPU-based autoscaling works well for gateway workloads because tool routing is compute-bound (JSON-RPC deserialization, tool name resolution, response serialization):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mcp-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mcp-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

Set `minReplicas` to at least 2 for high availability. The max depends on your upstream server capacity — more gateway replicas mean more concurrent connections to each upstream.

## Serverless: Cloudflare Workers and AWS Lambda

Serverless deployment shifts the gateway from a long-running process to a stateless function invoked on each client request. This eliminates infrastructure management but imposes constraints on connection duration, state, and upstream transport.

### Cloudflare Workers

A Cloudflare Worker can act as an MCP gateway for SSE upstream servers. Workers handle HTTP requests, so the gateway receives MCP messages over SSE from clients and forwards them to upstream SSE endpoints:

```
AI Client ──SSE──► Cloudflare Worker ──HTTP──► Upstream SSE Servers
```

The Worker's runtime has a few limitations to account for:

- **Duration limit** — Workers have a CPU time limit (30 seconds on the free plan, 60 seconds on paid). MCP tool calls that involve long-running upstream queries may hit this limit.
- **No stdio** — Workers cannot spawn child processes. All upstream servers must be SSE or HTTP endpoints.
- **Stateless** — Worker state (tool registries, connection pools) must be rebuilt on each invocation or stored in KV/DO.

A Worker-based gateway is best for environments where all upstream servers are already SSE endpoints and the gateway does lightweight routing and auth. For stdio-heavy gateways, self-hosted remains the practical choice.

### AWS Lambda with API Gateway

AWS Lambda behind API Gateway follows a similar pattern to Workers — stateless functions invoked per request. Lambda supports longer execution times (up to 15 minutes) but has its own constraints:

```yaml
# SAM template snippet for a Lambda-based gateway
Resources:
  GatewayFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: gateway/
      Handler: app.handler
      Runtime: python3.12
      MemorySize: 512
      Timeout: 60
      Environment:
        Variables:
          UPSTREAM_SERVERS: !Ref UpstreamServerConfig
      Policies:
        - SecretsManagerReadWrite
      Events:
        SSEConnection:
          Type: Api
          Properties:
            Path: /mcp
            Method: ANY
```

Lambda's per-request billing model is efficient for gateways with bursty traffic (teams making occasional tool calls) but becomes expensive for steady-state connections (a client holding an SSE connection open for hours).

Lambda also cannot do stdio — all upstream connections are HTTP/SSE. The AWS A2A gateway architecture described in Spoke 3 uses this pattern with API Gateway, Lambda, and DynamoDB for state management.

## Sidecar Pattern

A sidecar gateway runs as a local proxy alongside each AI client, rather than as a shared infrastructure service. The client connects to localhost, and the sidecar handles authentication, routing, and policy enforcement before forwarding to upstream servers.

```
┌──────────────────────┐
│   AI Client Pod      │
│                      │
│  ┌────────────────┐  │
│  │  AI Agent      │  │
│  │  (Claude,      │──┼──► MCP protocol to sidecar
│  │   Custom)      │  │
│  └────────┬───────┘  │
│           │          │
│  ┌────────▼───────┐  │
│  │  MCP Gateway   │  │
│  │  (Sidecar)     │──┼──► Upstream MCP servers (remote)
│  └────────────────┘  │
└──────────────────────┘
```

The sidecar pattern is useful in multi-tenant environments where each tenant needs isolated routing policies, credential sets, or audit logs. Each sidecar instance is configured for its specific client, so policy changes affect only that client.

### Sidecar with Docker

In a Docker setup, the sidecar gateway runs as a companion container in the same Docker network or Compose file as the AI client:

```yaml
services:
  ai-client:
    image: my-ai-agent:latest
    environment:
      - MCP_GATEWAY_URL=http://gateway-sidecar:8000
    depends_on:
      - gateway-sidecar

  gateway-sidecar:
    build: ./gateway
    environment:
      - CLIENT_ID=team-alpha
      - GATEWAY_CONFIG=/config/team-alpha.yaml
    volumes:
      - ./config/team-alpha.yaml:/config/team-alpha.yaml
```

Each sidecar loads its own configuration — different allowlists, different credential mappings, different upstream servers. The AI client never sees the upstream servers directly; it only talks to its sidecar.

## Multi-Region and High Availability

A gateway becomes a single point of failure if there is only one instance. Multi-region deployment requires the gateway to operate independently in each region, with upstream servers chosen based on latency and data residency requirements.

### Regional gateway deployments

The simplest HA pattern is to deploy the gateway stack (gateway + upstream servers) in each region independently, with a global load balancer routing clients to the nearest region:

```
Global LB (DNS-based)
    ├── us-east-1 ── Gateway ── Upstream Servers (us-east)
    ├── eu-west-1 ── Gateway ── Upstream Servers (eu-west)
    └── ap-southeast-1 ── Gateway ── Upstream Servers (ap-southeast)
```

Each gateway replica registers its upstream servers independently. Clients connect to the nearest region. If a region fails, DNS-based routing shifts clients to the next-closest region. The trade-off is that upstream server state (database connections, active sessions) is regional — a failover to another region means establishing new connections.

### State synchronization between regions

The gateway itself is stateless (tool registries are read from config, sessions are ephemeral), so multi-region deployment does not require database replication. The challenge is credential synchronization: if you rotate a GitHub token, all regions need the new value. Use a secrets manager with cross-region replication (AWS Secrets Manager replication, HashiCorp Vault performance replicas) rather than per-region config files.

## Deployment Model Comparison

| Dimension | Docker Compose | Kubernetes | Cloudflare Workers | AWS Lambda | Sidecar |
|---|---|---|---|---|---|
| **Setup time** | Minutes | Hours-days | Minutes | Hours | Minutes |
| **Scaling** | Manual replica count | Auto (HPA) | Auto (per-request) | Auto (per-request) | Per-client |
| **Max upstream servers** | 5-10 | 50+ | 10-20 | 10-20 | 5-10 per sidecar |
| **stdio support** | Yes | Yes (sidecar) | No | No | Yes |
| **SSE support** | Yes | Yes | Yes | Yes | Yes |
| **TLS termination** | Reverse proxy | Ingress | Automatic | API Gateway | Reverse proxy |
| **Operational overhead** | Low | High | None | Low | Low per instance |
| **Multi-region** | Manual | Cluster federation | Automatic (Cloudflare global) | Multi-region Lambda | Per-region deploy |
| **Best for** | Small teams, single host | Platform teams, multi-service | Remote-SSE-only gateways | Bursty workloads, AWS shops | Multi-tenant isolation |

## Choosing a Deployment Model

The right model depends on how many upstream servers you operate, whether they are stdio or SSE, and who operates the infrastructure:

- **1-5 upstream servers, single team, Linux host** → Docker Compose. It is well-understood, easy to debug, and requires no Kubernetes expertise.
- **5-20 upstream servers, platform team, multiple consumers** → Kubernetes. The operational overhead of managing a cluster is justified by the scaling, update, and isolation benefits.
- **All upstream servers are SSE, want zero ops** → Cloudflare Workers or AWS Lambda. Trade stdio support and execution duration for managed infrastructure.
- **Multi-tenant with isolated policies per tenant** → Sidecar. Each tenant gets its own gateway instance with its own configuration, and tenant A's traffic never affects tenant B's routing.
- **Global user base, need low-latency access** → Multi-region self-hosted or Cloudflare Workers (which is globally distributed by default).

## Deeper Reading

This article is Spoke 4 of the MCP Gateway content cluster. Continue with:

- [MCP Gateway Guide](/mcp-gateway-guide) — the cluster pillar: gateway overview, evaluation criteria, and deployment options
- [Building an MCP Gateway with FastMCP](/blog/building-mcp-gateway-fastmcp) — the gateway implementation that these deployment models run (Spoke 2)
- [MCP Gateway Comparison](/blog/mcp-gateway-comparison) — choosing between FastMCP, managed gateways, and reverse proxy (Spoke 3)
- [Securing MCP in Production](/blog/securing-mcp-gateway-production) — auth and credential patterns that apply across all deployment models (Spoke 1)
- [Agent Hygiene Score](/agent-hygiene) — the operational security rubric applicable to gateway infrastructure