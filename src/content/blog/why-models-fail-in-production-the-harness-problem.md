---
title: "Why models fail in production: the harness problem"
description: "PLUS: Microsoft's Webwright beats browser agents, MCP's hidden production costs, and when agents should actually stop"
date: "2026-05-26T08:04:57.000Z"
author: "Chester Beard"
image: "https://images.unsplash.com/photo-1739805591936-39f03383c9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDF8fGFpJTIwZmFpbHN8ZW58MHx8fHwxNzc5OTA5MDk5fDA&ixlib=rb-4.1.0&q=80&w=2000"
track: ai-field-notes
---
## Quick Scribbles

*   **Harness Engineering** — Model performance depends on production harness design, not just model capability.
  
*   **MCP Servers** — MCP protocol shifts token costs, security, and validation work onto your infrastructure.
  
*   **Microsoft Webwright** — Simple 1,000-line code boosted GPT-5.4 to 60.1% on web automation benchmarks.
  
*   **Agent Termination** — Most production agents fail at loop control and stopping logic, not prompts.

* * *

**Good morning, AI Knowledge Worker.** Your model works perfectly in demos but fails in production. The problem isn't the AI. It's the harness you haven't built yet.

Microsoft just proved this with 1,000 lines of code. Meanwhile, teams spend millions chasing better models while ignoring control systems.

**In this issue:**

*   Harness engineering: the hidden production layer
  
*   Microsoft's Webwright beats complex browser agents
  
*   MCP's undocumented infrastructure costs
  
*   Why agent termination logic breaks at scale

* * *

## Harness Engineering: The Hidden Layer Between Your Model and Production Reality

**The Scoop:** The model is only half your agent system. The harness determines whether it works in production.

**The Technical Details:**

*   **Feedforward guides** anticipate behavior before the agent acts. They increase first-attempt success probability.
  
