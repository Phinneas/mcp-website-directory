---
title: "AWS shows how MCP servers enable visual AI agents"
description: "PLUS: Sheetz migrates 11,000 VMs off VMware, building anti-hallucination RAG systems, how autoregressive generation actually works"
date: "2026-07-17T08:04:55.000Z"
author: "Chester Beard"
image: "https://images.unsplash.com/photo-1669865015890-4dbd855de0f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDF8fEFXU3xlbnwwfHx8fDE3ODQ3ODM4OTN8MA&ixlib=rb-4.1.0&q=80&w=2000"
track: ai-field-notes
---
## Quick Scribbles

*   **AWS** — Demonstrates MCP servers connecting computer vision with LLMs for standardized visual AI agents.
  
*   **Sheetz** — Migrates 11,000 VMs off VMware due to Broadcom pricing using StorMagic SvHCI solution.
  
*   **RAG Development** — Tutorial shows hybrid retrieval system combining semantic and keyword search with refusal gates.
  
*   **LLM Architecture** — Explains how models generate text token-by-token, discovering meaning through generation itself.

* * *

**Good morning, AI Knowledge Worker.** AWS has unveiled production architecture for visual AI agents. Model Context Protocol now bridges computer vision services with language models. The standardized integration cuts development complexity by 60-80%.

Could MCP become the USB-C moment for AI systems? Unified protocols replace fragmented custom integrations across vision and reasoning pipelines.

**In this issue:**

*   AWS's MCP architecture for visual AI agents
  
*   Sheetz migrates 11,000 VMs off VMware platform
  
*   Building anti-hallucination RAG with hybrid retrieval
  
*   Understanding autoregressive text generation mechanics

* * *

## Building Visual AI Agents: AWS Shows How MCP Servers Bridge Computer Vision and LLMs

**The Scoop:** AWS demonstrates production-ready architecture connecting computer vision with LLM reasoning. Model Context Protocol enables standardized integration across vision services and AI models.

**The Technical Details:**

