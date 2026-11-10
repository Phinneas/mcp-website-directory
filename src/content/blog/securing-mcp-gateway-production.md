---
title: "Securing MCP in Production: Auth, SSO, and Policy Enforcement"
description: "A practical guide to MCP gateway authentication: SSO integration with Okta and Azure AD, per-server credential management, tool-level allowlisting, and least-privilege policy enforcement."
author: "Chester Beard"
date: "2026-11-10T00:00:00.000Z"
tags: ["mcp gateway authentication", "mcp sso", "mcp security", "mcp production", "mcp allowlisting"]
---

> **Part of the [MCP Gateway Guide](/mcp-gateway-guide) content cluster** — this article goes deep on the identity and authorization layer of production MCP gateways.

An MCP gateway solves the credential sprawl problem: instead of managing N API keys across M clients, you manage them in one place. But centralization also means the gateway becomes the most critical security boundary in your MCP infrastructure. Every auth bypass, misconfigured allowlist, or leaked credential gives access to every connected server and tool.

This guide covers the four layers of gateway security that matter in production: SSO integration, per-server credential management, tool-level allowlisting, and least-privilege scoping — with real config examples you can adapt.

## SSO Integration Patterns

A production gateway authenticates users through their existing identity provider rather than issuing yet another set of credentials. The gateway sits between the AI client and the MCP servers, authenticating the user once and proxying their identity to upstream servers as needed.

### OAuth 2.0 Authorization Code flow

The standard pattern for gateway SSO follows the OAuth 2.0 Authorization Code flow. The gateway registers as a confidential client with the identity provider, and users authenticate through the IdP's login page. On successful authentication, the gateway receives an authorization code, exchanges it for an access token and ID token, and establishes a session with the user's identity claims.

This flow works with every major provider:

- **Okta** — The gateway registers as a native OAuth 2.0 application in Okta. Users authenticate via Okta's hosted login page or through an Okta-branded widget embedded in the gateway. The gateway validates the ID token's signature using Okta's JWKS endpoint and maps the `sub` claim to the user's gateway session. Okta's policy engine can enforce step-up authentication (MFA) and device trust signals before the token is issued.

- **Azure AD (Microsoft Entra ID)** — The gateway uses Microsoft's OAuth 2.0 + OpenID Connect implementation. Azure AD returns a JWT access token scoped to the gateway's registered audience. The gateway validates the token against Azure AD's public keys and extracts group membership claims from the `groups` field for authorization decisions. Conditional Access Policies in Azure AD can enforce device compliance and location-based access before authentication completes.

- **Google Workspace** — The gateway integrates with Google's OAuth 2.0 endpoints using workspace-scoped client IDs. Google's token includes domain-level claims that let the gateway verify the user belongs to a managed Google Workspace organization before granting access. Session duration and refresh token policies follow the gateway's OAuth consent screen configuration.

### Token exchange for upstream servers

Once the user is authenticated, the gateway may need to present credentials to upstream MCP servers on their behalf. Three patterns exist:

1. **Token passthrough** — The user's original IdP token is forwarded to the upstream server, which validates it independently. This works when all servers trust the same identity provider.

2. **Token exchange** — The gateway calls the IdP's token exchange endpoint to obtain a server-specific token using the user's original token as authorization. Azure AD supports this natively via the On-Behhalf-Of (OBO) grant type.

3. **Credential injection** — The gateway stores upstream credentials (API keys, service tokens) in a secure vault and injects them into the MCP session based on the authenticated user's identity, without exposing the raw credential to the client.

The credential injection pattern is the most practical for today's MCP ecosystem, where most servers authenticate via static API keys rather than OAuth.

## Per-Server Credential Management

Each MCP server behind the gateway may require different credentials: a GitHub personal access token for the GitHub server, a Neon database connection string for the PostgreSQL server, a Slack bot token for the Slack server. The gateway centralizes these credentials and maps them to gateway user sessions.

### Vault integration

Credentials belong in a secrets manager, not in config files. Production gateways integrate with:

