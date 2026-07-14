# DreamCatcher Agent Guide

## 1. Product overview

DreamCatcher is a Vite web application evolving from a simple dream journal into a mobile-first AI-assisted emotional self-reflection product.

Its core flow is:

1. User authenticates through Supabase.
2. User records and saves a dream.
3. Authenticated dreams are stored in Supabase.
4. User can request one Dream Insight for a saved dream.
5. A Vercel serverless function authenticates the user, verifies dream ownership, calls the OpenAI API, and stores the result in the `dream_insights` table.
6. Dreams and insights persist across refreshes and login sessions.
7. Deleting a dream also removes its related insight.

**Dream Replay** is a possible future selling point. It must not receive a full production implementation unless explicitly requested. Test interest through user feedback or a disposable prototype first. The UI may show a “Coming Soon” control; leave it non-functional for now.

## 2. Current product direction

The next major phase is a **mobile-first frontend redesign**.

The primary usage moment is immediately after waking, when a user wants to record a fading dream quickly from a phone.

The product should eventually feel:

- fast
- emotionally vivid
- private
- modern
- mobile-native
- visually engaging
- suitable for social-media-driven consumer acquisition

It should remain readable and calm during dream capture and reflection.

Desktop remains supported but is secondary.

Do not redesign blindly. Visual changes should follow supplied screenshots, references, and explicit requirements.

## 3. Product validation status

DreamCatcher is not yet validated as a business.

The immediate objective is to finish a credible mobile-first beta, ship it to real users, and evaluate:

- dream capture
- insight generation
- repeat usage
- sharing interest
- demand for Dream Replay

Use that feedback before investing in deeper features or full Replay production work.

## 4. Protected working systems

Future agents must preserve the existing working:

- Supabase authentication
- email/password login
- email confirmation
- password recovery
- `dreams` table behavior
- `dream_insights` table behavior
- row-level security assumptions
- user ownership checks
- dream save and delete behavior
- insight persistence
- dream-to-insight relationship (one insight per dream; cascade delete with the dream)
- Vercel serverless API flow (`/api/dream-insights`)
- OpenAI integration
- generic frontend error messages
- detailed server-side error logging (without printing secrets)

Do not change the database schema, API contract, authentication flow, environment-variable names, or persistence logic unless the task explicitly requires it.

## 5. Current branch and workflow

The stable Dream Insights work was developed on:

`dream-insights-v2`

The current frontend redesign branch is:

`dream-ai-redesign`

Future substantial frontend redesign work should continue on this redesign branch (or another dedicated branch), not by rewriting the stable Insights history.

Before editing:

1. Run `git status`.
2. Confirm the active branch.
3. Inspect the relevant files.
4. Explain the suspected cause or planned approach.
5. Make the smallest safe change necessary.
6. Test the affected behavior.
7. Report exactly which files changed.

Never use destructive Git commands such as:

- `git reset --hard`
- `git clean -fd`
- `git restore .`
- `git checkout .`

unless the user explicitly requests and understands the consequences.

Never commit or push without the user’s explicit instruction.

## 6. Environment variables and secrets

Secrets must never be printed, exposed, added to prompts, or committed.

Expected environment-variable names (confirm in code / `.env.example` before changing anything):

