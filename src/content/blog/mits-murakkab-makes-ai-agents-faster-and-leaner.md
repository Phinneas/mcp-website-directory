---
title: "MIT's Murakkab makes AI agents faster and leaner"
description: "PLUS: Gemini 3.5 Flash gains computer use, Huntington redacts 400M+ documents with AWS, and 5 production RAG patterns"
date: "2026-06-26T08:04:12.000Z"
author: "Chester Beard"
image: "https://images.unsplash.com/photo-1656140269588-e643ed5258d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDV8fG1pdHxlbnwwfHx8fDE3ODI3NTk1NzR8MA&ixlib=rb-4.1.0&q=80&w=2000"
track: ai-field-notes
---
## Quick Scribbles

*   **MIT** — Murakkab system cuts AI agent energy use by 73% through automated optimization.
  
*   **Google** — Gemini 3.5 Flash now includes built-in computer use across browser, mobile, desktop.
  
*   **Huntington Bank** — Redacted 400M+ documents in months using AWS AI, down from years.
  
*   **RAG Architectures** — Five distinct patterns solve different problems from naive to agentic approaches.

* * *

**Good morning, AI Knowledge Worker.** MIT researchers just solved AI's efficiency problem. Their Murakkab system cuts agent energy use by 73%. Performance stays unchanged.

Manual workflow configuration wastes computing resources at massive scale. Could automated optimization reshape enterprise AI economics entirely?

**In this issue:**

*   MIT's Murakkab slashes AI agent energy costs
  
*   Gemini 3.5 Flash integrates computer use natively
  
*   Huntington redacts 400M+ documents with AWS
  
*   Five production RAG patterns that actually work

* * *

## MIT's Murakkab System Optimizes AI Agent Workflows for Speed and Energy Efficiency