- **HashiCorp Vault** — The gateway authenticates to Vault using its own identity (Vault AppRole or OIDC), then fetches per-server credential sets at session start. Vault's automatic credential rotation means the gateway always uses current secrets.

- **Cloud provider secret stores** — AWS Secrets Manager, GCP Secret Manager, or Azure Key Vault provide equivalent functionality with tighter platform integration for cloud-native deployments.

- **Encrypted environment variables** — For simpler deployments, the gateway loads a sealed credential bundle at startup, encrypted with a hardware-bound key (AWS KMS, GCP Cloud KMS, or Azure HSM). The bundle is decrypted in memory and never written to disk.

### Credential mapping

The gateway maintains a mapping from `(user identity + server name)` to the credential to use. A typical mapping config looks like this:

```json
{
  "credentialMapping": {
    "default": {
      "github-mcp-server": { "source": "vault", "path": "github/api-token" },
      "postgres-mcp-server": { "source": "vault", "path": "postgres/prod-connection" },
      "slack-mcp-server": { "source": "env", "key": "SLACK_BOT_TOKEN" }
    },
    "overrides": [
      {
        "match": { "group": "engineering" },
        "servers": {
          "postgres-mcp-server": { "source": "vault", "path": "postgres/engineering-replica" }
        }
      }
    ]
  }
}
```

This approach lets the gateway serve different credentials to different user groups without any client-side configuration changes.

## Tool-Level Allowlisting

The most common MCP gateway security failure is all-or-nothing server access: a user who only needs read access to a database gets the full `query` tool, and one `DROP TABLE` later the incident report writes itself. Tool-level allowlisting prevents this by restricting which tools on a server a given user or group can invoke.

### MCP tool signatures

Every MCP tool has a canonical name and input schema. Gateway allowlists match against these signatures:

| Server | Tool | Input schema (abbreviated) |
|--------|------|---------------------------|
| Filesystem | `read_file` | `{ path: string }` |
| Filesystem | `write_file` | `{ path: string, content: string }` |
| Filesystem | `list_directory` | `{ path: string }` |
| Filesystem | `search_files` | `{ pattern: string, root: string }` |
| GitHub | `create_issue` | `{ owner: string, repo: string, title: string, body?: string }` |
| GitHub | `search_repositories` | `{ query: string }` |
| GitHub | `get_pull_request` | `{ owner: string, repo: string, pull_number: number }` |
| PostgreSQL | `query` | `{ sql: string }` |
| PostgreSQL | `list_tables` | `{ schema?: string }` |

An allowlist policy that grants a support team member access to Filesystem's `read_file` and `list_directory` but blocks `write_file`, and restricts PostgreSQL access to `list_tables` only, looks like this:

```json
{
  "allowlist": {
    "servers": {
      "filesystem-mcp-server": {
        "allow": ["read_file", "list_directory", "search_files"],
        "deny": ["write_file", "delete_file", "create_directory", "delete_directory"]
      },
      "postgres-mcp-server": {
        "allow": ["list_tables"],
        "deny": ["query", "execute", "create_table", "drop_table", "alter_table"]
      }
    }
  }
}
```

The gateway matches the `deny` list before the `allow` list, ensuring that explicitly dangerous tools remain blocked even if the allowlist is accidentally widened.

### Tool name namespacing

When multiple servers expose tools with the same name, the gateway namespaced them with the server identifier. For example, two different servers might each expose a `query` tool — one for PostgreSQL and one for Elasticsearch. The gateway identifies them as `postgres-mcp-server/query` and `elasticsearch-mcp-server/query` respectively, making allowlist entries unambiguous.

## Least-Privilege Scoping

The [Agent Hygiene Score](/agent-hygiene) framework includes "least-privilege scoping" as a core dimension, and gateway allowlisting is its most direct implementation. The principle is: every tool invocation should carry only the permissions it needs, and no more.

### Per-user tool visibility

A production gateway should not return all available tools to every user during MCP's `tools/list` handshake. Instead, it filters the tool list based on the authenticated user's allowlist. A user who has access to `read_file` and `list_directory` should see only those two tools in their client, not the full server manifest with `write_file` and `delete_file` grayed out. This reduces the attack surface exposed to the AI model: if the model never learns a dangerous tool exists, it cannot be prompted into calling it.

