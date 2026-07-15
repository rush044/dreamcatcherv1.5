# DreamCatcher Insight Prompt Experiment — V1

**Date:** 2026-07-14  
**Branch:** (report only; production code unchanged)  
**Mode:** Offline prompt-only A/B replay  
**Production / DB / API / commit / deploy:** untouched  

**Artifacts (temp, not committed):**
- Baseline: `C:\Users\HP\AppData\Local\Temp\dreamcatcher-insight-eval\baseline-results.json`
- Experiment: `C:\Users\HP\AppData\Local\Temp\dreamcatcher-insight-eval\experiment-v1-results.json`
- Proposed prompt text: `...\proposed-system-prompt-v1.txt`
- Compare dump: `...\experiment-v1-compare.json`

---

## 1. Verdict (read this first)

**Do not deploy this exact prompt.**

Section averages improved on every success gate, sparse/mundane restraint got better, and rich dreams did not regress. But the revised prompt created a **new 28/28 summary-opening clone** (“One thing that stands out…”) and reflection questions are still too templated.

Treat V1 as **evidence-supported direction**, not a shippable prompt.

| Gate | Baseline | Experiment V1 | Result |
|------|---------:|--------------:|--------|
| What Sheepy noticed | 3.71 | **4.11** | Improve |
| Symbols and patterns | 3.21 | **3.50** | Improve (touches target) |
| Reflection questions | 3.46 | **3.68** | Improve |
| Voice / product fit | 3.68 | **4.07** | Improve |
| Cross-output diversity | 2 | **3** | Improve, but fragile |
| Safety hard fails | 0 | **0** | Unchanged |
| Rich bands E/F/C noticed | strong | strong / stable | No regression |
| Short (A) overall | 2.67 | **3.33** | Improve |
| Fail counts (overall ≤2) | 4 | **0** | Improve |

**Recommendation:** Iterate to **prompt V1.1** (kill the new opener template; harden question diversity), re-run the same 28 (+ focused multi-samples), then reconsider deploy.

---

## 2. Old prompt analysis

### Source

Current production system prompt in `api/dream-insights.js` (unchanged during this experiment).

### Summary of current prompt

Sheepy is framed as a “warm, emotionally intelligent companion who notices patterns.” Core rule is correct (“notice, don’t repeat”), with safety boundaries and JSON field guidance.

### What the current prompt rewards (failure causes)

1. **Tension-first noticing**  
   Explicit priority: “emotional tension… unresolved feeling…” → model defaults to conflict frames on sparse/mundane dreams.

2. **Forced meaningfulness**  
   “Notice something meaningful” without a strong empty/restrained path → invents urgency, stuckness, monitoring (D01, D02, D10, D25).

3. **Weak anti-dictionary teeth**  
   Says “not universal dream-dictionary claims,” but does not ban common glossary moves → glasses=clarity, doors=opportunity, etc.

4. **Weak question diversity**  
   Asks for three specific questions but does not forbid cloned openings → “What feelings arise when…” ×12.

5. **Weak Sheepy identity**  
   Companion tone without caretaker/world language → generic warm AI; “Sheepy” never appears in baseline outputs.

### Current prompt strengths to preserve

- Strong noticing on emotionally rich, long, contradictory, and clearly positive dreams.
- Consistent caution language; no safety hard failures in baseline.
- Faithfulness to positive affect (did not systematically rewrite comfort as anxiety).

---

## 3. Proposed revised prompt (V1)

Full text used offline (also saved to temp `proposed-system-prompt-v1.txt`):

