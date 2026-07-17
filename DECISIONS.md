# DreamCatcher — Decisions Log

## Scope contract

- **Purpose:** Record accepted decisions and supersessions with links to canonical owners.
- **Contains:** Concise decision entries (date, classification, rationale, status, owner, evidence).
- **Does not contain:** Full product, collaboration, marketing, workflow, or Insight doctrine text.
- **Update when:** A material decision is accepted, qualified, rejected, or superseded.
- **Default loading behavior:** Load when deciding, checking prior acceptance, or superseding guidance. Not every narrow code fix.

---

## How to read entries

| Field | Meaning |
|-------|---------|
| Classification | Hard Save, Qualified Hard Save, Soft Save routing decision, Research Flag policy, Reject, etc. |
| Status | `accepted`, `qualified`, `superseded`, `parked` |
| Canonical owner | File that owns the full rule |

Mark replaced decisions `superseded` rather than deleting them.

---

## 2026-07-16 — Source-of-Truth Reset decisions

### D-2026-07-16-01 — Free ideation without implementation derailment

- **Decision:** Fabrizzio may generate ideas freely; valuable unresolved ideas are parked without changing active scope.
- **Classification:** Hard Save
- **Rationale:** Protects the implementation loop while preserving creativity.
- **Qualification:** None.
- **Status:** accepted
- **Canonical owner:** [COLLABORATION.md](./COLLABORATION.md), [IDEAS.md](./IDEAS.md)
- **Related evidence:** Source-of-Truth Reset prompt (Canonical Override)

### D-2026-07-16-02 — Canonical storage for material conclusions

- **Decision:** Material conclusions must be stored in repository canonical Markdown / Git, not left only in chat memory.
- **Classification:** Hard Save
- **Rationale:** Chat context is finite and lossy; repository files are durable and reviewable.
- **Qualification:** None.
- **Status:** accepted
- **Canonical owner:** [COLLABORATION.md](./COLLABORATION.md), [WORKFLOWS.md](./WORKFLOWS.md)
- **Related evidence:** Source-of-Truth Reset prompt

### D-2026-07-16-03 — Active context contains only current relevant nonduplicated constraints

- **Decision:** Ordinary agent loading includes current, relevant, nonduplicated constraints only.
- **Classification:** Hard Save
- **Rationale:** Reduces context pollution and prompt size; prevents obsolete rules from steering work.
- **Qualification:** Historical evidence is preserved but not routinely loaded.
- **Status:** accepted
- **Canonical owner:** [AGENTS.md](./AGENTS.md), [WORKFLOWS.md](./WORKFLOWS.md)
- **Related evidence:** Source-of-Truth Reset prompt

### D-2026-07-16-04 — One canonical owner per rule

- **Decision:** Each durable fact or rule has one canonical owner; other files may link or summarize in one sentence.
- **Classification:** Hard Save
- **Rationale:** Prevents conflicting duplicates and update drift.
- **Qualification:** None.
- **Status:** accepted
- **Canonical owner:** [AGENTS.md](./AGENTS.md)
- **Related evidence:** Source-of-Truth Reset prompt

### D-2026-07-16-05 — Superseded information preserved outside normal loading

- **Decision:** Superseded guidance is preserved as historical evidence and excluded from ordinary loading.
- **Classification:** Hard Save
- **Rationale:** History must remain retrievable without acting as active doctrine.
- **Qualification:** None.
- **Status:** accepted
- **Canonical owner:** [WORKFLOWS.md](./WORKFLOWS.md), [PRODUCT_HISTORY.md](./PRODUCT_HISTORY.md)
- **Related evidence:** Source-of-Truth Reset prompt

### D-2026-07-16-06 — Historical code remains in Git

- **Decision:** Historical code states remain recoverable through Git; documentation must not rewrite Git history to appear current.
- **Classification:** Hard Save
- **Rationale:** Git is the durable code evidence store.
- **Qualification:** None.
- **Status:** accepted
- **Canonical owner:** [WORKFLOWS.md](./WORKFLOWS.md), [PRODUCT_HISTORY.md](./PRODUCT_HISTORY.md)
- **Related evidence:** Source-of-Truth Reset prompt; old `main` anchor `95556fc…`

### D-2026-07-16-07 — Evidence gaps are never invented

- **Decision:** Agents must distinguish recovered evidence, inference, and retrieval gaps; never invent unavailable evidence.
- **Classification:** Hard Save
- **Rationale:** Invented history corrupts later decisions and marketing claims.
- **Qualification:** None.
- **Status:** accepted
- **Canonical owner:** [AGENTS.md](./AGENTS.md)
- **Related evidence:** Source-of-Truth Reset prompt; Insight score retrieval gap in [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md)

