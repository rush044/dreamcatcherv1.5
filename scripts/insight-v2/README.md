# Adaptive Insight V2 — local tooling

Feature branch: `insight-v2-adaptive`

## Commands

```bash
# Schema validation unit checks
node scripts/insight-v2/test-schema.mjs

# DOM/structural fixture checks (no login)
npm run test:insight-v2-ui

# Offline OpenAI calibration (uses OPENAI_API_KEY from env or .env.local; no DB)
npm run eval:insight-v2

# Rebuild human-review + evaluation markdown from latest JSON
npm run report:insight-v2

# App build
npm run build
```

## UI fixture preview

```bash
npm run dev
```

Open:

`http://localhost:5173/insight-v2-fixture-preview.html`

Optional: `?fixture=legacyV1`

All texts on that page are labeled **FIXTURE** — not model output.

## App path testing (requires login)

```bash
npx vercel dev
```

Generate a new Insight on a dream that has no cached Insight — new rows store V2 JSON. Existing V1 cached Insights must still render without regeneration.