*   **Feedback sensors** observe after action and enable self-correction loops. [Computational sensors](https://martinfowler.com/articles/harness-engineering.html) run deterministically in milliseconds.
  
*   **Inferential controls** use LLMs for semantic analysis and code review. They're slower but catch issues computational tools miss.
  
*   Architecture harnesses enforce module boundaries through **ArchUnit tests and custom linters**. They prevent structural drift automatically.
  
*   The [OpenAI team documented](https://martinfowler.com/articles/harness-engineering.html) layered architecture with garbage collection agents. They scan for drift and suggest fixes.

**Why It Matters for You:** Harness engineering offers 10x more leverage than waiting for smarter models. Organizations building harnesses now gain competitive advantage through faster deployment cycles. The implementation cost is measurable: custom linters and structural tests versus ongoing manual review. Teams at Stripe and OpenAI report their hardest challenges center on control systems. This represents a fundamental shift from model selection to system design.

**The Bigger Picture:** Software engineering moved from "better compiler" to "better architecture" decades ago. AI is making the same transition from model-centric to system-centric thinking now.

* * *

## Building Production MCP Servers: What the Spec Delegates Without Saying So

**The Scoop:** MCP shifts three expensive problems onto your infrastructure without naming them. Demo servers collapse under real-world load.

**The Technical Details:**

*   **Token costs** scale linearly with tool count in context windows. Each additional tool increases prompt overhead.
  
*   The **[MCPGAUGE study](https://arxiv.org/abs/2508.12566)** evaluated six commercial LLMs across 30 tool suites. Testing required 20,000 API calls and over $6,000 in compute costs.
  
*   **Tool-selection cost** hits attention mechanisms when models choose from dozens of tools. Performance degrades as tool counts increase.
  
*   **Sanitization and validation** fall entirely on your implementation. MCP provides no built-in input/output filtering or security controls.
  
*   Anthropic's 'expected behavior' approach delegates security to developers. You validate all tool outputs before sending to users.

**Why It Matters for You:** MCP's cost structure penalizes scale in three hidden ways. Token overhead grows with every tool you expose to models. Tool-selection latency increases as your catalog expands beyond basic demos. Security becomes your responsibility with no framework-level guardrails provided.

The MCPGAUGE findings challenge core assumptions about tool augmentation effectiveness. Models show inconsistent proactivity and compliance across different tool configurations. Implementation complexity far exceeds initial estimates for most production teams.

**The Bigger Picture:** MCP repeats the pattern of early API frameworks. Simple demos work perfectly but production requires architecture the spec ignores.

This mirrors early REST implementations where naive approaches collapsed under load. The tool-count cliff reveals fundamental attention mechanism limitations in current models.

* * *

## Microsoft's 1,000-Line Code That Just Embarrassed Every Browser Agent

**The Scoop:** Microsoft's Webwright boosted GPT-5.4 from 33.5% to 60.1% on web benchmarks. The secret: write Playwright code instead of predicting clicks.

**The Technical Details:**

*   **Core architecture spans just ~1,000 lines** across three Python modules (agent, environment, CLI).
  
*   [Webwright](https://github.com/microsoft/Webwright) uses **code-as-action**: models write full Playwright scripts rather than predict coordinates.
  
*   **Odysseys benchmark** tests 200 long-horizon tasks with 100-step budgets on real websites.
  
*   GPT-5.4 reached **60.1% success** versus Claude Opus 4.6's 44.5% leaderboard baseline.
  
*   **Workspace-as-state model**: browser sessions are disposable; persistent artifacts are code and logs.

**Why It Matters for You:** Web automation projects can now use simpler architectures with better results. Development complexity drops when models write code instead of navigating click-by-click. ROI improves through reusable scripts rather than brittle action sequences. Early adopters gain competitive advantage by deploying fewer orchestration layers. This approach cuts infrastructure costs by eliminating DOM serialization overhead.

**The Bigger Picture:** Stronger models unlock simpler architectures, reversing years of complexity creep. This mirrors how GPT-4 eliminated prompt engineering tricks that GPT-3 required.

* * *

## When Should an Agent Stop? The Anatomy of the Loop Everyone Gets Wrong

**The Scoop:** Most production agents fail at termination logic, not prompts or tools. The control loop determines reliability.

**The Technical Details:**

*   **Success termination** requires explicit goal-state verification, not assumption of completion.
  
*   **Failure modes** need categorization: retryable errors, permanent blocks, timeout thresholds, degraded states.
  
*   **Resource exhaustion** tracking covers token budgets, API rate limits, execution time caps.
  
*   The [ReAct framework](https://arxiv.org/abs/2210.03629) demonstrates interleaved reasoning traces but lacks formalized stopping conditions.
  
*   [Reflexion agents](https://arxiv.org/abs/2303.11366) use episodic memory for feedback but inherit the same loop control challenges.
  
*   Retry logic splits into four patterns: immediate, exponential backoff, circuit breaker, manual intervention.
  
*   Ambiguous states create the hardest case: partial success, uncertain progress, degraded but functional.

**Why It Matters for You:** Agent cost overruns stem from runaway loops without proper termination. Budget predictability requires hard limits on iteration counts and token consumption. The [SWE-bench evaluation](https://arxiv.org/abs/2310.06770) shows even top models solve only 1.96% of issues. Failure often occurs in loop control, not capability. Implementation requires upfront investment in circuit breaker patterns and observability. This determines whether agents become reliable tools or expensive experiments.

**The Bigger Picture:** The agent termination problem mirrors the halting problem in computer science. Distributed systems solved similar challenges with timeout patterns and health checks decades ago.

* * *

## 🌍 AI for Good

1\. **[33 Mission-Driven AI Startups Advancing Social Impact Across Climate, Health, and Education](https://www.causeartist.com/blog/impactful-ai-startups)**  
This comprehensive survey showcases how AI startups are tackling critical humanitarian challenges across multiple sectors including climate sustainability, healthcare access, education equity, and housing—demonstrating the breadth of beneficial AI applications in 2025. _— Causeartist, 2025-01-15_

2\. **[National Disability Organization Hosts Webinar on AI for Accessibility and Inclusive Technology](https://nod.org/resource/webinar-ai-for-accessibility-inclusive-tech-in-action)**  
This session addresses the critical need for responsible AI implementation in workplace and hiring systems to ensure digital experiences are accessible to people with disabilities, highlighting both opportunities and ethical considerations in AI accessibility. _— National Organization on Disability, 2025-05-20_

3\. **[Gallaudet University Launches AI Center Focused on Sign Language Accessibility](https://gallaudet.edu/research/artificial-intelligence-accessibility-and-sign-language-center)**  
The new Artificial Intelligence, Accessibility and Sign Language Center represents a pioneering academic initiative to integrate AI technologies specifically for the deaf and hard-of-hearing community, advancing inclusive AI development through research and innovation. _— Gallaudet University, 2023-12-03_

* * *

## Partner Spotlight

Support BrainScriblr while discovering powerful AI tools (affiliate links):

*   **[n8n](https://n8n.partnerlinks.io/kp8zws0d8gpb)** — No-code automation platform for AI workflows
  
*   **[Hume AI](https://try.hume.ai/zgasnk9snm1s)** — Emotional intelligence API for human-centered AI
  
*   **[Railway](https://railway.com?referralCode=6EFc41)** — Cloud platform for deploying AI applications
  
*   **[Cudo Compute](https://www.cudocompute.com/?via=chester)** — Distributed cloud computing for AI workloads

* * *

## Worth Your Inbox

Discover more quality AI and tech content:

*   **[SemiVision](https://tspasemiconductor.substack.com/?r=ykyfl&utm_campaign=referrals-subscribe-page-share-screen&utm_medium=web)** — Semiconductor industry insights and AI chip developments
  
*   **[Turing Post](https://www.turingpost.com/subscribe?ref=UkXVFz6Kl3)** — Deep technical analysis of AI research and breakthroughs
  
*   **[FinOps Weekly](https://newsletter.finopsweekly.com/subscribe?ref=UkXVFz6Kl3)** — Cloud cost optimization and financial operations
  
*   **[CoreUpdates](https://sparklp.co/d865babd/)** — Essential tech updates and startup intelligence
  
*   **[The Multiverse School](https://themultiverseschool.substack.com?r=ykyfl)** — Learning and development in the AI era
  
*   **[Simple AWS](https://newsletter.simpleaws.dev/subscribe?ref=UkXVFz6Kl3)** — Practical AWS tutorials and cloud architecture
  
*   **[EarthConscious](https://earthconsciouslife.org/subscribe?ref=24gXUoAEbr)** — Sustainable living and environmental consciousness
