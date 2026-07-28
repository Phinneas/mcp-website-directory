---
title: "SAP's RPT-1: Foundation models crack tabular data"
description: "PLUS: OpenAI splits GPT-5 into instant vs. thinking models, why 40% of multi-agent projects will fail, and markdown as agentic UI protocol"
date: "2026-04-07T06:00:46.000Z"
author: "Chester Beard"
image: "https://images.unsplash.com/photo-1759752394755-1241472b589d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDE4fHxTQVB8ZW58MHx8fHwxNzc3NjY2NDEwfDA&ixlib=rb-4.1.0&q=80&w=2000"
track: ai-field-notes
---
## Quick Scribbles

*   **SAP** — Launched RPT-1, the first foundation model suite specifically designed for tabular data like spreadsheets and databases, using semantic embeddings and ConTexTab architecture to understand column meaning rather than just content.
  
*   **OpenAI** — Released GPT-5.3 and GPT-5.4 as distinct "instant" and "thinking" models, abandoning the single general-purpose approach in favor of specialized architectures optimized for either speed or deep reasoning.
  
*   **Multi-Agent AI Systems** — Unstructured multi-agent networks amplify errors up to 17.2 times compared to single-agent systems, with Gartner predicting over 40% of agentic AI projects will be canceled by 2027 due to coordination breakdowns and architectural failures.
  
*   **Agentic UI Development** — New technical approach uses markdown as a unified protocol with streaming execution, implementing mount() primitives that create reactive UIs with four distinct data flow patterns optimized for LLM ergonomics.
  

* * *

  
**Good morning, {{first\_name | AI enthusiast}}.**

SAP just launched RPT-1, the first foundation model suite purpose-built for tabular data—using semantic embeddings to understand what spreadsheet columns and database fields actually mean, not just what they contain. While language and vision models have dominated AI headlines, the messy reality of enterprise spreadsheets and databases has resisted the foundation model revolution until now.

This breakthrough matters because tabular data represents most enterprise information, yet every dataset has unique structures and business logic that general-purpose models struggle to handle. Could specialized foundation models win the enterprise race while we wait for universal solutions that may never arrive?

**In this issue:**

*   SAP's RPT-1 cracks tabular data with semantic embeddings
  
*   OpenAI splits GPT-5 into instant vs. thinking architectures
  
*   Why 40% of multi-agent AI projects will fail by 2027
  
*   Building agentic UIs with markdown as execution protocol

* * *

## SAP's RPT-1: Foundation Models Finally Crack Enterprise Tabular Data

**The Scoop:** SAP launched [RPT-1](https://thenewstack.io/rpt-1-sap-launches-a-relational-foundation-model-for-the-enterprise/), the first serious foundation model suite built specifically for tabular data like spreadsheets and databases, using semantic embeddings to understand what columns _mean_ rather than just what they contain.

**Unpacked:**

*   **The breakthrough uses [ConTexTab architecture](https://arxiv.org/abs/2506.10707)** to enable few-shot learning, letting it adapt to specific business domains with just a handful of examples instead of requiring massive retraining.
  
*   SAP offers three variants: a small model for fast prototyping, a large model for high accuracy production use, and an **open-source version** for researchers and developers to experiment with.
  
*   This addresses a major gap in AI—while language and vision models have dominated headlines, tabular data (which makes up most enterprise information) has resisted foundation model approaches because every dataset has unique column structures and business logic.

**Bottom line:** Specialized foundation models like RPT-1 may win the near-term race for enterprise adoption, especially where data privacy and cost-performance favor on-premises deployment over cloud-based general-purpose alternatives. The question isn't whether tabular AI will advance, but whether enterprises will embrace purpose-built models or wait for catch-all solutions that may never arrive.

* * *

## OpenAI Splits Frontier AI: Instant vs. Thinking Models Signal Industry Shift

**The Scoop:** OpenAI released GPT-5.3 and GPT-5.4 just two days apart in early March, abandoning the single general-purpose model approach for distinct "instant" and "thinking" architectures.

**Unpacked:**

*   **GPT-5.3 optimizes for speed**, delivering responses in seconds for quick tasks like drafting emails, summarizing documents, and handling routine queries that don't require deep analysis.

*   **GPT-5.4 prioritizes depth over speed**, taking longer to process but excelling at complex analytical work like debugging intricate code, strategic planning, and multi-step reasoning tasks.

*   **This split forces developers to match tasks to model types** rather than defaulting to a single AI assistant, reshaping API design patterns and cost structures as teams architect workflows around "fast lane" and "slow lane" options.

**Bottom line:** This bifurcation signals that frontier AI companies see more value in specialized models than in pushing a single system to handle everything. Expect competitors to follow suit, creating an industry standard where you choose your model based on whether you need an answer now or need it right.

* * *

## The Multi-Agent Trap: Why 40% of AI Projects Will Fail

**The Scoop:** Adding more AI agents to a system often makes it worse, not better—unstructured multi-agent networks amplify errors up to 17.2 times compared to single-agent systems, and [Gartner predicts over 40% of agentic AI projects will be canceled](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027) by 2027.

**Unpacked:**

*   **The math is brutal:** When you chain agents together without structure, [errors compound exponentially](https://arxiv.org/abs/2512.08296)—a Google DeepMind study found that even agents with 95% individual accuracy produce systems that fail 64% of the time over 20 steps.

*   **Three patterns separate winners from losers:** Klarna's AI assistant handles [2.3 million conversations monthly](https://www.klarna.com/international/press/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month/) (saving $60M) using Plan-and-Execute architecture, while most companies see zero productivity gains—the difference isn't model quality, it's whether you use structured coordination patterns like Supervisor-Worker or decentralized handoffs.

*   **Five failure modes kill most projects:** A [comprehensive study of 1,642 AI system traces](https://arxiv.org/abs/2503.13657) found coordination breakdowns account for 36.9% of failures, with other killers including cost explosions (token usage multiplies 3.5x across agents), security gaps (73% have prompt injection vulnerabilities), and infinite retry loops that burn through budgets.

**Bottom line:** The companies saving millions with AI treat it as autonomous workers executing structured workflows, not copilots assisting humans for 90 minutes per week. Architecture choice—not compute budget or model selection—determines whether your multi-agent system joins the 40% that get canceled or delivers measurable returns.

* * *

## Building Agentic UIs: Markdown as Protocol with Streaming Execution

**The Scoop:** A new technical approach lets developers build agent interfaces using markdown as a unified protocol for text, executable code, and data—all streamed and interleaved in real-time.

**Unpacked:**

*   The system implements **streaming execution** where individual statements execute as soon as they're complete (using custom bun-streaming-exec), eliminating wait time for full code fence completion and making UIs more responsive.
  
*   The core innovation is the **mount() primitive** that creates reactive UIs with four distinct data flow patterns: Client → Server via forms with blocking await, Server → Client through proxy-based state mutations, LLM → Client via [streamed JSON](https://github.com/rictic/jsonriver) with incremental parsing, and Client → Server through callbacks.
  
*   The feedback loop uses console.log as the agent's internal communication channel, allowing the agent to react to its own execution—the approach optimizes for LLM ergonomics by using patterns models already know (markdown, TypeScript, React, awaitable promises) rather than teaching new protocols.

**Bottom line:** This approach shows how matching the runtime to the model's training data—rather than inventing new protocols—can create more natural and powerful agent interfaces. Developers building agent-powered applications now have practical implementation patterns that go beyond abstract theory.
