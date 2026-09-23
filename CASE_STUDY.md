# Case study: how I built Matchr

A short story of the project — for interviews, portfolio, or a blog post.

## Problem
Keyword search misses matches: "React developer" won't find "frontend engineer
(React/Redux)", and a CV is not a bag of tags but context. I wanted a system that matches
**semantically** and **explains** the match.

## Solution in brief
A RAG + agent system: CVs and offers as embeddings, hybrid retrieval (vectors + BM25),
cross-encoder re-ranking, and an LLM with structured output returning a 0–100 score,
strengths, and gaps. All in Docker: FastAPI, PostgreSQL, Qdrant, Redis, Next.js.

## Key decisions and challenges

**Two-layer matching → a three-stage funnel.** I started with pure vector search. I added
hybrid search (BM25 catches exact technologies that dense embeddings blur) and re-ranking.
Key lesson: I **measured** the impact of each layer with a golden set — MRR 0.25 → 0.50
(hybrid) → 0.667 (rerank).

**Evaluation surfaced bugs invisible to the eye.** The first re-ranker was English — on
Polish data it **degraded** recall 4× (0.44 → 0.11). Without metrics I'd have shipped a
regression. Swapping to a multilingual model fixed it (confirmed by measurement).
Similarly, a faithfulness eval (LLM-as-judge) showed the model was inventing gaps not in
the offer — fixed with a prompt. I also learned that **a metric can lie**: a "low recall"
turned out to be an artifact of too narrow a golden set, not a retrieval weakness — I
caught it by looking at the actual results.

**From pipeline to agent.** I turned a rigid sequence into a tool-calling loop where the
LLM plans the steps. Biggest security lesson: **`user_id` never from the model** — always
from the token, because prompt injection (including from job descriptions) could reach
another user's data. I defend with architecture (least privilege, structured output), not
filtering.

**Production hardening.** Token accounting (cost visible in metrics), response streaming
(lower perceived latency), and profiling revealed that re-ranking was 96% of request time
— I moved it to a background job (RQ), with model warm-up and retry.

## Outcome
A working, tested system: RAG with measured quality, an agent mode, observability (logs
with correlation-id + Prometheus metrics), CI/CD, background processing, multi-user
isolation. Idempotent code, decisions documented (ADRs).

## What I learned
- **Measure before you decide.** Intuition about AI quality misleads — a golden set and
  metrics turn "I think" into "I know".
- **Match the model to the data** (language!) and **the feature to the data** (an empty
  field is a dead feature — check the source before building).
- **Architecture > filtering** in LLM security: assume breach, limit the blast radius.
- **Async ≠ background jobs** — long work is moved out of the request, not "async'd".

## Next
Deploy to a public URL (playbook ready), a larger golden set for a harder recall number,
optionally a local model (CV privacy / GDPR).