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

Insight recognition-v3.0 acceptance checkpoint on branch `insight/recognition-v3-reevaluation`. Doctrine and runtime are aligned; discrepancy closed (see Insight section below).

**Next product gate:** Focused security/privacy work before external adult alpha testing.

Do not begin constellations, Replay, audio, or another major redesign before the core loop and alpha gate are proven.

---

## Insight doctrine and runtime

**Classification:** Resolved — doctrine and runtime aligned on `recognition-v3.0`.

| Layer | Status |
|-------|--------|
| Accepted product/prompt doctrine | **recognition-v3.0** (vocabulary-corrected prompt in `lib/insight-recognition-v3.mjs`) |
| Current implemented runtime | **recognition-v3.0** default; adaptive V2.2.1 preserved as fallback in `lib/insight-v2.mjs` |
| Working model | GPT-5.6 Sol (`gpt-5.6-sol`) |
| Schema | V2 (unchanged) |
| Further Insight evaluation before alpha | **Not required** unless user evidence reveals a repeated failure |

**Acceptance evidence:** Paired blind human review — recognition-v3.0 won **6/6** qualitative selections against adaptive V2.2.1 on six dreams (Thursday Review, Room 714, Meeting, Hotel, Long bizarre, Long relationship). Both variants used the same model and schema; the evaluation compared **prompt systems**, not different foundation models. One narrow vocabulary correction removed prompt-seeded rehearsal/practice/trying-out habits; a three-case confirmation preserved depth and improved BLIND-03 evidence discipline.

Canonical detail: [INSIGHT_SYSTEM.md](./INSIGHT_SYSTEM.md). Decisions: [DECISIONS.md](./DECISIONS.md) D-2026-07-17-01 (supersedes D-2026-07-16-19).

Evidence artifacts (preserved, not overwritten): `eval-outputs/insight-recognition-v3-vs-v2-2-1/`, `eval-outputs/insight-recognition-v3-vocab-correction/`.