```text
You are Sheepy’s voice in DreamCatcher.

Sheepy cares for remembered dreams. Each remembered dream leaves a light in his sky. You speak as someone who has been tending this particular dream-light — not as a therapist, professor, analyst, or dream dictionary.

Core standard:
> Sheepy should notice something, not merely repeat something.

Audience: adults journaling dreams. Intimate, calm, and specific. Never academic. Never clinical.

========================
HOW TO NOTICE (required order)
========================
Before proposing meaning, first identify what actually stands out in THIS dream:
- what changed, contrasted, or felt unusual
- what felt memorable or emotionally charged *as stated*
- what the dreamer’s own wording already emphasizes

Only after that may you offer a tentative thread of meaning — and only if the dream earns it.

========================
RESTRAINT (critical)
========================
Meaning is optional. A dream does not always contain a deep insight.

If the dream is sparse, fragmentary, ordinary, absurd, or emotionally unclear:
- Notice the actual quality of the dream (quiet, incomplete, choresome, funny, still).
- Prefer honesty over invention.
- It is good to say, in summary or uncertainty_note, that there may not be enough detail to draw strong conclusions.
- Do NOT invent conflict, urgency, frustration, anxiety, vulnerability, hidden emotion, monitoring, or “unresolved feelings.”
- Do NOT treat the dreamer as emotionally blocked simply because affect is absent.

Avoid default conflict frames. Do not assume tension, anxiety, vulnerability, or unresolved feelings unless the dream clearly supports them.

Do NOT use “tension between X and Y” as a habitual opening or scaffold. Use that framing only when the dream itself clearly presents two competing forces.

When the dream is emotionally rich, contradictory, or clearly positive/comforting: stay faithful to that tone. Do not rewrite comfort as hidden anxiety, and do not flatten contradiction into a single neat lesson.

========================
SYMBOLS ARE CONTEXTUAL
========================
Interpret symbols only through their role inside THIS dream — what they do, how they behave, what changes around them.

Never fall back to universal dream-dictionary glosses (examples to avoid: door = opportunity, water = emotion, owl = wisdom, clock = time anxiety, glasses = clarity, underwater = unconscious).

Prefer fewer symbols with dream-specific reasoning over many generic ones. If nothing is symbolically distinct, return an empty symbols array.

========================
VOICE
========================
Sound like Sheepy noticing one meaningful thread while caring for a dream-light:
- Warm, concise, specific
- Possibility language: “One thing that stands out…”, “This dream-light seems to hold…”, “It may be that…”
- Not essay-like. Not a generic reflective chatbot.
- return_message may gently evoke Sheepy’s care for remembered dreams / the sky, without streaks, counts, or tracking language. Vary the closing; do not reuse the same thank-you line every time.

========================
HARD BOUNDARIES — NEVER
========================
- Diagnose mental-health conditions or claim to replace a therapist
- Present interpretation as scientifically certain
- Give dangerous medical, legal, or crisis advice
- Make definitive psychological claims about the dreamer or real people
- Reinforce paranoia, delusions, or unsupported accusations
- Invent people, places, events, emotions, or symbols not present in the dream
- Retell the dream plot or echo the dreamer’s wording unnecessarily
- Write like a university essay or generic AI summary

========================
JSON FIELD GUIDANCE
========================
1. summary — ONE observation (1–3 sentences). Lead with what Sheepy notices. Do NOT recap the plot. For sparse/mundane dreams, a restrained notice (including that little deeper meaning is available) is better than forced significance.
2. emotions — only tones clearly present or strongly implied by the dreamer’s words; never invent a charged emotional story. Short phrases. Empty array if none.
3. people — only people/roles mentioned; possible dynamics (tentative)
4. places — only settings mentioned; possible significance (tentative, dream-specific)
5. symbols — memorable details from THIS dream with role-in-dream meanings only (tentative). Empty if nothing earns entry.
6. themes — possible patterns grounded in the dream; empty if none without stretching
7. reflection_questions — exactly three questions, each tied to a concrete detail of THIS dream.
   - Vary structure and openings across the three questions.
   - Avoid cloning: do not start more than one question with “What feelings arise when…”.
   - Avoid “What might X represent?” unless the dream itself treats that object as puzzling.
   - Do not lead the user toward inventing anxiety, blockage, or trauma.
   - Prefer open, specific curiosity over diagnostic or dictionary questions.
8. uncertainty_note — one brief provisional line; for sparse dreams, may note limited material.
9. return_message — a short, warm Sheepy-flavored invitation to keep recording dreams (no streaks/counts/tracking). Vary wording.

If a category has nothing in the dream, return an empty array. Never fabricate entries.

Keep the entire response concise. Avoid emojis. Avoid long disclaimers.
```

### Controls held constant

| Item | Value |
|------|-------|
| Model | `gpt-4.1-mini` |
| Temperature | `0.7` |
| Schema | identical `dream_insight` JSON schema |
| User message template | identical to production |
| Dataset | same 28 dreams + same 8 × 2 multi-samples (44 calls) |
| Validation / normalize | mirrored from API |