*   Architecture uses [Strands Agents framework](https://strandsagents.com/latest/) with [Amazon Bedrock](https://aws.amazon.com/bedrock/) Claude and Nova models for orchestration.
  
*   **MCP servers** expose tools via stdio transport with thread-safe client management.
  
*   Integration spans **Amazon Rekognition** for object detection, S3 storage, and OpenSearch vectors.
  
*   IAM roles scope permissions to specific model ARNs and collection resources.
  
*   [Full implementation on GitHub](https://github.com/aws-samples/sample-computer-vision-agent) includes CloudFormation template and security hardening (SSRF prevention, rate limiting).

**Why It Matters for You:** MCP reduces integration complexity by 60-80% versus building custom API bridges. Traditional vision+LLM pipelines require managing multiple authentication schemes and data formats. MCP standardizes this into a single protocol reducing development time significantly. Vision+LLM inference costs typically run $0.50-$2.00 per 1000 images at scale. The architecture supports manufacturing QA, medical imaging triage, and retail inventory monitoring. Security model centralizes permission management removing need for embedded credentials in applications.

**The Bigger Picture:** MCP acts like USB-C for AI systems, standardizing previously fragmented integrations. This mirrors the 2015 shift when USB-C replaced dozens of proprietary connectors. Visual AI agents can now see, understand, and act through unified interfaces.

* * *

## Sheetz Migrates 11,000 VMs Off VMware: A Real-World Cost Breakdown of the Broadcom Exodus

**The Scoop:** Convenience store chain [Sheetz](https://www.sheetz.com/) is migrating 11,000 virtual machines off VMware. Broadcom's pricing changes and subscription bundles forced the move.

**The Technical Details:**

*   Each of 838 stores runs **12-14 VMs on Dell R440/R450 servers**.
  
*   [StorMagic SvHCI](https://stormagic.com/) replaces VMware vSphere without requiring hardware upgrades.
  
*   Migration uses **VM Import Utility and heavy automation** for remote deployment.
  
*   Team completes **200 stores per month**, targeting four-month total timeline.
  
*   Retail operations run **24/7/365**, requiring zero-downtime migration approach.

**Why It Matters for You:** Broadcom eliminated perpetual licenses for mandatory subscription bundles with five-year commitments. This created budget uncertainty and increased vendor dependence for distributed enterprises. Sheetz's remote migration approach saves significant costs compared to on-site technician deployments. The case proves large-scale virtualization platform switches are achievable with proper automation. [Gartner estimates](https://www.gartner.com/en/newsroom/press-releases/2023-09-12-gartner-estimates-35-percent-of-vmware-workloads-will-migrate-elsewhere-by-2028) 35% of VMware workloads will migrate elsewhere by 2028.

**The Bigger Picture:** This mirrors recent migrations by Allstate, T-Mobile, and Tesco. Enterprises increasingly reject forced subscription models that eliminate purchasing flexibility.

* * *

## Build Your Own Anti-Hallucination RAG: A Full-Stack Tutorial with Hybrid Retrieval

**The Scoop:** Developer builds complete RAG system combining semantic and keyword search with smart refusal gates. Full tutorial shows how to make LLMs say "I don't know."

**The Technical Details:**

*   **Stack runs entirely local**: React UI, FastAPI backend, [Ollama](https://github.com/parivshah/hybrid-rag-pdf) (llama3 + nomic-embed-text), ChromaDB, zero cloud dependencies.
  
*   **Hybrid retrieval**: ChromaDB pulls top 20 semantic matches, then BM25 reranks by keyword relevance.
  
*   **Anti-hallucination gates** use three layers: retrieval quality threshold, strict system prompts, post-generation refusal detection.
  
*   **Relevance scoring**: Best semantic distance under 280, max distance cap at 450, minimum BM25 score 0.5.
  
*   **Chunking strategy**: 500-character recursive splits with 50-character overlap, optimized for policy document structure.

**Why It Matters for You:** Pure vector search misses exact terms in specialized documents like contracts or policies. Hybrid retrieval delivers 30-40% better precision on terminology-heavy content compared to semantic-only approaches. The refusal mechanism reduces hallucination risk in customer-facing deployments where wrong answers damage trust. Implementation requires no GPU farm or API costs. Small teams can prototype production-quality document Q&A in days instead of months.

**The Bigger Picture:** This represents RAG's maturation from demo to deployment-ready pattern. Early RAG systems answered every question confidently, even when context was weak. Modern RAG engineering treats "I cannot answer from this document" as a feature. The shift mirrors how search evolved from "ten blue links" to zero-result pages.

* * *

## How LLMs Actually Generate Text: Understanding 'My Throw Decides My Aim'

**The Scoop:** LLMs generate one token at a time, discovering meaning through generation itself. The throw decides the aim.

**The Technical Details:**

*   **Next-token prediction** conditions each output on all previous context and tokens generated.
  
*   Models use **sampling algorithms** and decoding rules to select from probability distributions.
  
*   **Supervised fine-tuning and RLHF** shape the voice and acceptable responses during training.
  
*   Context windows create **self-conditioning loops** where outputs become inputs for subsequent generation.
  
*   Unlike traditional software with predetermined logic paths, LLMs construct explanations **during generation**.

**Why It Matters for You:** Prompt engineering success depends on understanding that context order fundamentally shapes outputs. Earlier tokens in your prompts carry disproportionate weight in generation paths. Chain-of-thought reasoning works because intermediate steps become part of the conditioning context. AI safety and alignment remain challenging because models generate explanations post-hoc, not pre-planned. This generation method explains why identical prompts produce different outputs across runs.

**The Bigger Picture:** This challenges our assumption that language always expresses pre-formed intention. Humans also discover what they mean by speaking, but LLMs make this their fundamental operating principle.

* * *

## 📡 AI Discoveries

1\. **[OpenAI's Most Advanced AI Model Gets Public Rollout](https://www.aol.com/articles/openais-most-advanced-ai-model-104944741.html)**  
OpenAI's latest and most powerful AI model is finally being released to the public, marking a significant milestone in accessible advanced AI capabilities. The timing coincides with Elon Musk's announcement of a new Grok AI model, intensifying competition in the frontier AI model space. _— AOL, 2026-07-16_

2\. **[Nvidia Launches Cosmos 3 Edge Model for Physical AI](https://finance.yahoo.com/technology/ai/articles/nvda-stock-alert-know-nvidia-192334856.html)**  
Nvidia's rollout of Cosmos 3 Edge significantly expands its footprint in the Physical AI space, representing the chip giant's push beyond traditional computing into embodied AI applications. This launch has direct implications for NVDA stock and the broader physical AI ecosystem in 2026. _— Yahoo Finance, 2026-07-16_

3\. **[Zoom Acquires Common Room, Adding AI-Powered Buyer Intelligence](https://martech.org/the-latest-ai-powered-martech-news-and-releases)**  
Zoom's acquisition of go-to-market intelligence startup Common Room marks a strategic expansion beyond video meetings into AI-powered enterprise sales platforms. This move signals consolidation in the martech space as major platforms integrate AI-driven buyer intelligence capabilities. _— MarTech, 2026-07-15_

* * *

## 🌍 AI for Good

1\. **[OpenAI Foundation Launches 2026 People-First AI Fund for Community Nonprofits](https://www.linkedin.com/pulse/july-funding-roundup-200-new-opportunities-purpose-summer-galai-jlkmc)**  
The OpenAI Foundation's People-First AI Fund offers unrestricted grants to U.S. community nonprofits exploring artificial intelligence applications, representing a significant investment in ensuring AI benefits grassroots humanitarian organizations. _— LinkedIn, 2026-07-15_

2\. **[AI Adoption in Charity Sector Surges to 76% According to 2025 Digital Skills Report](https://www.facebook.com/CasuallyExplained/posts/practically-charity-work-at-this-point-ai-samaltman-openai-comedy/1587382892757505)**  
The dramatic increase in AI adoption among charities from 61% to 76% demonstrates the growing recognition of AI's potential to enhance humanitarian work and nonprofit effectiveness. _— Facebook, 2026-07-16_

3\. **[Nonprofits Develop Five Key Safeguards for Protecting Donor Trust in AI Era](https://www.instagram.com/p/DaxZkLltzSC)**  
As nonprofits increasingly adopt AI technologies, this guidance on safeguarding donor trust ensures that humanitarian organizations can leverage AI benefits while maintaining ethical standards and stakeholder confidence. _— Instagram, 2026-07-14_

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
