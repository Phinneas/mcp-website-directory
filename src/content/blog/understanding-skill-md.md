---
title: "Understanding SKILL.md: The Universal Skill Format"
slug: "understanding-skill-md"
date: 2026-05-23
draft: false
author: "Chester Beard"
description: "SKILL.md is the emerging open standard for AI agent skill definitions used by Claude, Cursor, VSCode Copilot, Vercel, and other platforms. This guide covers the anatomy, patterns, validation, and cross-platform compatibility you need to build or deploy skills effectively."
tags: ["skill-md", "claude-skills", "ai-agents", "mcp", "anthropic"]
category: "Claude Skills"
---

# Understanding SKILL.md: The Universal Skill Format

## BLUF

SKILL.md is the emerging open standard for AI agent skill definitions used by Claude, Cursor, VSCode Copilot, Vercel, and other platforms. It's a simple Markdown file with YAML frontmatter that tells AI agents when and how to apply specialized capabilities. Whether you're building a skill for your team, publishing to a marketplace, or evaluating skills in a directory, understanding SKILL.md structure is essential. This post covers the anatomy, patterns, validation, and cross-platform compatibility you need to build or deploy skills effectively.

---

## Why SKILL.md Matters

Before SKILL.md, skills were proprietary—ChatGPT plugins worked only in ChatGPT, system prompts only in Claude, and custom frameworks locked you into a single platform. SKILL.md solves this: build once, use everywhere.

In October 2025, Anthropic open-sourced SKILL.md. By early 2026, Cursor adopted it, VSCode Copilot announced support, and Vercel integrated it into Edge Functions. This isn't a niche format anymore—it's becoming the industry standard for AI agent skills.

### The Quick Comparison

| Format | Token Cost | Scope | Portability |
|--------|-----------|-------|------------|
| **System Prompts** | ~2,000 tokens | Single conversation | Claude-only |
| **MCP Tools** | ~500+ tokens | Tool definitions | Any MCP platform |
| **SKILL.md** | ~100 tokens (lazy-loaded) | Complete workflows | Claude, Cursor, VSCode, Vercel, others |

The key insight: SKILL.md uses progressive disclosure. The agent only loads the full instructions when the skill is relevant, keeping token costs minimal and portability maximum.

---

## SKILL.md Anatomy: The Two-Part Structure

Every SKILL.md file has two parts, separated by a `---` delimiter:

```
SKILL.md
├── Part 1: YAML Frontmatter (metadata & trigger)
└── Part 2: Markdown Body (instructions & workflow)
```

### Part 1: YAML Frontmatter

The frontmatter block (wrapped in `---` delimiters) tells the platform when to activate the skill. It's kept separate from instructions for efficiency.

**Required fields:**

**`name`** — Unique identifier (snake_case, no spaces)
```yaml
name: brand-guidelines
```

**`description`** — The trigger language (this is critical)
```yaml
description: ALWAYS USE THIS SKILL when creating presentations, 
documents, or designs that need consistent brand application including 
colors, typography, and layout specifications.
```

This description isn't marketing copy—it's the activation signal. The agent reads it and decides: "Does this match what the user just asked?" If yes, the skill loads.

**Optional fields:**

```yaml
version: 1.0.0
author: "@anthropics"
license: Apache-2.0
tags: ["branding", "design", "documents"]
requires: ["code-execution", "filesystem"]
categories: ["Design", "Brand Management"]
```

**Real example (complete frontmatter):**
```yaml
---
name: brand-guidelines
description: ALWAYS USE THIS SKILL when creating presentations, 
documents, or designs that need to apply your organization's brand 
colors, typography, and layout rules consistently.
version: 1.0.0
author: "@anthropics"
license: Apache-2.0
tags: ["branding", "design", "documents", "style"]
requires: ["code-execution", "filesystem"]
categories: ["Design", "Branding"]
---
```

### Part 2: Markdown Body