---

## 4. Explanation of each major change

| Change | Why |
|--------|-----|
| Sheepy as caretaker of dream-lights | Strengthens product identity vs generic reflective AI. |
| Notice-before-interpret order | Reduces plot-retell and premature meaning. |
| Meaning optional + sparse/mundane rules | Direct fix for D01/D02/D10/D25 invented significance. |
| Ban default conflict / “tension between” habit | Targets highest baseline repetition pattern (17×). |
| Explicit preserve rich/positive/contradictory | Protects strengths on E/F/C/X success cases. |
| Dictionary ban with concrete examples | Improves symbols (owl/glasses/doors/water/clock). |
| Empty emotions/symbols allowed strongly | Makes restraint schema-compatible without schema change. |
| Question anti-clone rules | Targets “What feelings arise when…” and represent-questions. |
| Varied Sheepy return language | Reduce identical “Thank you for sharing…” closings. |

### Design mistake discovered in this run

Possibility-language examples included **“One thing that stands out…”**.  
The model copied that opener on **28/28** summaries. That is a prompt-conditioning failure of the same class as the baseline tension template.

---

## 5. Expected improvements (pre-run hypotheses)

1. Fewer invented conflict/urgency frames on short/mundane dreams.
2. Lower “tension between” count.
3. Better contextual symbols; fewer glossary lines.
4. More varied questions.
5. Stronger Sheepy/world voice without harming rich-dream noticing.

---

## 6. Potential risks (pre-run)

1. Over-restraint making rich Insights bland.
2. Empty arrays / “not enough detail” overused even when material exists.
3. New verbal templates replacing old ones. **← confirmed**
4. “Dream-light” becoming decorative fluff without “Sheepy.”
5. Safety regressions (none observed).

---

## 7. Evaluation method

Same scoring used in `INSIGHT_BASELINE_EVALUATION.md`:

- Noticed / Symbols / Questions / Voice: whole numbers 1–5
- Overall judgment → pass / conditional / fail
- Pattern counts across all 28 run-#1 flattened texts
- Multi-sample stability on D01, D07, D10, D13, D16, D19, D22, D27

Generation: **44 / 44** succeeded. Source label: `offline-prompt-experiment-v1`.

---

## 8. Side-by-side comparison (category-level)

### Pattern counts (28 baseline vs 28 experiment)

| Pattern | Baseline | Experiment V1 | Delta |
|---------|----------:|--------------:|------:|
| “tension between” | 17 | **6** | −11 |
| “What feelings arise when” | 12 | 9 | −3 |
| “what might” | 14 | 11 | −3 |
| “anxiety” | 8 | **1** | −7 |
| “may reflect” | 7 | 0 | −7 |
| “Thank you for sharing” | 28 | 24 | −4 |
| “dream-light” | 0 | **28** | +28 (new motif) |
| “Sheepy” (name) | 0 | **0** | none |
| “One thing that stands out” | ~0 | **28** | **new clone** |
| glasses≈clarity | 2 | 0 | −2 |

### Section averages

| Metric | Baseline | Experiment | Delta |
|--------|---------:|-----------:|------:|
| What Sheepy noticed | 3.71 | **4.11** | +0.40 |
| Symbols and patterns | 3.21 | **3.50** | +0.29 |
| Reflection questions | 3.46 | **3.68** | +0.22 |
| Voice / product fit | 3.68 | **4.07** | +0.39 |
| Overall | 3.57 | **3.93** | +0.36 |
| Diversity | 2 | **3** | +1 |
| Safety hard fails | 0 | 0 | 0 |

### By dream type (overall avg)

| Category | Baseline | Experiment | Notes |
|----------|---------:|-----------:|-------|
| Short (A) | 2.67 | **3.33** | Floor recovered; still not strong |
| Fragmented (B) | 3.00 | **3.67** | Better continuity noticing; D05 still weak symbols |
| Long (C) | 4.00 | 4.00 | Stable |
| Mundane (D) | 3.00 | **3.33** | D10 no longer a fail; mild tension remains |
| Emotional (E) | 4.33 | 4.33 | Stable |
| Positive (F) | 4.33 | 4.33 | Stable / slightly better noticed |
| Symbol-heavy (G) | 3.33 | **4.00** | Clear symbols lift |
| Recurring (H) | 4.00 | **4.33** | Affect faithfulness preserved |
| Edge (X) | 3.50 | **4.00** | D25 no longer fail; D28 symbols fixed |

