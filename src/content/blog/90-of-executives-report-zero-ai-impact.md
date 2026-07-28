---
title: "90% of executives report zero AI impact"
description: "PLUS: Gemma 4 MoE vs Dense on Mac, building fraud detection in Snowflake, how cross-encoders actually rerank"
date: "2026-04-24T17:20:02.000Z"
author: "Chester Beard"
image: "https://images.unsplash.com/photo-1498673394965-85cb14905c89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMTc3M3wwfDF8c2VhcmNofDd8fGltcGFjdHxlbnwwfHx8fDE3NzcwNTExODN8MA&ixlib=rb-4.1.0&q=80&w=2000"
track: ai-field-notes
---
## Quick Scribbles

*   **AI Productivity Paradox** — An NBER survey reveals 90% of executives report zero AI impact despite massive investment, while only 20% of engineering teams actually measure results with proper metrics.
  
*   **Gemma 4 Local Inference** — Hands-on testing shows Gemma 4's MoE model generates tokens 5x faster than Dense on Mac hardware, but the slower Dense model completed coding tasks quicker due to fewer retries and cleaner output.
  
*   **Snowflake ML Pipeline** — A complete fraud detection system runs entirely inside Snowflake using XGBoost and built-in observability, eliminating the operational gap between data storage and model deployment.
  
*   **Cross-Encoder Reranking** — Cross-encoders improve search relevance 15-30% over vector-only systems by letting query and document tokens interact through attention, though production systems use two-stage retrieval to manage the inference cost.
  

* * *

  
**Good morning, {{first\_name | AI enthusiast}}!** A sweeping survey of 6,000 senior executives has delivered an uncomfortable truth: nine out of ten report zero productivity or employment impact from AI over three years, even as vendors tout double-digit efficiency gains.

Is this a measurement problem, a deployment problem, or the honest signal that separates real transformation from performance theater? The gap between claimed results and instrumented evidence reveals which organizations are building versus which are simply announcing.

**In this issue:**

*   Why 90% of executives see zero AI impact despite massive investment
  
*   Gemma 4's MoE vs Dense models: faster tokens don't guarantee faster tasks
  
*   Building production fraud detection entirely inside Snowflake
  
*   How cross-encoders actually rerank search results with attention mechanics

* * *

## The Productivity Paradox: Why 90% of Executives Report Zero AI Impact Despite Massive Investment

**The Scoop:** An NBER survey of 6,000 senior executives reveals nine out of ten report zero employment or productivity impact from AI over three years, despite McKinsey claiming 62% of organizations see 25%+ productivity gains.

**The Technical Details:**

*   **Only 20% of engineering teams** use metrics to measure AI impact, meaning two-thirds of companies claiming results haven't instrumented their systems to prove them.
  
*   The LeadDev Engineering Leadership Report surveyed 600+ engineering leaders and found **60% report no meaningful productivity boost**, with most seeing only marginal gains at best.
  
*   Organizations fail to account for **learning curve overhead**, sprint padding based on vendor white papers promising 30-40% gains, and the gap between AI-assisted PR counts versus actual delivery velocity.
  
*   McKinsey's productivity claims rely on **self-reported surveys** rather than controlled before-and-after measurements with clear baselines and statistical controls.
  
*   The measurement gap creates a **compounding reporting problem** where "helps sometimes" becomes "positive adoption signals" becomes "early gains" becomes board deck bar charts with no error bars.

**Why It Matters for You:** The pressure to report AI wins before they materialize costs organizations in specific ways: sprint commitments get padded based on unrealistic vendor promises, managers absorb the gap between projections and actual delivery, and early adoption drops off within the first month when reality doesn't match expectations. Companies that announced cloud-first strategies in 2013-2016 while running 90% legacy workloads faced similar dynamics—the ones that quietly reorganized without declaring premature victory actually benefited, while those performing progress instead of making it poisoned future transformation efforts. The 10% who reported real impact likely invested in workflow redesign, set clear expectations, measured rigorously, and gave teams time to adapt rather than chasing quarterly talking points. Building honest measurement frameworks now—even if they show zero current impact—positions leadership to identify what actually works rather than decorating dashboards with vanity metrics that erode credibility when delivery slips.

**The Bigger Picture:** This mirrors every major enterprise technology shift from ERP to cloud migration: vendor promises arrive years before organizational capability catches up, and the companies that benefit are those willing to admit "we're still learning" rather than performing transformation for board presentations. The nine out of ten executives who reported zero impact may actually be the more honest group—in a business culture that rewards premature optimism about technology investments, telling the truth about spending money without measurable results takes courage that doesn't get celebrated at conferences.

* * *

