---
title: "Kin: Semantic version control built for AI agents"
description: "PLUS: SAP's tabular foundation model, OpenAI's instant vs thinking split, and V-RAG video generation"
date: "2026-04-04T15:48:55.000Z"
author: "Chester Beard"
image: "https://images.unsplash.com/photo-1763810021881-49b45b0717d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDF8fGtpbiUyMGFwcHxlbnwwfHx8fDE3Nzc2NjYzNzJ8MA&ixlib=rb-4.1.0&q=80&w=2000"
track: ai-field-notes
---
## Quick Scribbles

*   **Firelock AI** — Released Kin, a semantic version control system that stores code as a graph of functions and relationships, achieving 69/70 task wins with 50% less time and 44.6% fewer tokens than Git-based approaches.
  
*   **V-RAG** — New Video Retrieval-Augmented Generation approach creates AI videos by pulling specific reference images from vector databases, eliminating vague prompt interpretation and enabling brand-consistent video production without model fine-tuning.
  
*   **SAP** — Launched RPT-1 foundation models for tabular data using semantic embeddings to understand column meanings, offering small, large, and open-source variants with few-shot learning capabilities for enterprise spreadsheets and databases.
  
*   **OpenAI** — Released GPT-5.3 and GPT-5.4 as separate "instant" and "thinking" models, splitting frontier AI into speed-optimized and depth-optimized architectures rather than one general-purpose system.
  

* * *

  
**Good morning, {{first\_name | AI enthusiast}}.** Firelock AI just released Kin, a semantic version control system that treats code as a graph of functions and relationships instead of text files—and early benchmarks show AI agents complete tasks 50% faster with half the token usage.

As AI assistants become primary consumers of our codebases, should we be rethinking the fundamental infrastructure we've relied on for decades?

**In this issue:**

*   Kin's semantic version control built for AI agents
  
*   V-RAG gives precise visual control to video generation
  
*   SAP's RPT-1 foundation models tackle tabular data
  
*   OpenAI splits frontier models into instant vs. thinking

* * *

## Kin Semantic VCS: Git for the Age of AI Agents

**The Scoop:** Firelock AI has released [Kin](https://github.com/firelock-ai/kin), a semantic version control system that stores code as a graph of functions, classes, and their relationships—rather than raw text files—making it easier for AI agents to understand and work with codebases.

**Unpacked:**

*   **Kin tracks code identity across changes** using semantic fingerprints that recognize when you rename or move a function, solving a core problem where AI agents lose context during refactors.
  
*   **Benchmarks show dramatic efficiency gains**: In a validated 10-repo sweep, Kin achieved 69 out of 70 task wins while using 50% less time and 44.6% fewer tokens compared to traditional Git-based code exploration.
  
*   **The system integrates with the [Model Context Protocol](https://modelcontextprotocol.io/)**, an open standard that lets any AI assistant—from Claude to ChatGPT to Cursor—query the semantic graph without custom integrations.

**Bottom line:** Kin reimagines version control for an AI-first world where assistants need to understand code structure, not just track line changes. Developers can adopt it incrementally alongside existing Git workflows, making the transition reversible and low-risk.

* * *

## V-RAG: Using Generative AI to Power Video Production

**The Scoop:** A new approach called Video Retrieval-Augmented Generation (V-RAG) lets you create AI videos by pulling relevant images from a database and feeding them into video generation models, giving you precise visual control without the headaches of model fine-tuning.

**Unpacked:**

*   Unlike text-to-video generators that rely on vague descriptions, **V-RAG grounds your videos in specific reference images** retrieved from a vector database, which means you get exactly the red purse or product design you want instead of hoping the AI interprets your prompt correctly.

*   The system requires only static images rather than expensive video training data, and organizations can add new images to their database instantly without retraining models, creating an **auditable trail from source to output** that reduces hallucination risks.

*   Teams already use [V-RAG for educational content, personalized marketing videos, and product demonstrations](https://aws.amazon.com/blogs/machine-learning/introducing-v-rag-revolutionizing-ai-powered-video-production-with-retrieval-augmented-generation/) where brand consistency matters, and the framework will expand to incorporate audio samples and 3D models as multimodal AI advances.

**Bottom line:** V-RAG solves text-to-video's biggest weakness by letting you show rather than describe what you want, making professional video generation accessible without machine learning expertise. This represents a shift from hoping AI guesses correctly to actively directing the creative process with verifiable source materials.

* * *

## SAP's RPT-1: Foundation Models Finally Crack Tabular Data

**The Scoop:** SAP launched RPT-1, a suite of Relational Pretrained Transformer models that represent the first serious attempt at building foundation models specifically for tabular data—the spreadsheets, databases, and structured records that power most enterprise operations.

**Unpacked:**

*   Tabular data has resisted the foundation model revolution because **each dataset has unique column structures**, making it nearly impossible to pretrain on diverse tables the way language models train on text—RPT-1 solves this using semantic embeddings that understand what columns _mean_, not just what they contain.

*   The suite offers **three deployment options**: a small model for edge cases, a large model for complex enterprise tasks, and an open-source variant that lets companies customize the architecture without vendor lock-in or data privacy concerns.

*   Built on the ConTexTab architecture, RPT-1 performs classification and regression using **few-shot in-context learning**—meaning you can feed it a handful of examples and it adapts to your specific business domain without extensive retraining.

**Bottom line:** The real question is whether enterprises will embrace specialized foundation models for each business process or wait for general-purpose models to catch up. RPT-1's ability to handle diverse tabular tasks with minimal examples suggests specialized models might win the near-term race, especially where data privacy and cost-performance trade-offs favor on-premises deployment.

* * *

## OpenAI's Two-Model Strategy: Instant vs. Thinking

**The Scoop:** OpenAI released [GPT-5.3 and GPT-5.4](https://www.fastcompany.com/91507032/openais-new-frontier-models-mark-huge-change-how-ai-will-built) just two days apart in early March, splitting its frontier models into distinct "instant" and "thinking" architectures instead of building one general-purpose system.

**Unpacked:**

*   **GPT-5.3 optimizes for speed** and delivers responses within seconds, making it ideal for quick tasks like drafting emails, summarizing documents, or answering straightforward questions where you need immediate results.

*   **GPT-5.4 prioritizes depth** over speed and takes longer to process queries, but it excels at complex analytical work like debugging intricate code, strategic planning, or solving multi-step problems that require extended reasoning.

*   **This split signals a broader industry shift** toward specialized models rather than one-size-fits-all systems, allowing developers to choose the right tool for each task and optimize their workflows based on whether they need instant answers or deep analysis.

**Bottom line:** OpenAI's bifurcated approach changes how developers and teams structure their AI workflows, requiring them to match tasks to model types rather than defaulting to a single assistant. This specialization trend will likely push other AI companies to build similar "fast lane" and "slow lane" models, fundamentally reshaping how we interact with AI tools.