Everything after the closing `---` is the actual skill instructions. The agent reads this when the skill is triggered.

**Typical structure:**

```markdown
# Brand Guidelines Skill

Your organization's brand is expressed through:
- **Primary colors:** [hex codes]
- **Typography:** [fonts and sizes]
- **Logo placement:** [spacing and proportions]

## Workflow

1. Identify the content type (presentation? document? web?)
2. Apply the matching brand rules
3. Validate consistency
4. Deliver the output

## Example: Presentation Slide (Correct)
- Header color: #003366 (brand blue)
- Font: Roboto, 16pt
- Logo: top-right corner, 0.75" width

## Example: What to Avoid
- Don't use arbitrary colors
- Don't deviate from approved fonts
- Don't resize logo below 0.75"
```

**Best practices for the markdown body:**
- Keep it under 1,500 words (lazy-loading efficiency)
- Use H2 and H3 headers (no H1 inside body; it's in the title)
- Include 2–3 concrete examples (correct vs. incorrect)
- Use lists and tables for clarity
- Avoid HTML—stick to standard Markdown

---

## The Trigger Description: Getting It Right

This is where most developers stumble. Your `description` field determines if the skill ever activates.

**Bad trigger:**
```yaml
description: A skill for brand consistency.
```

**Problem:** Too vague. The agent won't know when to use it. If a user says "Make my document look professional," does that trigger it? Unclear.

**Good trigger:**
```yaml
description: ALWAYS USE THIS SKILL when creating presentations, 
documents, or designs that need consistent brand application including 
colors, typography, and layout specifications.
```

**Why it works:** 
- Uses action patterns ("creating presentations")
- Specific about content types ("documents," "designs")
- Clear about the purpose ("brand application")
- Agent confidently activates when user matches any of these patterns

**Tested patterns that work:**
- "ALWAYS USE THIS SKILL when the user [action] and [context]"
- Action verbs: "asks to create," "requests analysis," "wants to," "uploads"
- Content types: "presentations," "contracts," "CSV files," "documents"
- Context: "that need brand consistency," "for legal review," "to find patterns"

---

## Real-World SKILL.md Examples

### Example 1: Brand Guidelines (Simple)

```yaml
---
name: brand-guidelines
description: ALWAYS USE THIS SKILL when creating presentations, 
documents, or designs that need consistent brand application.
version: 1.0.0
---
```

**Markdown body:**
```markdown
# Brand Guidelines Skill

## Your Brand Identity

- **Primary color:** #003366
- **Secondary color:** #FF6B35
- **Font:** Roboto for body, Montserrat for headers
- **Logo:** 0.75" minimum width, never distort

## When to Apply

Apply these rules to:
- Presentations and slide decks
- PDFs and documents
- Website designs
- Marketing materials

## Workflow

1. Identify the content type
2. Apply the matching rules
3. Check consistency
4. Deliver with brand applied

## Example: Correct Slide Header
- Color: #003366 (brand blue)
- Font: Montserrat Bold, 28pt
- Logo: top-right, 0.75" width
```

### Example 2: Contract Analysis (Complex)

```yaml
---
name: contract-analyzer
description: ALWAYS USE THIS SKILL when the user uploads a contract, 
asks you to review terms, compare contracts, or extract clauses like 
liability, termination, or payment terms.
version: 1.2.0
requires: ["code-execution", "filesystem"]
tags: ["legal", "contracts", "risk-analysis"]
---
```

**Markdown body includes:**
```markdown
# Contract Analysis Skill

## Workflow

1. **Parse the contract** — Extract all clauses
2. **Identify material deviations** — Compare to baseline
3. **Flag risks** — Legal, financial, operational
4. **Summarize findings** — Executive summary with scores

## Risk Scoring

- **High risk:** Unlimited liability, unfavorable payment terms
- **Medium risk:** Ambiguous termination clauses
- **Low risk:** Standard boilerplate, market-rate terms

## Example Risk Flag

**Liability Clause (High Risk)**
- Issue: Unlimited liability with no cap
- Standard: Capped at 12 months fees
- Recommendation: Negotiate cap to 6 months fees
```

### Example 3: CSV Analysis (Data-Focused)

```yaml
---
name: csv-analyzer
description: ALWAYS USE THIS SKILL when the user uploads a CSV file 
and asks for analysis, visualization, pattern detection, or summary 
statistics.
version: 2.0.0
requires: ["code-execution"]
---
```

---

## Cross-Platform Compatibility

The beauty of SKILL.md: the same file works across Claude, Cursor, VSCode, and Vercel.

**Universally supported:**
- ✅ `name`, `description`, `version`
- ✅ Standard Markdown body (no custom syntax)
- ✅ YAML frontmatter structure

**Platform-specific extensions:**

| Platform | Special Fields | Notes |
|----------|----------------|-------|
| **Claude** | `requires: ["code-execution"]` | Controls Claude Code access |
| **Cursor** | `categories`, `tags` | Used in Cursor's Skills sidebar |
| **VSCode** | `requires: ["vscode-api"]` | VSCode-specific APIs |
| **Vercel** | `requires: ["edge-runtime"]` | 30-second execution limit |

**Best practice:** Keep frontmatter standard unless you need platform-specific features.

---

## Validation & Testing

Before publishing, validate your SKILL.md.

### YAML Syntax

**Check with an online tool:**
- yamllint.com
- jsonschema.dev

**Local validation (Bash):**
```bash
python3 -c "import yaml; yaml.safe_load(open('SKILL.md'))"
```

**Common YAML errors:**
- ❌ Tabs (use spaces only—YAML is whitespace-sensitive)
- ❌ Missing closing `---`
- ❌ Unquoted colons in strings: `description: Do this: and that` (needs quotes)
- ❌ Content before opening `---`

### Testing the Trigger

**Question:** Does your `description` match when the user does X?

Test manually:
1. Save SKILL.md locally
2. Upload to Claude (Settings → Skills → Add skill)
3. In a new chat, ask Claude to do something matching your trigger
4. Does the skill activate? ✅ or ❌

### Markdown Body Checklist

- [ ] All headings are H2 or H3 (no H4+)
- [ ] No HTML tags
- [ ] Code blocks labeled with language (```yaml, ```python)
- [ ] Examples show correct vs. incorrect
- [ ] Word count under 1,500 words

---

## Common Patterns & Mistakes

### Patterns That Work

**Pattern 1: Decision Tree**
```markdown
## Workflow

**Is this a new contract or amendment?**
- New contract → [steps for new contract review]
- Amendment → [steps for amendment only]
```

**Pattern 2: Step-by-Step Procedure**
```markdown
## Steps

1. [First thing]
2. [Second thing]
3. [Validation]
4. [Output]
```

**Pattern 3: Example-Driven**
```markdown
## Correct Output

[show what good looks like]

## Common Mistakes

[show what to avoid]
```

### Anti-Patterns to Avoid

**Anti-pattern 1: Vague Trigger**
```yaml
description: A skill for documents.
```
❌ Agent won't know when to use it.

**Anti-pattern 2: Bloated Instructions (>2,000 tokens)**
```markdown
[5,000 word essay]
```
❌ Defeats the lazy-loading purpose.

**Anti-pattern 3: No Examples**
```markdown
Apply the rules consistently.
```
❌ LLMs learn from examples, not abstract rules.

**Anti-pattern 4: Conflicting Guidance**
```markdown
Always apply brand colors.
Unless the user prefers different colors.
```
❌ Creates decision paralysis.

---

## FAQ: Featured Snippet Targets

### What's the difference between SKILL.md and a system prompt?

**System Prompt:** Applied to the entire conversation, costs ~2,000 tokens upfront, works only in Claude.

**SKILL.md:** Only loads when triggered, costs ~100 tokens on-demand, works across Claude, Cursor, VSCode, Vercel.

Think of it as: System prompt = "paint every wall," SKILL.md = "when someone asks for a wall painted, use this technique."

### Can I use SKILL.md for proprietary workflows?

Yes. SKILL.md is ideal for internal team processes. Store privately in GitHub (private repo), upload locally to Claude, or use with Enterprise Claude for org-wide deployment.

### How do I update a SKILL.md that's already in use?

1. Edit SKILL.md
2. Increment `version` (e.g., 1.0.0 → 1.0.1)
3. Re-upload to your platform
4. Users get notified to update

### Can SKILL.md call external APIs or MCP servers?

SKILL.md alone cannot. But SKILL.md + MCP works together: the skill provides workflow logic, the MCP server provides tool access.

Example:
```markdown
## Workflow

1. Use the `json-parser` MCP tool to extract data
2. Apply this skill's analysis logic
3. Return formatted results
```

### How long can SKILL.md instructions be?

**Recommended:** 1,000–1,500 words (maintains efficiency)  
**Maximum:** ~2,000 words (before token savings diminish)

If you need more: split into multiple related skills.

### How do I make my SKILL.md discoverable?

**Option 1:** Submit to [MyMCPShelf directory](https://www.mymcpshelf.com/claude-skills/) (free, editorially reviewed)

**Option 2:** Submit to [Anthropic marketplace](https://github.com/anthropics/skills) (requires open-source license)

**Option 3:** Publish to [awesome-claude-skills](https://github.com/BehiSecc/awesome-claude-skills)

**Option 4:** Share your GitHub repo (users copy SKILL.md manually)

---

## Best Practices Checklist

**Naming**
- [ ] `name` is snake_case
- [ ] `name` is under 20 characters
- [ ] `name` is descriptive (not `skill-1`)

**Trigger Description**
- [ ] Includes action verbs (ask, request, upload, create)
- [ ] Specific about content type
- [ ] Under 150 characters
- [ ] Starts with "ALWAYS USE THIS SKILL when..."

**Markdown Body**
- [ ] H2 title matches skill purpose
- [ ] Clear step-by-step workflow
- [ ] 2–3 concrete examples
- [ ] Under 1,500 words

**Metadata**
- [ ] `version` uses semantic versioning (1.0.0)
- [ ] `author` is specified
- [ ] `license` is chosen (MIT, Apache 2.0, etc.)
- [ ] `requires` lists real dependencies

**Validation**
- [ ] YAML validates on yamllint.com
- [ ] Tested on Claude (upload and activate)
- [ ] Trigger description activates in real usage

---

## The Future of SKILL.md

SKILL.md is standardizing around four key trends:

**1. Cross-Platform Adoption**  
More platforms will support it. The format is becoming what OpenAPI was for APIs—a universal language.

**2. Composability**  
Skills will chain together more elegantly. SKILL.md v2 will likely formalize multi-skill workflows.

**3. Marketplace Growth**  
Skill marketplaces are launching (Agent37, Cursor marketplace, community aggregators). SKILL.md certification standards will emerge.

**4. Tooling**  
IDE plugins will validate SKILL.md on save. Skill generators will simplify creation. Template libraries will grow.

---

## Next Steps

**Want to build a skill?** Use this post as your reference. Understand the anatomy, test your YAML, validate your trigger description.

**Want to use existing skills?** Check the [MyMCPShelf Claude Skills directory](https://www.mymcpshelf.com/claude-skills/) (600+ verified skills) or see ["Claude Skills Examples: 12 Practitioner Use Cases"](link) for real-world usage patterns.

**Have a skill idea?** Follow this guide to build it, validate it, and [submit to MyMCPShelf](https://www.mymcpshelf.com/) for editorial review and cross-platform visibility.

---

*Questions about SKILL.md or need help building a skill? [Reach out](link) or check the [official Anthropic documentation](https://platform.claude.com/docs/skills).*