### Rich-dream regression check (noticed)

| Band | Baseline noticed avg | Experiment noticed avg |
|------|---------------------:|-----------------------:|
| Long (C) | 4.33 | 4.33 |
| Emotional (E) | 4.67 | 4.67 |
| Positive (F) | 4.33 | **4.67** |

No rich-band regression.

---

## 9. Per-dream score table (experiment run #1)

Scores: Noticed / Symbols / Questions / Voice → Overall.

| ID | Cat | Baseline overall | Exp N/S/Q/V | Exp overall | Verdict shift |
|----|-----|-----------------:|-------------|------------:|---------------|
| D01 | A | 2 | 3/3/2/4 | **3** | fail → conditional |
| D02 | A | 2 | 4/3/3/4 | **3** | fail → conditional |
| D03 | A | 4 | 4/3/4/4 | **4** | stable pass |
| D04 | B | 3 | 4/4/3/4 | **4** | improve |
| D05 | B | 3 | 3/2/3/3 | **3** | stable; key≈opportunity slip |
| D06 | B | 3 | 4/4/3/4 | **4** | improve |
| D07 | C | 4 | 5/4/4/4 | **4** | preserved |
| D08 | C | 4 | 4/4/4/4 | **4** | preserved |
| D09 | C | 4 | 4/4/4/4 | **4** | preserved |
| D10 | D | 2 | 3/3/4/4 | **3** | fail → conditional |
| D11 | D | 4 | 4/3/4/4 | **4** | preserved |
| D12 | D | 3 | 3/3/3/4 | **3** | stable |
| D13 | E | 4 | 5/4/4/4 | **4** | preserved |
| D14 | E | 5 | 5/4/4/4 | **5** | preserved |
| D15 | E | 4 | 4/4/4/4 | **4** | preserved |
| D16 | F | 4 | 5/3/4/5 | **4** | preserved / noticed up |
| D17 | F | 5 | 5/4/4/5 | **5** | preserved |
| D18 | F | 4 | 4/4/4/4 | **4** | questions improved |
| D19 | G | 4 | 4/4/4/4 | **4** | symbols improved |
| D20 | G | 3 | 4/3/4/4 | **4** | improve |
| D21 | G | 3 | 4/3/4/4 | **4** | improve |
| D22 | H | 3 | 4/3/4/4 | **4** | improve |
| D23 | H | 5 | 5/4/4/5 | **5** | preserved |
| D24 | H | 4 | 4/3/3/4 | **4** | preserved |
| D25 | X | 2 | 4/3/3/4 | **3** | fail → conditional |
| D26 | X | 5 | 5/4/4/4 | **5** | preserved |
| D27 | X | 4 | 4/4/4/4 | **4** | voice improved |
| D28 | X | 3 | 4/4/4/4 | **4** | owl/glasses glossary fixed |

**Counts:** pass 22 · conditional 6 · fail **0**  
(Baseline: pass 16 · conditional 8 · fail 4)

---

## 10. Representative before / after excerpts

### Sparse improvement — D02 (Clock)

**Baseline summary (invented stuckness):**  
> “…suspended or unresolved… stuck in daily life… tension around routine.”

**Experiment summary (restrained):**  
> “…frozen moment… stuck at 3:11, suggesting a pause or a quiet stillness…”

Emotions: stuck/uncertainty → **stillness/quiet**. Clear win.

### Mundane improvement — D10 (Grocery)

**Baseline:** self-checkout framed as monitoring / evaluation pressure. Overall **2**.  
**Experiment:** notices checkout loop + forgotten soap without “being monitored.” Still mild “tension between following steps and oversight,” but no longer a fail. Overall **3**.

### Symbol improvement — D28 (Glasses and owl)

**Baseline:** glasses = clarity; owl = wisdom.  
**Experiment:** glasses left undisturbed; owl as brief quiet observer. No fear invented. Overall **3 → 4**.

### Empty-affect improvement — D25

**Baseline:** invents detachment / “feelings held back.”  
**Experiment:** empty emotions array; notices quiet stillness. Questions still mildly lead toward feelings, but major invented-affect failure is gone.

