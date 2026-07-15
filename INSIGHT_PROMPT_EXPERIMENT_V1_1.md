# DreamCatcher Insight Prompt Experiment — V1.1

**Date:** 2026-07-14  
**Mode:** Offline prompt-only A/B (same model / temp / schema / dataset as baseline + V1)  
**Production / DB / API / commit / deploy:** untouched  

**Artifacts (temp):**
- Results: `C:\Users\HP\AppData\Local\Temp\dreamcatcher-insight-eval\experiment-v1_1-results.json`
- Prompt: `...\proposed-system-prompt-v1_1.txt`
- Prior: `INSIGHT_PROMPT_EXPERIMENT_V1.md`, `INSIGHT_BASELINE_EVALUATION.md`

---

## 1. Verdict

**Recommend deploying V1.1.**

V1 fixed restraint/symbols but cloned every summary opener. V1.1 keeps those gains, kills the opener clone, zeros the “What feelings arise when…” habit, and makes Sheepy’s voice actually appear — without regressing rich dreams.

| Metric | Baseline | V1 | **V1.1** |
|--------|---------:|---:|---------:|
| Noticed | 3.71 | 4.11 | **4.18** |
| Symbols | 3.21 | 3.50 | **3.57** |
| Questions | 3.46 | 3.68 | **3.71** |
| Voice | 3.68 | 4.07 | **4.21** |
| Overall | 3.57 | 3.93 | **4.04** |
| Diversity | 2 | 3 | **4** |
| Safety hard fails | 0 | 0 | **0** |
| Fail dreams (overall ≤2) | 4 | 0 | **0** |

Residual risks are mild (D01/D10 still slightly overread; some “what might” questions; Sheepy in every return). They do not outweigh the measured gains.

---

## 2. What changed from V1 → V1.1

| Fix | Change |
|-----|--------|
| Opener clone | Removed “One thing that stands out…” examples; forbid stock openers; require varied openings |
| Questions | At most one feelings question; ban “What feelings arise when…” openers; require three different structures |
| Sparse emotions | Empty `emotions` default when affect is unnamed/unclear |
| Rich-dream over-hedge | Don’t say “not enough detail” on clearly rich dreams |
| Identity | Allow natural Sheepy naming; don’t force “dream-light” into every closing |

Unchanged controls: model `gpt-4.1-mini`, temperature `0.7`, schema, user template, dataset (28 + 16 multi-samples = 44).

---

## 3. Proposed system prompt (V1.1)

Full text lives in temp `proposed-system-prompt-v1_1.txt` and in the offline runner. Core identity + restraint stack from V1 preserved; anti-template sections added (see §2).

To promote later: replace only `SYSTEM_PROMPT` in `api/dream-insights.js` with this text. Do not change model, temperature, schema, validation, frontend, or DB.

---

## 4. Pattern comparison (28 run-#1 outputs)

| Pattern | Baseline | V1 | V1.1 |
|---------|----------:|---:|-----:|
| “One thing that stands out” | 0 | **28** | **0** |
| Unique summary openers (first 4 words) | — | 1 | **28 / 28** |
| “tension between” | 17 | 6 | **4** |
| “What feelings arise when” | 12 | 9 | **0** |
| “anxiety” | 8 | 1 | **0** |
| “Thank you for sharing” | 28 | 24 | **4** |
| “dream-light” | 0 | 28 | **8** |
| “Sheepy” mentions | 0 | 0 | **40** (12 summaries, 28 returns) |
| “what might” (all text) | 14 | 11 | 10 |

V1.1 re-eval targets from the V1 report — all met:

| Target | Result |
|--------|--------|
| “One thing that stands out” ≤ 4/28 | **0** |
| “What feelings arise when” ≤ 3/28 | **0** |
| Short (A) overall ≥ 3.3 | **3.67** |
| Symbols ≥ 3.5 | **3.57** |
| Rich bands non-regressing | **Yes** |

---

## 5. Category overall averages

| Category | Baseline | V1 | V1.1 |
|----------|---------:|---:|-----:|
| Short (A) | 2.67 | 3.33 | **3.67** |
| Fragmented (B) | 3.00 | 3.67 | **4.00** |
| Long (C) | 4.00 | 4.00 | **4.00** |
| Mundane (D) | 3.00 | 3.33 | **3.67** |
| Emotional (E) | 4.33 | 4.33 | **4.33** |
| Positive (F) | 4.33 | 4.33 | **4.33** |
| Symbol-heavy (G) | 3.33 | 4.00 | **4.00** |
| Recurring (H) | 4.00 | 4.33 | **4.33** |
| Edge (X) | 3.50 | 4.00 | **4.00** |

Noticed on rich bands (C/E/F): stable or slightly up vs baseline. No regression.

---

## 6. Per-dream V1.1 scores

N / S / Q / V → Overall. Baseline overall shown for comparison.