**The Scoop:** MIT researchers built [Murakkab](https://news.mit.edu/2026/improving-ai-agent-speed-and-energy-efficiency-0625), a system that automates agentic workflow design and deployment. It slashes energy use by 73% while maintaining performance.

**The Technical Details:**

*   Developers describe workflows in **plain language** without specifying technical implementation details.
  
*   The system **automatically selects optimal models** and tools from available options.
  
*   Murakkab identifies which components run sequentially and which execute in **parallel**.
  
*   **Dynamic hardware allocation** adjusts configurations in real-time based on user constraints.
  
*   Tests showed **35% computational usage** compared to traditional manual configuration approaches.

**Why It Matters for You:** Current agentic workflows waste resources through inefficient manual configuration at deployment. Murakkab cuts energy consumption to 27% of baseline levels for 25% cost. The system eliminates developer overhead when new AI models release or update. Cloud providers gain visibility into multiple workloads for smarter resource sharing. This addresses the growing energy crisis as AI workflows become infrastructure backbone.

**The Bigger Picture:** As AI agents power more enterprise applications, infrastructure efficiency becomes critical. Manual workflow optimization fails when configuration spaces involve dozens of models and tools.

* * *

## Google Integrates Computer Use Directly into Gemini 3.5 Flash for Cross-Platform Agents

**The Scoop:** Computer use is now a built-in tool in [Gemini 3.5 Flash](https://gemini.google.com/). Google moved beyond its standalone model approach.

**The Technical Details:**

*   **Native integration** eliminates the need for a separate Gemini 2.5 computer use model.
  
*   The system operates across **browser, mobile, and desktop environments** with unified reasoning.
  
*   **Adversarial training** specifically targets prompt injection vulnerabilities in live agent deployments.
  
*   Enterprise safeguards require **user confirmation for sensitive actions** and detect indirect injections automatically.
  
*   Access available through **Gemini API and Gemini Enterprise Agent Platform** for production deployment.

**Why It Matters for You:** Built-in computer use reduces integration complexity compared to standalone model architectures. Long-horizon automation tasks like continuous software testing become more operationally feasible. Defense-in-depth security combines adversarial training with human-in-the-loop verification and sandboxing. The approach lowers implementation barriers for enterprise automation across professional applications.

**The Bigger Picture:** AI agents are shifting from specialized models to general-purpose platform integration. This mirrors how cloud services evolved from standalone tools to integrated platform capabilities.

* * *

## Huntington Bank Redacts 400M+ Documents in Months Using AWS AI Stack

**The Scoop:** [Huntington Bank](https://aws.amazon.com/blogs/machine-learning/huntington-bank-redacting-sensitive-data-from-400m-documents-with-aws/) cut a multi-year document redaction project to just months. AWS AI services processed over 400 million documents for PCI DSS compliance.

**The Technical Details:**

*   **Amazon Textract** extracts text and detects sensitive data with 95%+ accuracy rates.
  
*   **Step Functions distributed map state** processes millions of documents concurrently within service quotas.
  
*   The system achieves **10 million documents per day** through optimized concurrent workflows.
  
*   **AWS DataSync with Direct Connect** encrypts data in transit and replicates back on-premises.
  
*   CloudWatch dashboards monitor throttle counts and success rates to maximize Amazon Textract throughput.

**Why It Matters for You:** Processing costs dropped to 5% of the original estimate. Timeline compression from years to months accelerates compliance initiatives and M&A readiness. The architecture provides a reusable framework for high-volume document processing needs. Organizations facing similar compliance mandates can replicate this approach for regulatory requirements.

**The Bigger Picture:** AI enables compliance projects that were previously impractical at enterprise scale. Financial institutions now redact decades of accumulated documents in months instead of years.

* * *

## The 5 RAG Architectures Production Teams Actually Need (LangGraph + LlamaIndex)

**The Scoop:** Most RAG failures stem from using the wrong architecture pattern. Five distinct retrieval approaches solve fundamentally different problems.

**The Technical Details:**

*   **Naive RAG** uses [VectorStoreIndex](https://docs.llamaindex.ai/en/stable/api_reference/indices/vector_store/) with 512-token chunks for semantic similarity retrieval
  
*   **Hybrid RAG** combines BM25 keyword matching with vector search using QueryFusionRetriever
  
*   **Graph RAG** extracts entities via [PropertyGraphIndex](https://docs.llamaindex.ai/en/stable/examples/property_graph/) and traverses relationship networks for multi-hop reasoning
  
*   **Advanced RAG** adds cross-encoder reranking and SubQuestionQueryEngine for query decomposition into sub-questions
  
*   **Agentic RAG** wraps all engines as LangGraph tools letting agents select strategies dynamically

**Why It Matters for You:** Naive RAG costs 200ms per query but fails on relational questions. Graph RAG solves dependency tracking but requires expensive entity extraction at indexing time. Hybrid retrieval catches exact product codes vector search misses without architecture changes. Advanced techniques like reranking deliver 15-30% accuracy gains for minimal latency cost. The stacking pattern lets teams start simple and add complexity where measurements prove value.

**The Bigger Picture:** Production RAG systems increasingly combine multiple patterns rather than choosing one. The agent layer decides which retrieval strategy fits each query type in real-time.

* * *

## 🌍 AI for Good

1\. **[Anthropic Launches Claude Corps to Provide Free AI Training for Nonprofit Organizations](https://www.progressiverobot.com/2026/06/19/claude-corps-nonprofit-free-ai)**  
This initiative addresses the AI adoption gap in the nonprofit sector by offering charitable organizations free access to Claude AI training and tools, helping them amplify their mission impact while for-profit companies rapidly advance in AI capabilities. _— Progressive Robot, 2026-06-19_

2\. **[GLAAD Releases Framework for Safe and Inclusive AI Systems for LGBTQ Communities](https://glaad.org/2026-ai-report/safe-and-inclusive-ai)**  
The 2026 'Build for Everyone' report provides critical guidance on how AI systems impact LGBTQ people and establishes standards for representation and safety, ensuring AI development prioritizes inclusivity and prevents harm to marginalized communities. _— GLAAD, 2026-06-20_

3\. **[Salesforce Demonstrates AI as Force Multiplier for Disaster Management and Sustainability](https://www.salesforce.com/blog/ai/for-good)**  
Salesforce showcases how AI agents and tools are being deployed for humanitarian purposes including disaster response and scaling regenerative farming practices, proving AI's potential beyond corporate efficiency to address critical global challenges. _— Salesforce, 2026-06-22_

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
