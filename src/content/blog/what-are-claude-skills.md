---
title: "What Are Claude Skills? The Complete Guide"
description: "Claude Skills are reusable packages of instructions and code that extend what Claude can do — automatically. Here's how they work, how they compare to MCP and Projects, and which ones are worth installing."
date: "2026-04-29"
author: "Chester Beard"
slug: what-are-claude-skills
tags: ["claude-skills", "claude", "anthropic", "ai-tools", "mcp"]
category: "Claude Skills"
draft: false
---

Claude Skills are reusable packages of instructions, reference materials, and optional executable code that you upload once and Claude loads automatically whenever they're relevant. Unlike a one-time prompt or a Project, a Skill persists across every conversation and activates on its own — you don't have to reference it by name. They're available on Free, Pro, Max, Team, and Enterprise plans in Claude.ai, and across Claude Code and the API. The one prerequisite that trips people up: **code execution must be enabled** before custom Skills will work.

If you've been confused about how Skills relate to Projects, Custom Instructions, or MCP connectors — you're not alone. That's exactly what this guide covers.

---

## What a Claude Skill actually is

At its core, a Skill is a folder. Inside that folder is a `SKILL.md` file written in Markdown, and optionally: reference documents, scripts, or other supporting files. The `SKILL.md` contains two things — YAML frontmatter that tells Claude *when* to use the Skill, and instructions in Markdown that tell Claude *how* to use it.

Here's a minimal example of what that frontmatter looks like:

```yaml
---
name: content-writer
description: Assists in writing high-quality content by conducting research,
  adding citations, improving hooks, and providing section-by-section feedback.
  Use when asked to write, draft, or improve any article or blog post.
---
```

When a session starts, Claude scans all available Skills and reads just the frontmatter from each one. This is deliberately token-efficient — each Skill costs only a few dozen tokens in context at that stage. The full Skill content only loads if your request matches the description. This progressive disclosure approach is why Skills can scale: you can have dozens installed without bloating every conversation.

When Claude decides a Skill is relevant, it loads the full instructions and any supporting files, then follows them as it works through your request. If you're in Claude Code, you'll see Claude announce which Skill it's using. In Claude.ai, the Skill name appears in the interface when it's active.

### What can go inside a Skill

Skills aren't limited to text instructions. The supporting files in a Skill's folder can include:

- **Reference documents** — style guides, brand guidelines, company templates, data schemas
- **Executable scripts** — Python, shell, or JavaScript that Claude runs as part of completing a task
- **Example outputs** — samples that show Claude the expected format or quality level

This is what separates Skills from prompt templates. A Skill for generating Excel reports doesn't just tell Claude *what* a good spreadsheet looks like — it includes Python scripts that actually build it with working formulas and formatting. The Skill is the complete procedure, not just the description of one.

---

## Skills vs. MCP vs. Projects vs. Custom Instructions

This is the question Google's "People Also Ask" surfaces most — and no current editorial page answers it cleanly. Here's the full comparison:

| | **Skills** | **MCP Connectors** | **Projects** | **Custom Instructions** |
|---|---|---|---|---|
| **What it is** | Reusable procedure with instructions + optional code | Connection to an external tool or data source | A persistent workspace with accumulated context | Universal behavioral preferences |
| **Teaches Claude** | *How* to complete a specific type of task | *What* external systems it can reach | *What* you're working on together | *How* you generally want to interact |
| **Persists where** | Across all conversations (or org-wide in API) | Available wherever connected | Within a specific Project | Across all conversations |
| **Activates how** | Automatically, when description matches your request | On-demand when Claude needs that capability | Always active within the Project | Always active |
| **Best for** | Repeatable workflows, document creation, analysis procedures | Live data, external APIs, real-time actions | Ongoing work with shared context (a codebase, a project) | Tone, format, language preferences |
| **Requires** | Code execution enabled (claude.ai custom Skills) | MCP client configuration | Nothing extra | Nothing extra |

The mental model that makes this click: **Skills teach Claude how to work. MCP expands where Claude can reach. Projects give Claude memory of what you're building. Custom Instructions shape how Claude talks to you.**

These aren't competing features — they're complementary layers. A realistic power-user setup uses all four: Custom Instructions set the baseline tone, a Project accumulates context for an ongoing codebase, Skills encode the repeatable procedures (code review, changelog generation, documentation), and MCP connectors give Claude live access to GitHub, Postgres, or Slack when it needs to act on something real.

