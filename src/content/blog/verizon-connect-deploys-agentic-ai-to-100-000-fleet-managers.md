---
title: "Verizon Connect deploys agentic AI to 100,000 fleet managers"
description: "PLUS: Hermes Agent's autonomous coding loops ship PRs overnight, why Google's AI can't spell 'Google', Illinois mandates AI safety audits"
date: "2026-05-29T08:04:20.000Z"
author: "Chester Beard"
image: "https://images.unsplash.com/photo-1647816213975-5a0374b4bee7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDR8fHZlcml6b258ZW58MHx8fHwxNzgwMjEyNTQ2fDA&ixlib=rb-4.1.0&q=80&w=2000"
track: ai-field-notes
---
## Quick Scribbles

*   **Verizon Connect** — Deployed agentic AI to 100,000 fleet managers processing 500 million daily data points.
  
*   **Hermes Agent v0.14.0** — Autonomous coding stack writes production PRs overnight for under $1 per task.
  
*   **Google AI Overview** — Can't spell words correctly due to tokenization processing text as tokens not letters.
  
*   **Illinois Legislature** — Passed America's strongest AI safety law requiring third-party audits for frontier labs.

* * *

**Good morning, AI Knowledge Worker.** Verizon Connect deployed agentic AI to 100,000 fleet managers across 1.2 million vehicles. The system processes 500 million daily data points autonomously.

This marks the first production agentic deployment serving over 100K daily users. Can enterprise AI finally move beyond pilots into operational reality?

**In this issue:**

*   Verizon's agentic AI manages 1.2M vehicles
  
*   Hermes Agent ships pull requests overnight autonomously
  
*   Why Google's AI fails kindergarten spelling tests
  
*   Illinois mandates third-party AI safety audits

* * *

## Verizon Connect Deploys Agentic AI to 100,000 Fleet Managers

