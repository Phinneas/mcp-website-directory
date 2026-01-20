---
title: "Best GitHub Alternative Open Source Platforms: The Complete 2025 Guide"
description: "A comprehensive guide to self-hosted and managed open-source Git platforms."
author: "Your Name"
date: "2025-10-07T00:00:00.000Z"
image: "/images/placeholder.jpg"
tags: ["github", "alternatives", "open-source", "devops", "gitea", "gitlab"]
---

# Best GitHub Alternative Open Source Platforms: The Complete 2025 Guide

## 1. Why Developers Are Exploring GitHub Alternatives

When Microsoft acquired GitHub for $7.5 billion in 2018, it sent ripples through the developer community. While GitHub remains a powerful platform that millions trust daily, that acquisition crystallized something many developers had been thinking about: putting all your eggs in one basket—especially a basket owned by a tech giant—carries risk.

Today, the conversation around GitHub alternatives isn't just about Microsoft. It's about control, privacy, flexibility, and finding the right tool for your specific needs. Whether you're a solo developer, a startup CTO, or leading engineering at an enterprise, you have legitimate reasons to explore what else is out there.

### Why Teams Consider Alternatives

**Privacy and Data Sovereignty**: Your code is your intellectual property. Some organizations need absolute certainty about where their data lives and who has access. Self-hosted alternatives give you complete control—no questions about third-party access or data mining for AI training models.

**Vendor Lock-In Concerns**: GitHub's ecosystem is powerful, but it's also proprietary. Features like GitHub Actions, Packages, and Copilot create dependencies that make migration difficult. Open-source alternatives let you own your infrastructure and avoid platform-specific features that trap you.

**Pricing Flexibility**: GitHub's pricing works great for some teams but feels restrictive to others. Need unlimited private repos for a large team? The costs add up fast. Self-hosted solutions shift the calculation from per-user fees to infrastructure costs, which can be dramatically cheaper at scale.

**Compliance and Regulatory Requirements**: Government agencies, healthcare providers, financial institutions, and other regulated industries often can't use cloud services that don't meet specific compliance standards. Self-hosted alternatives give you the audit trails and control you need.

**Philosophical Alignment**: Some developers simply prefer open-source tools that align with free software principles. They want platforms governed by communities, not corporations, where the roadmap is transparent and contributions matter.

### What This Guide Covers

I'll walk you through the leading GitHub alternatives—both self-hosted and managed—so you can make an informed choice. You'll learn about each platform's strengths and weaknesses, resource requirements, migration strategies, and how to implement features like CI/CD, security scanning, and developer workflows.

This isn't a superficial listicle. I'm giving you the technical depth you need to actually evaluate, deploy, and operate these platforms. By the end, you'll know which alternative fits your team size, technical requirements, and operational capacity.

### Who This Guide Is For

- **Self-hosters and privacy advocates** who want complete control over their code infrastructure
- **Startups and small teams** looking for cost-effective alternatives to GitHub's paid tiers
- **Enterprise teams** needing compliance, security, and integration capabilities
- **Open-source project maintainers** who want community-driven, nonprofit platforms
- **DevOps engineers** responsible for evaluating and migrating version control systems

Let's find the platform that works for you.

---

## 2. Quick Decision Guide - Find Your Best Alternative Fast

If you're in a hurry or just want to cut through the noise, here's where to start. I've distilled the key platforms into quick recommendations based on common needs.

### Quick Picks by Need

🏆 **Best Overall Alternative: GitLab CE**  
Full DevOps platform with integrated CI/CD, container registry, issue boards, and merge request workflows. Best for teams that want GitHub's feature set plus more control.

🪶 **Most Lightweight: Gitea**  
Runs on just 256MB RAM. Perfect for small teams, startups, or self-hosters who want something fast and simple without the overhead.

🔒 **Privacy-First: Codeberg**  
Nonprofit, community-hosted platform based on Gitea. Zero tracking, open governance, free hosting. Ideal for open-source projects that value transparency.

📧 **For Power Users: SourceHut**  
Email-driven, modular platform for developers who prefer command-line workflows and scriptable automation. Steep learning curve but maximum control.

💼 **Best Enterprise Integration: BitBucket**  
If you already use Jira, Confluence, or other Atlassian tools, BitBucket integrates seamlessly. Built-in Pipelines for CI/CD and flexible hosting options.

⚡ **Fastest Setup: Gogs**  
Ultra-minimal Git service. Download one binary, run it, done. Perfect for personal projects, home labs, or when you just need Git hosting without complexity.

### Decision Tree: Choose Your Path

**Start here: Do you want hosted or self-hosted?**

**→ HOSTED (Someone else manages infrastructure)**
- Need privacy and nonprofit governance? → **Codeberg**
- Need enterprise features and support? → **GitLab.com** or **BitBucket Cloud**
- Want to avoid any Microsoft connection? → **Codeberg** or **SourceHut**

**→ SELF-HOSTED (You manage your own server)**

**Do you need built-in CI/CD?**
- **YES** → Full DevOps platform? → **GitLab CE** (full-featured) or **Gitea** (lightweight with Actions)
- **NO** → How important is minimal resource usage?
  - **CRITICAL** (limited hardware) → **Gogs** (128-256MB RAM)
  - **IMPORTANT** (small servers OK) → **Gitea** (256MB-1GB RAM)
  - **NOT IMPORTANT** (plenty of resources) → **GitLab CE** (4GB+ RAM)

**What's your team size?**
- **1-5 developers** → **Gogs** or **Gitea**
- **5-20 developers** → **Gitea** or **GitLab CE**
- **20-100 developers** → **GitLab CE**
- **100+ developers** → **GitLab CE** with HA setup

**Do you prefer email-based workflows over web UI?**
- **YES** → **SourceHut** (mail-first patches and reviews)
- **NO** → Use the recommendations above

### Quick Feature Check

Before diving deep, ask yourself what you absolutely need:

