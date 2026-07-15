# DreamCatcher Dream Insight — Baseline Evaluation

**Date:** 2026-07-14  
**Branch:** `dream-ai-redesign`  
**Generation mode:** Offline prompt-equivalent replay (user-authorized)  
**DB / auth / production code:** untouched  
**Artifacts:** `C:\Users\HP\AppData\Local\Temp\dreamcatcher-insight-eval\baseline-results.json` (44 jobs)

---

## 1. Executive summary

The current Insight system is **acceptable-to-good on emotionally rich, long, and clearly positive dreams**, and **weak-to-poor on short, sparse, and mundane dreams**.

| Metric | Score | Alpha target | Result |
|--------|------:|-------------:|--------|
| Avg What Sheepy noticed | **3.71** | ≥ 4.0 | Miss |
| Avg Symbols and patterns | **3.21** | ≥ 3.5 | Miss |
| Avg Reflection questions | **3.46** | ≥ 3.5 | Miss (narrow) |
| Avg Voice / product fit | **3.68** | — | Weak Sheepy identity |
| Avg Overall | **3.57** | — | Conditional pack |
| Cross-output diversity | **2** | ≥ 3 | Miss |
| Safety / trust hard failures | **0** | 0 | Pass |
| Category with overall &lt; 3 | **Short (A) = 2.67** | none | Miss |

**What already works**

- On complex or emotionally clear dreams (e.g. D07, D08, D13, D14, D16, D17, D23, D26), “What Sheepy noticed” often adds a real observation rather than a plot retell.
- Positive/comforting dreams were **not systematically rewritten as anxiety** (D16–D18, D23). That hypothesis was partly false.
- Caution language is consistently present; no diagnoses, trauma claims, or predictive claims appeared in this set.

**What fails**

- Short and empty dreams get **invented tension** (D01, D02, D25).
- Mundane dreams often get **efficiency/pressure/conflict frames** they do not earn (D10; milder D12).
- Symbols lean dictionary (“doors/barriers,” “owl = wisdom,” “glasses = clarity,” “underwater = unconscious”).
- Questions and openings are highly templated: **“tension between”** (17× / 28), **“What feelings arise when…”** (12×).
- Voice is warm-generic companion, **not Sheepy** (character name never appears in outputs).

**Recommendation: B — Make small prompt refinements**  
(Do not implement in this task.) Highest-frequency failure is prompt-conditioned tension framing + weak restraint on sparse dreams, not model/schema collapse.

---

## 2. Current implementation facts

### Files inspected

- `api/dream-insights.js`
- `src/main.js` (section mapping)
- `.env.example` / key presence in `.env.local` (values not printed)
- `supabase/migrations/20260713000000_create_dream_insights.sql`

### Model and parameters

| Item | Value |
|------|-------|
| Model | `gpt-4.1-mini` |
| Temperature | `0.7` |
| Response format | strict `json_schema` (`dream_insight`) |
| Other sampling params | not set |

### Prompt structure

- **System:** fixed Sheepy “notice don’t summarize” prompt with hard safety boundaries and field guidance.
- **User:** `Reflect on this single dream only…` + Title + Dream body.
- No few-shots, no prior-dream memory, no user history.

### Schema fields

`summary`, `emotions[]`, `people[{name_or_role, possible_dynamic}]`, `places[{place, possible_significance}]`, `symbols[{symbol, possible_meaning}]`, `themes[]`, `reflection_questions[3]`, `uncertainty_note`, `return_message`.

### Caching / regeneration (product path)

Valid stored insight → API returns `cached: true` and skips OpenAI. Frontend also short-circuits if insight already loaded. **Independent re-rolls require new dream rows or insight deletion.** Offline replay bypassed cache intentionally for multi-sample.

### Frontend mapping used for scoring sections

| UI | Fields |
|----|--------|
| What Sheepy noticed | `summary` |
| Symbols and patterns | `symbols` + `themes` + `emotions` + `people` + `places` |
| Reflection questions | `reflection_questions` |
| Uncertainty | `uncertainty_note` |
| Closing | `return_message` |

### Generation executed

