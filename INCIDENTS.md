# DreamCatcher — Incidents

## Scope contract

- **Purpose:** Preserve unexpected failures worth retrieving later.
- **Contains:** Symptoms, impact, cause, resolution, prevention, evidence, retrieval gaps, and related commits/docs.
- **Does not contain:** Active product doctrine, routine workflow rules, or full Insight evaluation tables.
- **Update when:** A new incident is worth preserving, or an existing entry’s status/evidence improves.
- **Default loading behavior:** Not routinely loaded. Retrieve only when diagnosing recurrence or reconstructing an incident.

---

## Status values

`documented` · `partial` · `reconstruction-needed` · `resolved` · `recurrence`

---

## INC-A — Codex-to-Cursor transfer incident

- **Status:** documented / resolved
- **Symptoms:** Implementation began in a Codex-created clone and was transferred into Cursor; GitHub connector access differed from terminal Git authentication; sandbox restrictions created friction; GitHub CLI authentication was involved; Git `safe.directory` ownership protection appeared.
- **Impact:** Delayed safe push and created avoidable environment confusion during active production work.
- **Cause:** Transferring active work between separately owned clones/environments with different auth and sandbox assumptions.
- **Resolution:** The branch was eventually pushed safely from the intended environment.
- **Prevention:** Avoid transferring active production work between Codex and Cursor clones; prefer the original Cursor repository environment.
- **Evidence:** Recovered operational memory from the Source-of-Truth Reset prompt. Exact timestamps/commit hashes for every intermediate failure were not fully reconstructed here.
- **Retrieval gaps:** Detailed command logs and exact authentication error strings not reconstructed in this reset.

---

## INC-B — Insight evaluation false-positive incident

- **Status:** partial
- **Symptoms:** “Thursday Review” and “Room 714” initially appeared polished enough to AI evaluation; Fabrizzio identified bland summaries rather than meaningful Insights; Room 714 also had an overly abstract question.
- **Impact:** Risk of shipping Insights that pass mechanical/AI checks but fail subjective meaningfulness.
- **Cause:** Safety, schema compliance, and polished prose were overweighted relative to meaningful understanding. See [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md).
- **Resolution:** Doctrine updated: safety is a gate; subjective meaningfulness requires Fabrizzio (and later blind users); do not invent missing later scores.
- **Prevention:** Keep AI scoring for triage/mechanical checks; require human acceptance for recognition/resonance; preserve bland-summary rejects in few-shot guidance.
- **Evidence:** Narrative recovered in Source-of-Truth Reset prompt; linked doctrine in [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md).
- **Retrieval gaps:** Exact later numeric scores were not recovered. Do not invent them.

---

## INC-C — Supabase / `.env.local` incident

- **Status:** reconstruction-needed
- **Known preserved fact:** An empty or missing `.env.local` and Supabase configuration caused prior setup difficulty.
- **Do not invent:** Exact error messages, timelines, or which variables were missing beyond what is currently recoverable.
- **Related active guidance:** Secret handling and local env notes in [WORKFLOWS.md](./WORKFLOWS.md).
- **Evidence type:** Partial reconstruction from prior project memory / old agent notes.

---

## INC-D — Vercel rewrite incident

- **Status:** reconstruction-needed
- **Known preserved fact:** A Vercel catch-all rewrite returned HTML where JavaScript was expected.
- **Do not invent:** Exact `vercel.json` contents, deploy IDs, or full debugging timeline beyond currently available evidence.
- **Related note:** Old agent guidance warned not to restore such a rewrite without understanding routing consequences.
- **Evidence type:** Partial reconstruction from prior project memory / old agent notes.