| Area | Names |
|------|--------|
| Frontend (Vite) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Server preferred | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Server fallbacks | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` |
| OpenAI (server only) | `OPENAI_API_KEY` |

Do not use a Supabase service-role key. Ownership is enforced with the caller’s JWT and RLS.

`.env.local` must remain ignored by Git (see `.gitignore`: `.env*` / `*.local`).

### Known local-development issue

Values may exist in `.env.local` but not automatically be inherited by the Vercel serverless-function process.

When this happens, **do not modify application code to compensate**.

Known temporary PowerShell approach: load the variables into the current terminal process and start `npx vercel dev` from that same terminal.

Do not include secret values in this file or in chat.

## 7. Development commands

From `package.json`:

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite frontend |
| `npm run dev:vercel` | Start via `vercel dev` (script alias) |
| `npx vercel dev` | Local frontend + Vercel serverless API routes |
| `npm run build` | Production Vite build |
| `npm run preview` | Preview the production build |
| `git status` | Check working tree |
| `git branch --show-current` | Confirm active branch |

Notes:

- `npm run dev` starts the Vite frontend only.
- Use `npx vercel dev` (or `npm run dev:vercel`) when testing `/api/dream-insights` locally.
- The localhost port may change when another port is occupied.
- A different localhost port is not a code regression.

## 8. Known project history and traps

- A previous catch-all SPA rewrite in `vercel.json` caused JavaScript module requests to receive `index.html`. Do not restore such a rewrite without understanding the routing consequences. (There is currently no `vercel.json` in the repo root.)
- `.env.local` previously appeared populated in the editor while its saved disk contents differed. Confirm files are saved before debugging environment problems.
- Missing server-side Supabase or OpenAI variables caused Dream Insights API failures.
- The Dream Insight problem is visual presentation, not data: the insight is correctly stored and linked to its dream, but frontend styling makes it resemble another journal entry. Redesign work must fix visual hierarchy without changing the dream–insight data relationship.
- The current interface began as a desktop learning project and is not the final mobile product direction.
- Long AI output should not be presented as one unstructured wall of text.
- Dream Insight should not look like another saved dream.

## 9. Current confirmed behavior

The following currently work:

- saving dreams
- saving long dreams
- persistence after refresh
- persistence after logout and login
- generating a Dream Insight
- preventing repeated generation for a dream after an insight exists
- loading the saved insight again
- keeping each insight associated with its correct dream
- deleting the associated insight when its dream is deleted (DB cascade on `dream_insights.dream_id`)

The insight data relationship is correct. Remaining work is presentation: styling currently makes an insight resemble another journal entry.

Minor polish issue (not a blocker):

After **Catch Dream** is pressed and the dream is added to the journal, the page may shift upward slightly.

## 10. Frontend redesign rules

For redesign tasks:

- Work mobile first.
- Preserve backend behavior.
- Avoid rewriting the app from scratch.
- Do not replace Supabase or Vercel integrations.
- Do not introduce another framework unless explicitly approved.
- Use accessible touch targets.
- Keep long dreams readable.
- Use progressive disclosure for long insights.
- Make the insight visually attached to its dream; fix visual hierarchy without changing the data relationship.
- Preserve a night-sky identity, but do not preserve the existing desktop layout merely because it exists.
- Sheepy may remain as a subtle brand element.
- Avoid generic SaaS dashboards.
- Avoid excessive glassmorphism, gradients, tiny text, and random AI sparkle icons.
- Consumer-friendly motion and visual energy are allowed when they support comprehension and engagement.
- Do not add onboarding, subscriptions, full Dream Replay production, streaks, social features, or unrelated functionality unless explicitly requested.

Stack note: the app is vanilla JS (`src/main.js`, `src/style.css`, `index.html`) on Vite — not React. Keep that stack unless the user explicitly approves a change.

## 11. AI-output guidelines

The current generated insight is functional but can feel like a small university essay.

Future AI-output work should aim for:

- concise language
- strong visual structure
- a clear core reflection
- emotional signals
- key symbols
- possible themes
- two or three reflection questions
- careful non-medical language
- uncertainty rather than definitive psychological claims
- minimal repetition of the original dream
- restrained use of emojis or visual symbols

Do not change the model or prompt without inspecting `api/dream-insights.js` and discussing the tradeoffs. The live implementation uses structured JSON (`summary`, `emotions`, `people`, `places`, `symbols`, `themes`, `reflection_questions`, `uncertainty_note`, `return_message`) and currently asks for exactly three reflection questions.

## 12. Working style for this user

Future agents should:

- explain in beginner-friendly English
- work one step at a time
- investigate before editing
- avoid assuming the user understands Git or infrastructure terminology
- clearly distinguish frontend, backend, database, API, local development, preview, and production
- provide acceptance criteria
- report changed files
- warn before destructive or broad changes
- never request secret keys
- never ask the user to paste environment-file contents
- remind the user to review prompts and commands carefully before running them

## 13. Definition of done

For every coding task, report:

- what was investigated
- root cause or design rationale
- files changed
- behavior changed
- behavior deliberately preserved
- tests performed
- remaining risks or follow-up work

Do not claim a task is complete without testing the relevant behavior.
