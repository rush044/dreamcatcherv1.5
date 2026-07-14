# DreamCatcher Agent Guide

## 1. Product overview

DreamCatcher is a mobile-first dream-recording product evolving from an AI-assisted dream journal into an emotionally persistent world centered on Sheepy, dreams, stars, and the night sky.

The product’s functional foundation remains:

- The user authenticates through Supabase.
- The user records and saves a dream.
- Authenticated dreams are stored in Supabase.
- The user can request one Dream Insight for a saved dream.
- A Vercel serverless function authenticates the user, verifies dream ownership, calls the OpenAI API, and stores the result in the `dream_insights` table.
- Dreams and insights persist across refreshes and login sessions.
- Deleting a dream also removes its related insight.

The emotional product loop is:

1. The user records a dream.
2. The dream becomes part of the night sky, represented as a star.
3. The sky grows as more dreams are recorded.
4. Sheepy tends this place and acknowledges the user’s return.
5. The user gradually feels that their dreams help keep the world alive.
6. That attachment gives the user a reason to return beyond utility or AI analysis.

The central emotional proposition is:

> “My dreams help keep this place alive.”

Dream Replay remains a possible future selling point. It must not receive a full production implementation unless explicitly requested. Test interest through user feedback or a disposable prototype first. The UI may show a “Coming Soon” control; leave it non-functional for now.

## 2. Current product direction

DreamCatcher is no longer being treated as only an idea or technical prototype.

The current strategic framing is:

> “You are no longer testing an idea. You are testing a product.”

The mobile-first implementation is deployed and functioning. Authentication, cloud sync, onboarding, dream saving, Dream Insights, Journal, Sky, Profile, and navigation are operational.

The current phase is not another broad redesign or a major feature-expansion cycle.

The immediate priorities are:

1. Fix user-visible bugs.
2. Improve mobile stability and polish.
3. Strengthen emotional attachment.
4. Make existing interactions feel more alive.
5. Test the product with real users.
6. Use observed user behavior before investing in major new features.

The primary usage moment remains immediately after waking, when a user wants to record a fading dream quickly from a phone.

The product should feel:

- fast
- emotionally vivid
- private
- calm during dream capture
- modern
- mobile-native
- alive and reactive
- distinctive rather than generically AI-generated
- capable of creating affection and a sense of return

Desktop remains supported but is secondary.

Do not redesign blindly. Visual changes must follow supplied screenshots, references, explicit requirements, and the established emotional direction.

## 3. Sheepy and the emotional world

Sheepy is not merely a decorative mascot or subtle brand element.

Sheepy is becoming the product’s central emotional companion and may become its strongest long-term differentiator.

The world model is:

- Sheepy tends the night sky.
- Dreams become stars.
- The sky grows as dreams are recorded.
- Dream Insights may later be represented as constellations.
- The environment should increasingly react when a dream is saved.
- The user should gradually feel responsible for, attached to, and welcomed back into this world.

The product should eventually create three emotional effects:

### Attachment

The user recognizes Sheepy as a character rather than an image.

This can gradually develop through:

- small dialogue lines
- moods
- reactions
- multiple poses
- subtle animation
- recognition of returning users
- changes in the environment

Do not require a complex character system before initial product testing. Small, carefully timed dialogue and environmental reactions may be introduced incrementally.

### Persistence

The world should feel as though it continues to exist between visits.

The user’s accumulated dreams should visibly affect the sky and the atmosphere of the product.

### Absence and return

A returning user should feel that Sheepy or the night sky noticed their absence.

Protected high-value product lines include:

- “This is Sheepy. He tends the place where forgotten dreams go.”
- “Sheepy missed you.”
- “The night sky has been quiet without you.”
- “Sheepy kept your cloud warm.”
- “It has been a while. Did any dreams find you?”
- “My dreams help keep this place alive.”
- “Your dream became a star.”

Treat these as protected product-copy candidates.

Do not casually rewrite, remove, or deploy all of them at once. Their timing and context matter.

“My dreams help keep this place alive” is the central product concept, but determine whether it is spoken by the user, Sheepy, or the interface before placing it in production.

“Sheepy kept your cloud warm” should only be used when the user’s cloud is visually and conceptually established enough to make the line understandable.

## 4. Product testing status

DreamCatcher is not yet validated as a sustainable business, but it has progressed beyond idea validation.

The product now has a functioning mobile-first experience with the core user journey implemented.

The immediate objective is to stabilize the existing product, place it in front of real users, and evaluate behavior rather than only verbal reactions.

The first test should evaluate:

- whether users complete onboarding
- whether users save a first dream
- whether they request and read a Dream Insight
- whether they revisit the Journal
- whether they revisit the Sky
- whether they remember or mention Sheepy
- whether they save another dream on a later day
- whether the changing world gives them a reason to return
- whether users feel any attachment, curiosity, or absence after leaving

The central product question is:

> Will someone record a dream, feel that it changed Sheepy’s world, and return because they care about what happens there?

Primary success signals are repeat usage, user revisits, dream-recording frequency, and eventual paid conversion.

Guardrail metrics include churn, refunds, complaints, notification opt-outs, and account deletion.

Sharing interest and demand for Dream Replay remain useful secondary signals.

Do not delay real-user testing for:

- a complete Sheepy animation system
- multiple character poses
- animated constellations
- a complete Journal redesign
- Dream Replay
- a new product name
- unrelated major features



## 5. Protected working systems

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

## 6. Current branch and workflow

The stable Dream Insights work was developed on:

`dream-insights-v2`

The current frontend redesign branch is:

`dream-ai-redesign`

Future substantial frontend work should continue on this redesign branch (or another dedicated branch), not by rewriting the stable Insights history.

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

## 7. Environment variables and secrets

Secrets must never be printed, exposed, added to prompts, or committed.

Expected environment-variable names (confirm in code / `.env.example` before changing anything):


| Area                 | Names                                                                            |
| -------------------- | -------------------------------------------------------------------------------- |
| Frontend (Vite)      | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`                             |
| Server preferred     | `SUPABASE_URL`, `SUPABASE_ANON_KEY`                                              |
| Server fallbacks     | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` |
| OpenAI (server only) | `OPENAI_API_KEY`                                                                 |


Do not use a Supabase service-role key. Ownership is enforced with the caller’s JWT and RLS.

`.env.local` must remain ignored by Git (see `.gitignore`: `.env*` / `*.local`).

### Known local-development issue

Values may exist in `.env.local` but not automatically be inherited by the Vercel serverless-function process.

When this happens, **do not modify application code to compensate**.

Known temporary PowerShell approach: load the variables into the current terminal process and start `npx vercel dev` from that same terminal.

Do not include secret values in this file or in chat.

## 8. Development commands

From `package.json`:


| Command                     | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| `npm install`               | Install dependencies                          |
| `npm run dev`               | Start the Vite frontend                       |
| `npm run dev:vercel`        | Start via `vercel dev` (script alias)         |
| `npx vercel dev`            | Local frontend + Vercel serverless API routes |
| `npm run build`             | Production Vite build                         |
| `npm run preview`           | Preview the production build                  |
| `git status`                | Check working tree                            |
| `git branch --show-current` | Confirm active branch                         |


Notes:

- `npm run dev` starts the Vite frontend only.
- Use `npx vercel dev` (or `npm run dev:vercel`) when testing `/api/dream-insights` locally.
- The localhost port may change when another port is occupied.
- A different localhost port is not a code regression.



## 9. Known project history and traps

- A previous catch-all SPA rewrite in `vercel.json` caused JavaScript module requests to receive `index.html`. Do not restore such a rewrite without understanding the routing consequences. (There is currently no `vercel.json` in the repo root.)
- `.env.local` previously appeared populated in the editor while its saved disk contents differed. Confirm files are saved before debugging environment problems.
- Missing server-side Supabase or OpenAI variables caused Dream Insights API failures.
- The Dream Insight problem is visual presentation, not data: the insight is correctly stored and linked to its dream, but frontend styling can still make it resemble another journal entry. Redesign work must fix visual hierarchy without changing the dream–insight data relationship.
- The current interface began as a desktop learning project; the mobile-first Sheepy companion direction is the product path forward.
- Long AI output should not be presented as one unstructured wall of text.
- Dream Insight should not look like another saved dream.



## 10. Current confirmed behavior

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

The insight data relationship is correct. Remaining work includes presentation polish so the insight does not resemble another journal entry.

Minor polish issue (not a blocker):

After **Catch Dream** is pressed and the dream is added to the journal, the page may shift upward slightly.

## 11. Frontend redesign rules

For frontend tasks:

