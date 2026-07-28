---
title: "Microsoft routes GitHub through AWS for AI coding"
description: "PLUS: AWS Strands Evals automates agent debugging, and Respond.io raises $62.5M for AI customer service at $35M ARR"
date: "2026-06-16T08:04:36.000Z"
author: "Chester Beard"
image: "https://images.unsplash.com/photo-1647166545674-ce28ce93bdca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDZ8fGdpdGh1YnxlbnwwfHx8fDE3ODIwNzM2OTZ8MA&ixlib=rb-4.1.0&q=80&w=2000"
track: ai-field-notes
---
## Quick Scribbles

*   **Microsoft/GitHub** — Routes GitHub traffic through AWS as AI coding surge causes infrastructure strain.
  
*   **AWS** — Launches Strands Evals SDK for automated root cause analysis of agent failures.
  
*   **Azure** — Tutorial shows AI Gateway Content Safety blocking malicious prompts at infrastructure layer.
  
*   **Respond.io** — Raises $62.5M Series B at $35M ARR for AI agent customer service platform.

* * *

**Good morning, AI Knowledge Worker.** Microsoft is routing GitHub traffic through Amazon Web Services. AI coding assistants generated unexpected infrastructure strain. Azure can't keep pace with demand.

The company promised Azure-first migration in 2018. Now it's paying a cloud rival for capacity. What does this signal about AI infrastructure bottlenecks?

**In this issue:**

*   Microsoft routes GitHub through AWS for AI coding surge
  
*   AWS Strands Evals automates agent debugging with root cause analysis
  
*   Azure AI Gateway tutorial implements production security controls
  
*   Respond.io raises $62.5M at $35M ARR with AI customer service agents

* * *

## Microsoft Routes GitHub Through AWS as AI Coding Surge Strains Infrastructure

**The Scoop:** Microsoft is routing GitHub traffic through Amazon Web Services after AI coding strained the platform. This reverses the Azure-first migration plan Microsoft promised in 2018.

**The Technical Details:**

*   GitHub commits jumped from **1 billion in 2025 to 14 billion projected in 2026** per COO Kyle Daigle.
  