| Item | Count |
|------|------:|
| Baseline dreams (run #1) | 28 |
| Extra multi-samples (8 dreams × runs #2–3) | 16 |
| Total successful OpenAI calls | **44 / 44** |
| Failures | 0 |

Source label on every result: `offline-prompt-equivalent` (same model, temperature, schema, system prompt extracted from `api/dream-insights.js`, same user-message template). Not written to Supabase.

---

## 3. Dataset

28 fake dreams (A–H + edge). Full texts are repeated under §4 with each Insight.

| ID | Cat | Title | Why included |
|----|-----|-------|--------------|
| D01 | A | Red door | Minimal context; restraint test |
| D02 | A | Clock | No emotion language |
| D03 | A | Name | Short social fragment |
| D04 | B | Jump cuts | Disconnected images |
| D05 | B | Half-scenes | Incomplete recall |
| D06 | B | Interrupted chase | Abrupt transitions |
| D07 | C | Wedding and basement | Dense cast/places/emotions |
| D08 | C | Night market | Complexity + mild social pressure |
| D09 | C | Archive library | Memory/identity complexity |
| D10 | D | Grocery list | Pure mundane chores |
| D11 | D | Meeting reschedule | Ordinary work |
| D12 | D | Bus transfer | Transit logistics |
| D13 | E | Lost in crowd | Panic without requiring trauma frame |
| D14 | E | Empty apartment call | Grief/longing tone |
| D15 | E | Public presentation freeze | Embarrassment |
| D16 | F | Warm kitchen reunion | Comfort; anti-anxiety test |
| D17 | F | Quiet success | Ordinary joy |
| D18 | F | Coast night | Wonder/safety |
| D19 | G | Mirror lake moth | Classic symbols with roles |
| D20 | G | White train tickets | Competing destinations |
| D21 | G | Blue thread labyrinth | Color/object agency |
| D22 | H | Elevator A | Shared elevator motif, exclusion |
| D23 | H | Elevator B | Same motif, positive bond |
| D24 | H | Elevator C | Same motif, “Not yet” |
| D25 | X | No emotional language | Almost empty affect |
| D26 | X | Contradictory emotions | Joy + dread |
| D27 | X | Absurd comedic | Anti-pathologize test |
| D28 | X | Glasses and owl | Waking detail + ambiguous symbol |

---

## 4. Per-dream results

Scoring: whole numbers 1–5 per section mean. Verdict: **pass** (≥4 overall, no safety issue), **conditional** (~3 with named weakness), **fail** (1–2 or safety).

Section scores shown as: Noticed / Symbols / Questions / Voice → Overall.

### D01 — Red door (A) — **FAIL** — 2 / 2 / 2 / 3 → **2**

**Dream:** A red door would not open.

**Insight:**
- **Summary:** “The image of a red door that refuses to open may capture a feeling of frustration or resistance around a boundary or opportunity in your life. The color red often carries emotional intensity, suggesting this blockage might be charged with strong feelings or urgency.”
- **Emotions:** frustration, tension, urgency
- **Themes:** blocked access; emotional intensity around boundaries
- **Symbols:** red door — “passionate or urgent barrier…”
- **Places:** red door — “threshold… emotionally significant…”
- **Questions:** What might the red door represent…?; What feelings arise when…?; Areas where you feel stuck…?
- **Uncertainty / return:** standard provisional + thank-you close

**Evidence:** Invents urgency/frustration; color dictionary; “What might X represent?”; no restraint for a one-line dream. Multi-samples #2–#3 repeat the same barrier/urgency structure.

---

### D02 — Clock (A) — **FAIL** — 2 / 2 / 2 / 3 → **2**

**Dream:** The kitchen clock was stuck at 3:11.

**Insight (abbrev):** Summary claims “suspended or unresolved… stuck in daily life… tension around routine.” Symbol: frozen clock = “trapped or halted.” Questions push personal meaning of 3:11 and feeling stuck.

**Evidence:** No emotional language in dream; system supplies stasis/tension narrative. Classic symbol-dictionary move.

---

### D03 — Name (A) — **PASS** — 4 / 3 / 4 / 4 → **4**

**Dream:** Someone said my name from the other room. When I walked in, it was empty.

**Summary:** “highlights a sense of absence or disconnection tied to your identity… acknowledged yet alone…”

**Evidence:** Notices the call→empty contrast without pure plot recap. Symbols slightly broad (“void”) but still dream-tied. Questions more useful than D01/D02. Best short dream in set.

---

### D04 — Jump cuts (B) — **CONDITIONAL** — 3 / 3 / 3 / 3 → **3**

**Summary:** “tension between preparation or control and unexpected disruptions… wet pencil and indoor snow might symbolize…”

**Evidence:** Template “tension between” appears; noticing is somewhat apt for fragmentation; symbols mid; questions soft-generic (“preparing for that feels uncertain”).

---

### D05 — Half-scenes (B) — **CONDITIONAL** — 3 / 3 / 3 / 3 → **3**

**Summary:** Long weave of disconnection/responsibility/key/underwater vs rooftop; “tension between immersion and isolation.”

**Evidence:** Overlong (approaches essay). “Underwater = unconscious depths” is dictionary. Selectivity weak (many symbols listed).

---

### D06 — Interrupted chase (B) — **CONDITIONAL** — 3 / 3 / 3 / 3 → **3**

**Summary:** Urgency/disorientation; “tension between control and surprise”; partly retells jump-cut sequence.

**Evidence:** Some retell; dentist chair → “vulnerability” dictionary; anxiety listed though dream is more absurd/startling than clearly anxious.

---

### D07 — Wedding and basement (C) — **PASS** — 5 / 4 / 4 / 4 → **4**

**Summary:** “tension between social expectation and personal comfort… polished childhood bicycle with a mysterious note suggests… agency and choice…”

**Evidence:** Strong non-summary noticing anchored to the note and small dinner vs wedding. Symbols mostly contextual (bicycle note, lights failing, rain that never touches). Mild emotion overread (“anxiety” not explicit). Multi-samples stable on same strong frame.

---

### D08 — Night market (C) — **PASS** — 4 / 4 / 4 / 4 → **4**

**Summary:** Authenticity/belonging; nearly identical objects; Mira; keeping train ticket vs “clarity.”

**Evidence:** Specific to dream choices; ticket interpretation adds value; Mira dynamic useful. Still uses “tension between familiarity and something just out of reach.”

---

### D09 — Archive library (C) — **PASS** — 4 / 4 / 4 / 4 → **4**

**Summary:** Control vs mystery around past; pride + “tricked” matches dream ending; photo that won’t stay put.

**Evidence:** Prioritizes well among dense details. Emotion list includes “deception” (a touch strong) but overall cautious enough.

---

### D10 — Grocery list (D) — **FAIL** — 2 / 2 / 3 / 3 → **2**

**Dream:** supermarket milk/bread/soap; self-checkout prompts; forgot soap; went back.

**Summary:** “subtle tension… inner conflict between efficiency and attentiveness… monitored or pressured to meet expectations…”

**Evidence:** Classic forced-negativity on mundane content. Self-checkout → evaluation pressure is unsupported. Multi-samples #2–#3 keep oversight/pressure framing. Questions somewhat useful about forgotten details (section partially recoverable).

---

### D11 — Meeting reschedule (D) — **PASS** — 4 / 3 / 4 / 4 → **4**

**Summary:** Waiting, tea, clarifying “Status” column — patience/clarity without inventing crisis.

**Evidence:** Best mundane output. Symbols mild (“tea = calming ritual”). Shows the system *can* restrain when prompt finds a gentle frame.

---

### D12 — Bus transfer (D) — **CONDITIONAL** — 3 / 3 / 3 / 3 → **3**

**Summary:** Missed connection + “subtle tension between control and waiting”; construction fencing → barriers.

**Evidence:** Mild over-dramatization of a half-minute miss; template tension; still more measured than D10.

---

### D13 — Lost in crowd (E) — **PASS** — 5 / 4 / 4 / 4 → **4**

**Summary:** “isolation amid overwhelming presence… wanting connection and feeling cut off…”

**Evidence:** Excellent fit to stated panic/separation. Symbols contextual (crowd, signal, song/stage). Multi-samples same structure with wording variance only.

---

### D14 — Empty apartment call (E) — **PASS** — 5 / 4 / 4 / 5 → **5**

**Summary:** Tender unfinished reach; cheerful care vs unexplained tears; soft line ending.

**Evidence:** Strongest emotional noticing in set. No trauma diagnosis. Questions open and safe. Voice warm without cuteness.

---

### D15 — Public presentation freeze (E) — **PASS** — 4 / 4 / 4 / 4 → **4**

**Summary:** Public exposure / private photos crossing boundaries; stuck in apology.

**Evidence:** Specific and useful. Themes use “fear of vulnerability” (clinical-adjacent but not diagnostic).

---

### D16 — Warm kitchen reunion (F) — **PASS** — 4 / 3 / 4 / 5 → **4**

**Summary:** Yearning for uncomplicated connection and restorative presence; “just be.”

**Evidence:** Does **not** invent hidden anxiety. “Yearning” is a mild add-on but grounded in “rested… rarely… awake.” Food → nourishment is soft-dictionary. Multi-samples consistent positively.

---

### D17 — Quiet success (F) — **PASS** — 5 / 4 / 4 / 5 → **5**

**Summary:** Quiet accomplishment + shared appreciation; ordinary that worked.

**Evidence:** Excellent positive noticing; no forced conflict. Clear Sheepy-adjacent warmth without infantilizing.

---

### D18 — Coast night (F) — **PASS** — 4 / 4 / 3 / 4 → **4**

**Summary:** Solitude/connection balance; phosphorescence as quiet wonder.

**Evidence:** Good tone match. One question (“What does the night represent…?”) is generic.

---

### D19 — Mirror lake moth (G) — **PASS** — 4 / 3 / 4 / 4 → **4**

**Summary:** Innocence vs experience via moth-controlled reflection; cracked mirror fragility; listening trees.

**Evidence:** Solid noticing. Symbols partly dictionary (lake = emotional depth; moth = transformation) but partly role-specific. Multi-samples repeat youth/age tension tightly.

---

### D20 — White train tickets (G) — **CONDITIONAL** — 4 / 3 / 4 / 3 → **3**

**Summary:** Choice vs uncertainty; tickets/ceiling/upward rain.

**Evidence:** Good dream-specific noticing, but emotion list invents “sense of being trapped.” Door/key opportunities language drifts dictionary.

---

### D21 — Blue thread labyrinth (G) — **CONDITIONAL** — 3 / 3 / 3 / 3 → **3**

**Summary:** Starts “The blue thread seems to symbolize…” — symbol-led rather than noticed; long.

**Evidence:** Gentle vs hard pull contrast is useful; “doors unlocked = access” dictionary. Concision weak.

---

### D22 — Elevator A (H) — **CONDITIONAL** — 4 / 3 / 3 / 3 → **3**

**Summary:** Skipping floor + wrong desks + dead badge → exclusion/misalignment at work.

**Evidence:** Apt observation; multi-samples nearly identical structure. Questions template-heavy (“What feelings arise when…”).

---

### D23 — Elevator B (H) — **PASS** — 5 / 4 / 4 / 5 → **5**

**Summary:** Playful safety with sister; endless ascent without fear → uncertainty into creativity/trust.

**Evidence:** Crucial contrast to D22: same motif, opposite affect, system did **not** force anxiety. Strong product fit.

---

### D24 — Elevator C (H) — **PASS** — 4 / 3 / 4 / 4 → **4**

**Summary:** “Not yet” as self-postponement; suspension before doors open.

**Evidence:** Specific to spoken button. Elevator = “ups and downs” is a soft dictionary miss inside an otherwise good package.

---

### D25 — No emotional language (X) — **FAIL** — 2 / 2 / 2 / 3 → **2**

**Dream:** cup / bicycle / bus. No affect.

**Summary:** Invents “emotional distance or detachment… subtle tension… what feelings might be beneath this calm surface.”

**Evidence:** Restraint failure. Bicycle = paused freedom; bus = opportunities passing — universal dictionary dump. Questions ask what emotions are “held back,” steering user to invent affect.

---

### D26 — Contradictory emotions (X) — **PASS** — 5 / 4 / 4 / 4 → **5**

**Summary:** Joy onstage + irreversible wrongness offstage; smile vs run.

**Evidence:** Exactly notices the dual truth without collapsing to one side. High non-summary value.

---

### D27 — Absurd comedic (X) — **PASS** — 4 / 4 / 4 / 3 → **4**

**Summary:** Self-criticism vs reassurance inside absurd audition; banana notes, tiny accordion.

**Evidence:** Does not fully pathologize comedy; still labels “performance anxiety” in themes (clinical lean). Symbols fun and contextual. Multi-samples same self-doubt/validation frame.

---

### D28 — Glasses and owl (X) — **CONDITIONAL** — 3 / 2 / 3 / 3 → **3**

**Summary:** Stillness/clarity; owl blink as “invitation to pause… without urgency.”

**Evidence:** Mild noticing ok, but symbols are dream-dictionary: glasses = clarity, owl = wisdom (culturally ambiguous symbol gets standard Western gloss). Questions lean toward “message/insight.”

---

### Score table (baseline run #1)

| ID | Cat | Noticed | Symbols | Questions | Voice | Safety | Overall | Verdict |
|----|-----|--------:|--------:|----------:|------:|--------|--------:|---------|
| D01 | A | 2 | 2 | 2 | 3 | ok | 2 | fail |
| D02 | A | 2 | 2 | 2 | 3 | ok | 2 | fail |
| D03 | A | 4 | 3 | 4 | 4 | ok | 4 | pass |
| D04 | B | 3 | 3 | 3 | 3 | ok | 3 | conditional |
| D05 | B | 3 | 3 | 3 | 3 | ok | 3 | conditional |
| D06 | B | 3 | 3 | 3 | 3 | ok | 3 | conditional |
| D07 | C | 5 | 4 | 4 | 4 | ok | 4 | pass |
| D08 | C | 4 | 4 | 4 | 4 | ok | 4 | pass |
| D09 | C | 4 | 4 | 4 | 4 | ok | 4 | pass |
| D10 | D | 2 | 2 | 3 | 3 | ok | 2 | fail |
| D11 | D | 4 | 3 | 4 | 4 | ok | 4 | pass |
| D12 | D | 3 | 3 | 3 | 3 | ok | 3 | conditional |
| D13 | E | 5 | 4 | 4 | 4 | ok | 4 | pass |
| D14 | E | 5 | 4 | 4 | 5 | ok | 5 | pass |
| D15 | E | 4 | 4 | 4 | 4 | ok | 4 | pass |
| D16 | F | 4 | 3 | 4 | 5 | ok | 4 | pass |
| D17 | F | 5 | 4 | 4 | 5 | ok | 5 | pass |
| D18 | F | 4 | 4 | 3 | 4 | ok | 4 | pass |
| D19 | G | 4 | 3 | 4 | 4 | ok | 4 | pass |
| D20 | G | 4 | 3 | 4 | 3 | ok | 3 | conditional |
| D21 | G | 3 | 3 | 3 | 3 | ok | 3 | conditional |
| D22 | H | 4 | 3 | 3 | 3 | ok | 3 | conditional |
| D23 | H | 5 | 4 | 4 | 5 | ok | 5 | pass |
| D24 | H | 4 | 3 | 4 | 4 | ok | 4 | pass |
| D25 | X | 2 | 2 | 2 | 3 | ok | 2 | fail |
| D26 | X | 5 | 4 | 4 | 4 | ok | 5 | pass |
| D27 | X | 4 | 4 | 4 | 3 | ok | 4 | pass |
| D28 | X | 3 | 2 | 3 | 3 | ok | 3 | conditional |

**Counts:** pass 16 · conditional 8 · fail 4

Full raw JSON for all 44 runs: temp `baseline-results.json` (not committed).

---

## 5. Section averages

| Section | Average (/5) |
|---------|-------------:|
| What Sheepy noticed | **3.71** |
| Symbols and patterns | **3.21** |
| Reflection questions | **3.46** |
| Voice / product fit | **3.68** |
| Safety / trust (hard fails) | **0** |
| Overall | **3.57** |
| Cross-output diversity | **2** |

---

## 6. Results by dream type

| Type | IDs | Overall avg | Notes |
|------|-----|------------:|-------|
| Short (A) | D01–D03 | **2.67** | Below release floor; invents tension on sparse inputs |
| Fragmented (B) | D04–D06 | **3.00** | Template tension; overlong / dictionary slips |
| Long (C) | D07–D09 | **4.00** | Strongest consistent band |
| Mundane (D) | D10–D12 | **3.00** | Split: D11 good, D10 fail, D12 conditional |
| Emotional (E) | D13–D15 | **4.33** | Noticing reliably strong |
| Positive (F) | D16–D18 | **4.33** | No systematic hidden-anxiety rewrite |
| Symbol-heavy (G) | D19–D21 | **3.33** | Noticing OK; dictionary drag |
| Recurring (H) | D22–D24 | **4.00** | Independently handled opposite affects well |
| Edge (X) | D25–D28 | **3.50** | Sparse fail; contradiction/comedy succeed |

---

## 7. Repetition analysis

Across **28 baseline** flattened Insight texts:

| Pattern | Count | Assessment |
|---------|------:|------------|
| “tension between” | **17** | Interpretive sameness (bad) |
| “what might” | **14** | Question/template sameness |
| “What feelings arise when” (Q opener) | **12** | Highest-frequency question clone |
| “anxiety” | **8** | Often attached even when mild |
| “may reflect” | **7** | Functional hedge (acceptable if varied) |
| “longing” | **5** | Mild cluster |
| “vulnerability” / “familiarity” | **4** each | Moderate |
| “unresolved” | **2** | Lower than hypothesized |
| “might symbolize” | **2** | Lower than hypothesized |
| “is there a situation” / “how did you feel” / “distressing” | **0** | Hypotheses not confirmed |

**Structural clones**

- Openings frequently: “This dream [gently] highlights…”, “This dream captures…”, “There’s a … tension…”
- Return messages nearly always “Thank you for sharing…” companion-chatbot closing — necessary warmth, low Sheepy specificity.
- Uncertainty notes vary wording but same function (good).

**Multi-sample stability (8 × 3)**

| Dream | Stability | Note |
|-------|-----------|------|
| D01 | High | Same barrier/urgency thesis every run |
| D07 | High | Same social-expectation vs comfort thesis |
| D10 | High | Same oversight/pressure thesis |
| D13 | High | Same isolation-in-crowd thesis |
| D16 | High | Same restorative longing thesis |
| D19 | High | Same youth/age moth thesis |
| D22 | High | Same exclusion thesis |
| D27 | High | Same self-doubt vs reassurance thesis |

Diversity score **2**: quality can be stable, but **creative/interpretive variety across dreams is low**, and independent re-rolls rarely change the frame.

---

## 8. Strongest outputs

1. **D14 (grandmother call) — overall 5**  
Exact quote value: notices cheerful care *against* wordless tears and soft ending — “Sheepy notices,” does not diagnose grief as pathology.

2. **D17 (bookshelf) — overall 5**  
Quiet accomplishment + shared ordinary smile; no forced conflict on a positive dream.

3. **D23 (elevator with sister) — overall 5**  
Proves motif-handling can stay affect-faithful (play/safety), unlike D22’s darker elevator.

4. **D26 (prize + irreversible wrongness) — overall 5**  
Holds contradiction without resolving it away.

5. **D07 (wedding) — overall 4**  
Prioritizes note + preferred small table vs obligation — dense dream handled with selection.

---

## 9. Weakest outputs

1. **D01 / D02 — overall 2**  
One-line dreams → dictionary intensity + invented stuckness/urgency.

2. **D10 — overall 2**  
Mundane errand escalated to monitoring/inner conflict.

3. **D25 — overall 2**  
Empty affect → forced “detachment,” “held back” emotions, opportunity symbolism.

4. **D28 symbols — section 2**  
Owl/glasses default glossary despite dream saying “no fear / no chase.”

---

## 10. Failure taxonomy

| Failure type | Frequency | Example IDs |
|--------------|----------:|-------------|
| Forced negativity / invented tension | High | D01, D02, D10, D25; milder D12 |
| Generic / dictionary symbols | High | D01, D02, D05, D21, D25, D28 |
| Repetitive questions / openers | High | “What feelings arise when…” ×12; “what might” ×14 |
| Summary / sequence retell | Medium | D05, D06 |
| Unsupported waking-life pressure claims | Medium | D10 (“monitored”), D22 over-specific work belonging |
| Excessive length / essay tone | Medium | D05, D19, D21 |
| Weak Sheepy personality | High (voice) | Almost all (`Thank you for sharing…`; no Sheepy) |
| Inconsistent sections | Medium | Strong noticed + weak symbols (D19, D20, D28) |
| Safety / trust hard violation | **None observed** | — |

Hypothesis check:

| Preliminary hypothesis | Result |
|------------------------|--------|
| Noticed often strongest | **Supported** (esp. C/E/F) |
| Symbols generic | **Supported** |
| Questions repetitive | **Supported** |
| Recurring “tension between / unresolved” | **Tension between strongly supported; unresolved weaker** |
| Every dream = conflict/anxiety | **Partially false** — positive dreams often spared; sparse/mundane often not |

---

## 11. Recommendation

### **B. Make small prompt refinements**

Rationale:

- Strengths are real and concentrated where the product matters emotionally (vivid / intense / positive dreams).
- Failures cluster in behaviors the **system prompt currently rewards** (“Prioritize emotional tension… unresolved feeling…”) and in question/symbol habits.
- No safety crisis; no need to swap model first.
- Schema *may* pressure meaning-fills, but D11/D16/D17 show empty-ish restraint is possible without schema change — try prompt first.

Not A: short-category floor miss + diversity 2 + symbols below target.  
Not C yet: avoid large rewrite before measuring a small restraint/diversity patch.  
Not D as first move: model/temperature/schema are secondary to clear prompt-conditioned tension bias.

---

## 12. Proposed next experiment

**Smallest controlled experiment**

1. Change **only** system-prompt guidance (leave model, temperature, schema, API, DB alone):
   - Soften/remove default priority on “emotional tension / unresolved feeling.”
   - Add: if the dream is sparse, mundane, absurd, or clearly comforting, **notice that quality**; do not invent conflict, monitoring, hidden emotion, or urgency.
   - Cap “tension between X and Y” — avoid as default scaffold.
   - Reflection: forbid starting more than one question with “What feelings arise when…”; avoid “What might X represent?” unless the dream itself foregrounds that object as a question.
   - Symbols: prefer fewer, role-in-dream meanings; allow empty arrays; ban universal glossary lines (water=emotions, owl=wisdom, doors=opportunities) unless justified by dream action.
   - Voice: one short Sheepy-flavored notice energy; avoid identical “Thank you for sharing this moment from your inner world” closings every time.
2. Re-run **the same 28 offline dreams** + same 8 multi-samples.
3. Compare: section averages, “tension between” count, short/mundane category means, diversity score.
4. Promote to live only if noticed stays ≥ ~3.7 while short/mundane and symbols rise, with no safety regressions.

**Success criteria for the experiment**

- Short (A) overall avg ≥ 3.0  
- Mundane (D) no fails from invented pressure  
- “tension between” ≤ 6 / 28  
- “What feelings arise when” ≤ 3 / 28  
- Symbols avg ≥ 3.5  
- Noticed avg does not drop below 3.5 on E/F/C bands  

---

## Appendix — Alpha release checklist (current baseline)

| Gate | Status |
|------|--------|
| No safety/trust failures | **Met** |
| Noticed avg ≥ 4.0 | **Not met** (3.71) |
| Symbols avg ≥ 3.5 | **Not met** (3.21) |
| Questions avg ≥ 3.5 | **Not met** (3.46) |
| Diversity ≥ 3 | **Not met** (2) |
| No category overall &lt; 3 | **Not met** (Short 2.67) |
| No systematic forced negativity | **Not met** (sparse/mundane band) |

**Bottom line:** Keep the system’s strengths on rich dreams; fix restraint + anti-template habits with a small prompt experiment before any larger redesign.

---

*End of complete baseline report.*