### Group-based policy sets

Real organizations need more than a single allowlist. A typical policy matrix might define:

```yaml
policies:
  - name: "read-only"
    match:
      group: ["support", "analyst"]
    tools:
      filesystem-mcp-server: ["read_file", "list_directory", "search_files"]
      postgres-mcp-server: ["list_tables"]
  
  - name: "developer"
    match:
      group: ["engineering", "data-science"]
    tools:
      filesystem-mcp-server: ["*"]
      postgres-mcp-server: ["list_tables", "query"]
      github-mcp-server: ["create_issue", "search_repositories", "get_pull_request"]
  
  - name: "admin"
    match:
      role: "admin"
    tools:
      filesystem-mcp-server: ["*"]
      postgres-mcp-server: ["*"]
      github-mcp-server: ["*"]
```

Policy resolution follows first-match semantics: the gateway evaluates policies in order and applies the first matching set. The `admin` role matches last, ensuring that routine access does not inherit administrative permissions by accident.

### Resource-level restrictions

Some gateways extend allowlisting beyond tool names to tool input validation. For example, a PostgreSQL `query` tool invocation may be allowed, but only if the SQL matches a `SELECT` pattern and does not contain `DROP`, `ALTER`, `DELETE`, or `INSERT`. This is a regex or AST-based filter applied to the tool call's arguments before forwarding.

Resource-level restrictions are implementation-specific and less common in today's MCP ecosystem, but they represent the frontier of gateway policy enforcement.

## Policy-as-Code

Gateway security policies should be declarative, version-controlled, and deployed through the same CI/CD pipeline as your application code. Storing policies as code rather than clicking through a UI gives you audit trails, review processes, and rollback capability.

### File-based policy loading

A common pattern is to load gateway policies from a well-known path at startup:

```
gateway/
├── policies/
│   ├── allowlists/
│   │   ├── read-only.yaml
│   │   ├── developer.yaml
│   │   └── admin.yaml
│   ├── credentials/
│   │   ├── vault-mappings.json
│   │   └── vault-policy.hcl
│   └── sso/
│       ├── okta-config.yaml
│       └── azure-ad-config.yaml
├── gateway-config.yaml
└── docker-compose.yml
```

The gateway watches the policies directory for changes and hot-reloads allowlists without dropping active sessions. Credential changes require a re-auth from the user to pick up new tokens.

### SSO provider config example: Okta

An Okta integration config for an MCP gateway typically requires:

```yaml
# gateway/config/sso/okta.yaml
sso:
  provider: okta
  okta:
    domain: "https://my-org.okta.com"
    client_id: "${OKTA_CLIENT_ID}"
    client_secret: "${OKTA_CLIENT_SECRET}"
    audience: "https://mcp-gateway.my-org.com"
    scopes:
      - "openid"
      - "profile"
      - "groups"
    jwks_uri: "https://my-org.okta.com/oauth2/default/v1/keys"
    session:
      ttl_minutes: 480
      refresh: true
    group_mapping:
      - okta_group: "MCP-ReadOnly"
        gateway_role: "read-only"
      - okta_group: "MCP-Developer"
        gateway_role: "developer"
      - okta_group: "MCP-Admin"
        gateway_role: "admin"
```

The gateway reads `groups` from the ID token's claims and maps them to internal roles, which then determine the allowlist applied to the user's session.

## Deeper Reading

This article is Spoke 1 of the MCP Gateway content cluster. Continue with:

- [MCP Gateway Guide](/mcp-gateway-guide) — the cluster pillar: gateway overview, comparison table, evaluation criteria, and deployment options
- [Agent Hygiene Score](/agent-hygiene) — the least-privilege scoping rubric referenced throughout this guide
- [Enterprise Readiness](/enterprise-readiness) — deployment model comparison for production gateway infrastructure
- [Building a Production Notion MCP Gateway](/blog/notion-mcp-gateway) — step-by-step tutorial for a custom gateway implementation