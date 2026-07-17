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
| Branch | `security/privacy-alpha-gate` |
| Last code-bearing security commit | `af45d9eabc906a2e6be9087e9b5e8f7709dbfa13` |
| Accepted gate / Learning Log checkpoint | `347a8d1f887adaf00bc82987c5186cfa4f188c3c` |
| Prior UX / onboarding lineage | Included via ancestry (`a52d8bf` onboarding overlap fix; `ux-mobile-polish-v2` / `3c22fad` docs reset) |
| Previous `main` historical anchor | `95556fc2115ae7f9262efe2dc8d115c6d86e1b7b` |

This is the integrated closed-alpha baseline: UX/auth product lineage + recognition-v3.0 Insight acceptance + security/privacy alpha gate.

**Production promotion** of `security/privacy-alpha-gate` into `main` was **explicitly approved**.

---

## Documentation working branch

| Item | Value |
|------|-------|
| Branch | `security/privacy-alpha-gate` |
| Gate checkpoint | `347a8d1f887adaf00bc82987c5186cfa4f188c3c` |

Do not record this documentation commit’s own hash inside the commit that creates it. Report Git HEAD after committing.

---

## Accepted onboarding overlap fix

The accepted onboarding desktop-overlap commit (`a52d8bf`) remains in ancestry and was already built and visually verified across all five onboarding slides at:

- 390×844
- 768×1024
- 1366×768
- 1366×650

Do not rerun those checks for the unchanged commit.

---

## Current action

Closed-alpha baseline accepted on `security/privacy-alpha-gate`. Production promotion into `main` is explicitly approved and in progress / completed per Git ops on this promotion pass.

**Verdict:** **READY** for a small, consenting-adult, operator-supported closed alpha. **Not ready** for a public or paid launch.

**Access rule:** Each tester must receive the approved adult-alpha disclosure and explicitly agree before receiving access. Operator account deletion follows the approved procedure in [SECURITY_PRIVACY_ALPHA_GATE.md](./SECURITY_PRIVACY_ALPHA_GATE.md).

Do not begin constellations, Replay, audio, or another major redesign before the closed alpha is underway and the core loop is proven with real adult testers.

---

## Security / privacy alpha gate

| Item | Status |
|------|--------|
| Working branch | `security/privacy-alpha-gate` |
| Last code-bearing security commit | `af45d9eabc906a2e6be9087e9b5e8f7709dbfa13` |
| Accepted gate / Learning Log checkpoint | `347a8d1f887adaf00bc82987c5186cfa4f188c3c` |
| Production RLS (`dreams`, `dream_insights`) | Enabled; policies restrict to `auth.uid() = user_id` |
| Length constraints | Applied and verified (preflight: 0 oversized bodies, 0 oversized titles) |
| Cascade FKs | Remotely verified (`ON DELETE CASCADE`) |
| Vercel configuration | User-confirmed as set |
| Preview smoke | Passed (login, save, Journal/open, Insight, deletion) |
| Disclosure + deletion SOP | Fabrizzio accepted; exact wording in gate doc |
| Closed adult alpha | **READY** |
| Public / paid launch | **Not ready** |
| Production promotion | **Explicitly approved** |

Canonical detail: [SECURITY_PRIVACY_ALPHA_GATE.md](./SECURITY_PRIVACY_ALPHA_GATE.md).

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
