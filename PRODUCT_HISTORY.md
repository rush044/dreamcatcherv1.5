# DreamCatcher — Product History

## Scope contract

- **Purpose:** Curated product-evolution index for comparing eras and recording meaningful checkpoints.
- **Contains:** Snapshot entries with experience summary, assumptions, learnings, and Git anchors.
- **Does not contain:** Source code dumps, arbitrary obsolete file archives, or active product doctrine.
- **Update when:** A meaningful product checkpoint is accepted and worth preserving as history.
- **Default loading behavior:** Not part of ordinary loading. Retrieve only when comparing eras or adding a snapshot.

This file is curated, not a dumping ground.

---

## Snapshot entry shape

Future snapshots should include:

- date/version
- product experience
- important screens and behavior
- major assumptions
- what was learned
- why it changed
- screenshots or preview links
- Git commit, tag, or branch

Do not create Git tags from documentation tasks unless explicitly requested. Do not copy source code into Markdown.

---

## PH-2026-07 — Source-of-Truth Reset era anchors

### Old `main` historical anchor

- **Git:** `95556fc2115ae7f9262efe2dc8d115c6d86e1b7b` (`main` historical anchor)
- **Role:** Prior historical baseline retained for comparison; not the accepted current UI checkpoint.
- **Notes:** Do not treat old `main` as current product direction.

### Accepted UI checkpoint

- **Date:** 2026-07-16 (accepted before documentation reset)
- **Git:** `a52d8bfa905ed038bba38c847fee4ae4264df5ad` on `ux-mobile-polish-v2` / `fix/onboarding-desktop-overlap`
- **Product experience:** Mobile-first DreamCatcher with onboarding desktop-overlap fix accepted.
- **Important behavior:** Onboarding visually verified across five slides at 390×844, 768×1024, 1366×768, and 1366×650.
- **Major assumptions at checkpoint:** Core loop remains capture → star/sky → Insight → return; no constellations/Replay/audio major redesign before the core loop is proven.
- **What was learned:** Short desktop viewports required dedicated onboarding overlap correction; verification evidence already exists and should not be rerun for the unchanged commit.
- **Why it changed:** Stabilize mobile/desktop polish before documentation reset and Insight polishing.
- **Screenshots / previews:** Prior visual verification completed outside this documentation task.

### Design influence note

- **Focus Friend** was an early design influence.
- It is **not** a current design constraint.

### Why this documentation reset exists

- Fabrizzio originated the need for the Source-of-Truth Reset after recognizing that ideas, lessons, active rules, and obsolete information needed structured separation.
- The agent helped formalize the architecture and implementation procedure.
- Resulting canonical system is routed from [AGENTS.md](./AGENTS.md).