### D-2026-07-16-08 — Fabrizzio proposes classifications; agent evaluates

- **Decision:** Fabrizzio may propose Hard/Soft/Research classifications; the agent critically evaluates rather than rubber-stamping.
- **Classification:** Hard Save
- **Rationale:** Preserves human priority ownership while requiring agent pushback on weak labels.
- **Qualification:** None.
- **Status:** accepted
- **Canonical owner:** [COLLABORATION.md](./COLLABORATION.md)
- **Related evidence:** Source-of-Truth Reset prompt

### D-2026-07-16-09 — Silence is not acceptance

- **Decision:** Material product decisions require explicit acceptance; silence is not acceptance.
- **Classification:** Hard Save
- **Rationale:** Prevents accidental scope and doctrine changes.
- **Qualification:** Low-risk organizational routing may proceed provisionally when authorized and must be reported.
- **Status:** accepted
- **Canonical owner:** [COLLABORATION.md](./COLLABORATION.md)
- **Related evidence:** Source-of-Truth Reset prompt

### D-2026-07-16-10 — Human taste authority vs evidence-based technical authority

- **Decision:** Fabrizzio owns product priority, Sheepy’s emotional character, copy direction, visual taste, and subjective acceptance. Technical correctness, safety, research claims, and marketing claims require evidence.
- **Classification:** Hard Save
- **Rationale:** Separates subjective product taste from evidence-bound claims.
- **Qualification:** Agents must still challenge weak assumptions.
- **Status:** accepted
- **Canonical owner:** [COLLABORATION.md](./COLLABORATION.md)
- **Related evidence:** Source-of-Truth Reset prompt

### D-2026-07-16-11 — Interpretation remains an active consumer category

- **Decision:** Interpretation remains the stronger consumer category and promise; reflection describes the responsible method.
- **Classification:** Hard Save
- **Rationale:** Matches how users seek dream meaning while preserving non-diagnostic framing.
- **Qualification:** Interpretations must not be presented as diagnostic or scientifically certain.
- **Status:** accepted
- **Canonical owner:** [PRODUCT.md](./PRODUCT.md), [MARKETING.md](./MARKETING.md)
- **Related evidence:** Source-of-Truth Reset prompt

### D-2026-07-16-12 — Emotion cannot conceal Insight regression

- **Decision:** Never accept an Insight regression merely to improve emotional presentation. Emotion is the hook; interpretation depth is the substance.
- **Classification:** Hard Save
- **Rationale:** Protects the core competitive differentiator.
- **Qualification:** None.
- **Status:** accepted
- **Canonical owner:** [PRODUCT.md](./PRODUCT.md), [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md)
- **Related evidence:** Source-of-Truth Reset prompt; false-positive evaluation incident

### D-2026-07-16-13 — Product History is curated

- **Decision:** [PRODUCT_HISTORY.md](./PRODUCT_HISTORY.md) is a curated evolution index, not a dumping ground for obsolete files.
- **Classification:** Hard Save
- **Rationale:** Keeps history useful and prevents context bloat.
- **Qualification:** None.
- **Status:** accepted
- **Canonical owner:** [PRODUCT_HISTORY.md](./PRODUCT_HISTORY.md)
- **Related evidence:** Source-of-Truth Reset prompt

### D-2026-07-16-14 — Web and Cursor have distinct default roles

- **Decision:** Web agent defaults to ideation/education/research/prompt composition; Cursor defaults to repository evidence, code, Git, and testing.
- **Classification:** Hard Save
- **Rationale:** Controls cost and keeps each workspace’s strengths.
- **Qualification:** One-workspace experiment is parked for later. See [IDEAS.md](./IDEAS.md) item F.
- **Status:** accepted
- **Canonical owner:** [COLLABORATION.md](./COLLABORATION.md)
- **Related evidence:** Source-of-Truth Reset prompt

### D-2026-07-16-15 — High-stakes prompts use convergence workflow

- **Decision:** High-stakes prompts use one substantial draft, note evaluation, delta discussion, one consolidated final prompt, one execution, and at most one correction round.
- **Classification:** Hard Save
- **Rationale:** Reduces rework and accidental consequential mistakes.
- **Qualification:** Escalate only genuinely consequential prompts.
- **Status:** accepted
- **Canonical owner:** [COLLABORATION.md](./COLLABORATION.md)
- **Related evidence:** Source-of-Truth Reset prompt; Learning Log entry G

### D-2026-07-16-16 — Accepted code baseline for UI/onboarding