## Inside Gemma 4: Why MoE Beats Dense Models for Local Inference (And Why Your Mac Is Faster Than You Think)

**The Scoop:** A hands-on comparison of [Gemma 4's 26B MoE versus 31B Dense models](https://medium.com/@danielvaughan/i-ran-gemma-4-as-a-local-model-in-codex-cli-7fda754dc0d4) on local hardware reveals that faster token generation doesn't guarantee faster task completion—the slower Dense model finished coding tasks quicker due to fewer retries and cleaner first-pass output.

**The Technical Details:**

*   The **MoE architecture activates only 3.8 billion parameters per token** (versus 31.2 billion for Dense), reducing memory bandwidth requirements from 17.4 GB to 1.9 GB per token and enabling the Mac to generate tokens at 52 tok/s compared to the GB10's 10 tok/s despite identical 273 GB/s LPDDR5X memory bandwidth.
  
*   The working Mac configuration requires **llama.cpp with Q4\_K\_M quantization, KV cache compression** (\`-ctk q8\_0 -ctv q8\_0\` reducing cache from 940 MB to 499 MB), single-slot operation (\`-np 1\`), and a 32,768 token context window to handle the 27,000-token system prompt.
  
*   Ollama v0.20.3 fails on Apple Silicon due to **a streaming bug that routes tool-call responses to the wrong field** and a Flash Attention freeze on prompts exceeding 500 tokens, forcing a switch to llama.cpp with the \`--jinja\` flag for Gemma 4's tool-calling template.
  
*   The GB10 running the 31B Dense model completed the benchmark coding task in **6 minutes 59 seconds with three tool calls**, while the Mac's 26B MoE took 4 minutes 42 seconds but required ten tool calls and five failed test file attempts.
  
*   **Tool-calling reliability jumped from 6.6% in Gemma 3 to 86.4% in Gemma 4** on the tau2-bench function-calling benchmark, crossing the threshold from unusable to production-viable for agentic coding workflows.

**Why It Matters for You:** The math proves counterintuitive: 5.1x faster token generation translated to only 30% faster task completion because the quantized MoE model produced messier output requiring multiple retries. Decision-makers evaluating local versus cloud deployment need to measure end-to-end task completion time, not raw throughput metrics—the cloud baseline (GPT-5.4) completed the same task in 65 seconds with zero retries. The setup complexity represents real implementation cost: one afternoon of configuration debugging for the Mac, an hour for the GB10, plus ongoing version pinning to avoid reported 3.3x speed regressions between llama.cpp builds. A hybrid approach makes sense for many organizations: local models for iteration and privacy-sensitive codebases, cloud for production complexity, with the profile-switching overhead measured in single flags rather than infrastructure changes.

**The Bigger Picture:** The leap from 6.6% to 86.4% tool-calling accuracy mirrors the pattern we saw when GPT-3.5 crossed the threshold into reliable function calling—it's the difference between "interesting research" and "deploy this on Monday." Local AI inference is shifting from hobbyist territory to a legitimate enterprise option, with the MoE architecture proving that you can run capable models on laptop hardware if you're willing to trade perfect first-pass quality for privacy and cost control.

* * *

## Production ML Without Leaving Your Data Platform: Building End-to-End Fraud Detection in Snowflake

**The Scoop:** A [complete fraud detection pipeline](https://pub.towardsai.net/building-a-production-grade-fraud-detection-pipeline-inside-snowflake-end-to-end-684b94b6983c) runs entirely inside Snowflake—from raw transactions to monitored predictions—eliminating the operational gap between where data lives and where models run.

**The Technical Details:**

*   The seven-stage pipeline executes **XGBoost training with 500 estimators, max depth 6, and scale\_pos\_weight set to the class imbalance ratio** (27.6 for a 1% fraud rate) to handle heavily skewed datasets where legitimate transactions outnumber fraud cases 100:1.
  
*   **Evaluation uses AUCPR (area under precision-recall curve) instead of ROC-AUC** because ROC-AUC inflates performance on imbalanced data by incorporating the true-negative rate, which is artificially high when 99% of transactions are legitimate.
  
*   **Threshold optimization sweeps from 0.1 to 0.9 to find the operating point** that maximizes F1 score or matches your business's false-positive-to-false-negative cost ratio, moving the optimal decision boundary from the default 0.5 to 0.58 in this case.
  
*   The Model Registry stores versioned models with attached metrics, auto-inferred schemas from sample input data, and a full audit trail in \`ACCOUNT\_USAGE\`—batch inference then calls registered models by name without loading pickled files.
  
*   **ML Observability runs on a daily refresh schedule**, monitoring score distribution drift and feature distribution shifts between training data and live inference batches to catch silent degradation before fraud rates spike.

**Why It Matters for You:** Building ML inside your data warehouse collapses operational overhead—no separate MLflow servers, no model artifact storage buckets, no orchestration pipelines to sync training data exports with production scoring jobs. The cost reduction comes from eliminating data egress fees (pulling terabytes of transaction data out of Snowflake for external training), cutting infrastructure spend on dedicated ML platforms, and reducing the engineering headcount required to maintain integrations between disconnected systems. Implementation complexity drops because feature engineering, training, registry, inference, and monitoring share the same access controls, lineage tracking, and governance policies you've already configured. Security risk shrinks when sensitive transaction data never leaves your governed data platform, avoiding the compliance exposure that comes with copying PII to external training environments or local developer machines.

**The Bigger Picture:** This mirrors the broader shift where data platforms absorb ML workloads that traditionally required separate specialized stacks—similar to how databases eventually internalized full-text search, JSON processing, and time-series analysis rather than forcing users to export data to external tools. The "model-data gap" has been ML's persistent operational liability, creating the archaeology-dig architecture where models live three systems away from the data they score.

* * *

## Beyond Vector Search: How Cross-Encoders Actually Rerank Results (With Math That Matters)

**The Scoop:** Cross-encoders let query and document tokens interact through attention before scoring relevance, while bi-encoders compress each into separate vectors first—a mathematical difference that produces dramatically better ranking quality at the cost of slower inference speed.

**The Technical Details:**

*   **Bi-encoders create separate m×m and n×n attention matrices** for query and document tokens, meaning no query token ever attends to document tokens, then compare via cosine similarity between pooled vectors—fast but unable to detect contradictions like "cheap" paired with "$500/night."
  
*   **Cross-encoders concatenate inputs as \`\[CLS\] query \[SEP\] document \[SEP\]\`** and compute a unified (m+n)×(m+n) attention matrix where every query token attends to every document token across all transformer layers, enabling detection of semantic relationships, contradictions, and entity matching through multi-head attention.
  
*   **Production systems deploy [two-stage retrieval patterns](https://docs.cohere.com/docs/rerank)** where bi-encoders or BM25 retrieve top-k candidates (Stage 1: O(1) with ANN indexes), then cross-encoders rerank those candidates (Stage 2: O(k) forward passes)—[Cohere Rerank](https://docs.cohere.com/docs/rerank), [Pinecone's built-in reranking](https://docs.pinecone.io/guides/search/rerank-results), and Google's BERT-powered search all implement this architecture.
  
*   **Fine-tuning on domain data uses MSE loss for soft scores or BCE loss for binary labels** on query-document-relevance triples, with evaluation on adversarial distractors showing improvements from 30% to 95% accuracy on legal document ranking after training on just 72 pairs across 12 topics.
  
*   **ColBERT's late interaction achieves 2.2x speedup with 92% top-5 agreement** versus full cross-encoders by keeping per-token embeddings instead of pooling, computing MaxSim scores (sum of maximum cosine similarities between each query token and all document tokens), and enabling precomputation of document embeddings while maintaining p50 latency under 25ms at 40 QPS where cross-encoders queue to 10+ seconds.

**Why It Matters for You:** Cross-encoder reranking typically improves relevance by 15-30% over bi-encoder-only systems for conversational queries where word relationships matter, but adds 30-50ms per candidate at inference time. Organizations process millions of queries monthly should implement the two-stage pattern (cheap retrieval → precise reranking on top-20 candidates) rather than cross-encoding everything, reducing compute costs by 95% while maintaining quality. Semantic caching with fine-tuned duplicate detection models eliminates 76% of redundant ranking operations for high-traffic applications with repeated queries. Knowledge distillation offers the strongest ROI for domain-specific applications: teach a fast bi-encoder to mimic cross-encoder quality through MSE loss training, achieving near-parity accuracy with 10x faster inference and precomputable indexes. Implementation complexity varies—integrated reranking via hosted models (Pinecone, Cohere) requires single API parameter changes, while custom fine-tuning and distillation pipelines demand ML engineering resources and 50-500 labeled training pairs per domain.

**The Bigger Picture:** The cross-encoder architecture mirrors how Google transformed web search in 2019 when they [applied BERT models](https://blog.google/products/search/search-language-understanding-bert/) to understand "one in 10 searches" by reading queries and snippets together rather than matching keywords independently. Production search systems now routinely combine multiple ranking stages—vector retrieval narrows millions of documents to hundreds, cross-encoders refine hundreds to dozens, and LLMs perform final list-wise reranking on the top 5-10 results—each stage trading speed for precision as the candidate set shrinks.