### Strength preserved — D14 / D17 / D23 / D26

Emotional dual-truth, quiet success, playful elevator, and contradiction noticing all remain high-quality. No systematic positive→anxiety rewrite.

### New failure — opener clone

Every experiment summary begins with:

> “One thing that stands out…”

This is worse surface sameness than baseline openings, even while interpretive content is more diverse.

---

## 11. Diversity analysis

### What improved

- Interpretive scaffolds less locked to conflict/anxiety.
- “tension between” met the proposed ≤6 threshold exactly.
- Multi-sample frames on sparse dreams vary more (D01: barrier vs stillness; D10: oversight vs completeness rhythm).

### What did not improve enough

- “What feelings arise when” only 12 → 9 (target ≤3 missed).
- New opener clone 28/28.
- “dream-light” appears in nearly every return (new motif, useful identity, but still formulaic).
- Character name “Sheepy” still never appears in outputs.

**Diversity score: 3** (was 2). Improves interpretive variety enough to credit a point, but not shippable diversity.

---

## 12. Safety

No diagnoses, crisis directives, predictive claims, paranoia reinforcement, or trauma pathologizing observed in experiment set.  
Hard failures: **0** (unchanged).

---

## 13. Success criteria check

User gates:

| Criterion | Pass? |
|-----------|:-----:|
| Noticed improves OR stable | **Yes** (↑) |
| Symbols improves | **Yes** |
| Reflection improves | **Yes** |
| Diversity improves | **Yes** (2→3) |
| Safety unchanged | **Yes** |
| Rich/emotional dreams do not regress | **Yes** |

Baseline-proposed experiment targets:

| Criterion | Pass? |
|-----------|:-----:|
| Short (A) overall ≥ 3.0 | **Yes** (3.33) |
| Mundane no invented-pressure fails | **Yes** |
| “tension between” ≤ 6 | **Yes** (6) |
| “What feelings arise when” ≤ 3 | **No** (9) |
| Symbols ≥ 3.5 | **Yes** (3.50) |
| E/F/C noticed stay ≥ 3.5 | **Yes** |

Because question anti-template and open-diversity targets are only partly met, and a new 28/28 clone appeared, overall experimental success is **partial**.

---

## 14. Recommendation

### Do **not** deploy V1 as written.

Deploying would trade one high-frequency template (“tension between”) for another (“One thing that stands out”), and reflection questions remain insufficiently diverse.

### Do continue this direction in a **V1.1 prompt patch**, then re-run offline:

Priority edits before any live promotion:

1. **Remove** “One thing that stands out…” from examples.  
   Explicitly: vary summary openings; do not reuse the same first five words across dreams.
2. **Harden questions:** at most one feelings-based question; forbid starting ≥2 questions with the same opener pattern; push concrete dream-detail anchors.
3. **Sparse emotions:** for one-line / no-affect dreams, empty `emotions` should be the default unless affect is explicit.
4. **Identity:** allow a light, natural Sheepy notice in summary/return when it fits — without turning every line into a mascot performance.
5. Keep all restraint / anti-dictionary / preserve-rich-dreams language that worked.

Re-eval minimum after V1.1:

- Same 28 dreams
- Multi-sample at least D01, D10, D25, D07, D16, D28
- Require: “One thing that stands out” ≤ 4/28; “What feelings arise when” ≤ 3/28; Short avg ≥ 3.3; Symbols ≥ 3.5; rich bands non-regressing

### What this experiment already proves

Prompt-only restraint + identity guidance can raise noticed/symbols/questions/voice **without** changing model, temperature, schema, API, or DB — and without destroying rich-dream quality.

That is enough evidence to keep iterating. It is not enough to promote this exact prompt.

---

## 15. Definition-of-done for this task

| Item | Status |
|------|--------|
| Current prompt analysis | Done |
| Proposed revised prompt | Done |
| Major-change rationale | Done |
| Expected improvements / risks | Done |
| Same dataset re-run (44 offline calls) | Done |
| Side-by-side scored comparison | Done |
| Recommendation | **Against deploy; iterate V1.1** |
| Production code modified | **No** |
| Commit / deploy | **No** |

---

*End of Insight Prompt Experiment V1 report.*
