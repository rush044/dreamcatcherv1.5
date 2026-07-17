# DreamCatcher — Current State

## Scope contract

- **Purpose:** Record the volatile accepted baseline, documentation working branch, and immediate next actions.
- **Contains:** Accepted commits/branches, completed verification notes, current documentation action, and near-term priority.
- **Does not contain:** Durable product doctrine, full decision history, or Insight evaluation detail.
- **Update when:** Accepted baseline, working branch, immediate next action, or checkpoint status changes.
- **Default loading behavior:** Always read at session start with `AGENTS.md`.

---

## Accepted code baseline

| Item | Value |
|------|-------|
| Branch | `ux-mobile-polish-v2` |
| Commit | `a52d8bfa905ed038bba38c847fee4ae4264df5ad` |
| Onboarding fix branch | `fix/onboarding-desktop-overlap` |
| Onboarding fix commit | `a52d8bfa905ed038bba38c847fee4ae4264df5ad` |
| Old `main` historical anchor | `95556fc2115ae7f9262efe2dc8d115c6d86e1b7b` |

`main` and production remain untouched by this documentation work.

---

## Documentation working branch

| Item | Value |
|------|-------|
| Branch | `docs/source-of-truth-reset` |
| Base commit | `a52d8bfa905ed038bba38c847fee4ae4264df5ad` |

Do not record this documentation commit’s own hash inside the commit that creates it. Report Git HEAD after committing.

---

## Accepted onboarding overlap fix

The accepted onboarding desktop-overlap commit has already been built and visually verified across all five onboarding slides at:

- 390×844
- 768×1024
- 1366×768
- 1366×650

Do not rerun those checks for the unchanged commit.

---

## Current action

Source-of-Truth Reset correction round (documentation only). Changes remain uncommitted pending Fabrizzio’s review.

After acceptance of this documentation checkpoint:

1. Commit and push through a later delta prompt.
2. Return to Insight polishing via the next Insight action below.
3. Do not begin constellations, Replay, audio, or another major redesign before the core loop is proven.

---

## Insight doctrine versus runtime

**Classification:** Implementation-versus-doctrine discrepancy requiring focused Insight re-evaluation.

| Layer | Status |
|-------|--------|
| Accepted product/prompt doctrine | adaptive V2.2.1 is the explicitly accepted current direction; preserve the V2 schema and accepted adaptive V2.2.1 principles |
| Current implemented runtime | `recognition-v3.0` is wired as the default runtime on the accepted baseline; adaptive V2.2.1 remains available as fallback |
| Acceptance of `recognition-v3.0` | Experimentally evaluated and still active in code; **no recovered evidence** that Fabrizzio explicitly accepted it as final production doctrine. Silence or continued presence in code is not acceptance |

Do not choose a winner by version name. Do not call `recognition-v3.0` accepted doctrine. Do not call adaptive V2.2.1 the current runtime when code contradicts that. Do not change code or prompt routing in this documentation task.

**Next Insight action:** Evaluate `recognition-v3.0` against the accepted adaptive V2.2.1 principles and current human acceptance criteria before changing runtime prompt selection.

Canonical detail: [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md). Decision entry: [DECISIONS.md](./DECISIONS.md) D-2026-07-16-19.