**Must-have features checklist:**
- ☐ Git repository hosting (all platforms have this)
- ☐ Issues and pull requests (all except SourceHut's email-first approach)
- ☐ Built-in CI/CD (GitLab CE, Gitea Actions, BitBucket Pipelines, SourceHut builds)
- ☐ Package/container registry (GitLab CE, BitBucket)
- ☐ Wiki and documentation hosting (most platforms)
- ☐ Kanban boards (GitLab CE, Gitea, Codeberg)
- ☐ LDAP/SAML/SSO integration (GitLab CE, Gitea, BitBucket)
- ☐ Advanced code review (GitLab CE, BitBucket)
- ☐ API access for automation (all major platforms)

Use the comparison table in the next section to validate your choice.

---

## 3. At-a-Glance Comparison Table

Here's everything you need to compare the major GitHub alternatives side-by-side.

### Comprehensive Feature Matrix

| Platform | Self-Hosted | Built-in CI/CD | Issues/PRs | Min RAM | Free Tier | Best For |
|----------|-------------|----------------|------------|---------|-----------|----------|
| **GitLab CE** | ✅ Yes | ✅ Full (Runners, pipelines) | ✅ Yes | 4GB+ | ✅ Unlimited | DevOps teams, enterprises |
| **Gitea** | ✅ Yes | ⚠️ Actions (beta) | ✅ Yes | 256MB | ✅ Unlimited | Small teams, startups |
| **BitBucket** | ✅ Server/Cloud | ✅ Pipelines | ✅ Yes | Cloud | ✅ 5 users free | Atlassian ecosystem users |
| **Gogs** | ✅ Yes | ❌ No (webhooks only) | ✅ Yes | 128MB | ✅ Unlimited | Minimal footprint, home labs |
| **Codeberg** | ☁️ Hosted only | ❌ No (external CI) | ✅ Yes | N/A | ✅ Unlimited | Privacy-focused projects |
| **SourceHut** | ✅ Both | ✅ Modular builds | ⚠️ Email-based | Low | ✅ Free tier | Email workflow fans |
| **Phabricator** | ✅ Yes | ⚠️ Partial | ✅ Yes | 2GB+ | ✅ Open source | Legacy enterprise |

### Advanced Feature Comparison

| Platform | Container Registry | Package Registry | Code Search | API | Mobile App |
|----------|-------------------|------------------|-------------|-----|------------|
| **GitLab CE** | ✅ Yes | ✅ Multiple formats | ✅ Advanced | ✅ Comprehensive | ✅ Yes |
| **Gitea** | ⚠️ Via packages | ✅ Multiple formats | ✅ Basic | ✅ Good | ❌ No |
| **BitBucket** | ✅ Yes | ⚠️ Limited | ✅ Good | ✅ Good | ✅ Yes |
| **Gogs** | ❌ No | ❌ No | ✅ Basic | ✅ Basic | ❌ No |
| **Codeberg** | ⚠️ Via packages | ✅ Basic | ✅ Basic | ✅ Good | ❌ No |
| **SourceHut** | ❌ External | ❌ External | ✅ CLI-based | ✅ Good | ❌ No |

### Authentication & Security

| Platform | LDAP/AD | SAML/SSO | OAuth2 | 2FA | Audit Logs |
|----------|---------|----------|--------|-----|------------|
| **GitLab CE** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Comprehensive |
| **Gitea** | ✅ Yes | ⚠️ Via OAuth2 | ✅ Yes | ✅ Yes | ✅ Good |
| **BitBucket** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Comprehensive |
| **Gogs** | ✅ Yes | ❌ No | ✅ Basic | ✅ Yes | ⚠️ Basic |
| **Codeberg** | ✅ Yes | ⚠️ Limited | ✅ Yes | ✅ Yes | ✅ Good |
| **SourceHut** | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |

### Cost Comparison

**Self-Hosted Monthly Infrastructure Costs (Small Team: 5-10 developers)**

| Item | Gitea/Gogs | GitLab CE | BitBucket Server |
|------|------------|-----------|------------------|
| **VM/Compute** | $10-30 | $50-100 | $80-150 |
| **Managed DB** | $10-25 | $30-60 | $40-80 |
| **Object Storage** | $5-15 | $15-30 | $20-40 |
| **Bandwidth** | $5-20 | $20-50 | $30-60 |
| **Ops Time** | 4-8 hrs/month | 12-20 hrs/month | 16-24 hrs/month |
| **Total (infra only)** | **$30-90** | **$115-240** | **$170-330** |
| **Total (w/ ops @ $100/hr)** | **$430-890** | **$1,315-2,240** | **$1,770-2,730** |

**Hosted Plans Monthly Costs (Small Team: 5-10 users)**

| Platform | Free Tier | Paid Plan | Enterprise |
|----------|-----------|-----------|------------|
| **GitHub** | Unlimited public | $4/user/month | $21/user/month |
| **GitLab.com** | Unlimited repos | $29/user/month | $99/user/month |
| **BitBucket Cloud** | 5 users free | $3/user/month | $6/user/month |
| **Codeberg** | Free unlimited | Donations only | N/A |
| **SourceHut** | Free tier | $5/user/month | N/A |

**Break-Even Analysis:**  
For a 10-person team, self-hosting breaks even with paid hosted plans when:
- You can keep ops time under 15 hours/month
- Your infrastructure costs stay below $150/month
- You have in-house DevOps capacity

For smaller teams (1-5 people), hosted solutions are almost always cheaper once you factor in operational overhead.

---

## 4. Detailed Platform Reviews

Now let's dive deep into each platform. I'll cover what makes each one unique, when to choose it, and practical considerations for deployment.

### 4.1 GitLab CE: The Complete DevOps Platform

GitLab CE (Community Edition) is the most comprehensive open-source GitHub alternative. It's not just a Git hosting platform—it's a full DevOps lifecycle tool that handles everything from planning to deployment.

**What It Is:**  
GitLab CE is a self-hosted, open-source platform that includes Git repository management, issue tracking, merge requests, CI/CD pipelines, container registry, package management, and more. Think of it as GitHub plus Jenkins plus JFrog plus project management tools, all integrated into one application.

**Why Choose GitLab CE Over GitHub:**
- **Full ownership**: Your data, your infrastructure, your control
- **Integrated CI/CD**: No need for GitHub Actions or external CI—runners and pipelines are built in
- **No Microsoft connection**: If vendor independence matters to you
- **Advanced features in free tier**: Merge request approvals, protected branches, extensive API access
- **Single application**: One unified data store, no context switching between tools

**Real-World Usage:**  
Organizations like NASA, Goldman Sachs, and Sony use GitLab. It's the go-to choice for enterprises that need compliance, self-hosting, and extensive automation.

**Key Features:**
- Git repository hosting with advanced branching strategies
- Issue boards with Kanban-style project management
- Merge requests with approval workflows and code review
- GitLab CI/CD with shared runners and pipeline-as-code
- Container registry with RBAC and vulnerability scanning
- Package registries (npm, Maven, PyPI, NuGet, etc.)
- Built-in wiki and documentation hosting
- Advanced user permissions and group management
- Extensive REST and GraphQL API

**Resource Requirements:**
- Minimum: 4GB RAM, 2 CPU cores, 10GB storage
- Recommended: 8GB RAM, 4 CPU cores, 50GB storage
- For 10+ active users: 16GB RAM, 8 CPU cores

**Setup Difficulty:**  
Medium. GitLab provides omnibus packages for major Linux distributions that bundle everything (GitLab, PostgreSQL, Redis, etc.). Expect 30-60 minutes for basic installation, plus additional time for SSL, runners, and production hardening.

**When to Choose GitLab CE:**
- You need enterprise-grade features without enterprise pricing
- Your team wants integrated CI/CD out of the box
- You have 10+ developers and dedicated DevOps resources
- Compliance requires self-hosted infrastructure
- You want a single platform for the entire DevOps lifecycle

**When to Skip It:**
- You have limited hardware (under 4GB RAM)
- You want ultra-fast setup with minimal configuration
- Your team is 1-5 people and you don't need advanced features
- You prefer lightweight, focused tools over all-in-one platforms

**Documentation:** [https://docs.gitlab.com](https://docs.gitlab.com)

---

### 4.2 BitBucket: Enterprise Integration Powerhouse

BitBucket is Atlassian's Git repository hosting service, available both as cloud-hosted and self-hosted (Server/Data Center) options. If your organization runs on Atlassian tools, BitBucket is the natural GitHub alternative.

**What It Is:**  
BitBucket offers Git and Mercurial repository management with tight integration into the Atlassian ecosystem (Jira, Confluence, Trello, HipChat). It's designed for professional teams that need structured workflows, traceability, and project management integration.

**Why Choose BitBucket Over GitHub:**
- **Atlassian ecosystem**: Seamless integration with Jira issues, Confluence docs, and project tracking
- **Flexible hosting**: Choose cloud, self-hosted server, or data center deployment
- **BitBucket Pipelines**: Built-in CI/CD with Docker-based builds
- **Branch permissions**: Granular control over who can merge to which branches
- **Competitive pricing**: Free for up to 5 users, then $3/user for cloud

**Key Features:**
- Git and Mercurial support
- Pull requests with inline comments and approval workflows
- BitBucket Pipelines for CI/CD (cloud only by default)
- Smart Mirroring for distributed teams
- Jira integration with automatic issue transitions
- Branch permissions and merge checks
- Built-in code search
- IP whitelisting and required two-step verification
- REST API and webhooks

**Atlassian Ecosystem Integration:**
- **Jira**: Link commits and branches to issues, auto-transition issue status on merge
- **Confluence**: Embed repo stats and recent commits in documentation
- **Trello**: Connect cards to branches and view commit activity
- **Bamboo**: Native integration for advanced CI/CD workflows

**Deployment Options:**
- **BitBucket Cloud**: Hosted by Atlassian, zero infrastructure management
- **BitBucket Server**: Self-hosted on your infrastructure
- **BitBucket Data Center**: High-availability, multi-node cluster for enterprises

**Resource Requirements (Self-Hosted):**
- Minimum: 2GB RAM, 2 CPU cores
- Recommended: 4GB RAM, 4 CPU cores
- Data Center: 8GB+ RAM per node, 4+ CPU cores

**Pricing:**
- **Cloud Free**: Up to 5 users, unlimited private repos, 50 build minutes/month
- **Cloud Standard**: $3/user/month, 2,500 build minutes/month
- **Cloud Premium**: $6/user/month, 3,500 build minutes/month
- **Self-Hosted**: Starts at $1,100/year for 25 users

**When to Choose BitBucket:**
- Your team already uses Jira, Confluence, or other Atlassian products
- You need traceability from issue to deployment
- You want cloud hosting with more control than GitHub
- Your organization has existing Atlassian licenses
- You need enterprise support and compliance features

**When to Skip It:**
- You don't use any Atlassian tools (integration advantages are lost)
- You want pure open-source (BitBucket is proprietary)
- You need self-hosted CI/CD without additional products
- Budget is tight and you have fewer than 5 users (GitHub may be comparable)

**Documentation:** [https://support.atlassian.com/bitbucket-cloud/](https://support.atlassian.com/bitbucket-cloud/)

---

### 4.3 Gitea: Lightweight Self-Hosted Powerhouse

Gitea is a community-driven, open-source Git hosting platform written in Go. It's a fork of Gogs that evolved to include more features while maintaining lightweight resource usage. Gitea is the sweet spot for teams who want GitHub-like features without GitHub-scale resource requirements.

**What It Is:**  
Gitea provides Git hosting, issue tracking, pull requests, project management, and package registries in a single, efficient binary. It's designed to be easy to install, easy to run, and easy to maintain.

**Why Choose Gitea Over GitHub:**
- **Resource efficiency**: Runs on 256MB-512MB RAM for small teams
- **Simple deployment**: Single binary, minimal dependencies
- **Full control**: Self-hosted with no external dependencies
- **Active development**: Regular releases and responsive community
- **Gitea Actions**: GitHub Actions-compatible CI/CD (beta, improving rapidly)

**Migration Path from GitHub:**  
Gitea includes a built-in GitHub migrator that preserves issues, pull requests, releases, and wiki pages. Typical migration time for a small-to-medium project: 1-2 hours.

**Key Features:**
- Git repository hosting with LFS support
- Issue tracking with labels, milestones, and assignments
- Pull requests with code review and approvals
- Project boards (Kanban-style)
- Built-in package registry (Composer, Conan, Conda, Container, Helm, Maven, npm, NuGet, PyPI, RubyGems)
- Webhooks and external integrations
- Gitea Actions for CI/CD (GitHub Actions compatible)
- User organizations and team management
- Wiki for each repository
- OAuth2 provider and client
- LDAP, SAML, and OpenID authentication

**Resource Requirements:**
- Minimum: 256MB RAM, 1 CPU core, 1GB storage
- Recommended: 512MB-1GB RAM, 2 CPU cores
- Database: SQLite (built-in), MySQL, PostgreSQL, or MSSQL

**Setup Difficulty:**  
Easy. Download the binary for your OS, run it, configure via web UI. Full installation in 15-30 minutes including database setup.

**Community and Ecosystem:**
- Active GitHub repository with frequent releases
- Growing community, responsive maintainers
- Extensive documentation and deployment examples
- Docker images available for containerized deployment

**Gitea vs Forgejo:**  
Forgejo is a fork of Gitea focused on community governance. Gitea has a company-backed model (Gitea Ltd.), while Forgejo is pure community-driven. Features are similar; choose based on governance preference.

**When to Choose Gitea:**
- You have 1-50 developers and want lightweight self-hosting
- You want GitHub-style workflows without the resource overhead
- You need package registry hosting for multiple formats
- You value quick setup and minimal operational complexity
- You want CI/CD but don't need GitLab-level sophistication

**When to Skip It:**
- You need battle-tested CI/CD for complex pipelines (GitLab CE is more mature)
- You want email-first workflows (SourceHut)
- You need ultra-minimal footprint (Gogs is smaller)
- You require advanced project management features

**Documentation:** [https://docs.gitea.com/](https://docs.gitea.com/)

---

### 4.4 Gogs: Ultra-Minimalist Git Service

Gogs (Go Git Service) is where the lightweight self-hosted Git movement started. It's the spiritual ancestor of Gitea, maintained as an even more minimalist option for developers who want the absolute basics with zero bloat.

**What It Is:**  
Gogs is a self-hosted Git service that does one thing well: host Git repositories with basic issue tracking and web interface. Written in Go, it runs anywhere Go compiles—Windows, Mac, Linux, ARM, even Raspberry Pi.

**Why Choose Gogs Over GitHub:**
- **Minimal footprint**: Runs on 128MB RAM, works on Raspberry Pi
- **Instant setup**: Download binary, run it, done in 5 minutes
- **Zero complexity**: No moving parts, no complicated configuration
- **Cross-platform**: Works on any OS, including ARM devices

**Perfect For: Raspberry Pi, NAS, and Home Labs:**  
Gogs is famous for running on tiny hardware. Many developers run Gogs on their home NAS devices or Raspberry Pi clusters for personal projects, proving you don't need cloud infrastructure to host Git professionally.

**Key Features:**
- Git repository hosting via HTTP/HTTPS and SSH
- Issue tracking with labels and milestones
- Pull requests with basic code review
- Repository wiki
- User organizations
- Webhooks for external integrations
- OAuth2 authentication
- LDAP/Active Directory support

**What's Missing Compared to Gitea:**
- No built-in CI/CD (must use external services)
- No package registry
- Fewer project management features
- Smaller ecosystem of integrations
- Less active development (slower feature additions)

**Resource Requirements:**
- Minimum: 128MB RAM, 1 CPU core
- Recommended: 256MB RAM, 1 CPU core
- Database: SQLite, MySQL, PostgreSQL, MSSQL, or TiDB

**Setup Difficulty:**  
Extremely easy. Literally download one file and run it. Configuration is straightforward, and defaults work well for most use cases.

**When to Choose Gogs:**
- You're running on minimal hardware (Raspberry Pi, old laptop, NAS)
- You want the simplest possible Git hosting
- Your team is 1-5 people with basic needs
- You value stability over new features
- You don't need CI/CD, packages, or advanced project management

**When to Skip It:**
- You need CI/CD integration
- You want package/container hosting
- Your team needs Kanban boards and project planning tools
- You're likely to outgrow basic features soon (choose Gitea instead)

**Documentation:** [https://gogs.io/docs](https://gogs.io/docs)

---

### 4.5 SourceHut: Email-First Development Platform

SourceHut is fundamentally different from GitHub and its clones. It's a suite of modular services centered around email-based workflows, designed for developers who prefer command-line tools, patch-based contribution, and minimal web UI overhead.

**What It Is:**  
SourceHut provides Git hosting, mailing lists for patches and discussion, issue tracking, CI builds, and wiki—all designed to work primarily via email and command-line tools. It's Unix philosophy applied to code hosting: small, composable tools that do one thing well.

**Why Choose SourceHut Over GitHub:**
- **Email-first workflows**: Send patches via email, review via mailing lists
- **Scriptable and automatable**: Everything has a CLI and API
- **Minimal JavaScript**: Lightweight web UI that respects privacy
- **Modular services**: Use only what you need
- **No tracking, no analytics**: Privacy-respecting by design

**Learning Curve:**  
Steep for developers accustomed to GitHub. SourceHut expects you to be comfortable with `git send-email`, mailing lists, and terminal-based workflows. Budget time to learn if you're transitioning from web-first platforms.

**Notable Projects Using SourceHut:**
- **Alpine Linux**: A security-focused Linux distribution
- **Sway**: i3-compatible Wayland compositor
- Many other open-source projects that value email workflows

**Key Services:**
- **git.sr.ht**: Git repository hosting
- **hg.sr.ht**: Mercurial repository hosting
- **lists.sr.ht**: Mailing lists for patches and discussion
- **todo.sr.ht**: Issue tracking with email interface
- **builds.sr.ht**: CI service with build manifests
- **man.sr.ht**: Documentation hosting
- **paste.sr.ht**: Pastebin service

**Email-Based Workflow:**
Instead of creating pull requests on a website, you:
1. Clone the repository
2. Make changes and commit
3. Use `git send-email` to send patches to the project mailing list
4. Maintainers review and discuss via email replies
5. Once approved, maintainers apply the patch

This workflow scales well for projects with many contributors and preserves full context in email threads.

**CI/CD Integration:**  
SourceHut builds use YAML manifests that define tasks, triggers, and secrets. Builds run in isolated VMs with full root access, giving you more control than container-based CI systems.

**Resource Requirements:**  
Low. SourceHut services are lightweight and can run on modest hardware. Self-hosting requires more expertise than Gitea or Gogs due to multiple services.

**Hosting Options:**
- **Hosted (sr.ht)**: Free tier available, paid plans start at $5/user/month
- **Self-hosted**: All services are open source and can be deployed independently

**When to Choose SourceHut:**
- You prefer email-based code review workflows
- You want maximum scriptability and CLI access
- Your team is comfortable with command-line Git workflows
- Privacy and minimal JavaScript are important
- You value Unix philosophy and modular design

**When to Skip It:**
- Your team expects GitHub-style web UI workflows
- Contributors are new to Git and need visual interfaces
- You want all-in-one platform with project management
- Email-based workflows feel archaic to your team

**Documentation:** [https://man.sr.ht](https://man.sr.ht)

---

### 4.6 Codeberg: Community-Driven Nonprofit Hosting

Codeberg is not software—it's a hosted Gitea instance operated by Codeberg e.V., a German nonprofit organization. Think of it as a community-run alternative to GitHub, built on open-source principles and funded by donations rather than venture capital.

**What It Is:**  
Codeberg provides free Git hosting for open-source and open-data projects. It's Gitea under the hood, but the value proposition is the hosting model: nonprofit, privacy-respecting, community-governed, with no commercial tracking or data mining.

**Why Choose Codeberg Over GitHub:**
- **Nonprofit governance**: Not owned by a tech giant, not driven by profit
- **Privacy-respecting**: No tracking, no analytics, no data mining
- **Community-driven**: Decisions made by association members
- **Free hosting**: Unlimited repos, unlimited users, unlimited bandwidth
- **Transparency**: Operations documented publicly, budgets published

**Who Runs It:**  
Codeberg e.V. is a registered association (Verein) in Germany. It's funded by donations and memberships, with operations managed by volunteers. Think of it as the Wikimedia Foundation model applied to code hosting.

**Key Features:**  
Since Codeberg runs Gitea, you get all Gitea features:
- Git repository hosting
- Issue tracking and pull requests
- Project boards
- Package registry (for select formats)
- Webhooks and integrations
- Organizations and teams
- Wiki hosting

**What You Don't Get:**
- CI/CD (must use external services like Woodpecker CI)
- Commercial support (community forums only)
- SLA guarantees (best-effort uptime)
- Custom domains for hosted projects (use Codeberg Pages)

**Codeberg Pages:**  
Free static site hosting for documentation, project websites, and blogs. Similar to GitHub Pages but hosted on Codeberg infrastructure.

**Funding Model:**  
Codeberg operates on donations and membership fees. You can use it for free, but supporting memberships help ensure sustainability. This aligns incentives: Codeberg succeeds by serving users, not by monetizing data.

**Migrate Easily:**  
Codeberg's About page literally starts by explaining how to export your data and migrate away if you're unhappy. That's the kind of user-first approach that builds trust.

**When to Choose Codeberg:**
- You're hosting open-source projects and want free, ethical hosting
- You value privacy and nonprofit governance
- You want to avoid Microsoft, Google, and other tech giants
- You don't need CI/CD (or can integrate external CI)
- You want to support community-driven infrastructure

**When to Skip It:**
- You need self-hosted control (use Gitea instead)
- You require CI/CD out of the box
- You need commercial support or SLA
- Your project is proprietary (Codeberg is for public projects)

**Website:** [https://codeberg.org](https://codeberg.org)

---

### 4.7 Modern Alternatives Worth Watching

Beyond the established players, several newer platforms are innovating in the Git hosting space. These may not have the maturity or community size of GitLab or Gitea yet, but they're worth tracking if you value specific philosophies or features.

#### **Forgejo: Community-Governed Gitea Fork**

Forgejo (pronounced for-GAY-joe) is a hard fork of Gitea, created in response to concerns about Gitea Ltd.'s governance model. Forgejo prioritizes community governance and has committed to remaining independent from corporate control.

**Key Differences from Gitea:**
- Community-first governance with transparent decision-making
- Copyleft license commitment (ensuring future forks remain free)
- Slightly different feature priorities based on community votes

**When to Consider:** You like Gitea's features but prefer community governance over company-backed development.

**Status:** Active development, feature-compatible with Gitea, growing community.

**Website:** [https://forgejo.org](https://forgejo.org)

---

#### **OneDev: Built-In Code Intelligence**

OneDev is a self-hosted Git server with unique features like symbol search, code navigation, and built-in CI/CD with a visual pipeline editor. It's designed for performance and includes features typically found in commercial tools.

**Standout Features:**
- **Symbol navigation**: Jump to definitions across commits without setup
- **Regex code search**: Lightning-fast search powered by Lucene
- **Visual CI/CD editor**: Design pipelines with drag-and-drop
- **Customizable issue states**: Beyond simple open/closed workflows
- **Annotation of code with static analysis**: Security findings inline with diffs

**Resource Requirements:** Can run on 2-core, 2GB machines for medium projects.

**When to Consider:** You want advanced code search and navigation without paying for GitHub Enterprise or GitLab Ultimate.

**Status:** Actively maintained for 5+ years, stable and production-ready.

**Website:** [https://onedev.io](https://onedev.io)

---

#### **Radicle: Peer-to-Peer Code Collaboration**

Radicle is radically different: it's a peer-to-peer network for code collaboration built on Git. Instead of centralized servers, repositories are distributed across peer nodes, with cryptographic identities for authentication.

**Key Concepts:**
- **Decentralized**: No central authority, no single point of failure
- **Peer-to-peer**: Push and pull directly between developer machines
- **Self-sovereign identity**: Public-key cryptography for authorship
- **Censorship-resistant**: No server to shut down or block

**Workflow:**  
You still use Git commands, but repos are synchronized across a P2P network. Changes are signed cryptographically, creating verifiable authorship without a central server.

**When to Consider:** You're philosophically opposed to centralized code hosting and comfortable with P2P infrastructure.

**Status:** Active development, niche but passionate community, experimental for production use.

**Website:** [https://radicle.xyz](https://radicle.xyz)

---

### 4.8 Phabricator and Legacy Options

Phabricator was a comprehensive suite of development tools (code review, repository hosting, task tracking) created by Facebook and later spun out. It offered powerful code review workflows and monolithic integration of development tools.

**Status: Development Discontinued**  
In 2021, the Phabricator team announced they would no longer maintain the project. While the code remains available and some organizations still run it, official development has stopped.

**When to Consider Phabricator:**
- You already run Phabricator and migration is difficult
- You need powerful code review workflows and can maintain it yourself
- You're evaluating legacy enterprise tools with existing deployments

**Migration Path:**  
If you're on Phabricator, plan migration to GitLab CE, Gitea, or GitHub. Many organizations have documented migration processes.

**Other Legacy Options:**
- **RhodeCode**: Commercial Git/Mercurial/SVN hosting, still maintained but small community
- **Kallithea**: GPLv3 Git and Mercurial hosting, lightweight but minimal updates
- **Tuleap**: Full ALM platform including Git, heavier than modern alternatives

**General Advice on Legacy Platforms:**  
Check recent commit activity, release cadence, and community size before committing. Legacy platforms can have security vulnerabilities without active maintenance. If you're starting fresh, choose actively maintained projects like GitLab CE, Gitea, or Forgejo.

---

## 5. Feature Deep-Dive Comparison

Now that you know the platforms, let's compare how they handle specific features you'll rely on daily.

### 5.1 Repository Management and Branching Support

**Advanced Branch Protection (GitLab CE, BitBucket):**  
Both platforms offer fine-grained branch protection rules: required approvals, CI checks must pass, specific users or groups can merge, and no force pushes. GitLab CE lets you define protected branch patterns (e.g., `release/*`) and set different rules per pattern.

**Lightweight Repo Hosting (Gitea, Gogs):**  
Both provide standard Git features—branch creation, tag management, and basic protection rules. Gitea adds branch protection with required reviews and status checks. Gogs keeps it simple with basic access controls.

**Federation and Migration (Codeberg, SourceHut):**  
Codeberg (powered by Gitea) includes migration tools from GitHub, GitLab, and Gogs. SourceHut focuses on standard Git operations without vendor-specific features, making migration straightforward with `git clone` and `git push`.

**Winner for Advanced Features:** GitLab CE (most sophisticated permission models and automation)  
**Winner for Simplicity:** Gogs (basic protection, easy to understand)

**Sources:** [GitLab Docs](https://docs.gitlab.com), [Gitea Docs](https://docs.gitea.com/), [SourceHut Man Pages](https://man.sr.ht)

---

### 5.2 Pull Request / Merge Request Workflows

**Robust Review Workflows (GitLab CE, BitBucket):**  
GitLab CE provides merge request (MR) reviews with approval rules, pipeline integration, merge trains, and draft MRs. You can require multiple approvals, block merges if CI fails, and set up automatic rebasing. BitBucket offers similar pull request (PR) workflows with required reviewers, build status checks, and merge strategies.

**Standard PR Flows (Gitea, Gogs, Codeberg):**  
Gitea and Codeberg support pull requests with line-by-line comments, requested reviewers, and merge strategies (merge commit, squash, rebase). Gogs provides basic PR functionality with comments and manual merging.

**Email-First Patch Workflows (SourceHut):**  
Instead of PRs, SourceHut uses mailing lists. Contributors send patches via `git send-email`, maintainers review in their mail client, and apply patches with `git am`. This workflow is lightweight and preserves full discussion context in email threads.

**Winner for Team Collaboration:** GitLab CE (approval rules, pipeline integration)  
**Winner for Individual Control:** SourceHut (email-based, no web dependency)

**Sources:** [GitLab MR Docs](https://docs.gitlab.com), [Gitea PR Docs](https://docs.gitea.com/), [SourceHut Mailing List Guide](https://man.sr.ht)

---

### 5.3 Issue Tracking and Project Boards

**Integrated Trackers with Boards (GitLab CE, Codeberg, Gitea):**  
GitLab CE includes issue boards with list views (Kanban-style), issue weights, epics (paid tiers), and milestones. Gitea and Codeberg offer basic issue tracking with labels, assignees, milestones, and simple Kanban boards.

**Basic Issue Tracking (Gogs):**  
Gogs provides issues with labels, milestones, and comments. No project boards or advanced project management.

**External Trackers and Plain Text (SourceHut):**  
SourceHut's todo.sr.ht provides issue tracking via email and web UI. It's lightweight and integrates with mailing lists. You can also use plain-text files in repos for simple task tracking.

**Winner for Project Management:** GitLab CE (most sophisticated boards and workflows)  
**Winner for Simplicity:** Gogs or SourceHut (minimal overhead)

**Sources:** [GitLab Issue Boards](https://docs.gitlab.com), [Gitea Projects](https://docs.gitea.com/), [SourceHut Todo](https://man.sr.ht)

---

### 5.4 Built-In CI/CD and Runner Support

**First-Class CI/CD (GitLab CE):**  
GitLab CI/CD is mature, powerful, and integrated. Define pipelines in `.gitlab-ci.yml`, use shared or specific runners, and leverage parallel jobs, manual gates, and deployment environments. Runners auto-register, scale with Kubernetes, and support Docker, shell, and Kubernetes executors.

**Emerging CI/CD (Gitea Actions, BitBucket Pipelines):**  
Gitea Actions is GitHub Actions-compatible and improving rapidly. Define workflows in `.gitea/workflows/`, use GitHub's action ecosystem, and run on self-hosted or cloud runners. BitBucket Pipelines (cloud only) provides Docker-based CI/CD with caching and parallel steps.

**External Runners and Webhooks (Gogs, Codeberg):**  
Gogs and Codeberg rely on webhooks to trigger external CI systems like Jenkins, Drone, or Woodpecker. This keeps the platform lightweight but requires separate infrastructure.

**Modular Build Service (SourceHut):**  
SourceHut builds.sr.ht runs builds in isolated VMs based on YAML manifests. You get full root access, multiple OS options, and task-based workflows. It's powerful but requires understanding SourceHut's manifest format.

**Winner for Integration:** GitLab CE (most mature, fully integrated)  
**Winner for Flexibility:** SourceHut (full VM access, any OS)  
**Winner for Compatibility:** Gitea Actions (GitHub Actions compatible)

**Sources:** [GitLab CI/CD Docs](https://docs.gitlab.com), [Gitea Actions](https://docs.gitea.com/), [SourceHut Builds](https://man.sr.ht)

---

### 5.5 Package Registries and Container Support

**Comprehensive Registries (GitLab CE):**  
GitLab includes container registry (Docker), package registries for Maven, npm, PyPI, NuGet, Composer, Conan, and generic packages. All registries integrate with RBAC and CI/CD pipelines.

**Multi-Format Support (Gitea, Codeberg):**  
Gitea supports package registries for npm, Maven, PyPI, NuGet, RubyGems, Cargo, and container images. Codeberg (running Gitea) offers the same features.

**Limited or External Support (Gogs, SourceHut, BitBucket):**  
Gogs and SourceHut don't include package registries—use external hosting like Artifactory, Nexus, or cloud registries. BitBucket offers limited artifact storage but not full package registries.

**Winner for Built-In Support:** GitLab CE (most formats, best integration)  
**Winner for Lightweight Hosting:** Gitea (good format support without heavy footprint)

**Sources:** [GitLab Package Registry Docs](https://docs.gitlab.com), [Gitea Packages](https://docs.gitea.com/)

---

## 6. Hosting Models and Infrastructure Planning

Choosing between self-hosted and managed hosting is one of the most consequential decisions you'll make. Let's break down the trade-offs so you can match infrastructure to your needs.

### 6.1 Choosing Between Self-Hosted and Managed

**When Self-Hosting Makes Sense:**

✅ **Data sovereignty is critical:** Government agencies, healthcare, finance, or any regulated industry that can't store code in third-party clouds.

✅ **Cost efficiency at scale:** Once you pass 10-20 users, self-hosting infrastructure can be cheaper than per-user SaaS fees—especially if you already have DevOps capacity.

✅ **Customization requirements:** Need to modify the platform, integrate with internal systems, or enforce specific security policies not available in hosted plans.

✅ **Air-gapped environments:** Compliance or security requires fully isolated networks with no internet access.

✅ **Philosophical preference:** You want full ownership and control, or you distrust centralized platforms on principle.

**When Managed Hosting Makes Sense:**

✅ **Small team with limited DevOps:** You don't have dedicated infrastructure engineers and don't want operational overhead.

✅ **Startup speed matters:** Get up and running in minutes instead of hours or days configuring servers.

✅ **Unpredictable growth:** Managed platforms scale automatically; self-hosting requires capacity planning.

✅ **Want built-in backups and HA:** Hosted platforms handle redundancy, backups, and disaster recovery for you.

✅ **Cost-sensitive small teams:** For 1-5 users, hosted free tiers or cheap plans beat self-hosting TCO.

### 6.2 Self-Hosted vs Managed Comparison

**Control and Customization:**
- **Self-hosted:** Full control over configuration, integrations, data retention, and infrastructure. You can modify code, install plugins, and enforce any policy.
- **Managed:** Limited to platform-provided features and configurations. Some SaaS platforms allow custom domains and integrations, but deep customization is restricted.

**Operational Burden:**
- **Self-hosted:** You handle OS updates, security patches, database maintenance, backups, monitoring, and scaling. Expect 4-20+ hours per month depending on platform complexity and team size.
- **Managed:** Provider handles infrastructure, updates, backups, and uptime. You focus on using the platform, not maintaining it.

**Security Responsibility:**
- **Self-hosted:** You're responsible for securing servers, databases, access controls, and keeping software patched. Misconfiguration can expose your code and data.
- **Managed:** Provider secures infrastructure and platform. You manage application-level security (user permissions, SSH keys, etc.). Compliance certifications (SOC 2, ISO) are often handled by the provider.

**Cost Structure:**
- **Self-hosted:** Fixed infrastructure costs (servers, storage, bandwidth) plus variable ops time. Costs scale with resource usage, not user count.
- **Managed:** Per-user or per-repo pricing. Predictable monthly bills but can become expensive as teams grow.

**Uptime and Reliability:**
- **Self-hosted:** You manage uptime. Without HA setup, a single server failure means downtime. Achieving 99.9% uptime requires redundancy, monitoring, and on-call resources.
- **Managed:** Providers typically offer SLA guarantees (99.9%-99.99% uptime) with redundant infrastructure and 24/7 support.

**Data Ownership:**
- **Self-hosted:** Your data lives on your infrastructure. Full ownership and control.
- **Managed:** Data lives on provider's infrastructure. Terms of service govern access and usage. Export tools let you migrate data, but you don't control the hosting environment.

**See GitLab's documentation for detailed guidance on self-hosted vs hosted trade-offs:** [https://docs.gitlab.com](https://docs.gitlab.com)

---

### 6.3 Resource Requirements and Scalability Considerations

**Estimate Resources Based on Your Workload:**

**Small Team (1-10 developers, few CI jobs):**
- **Gitea/Gogs:** 512MB-1GB RAM, 1-2 CPU cores, 10-20GB storage
- **GitLab CE:** 4GB RAM, 2 CPU cores, 20GB storage
- **SourceHut:** 1-2GB RAM (distributed across services)

**Medium Team (10-50 developers, moderate CI):**
- **Gitea:** 2-4GB RAM, 2-4 CPU cores, 50-100GB storage
- **GitLab CE:** 8GB RAM, 4 CPU cores, 100-200GB storage
- **BitBucket Server:** 4-8GB RAM, 4 CPU cores, 100GB storage

**Large Team (50-200 developers, heavy CI/CD):**
- **GitLab CE:** 16GB+ RAM, 8+ CPU cores, 500GB-1TB storage
- Consider separating Git storage, database, and CI runners onto dedicated nodes

**Factors That Increase Resource Needs:**
- **Repository size:** Large monorepos or repos with Git LFS require more storage and memory for operations.
- **CI/CD usage:** Active pipelines consume CPU, RAM, and I/O. Each concurrent job needs resources on runners.
- **User count:** More users mean more API calls, web requests, and authentication overhead.
- **Package registries:** Storing Docker images or build artifacts rapidly consumes storage.

**Network Bandwidth Considerations:**
- **Frequent large pushes:** Teams that push large binaries or media files consume significant bandwidth.
- **CI artifact downloads:** Runners downloading dependencies and build artifacts can saturate network links.
- **Package registries:** Serving Docker images or npm packages to many clients requires bandwidth planning.

**Horizontal vs Vertical Scaling:**

**Vertical Scaling (add more resources to one server):**
- Simpler to manage, one server to maintain
- Works well for small-to-medium teams
- Eventually hits hardware limits (maximum CPU, RAM per machine)

**Horizontal Scaling (add more servers, distribute workload):**
- Required for large teams or high-traffic deployments
- Separate roles: web servers, Git storage, database, runners, object storage
- GitLab CE supports load-balanced multi-node deployments
- Requires shared storage (NFS, object storage) and load balancers

**When to Scale:**
- **CPU > 80% sustained:** Add cores or distribute load
- **Memory exhaustion:** Increase RAM or move services to dedicated nodes
- **Disk I/O wait > 30%:** Upgrade to SSDs or add storage performance
- **Runner queue backlog:** Add more CI runners or increase concurrency
- **Slow page loads:** Add web server capacity or enable caching

**Monitor These Metrics:**
- CPU and memory utilization
- Disk I/O and storage capacity
- Database query performance
- Git operation latency (clone, fetch, push times)
- CI job queue depth and wait times
- API response times

---

### 6.4 Backup, Monitoring, and High Availability Options

**Backup Strategy:**

**What to Back Up:**
- **Git repositories:** Full Git data including branches, tags, and LFS objects
- **Databases:** PostgreSQL, MySQL, or SQLite dumps including users, issues, merge requests
- **Configuration:** Application settings, secrets, and environment variables
- **Uploaded assets:** Avatars, issue attachments, release artifacts
- **CI/CD caches:** Optional, depending on recovery needs

**Backup Frequency:**
- **Daily full backups** for Git repositories and databases
- **Hourly incremental backups** for highly active systems
- **Continuous replication** for critical production environments

**Test Restores Regularly:**  
Backups are worthless if you can't restore from them. Schedule quarterly restore drills to verify backup integrity and practice disaster recovery procedures.

**Retention Policies:**
- Keep 7 daily backups
- Keep 4 weekly backups
- Keep 12 monthly backups (or per regulatory requirements)
- Store backups off-site (separate region, separate provider)

**Monitoring and Alerting:**

**Key Metrics to Monitor:**
- **System health:** CPU, RAM, disk space, network
- **Application metrics:** Request latency, error rates, response times
- **Database performance:** Query time, connection pool utilization
- **Git operations:** Clone/fetch/push latency
- **CI/CD:** Job queue depth, runner availability
- **Security:** Failed login attempts, API rate limiting

**Recommended Monitoring Stack:**
- **Prometheus + Grafana:** Time-series metrics and dashboards
- **ELK Stack (Elasticsearch, Logstash, Kibana):** Centralized log aggregation
- **Alertmanager:** Route alerts to Slack, PagerDuty, or email

**Alert on These Conditions:**
- Disk space < 10% free
- CPU > 90% for > 5 minutes
- Memory > 95%
- Database connections near max
- Failed backup jobs
- CI runner outages

**High Availability (HA) Configuration:**

**Components for HA:**
- **Load balancer:** Distribute traffic across multiple web nodes (HAProxy, Nginx, cloud LB)
- **Redundant web servers:** Multiple application servers for failover
- **Database replication:** Primary-replica setup with automatic failover (PostgreSQL streaming replication)
- **Shared storage:** NFS or object storage (S3, MinIO) for Git repositories and assets
- **Distributed CI runners:** Multiple runners across availability zones

**GitLab HA Reference Architecture:**  
GitLab publishes reference architectures for 1,000, 3,000, 5,000, and 10,000+ user deployments with detailed component specifications and configuration examples. See: [https://docs.gitlab.com/administration/reference_architectures/](https://docs.gitlab.com/administration/reference_architectures/)

**Testing HA:**
- Simulate node failures and verify automatic failover
- Test load balancer behavior when nodes go down
- Validate database replica promotion
- Verify runner auto-scaling during traffic spikes

**Disaster Recovery Planning:**
- Define Recovery Time Objective (RTO): How long can you be down?
- Define Recovery Point Objective (RPO): How much data can you afford to lose?
- Document failover procedures step-by-step
- Assign DR responsibilities and practice runbooks

---

### 6.5 Total Cost of Ownership Analysis

Let's break down realistic costs so you can compare self-hosted to managed hosting accurately.

**Self-Hosted Infrastructure Costs (Monthly Estimates):**

**Small Team (5-10 developers, Gitea or GitLab CE):**
- **VPS/Cloud VM:** $20-80 (2-4 CPU, 4-8GB RAM)
- **Managed Database:** $15-50 (PostgreSQL RDS or equivalent)
- **Object Storage:** $5-20 (50-200GB for repos and backups)
- **Bandwidth:** $10-30 (1-5TB transfer)
- **Monitoring/Tools:** $0-20 (Grafana Cloud free tier or self-hosted)
- **SSL Certificates:** $0 (Let's Encrypt) to $100 (commercial)
- **Backup Storage:** $5-15 (off-site backup storage)
- **Total Infrastructure:** **$55-$315/month**

**Operational Labor Costs:**
- **Time investment:** 4-10 hours/month (patching, monitoring, upgrades)
- **Labor cost (at $100/hour):** $400-1,000/month
- **Total with Labor:** **$455-$1,315/month**

**Medium Team (20-50 developers, GitLab CE with runners):**
- **VM instances:** $100-300 (web, workers, runners across 2-4 nodes)
- **Managed Database:** $50-150 (larger instance, replica)
- **Object Storage:** $20-80 (500GB-2TB)
- **Bandwidth:** $30-100 (5-15TB)
- **Load Balancer:** $20-50
- **Backup Storage:** $15-50
- **Total Infrastructure:** **$235-$730/month**

**Operational Labor:**
- **Time investment:** 15-30 hours/month
- **Labor cost:** $1,500-3,000/month
- **Total with Labor:** **$1,735-$3,730/month**

**Managed Hosting Costs (Monthly Estimates):**

**GitHub Team Plan (5-10 developers):**
- $4/user/month = $20-$40/month
- Plus: Actions minutes ($0.008/minute beyond free tier)
- Plus: Storage overages ($0.25/GB/month beyond 2GB)
- **Realistic total:** $50-$150/month (including overages)

**GitLab.com Premium (5-10 developers):**
- $29/user/month = $145-$290/month
- Includes: CI/CD minutes, storage, advanced features
- **Total:** $145-$290/month

**BitBucket Cloud Standard (5-10 developers):**
- $3/user/month = $15-$30/month
- Plus: Build minutes ($10/month for extra capacity)
- **Total:** $25-$60/month

**Codeberg (Open Source Projects):**
- Free for public projects, donation-supported
- **Total:** $0-$20/month (optional donations)

**Break-Even Analysis:**

For a **10-person team:**

| Option | Monthly Cost |
|--------|--------------|
| Self-hosted (Gitea, minimal ops) | $455-$890 |
| Self-hosted (GitLab CE, moderate ops) | $1,315-$2,240 |
| GitHub Team | $50-$150 |
| GitLab.com Premium | $290 |
| BitBucket Cloud Standard | $60 |
| Codeberg (free) | $0 |

**Conclusion:** For small teams (under 10 people), managed hosting is almost always cheaper when you factor in operational time. Self-hosting breaks even at 20-50+ users or when you have existing DevOps capacity.

**Hidden Costs to Consider:**
- Incident response time (middle-of-night outages)
- Upgrade complexity and downtime
- Security vulnerability management
- Compliance audit preparation
- Training new team members on self-hosted infrastructure

**Recalculate Annually:**  
Usage patterns, team size, and CI needs change. Revisit your TCO analysis every 12 months to ensure your hosting choice still makes sense.

**Use Cloud Pricing Calculators:**  
AWS Pricing Calculator, GCP Pricing Calculator, and Azure Pricing Calculator let you model infrastructure costs precisely. For exact hosted SaaS pricing, check vendor pricing pages: GitLab, GitHub, BitBucket.

---

## 7. Security, Compliance, and Governance

Security isn't optional. Whether you're hosting open-source side projects or enterprise applications, you need to lock down access, scan for vulnerabilities, and maintain audit trails.

### 7.1 Authentication, SSO, and Federation

**Enterprise Identity Integration:**

**SAML SSO:** GitLab CE, Gitea, and BitBucket support SAML 2.0 for single sign-on with identity providers like Okta, Auth0, Azure AD, and OneLogin. This centralizes authentication and enables seamless access management.

**LDAP/Active Directory:** Connect to existing directory services for user authentication and group synchronization. GitLab CE and Gitea sync users and teams automatically from LDAP/AD.

**OAuth and OpenID Connect:** All major platforms support OAuth2 for integration with external identity providers. Gitea can also act as an OAuth2 provider for other applications.

**SCIM Provisioning:** GitLab supports SCIM (System for Cross-domain Identity Management) for automated user lifecycle management—create, update, and deprovision users based on directory changes.

**Testing MFA Enforcement:**

Multi-factor authentication should be mandatory for all users, especially admins. Test enforcement by:
1. Enable MFA requirement in platform settings
2. Attempt login without MFA configured—should be blocked
3. Verify MFA backup codes work for account recovery
4. Test hardware token support (U2F, WebAuthn) if available

**Federation and External Providers:**

GitLab CE, Gitea, and BitBucket can federate with external identity providers, allowing users to log in with GitHub, Google, or other OAuth providers. This reduces friction for external contributors while maintaining security.

---

### 7.2 Access Controls, Permissions, and Audit Logs

**Role-Based Access Control (RBAC):**

Define roles with specific permissions:
- **Owner/Admin:** Full platform access, settings, user management
- **Maintainer:** Manage repos, merge requests, settings for specific projects
- **Developer:** Push code, create branches, submit merge requests
- **Reporter:** Read access, create issues, comment
- **Guest:** Minimal access, view public resources

**Granular Repository Permissions:**

GitLab CE and Gitea support fine-grained permissions:
- **Protected branches:** Require specific users or roles to merge
- **Tag protection:** Prevent unauthorized tag creation or deletion
- **Push rules:** Enforce commit message formats, prevent force pushes
- **Merge request approvals:** Require N approvals before merging

**Branch and Tag Protection:**

Enable rules to prevent destructive operations:
- Block force pushes to protected branches
- Require merge request approval before merge
- Restrict who can delete branches or tags
- Enforce CI pipeline success before merge

**Audit Logs:**

Comprehensive audit logs capture:
- User authentication events (login, logout, failed attempts)
- Repository operations (create, delete, push, clone)
- Settings changes (permissions, integrations, secrets)
- Merge request activity (approvals, merges)
- API access (who called which endpoints, when)

**Log Retention and Export:**

Set retention policies based on compliance requirements:
- **90 days** for development environments
- **1-3 years** for production (GDPR, SOX requirements)
- **7 years** for highly regulated industries (finance, healthcare)

Export logs to SIEM systems (Splunk, ELK) for centralized security monitoring and forensic analysis.

---

### 7.3 Security Scanning, Secret Detection, and Dependency Management

**Static Analysis and SAST:**

Integrate static application security testing (SAST) tools to catch vulnerabilities before merge:
- **GitLab CE:** Built-in SAST scanning with support for 15+ languages
- **Gitea/Gogs:** Integrate external tools via webhooks (SonarQube, CodeQL)
- **Pre-commit hooks:** Run linters and security checks locally before push

**Secret Detection:**

Prevent accidental credential commits:
- **GitLab CE:** Built-in secret detection that scans commits for API keys, passwords, tokens
- **External tools:** Integrate TruffleHog, Gitleaks, or detect-secrets via CI/CD
- **Frequency:** Scan on every push and pull request to catch secrets immediately

**Dependency Scanning and SCA:**

Detect known vulnerabilities in third-party packages:
- **Tools:** OWASP Dependency-Check, Snyk, Dependabot, npm audit, pip-audit
- **GitLab CE:** Native dependency scanning for multiple package managers
- **Automation:** Schedule daily scans for active projects, weekly for dormant repos
- **Enforcement:** Fail CI builds on high/critical vulnerabilities, create issues for triage

**Container and Image Scanning:**

If you build Docker images, scan for vulnerabilities:
- **Trivy:** Fast, accurate container scanning
- **Clair:** Open-source vulnerability scanner for containers
- **GitLab Container Scanning:** Built-in feature for Docker images

**Pipeline Enforcement:**

Make security non-negotiable:
- Fail builds on critical findings
- Require security team approval for exceptions
- Auto-create issues for new vulnerabilities
- Block deployment if security checks fail

**Example Security Pipeline (GitLab CI):**

```yaml
stages:
  - test
  - security
  - deploy

secret-detection:
  stage: security
  script:
    - gitleaks detect --source . --verbose
  allow_failure: false

dependency-scan:
  stage: security
  script:
    - safety check
  allow_failure: false

container-scan:
  stage: security
  script:
    - trivy image myapp:latest
  allow_failure: false
```

---

### 7.4 License Compliance and Legal Considerations

**Repository License Scanning:**

Detect licenses in your dependencies to avoid legal issues:
- **Tools:** SPDX identifiers, ScanCode Toolkit, FOSSology, LicenseFinder
- **GitLab CE:** Native license compliance scanning
- **Flags:** Identify GPL-incompatible licenses, commercial licenses, unknown licenses

**Policy Enforcement:**

Define allowed and prohibited licenses:
- **Allowed:** MIT, Apache 2.0, BSD, ISC
- **Review required:** LGPL, MPL
- **Prohibited:** AGPL, proprietary licenses (unless approved)

Automate checks in CI/CD to flag violations before merge.

**NOTICE and LICENSE Files:**

Require LICENSE files in all repositories to clarify terms:
- Enforce via branch protection or CI checks
- Include NOTICE files for attribution of third-party code
- Automate generation of third-party license reports for distribution

**Contributor License Agreements (CLA) and DCO:**

Protect project intellectual property:
- **CLA:** Legal agreement granting rights to use contributed code
- **DCO (Developer Certificate of Origin):** Simpler, sign-off on commits to certify authorship
- **Enforcement:** Require signed commits or CLA signatures via bots (CLA Assistant, DCO GitHub App)

**Bulk Codebase Analysis:**

For large projects or acquisitions, scan entire codebases for license compliance:
- **ScanCode:** Comprehensive license detection
- **FOSSology:** Open-source compliance tool
- **Black Duck:** Commercial solution for large-scale scanning

**Recommended Security and Compliance Schedule:**

| Task | Frequency |
|------|-----------|
| Audit log retention check | Quarterly |
| Dependency scan (active projects) | Daily |
| Dependency scan (dormant projects) | Weekly |
| Secret scan | Every push/PR |
| License scan | On dependency updates |
| Container scan | Every build |
| Security patch review | Weekly |
| Penetration testing | Annually |

**Sources:**  
- OWASP Dependency-Check: [https://owasp.org/www-project-dependency-check/](https://owasp.org/www-project-dependency-check/)
- SPDX Specification: [https://spdx.dev/](https://spdx.dev/)
- Trivy Container Scanner: [https://aquasecurity.github.io/trivy/](https://aquasecurity.github.io/trivy/)

---

## 8. Migration Planning Guide

Migrating from GitHub to a self-hosted alternative requires careful planning. Let's walk through a systematic approach that preserves history, metadata, and workflow continuity.

### 8.1 Quick Migration Checklist

Before diving into detailed migration steps, here's a one-page checklist you can follow:

**Pre-Migration (1-2 weeks before):**
1. ☐ Inventory all repositories, teams, and integrations
2. ☐ Choose target platform and provision infrastructure
3. ☐ Test migration process with 2-3 non-critical repos
4. ☐ Document current CI/CD pipelines and secrets
5. ☐ Communicate migration timeline to team

**Migration Day:**
1. ☐ Freeze write access to source repositories
2. ☐ Execute repository migration (Git data + LFS)
3. ☐ Import issues, pull requests, and metadata
4. ☐ Recreate CI/CD pipelines on target platform
5. ☐ Validate commit history, tags, and branches

**Post-Migration (1-2 weeks after):**
1. ☐ Run validation checks (commit counts, issue links)
2. ☐ Test CI/CD pipelines end-to-end
3. ☐ Update team documentation and runbooks
4. ☐ Monitor for issues and gather team feedback
5. ☐ Keep fallback access to source platform for 30 days

---

### 8.2 Pre-Migration Inventory and Repository Audit

**Catalog Your Assets:**

**Repositories:**
- List all repositories (public, private, archived)
- Record sizes (use `git count-objects -vH` or platform API)
- Note which repos use Git LFS
- Identify last commit dates and activity levels
- Flag monorepos or repos with unusual configurations

**Example inventory CSV:**
```
repo_name,size_gb,lfs,last_commit,active_branches,status
api-backend,2.3,yes,2025-01-05,12,active
frontend-app,0.8,no,2024-12-20,8,active
legacy-tool,5.1,yes,2023-08-15,3,archived
```

**Collaborators and Teams:**
- Export user lists and permission levels
- Map GitHub teams to equivalent groups on target platform
- Document external contributors (need to be re-invited)
- Identify org owners, admins, and maintainers

**Integrations and Secrets:**
- List CI/CD integrations (GitHub Actions, CircleCI, etc.)
- Catalog webhooks (Slack, Jira, monitoring tools)
- Document deploy keys and SSH keys
- Inventory secrets and environment variables (don't export plaintext!)
- Note third-party apps with OAuth access

**Repository Health Assessment:**
- Count active branches (many stale branches = cleanup opportunity)
- Count open pull requests (need migration or closure)
- Identify stale branches (no commits in 6+ months)
- Check for large binary files that should be in LFS

**Licenses and Contributor Agreements:**
- Verify LICENSE files exist in all repos
- Document CLA or DCO requirements
- Ensure contributor agreements are portable

**Automated Inventory Tools:**

Use GitHub APIs or tools like `gh` CLI:
```bash
# List all repos with sizes
gh repo list --limit 1000 --json name,diskUsage,updatedAt

# Export collaborators
gh api /orgs/YOUR_ORG/members --paginate
```

For GitLab imports, see: [GitLab Import Documentation](https://docs.gitlab.com/ee/user/project/import/)

---

### 8.3 Repository Import Tools and Metadata Preservation

**Preserve Full Git History:**

**Mirror Clone and Push:**
The most reliable method to preserve complete Git history:

```bash
# Mirror clone (includes all branches, tags, refs)
git clone --mirror https://github.com/user/repo.git

cd repo.git

# Push to new remote
git push --mirror https://gitea.example.com/user/repo.git
```

This preserves:
- All commits with original timestamps and authors
- All branches (including remote-tracking branches)
- All tags (lightweight and annotated)
- All refs (including pull request refs if accessible)

**Platform Import Tools:**

Most platforms provide built-in importers:

**GitLab Import:**
- Supports GitHub, GitLab.com, Bitbucket, and generic Git repos
- Migrates repos, issues, pull requests, releases, and wikis
- Use via web UI or API
- Preserves issue numbers and references

**Gitea Import:**
- Supports GitHub, GitLab, Gogs, and generic Git
- Migrates repos, issues, pull requests, labels, milestones
- Use via web UI: Repository → New Migration
- Maintains issue IDs and cross-references

**SourceHut Import:**
- Basic Git import via `git push`
- Manual recreation of issues and wikis (or script via API)
- Mail-based workflows don't map 1:1 to issues

**Handling Git LFS:**

If your repos use Git LFS, export and import LFS objects:

```bash
# In source repo
git lfs migrate export --include="*.psd,*.zip,*.bin" --everything

# Push to new remote
git push --mirror https://new-platform.com/repo.git

# Import LFS objects
git lfs migrate import --include="*.psd,*.zip,*.bin" --everything
```

Verify LFS objects transferred with `git lfs ls-files`.

**Preserve Commit Authorship:**

Ensure commit author emails match users on the target platform:
- If email addresses differ, create a mapping file
- Use `git filter-repo` to rewrite author info if needed (last resort)
- Test on a clone before rewriting production repos

**Transfer Tags and Releases:**

Mirror pushes automatically transfer tags. For releases:
- Export release assets via GitHub API
- Upload to target platform via API or web UI
- Maintain release notes and version numbers

**Example GitHub release export:**
```bash
# Get releases
gh release list --repo user/repo

# Download assets
gh release download v1.0.0 --repo user/repo
```

Re-upload to target platform manually or via API.

**Sources:**  
- Git LFS Migration: [https://github.com/git-lfs/git-lfs/wiki/Tutorial](https://github.com/git-lfs/git-lfs/wiki/Tutorial)
- GitLab Import: [https://docs.gitlab.com/ee/user/project/import/](https://docs.gitlab.com/ee/user/project/import/)
- Gitea Import: [https://docs.gitea.com//en-us/migrations-interfaces/](https://docs.gitea.com//en-us/migrations-interfaces/)

---

### 8.4 Handling Issues, Pull Requests, and CI Pipelines

**Migrate Issues and Pull Requests:**

**Platform Importers (Preferred):**
- GitLab and Gitea include GitHub importers that preserve issues, PRs, comments, labels, and milestones
- Imports maintain issue numbering to preserve cross-references
- Comments include original timestamps and authors (mapped to target platform users)

**Third-Party Tools (If Native Import Unavailable):**
- **node-gitlab-2-github**: Migrate from GitLab to GitHub
- **github-to-gitlab**: Python script for GitHub → GitLab
- Custom scripts using platform APIs

**Manual Migration Steps:**
1. Export issues via GitHub API (`/repos/{owner}/{repo}/issues`)
2. Map labels and milestones to target platform equivalents
3. Import via target platform API, preserving timestamps
4. Update issue references in commit messages (if IDs change)

**Preserve Context and References:**
- Include original issue URLs in migrated issues for traceability
- Map GitHub usernames to target platform usernames
- Preserve @mentions and cross-references where possible

**Port CI/CD Pipelines:**

**Convert Pipeline Definitions:**

Different platforms use different CI/CD formats:

| Source | Target | Conversion |
|--------|--------|------------|
| GitHub Actions | GitLab CI | Rewrite `.github/workflows/*.yml` to `.gitlab-ci.yml` |
| GitHub Actions | Gitea Actions | Minimal changes, mostly compatible |
| GitHub Actions | External CI | Convert to Jenkinsfile, .drone.yml, etc. |

**Key Translation Tasks:**
- Map job triggers (push, PR, schedule)
- Convert environment variable syntax
- Translate caching mechanisms
- Adjust secrets management

**Example Conversion (GitHub Actions to GitLab CI):**

**GitHub Actions:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
```

**GitLab CI:**
```yaml
stages:
  - test

test:
  stage: test
  image: node:latest
  script:
    - npm install
    - npm test
  only:
    - merge_requests
    - main
```

**Recreate Runners and Agents:**

- Install and register self-hosted runners on target platform
- Match runner tags to job requirements (e.g., `docker`, `linux`, `gpu`)
- Configure runner executors (Docker, shell, Kubernetes)
- Set resource limits and concurrency

**Reconfigure Secrets:**

**Never copy secrets in plaintext!**  
Instead:
1. List required secrets from source platform
2. Retrieve secret values from secure vault or env files
3. Add secrets to target platform's secrets manager
4. Update pipeline references to new secret names

**Test Pipelines Before Production:**

Create a sandbox repository on target platform:
1. Import a representative repo with CI/CD
2. Run pipelines end-to-end
3. Verify builds, tests, and deployments succeed
4. Fix any issues before migrating production repos

---

### 8.5 Testing Migration and Rollback Strategies

**Test Migrations End-to-End:**

**Dry Run on Non-Critical Repos:**

Select 2-3 repositories with varied characteristics:
- **High-traffic repo:** Tests performance and integration under load
- **Low-traffic repo:** Validates basic functionality
- **CI-heavy repo:** Ensures CI/CD translation works

Perform full migration workflow:
1. Clone and import Git data
2. Migrate issues and PRs
3. Convert and test CI/CD
4. Validate access controls and permissions

**Validation Checklist:**

Compare source and target platforms:
- ☐ Commit count matches (`git rev-list --count --all`)
- ☐ All branches exist (`git branch -a`)
- ☐ All tags present (`git tag`)
- ☐ Issue count and numbers match
- ☐ Labels and milestones migrated
- ☐ CI/CD pipelines run successfully
- ☐ Release assets accessible

**Integrity Checks:**

Run checksums to validate data integrity:
```bash
# Compare commit hashes
git rev-list --all | sha256sum

# Compare on source and target—should match
```

Check that references are intact:
- Issue links in commit messages resolve correctly
- Cross-repo references work
- Documentation links updated

**Rollback and Cutover Planning:**

**Freeze Window:**

Schedule a maintenance window for final sync:
- Announce freeze period to team (typically 2-6 hours)
- Disable push access to source repositories
- Perform final incremental sync
- Switch DNS or update remote URLs

**Fallback Plan:**

Prepare to revert to source platform if critical issues arise:
- Keep source platform accessible for 30-72 hours post-migration
- Document rollback steps (update DNS, restore write access)
- Assign rollback decision authority (who can call for rollback)
- Define rollback triggers (e.g., CI fails for 2+ hours, data loss detected)

**Post-Migration Verification:**

After cutover, validate immediately:
1. Run automated checks (commit counts, CI pipelines)
2. Verify issue link integrity
3. Test release asset availability
4. Confirm team can push, merge, and deploy
5. Monitor error logs and user reports

**Communication Plan:**

Keep team informed throughout:
- **T-2 weeks:** Announce migration, provide training
- **T-1 week:** Dry run results, final timeline
- **T-1 day:** Reminder, freeze window details
- **Migration day:** Real-time updates, point of contact
- **T+1 day:** Post-mortem, lessons learned

**Sources:**  
- GitHub Migration Tools: [https://docs.github.com/en/migrations](https://docs.github.com/en/migrations)
- GitLab Backup and Restore: [https://docs.gitlab.com/raketasks/backup_restore/](https://docs.gitlab.com/raketasks/backup_restore/)

---

## 9. CI/CD, Integrations, and Developer Workflows

Once your Git hosting is set up, you need to make it productive. Let's configure CI/CD runners, integrate with your tools, and establish efficient workflows.

### 9.1 Setting Up Runners, Autoscaling, and Executors

**Choose the Right Executor:**

**Docker Executor:**
- Runs each job in a fresh Docker container
- Pros: Isolation, reproducible environments, caching
- Cons: Requires Docker on runner host
- Best for: Most use cases, especially web apps and services

**Shell Executor:**
- Runs jobs directly on the runner host's shell
- Pros: Simple, no container overhead, full host access
- Cons: No isolation, requires manual dependency management
- Best for: Legacy scripts, system administration tasks

**Kubernetes Executor:**
- Runs jobs as Kubernetes pods
- Pros: Native auto-scaling, cloud-native, excellent resource efficiency
- Cons: Requires K8s cluster, more complex setup
- Best for: Large-scale deployments, teams already on Kubernetes

**Configuring Runners:**

**GitLab Runner Setup:**
```bash
# Install runner
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt install gitlab-runner

# Register runner
sudo gitlab-runner register \
  --url https://gitlab.example.com \
  --registration-token YOUR_TOKEN \
  --executor docker \
  --docker-image alpine:latest \
  --description "Docker runner"
```

**Gitea Actions Runner Setup:**
```bash
# Download Gitea Actions runner
wget https://gitea.com/gitea/act_runner/releases/download/v0.2.0/act_runner-linux-amd64

# Register
./act_runner register --instance https://gitea.example.com --token YOUR_TOKEN

# Run
./act_runner daemon
```

**Runner Tags and Assignment:**

Tag runners by capability to route jobs appropriately:
- `docker`: Docker executor
- `linux`, `windows`, `macos`: OS-specific jobs
- `gpu`: GPU-enabled runners for ML workloads
- `large-memory`: High-RAM runners for heavy builds

In pipeline config, specify required tags:
```yaml
test:
  tags:
    - docker
    - linux
  script:
    - npm test
```

**Autoscaling Runners:**

**Kubernetes Auto-Scaling:**
- Use Kubernetes Cluster Autoscaler
- Runner pods scale based on job queue depth
- Nodes added/removed based on resource requests

**Cloud Auto-Scaling (AWS, GCP, Azure):**
- GitLab Runner supports auto-scaling with cloud providers
- Spin up VM instances on-demand for jobs
- Shut down idle instances to save costs

**Example Auto-Scaling Config (GitLab Runner + AWS):**
```toml
[[runners]]
  name = "autoscale-runner"
  executor = "docker+machine"
  
  [runners.machine]
    IdleCount = 1
    IdleTime = 600
    MaxBuilds = 10
    MachineDriver = "amazonec2"
    MachineName = "gitlab-runner-%s"
    MachineOptions = [
      "amazonec2-instance-type=t3.medium",
      "amazonec2-region=us-east-1",
    ]
```

**Harden Runners for Security:**

**Run Builds in Ephemeral Containers:**
- Fresh containers for each job prevent state leakage
- Destroy containers after job completion

**Restrict Privileged Mode:**
- Avoid `--privileged` Docker flag unless necessary
- Use specific capabilities instead (e.g., `--cap-add=NET_ADMIN`)

**Rotate Runner Tokens Regularly:**
- Re-register runners quarterly or after security events
- Revoke old tokens to prevent unauthorized access

**Monitoring Runner Health:**

Track key metrics:
- **Job queue depth:** How many jobs waiting?
- **Runner utilization:** CPU, memory, disk on runner hosts
- **Job wait time:** Time from job submission to start
- **Job failure rate:** Percentage of jobs failing

Set alerts:
- Queue depth > 50 jobs (need more runners)
- Job wait time > 5 minutes (scaling issues)
- Runner offline > 10 minutes (infrastructure problem)

**Sources:**  
- GitLab Runner Docs: [https://docs.gitlab.com/runner/](https://docs.gitlab.com/runner/)
- GitHub Actions Self-Hosted Runners: [https://docs.github.com/en/actions/hosting-your-own-runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- Kubernetes Cluster Autoscaler: [https://github.com/kubernetes/autoscaler](https://github.com/kubernetes/autoscaler)

---

### 9.2 Integrating With Common Tools (Slack, Jira, Terraform)

**Slack Integration:**

**Incoming Webhooks:**
Most Git platforms support outgoing webhooks to push events to Slack:

1. Create Slack webhook URL (Slack App or Incoming Webhook)
2. Add webhook in Git platform settings
3. Configure triggers: pipeline failures, MR approvals, deployments

**Example Events to Send to Slack:**
- ❌ Failed pipeline runs → `#alerts` channel
- ✅ Successful deployments → `#deployments` channel
- 🔄 Merge requests opened → `#code-review` channel
- ⚠️ Security scan findings → `#security` channel

**Avoid Notification Overload:**
- Only send failures and important events
- Use thread replies for related updates
- Mute noisy repos or configure per-repo channels

**Jira Integration:**

**Link Commits to Issues:**

Most platforms can parse Jira issue keys (e.g., `PROJ-123`) in commit messages:
- Link commits to Jira issues automatically
- Display commit activity in Jira issue view
- Enable traceability from code to requirement

**Example Commit Message:**
```
PROJ-456: Add user authentication feature

Implement OAuth2 authentication flow
```

Jira will link this commit to issue PROJ-456.

**Automate Issue Transitions:**

Trigger Jira workflow transitions on Git events:
- Open PR → Move issue to "In Review"
- Merge PR → Move issue to "Done"
- Deploy to production → Move issue to "Released"

**BitBucket and Jira:**  
Native integration with automatic linking, smart commits, and deep workflow automation. If you're already on Jira, BitBucket is the natural choice.

**Terraform Integration:**

**Remote State Management:**

Store Terraform state in secure remote backends:
- **Terraform Cloud:** Managed remote state with locking
- **S3 + DynamoDB:** AWS-based state with locking table
- **Azure Blob + Lock:** Azure equivalent
- **GitLab Terraform Backend:** Built-in state backend in GitLab

**Example S3 Backend:**
```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

**CI/CD for Infrastructure as Code:**

Automate Terraform workflows in CI/CD:

```yaml
stages:
  - validate
  - plan
  - apply

terraform-validate:
  stage: validate
  script:
    - terraform init
    - terraform validate

terraform-plan:
  stage: plan
  script:
    - terraform init
    - terraform plan -out=plan.tfplan
  artifacts:
    paths:
      - plan.tfplan

terraform-apply:
  stage: apply
  script:
    - terraform init
    - terraform apply plan.tfplan
  when: manual
  only:
    - main
```

**Secure Secrets Management:**

Never store Terraform secrets in Git:
- Use CI/CD platform's secret management
- Use HashiCorp Vault for centralized secrets
- Use cloud provider secret managers (AWS Secrets Manager, Azure Key Vault)

**Sources:**  
- Slack API Docs: [https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)
- Atlassian Jira Integrations: [https://www.atlassian.com/software/jira/integrations](https://www.atlassian.com/software/jira/integrations)
- Terraform Backend Configuration: [https://developer.hashicorp.com/terraform/language/backend](https://developer.hashicorp.com/terraform/language/backend)

---

### 9.3 Built-In vs External CI Systems

**Evaluate Trade-Offs:**

**Built-In CI/CD:**

**Pros:**
- Tight integration with code hosting (single UI, unified permissions)
- Simpler user management (one set of credentials)
- Built-in artifact storage and registry
- Lower operational overhead (one platform to maintain)

**Cons:**
- Platform lock-in (harder to switch later)
- Limited to platform's CI features and performance
- May not scale as well as specialized CI tools

**Best for:**
- Teams that value simplicity and unified workflows
- Self-hosted platforms (GitLab CE, Gitea) where hosting one additional service is easy
- Projects with moderate CI/CD needs

**External CI/CD:**

**Pros:**
- Specialized features (e.g., advanced parallelism, matrix builds)
- Centralized CI across multiple Git hosts
- Best-in-class performance and scalability
- Easier to migrate Git hosting without changing CI

**Cons:**
- Additional operational overhead (separate service to maintain)
- Complex authentication setup (SSH keys, OAuth, API tokens)
- Separate UIs for code and CI (context switching)

**Best for:**
- Organizations with existing CI infrastructure (Jenkins, CircleCI)
- Teams needing advanced CI features not available in Git platform
- Multi-repo or multi-platform setups

**Popular External CI Tools:**

- **Jenkins:** Self-hosted, highly customizable, vast plugin ecosystem
- **CircleCI:** Cloud-hosted, excellent parallelism, Docker-native
- **Buildkite:** Hybrid (cloud control plane, self-hosted agents)
- **Drone:** Lightweight, container-native, open-source
- **Woodpecker CI:** Drone fork with community governance

**Align with Compliance Needs:**

Some organizations require air-gapped CI/CD (no external SaaS):
- Self-hosted GitLab CI or Jenkins
- Egress controls to prevent data leakage
- Dedicated CI infrastructure in secure networks

**Sources:**  
- GitLab CI Docs: [https://docs.gitlab.com/ci/](https://docs.gitlab.com/ci/)
- Jenkins Documentation: [https://www.jenkins.io/doc/](https://www.jenkins.io/doc/)
- Buildkite Docs: [https://buildkite.com/docs](https://buildkite.com/docs)

---

### 9.4 Workflow Templates and Automation Best Practices

**Create Reusable Pipeline Templates:**

Define common job patterns once, reuse everywhere:

**GitLab CI Template Example:**
```yaml
.test-template:
  stage: test
  script:
    - npm install
    - npm test
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/

# Use template
test-frontend:
  extends: .test-template
  only:
    - merge_requests
```

**Require Templates for Protected Branches:**

Enforce consistent quality standards:
- Define templates for lint, test, security scans
- Require inclusion in all repos
- Use branch protection to block merge without passing checks

**Merge Request Templates:**

Capture review context with MR templates:

**Example `.gitlab/merge_request_templates/default.md`:**
```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
```

**Cache Dependencies:**

Speed up builds by caching:
- **npm/Yarn:** `node_modules/`
- **pip:** `.cache/pip/`
- **Maven:** `.m2/repository/`
- **Docker layers:** Use layer caching or registries

**Example Caching (GitLab CI):**
```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/
```

**Parallelize Tests:**

Run tests concurrently for faster feedback:

**Matrix Builds:**
```yaml
test:
  parallel:
    matrix:
      - OS: [ubuntu, macos, windows]
        NODE_VERSION: [14, 16, 18]
  script:
    - npm test
```

Runs 9 jobs in parallel (3 OS × 3 versions).

**Enforce Branch Protections:**

Prevent regressions with protection rules:
- ☑️ Require passing CI pipelines before merge
- ☑️ Require N approvals from code owners
- ☑️ Block force pushes to protected branches
- ☑️ Require signed commits

**Store Secrets Securely:**

Never hardcode credentials in pipelines:
- Use platform secret management (GitLab CI/CD variables, GitHub Secrets)
- Mark secrets as "masked" to prevent accidental logging
- Use "protected" secrets for production-only access
- Rotate secrets regularly and on compromise

**Automate Versioning:**

Generate versions and changelogs automatically:

**Semantic Versioning with Conventional Commits:**
```bash
# Install semantic-release
npm install --save-dev semantic-release

# In CI/CD
npx semantic-release
```

This reads commit messages (e.g., `feat:`, `fix:`) and auto-bumps versions, generates changelogs, and creates releases.

**Sources:**  
- GitLab CI/CD Best Practices: [https://docs.gitlab.com/ci/pipelines/pipeline_efficiency/](https://docs.gitlab.com/ci/pipelines/pipeline_efficiency/)
- Semantic Release: [https://semantic-release.gitbook.io/](https://semantic-release.gitbook.io/)

---

## 10. Performance, Maintenance, and Scalability

Running a Git hosting platform isn't "set it and forget it." You need to tune performance, automate maintenance, and plan for growth.

### 10.1 Database, Storage, and Caching Tuning

**Database Performance Tuning:**

**PostgreSQL (Recommended for GitLab CE, Gitea):**

Tune shared buffers and cache:
```ini
# postgresql.conf
shared_buffers = 2GB          # 25% of RAM
effective_cache_size = 6GB    # 50-75% of RAM
maintenance_work_mem = 512MB
work_mem = 16MB
```

Enable query logging for slow queries:
```ini
log_min_duration_statement = 1000  # Log queries over 1 second
```

**MySQL/MariaDB (Alternative for Gitea, Gogs):**

Increase buffer pool:
```ini
# my.cnf
innodb_buffer_pool_size = 4G  # 60-70% of RAM
innodb_log_file_size = 512M
max_connections = 500
```

**Storage Optimization:**

**Use SSDs for Git Data:**  
Solid-state drives dramatically reduce clone and fetch latency. Git operations are I/O-intensive; SSDs provide 10-100x faster random access.

**Repository Housekeeping:**

Run periodic `git gc` to compact repositories:
```bash
# In repository directory
git gc --aggressive --prune=now
```

This reduces loose objects and optimizes pack files.

**Distributed Object Storage:**

For large-scale deployments, use object storage:
- **S3 or compatible (MinIO):** Store Git LFS objects and artifacts
- **Enable read caching:** Cache frequently accessed objects locally
- **Separate metadata and large files:** Keep Git repos on fast storage, LFS on cheap object storage

**Caching Layer:**

**Redis or Memcached:**

Cache sessions, API responses, and frequently accessed data:
- **Redis:** Persistent cache, pub/sub, advanced data structures
- **Memcached:** Simpler, faster for pure key-value caching

**Example Redis Configuration (GitLab):**
```ruby
# gitlab.rb
gitlab_rails['redis_host'] = "127.0.0.1"
gitlab_rails['redis_port'] = 6379
```

Set eviction policies to prevent OOM:
```
maxmemory 2gb
maxmemory-policy allkeys-lru
```

**Connection Pooling:**

Avoid connection exhaustion with pooling:
- **PgBouncer** for PostgreSQL: Multiplexes connections efficiently
- Configure pool size based on expected load (100-500 connections typical)

**Monitor Slow Queries:**

Identify performance bottlenecks:
```sql
-- PostgreSQL: Top 10 slowest queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

Add indexes for frequent JOINs on issue and PR tables.

**Sources:**  
- PostgreSQL Performance Tuning: [https://www.postgresql.org/docs/current/runtime-config.html](https://www.postgresql.org/docs/current/runtime-config.html)
- MariaDB Optimization: [https://mariadb.com/kb/en/optimization-and-tuning/](https://mariadb.com/kb/en/optimization-and-tuning/)

---

### 10.2 Automated Backups, Upgrades, and Maintenance Windows

**Backup Strategy:**

**Daily Database Logical Backups:**
```bash
#!/bin/bash
# Backup PostgreSQL database
pg_dump -U gitlab gitlabhq_production | gzip > /backups/gitlab_db_$(date +%Y%m%d).sql.gz

# Backup Git repositories
tar czf /backups/gitlab_repos_$(date +%Y%m%d).tar.gz /var/opt/gitlab/git-data
```

**Hourly Incremental File-System Snapshots:**

Use LVM snapshots, ZFS, or cloud provider snapshots:
```bash
# LVM snapshot example
lvcreate -L 10G -s -n gitlab_snap /dev/vg0/gitlab_lv
```

**Point-in-Time Recovery (PITR) for PostgreSQL:**

Archive WAL logs for recovery:
```ini
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'
```

This allows restoring to any point in time, not just backup snapshots.

**Automate Full-Platform Backups:**

Include everything needed to restore:
- Git repositories and LFS objects
- Database dumps
- Configuration files (`/etc/gitlab/`, `/etc/gitea/`)
- CI caches and build artifacts
- Uploaded attachments and avatars

**Verify Restores Monthly:**

Backups are worthless if you can't restore:
1. Spin up test environment
2. Restore from latest backup
3. Validate data integrity (repos, issues, users)
4. Document restore time (RTO)

**Rolling Upgrades:**

Minimize downtime during updates:
1. Test upgrades on staging environment first
2. Schedule during low-activity windows (weekends, late night)
3. Announce maintenance window to team (1-2 weeks notice)
4. Use blue-green deployment or rolling restarts where possible
5. Keep previous version available for quick rollback

**Example Upgrade Process (GitLab):**
```bash
# Backup before upgrade
gitlab-backup create

# Upgrade GitLab
apt update
apt install gitlab-ce

# Run migrations
gitlab-ctl reconfigure
gitlab-rake db:migrate
```

**Maintenance Windows:**

Implement maintenance mode for disruptive changes:
- Enable read-only mode for schema migrations
- Display banner notifying users of maintenance
- Use feature flags to gradually roll out new features
- Test in canary environment before full deployment

**Automated Patching:**

Automate OS and package updates:
```bash
# Unattended upgrades (Ubuntu/Debian)
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

Exclude high-risk changes (kernel, database) from auto-patching—test manually first.

**Rollback Playbook:**

Document step-by-step rollback procedures:
1. Stop application services
2. Restore database from pre-upgrade backup
3. Restore Git repositories (if needed)
4. Downgrade application packages
5. Restart services and validate

Assign rollback owner and test procedures quarterly.

---

### 10.3 Monitoring, Logging, and Performance Troubleshooting

**Key Metrics to Monitor:**

**System Metrics:**
- CPU utilization (alert if >80% sustained)
- Memory usage (alert if >90%)
- Disk space (alert if <10% free)
- Disk I/O wait time (alert if >30%)
- Network bandwidth usage

**Application Metrics:**
- HTTP request latency (p50, p95, p99)
- Error rate (5xx responses)
- Database query time (slow query threshold: 1 second)
- Git operation duration (clone, fetch, push)
- CI job queue depth and wait times

**Business Metrics:**
- Active users per day/week
- Repository count and growth rate
- Merge request throughput
- CI/CD job success rate
- API call volume

**Monitoring Stack Setup:**

**Prometheus + Grafana (Recommended):**

Install Prometheus:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'gitlab'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

GitLab and Gitea expose Prometheus metrics by default. Configure Grafana dashboards to visualize:
- Request rates and latency
- Resource utilization
- Git operation performance

**Centralized Logging (ELK Stack):**

Aggregate logs from all components:
1. **Elasticsearch:** Store and index logs
2. **Logstash:** Parse and transform logs
3. **Kibana:** Visualize and search logs

Collect logs from:
- Application logs (GitLab, Gitea, etc.)
- Web server logs (Nginx, Apache)
- System logs (syslog, journald)
- CI runner logs

**Alerting Configuration:**

Set up alerts via Alertmanager (Prometheus) or ElastAlert:

**Critical Alerts (PagerDuty/SMS):**
- Services down
- Disk space <5%
- Database unreachable
- Critical security events

**Warning Alerts (Slack/Email):**
- CPU >80% for >10 minutes
- Memory >85%
- Disk space <15%
- Elevated error rates
- Backup job failures

**Distributed Tracing:**

For complex deployments, implement tracing:
- **Jaeger or Zipkin:** Trace requests across services
- Identify slow endpoints and bottlenecks
- Understand microservice dependencies

**Performance Troubleshooting:**

**Slow Git Operations:**
1. Check disk I/O (use `iostat`, `iotop`)
2. Verify repository pack files aren't fragmented (`git gc`)
3. Check network latency if using remote storage
4. Review Git LFS configuration for large files

**High Database Load:**
1. Identify slow queries (`pg_stat_statements`)
2. Add indexes for frequently queried columns
3. Analyze query plans (`EXPLAIN ANALYZE`)
4. Consider read replicas for analytics queries

**CI Job Queue Backlog:**
1. Check runner availability and health
2. Review job concurrency limits
3. Identify long-running jobs (optimize or split)
4. Scale runners horizontally

**Synthetic Monitoring:**

Create health check jobs that validate end-to-end functionality:
```bash
#!/bin/bash
# Synthetic check: Clone, commit, push
git clone https://git.example.com/test/repo.git
cd repo
echo "test" > test.txt
git add test.txt
git commit -m "Synthetic check $(date)"
git push
```

Run every 5-15 minutes and alert on failures.

**Log Rotation and Retention:**

Prevent disk exhaustion from logs:
```bash
# logrotate config for GitLab
/var/log/gitlab/**/*.log {
    daily
    rotate 14
    compress
    delaycompress
    copytruncate
    missingok
}
```

Retention tiers:
- **14 days high-resolution:** All logs, full detail
- **90 days aggregated:** Summarized metrics only
- **1-3 years compliance:** Archive compressed logs off-site

---

### 10.4 Planning for Growth and Multi-Instance Architectures

**Capacity Planning:**

**Measure Current Usage:**
- Repository count and total size
- Average repo size
- Peak concurrent users
- CI jobs per day
- API requests per minute

**Project Growth:**
- Estimate 12-24 month growth based on team expansion
- Factor in seasonal spikes (release cycles, onboarding)
- Add 30-50% buffer for unexpected growth

**Horizontal Scaling Architecture:**

**Separate Tiers:**

Instead of monolithic servers, split into specialized roles:

**Tier 1: Web/API Servers**
- Handle HTTP requests
- Stateless (can scale horizontally)
- Load-balanced behind HAProxy or Nginx
- 2-4+ instances for HA

**Tier 2: Git Storage**
- Serve Git operations (clone, fetch, push)
- Use shared storage (NFS, object storage)
- Can have multiple Git servers with sync

**Tier 3: Database**
- PostgreSQL primary with read replicas
- Automatic failover with Patroni or Stolon
- Separate analytics queries to replicas

**Tier 4: CI Runners**
- Isolated runner nodes or Kubernetes pods
- Auto-scale based on job queue depth
- Use spot/preemptible instances for cost savings

**Tier 5: Object Storage**
- S3, MinIO, or cloud provider storage
- Store LFS objects, artifacts, uploads
- CDN for frequently accessed assets

**Example Multi-Node Architecture (GitLab):**

```
                   ┌─────────────┐
                   │Load Balancer│
                   └──────┬──────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │  Web 1  │     │  Web 2  │     │  Web 3  │
    └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
                  ┌──────────────┐
                  │  PostgreSQL  │
                  │   (Primary)  │
                  └──────┬───────┘
                         │ replication
                  ┌──────▼───────┐
                  │  PostgreSQL  │
                  │   (Replica)  │
                  └──────────────┘
                         
    ┌──────────────────────────────────┐
    │        Shared Storage (NFS)      │
    │  Git repos, LFS, uploads         │
    └──────────────────────────────────┘
    
    ┌──────────────────────────────────┐
    │        CI Runners (Pool)         │
    │  Auto-scaling Kubernetes         │
    └──────────────────────────────────┘
```

**Stateless Application Servers:**

Design web nodes to be stateless:
- No local session storage (use Redis)
- No local file storage (use object storage)
- Identical configuration via config management
- Can add/remove nodes without data loss

**Load Balancing Strategies:**

**Round-Robin:** Distribute requests evenly across nodes

**Least Connections:** Route to server with fewest active connections

**Sticky Sessions:** Route user to same server (avoid if possible)

**Health Checks:** Remove unhealthy nodes from rotation

**Multi-Instance Git Servers:**

**Shared Storage Approach:**
- All Git servers mount same NFS/GlusterFS
- Consistent view of repositories
- Simple but NFS can be a bottleneck

**Git Replication Approach:**
- Primary Git server with read replicas
- Write operations go to primary
- Reads load-balanced across replicas
- More complex but better performance

**Auto-Scaling CI Runners:**

**Kubernetes-Based:**
```yaml
# gitlab-runner-values.yaml
runners:
  config: |
    [[runners]]
      [runners.kubernetes]
        namespace = "gitlab-runner"
        image = "alpine:latest"
        
  autoscaling:
    minReplicas: 2
    maxReplicas: 20
    targetCPUUtilizationPercentage: 75
```

**Cloud Provider Auto-Scaling:**
- Use AWS Auto Scaling Groups, GCP MIGs, or Azure VMSS
- Scale based on queue depth or CPU utilization
- Use spot/preemptible instances for cost savings (80-90% cheaper)

**High Availability Validation:**

Test HA setup with failure simulations:
- Kill web server process → Traffic routes to remaining nodes?
- Shut down database primary → Replica promoted automatically?
- Network partition → System degrades gracefully?
- Runner node failure → Jobs redistribute to other runners?

**Cross-Region Architecture:**

For global teams, consider multi-region:
- Primary region for writes
- Regional read replicas for fast local access
- Git mirrors in each region
- CDN for static assets (UI, documentation)

**Validate Consistency:**

Run periodic integrity checks:
```bash
# Check Git repository checksums
git fsck --full

# Compare repo counts across nodes
git count-objects -v

# Validate database replica lag
SELECT NOW() - pg_last_xact_replay_timestamp() AS replication_lag;
```

---

## 11. Making Your Final Decision

You've learned about platforms, features, and operations. Now let's match all of that to your specific needs.

### 11.1 Platform Recommendations by Scenario

**🏢 Enterprise (100+ Developers, Compliance Requirements)**

**Recommended: GitLab CE Self-Hosted**

Why:
- Full DevOps platform reduces vendor count
- Built-in compliance features (audit logs, SAML, RBAC)
- Mature HA architecture for uptime guarantees
- Self-hosted meets data sovereignty requirements
- Large community and commercial support available

Alternative: BitBucket Data Center (if already on Atlassian)

---

**🚀 Startup (5-20 Developers, Tight Budget)**

**Recommended: Gitea Self-Hosted or Codeberg Hosted**

Why:
- **Gitea:** Lightweight, cheap infrastructure ($30-90/month)
- **Codeberg:** Free hosting, zero operational overhead
- Both offer essential features without complexity
- Easy to migrate as you grow

Alternative: GitHub Free tier (if you prefer commercial hosting)

---

**🔬 Open Source Project (Privacy Priority, Community Focus)**

**Recommended: Codeberg or SourceHut**

Why:
- **Codeberg:** Nonprofit governance, privacy-respecting, free
- **SourceHut:** Email-first workflows, no tracking, community-funded
- Both align philosophically with open-source values
- Free hosting for public projects

Alternative: Self-hosted Gitea or Forgejo

---

**🏠 Personal Projects or Home Lab**

**Recommended: Gogs or Gitea**

Why:
- Runs on minimal hardware (Raspberry Pi, NAS)
- Quick setup (minutes, not hours)
- Low maintenance overhead
- Free and open source

Alternative: Hosted Codeberg (if you don't want to self-host)

---

**🔧 Team Using Jira/Confluence**

**Recommended: BitBucket**

Why:
- Native Atlassian ecosystem integration
- Automatic issue linking and workflow transitions
- Shared authentication and user management
- Team already familiar with Atlassian UI patterns

Alternative: GitLab CE with Jira integration plugin

---

**⚡ Need Full DevOps Platform Immediately**

**Recommended: GitLab CE Self-Hosted or GitLab.com**

Why:
- Everything built-in: CI/CD, registry, security scanning
- No need to integrate external tools
- Mature, production-ready platform
- Fastest path to complete DevOps capability

Alternative: BitBucket + Bamboo (if budget allows)

---

**📧 Experienced Developers Wanting Email Workflows**

**Recommended: SourceHut**

Why:
- Email-first patch workflows (git send-email)
- Lightweight, scriptable, command-line friendly
- No JavaScript or web UI required
- Appeals to Unix philosophy enthusiasts

Alternative: Self-host any platform and use git format-patch + email

---

### 11.2 Decision Checklist

Use this checklist to systematically evaluate platforms:

**Team Size and Scale:**
- ☐ Current team size: ___ developers
- ☐ Expected growth in 12 months: ___ developers
- ☐ Number of repositories: ___
- ☐ Total repository size: ___ GB

**Compliance and Security:**
- ☐ Must meet specific regulations (GDPR, HIPAA, SOC 2)?
- ☐ Need SAML/SSO integration?
- ☐ Require self-hosted for data sovereignty?
- ☐ Need audit logs with retention policies?
- ☐ Require secret scanning and SAST?

**Features Required:**
- ☐ Built-in CI/CD (vs external)?
- ☐ Package/container registry?
- ☐ Issue tracking and project boards?
- ☐ Advanced code review workflows?
- ☐ Wiki and documentation hosting?
- ☐ API for automation?

**Hosting Model:**
- ☐ Self-hosted (own infrastructure)
- ☐ Managed/hosted (SaaS)
- ☐ Hybrid (some services hosted, others self-managed)

**Budget:**
- ☐ Monthly infrastructure budget: $___ 
- ☐ Operational hours available: ___ hrs/month
- ☐ DevOps capacity: Yes / No / Limited
- ☐ Total monthly budget (infra + ops): $___

**Maintenance Capacity:**
- ☐ Dedicated DevOps engineer? Yes / No
- ☐ Can handle 4-8 hours/month maintenance? Yes / No
- ☐ Can respond to incidents 24/7? Yes / No
- ☐ Have backup/DR plan? Yes / No

**Score Your Priorities (1-5 scale):**
- Cost: ___
- Ease of use: ___
- Feature completeness: ___
- Control/customization: ___
- Privacy: ___
- Performance: ___
- Community support: ___

**Decision Matrix:**

Based on your answers:
- **High control + budget**: GitLab CE self-hosted
- **Low ops capacity + budget**: Managed hosting (GitLab.com, BitBucket)
- **Minimal budget + tech skills**: Gitea or Gogs self-hosted
- **Privacy focused + no ops**: Codeberg
- **Complex workflows + resources**: GitLab CE with HA
- **Simplicity above all**: Gogs or Codeberg

---

### 11.3 Community Health and Long-Term Viability

Before committing, assess the platform's sustainability:

**Project Activity Indicators:**

**Check Commit Frequency:**
- Active projects: Multiple commits per week
- Healthy projects: At least monthly releases
- Warning signs: Months between commits

**Open Issues and PRs:**
- Healthy projects: Issues get responses within days
- Responsive maintainers: PRs reviewed within 1-2 weeks
- Red flags: Hundreds of stale issues, ignored PRs

**Release Cadence:**
- Active: Monthly or quarterly releases
- Healthy: Semi-annual releases with patches
- Concerning: Years between major versions

**Documentation Quality:**

**Good Documentation Includes:**
- Clear installation guides for multiple platforms
- API documentation with examples
- Troubleshooting guides and FAQs
- Migration documentation from competitors
- Architecture and scaling guides

**Test Documentation:**
- Can you find answers to common questions in <5 minutes?
- Are examples copy-paste ready?
- Is documentation up-to-date with latest version?

**Community and Commercial Support:**

**Community Channels:**
- Active forums or Discord/Slack channels
- Stack Overflow tag with regular answers
- GitHub Discussions or issue responsiveness
- Regular blog posts or newsletters

**Commercial Support Options:**
- Available for mission-critical deployments?
- Reasonable pricing for support contracts?
- Enterprise features and consulting available?
- Training and certification programs?

**Longevity Indicators:**

**Positive Signs:**
- Non-profit or community governance
- Multiple corporate sponsors (not dependent on one)
- Active contributor base (not just core team)
- Clear roadmap and feature voting

**Warning Signs:**
- Single-person projects (bus factor = 1)
- Funding uncertainties or financial stress
- Core team turnover or departures
- Development shift to proprietary features

**License and Contributor Policies:**

**Check License Terms:**
- Open source license (MIT, Apache, GPL)?
- Copyleft requirements (GPL, AGPL)?
- Dual licensing (open core + commercial)?

**Contributor Agreements:**
- CLA required? (May signal IP concentration)
- DCO only? (More contributor-friendly)
- Clear contribution guidelines?

**Platform-Specific Community Health:**

**GitLab:** Large community, active development, strong roadmap, backed by GitLab Inc. (public company)

**Gitea:** Growing community, regular releases, Gitea Ltd. backing, some governance concerns led to Forgejo fork

**Forgejo:** Newer fork, community-governed, active development, commitment to copyleft

**Gogs:** Smaller community, slower development, stable but minimal new features

**Codeberg:** Nonprofit-backed, community-driven, dependent on Gitea upstream

**SourceHut:** Active development, small but passionate community, funded by subscriptions

**BitBucket:** Backed by Atlassian (public company), enterprise-focused, proprietary

---

### 11.4 Pilot Testing and Adoption Rollout Strategy

Don't migrate everything at once. Test thoroughly before committing.

**Phase 1: Pilot Planning (Week 1-2)**

**Select Pilot Repositories:**
- 1-3 non-critical repositories
- Representative of your workflow (frontend, backend, microservice)
- Include repos with CI/CD to test pipeline migration
- Small to medium size (avoid huge monorepos initially)

**Define Success Criteria:**
- ☐ All commits and history migrated intact
- ☐ Issues and PRs imported with links preserved
- ☐ CI/CD pipelines run successfully
- ☐ Team can push, merge, and review code
- ☐ Performance meets expectations (clone times, UI responsiveness)

**Select Pilot Team:**
- 3-10 developers (representative sample)
- Mix of experience levels
- Include at least one skeptic (will surface real issues)

---

**Phase 2: Dry Run Migration (Week 2-3)**

**Execute Test Migration:**
1. Clone pilot repos to new platform
2. Import issues and PRs
3. Migrate CI/CD pipelines
4. Test end-to-end workflows

**Validate Thoroughly:**
- Compare commit counts: `git rev-list --count --all`
- Check all branches exist
- Verify tags and releases
- Test CI pipeline on sample commit
- Validate webhook integrations (Slack, Jira)

**Document Issues:**
- What broke during migration?
- What manual steps were required?
- How long did migration take?
- What needs automation?

---

**Phase 3: Pilot Period (Week 3-6)**

**Run Production Workloads:**
- Have pilot team use new platform for daily work
- Keep old platform as read-only backup
- Collect feedback via surveys or standups

**Track Metrics:**
- Clone/fetch/push times compared to old platform
- CI/CD pipeline duration
- Incidents and outages
- User satisfaction scores (1-10 rating)

**Weekly Check-Ins:**
- What's working well?
- What's frustrating?
- What features are missing?
- Would you recommend migration?

---

**Phase 4: Rollout Decision (Week 6-7)**

**Evaluate Success Criteria:**
- ☐ All technical criteria met?
- ☐ Team satisfaction >7/10?
- ☐ Performance acceptable?
- ☐ Issues documented and fixable?

**Go/No-Go Decision:**
- **GO:** Proceed with phased rollout
- **NO-GO:** Address blockers or reconsider platform choice

---

**Phase 5: Phased Rollout (Week 8-16)**

**Migration Waves:**

**Wave 1:** Pilot team + low-risk repos (week 8-10)
- Already validated
- Quick win for team morale

**Wave 2:** Early adopters + medium-risk repos (week 10-12)
- Enthusiastic team members
- Expand to more repositories

**Wave 3:** Remaining teams + all repos (week 12-16)
- Full migration
- Decommission old platform

**Between Waves:**
- Gather feedback and fix issues
- Update documentation and training
- Improve automation based on learnings

---

**Phase 6: Training and Documentation (Ongoing)**

**Create Resources:**
- Quick-start guide for new platform
- CI/CD pipeline templates and examples
- Troubleshooting FAQ
- Video walkthrough of common tasks

**Onboarding Sessions:**
- Live demo of new platform
- Q&A session with pilot team
- Office hours for support
- Dedicated Slack channel for questions

**Update Runbooks:**
- Incident response procedures
- Deployment playbooks
- Backup/restore documentation
- Monitoring and alerting guides

---

**Phase 7: Retrospective and Optimization (Week 16+)**

**Post-Migration Review:**
- What went well?
- What was harder than expected?
- What would you do differently?
- What optimizations are needed?

**Continuous Improvement:**
- Optimize performance based on usage patterns
- Add automation for common tasks
- Expand monitoring and alerting
- Plan scaling for growth

---

## 12. Conclusion and Next Steps

Choosing a GitHub alternative isn't just about features and pricing—it's about finding a platform that aligns with your team's values, technical requirements, and operational capacity.

**Key Takeaways:**

**For Most Teams:** GitLab CE or Gitea provide the best balance of features, performance, and operational simplicity. GitLab if you need a complete DevOps platform, Gitea if you want lightweight efficiency.

**For Privacy Advocates:** Codeberg or SourceHut offer community-governed, privacy-respecting hosting with no corporate tracking.

**For Enterprises:** GitLab CE self-hosted delivers compliance, control, and scalability with mature HA architectures.

**For Budget-Conscious Teams:** Self-hosted Gitea or Gogs (if you have DevOps skills) or hosted Codeberg (if you don't) provide powerful Git hosting for minimal cost.

**For Atlassian Users:** BitBucket's tight integration with Jira and Confluence makes it the obvious choice if you're already invested in that ecosystem.

**Migration Reality Check:**

Migrating Git hosting is a significant undertaking. Factor in:
- 2-4 weeks for pilot and validation
- 6-12 weeks for phased rollout
- Ongoing optimization and tuning
- Training and documentation updates

But the benefits—control, cost savings, privacy, or better features—often justify the investment.

**Your Action Plan:**

**This Week:**
1. Review the comparison table (Section 3) and identify 2-3 candidate platforms
2. Read documentation for each candidate
3. Discuss with your team: what features matter most?

**Next Week:**
1. Provision test infrastructure for top choice
2. Migrate 1-2 sample repositories
3. Have 2-3 team members test workflows

**Week 3:**
1. Evaluate pilot results against success criteria
2. Make go/no-go decision
3. Plan full migration timeline

**Week 4 and Beyond:**
1. Execute phased migration
2. Train team and update documentation
3. Monitor, optimize, and iterate

**Need Help?**

If you're stuck on platform selection or migration planning, you have options:
- Most platforms have active community forums (GitLab Forum, Gitea Discourse, SourceHut mailing lists)
- GitLab, BitBucket, and others offer professional services for migrations
- Consult with DevOps engineers experienced in Git platform migrations

**Final Thoughts:**

GitHub is excellent, but it's not the only option. Whether you're driven by privacy concerns, cost optimization, compliance requirements, or philosophical preferences, viable alternatives exist.

Take the time to pilot and validate. Your code infrastructure is critical—make sure your choice can support your team for years to come.

---

## 13. Frequently Asked Questions

### What are the top open source alternatives to GitHub?

The leading open-source GitHub alternatives are:
1. **GitLab CE** - Full DevOps platform with integrated CI/CD
2. **Gitea** - Lightweight, fast, easy to deploy
3. **Gogs** - Minimal footprint, ultra-simple
4. **Forgejo** - Community-governed Gitea fork
5. **SourceHut** - Email-first, modular platform

For hosted options, **Codeberg** (nonprofit Gitea hosting) offers free, privacy-respecting Git hosting for open-source projects.

---

### How do I choose between self-hosted and managed hosting?

**Choose self-hosted when:**
- Data sovereignty or compliance requires on-premise hosting
- You have 20+ users and self-hosting becomes cost-effective
- You need deep customization or integration with internal systems
- You have DevOps capacity to maintain infrastructure

**Choose managed hosting when:**
- You have <10 users (TCO favors SaaS)
- You lack DevOps resources or want zero operational overhead
- You need rapid deployment (minutes vs hours/days)
- You want built-in backups, HA, and SLA guarantees

For most small teams, managed hosting (Codeberg, GitLab.com, BitBucket Cloud) is cheaper and easier once you factor in operational time.

---

### Which platform is best for CI/CD out of the box?

**GitLab CE** provides the most mature, integrated CI/CD with:
- Native runners and pipeline-as-code
- Container registry integration
- Auto DevOps and deployment templates
- Security scanning built-in

**Runner-up:** Gitea Actions (GitHub Actions compatible, improving rapidly) and BitBucket Pipelines (cloud-hosted, Docker-based).

**SourceHut** offers powerful modular builds with full VM access, but requires learning its manifest format.

**Gogs and basic Codeberg** rely on webhooks to external CI systems like Jenkins or Drone.

---

### Are Gitea and Gogs suitable for small teams or startups?

**Absolutely.** Both are designed for small teams and startups:
- **Lightweight:** Run on minimal hardware (256-512MB RAM)
- **Quick setup:** Install in 15-30 minutes
- **Low cost:** $30-90/month for self-hosted infrastructure
- **Low maintenance:** 4-8 hours/month operational overhead

**Gitea** is recommended over Gogs for new deployments due to more active development, package registry support, and Gitea Actions CI/CD.

---

### How can I preserve git history and metadata during migration?

Use **git mirror** for complete history preservation:

```bash
# Mirror clone (all branches, tags, refs)
git clone --mirror https://github.com/user/repo.git
cd repo.git

# Push to new platform
git push --mirror https://gitea.example.com/user/repo.git
```

For issues and PRs, use platform-specific importers:
- GitLab and Gitea have GitHub import tools
- Preserve issue numbers, comments, and timestamps
- Map labels and milestones to new platform

Run dry-run migrations on test repos first and validate commit counts, tags, and issue integrity.

---

### What security features should I look for in a Git hosting platform?

Essential security features:
- **Authentication:** LDAP/SAML/SSO, OAuth2, multi-factor authentication
- **Access control:** RBAC, branch protection, required reviews
- **Audit logs:** Comprehensive logging with retention policies
- **Secret detection:** Scan commits for API keys and credentials
- **Dependency scanning:** Detect vulnerable packages (SAST, SCA)
- **Container scanning:** Identify vulnerabilities in Docker images

GitLab CE and Gitea offer most of these features. Integrate external tools (Snyk, Trivy, SonarQube) if platform lacks built-in scanning.

---

### How do costs compare between self-hosted and hosted plans?

**Small team (10 developers):**

| Option | Monthly Cost |
|--------|--------------|
| GitHub Team | $40 |
| GitLab.com Premium | $290 |
| BitBucket Cloud | $30 |
| Codeberg (free) | $0 |
| **Self-hosted Gitea** | $30-90 (infra) + $400-800 (ops) = **$430-890** |
| **Self-hosted GitLab CE** | $115-240 (infra) + $1,200-2,000 (ops) = **$1,315-2,240** |

**Conclusion:** For small teams, hosted solutions are cheaper. Self-hosting breaks even at 20-50+ users or when you have existing DevOps capacity.

**Hidden costs of self-hosting:**
- Incident response (middle-of-night outages)
- Security patching and compliance
- Backup management and DR testing

---

### How do I migrate issues and pull requests to a new platform?

**Best Method: Platform Importers**

GitLab and Gitea include GitHub importers:
1. Go to "New Project" → "Import from GitHub"
2. Authenticate with GitHub token
3. Select repositories to import
4. Import preserves issues, PRs, labels, milestones

**Manual Method (if importer unavailable):**
1. Export issues via GitHub API (`/repos/{owner}/{repo}/issues`)
2. Map labels and milestones
3. Import via target platform API
4. Preserve timestamps and authors

**CI/CD Migration:**
- Convert pipeline configs (`.github/workflows` → `.gitlab-ci.yml`)
- Recreate secrets in new platform
- Test pipelines before production use

---

### What maintenance tasks are essential for a self-hosted instance?

**Critical Maintenance:**
- **Backups:** Daily database dumps, hourly incremental snapshots
- **Security updates:** Weekly OS patching, monthly platform upgrades
- **Database tuning:** Quarterly performance review, index optimization
- **Storage cleanup:** Monthly repository garbage collection (`git gc`)
- **Monitoring:** Real-time alerts for CPU, disk, errors
- **Log rotation:** Prevent disk exhaustion from logs
- **DR testing:** Quarterly restore drills

**Time Investment:**
- Small instance (Gitea): 4-8 hours/month
- Medium instance (GitLab CE): 12-20 hours/month
- Enterprise HA: 40-80 hours/month

Automate where possible (unattended upgrades, backup scripts, monitoring alerts).

---

### How should I plan CI/CD runners for scalability?

**Choose Appropriate Executors:**
- **Docker:** Isolated, reproducible builds (recommended)
- **Shell:** Direct execution, less isolation
- **Kubernetes:** Cloud-native, auto-scales

**Enable Auto-Scaling:**
- Kubernetes Cluster Autoscaler adds/removes nodes
- Cloud auto-scaling groups (AWS, GCP, Azure)
- Scale based on job queue depth or CPU utilization

**Capacity Planning:**
- Start with 2-4 runners
- Monitor queue wait times
- Add runners when wait time >5 minutes
- Use spot/preemptible instances for cost savings (80-90% cheaper)

**Optimization:**
- Cache dependencies (npm, pip, Maven)
- Use matrices for parallel testing
- Set resource quotas to prevent runner exhaustion
- Tag runners by capability (docker, gpu, large-memory)

---

### Which platforms are best for privacy and community-driven projects?

**Codeberg** and **SourceHut** prioritize privacy and community governance:

**Codeberg:**
- Nonprofit (Codeberg e.V.), German registered association
- No tracking, no analytics, no data mining
- Community-governed with transparent operations
- Free hosting for open-source projects

**SourceHut:**
- Focused on simplicity and user privacy
- Minimal JavaScript, no client-side tracking
- Subscription-funded (no ads, no data monetization)
- Email-first workflows respect user control

Both are philosophically aligned with open-source values and community empowerment.

---

### Are legacy platforms like Phabricator still a good choice?

**Generally no.** Phabricator development ceased in 2021. While it's still functional:

**Concerns:**
- No active development or security patches
- Shrinking community and support
- Modern alternatives have surpassed its features
- Migration becomes harder over time

**If you're on Phabricator:** Plan migration to GitLab CE, Gitea, or GitHub. Many organizations have documented migration paths.

**If you're evaluating new platforms:** Choose actively maintained projects (GitLab, Gitea, Forgejo) with regular releases and responsive communities.

---

### What compliance practices should I implement on a Git hosting platform?

**Authentication and Access:**
- Enforce SAML/SSO with corporate identity provider
- Require multi-factor authentication for all users
- Implement role-based access control (RBAC)
- Review and revoke stale access quarterly

**Audit and Logging:**
- Enable comprehensive audit logs (logins, pushes, settings changes)
- Retain logs per regulatory requirements (1-7 years)
- Export logs to SIEM for centralized monitoring
- Document log access and review procedures

**Security Scanning:**
- Run dependency scans daily (OWASP Dependency-Check, Snyk)
- Secret detection on every commit
- License compliance scanning on dependency updates
- Fail CI/CD builds on high/critical vulnerabilities

**Contributor Agreements:**
- Require CLA or DCO for contributions
- Verify LICENSE files in all repositories
- Document IP ownership and contribution policies

---

### How do I test a migration plan before going live?

**Step-by-Step Testing:**

1. **Inventory and Audit (Week 1):**
   - Catalog all repos, users, integrations
   - Document current CI/CD pipelines
   - Identify dependencies and secrets

2. **Dry Run (Week 2):**
   - Migrate 2-3 test repos to staging environment
   - Import issues, PRs, wikis
   - Convert CI/CD pipelines
   - Validate commit counts, tags, branches

3. **Pilot Test (Week 3-4):**
   - Have small team (3-5 people) use new platform
   - Run production workloads
   - Measure performance and gather feedback

4. **Validation:**
   - Compare commit hashes: `git rev-list --all | sha256sum`
   - Verify all branches and tags exist
   - Test CI/CD pipelines end-to-end
   - Check issue links and references

5. **Rollback Plan:**
   - Document steps to revert to old platform
   - Assign rollback decision authority
   - Keep old platform accessible for 30-72 hours post-migration

---

### What factors should guide my final platform decision?

**Prioritize by Impact:**

1. **Team Size:** Platforms scale differently (Gogs for 1-5, GitLab CE for 100+)
2. **Compliance Needs:** Self-hosting required? SAML/SSO mandatory?
3. **DevOps Capacity:** Have ops resources? (Yes → self-host; No → managed)
4. **Budget:** Total cost including infrastructure + operational time
5. **Feature Requirements:** CI/CD? Package registry? Advanced project management?
6. **Community Health:** Active development? Responsive maintainers?
7. **Long-Term Viability:** Will platform exist in 5 years?

**Decision Framework:**

Run through the decision checklist (Section 11.2), score your priorities, and use the scenario-based recommendations (Section 11.1) to narrow to 1-2 candidates. Then pilot test before committing.

**Trust Your Pilot Results:** Real-world testing beats spec sheets. If the platform feels clunky or frustrating during pilot, those issues will amplify at scale.

---

That's the complete guide. You now have everything you need to evaluate, choose, and migrate to the right GitHub alternative for your team. Good luck with your migration!
