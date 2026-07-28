---
title: "Nvidia's Vera: First CPU built for AI agents"
description: "PLUS: AWS SageMaker adds OpenAI-compatible API, polling shows widespread AI opposition, MIT research on technology and jobs"
date: "2026-05-22T08:05:15.000Z"
author: "Chester Beard"
image: "https://images.unsplash.com/photo-1662947683270-136b00fbf3c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDV8fG52aWRpYXxlbnwwfHx8fDE3Nzk2MDEyNjd8MA&ixlib=rb-4.1.0&q=80&w=2000"
track: ai-field-notes
---
## Quick Scribbles

*   **Nvidia** — Launched Vera CPU built for agentic AI, already sold $20B this year.
  
*   **AWS SageMaker** — Added OpenAI-compatible API requiring only endpoint URL change for migration.
  
*   **AI Public Opinion** — Major polls show 71% oppose local datacenters, sentiment collapsed rapidly.
  
*   **MIT Research** — Study finds young college grads consistently captured technology-enabled jobs since 1940.

* * *

**Good morning, AI Knowledge Worker.** Nvidia just launched Vera. It's the first CPU designed specifically for AI agents. The company already sold $20 billion worth this year.

This validates agent infrastructure as its own hardware category. Is purpose-built silicon the key to scaling billions of concurrent agents?

**In this issue:**

*   Nvidia's Vera CPU opens $200B agent market
  
*   AWS SageMaker adds OpenAI-compatible API
  
*   Polling reveals widespread AI datacenter opposition
  
*   MIT study shows technology creates jobs for young workers

* * *

## Nvidia Opens $200B Market with Vera: The First CPU Built for AI Agents

