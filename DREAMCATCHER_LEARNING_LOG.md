# DreamCatcher — Learning Log

## Scope contract

- **Purpose:** Append-only reusable lessons from building DreamCatcher.
- **Contains:** Concise educational entries tied to real product work.
- **Does not contain:** Active product doctrine, full incident operational detail, or a traditional course curriculum.
- **Update when:** A reusable lesson appears and should be preserved.
- **Default loading behavior:** Not routinely loaded in full. Retrieve when teaching a concept or appending a new lesson. During alpha, do not reorganize or rewrite earlier entries.

---

## A — Learning through building

- Fabrizzio learns technical and AI concepts through real DreamCatcher work.
- Explain new concepts briefly when relevant.
- Product work remains the priority.
- The learning preference originated with Fabrizzio; the durable log structure was collaboratively formalized.

---

## B — Git vocabulary

- **commit:** a saved Git snapshot of the project at a point in time
- **commit hash:** the unique random-looking identifier for that snapshot
- **commit message:** the human-readable description of why the snapshot exists
- **HEAD:** the pointer to the currently checked-out commit
- **branch:** a movable name pointing through commit history

---

## C — Documentation vocabulary

- **brief:** a short task instruction focused on outcome and constraints
- **current-state document:** volatile “where we are now” notes (`CURRENT_STATE.md`)
- **runbook:** step-by-step operational procedure for a recurring task
- **decision log:** accepted decisions and supersessions (`DECISIONS.md`)
- **source map:** index that tells an agent which document owns which truth (`AGENTS.md`)
- **source of truth:** the accepted authoritative place for a fact or rule
- **canonical override:** accepted current information that replaces conflicting old active guidance
- **incident log:** unexpected failures worth retrieving later (`INCIDENTS.md`)

Introduce each document type only when a concrete recurring problem warrants it.

---

## D — Model, agent, tool, skill, and harness

- **model:** the language-reasoning engine
- **agent:** model plus instructions, tools, loop, and environment
- **tool:** an external capability such as terminal, browser, file editor, Git, or testing
- **skill:** a reusable workflow that guides agent reasoning and tool use
- **harness:** the surrounding system that controls how the model operates

DreamCatcher’s Insight path (schema, prompt constraints, persistence, evaluation, product UI) is an example harness around a frontier model.

---

## E — Conversation history versus active context

- Context windows are finite.
- **Context pollution:** obsolete, duplicated, or irrelevant material crowding out useful signal.
- **Context rot:** earlier accurate guidance becomes stale while still sounding authoritative.
- Prefer selective loading, summaries, and checkpoints over rereading every document every session.
- Repository canonical files are the durable store; chat is working memory.

---

## F — Basic implementation-prompt structure

Important prompts should make these elements clear enough to review:

1. Outcome
2. Context
3. Scope
4. Constraints
5. Acceptance criteria
6. Verification
7. Handoff

Fabrizzio does not need elaborate prompt syntax, but should understand these elements well enough to review important prompts.

Optional idea-burst labels (for fast chat capture, not required prompt syntax):

- Question
- Hard-save candidate
- Idea
- Correction
- Action

---

## G — High-stakes prompt convergence

Used for this Source-of-Truth Reset:

1. one substantial draft
2. review notes
3. critical evaluation of notes
4. delta discussion without repeatedly reposting the whole prompt
5. decreasing corrections as a convergence signal
6. one final consolidated prompt
7. one execution
8. at most one correction

Fewer notes suggest alignment but do not prove completeness.

Canonical process owner: [COLLABORATION.md](./COLLABORATION.md).

---

## H — AI self-evaluation failure

Polished and safe output can still fail the user.

- Safety is a gate, not proof of Insight quality.
- Subjective meaningfulness needs Fabrizzio and later blind users.
- Related: [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md), [INCIDENTS.md](./INCIDENTS.md) item B.

---

## I — Few-shot guidance

- Positive examples teach the desired decision boundary.
- Negative / rejected summary-like examples teach what to avoid.
- Overfitting risk: the model may imitate phrasing instead of principles.
- Prefer diverse principles over reusable stock lines.
- Related: [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md).

---

## J — Incident learning

Operational incident detail lives in [INCIDENTS.md](./INCIDENTS.md). Do not duplicate full incident writeups here; link and extract only the reusable lesson.

---

## K — Sycophancy and convenient agreement

AI models can display **sycophancy**: following the user’s framing or agreeing too readily instead of providing accurate challenge.

