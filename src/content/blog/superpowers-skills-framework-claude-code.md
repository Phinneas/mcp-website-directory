---
title: "Superpowers: The Skills Framework That Makes Claude Code a Disciplined Engineering Partner"
description: "With 40k+ GitHub stars and more installs than Playwright on the Claude Code marketplace, Superpowers by Jesse Vincent is one of the most important open-source tools in the agentic AI ecosystem. Here's what it is, how it works, and why it matters."
date: 2026-02-26T00:00:00.000Z
author: "Buzz"
tags: ["claude-code", "skills", "agentic-ai", "developer-tools", "claude-plugins", "tdd", "open-source"]
featured: true
---

If you've spent time with Claude Code or any AI coding assistant, you've probably experienced this frustration: you ask it to build a feature, and within seconds it's generating hundreds of lines of code—no planning, no test strategy, no consideration for maintainability. You end up spending more time reviewing and refactoring the AI's output than you would have spent writing the code yourself.

**[Superpowers](https://github.com/obra/superpowers)** by Jesse Vincent is an open-source solution to exactly this problem. It's an agentic skills framework that injects senior engineering discipline directly into Claude Code's workflow. Since its release in October 2025, it has amassed over 40,000 GitHub stars and has more installs on the Claude Code marketplace than Playwright.

This post explores what Superpowers is, how it works under the hood, and why it matters for anyone using AI coding assistants.

---

## What Is Superpowers?

Superpowers is not an MCP server—it's an agentic workflow framework. It's a Claude Code plugin that gives your AI assistant a structured set of mandatory processes to follow when coding. Instead of hoping your AI will follow best practices, Superpowers encodes those practices into composable "skills" that the AI is compelled to use.

The installation is straightforward:

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

After restarting, Claude Code gets a bootstrap prompt:

```xml
<session-start-hook>
<EXTREMELY_IMPORTANT>
You have Superpowers.
RIGHT NOW, go read: @~/.claude/plugins/cache/Superpowers/skills/getting-started/SKILL.md
</EXTREMELY_IMPORTANT>
</session-start-hook>
```

This teaches Claude three things:
1. You have skills (Superpowers)
2. Search for skills by running a script; use a skill by reading and following it
3. If a skill exists for a task, you **must** use it

That last rule is what makes the system work. Skills aren't suggestions—they're mandatory.

## The Five-Phase Workflow

When Superpowers is active, your coding sessions follow a structured five-phase workflow, each governed by its own skill.

### Phase 1: Brainstorming (Design First)
Before writing any code, the `brainstorming` skill triggers a Socratic dialogue to clarify what you're actually trying to build. The AI asks questions, explores alternatives, and presents a design document for approval before any implementation begins.

### Phase 2: Git Worktrees (Isolated Workspace)
The `using-git-worktrees` skill creates an isolated workspace on a new branch. It sets up the project, verifies a clean test baseline, and ensures parallel development doesn't cause conflicts.

### Phase 3: Implementation Planning
The `writing-plans` skill breaks the approved design into a detailed implementation plan. Each task is broken into 2-5 minute chunks with exact file paths, code snippets, and verification steps. The plan must be clear enough for "an enthusiastic junior engineer with poor judgment" to follow.

### Phase 4: Subagent-Driven Development
This is where Superpowers gets innovative. Instead of one AI session trying to do everything, fresh subagents are dispatched for each task. Each task goes through a two-stage review:
1. **Spec compliance** – Does the implementation match the plan?
2. **Code quality** – Is the code well-structured and maintainable?

Critical issues block progress. The system effectively embeds a code reviewer into every step.

### Phase 5: Test-Driven Development (Enforced)
The `test-driven-development` skill enforces strict RED-GREEN-REFACTOR:
1. Write a failing test
2. Watch it fail (confirming the test actually tests something)
3. Write minimal code to pass
4. Watch it pass
5. Refactor

Code written before tests exist is automatically deleted. This isn't a suggestion—it's enforced.

## The Skills Architecture

Each Superpower is a `SKILL.md` file with:
- **When to activate** (triggering conditions)
- **What it does** (the methodology)
- **Step-by-step instructions** (exact commands to run)

The system loads skills on-demand for context efficiency. The agent runs a script to search for relevant skills, reads the relevant `SKILL.md` files, then follows the instructions.

The skills library includes:
- `brainstorming` – Design refinement before any code
- `writing-plans` – Detailed implementation planning  
- `subagent-driven-development` – Parallel task execution with review
- `test-driven-development` – Enforced RED-GREEN-REFACTOR
- `systematic-debugging` – 4-phase root cause analysis
- `git-worktrees` – Isolated development branches
- `writing-skills` – Meta-skill for creating new skills

The `writing-skills` skill is particularly meta: it teaches Claude how to create new skills using TDD-for-skills methodology.

## The Persuasion Science Angle

Jesse Vincent discovered that classical persuasion principles (Cialdini's 7 principles) work on LLMs just like on humans. The skills are designed with:
- **Authority**: "Skills are mandatory when they exist"
- **Commitment**: The agent must announce which skill it's using
- **Social proof**: "This is how senior engineers work"
- **Scarcity**: "Production is down, costing $5K/minute—check the skill or start debugging"

This isn't manipulation—it's engineering reliability through behavioral design.

## Multi-Agent Support & Expansion

Originally Claude-only, Superpowers now supports:
- **Cursor** via marketplace
- **OpenAI Codex** via fetch-and-follow installation
- **OpenCode** via manual installation
- **Superpowers Lab** for experimental skills

The `remembering-conversations` skill is particularly interesting: it stores conversation transcripts in a SQLite vector database, giving Claude a searchable memory of past sessions.

## Superpowers vs. MCP: Complementary Layers

While this is a MyMCPShelf publication, it's worth clarifying: Superpowers and MCP solve different problems.

**MCP (Model Context Protocol)** = How AIs *access tools* (databases, APIs, filesystems)  
**Superpowers** = How AIs *behave* when using those tools

They're complementary: use MCP servers for tool access, Superpowers for ensuring those tools are used methodically.

## Getting Started

For Claude Code users:
```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

For Cursor: Search "Superpowers" in the marketplace.

For OpenAI Codex:
```bash
# Fetch and follow installation
curl -s https://raw.githubusercontent.com/obra/superpowers/main/.codex/INSTALL.md | sh
```

## Why It Matters

Superpowers addresses the core frustration with AI coding assistants: they're brilliant at generating code but terrible at software engineering. By enforcing TDD, code review, design-first thinking, and systematic debugging, it elevates AI from a "fast typist" to a disciplined engineering partner.

The 40k+ GitHub stars and marketplace adoption suggest the community agrees: disciplined AI is more useful than fast AI.

**Links:**
- [GitHub Repository](https://github.com/obra/superpowers)
- [Superpowers Lab (experimental skills)](https://github.com/obra/superpowers-lab)
- [Jesse Vincent's Blog](https://blog.fsck.com) (development process & persuasion science)
- [Private Journal MCP](https://github.com/obra/private-journal-mcp) (Jesse's MCP server for agent journaling)

*This post is part of MyMCPShelf's ongoing coverage of the MCP ecosystem. Superpowers isn't an MCP server, but it's a critical layer in the agentic AI stack—the "how to work" layer above the "what you can do" that MCP provides.*