**The Scoop:** Nvidia launched [Vera](https://techcrunch.com/2025/05/20/jensen-huang-says-hes-found-a-brand-new-200b-market-for-nvidia/), its first CPU purpose-built for agentic AI workloads. The company already sold $20 billion worth this year.

**The Technical Details:**

*   **Token processing architecture** optimized for maximum throughput versus traditional core-based designs
  
*   Vera pairs with **Rubin GPU** for complete agent infrastructure stack
  
*   Designed for **billions of concurrent agents** running independent tool-based workflows
  
*   Architecture prioritizes **sequential token generation speed** over parallel application instances
  
*   Every major hyperscaler and system maker now **deploying Vera-based systems**

**Why It Matters for You:** This validates the agent infrastructure market as a distinct category. Organizations building agent systems now have dedicated hardware options beyond general-purpose CPUs. Nvidia's $20B initial sales suggest strong enterprise demand for agent-specific architecture. The company claims this opens a $200B total addressable market. This directly challenges AWS homegrown chips and traditional Intel/AMD CPU dominance.

**The Bigger Picture:** Nvidia predicts billions of agents will need dedicated computing infrastructure. This mirrors how PCs scaled for human users in previous decades.

* * *

## AWS SageMaker Gets OpenAI-Compatible API: Drop-In Replacement for Production Inference

**The Scoop:** [AWS added OpenAI-compatible API support to SageMaker AI endpoints](https://aws.amazon.com/blogs/machine-learning/announcing-openai-compatible-api-support-for-amazon-sagemaker-ai-endpoints/). Developers switch from OpenAI by changing only the endpoint URL.

**The Technical Details:**

*   SageMaker endpoints expose an **\`/openai/v1\` path** accepting standard Chat Completions requests.
  
*   **Bearer tokens replace SigV4 signing**—tokens valid up to 12 hours from AWS credentials.
  
*   Inference components enable **multi-model hosting** with dedicated GPU allocation per model.
  
*   IAM roles require \`sagemaker:InvokeEndpoint\` and **\`sagemaker:CallWithBearerToken\` permissions** for invocation.
  
*   Caffeine.AI runs this in production with **Bifrost gateway** using standard OpenAI clients.

**Why It Matters for You:** OpenAI API costs disappear when workloads move to owned infrastructure. Migration takes minutes—no SDK changes or custom authentication wrappers required. Inference components let teams consolidate multiple models on single endpoints. This eliminates OpenAI vendor lock-in for agentic workflows and LangChain applications.

**The Bigger Picture:** Cloud providers are commoditizing LLM inference APIs to compete with OpenAI. AWS joins the pattern Azure started—making model hosting interchangeable with API compatibility.

* * *

## Every Poll Shows the Same Thing: America Has Turned Against AI

**The Scoop:** Every major pollster finds unprecedented opposition to AI datacenters and AI itself. Americans don't want datacenters near them, don't trust AI companies, and dislike AI leaders.

**The Technical Details:**

*   [Gallup surveyed 1,000 adults](https://news.gallup.com/report/502333/americans-oppose-ai-data-centers.aspx): **71% oppose local datacenter construction**, 48% strongly opposed.
  
*   [Change Research tracked 2,702 voters](https://www.change-research.com/polling/opposition-to-data-centers-has-grown-sharply-since-2025/): Support collapsed from 51% to **25% in one year**.
  
*   [Washington Post polled 1,101 Virginia voters](https://www.washingtonpost.com/news-schar-school/national/article/2026/04/15/virginia-datacenters-opposition/): Comfort with local datacenters fell from **69% to 35%** since 2023.
  
*   [Pew surveyed 5,023 adults](https://www.pewresearch.org/science/2025/09/how-americans-view-ai-and-its-impact-on-people-and-society/): **50% more concerned than excited** about AI, up from 37% in 2021.
  
*   [Morning Consult found](https://www.morningconsult.com/intelligence/2026/02/voters-are-turning-on-ai-data-center-construction/) **41% support banning datacenter construction** near their communities, up from 37%.

**Why It Matters for You:** This sentiment shift has already disrupted **$156 billion in datacenter projects** across the country. 188 active opposition groups have formed, with 300+ state bills introduced in 2026. The backlash is bipartisan—Republicans and Democrats now equally concerned about AI in daily life. Companies expanding AI infrastructure face regulatory headwinds, community opposition, and reputational risk. The speed matters most: a 40-point net swing in one year suggests accelerating resistance. International intelligence partnerships may suffer as allies question America's ability to protect sensitive information.

**The Bigger Picture:** The opposition arrived faster than the nuclear power backlash of the 1970s. This is the first technology in modern polling history to unite voters across party lines. AI has achieved something rare: making Americans who agree on nothing else find common ground.

* * *

## MIT Study: Technology Creates Jobs for Young, Skilled Workers—Will AI Follow the Pattern?

**The Scoop:** New [MIT research](https://news.mit.edu/2026/technology-creates-jobs-young-skilled-workers-ai-0521) reveals young college graduates consistently captured technology-enabled jobs since 1940. The findings provide crucial context for AI workforce planning.

**The Technical Details:**

*   Study analyzed **U.S. Census data from 1940-1950** and ACS records from 2011-2023.
  
*   Researchers tracked individual workers across decades using person-level demographic and salary data.
  
*   **About 60% of jobs** from 1940-2018 were in specialties that emerged after 1940.
  
*   Workers under 30 with college degrees were **2.9 percentage points more likely** to enter new work.
  
*   Counties with WWII-era factories showed **85-90% of new work was technology-driven** innovation.
  
*   New work wage premiums fade over time as specialized expertise becomes common knowledge.

**Why It Matters for You:** This research directly challenges assumptions about AI's inevitable job destruction. Historical patterns show technology creates work when demand exists—not just supply-side innovation. Companies can shape AI implementation to create specialized roles rather than automate jobs away.

Workforce training investments should target young, educated workers who historically capture new opportunities. The wage premium erosion finding suggests skills training requires continuous updating as expertise commodifies. Health care offers a test case: AI could either eliminate positions or enable differentiated expertise.

**The Bigger Picture:** Government-backed WWII manufacturing created massive new work through purposive demand-driven innovation. AI's labor impact depends on deliberate choices about implementation—not technological inevitability alone.

* * *

## 📡 AI Discoveries

1\. **[Google Unveils Gemini Omni: Multimodal AI Model for Video Creation with Physics Understanding](https://www.mediapost.com/publications/article/415190/google-io-reframes-gemini-with-nod-to-new-ai-mode.html)**  
Google DeepMind announced Gemini Omni, a breakthrough AI model family that can create and edit videos through multimodal prompts while demonstrating intuitive understanding of physics, history, biology, and culture. This represents a significant advancement in generative AI's ability to produce contextually aware, physically accurate video content. _— MediaPost, 2026-05-21_

2\. **[Purdue's Anvil Supercomputer Upgraded with Massive AI Dataset Repository](https://access-ci.org/anvil-upgraded-with-new-ai-datasets)**  
Purdue University's Anvil supercomputer received a major upgrade featuring a vast new repository of AI datasets, designed to significantly accelerate scientific discovery across multiple research domains. This infrastructure enhancement will provide researchers with unprecedented access to training data for AI-driven scientific breakthroughs. _— Access CI, 2026-05-20_

3\. **[AI Transforms Venture Capital Strategy and Quantum Finance Applications](https://www.technologymagazine.com/technology)**  
AI is fundamentally reshaping how venture capitalists evaluate software investments, with survivability becoming the key metric for 2026 as firms adapt to high valuations and rapid code development cycles. Simultaneously, major financial institutions like HSBC are leveraging AI and quantum computing to solve complex finance challenges in partnership with IBM. _— Technology Magazine, 2026-05-21_

* * *

## 🌍 AI for Good

1\. **[33 Mission-Driven AI Startups Making Impact Across Climate, Health, and Education in 2025](https://www.causeartist.com/blog/impactful-ai-startups)**  
This comprehensive overview highlights how AI startups are addressing critical challenges across multiple humanitarian sectors including climate sustainability, healthcare access, education equity, and housing—demonstrating the breadth of AI's potential for social good. _— Causeartist, 2025-01-15_

2\. **[DEFIA Releases Statement Calling for Human-Centric Boundaries in AI and AGI Development](https://www.gesi.org/news/statement-from-the-digital-education-for-impact-alliance-defia)**  
The Digital Education for Impact Alliance brings together educators, experts, and students to advocate for stronger human-centered principles in AI development, ensuring future AI systems prioritize human welfare and ethical boundaries. _— GeSI, 2026-05-15_

3\. **[Data Science for Social Good 2026 Program to Connect Students with Real-World Impact Projects](https://mcml.ai/events/2026-08-03-dssg-2026)**  
This intensive two-month summer program in Munich pairs motivated students and researchers with meaningful societal challenges, training the next generation of data scientists to apply their skills toward projects with tangible social impact. _— Munich Center for Machine Learning, 2026-05-20_

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