- “Never agree merely for convenience” is a useful behavioral constraint.
- The instruction reduces risk but does not guarantee perfect independence.
- Agents should not manufacture disagreement merely to appear critical.
- Correct behavior: accept, qualify, park, research, or reject based on evidence and product goals.

Related: [COLLABORATION.md](./COLLABORATION.md), [AGENTS.md](./AGENTS.md).

---

## L — Dated history retrieval is useful but incomplete

AI systems may retrieve dated prior decisions, incidents, and preferences when those sources remain available.

- Dates help reconstruct chronology and distinguish current decisions from old ones.
- Retrieval may still omit exact conversations, scores, or evidence.
- Unavailable information must be marked as a **retrieval gap**, not reconstructed as fact.
- Canonical documents remain safer than raw conversational memory.

---

## M — Collaboration milestone

Creating [COLLABORATION.md](./COLLABORATION.md) established a practical separation between:

- product thinking, education, external research, and prompt preparation in ChatGPT Work;
- repository implementation, code-aware research, Git evidence, and testing in Cursor;
- canonical documents as the bridge between them.

This is part of Fabrizzio’s practical AI education. It does **not** mean the two agents must duplicate the same research. Hybrid research roles: [COLLABORATION.md](./COLLABORATION.md).

---

## N — Proportional review for delta prompts

Fabrizzio had already reviewed and accepted the reasoning behind a focused correction, then mistakenly reread the delta as though it were another complete specification.

- Review effort should be proportional to what is new and what could go wrong.
- For a delta prompt, review the changed instructions, branch/safety boundaries, and stop point.
- Unchanged accepted reasoning does not need to be reread word for word.
- Destructive, irreversible, production-facing, data-affecting, or externally consequential prompts still require careful full review.

---

## O — Context quality versus raw prompt length

The complete structured Source-of-Truth Reset prompt appeared to use approximately 23% of the displayed Cursor Agent meter.

- This suggests one coherent large specification fit comfortably in that agent context.
- The meter’s exact meaning was not independently verified and may represent context rather than plan usage or cost.
- Context reliability depends on relevance, duplication, contradiction, and noisy tool output as well as raw length.
- A long coherent specification can be safer than a short conflicting one.
- Visible percentages are useful signals, not guarantees of output quality.

---

## P — Blind prompt comparison and vocabulary correction (2026-07-17)

When doctrine and runtime disagree, a **paired blind human review** on the same model and schema isolates prompt quality from model quality.

- DreamCatcher compared recognition-v3.0 vs adaptive V2.2.1 using GPT-5.6 Sol and the V2 schema — six dreams, twelve generations, randomized A/B labels.
- Fabrizzio’s qualitative blind selections were unanimous for recognition-v3.0 (6/6).
- A follow-up **narrow vocabulary correction** removed prompt-seeded “rehearsal / practice / trying out” habits without flattening depth; a three-case confirmation preserved recognition quality and tightened evidence discipline on Meeting.
- Prompt examples and private function lists can seed repetitive user-facing phrasing even when the model’s interpretive depth is good — audit both mechanism quality and output vocabulary.
- Historical evaluation artifacts should be preserved, not overwritten, when superseding prompt doctrine.

---

## Q — Why the closed-alpha security gate felt easy (2026-07-17)

For DreamCatcher, the focused security/privacy gate felt like the easiest implementation phase so far.

- The existing foundation already carried most of the security load: Supabase Auth, user-scoped RLS, JWT-authenticated API access, a server-side OpenAI key, and cascading deletion.
- The remaining alpha work was bounded hardening and verification: input limits, CORS, a best-effort cost quota, log hygiene, live Supabase checks, disclosure, and a deletion procedure.
- This does not establish that security is inherently easy. Public scale, payments, uploads, minors, new providers, incidents, or changed data flows require new security work.
- Reusable workflow: establish a verified baseline once, then review only changes affecting where data goes, access, storage, deletion, or external cost.
- Agents and automation own deterministic verification. Fabrizzio’s manual testing stays limited to authenticated external state, subjective acceptance, and one changed critical path. Do not retest unchanged behavior without a concrete reason.

---

## Future-entry topics (placeholders, not yet written)

- initial Cursor and terminal setup
- Git, Node, Vite, and Vercel tooling
- additional Supabase configuration lessons
- additional Insight failures
- DreamCatcher’s product evolution lessons beyond Product History snapshots
