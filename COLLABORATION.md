# DreamCatcher — Collaboration System

## Scope contract

- **Purpose:** Define how Fabrizzio, ChatGPT Work / web agents, and Cursor agents collaborate.
- **Contains:** Workspace roles, acceptance rules, idea classification, prompt review, Context Status, and learning objective.
- **Does not contain:** Product definition, Insight evaluation criteria, marketing claims ladder, or implementation runbooks.
- **Update when:** Collaboration roles, acceptance rules, or prompt-review process change.
- **Default loading behavior:** Load for collaboration, acceptance, ideation routing, or prompt-process tasks. Not required for every narrow code fix.

---

## Two workspaces

### ChatGPT Work / web agent

Use for:

- product thinking
- education
- research
- decision evaluation
- idea capture
- prompt preparation
- acceptance reasoning
- proactive recommendations
- Context Status reporting

### Cursor Agent

Use for:

- canonical repository files
- code
- local Git operations
- implementation
- testing
- repository evidence

Repository Markdown and Git remain authoritative. ChatGPT Project copies may later serve as reference snapshots, but must not become independent competing sources of truth.

---

## Default resource allocation

- Prefer the web agent for ideation, education, evaluation, research, organization design, and prompt composition.
- Use Cursor when repository access, canonical file changes, code editing, Git evidence, or testing are required.
- Do not spend Cursor usage on abstract organizational discussion that can be resolved on the web.
- Reevaluate a possible one-workspace workflow later after usage, pricing, and context behavior are better understood. See [IDEAS.md](./IDEAS.md) item F.

---

## Hybrid research roles

- The **web agent** leads product-priority recommendations, external research framing, user-value reasoning, education, and synthesis.
- **Cursor** leads repository-aware feasibility research, code impact, technical sequencing, and implementation evidence.
- Both may research the same broad decision only when assigned distinct questions, or when independent verification has a concrete reason.
- Fabrizzio makes the final priority decision.

Canonical documents bridge the two workspaces. The agents need not duplicate the same research.

---

## Ideation without derailment

Fabrizzio may generate ideas freely without derailing the implementation loop.

Materially distinct ideas should be evaluated as:

| Classification | Meaning |
|----------------|---------|
| Hard Save | Material conclusion; evaluate critically; store in [DECISIONS.md](./DECISIONS.md) and the canonical topic file |
| Qualified Hard Save | Accepted with an explicit qualification |
| Soft Save | Park in [IDEAS.md](./IDEAS.md) without changing active scope |
| Research Flag | Unverified; keep with a proof requirement |
| Duplicate / extension | Fold into an existing entry |
| Reject | Record briefly when the rejection matters |
| No-save | Disposable; no durable storage |

Repeated and disposable fragments may be batched rather than expanded.

Valuable unresolved ideas should be parked without changing active scope.

At major session checkpoints, report only:

- new ideas
- status changes
- important rejections
- revisit triggers

Do not dump the entire backlog at every checkpoint.

---

## Acceptance authority

- Silence is not acceptance.
- Material product decisions require explicit acceptance.
- Low-risk organizational routing may proceed provisionally when authorized, but must be reported for review.
- Fabrizzio owns final product priority, Sheepy’s emotional character, copy direction, visual taste, and subjective acceptance.
- Agents must still challenge weak assumptions.
- Technical correctness, safety, research claims, and marketing claims require evidence.
- Initial subjective Insight acceptance belongs to Fabrizzio; later blind target-user testing supplements it.
- Generic “please review” requests are insufficient.
- When Fabrizzio’s input is materially required: identify the likely weakness, explain why his input matters, and request the smallest useful clarification, example, or decision.

---

## Learning objective

DreamCatcher remains product-first, but building it is also Fabrizzio’s practical AI education.

Briefly explain relevant concepts, tools, incidents, and decision patterns as they appear. Do not turn implementation into a traditional course. Durable lessons belong in [DREAMCATCHER_LEARNING_LOG.md](./DREAMCATCHER_LEARNING_LOG.md).

---

## Prompt review

Every execution prompt must remind Fabrizzio to review it before pasting.

### Standard review

Check:

- outcome
- scope
- files
- branch
- exclusions
- acceptance criteria
- verification

### High-stakes review

Escalate when the prompt involves:

- production / deployment
- authentication or user data
- database / schema migrations
- destructive Git
- broad architecture
- Insight generation / evaluation quality
- canonical source-of-truth changes
- consequential marketing claims

Do not exaggerate every prompt as wealth-determining. Escalate only genuinely consequential prompts.

### High-stakes prompt convergence

1. Create one substantial draft.
2. Fabrizzio reviews and sends notes.
3. Evaluate the notes rather than inserting them blindly.
4. Discuss later corrections as deltas without reposting the entire draft.
5. When material disagreements and ambiguities are resolved, produce one consolidated final prompt.
6. Execute once.
7. Allow at most one focused correction round.

---

## Context Status

### ChatGPT Work conversations

| Status | Meaning |
|--------|---------|
| Green | Coherent; important conclusions are stored |
| Yellow | Substantial unsaved decisions, repetition, conflicts, or retrieval gaps exist |
| Red | Stop substantive work, consolidate, and move to a clean context |

The web agent reports status when it changes or at major checkpoints, not mechanically on every message.

### Cursor

Cursor should report concrete Yellow/Red-level context problems when they threaten correctness. It should not emit routine traffic-light statuses.