*   GitHub CTO Vlad Fedorov [initially planned for 10X capacity increase](https://github.blog/changelog/2025-04-availability-update/), then revised to **30X by February 2026**.
  
*   Migration progress shows **40% of monolith traffic on Azure**, up from 8% in February.
  
*   [Nine service incidents hit GitHub in May 2026](https://github.blog/changelog/2026-05-availability-update/), including cascading database failures affecting pull requests and webhooks.
  
*   Microsoft expects **$190 billion in 2026 capex** but remains capacity-constrained through year-end.

**Why It Matters for You:** GitHub downtime now poses greater operational risk than paying a cloud rival. The platform handles code review, CI/CD, and collaboration for enterprise development teams. When those workflows stall, developers experience GitHub as the bottleneck, not just a capacity issue. Competitors like Cursor and Claude Code gain credibility when GitHub reliability becomes a tax. Azure capacity gets allocated across OpenAI demand, Copilot products, and customer workloads simultaneously. GitHub becomes one more internal claimant on scarce infrastructure during peak AI adoption.

**The Bigger Picture:** Even hyperscalers are buying bridge capacity from rivals when AI demand outpaces planning cycles. Google committed $920 million monthly to SpaceX for compute access through 2029. Infrastructure bottlenecks are becoming competitive vulnerabilities as AI tools generate machine-paced workflows. Platforms built for human-speed collaboration now must absorb agents generating commits, tests, and pull requests at scale.

* * *

## AWS Strands Evals: Automated Root Cause Analysis for Production Agent Failures

**The Scoop:** AWS released Strands Evals SDK with automated agent failure diagnosis. The system reduces debugging time from hours to minutes.

**The Technical Details:**

*   [Strands Evals SDK](https://github.com/awslabs/strands-evals) uses **two-phase LLM-based analysis** of OpenTelemetry execution traces.
  
*   Phase 1 scans each span against **nine failure categories** with confidence scores.
  
*   Phase 2 builds **causal chains** linking primary failures to downstream symptoms.
  
*   **CloudWatch integration** fetches production traces via \`CloudWatchProvider\` for offline analysis.
  
*   Detector handles large sessions through **tiered strategies**: direct analysis, failure path pruning, chunked windows.

**Why It Matters for You:** Manual trace inspection doesn't scale when operating agents in production. Diagnosis automation makes agent quality improvement systematic rather than ad-hoc. The SDK integrates into CI/CD pipelines with \`ON\_FAILURE\` triggers for cost efficiency. Fix recommendations specify whether changes belong in system prompts or tool definitions. This turns regression detection into actionable engineering work.

**The Bigger Picture:** Agent debugging faces the same scaling challenge infrastructure monitoring solved a decade ago. Strands Evals applies automated observability patterns to the unique failure modes of agentic systems.

* * *

## Implementing AI Security: Azure AI Gateway Tutorial for Production Apps

**The Scoop:** Azure AI Foundry Content Safety blocks malicious prompts before they reach LLM models. Tutorial shows gateway-layer security for production AI applications.

**The Technical Details:**

*   **Azure API Management deploys two backend instances**: one for [model inference](https://miro.medium.com/v2/resize:fit:1200/1*54JUbZtLHidvGCX4sA4YdA.png), one for Content Safety review.
  
*   Content Safety uses **its own internal model** to analyze prompts and responses.
  
*   **Shield-prompt policy blocks prompt injection** and jailbreak attacks at gateway layer.
  
*   **Category filters score content 0-7** across Hate, SelfHarm, Sexual, Violence dimensions.
  
*   **Custom blocklists support regex patterns** for SSNs, credit cards, and proper nouns.
  
*   Policy enforcement happens **before requests reach deployed LLM models**, reducing attack surface.

**Why It Matters for You:** Production AI apps face prompt injection and data leakage risks daily. A single breach costs more than implementing gateway-layer security controls upfront. Content Safety integrates with existing API Management infrastructure without custom code. Implementation takes hours rather than weeks of security engineering effort. This approach meets compliance requirements for regulated industries deploying AI agents.

**The Bigger Picture:** Gateway-layer security mirrors how web application firewalls protect traditional apps. As AI agents handle sensitive data, security shifts left to infrastructure layer.

* * *

## Malaysia's Respond.io Raises $62.5M Series B for AI Agent Customer Service Platform

**The Scoop:** [Respond.io](https://techcrunch.com/2026/06/15/malaysias-respond-io-raises-62-5m-eyes-acquisitions-in-north-america-and-europe/) raised $62.5M at $35M ARR with 169% YoY growth. The platform uses AI agents to automate customer service across messaging channels.

**The Technical Details:**

*   Processes **2 billion messages quarterly** across WhatsApp, Instagram, TikTok, Messenger, Line, Telegram.
  
*   **AI agents automatically handle** customer inquiries, qualify leads, and close sales.
  
*   Integrates voice calls, web chat, and WeChat into unified conversation platform.
  
*   Targets B2C businesses with 200-10,000 employees in healthcare, automotive, retail, education, travel.
  
*   Built messaging-first architecture versus legacy platforms that bolted messaging onto email systems.

**Why It Matters for You:** Traditional per-seat pricing dies when AI replaces human agents. Respond.io charges per conversation volume instead of per user seat. This pricing model protects revenue as automation increases.

The company achieved 30% profit margins while growing 169% year-over-year. Most high-growth SaaS companies burn cash at this scale. Their data flywheel creates competitive moat: more messages train better AI models.

Messaging now drives B2C customer acquisition for high-consideration purchases. Email and phone-first platforms struggle to retrofit messaging capabilities at scale.

**The Bigger Picture:** This signals the shift from per-seat to consumption-based pricing in AI. When software replaces humans, legacy pricing models collapse for incumbent vendors. The data advantage matters: early movers with billions of training messages outperform new entrants.

* * *

## 🌍 AI for Good

1\. **[Tech Leaders Address AI Access Gap in Disaster Management and Climate Resilience](https://aiforgood.itu.int/event/tech-leadership-in-the-age-of-ai-2)**  
This panel brings together Fellows from the inaugural AI for Good cohort working on disaster management and climate resilience, highlighting how communities most in need of AI often lack representation in the data and access to the technology. The initiative demonstrates concrete efforts to bridge the AI equity gap in humanitarian work. _— AI for Good, 2026-06-10_

2\. **[Italy Launches Europe's First National AI Framework Grounded in Human-Centered Ethics](https://decode39.com/15201/italy-ties-ai-rulebook-to-pope-leo-xivs-human-centered-vision)**  
Italy is rolling out what it describes as Europe's first comprehensive national AI framework, uniquely grounding technology policy in Pope Leo XIV's encyclical Magnifica Humanitas. This approach represents a novel integration of ethical and humanistic values into AI governance at the national level. _— Decode39, 2026-06-14_

3\. **[Social Impact Organizations Navigate AI Strategy Through Risk-Balanced Framework](https://www.linkedin.com/posts/jacaranda-health_a-path-through-ai-overwhelm-ssir-activity-7470440348499005440-0cWd)**  
New guidance helps social impact organizations make strategic choices about where AI can genuinely improve outcomes while managing associated risks. This framework addresses the critical need for nonprofits and humanitarian organizations to adopt AI thoughtfully and effectively. _— Jacaranda Health via LinkedIn, 2026-06-13_

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