### Skills vs. MCP: the deeper difference

The key architectural distinction is filesystem vs. network. MCP connectors require a running server process and a live connection — they're always-on infrastructure. Skills are files. There's no server to maintain, no authentication to configure, no connection to debug. When the task is over, the Skill has done its job and nothing is left running.

This matters in practice. The [Playwright Browser Automation skill](https://github.com/lackeyjb/playwright-skill) in our directory does much of what the Playwright MCP server does — but instead of a persistent MCP server sending accessibility tree snapshots on every action, Claude writes Playwright code directly, runs it, and gets back screenshots and console output. Three hundred lines of instructions versus a running server process. Neither approach is universally better, but the tradeoff is real: Skills are simpler to deploy and have no network footprint; MCP connectors are more powerful for complex, stateful external interactions.

Similarly, the [Postgres skill](https://github.com/sanjay3290/ai-skills/tree/main/skills/postgres) in our directory executes safe read-only SQL queries against your database — while a Postgres MCP server enables full interactive query sessions. The Skill is lighter and more constrained; the MCP server is more capable but requires more setup.

---

## Is Claude Skills free?

Skills are available across all claude.ai plans — Free, Pro, Max, Team, and Enterprise. But there's an important distinction between Skill *types*:

**Pre-built Anthropic Skills** (Word, Excel, PowerPoint, PDF) work automatically in claude.ai without any setup. They're active behind the scenes whenever you ask Claude to create or manipulate those document types. No configuration required.

**Custom Skills** — the ones you install from a directory or build yourself — require code execution to be enabled. On personal plans, enable it under **Settings > Capabilities**. On Team and Enterprise, administrators control this at the organization level.

One thing worth knowing: in claude.ai, custom Skills are individual to each user. They are not shared across an organization and cannot be centrally deployed by admins through the claude.ai interface. If you want org-wide Skill deployment — where every user gets the same Skills automatically — that's an API feature. Custom Skills uploaded through the Claude API are shared organization-wide within your workspace.

---

## Is Claude Skills only for Claude Code?

No — but it's a reasonable question, and the confusion is understandable. The Skills concept exists across three surfaces, and they work somewhat differently on each:

**Claude.ai** supports both pre-built Anthropic Skills and custom Skills you upload as `.zip` files. Skills here run in a sandboxed code execution environment with no external network access and pre-configured dependencies only.

**Claude Code** supports custom Skills as directories with `SKILL.md` files that Claude discovers automatically. Skills in Claude Code have full network access and run with the same permissions as any program on your computer. This is where the community ecosystem of installable Skills lives — tools like [Superpowers](/blog/superpowers-skills-framework-claude-code/), the [FFUF Web Fuzzing skill](https://github.com/jthack/ffuf_claude_skill), and the [AWS Skills](https://github.com/zxkane/aws-skills) are Claude Code-native.

**The Claude API** supports both pre-built Anthropic Skills and custom Skills you upload via the `/v1/skills` endpoints. API Skills run in the same sandboxed environment as claude.ai.

The three platforms share the same underlying SKILL.md format — but the execution environment and network access differ significantly. A Skill built for Claude Code that makes external API calls won't work in claude.ai's sandboxed environment.

### The open standard angle: Skills work beyond Claude

Here's something that gets surprisingly little coverage: the SKILL.md format is an open standard. You can point Codex CLI, Gemini CLI, Cursor, Windsurf, or any of 25+ other AI coding agents at a Skills folder and it works — no modification needed. The agents have no baked-in knowledge of the Skills system; they simply follow the instructions in the Markdown files.

Our [Agent Skills Directory](/claude-skills/) lists Skills that are installable across all of these agents — the directory header says it plainly: "Installable skills for Claude Code, Cursor, Copilot, Windsurf, and 25+ other AI coding agents." This is closer to npm packages than to Claude-specific plugins. The ecosystem is shared. Anthropic built the most popular runtime, but the format belongs to everyone.

This also means Skills from the community don't lock you into Claude. If you invest time in building a Skills library for your workflow, that library works with whichever agent you're using.

---

## What skills should you add to Claude?

### Anthropic's built-in Skills

Anthropic ships four pre-built Skills that are active in claude.ai without installation:

- **Word (docx)** — create, edit, and analyze Word documents with tracked changes, comments, and formatting preservation
- **Excel (xlsx)** — spreadsheet manipulation with working formulas, charts, and data transformations
- **PowerPoint (pptx)** — generate and adjust presentations, layouts, and templates
- **PDF** — extract text, tables, and metadata; merge and annotate

These are the baseline. They're why asking Claude to "create a quarterly sales report in Excel" produces an actual `.xlsx` file with working formulas rather than a code block you have to run yourself.

### Community Skills worth installing

The [MyMCPShelf Agent Skills Directory](/claude-skills/) lists 110+ verified Skills. Here's a cross-section that shows the range of what's possible:

**For developers:**

- **[D3.js Visualization](https://github.com/chrisvoncsefalvay/claude-d3js-skill)** — teaches Claude to produce D3 charts and interactive data visualizations. Entirely reference documentation and patterns, no executable code. A good example of a Skill that encodes domain expertise rather than running scripts.
- **[Changelog Generator](https://github.com/anthropics/skills/tree/main/skills/changelog-generator)** — analyzes your git history and transforms technical commit messages into customer-facing release notes. The kind of repetitive, judgment-heavy task that's perfect for a Skill.
- **[FFUF Web Fuzzing](https://github.com/jthack/ffuf_claude_skill)** — integrates the ffuf web fuzzer so Claude can run fuzzing tasks and analyze results for vulnerabilities. Signals how far the Skills ecosystem has extended into security tooling.
- **[AWS Skills](https://github.com/zxkane/aws-skills)** — CDK best practices, cost optimization patterns, and serverless/event-driven architecture. Particularly useful for teams with strong internal AWS conventions.
- **[Frontend Design](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design)** — generates distinctive, production-grade frontend interfaces with React, Tailwind, and shadcn/ui. Avoids the generic AI-aesthetic problem by encoding specific design principles.

**For knowledge workers:**

- **[Content Research Writer](https://github.com/anthropics/skills/tree/main/skills/content-research-writer)** — conducts research, adds citations, improves hooks, and provides section-by-section feedback on drafts. If you write regularly, this is one of the most useful installs in the directory.
- **[Meeting Insights Analyzer](https://github.com/anthropics/skills/tree/main/skills/meeting-insights-analyzer)** — analyzes meeting transcripts to surface behavioral patterns: conflict avoidance, speaking ratios, filler words, leadership style. The kind of multi-dimensional analysis that requires a framework to do consistently.
- **[Invoice Organizer](https://github.com/anthropics/skills/tree/main/skills/invoice-organizer)** — reads invoices and receipts, extracts information, and renames files consistently for tax preparation. Zero coding required — you just point it at a folder.
- **[Markdown to EPUB Converter](https://github.com/smerchek/claude-epub-skill)** — converts markdown documents and chat summaries into Kindle-ready ebook files. Surprisingly useful for turning research sessions into portable reference documents.
- **[CSV Data Summarizer](https://github.com/coffeefuelbump/csv-data-summarizer-claude-skill)** — the auto-invocation showcase. Open a CSV file and this Skill fires without any prompting, generating analysis and visualizations automatically.

**The one that makes people stop:**

- **[Skill Creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator)** — a Skill whose job is to guide you through building new Skills. It provides structure for creating effective custom Skills that extend Claude's capabilities with your own specialized knowledge and workflows. A Skill that creates Skills is a good illustration of the composability the format enables.

### Building your own Skills

For developers who want full control, Skills are just folders. Create a directory with a `SKILL.md` file, write the YAML frontmatter and your instructions in Markdown, add any reference files or scripts, and zip it up. Anthropic's [Skill Creator skill](https://github.com/anthropics/skills/tree/main/skills/skill-creator) walks through the process if you want a structured starting point.

The critical detail that determines whether Claude auto-invokes your Skill: the `description` field. Front-load the key use case. The combined `description` and `when_to_use` text is truncated at 1,536 characters in the skill listing — everything past that limit won't influence invocation decisions. Write the most important trigger phrases first.

---

## Why Claude might not be using your Skill

If you've installed a Skill and Claude isn't using it, the cause is almost always one of these:

**Code execution isn't enabled.** This is the most common issue on claude.ai. Custom Skills require code execution — without it, they simply don't run. Check **Settings > Capabilities** and make sure it's toggled on.

**The description isn't matching your request.** Claude decides whether to load a Skill based on how well your request matches the Skill's description metadata. If the description is vague or uses terminology different from how you actually phrase requests, Claude won't recognize the match. Rewrite the description to mirror the exact language you use when asking for that type of task.

**The Skill is toggled off.** In claude.ai, individual Skills can be enabled or disabled. Check your Skills settings to confirm the Skill is active.

**Conflicting Skills.** If multiple Skills have overlapping descriptions, Claude may load one and not the other, or load neither due to ambiguity. Keep Skill descriptions specific and non-overlapping.

**You're in the wrong environment.** A Claude Code Skill won't work in claude.ai, and a claude.ai custom Skill that makes external API calls won't work in the sandboxed code execution environment. Make sure the Skill was built for the surface you're using it on.

---

## FAQ

**What are examples of Claude Skills?**
Anthropic ships built-in Skills for Word, Excel, PowerPoint, and PDF. Community Skills in our directory include things like a Changelog Generator that writes release notes from git history, a Meeting Insights Analyzer that surfaces behavioral patterns from transcripts, a FFUF Web Fuzzing skill for security research, and a CSV Data Summarizer that auto-analyzes data files without prompting. The range spans developer tooling, knowledge work, creative tasks, and personal productivity.

**Is Claude Skills free?**
Pre-built Anthropic Skills (Word, Excel, PowerPoint, PDF) work on all plans including Free with no setup. Custom Skills — ones you install or build yourself — require code execution to be enabled, which is available on Pro, Max, Team, and Enterprise plans in claude.ai.

**How do I know if Claude is using a Skill?**
In Claude Code, Claude will explicitly announce which Skill it's loading before using it. In claude.ai, the active Skill name is shown in the interface when it's running.

**Can Claude Skills call other Skills?**
Yes. Multiple Skills can be active in the same session, and Claude uses whichever ones are relevant to each part of a task. Complex workflows can chain Skills together — Anthropic's Superpowers framework for Claude Code is built entirely on this composability, with separate Skills for brainstorming, planning, implementation, testing, and git workflow that activate in sequence.

**Where do I access Claude Skills?**
In claude.ai, go to **Settings > Features** to manage custom Skills. Pre-built Skills are already active. For Claude Code, Skills live in `~/.claude/skills/` (personal) or `.claude/skills/` (project-level). To browse installable community Skills, the [MyMCPShelf Agent Skills Directory](/claude-skills/) lists 110+ verified options.

**What is the difference between Claude Code Skills and MCP?**
MCP connectors are persistent server processes that give Claude live access to external systems — they require a running server and a network connection. Skills are files that encode instructions and optional scripts, with no server required. For browser automation, you can use either the Playwright MCP server or the Playwright Skill — the MCP approach is more capable for complex stateful interactions; the Skill approach is simpler to deploy and has no network footprint.

**What is the difference between Claude Skills and Projects?**
Skills teach Claude how to complete specific types of tasks — they're reusable procedures. Projects give Claude persistent memory of what you're working on — accumulated context like files, goals, and prior decisions. You can and should use both together: a Project tracks your ongoing work, while Skills provide the repeatable procedures Claude uses to do that work well.

**Why is Claude not using my Skill?**
Most commonly: code execution isn't enabled in Settings, the Skill description doesn't match how you phrase your requests, or the Skill is toggled off. See the troubleshooting section above for the full checklist.

**What are Claude Skills for coding?**
In Claude Code specifically, Skills encode development procedures that activate automatically — things like enforcing TDD methodology, managing git worktrees, running Playwright tests, generating changelogs, or following your team's architecture patterns. The [Superpowers framework](/blog/superpowers-skills-framework-claude-code/) is the most developed example of this: a complete set of mandatory workflow Skills that turn Claude Code into a disciplined engineering partner.

**Are Claude Skills model-agnostic?**
Yes. The SKILL.md format is an open standard. Skills work with Codex CLI, Gemini CLI, Cursor, Windsurf, and 25+ other AI coding agents — not just Claude. Our [Agent Skills Directory](/claude-skills/) lists Skills that are cross-compatible across all of these platforms.
