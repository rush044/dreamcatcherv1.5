# DreamCatcher — Ideas Inbox (Soft Saves & Research)

## Scope contract

- **Purpose:** Park valuable unresolved ideas without changing active scope.
- **Contains:** Soft Saves and Research Flags with revisit triggers.
- **Does not contain:** Accepted product doctrine, decisions that are already Hard Saved, or implementation tasks in progress.
- **Update when:** A new idea is Soft Saved / Research Flagged, status changes, or a revisit trigger fires.
- **Default loading behavior:** Load during ideation, checkpoint idea reporting, or when a revisit trigger may apply. Do not resolve parked ideas during unrelated implementation.

---

## Entry fields

Each entry needs: stable ID, date, area/tags, idea, why it may matter, strongest tension, status, revisit trigger.

Statuses: `soft-save`, `research-flag`, `revisit-due`, `absorbed`, `rejected`, `expired`.

---

## Parked ideas

### IDEA-A — Sheepy / model marketing language

- **Date:** 2026-07-16
- **Area/tags:** marketing, Sheepy, claims
- **Idea:** Explore consumer language such as:
  - “Sheepy is DreamCatcher’s dream intelligence.”
  - “A dream-interpretation intelligence built to remember you.”
  - “Built on frontier AI. Specialized for your dreams.”
  - “The dream AI that notices what generic chat misses.”
- **Why it may matter:** Clearer public positioning without implying a proprietary foundation model.
- **Strongest tension:** Differentiated language vs overclaim / foundation-model implication.
- **Status:** soft-save
- **Revisit trigger:** After blind benchmarking and during focused marketing work.
- **Owner for claims rules:** [MARKETING.md](./MARKETING.md)

### IDEA-B — Implementation-Readiness Trigger

- **Date:** 2026-07-16
- **Area/tags:** workflow, collaboration
- **Idea:** When implementation has clear scope, acceptance criteria, no material blocker, and new ideas no longer change it: batch genuinely new ideas; state whether any change the implementation; recommend starting when none do; allow Fabrizzio to continue ideating if he explicitly chooses.
- **Why it may matter:** Prevents endless pre-implementation ideation from blocking shipping.
- **Strongest tension:** Creative freedom vs finishing the core loop.
- **Status:** soft-save
- **Revisit trigger:** After observing the documentation workflow in practice.

### IDEA-C — ChatGPT Work efficiency review

- **Date:** 2026-07-16
- **Area/tags:** collaboration, tooling
- **Idea:** After the reset and one real Insight cycle, evaluate which Projects, files, research, tools, and other Work/Desktop capabilities improve continuity and idea preservation.
- **Why it may matter:** Reduce lost context and duplicated effort between web and Cursor.
- **Strongest tension:** More tooling vs more overhead.
- **Status:** research-flag
- **Revisit trigger:** After Source-of-Truth Reset acceptance and one completed Insight polishing cycle.

### IDEA-D — AI usage and context telemetry

- **Date:** 2026-07-16
- **Area/tags:** research, cost, Insight harness
- **Idea:** Explore recording, when available: input tokens, cached tokens, output tokens, context estimates, model, prompt/schema version, latency, cost, retries/failures.
- **Why it may matter:** Cost control, quality debugging, and harness improvement.
- **Strongest tension:** Useful measurement vs privacy, availability, and overbuilding.
- **Status:** research-flag
- **Qualification:** DreamCatcher API usage may be measurable; ChatGPT/Cursor internal context may not expose exact telemetry.
- **Revisit trigger:** During Insight harness or cost-control work.

### IDEA-E — Competitive product research

- **Date:** 2026-07-16
- **Area/tags:** research, marketing, Insight
- **Idea:** Directly examine major dream-journal and interpretation products, including onboarding, actual outputs, pricing, continuity, emotional identity, retention, user effort, reviews, recurring complaints, and blind comparisons.
- **Why it may matter:** Ground competitive strategy in observed products rather than marketing-page impressions.
- **Strongest tension:** Speed of product building vs depth of competitive evidence.
- **Status:** research-flag
- **Qualification:** Do not treat current impressions from marketing pages as established evidence.
- **Revisit trigger:** Before major marketing claims or competitive positioning investment.
- **Related:** [MARKETING.md](./MARKETING.md) future blind benchmark

### IDEA-F — One-workspace experiment

- **Date:** 2026-07-16
- **Area/tags:** collaboration, tooling
- **Idea:** Later evaluate whether ideation and implementation should move into one workspace after Fabrizzio understands usage, pricing, context limits, and plan options.
- **Why it may matter:** Possible simplification of the two-workspace default.
- **Strongest tension:** Simplicity vs specialized strengths / cost control of the current split.
- **Status:** soft-save
- **Revisit trigger:** After usage, pricing, and context behavior are better understood.
- **Related:** [COLLABORATION.md](./COLLABORATION.md)

### IDEA-G — Prompt ownership and clarification workflows

- **Date:** 2026-07-16
- **Area/tags:** collaboration, prompts, education
- **Idea:** Later evaluate when Fabrizzio should draft prompts himself, when the web agent should draft them, and whether repeated clarification failures justify a dedicated skill.
- **Why it may matter:** Improves high-stakes prompt quality and Fabrizzio’s agency.
- **Strongest tension:** Learning-by-doing vs speed/reliability of agent-drafted prompts.
- **Status:** soft-save
- **Revisit trigger:** After several high-stakes prompt cycles post-reset.