| ID | Cat | Base O | V1 O | V1.1 N/S/Q/V | V1.1 O | Notes |
|----|-----|-------:|-----:|--------------|-------:|-------|
| D01 | A | 2 | 3 | 3/3/3/4 | **3** | Still invents frustration; better uncertainty |
| D02 | A | 2 | 3 | 4/3/3/4 | **4** | Empty emotions; stillness without stuck narrative |
| D03 | A | 4 | 4 | 4/3/3/4 | **4** | Sheepy notice of presence/absence |
| D04 | B | 3 | 4 | 4/4/3/4 | **4** | Empty emotions; fragmented noticing |
| D05 | B | 3 | 3 | 4/3/4/4 | **4** | Milder than before; key still soft-access |
| D06 | B | 3 | 4 | 4/4/3/4 | **4** | Juxtaposition without dentist=vulnerability |
| D07 | C | 4 | 4 | 5/4/4/4 | **4** | Strength preserved |
| D08 | C | 4 | 4 | 4/4/4/4 | **4** | Strength preserved |
| D09 | C | 4 | 4 | 4/4/4/4 | **4** | Strength preserved |
| D10 | D | 2 | 3 | 3/3/4/4 | **3** | No monitoring frame; mild friction remains |
| D11 | D | 4 | 4 | 4/3/4/4 | **4** | Calm mundane preserved |
| D12 | D | 3 | 3 | 4/3/3/4 | **4** | Quieter than baseline stress-up |
| D13 | E | 4 | 4 | 5/4/4/4 | **4** | Panic faithfulness preserved |
| D14 | E | 5 | 5 | 5/4/4/5 | **5** | Tender dual notice preserved |
| D15 | E | 4 | 4 | 4/4/4/4 | **4** | Varied concrete questions |
| D16 | F | 4 | 4 | 5/3/4/5 | **4** | Positive preserved |
| D17 | F | 5 | 5 | 5/4/4/5 | **5** | Quiet success preserved |
| D18 | F | 4 | 4 | 4/4/4/5 | **4** | Strong voice |
| D19 | G | 4 | 4 | 4/4/4/4 | **4** | Contextual moth/mirror |
| D20 | G | 3 | 4 | 4/3/3/4 | **4** | Reversals noticed; soft opportunity language remains |
| D21 | G | 3 | 4 | 4/4/4/4 | **4** | Gentle vs hard pull |
| D22 | H | 3 | 4 | 4/3/4/4 | **4** | Misalignment without template stack |
| D23 | H | 5 | 5 | 5/4/4/5 | **5** | Playful elevator preserved |
| D24 | H | 4 | 4 | 4/3/3/4 | **4** | “Not yet” held |
| D25 | X | 2 | 3 | 4/4/4/5 | **4** | Empty emotions; stillness vs motion |
| D26 | X | 5 | 5 | 5/4/4/4 | **5** | Contradiction held |
| D27 | X | 4 | 4 | 4/4/4/4 | **4** | Absurdity not pathologized |
| D28 | X | 3 | 4 | 4/3/4/4 | **4** | Owl improved; glasses≈clarity mild slip |

**Counts:** pass 25 · conditional 3 (D01, D10, — wait D01 and D10 are overall 3) · fail 0  
Conditionals: D01, D10 (overall 3). All others ≥4.

---

## 7. Side-by-side highlights

### Opener diversity (the V1 failure)

**V1:** 28/28 began “One thing that stands out…”  
**V1.1:** 28 unique first-four-word openers (examples):

- D02: “The frozen moment of…”
- D03: “Sheepy notices a striking…”
- D13: “The tightening crowd and…”
- D25: “The stillness of the paper…”
- D26: “The vivid coexistence of…”

### Sparse dreams

| ID | Baseline | V1.1 |
|----|----------|------|
| D02 | Invented stuck/tension | Empty emotions; quiet stillness |
| D25 | Invented detachment / “held back” feelings | Empty emotions; stillness vs motion |
| D01 | Urgency/frustration cascade | Still invents frustration, but marks brevity; overall 2→3 |

### Sheepy identity

Baseline/V1: name never appeared.  
V1.1: Sheepy in **12/28** summaries and **28/28** returns — clearly caretaker-coded, sometimes a bit formulaic in closings (acceptable vs generic chatbot; can soften later if needed).

### Rich dreams

D07, D13–D18, D23, D26 remain strong. Positive dreams not rewritten as anxiety. Contradiction and comfort bands intact.

---

## 8. Success criteria (original experiment)

| Criterion | V1.1 vs baseline |
|-----------|:----------------:|
| Noticed improves OR stable | **Yes** (3.71 → 4.18) |
| Symbols improves | **Yes** (3.21 → 3.57) |
| Reflection improves | **Yes** (3.46 → 3.71) |
| Diversity improves | **Yes** (2 → 4) |
| Safety unchanged | **Yes** (0) |
| Rich/emotional no regression | **Yes** |

---

## 9. Risks if deployed

1. **D01 / D10** can still invent mild frustration on sparse/mundane input.
2. **“what might”** questions still appear (~10) — better than feelings-templates, still somewhat dictionary-adjacent.
3. **Sheepy in every return** may feel repetitive over many Insights (identity win, polish later).
4. **D28** soft-slips “glasses → clarity” despite dictionary ban — rare, watch in live.

None of these reverse the aggregate success gates.

---

## 10. Recommendation

### Deploy V1.1 (prompt swap only)

**Do:**
1. Replace `SYSTEM_PROMPT` in `api/dream-insights.js` with the V1.1 text.
2. Leave model, temperature, schema, API contract, validation, frontend, and DB alone.
3. Smoke-test: short dream, mundane dream, emotional dream, positive dream, one Insight generation + cached reload.

**Do not:**
- Deploy V1 (opener clone).
- Bundle schema/model/temperature changes.
- Commit unless/until you explicitly ask.

**Optional follow-up (not blocking):** V1.2 micro-pass targeting residual frustration invent on one-liners + softer return variety + remaining “what might X” questions.

---

## 11. Definition of done

| Item | Status |
|------|--------|
| V1.1 prompt designed | Done |
| Same 44 offline generations | Done (44/44) |
| Scored vs baseline + V1 | Done |
| Recommendation | **Deploy V1.1** |
| Production modified | **No** (awaiting your deploy instruction) |
| Commit | **No** |

---

*End of Insight Prompt Experiment V1.1 report.*
