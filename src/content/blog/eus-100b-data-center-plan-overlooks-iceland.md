---
title: "EU's $100B data center plan overlooks Iceland"
description: "PLUS: Build local AI coding agents with Ollama and Continue, Ollama 0.19's 93% MLX speed boost on Apple Silicon"
date: "2026-06-30T08:04:51.000Z"
author: "Chester Beard"
image: "https://images.unsplash.com/photo-1658823276022-d6613757faa3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDZ8fEVVfGVufDB8fHx8MTc4MzU1MzA2M3ww&ixlib=rb-4.1.0&q=80&w=2000"
track: ai-field-notes
---
## Quick Scribbles

*   **EU Data Centers** — Europe's $100B AI plan ignores Iceland's cheap renewable power and free cooling.
  
*   **Local AI Coding** — Run privacy-first AI coding agents on your laptop using Ollama and Continue.
  
*   **Ollama 0.19** — New MLX framework delivers 93% faster inference on Apple Silicon Macs.
  
*   **AI Job Impact** — Companies announce 90K AI cuts yet high-adopters grew headcount by 10%.

* * *

**Good morning, AI Knowledge Worker.** The EU commits $100 billion to triple data center capacity. Meanwhile, Iceland sits ignored with cheap renewable power and free cooling.

Why does Brussels fund twelve-month mainland delays when execution-ready infrastructure already exists?

**In this issue:**

*   EU's $100B plan overlooks Iceland's AI advantages
  
*   Build local coding agents with Ollama and Continue
  
*   Ollama 0.19 delivers 93% speed boost via MLX
  
*   Conflicting data muddies the AI job loss debate

* * *

## Why Europe's $100B AI Data Center Plan Ignores Its Best Site: Iceland

**The Scoop:** The EU plans to triple data center capacity. Iceland already has cheap renewable power and free cooling.

**The Technical Details:**

*   Iceland runs on **100% renewable energy** from geothermal and hydropower sources.
  