**The Scoop:** [Verizon Connect](https://www.verizonconnect.com/) deployed agentic AI across 1.2 million vehicle subscriptions generating 500 million daily data points. The system transforms fleet management data overload into proactive insights for 100,000 users.

**The Technical Details:**

*   **Two-stage agentic architecture** using [Strands Agents](https://strandsagents.com/) on AWS Lambda with horizontal scaling capabilities.
  
*   Stage 1 aggregates anomalies autonomously. Stage 2 spawns parallel agent instances with data retrieval tools.
  
*   Switched from Claude 4.5 Haiku to **[Amazon Nova 2 Lite](https://aws.amazon.com/nova/models/)** achieving 70% input token cost reduction.
  
*   [Amazon SQS](https://aws.amazon.com/sqs/) controls maximum concurrency to stay within [Amazon Bedrock](https://aws.amazon.com/bedrock/) quotas at 1,500 RPM.
  
*   Serverless statistical model on [AWS Step Functions](https://aws.amazon.com/step-functions/) handles anomaly detection before LLM analysis begins.
  
*   Five-hour processing window delivers insights by 8AM ET across all US time zones.

**Why It Matters for You:** Agentic AI replaced static dashboards that only catch predefined patterns with dynamic investigation. Fleet managers now receive proactive safety alerts before costly incidents occur. The 70% cost reduction with Nova 2 Lite makes enterprise-scale deployment financially viable. Serverless architecture eliminates infrastructure management while maintaining sub-two-hour processing at massive scale. This represents the first production deployment pattern for agentic AI serving 100K+ daily users.

**The Bigger Picture:** This deployment proves agentic AI can scale beyond demos to production systems. Previous rule-based automation missed edge cases and novel correlations that agents discover autonomously. Verizon Connect's success provides a blueprint for enterprises drowning in IoT data.

* * *

## The Autonomous Coding Stack Nobody's Talking About: Hermes Agent v0.14.0 + Claude Code + Sequential Thinking MCP

**The Scoop:** Nous Research shipped a stack that writes pull requests overnight. No human intervention required.

**The Technical Details:**

*   [Hermes Agent v0.14.0](https://github.com/NousResearch/Hermes-2-Pro-Agent/releases/tag/v0.14.0) bundles **Claude Code delegation skill** in \`skills/autonomous-ai-agents/claude-code/SKILL.md\`
  
*   Print mode enables **fully autonomous terminal execution** with flags: \`--max-turns 30\`, \`--max-budget-usd 1.50\`, \`--allowedTools 'Read,Edit,Bash'\`
  
*   [Sequential Thinking MCP server](https://github.com/modelcontextprotocol/servers/tree/main/src/servers/sequential-thinking) forces **structured planning in 3-7 branching thoughts** before code execution
  
*   Integration reads shared \`CLAUDE.md\` discipline file (Karpathy's four principles) as **standing system prompt** for both layers
  
*   Real production results: **3 nights, 3 PRs, 2 merged**, average cost $0.89 per task, 20-90 minute wall-clock time

**Why It Matters for You:** The economics reshape junior engineering budgets entirely. 90-day projection shows 43 merged PRs for $58 in inference costs. Human review overhead: 5.4 hours quarterly for approval gates. The ratio delivers 12:1 saved engineering hours per review hour. Even at 40% merge rate the math holds at 7:1. Risk mitigation requires review gates until discipline layer proves stable beyond three-night baseline. Implementation timeline: 45 minutes if Hermes runs already, two hours from scratch.

**The Bigger Picture:** The bottleneck shifted from model capability to system wiring overnight. Claude Opus 4.7 was always capable enough to write production code. The missing piece was disciplined orchestration between scheduling, execution, and review layers.

* * *

## Why Google's AI Can't Spell 'Google': The Tokenization Problem Explained

**The Scoop:** [Google's AI Overview](https://techcrunch.com/2026/05/27/why-googles-ai-cant-spell-google-or-anything-else) claims there are two 'p's in Google. It spelled journalism as "j-o-u-r-n-a-d-i-s-m." This isn't a bug.

**The Technical Details:**

*   **Transformer models** process text as numerical tokens, not individual characters.
  
*   LLMs encode words into [vector representations](https://techcrunch.com/2026/05/27/why-googles-ai-cant-spell-google-or-anything-else) without tracking letter sequences.
  
*   Token granularity varies: full words, syllables, or letter fragments.
  
*   Models lack character-level awareness required for counting letters within words.
  
*   No perfect tokenizer exists due to inherent trade-offs in chunking strategies.

**Why It Matters for You:** AI reliability remains a production deployment risk despite impressive capabilities. Every AI-generated output requires human verification before customer-facing use. This adds operational costs to implementation budgets and timelines. The spelling problem reveals fundamental architectural constraints that money can't solve.

**The Bigger Picture:** LLMs can solve complex math problems but fail kindergarten spelling tests. This gap between advanced reasoning and basic tasks defines current AI limits.

* * *

## Illinois Passes America's Strongest AI Safety Law: Third-Party Audits Now Required for Frontier Labs

**The Scoop:** Illinois House passed [legislation requiring frontier AI labs to submit to third-party safety audits](https://www.wired.com/story/illinois-passes-major-ai-safety-law-pritzker/). The bill targets OpenAI, Anthropic, and Google DeepMind.

**The Technical Details:**

*   **Frontier AI labs** must undergo independent third-party safety practice audits.
  
*   Covers companies building **cutting-edge foundation models** with advanced capabilities.
  
*   Targets major players: **OpenAI, Anthropic, and Google DeepMind** specifically.
  
*   Awaits Governor Pritzker's signature to become enforceable state law.
  
*   AI safety experts call it **the nation's leading check** on major AI companies.

**Why It Matters for You:** This creates the first enforceable state-level compliance framework for AI developers. Companies operating in Illinois face new audit costs and disclosure requirements. The bill sets a potential template for other states considering AI regulation. Unlike California's vetoed SB 1047, this approach survived legislative scrutiny.

**The Bigger Picture:** States are stepping into the federal regulatory vacuum on AI safety. Illinois' third-party audit model offers a middle path between industry self-regulation and government oversight.

* * *

## 🌍 AI for Good

1\. **[AI Adoption in Charity Sector Jumps to 76% as Digital Skills Expand](https://www.facebook.com/groups/2140356546322077/posts/2768968013460924)**  
The 2025 Charity Digital Skills Report reveals a significant 15-percentage-point increase in AI adoption among charitable organizations, demonstrating how nonprofits are increasingly leveraging AI to enhance their humanitarian mission and operational efficiency. _— Facebook - Charitable Community Initiatives Group, 2026-05-27_

2\. **[New AI Platform Developed to Support Nonprofits Serving Unhoused Populations](https://www.facebook.com/TechSoup/posts/attention-nonprofits-the-bridgespan-group-and-nten-need-your-input-on-how-youre-/1431655365668016)**  
The Bridgespan Group and NTEN are creating a specialized AI platform designed to address specific challenges faced by nonprofits working with homeless communities, demonstrating human-centered AI development that incorporates direct input from frontline organizations. _— TechSoup, 2026-05-26_

3\. **[Choice Humanitarian CEO Advocates for Locally-Led Development Amid USAID Changes](https://citizenportal.ai/articles/6447932/Utah/Choice-Humanitarian-CEO-urges-locally-led-development-warns-of-funding-risks-after-USAID-restructuring)**  
As USAID undergoes restructuring, humanitarian leaders emphasize the importance of locally-led development approaches that empower communities, a principle increasingly relevant as AI tools are deployed in humanitarian contexts. _— Citizen Portal, 2026-05-28_

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
