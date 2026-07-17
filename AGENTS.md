# DreamCatcher — Repository Agent Router

## Scope contract

- **Purpose:** Route Cursor agents to the correct canonical sources and state minimal universal repository rules.
- **Contains:** Source map, loading procedure, evidence-honesty rules, and implementation/verification expectations.
- **Does not contain:** Product doctrine, marketing claims, Insight evaluation detail, collaboration policy, historical dumps, or educational essays.
- **Update when:** Canonical document inventory, universal agent rules, or loading procedure change.
- **Default loading behavior:** Always read at session start. Do not treat this file as the full product or Insight source of truth.

---

## Source map

| Document | Role | Default load |
|----------|------|----------------|
| [AGENTS.md](./AGENTS.md) | Repository-agent router | Always |
| [CURRENT_STATE.md](./CURRENT_STATE.md) | Volatile accepted baseline and immediate next action | Always |
| [COLLABORATION.md](./COLLABORATION.md) | Human/AI and web/Cursor collaboration | When collaboration, acceptance, or prompt process matters |
| [PRODUCT.md](./PRODUCT.md) | Current product definition | Product, UX, copy, Sheepy, or scope decisions |
| [DECISIONS.md](./DECISIONS.md) | Decision and supersession log | When deciding, superseding, or checking prior acceptance |
| [IDEAS.md](./IDEAS.md) | Soft Save / research inbox | Ideation, parking, or revisit triggers |
| [MARKETING.md](./MARKETING.md) | Positioning, claims ladder, proof requirements | Marketing, claims, audience, or public language |
| [WORKFLOWS.md](./WORKFLOWS.md) | Implementation and documentation workflows | Implementation, Git, docs updates, save routing |
| [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md) | Current Insight system and evaluation doctrine | Insight prompt, schema, model, or quality work |
| [INCIDENTS.md](./INCIDENTS.md) | Historical technical/evaluation incidents | Only when diagnosing recurrence or reconstructing an incident |
| [DREAMCATCHER_LEARNING_LOG.md](./DREAMCATCHER_LEARNING_LOG.md) | Append-only reusable lessons | Only when teaching a concept or recording a new lesson |
| [PRODUCT_HISTORY.md](./PRODUCT_HISTORY.md) | Curated product-evolution index | Only when comparing eras or recording a product snapshot |
| [UX_REVIEW_GUIDE.md](./UX_REVIEW_GUIDE.md) | Specialist UX review procedure | UX review tasks |
| [INSIGHT_BASELINE_EVALUATION.md](./INSIGHT_BASELINE_EVALUATION.md) | Historical baseline evidence | Only when baseline scores or old failures are needed |

Other Insight experiment/review Markdown files are historical evidence. Load them only when the task explicitly requires that history. Do not treat them as active doctrine.

---

## Document-loading procedure

**Session start**

1. Read `AGENTS.md`.
2. Read `CURRENT_STATE.md`.
3. Read only the domain documents relevant to the task.
4. Retrieve archived history (`INCIDENTS.md`, `PRODUCT_HISTORY.md`, full Learning Log, baseline/experiment reports) only when specifically required.

**Session end**

1. Inspect Markdown files that actually changed.
2. Update only affected canonical sources.
3. Do not reread every Markdown file during ordinary work.
4. Report concrete contradictions or missing context that threaten correctness.

---

## Universal repository-agent rules

- Briefly explain important new technical concepts to Fabrizzio when they become relevant. Do not overwhelm him with unnecessary engineering detail.
- Accurate disagreement and pushback are required. Never agree merely for convenience.
- Never invent historical evidence. Distinguish recovered evidence, reasonable inference, and retrieval gaps.
- If a material ambiguity cannot be resolved and different interpretations would change the result, ask one focused clarification.
- If an assumption is low-risk and reversible, proceed while stating it.
- Every verification step must have a concrete technical reason.
- Use one focused implementation and at most one focused correction round.
- Do not emit routine process commentary that adds no evidence.
- Never print, expose, commit, or request secrets or environment-file contents.
- Never commit, push, force-push, create a PR, deploy, or touch `main` unless Fabrizzio explicitly asks.
- Never use destructive Git commands (`git reset --hard`, `git clean -fd`, `git restore .`, `git checkout .`) unless Fabrizzio explicitly requests them and understands the consequences.
- Repository Markdown and Git remain authoritative over chat memory and Project copies.

---

## Evidence honesty

When sources conflict:

1. Accepted current truth explicitly supplied for the task.
2. Current implemented code for claims about actual behavior.
3. Existing current documentation that does not conflict.
4. Historical Markdown and Git history as evidence of prior states.

Code is evidence of implemented behavior, not automatic evidence of current product intent.

---

## Implementation and verification expectations

- Investigate before editing. Prefer the smallest safe change.
- Preserve authentication, persistence, ownership, API contracts, and schema unless the task explicitly requires changing them. Details live in [WORKFLOWS.md](./WORKFLOWS.md).
- Report what changed, what was preserved, what was verified, and remaining risks.
- Do not claim completion without verification that has a concrete technical reason for the change type.
- Markdown-only tasks do not require app builds, browser tests, or viewport checks unless the task changes runtime behavior.