*   [Verne and Nscale deployed 4,600 Nvidia Blackwell Ultra GPUs](https://twitter.com/HeeraniPK/status/1811851230144405760) with liquid cooling infrastructure.
  
*   Natural ambient cooling eliminates **the largest operational cost** for AI hardware.
  
*   Iceland currently hosts only **80-150 megawatts** of tracked AI capacity.
  
*   Operators can build bespoke centers in **twelve months** versus mainland timelines.

**Why It Matters for You:** Energy costs for AI training can represent 40-60% of operating expenses. Iceland's geothermal power costs a fraction of mainland European rates. SoftBank committed €75 billion to France while EU gigafactory funding stumbles. Only two of five planned sites get funding before 2028. The permitting bottleneck delays projects by years regardless of power availability. Infrastructure location decisions lock in cost structures for decades of operations.

**The Bigger Picture:** Europe's 70% cloud dependency on US providers persists despite sovereignty rhetoric. The continent has natural advantages but treats them as afterthoughts. Brussels writes ambitious regulations while private capital flows to execution-ready jurisdictions.

* * *

## Build a Local AI Coding Agent: Ollama + Continue + MCP on Your Laptop

**The Scoop:** Run privacy-first AI coding agents entirely on your laptop. No cloud dependencies or subscription fees required.

**The Technical Details:**

*   Stack combines [Ollama](https://pub.towardsai.net/build-your-own-local-ai-coding-agent-with-ollama-continue-mcp-8b9b77f70d96) runtime, Continue VS Code extension, and Model Context Protocol.
  
*   **Qwen 2.5 Coder 1.5B** delivers 188 tokens/sec autocomplete with 1.6GB memory footprint.
  
*   **14B instruct model** provides tool-calling and reasoning at 30 tokens/sec using 9.3GB RAM.
  
*   **Memory ceiling matters**: 24GB unified memory supports 14B models comfortably without swap thrashing.
  
*   MCP servers expose filesystem and shell tools through **standardized JSON-RPC protocol**.
  
*   Apple M-series **unified memory architecture** eliminates GPU-CPU transfer bottlenecks for local inference.

**Why It Matters for You:** Local deployment eliminates recurring API costs entirely. Zero tokens sent to third parties means compliance teams approve faster. Implementation requires one weekend for experienced developers to configure the full stack. Hardware investment of $2,400 (M5 Pro MacBook) pays back in 6-8 months versus GitHub Copilot Enterprise subscriptions. Privacy-conscious enterprises gain code sovereignty without sacrificing developer productivity.

**The Bigger Picture:** This mirrors the shift from mainframe terminals to personal computers. Developers regain control over their toolchain without depending on vendor API uptime.

* * *

## Ollama 0.19's Secret Weapon: 93% Faster Inference via MLX vs llama.cpp

**The Scoop:** Ollama 0.19 quietly swapped engines on Mac. Inference speed nearly doubled overnight.

**The Technical Details:**

*   **[Ollama 0.19](https://pub.towardsai.net/i-tested-ollama-vs-lm-studio-on-the-same-mac-one-quietly-doubled-its-speed-ad8dcb6a89f7?source=rss----98111c9905da---4) replaced llama.cpp Metal with Apple's MLX framework** on March 31, 2026.
  
*   **M5 Max running Qwen3.5-35B saw decode jump from 58 to 112 tokens/second** (93% gain).
  
*   Prefill speed increased from 1,154 to 1,810 tokens per second on same hardware.
  
*   **MLX speedup materializes with models above 20B parameters** that saturate memory bandwidth.
  
*   GGUF models remain portable across platforms but sacrifice Apple Silicon optimization entirely.

**Why It Matters for You:** Mac-based AI workflows now run twice as fast with zero code changes. Tool choice determines optimization access, not just CLI versus GUI preference. MLX locks teams to Apple Silicon but delivers measurable throughput gains. Memory planning becomes critical as MLX trades portability for performance on large models. Teams standardized on Mac hardware gain immediate competitive advantage in inference-heavy applications.

**The Bigger Picture:** Framework fragmentation mirrors database wars: specialized engines beat general-purpose tools on native hardware. Portability now costs performance, forcing strategic platform commitments early.

* * *

## AI Job Loss Fears Meet Conflicting Data: What the Numbers Actually Show

**The Scoop:** Through May 2026, companies announced 90,000 AI-related job cuts. Yet [high-intensity AI adopters grew headcount 10.2%](https://techcrunch.com/2026/06/29/the-ai-jobs-debate-just-got-messier/)—including entry-level roles.

**The Technical Details:**

*   [Ramp and Revelio Labs tracked](https://techcrunch.com/2026/06/29/the-ai-jobs-debate-just-got-messier/) AI spend and workforce records across 22,000 companies.
  
*   **High-intensity adopters** spent $30 per employee monthly on AI in first three months.
  
*   Entry-level headcount rose **12% at tech-forward firms** despite broader Gen Z concerns.
  
*   Information sector (software, internet, media) showed **strongest job growth among AI adopters**.
  
*   Companies running pilot programs without sustained investment saw **zero headcount gains**.
  
*   [Ford rehired 350 veteran engineers](https://techcrunch.com/2026/06/28/ford-rehires-gray-beard-engineers-after-ai-falls-short/) after AI quality systems delivered disappointing results.

**Why It Matters for You:** The data skews toward VC-backed tech firms already in growth mode. Causation remains unclear—AI may follow expansion rather than drive it. Firms without capital, technical staff, and management bandwidth to sustain AI investments show no gains. The report authors warn firms lacking these resources "may fall behind." This suggests AI widens gaps between resource-rich and resource-poor organizations rather than lifting all boats.

**The Bigger Picture:** AI creates different jobs than it eliminates at well-resourced firms. Lower production costs in core workflows increase returns to expanding entire organizations. This mirrors previous technology adoption patterns where early movers with resources captured disproportionate gains.

* * *

## 🌍 AI for Good

1\. **[OpenAI Launches People-First Fund for Nonprofits Leveraging AI](https://www.instagram.com/p/DaIq8xUxDy8)**  
OpenAI's new grant program supports nonprofit organizations integrating AI for social good, with a median historical grant of $215,000, demonstrating major philanthropic investment in beneficial AI applications. _— Power Partners, 2026-06-28_

2\. **[AFP Miami Explores Human-Centered AI for Fundraising While Preserving Donor Relationships](https://www.facebook.com/AFPMiami/posts/ai-is-changing-fundraisingare-you-readyartificial-intelligence-is-transforming-t/1398333642343686)**  
This initiative addresses the critical balance between AI adoption and maintaining authentic human connections in philanthropy, focusing on using AI to strengthen rather than replace donor relationships. _— AFP Miami, 2026-06-28_

3\. **[Most AI Funding for Nonprofits Goes to Tools, Not Implementation Support](https://www.facebook.com/Devex/posts/opinion-most-ai-funding-for-nonprofits-goes-to-the-tools-almost-none-goes-to-wha/1462447105913205)**  
This opinion piece highlights a critical gap in AI philanthropy, revealing that while nonprofits receive funding for AI tools, they lack resources for effective implementation and capacity building. _— Devex, 2026-06-27_

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