- **Decision:** Accepted code baseline is `ux-mobile-polish-v2` @ `a52d8bfa905ed038bba38c847fee4ae4264df5ad`, including the onboarding desktop-overlap fix verified at 390×844, 768×1024, 1366×768, and 1366×650.
- **Classification:** Hard Save
- **Rationale:** Establishes a clear checkpoint before documentation reset and later Insight work.
- **Qualification:** Do not rerun those viewport checks for the unchanged commit. `main`/production untouched.
- **Status:** accepted
- **Canonical owner:** [CURRENT_STATE.md](./CURRENT_STATE.md)
- **Related evidence:** Accepted verification already completed before this reset

### D-2026-07-16-17 — Superseded: `dream-ai-redesign` as current frontend branch

- **Decision:** Treat prior guidance naming `dream-ai-redesign` as the current frontend branch as superseded for active agent routing.
- **Classification:** Supersession
- **Rationale:** Accepted current baseline is `ux-mobile-polish-v2` @ `a52d8bf…`.
- **Qualification:** The branch may still exist in Git as historical work.
- **Status:** superseded
- **Canonical owner:** [CURRENT_STATE.md](./CURRENT_STATE.md)
- **Related evidence:** Old `AGENTS.md` branch section; historical reports that mention `dream-ai-redesign`

### D-2026-07-16-18 — Superseded: exactly-three Insight questions as active rule

- **Decision:** Treat “exactly three reflection questions” and old V1 fixed-report schema rules as superseded active doctrine.
- **Classification:** Supersession
- **Rationale:** Accepted Insight doctrine uses adaptive V2.2.1 direction, V2 schema, notice-only common, questions usually empty or at most one.
- **Qualification:** Historical evaluation docs may still describe the old rule as past behavior.
- **Status:** superseded
- **Canonical owner:** [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md)
- **Related evidence:** Old `AGENTS.md` AI-output section; `INSIGHT_PROMPT_EXPERIMENT_V1.md`; baseline schema notes

### D-2026-07-16-19 — Insight doctrine versus runtime discrepancy

- **Decision:** Distinguish accepted product/prompt doctrine (adaptive V2.2.1 + V2 schema + accepted V2.2.1 principles) from current implemented runtime (`recognition-v3.0` default; adaptive V2.2.1 fallback). Classify the gap as: **Implementation-versus-doctrine discrepancy requiring focused Insight re-evaluation.**
- **Classification:** Qualified Hard Save
- **Rationale:** adaptive V2.2.1 was explicitly accepted as current direction; `recognition-v3.0` is experimentally evaluated and wired in code, but no recovered evidence establishes explicit acceptance as final production doctrine. Silence or code presence is not acceptance.
- **Qualification:** Do not pick a winner by version name; do not change runtime prompt selection until `recognition-v3.0` is evaluated against accepted adaptive V2.2.1 principles and current human acceptance criteria.
- **Status:** superseded by D-2026-07-17-01
- **Canonical owner:** [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md); volatile pointer [CURRENT_STATE.md](./CURRENT_STATE.md)
- **Related evidence:** Accepted baseline commit `a52d8bf…` runtime wiring; Source-of-Truth Reset Canonical Override; correction-round clarification

---

## 2026-07-17 — Insight recognition-v3 acceptance

### D-2026-07-17-01 — Accept recognition-v3.0 as Insight doctrine and runtime direction

- **Decision:** Accept **recognition-v3.0** (vocabulary-corrected prompt in `lib/insight-recognition-v3.mjs`) as the current Insight product/prompt doctrine and runtime default. Close the implementation-versus-doctrine discrepancy recorded in D-2026-07-16-19.
- **Classification:** Hard Save
- **Rationale:** Paired blind human review on branch `insight/recognition-v3-reevaluation`: recognition-v3.0 won **6/6** qualitative selections against adaptive V2.2.1 on six calibration/regression dreams. Both variants used GPT-5.6 Sol and the V2 schema — the evaluation compared prompt systems, not different foundation models. Fabrizzio explicitly accepted the corrected prompt and confirmation outputs.
- **Qualification:** adaptive V2.2.1 remains preserved as fallback code only (`SYSTEM_PROMPT_V2`). One narrow vocabulary correction removed prompt-seeded rehearsal/practice/trying-out habits; three-case confirmation preserved depth and improved Meeting evidence discipline. No further Insight evaluation is required before alpha unless user evidence reveals a repeated failure. Next product gate: focused security/privacy before external adult alpha testing.
- **Status:** accepted
- **Canonical owner:** [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md); volatile pointer [CURRENT_STATE.md](./CURRENT_STATE.md)
- **Related evidence:** `eval-outputs/insight-recognition-v3-vs-v2-2-1/` (12 generations, blind review); `eval-outputs/insight-recognition-v3-vocab-correction/` (3 confirmation generations); `scripts/insight-v2/run-recognition-v3-vs-v2-2-1-blind.mjs`; `scripts/insight-v2/run-recognition-v3-vocab-confirmation.mjs`