- Work mobile first.
- Preserve backend behavior.
- Avoid rewriting the app from scratch.
- Do not replace Supabase or Vercel integrations.
- Do not introduce another framework unless explicitly approved.
- Use accessible touch targets.
- Keep long dreams readable.
- Use progressive disclosure for long insights.
- Make the insight visually attached to its dream; fix visual hierarchy without changing the data relationship.
- Preserve a night-sky identity, but do not preserve outdated desktop layout merely because it exists.
- Sheepy is a core emotional product element, not merely decoration. Preserve Sheepy unless removal is explicitly requested. Changes to Sheepy should strengthen character attachment, positioning stability, visual integration, or emotional meaning without allowing Sheepy to obstruct dream capture or navigation.
- The mobile login screen is already large enough. Do not increase its scale without explicit instruction.
- Sheepy must not overlap text, controls, or navigation.
- Sheepy must not accidentally move with viewport scrolling unless that behavior is explicitly designed.
- Inspect positioning, containing blocks, overflow, image boundaries, and stacking contexts when visual artifacts appear near Sheepy.
- Decorative Sheepy layers should not intercept taps.
- Avoid making Sheepy insignificant merely to solve layout problems.
- The environment should eventually react subtly when a dream becomes a star, but do not introduce broad animation systems during unrelated bug-fix tasks.
- Preserve reduced-motion accessibility when motion is introduced.
- Avoid generic SaaS dashboards.
- Avoid excessive glassmorphism, gradients, tiny text, and random AI sparkle icons.
- Consumer-friendly motion and visual energy are allowed when they support comprehension and engagement.
- Do not add onboarding persistence, subscriptions, full Dream Replay production, streaks, social features, or unrelated functionality unless explicitly requested.



### Journal and Library direction

The Journal currently works but lacks sufficient personality.

Its long-term role is not to resemble a database, generic notes list, or SaaS activity feed.

It should gradually feel like:

- a library of forgotten dreams
- a personal archive
- a place with atmosphere and emotional history
- a collection connected to Sheepy’s world

Do not perform a full Journal redesign during unrelated tasks.

Future improvements may include more distinctive cards, better hierarchy, atmospheric details, stronger dream–insight relationships, and presentation that makes each dream feel preserved rather than merely stored.

Readability, fast scanning, long-dream handling, and mobile performance remain essential.

Stack note: the app is vanilla JS (`src/main.js`, `src/style.css`, `index.html`) on Vite — not React. Keep that stack unless the user explicitly approves a change.

## 12. AI-output guidelines

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

### Insight presentation

Dream Insights are technically functional but their current presentation may feel underwhelming relative to the effort and meaning of generating them.

Future versions should make Insights feel more rewarding and special while preserving clarity and avoiding manipulative spectacle.

Possible later directions include:

- staged reveals
- subtle motion
- constellation metaphors
- clearer visual hierarchy
- a stronger connection between the original dream and its Insight

Do not implement major animated reveal systems unless explicitly requested.

The immediate priority remains making the existing Insight clearly attached to its original dream and visually distinct from another journal entry.

## 13. Working style for this user

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



## 14. Current product priority protection

Unless the user explicitly changes priorities, future agents should follow this order:

1. Fix blocking bugs and broken interactions.
2. Resolve mobile layout and stability issues.
3. Protect authentication, persistence, ownership, and API behavior.
4. Improve polish and clarity.
5. Strengthen emotional attachment through small, intentional changes.
6. Test the existing product with real users.
7. Use feedback and retention behavior to decide larger investments.
8. Add major new features only after the above steps justify them.

Do not confuse activity with progress.

A technically impressive new feature is lower priority than fixing a visible product bug, improving the first-use journey, or learning whether users return.

Do not expand scope from a focused bug fix into a redesign, character system, Journal overhaul, or new product feature.

## 15. Definition of done

For every coding task, report:

- what was investigated
- root cause or design rationale
- files changed
- behavior changed
- behavior deliberately preserved
- tests performed
- remaining risks or follow-up work

Do not claim a task is complete without testing the relevant behavior.



## Product experience principles

DreamCatcher must be evaluated as a consumer product, not only as functioning software.

Future agents should distinguish between:

- technical bugs
- usability problems
- unclear copy
- hidden actions
- weak emotional feedback
- weak AI output
- future product opportunities

Do not silently implement a guessed solution when the issue requires a product decision. Report the problem and proposed options first.

### Copy direction

Copy should sound natural, emotional, clear, and alive—not passive or mechanical.

Reference example:

Unnatural:

> “When a dream is remembered a new star appears.”

Preferred:

> “Each dream you save brings a new star to Sheepy’s sky.”

### Insight standard

Dream Insight is one of the product’s most important features.

Core rule:

> Sheepy should notice something, not merely repeat something.

Insights should prioritize emotional tension, meaningful patterns, contextual symbols, cautious waking-life connections, and specific reflection questions.

Avoid generic summaries, dream-dictionary claims, diagnoses, and essay-like output.

### UX review standard

When reviewing the product, agents should test it as first-time users and report:

- whether the next action is clear
- whether important functionality is hidden
- whether labels accurately describe the current state
- whether emotional feedback matches the action
- whether Sheepy adds meaning
- whether the Insight adds genuinely new value
- where a reasonable user could become confused

