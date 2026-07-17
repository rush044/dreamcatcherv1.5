# DreamCatcher — Workflows

## Scope contract

- **Purpose:** Define implementation and documentation workflows, save routing, and protected technical constraints.
- **Contains:** Current implementation loop, docs loading/update procedure, save routing, and implementation guardrails.
- **Does not contain:** Product definition, marketing claims, Insight evaluation doctrine, or incident narratives.
- **Update when:** The implementation loop, save routing, or protected technical constraints change.
- **Default loading behavior:** Load for implementation, Git, documentation updates, or save-routing questions.

---

## Current implementation loop

1. Finish one narrow implementation.
2. Fabrizzio tests or reviews it.
3. Allow at most one focused correction.
4. Checkpoint the accepted result.
5. Update only affected canonical documentation.
6. Continue to the next core-loop priority.

Do not begin constellations, Replay, audio, or another major redesign before the core loop is proven. Immediate priority after this documentation checkpoint: Insight polishing. See [CURRENT_STATE.md](./CURRENT_STATE.md).

---

## Documentation loading

### Session start

- Read `AGENTS.md`
- Read `CURRENT_STATE.md`
- Read only the relevant domain files
- Retrieve archived history only when specifically required

### Session end

- Inspect which Markdown files changed
- Update only affected canonical sources
- Avoid scanning all Markdown unless performing an explicit reset
- Report unresolved documentation impact

---

## Save routing

| Classification | Destination |
|----------------|-------------|
| Hard Save | Critical evaluation → [DECISIONS.md](./DECISIONS.md) + canonical topic file |
| Soft Save | [IDEAS.md](./IDEAS.md) without changing current scope |
| Research Flag | Unverified entry with proof requirement (usually [IDEAS.md](./IDEAS.md)) |
| Incident | [INCIDENTS.md](./INCIDENTS.md) |
| Reusable learning | [DREAMCATCHER_LEARNING_LOG.md](./DREAMCATCHER_LEARNING_LOG.md) |
| Superseded decision | Preserve historical entry; remove from active guidance |
| Volatile state | [CURRENT_STATE.md](./CURRENT_STATE.md) |
| Product evolution snapshot | [PRODUCT_HISTORY.md](./PRODUCT_HISTORY.md) |

Collaboration acceptance rules: [COLLABORATION.md](./COLLABORATION.md).

---

## Protected technical systems

Do not change these unless the task explicitly requires it:

- Supabase authentication (email/password, confirmation, recovery)
- `dreams` / `dream_insights` behavior and ownership / RLS assumptions
- one Insight per dream; cascade delete with the dream
- Vercel serverless flow (`/api/dream-insights`)
- OpenAI integration path and generic frontend error messages
- environment-variable names and secret handling
- database schema / API contract / persistence logic without explicit request

Stack (unless explicitly changed): vanilla JS on Vite (`src/main.js`, `src/style.css`, `index.html`) — not React.

### Secrets

Never print, expose, commit, or request secrets. Confirm names in code / `.env.example` before changing anything.

Known names:

| Area | Names |
|------|-------|
| Frontend (Vite) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Server preferred | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Server fallbacks | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` |
| OpenAI (server only) | `OPENAI_API_KEY` |

Do not use a Supabase service-role key. Ownership is enforced with the caller’s JWT and RLS.

`.env.local` must remain Git-ignored.

### Local development note

Values in `.env.local` may not automatically reach the Vercel serverless process. Do not modify application code to compensate. Prefer loading variables into the same terminal process before `npx vercel dev`.

### Common commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Vite frontend only |
| `npx vercel dev` / `npm run dev:vercel` | Frontend + serverless API |
| `npm run build` | Production Vite build |
| `npm run preview` | Preview production build |

Port changes when occupied are not code regressions.

### Git safety

- Never commit or push without explicit instruction.
- Never force-push or touch `main` unless explicitly requested.
- Never use destructive Git commands unless explicitly requested with understood consequences.

---

## Frontend implementation guardrails

- Work mobile first; desktop is supported but secondary for retention.
- Preserve backend behavior during UI work.
- Avoid rewriting the app from scratch or introducing a new framework without approval.
- Sheepy must not obstruct capture/navigation, overlap controls, or intercept decorative taps.
- Preserve reduced-motion accessibility when motion is introduced.
- Do not add onboarding persistence, subscriptions, full Dream Replay production, streaks, social features, or unrelated major features unless explicitly requested.

UX review procedure: [UX_REVIEW_GUIDE.md](./UX_REVIEW_GUIDE.md).
