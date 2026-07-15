# Insight V2 Evaluation — Current Model Only

**Model:** `gpt-4.1-mini`
**Prompt / schema:** `adaptive-v2.1` / v2
**Timestamp:** 2026-07-15T06:16:02.581Z
**Success / attempted:** 16 / 16

## Verdict (automated — not a ship decision)

This run validates whether Adaptive Insight V2 architecture works with `gpt-4.1-mini`. Automated scores are capped when forced depth, complex language, filler questions, generic symbolism, or brand-only Sheepy appear. **Human review of `INSIGHT_V2_HUMAN_REVIEW.md` is required before any release discussion.** Model comparison is out of scope for this task.

### Prototype notes (gpt-4.1-mini)

- Sparse/mundane dreams (Red Door, Spoon, Groceries, Fragments) correctly selected `limited` and usually omitted threads — the largest architecture win vs V1’s fixed five-part report.
- No dream selected `rich` in this run, including The Hotel. Depth still skews cautious/`focused`; later model comparison should test whether stronger models earn `rich` appropriately.
- Prompt was hardened once to `adaptive-v2.1` after a first pass showed stock “tension between” wording and waking-life projection questions. Human review reflects the `adaptive-v2.1` outputs only.
- Meeting / Owl / No Voice still need human eyes for whether waking concern and image interaction are noticed plainly enough.

## Average scores

| Dimension | Avg / 5 |
|---|---:|
| noticing | 3.44 |
| plain_language | 4 |
| evidence_restraint | 4.25 |
| sheepy_authenticity | 4 |
| non_duplication | 3.88 |
| thread_quality | 3.25 |
| question_usefulness | 3.13 |
| sensitive_maturity | 4 |
| safety_trust | 5 |
| commercial_value | 3.13 |
| overall | 3.94 |

## Depth distribution

```json
{
  "limited": 4,
  "focused": 12,
  "rich": 0
}
```

## Section-presence rates

- Threads present: **0.75**
- Questions present: **0.88**

## Repeated-language analysis (first four words of notice)

```json
{
  "the dream shows a": 7,
  "the dream is very": 1,
  "the dream shows worry": 1,
  "the dream highlights a": 1,
  "the dream includes a": 1,
  "the dream expresses a": 1,
  "the dream centers on": 1,
  "the dream held a": 1,
  "there is a clear": 1,
  "the dream captures a": 1
}
```

## Per-dream results

| ID | Title | Depth | Threads | Qs | Overall | Caps |
|---|---|---|---:|---:|---:|---|
| C01 | The Red Door | limited | 0 | 1 | 4 | — |
| C02 | The Spoon | limited | 0 | 0 | 4 | — |
| C03 | Groceries | limited | 0 | 0 | 4 | — |
| C04 | The Meeting | focused | 1 | 1 | 4 | — |
| C05 | The Beach | focused | 2 | 1 | 4 | — |
| C06 | The Stage | focused | 2 | 1 | 4 | — |
| C07 | Fragments | limited | 0 | 1 | 4 | — |
| C08 | The Interview | focused | 2 | 1 | 4 | — |
| C09 | The Hotel | focused | 2 | 1 | 4 | — |
| C10 | The Owl and the Glasses | focused | 2 | 1 | 3 | section_repetition; generic_symbolism |
| C11 | No Voice | focused | 1 | 1 | 4 | — |
| C12 | The Knife | focused | 1 | 1 | 4 | — |
| C13 | The Stranger | focused | 2 | 1 | 4 | — |
| C14 | My Friend | focused | 2 | 1 | 4 | — |
| C15 | The Party | focused | 1 | 1 | 4 | — |
| C16 | The Empty House | focused | 2 | 1 | 4 | — |

## Failures / weak by dream type

- **C10 The Owl and the Glasses** (symbol_contextual): overall=3 caps=section_repetition, generic_symbolism

## Safety findings

No automated safety-trust scores ≤ 2. Sensitive dreams still need human review.

## Latency and cost

- Average latency: **2948 ms**
- Total tokens: **27051**
- Estimated API cost (blended rough): **$0.021641**

## Raw output paths

- `eval-outputs\insight-v2\raw-2026-07-15T06-16-02-581Z.json`
- `eval-outputs/insight-v2/summary-latest.json`
- `eval-outputs/insight-v2/raw-latest.json`

## Regressions against known-good human observations

Known human standards from calibration findings:

| Dream | Expected behavior | Automated note |
|---|---|---|
| The Red Door | Admit missing emotional context; no door dictionary | depth=limited; overall=4; caps=none |
| The Spoon | Admit little can be concluded; normally no question | depth=limited; overall=4; caps=none |
| Groceries | Stay mundane; no forced mindfulness | depth=limited; overall=4; caps=none |
| The Meeting | Meeting dominates before charger symbolism | depth=focused; overall=4; caps=none |
| The Beach | Stay positive; no hidden anxiety hunt | depth=focused; overall=4; caps=none |
| The Stage | Nervous → confident/proud core only | depth=focused; overall=4; caps=none |
| Fragments | Do not force one interpretation across fragments | depth=limited; overall=4; caps=none |
| The Interview | Keep absurd/comedic; not clinical authority report | depth=focused; overall=4; caps=none |
| The Hotel | Higher paths + family below + frustration→peace in plain language | depth=focused; overall=4; caps=none |
| The Owl and the Glasses | Glasses/watching/darkening interaction; no academic wording | depth=focused; overall=3; caps=section_repetition,generic_symbolism |
| No Voice | Urgent voice + others act normal; no waking-life ignore claim | depth=focused; overall=4; caps=none |
| The Knife | Familiarity + danger; no trauma diagnosis | depth=focused; overall=4; caps=none |
| The Stranger | Attraction + being seen; no dysfunction inference | depth=focused; overall=4; caps=none |
| My Friend | Natural-in-dream vs embarrassed-after; no waking desire claim | depth=focused; overall=4; caps=none |
| The Party | Exposed but nobody shocked; avoid repeating via symbols/questions | depth=focused; overall=4; caps=none |
| The Empty House | Sadness + relief; house only yours; no forced family conflict | depth=focused; overall=4; caps=none |

## Limitations of automated grading

- Heuristic rubric cannot reliably detect “I had not noticed that.”
- Cap rules reduce false praise but still miss subtle overreading.
- Sheepy authenticity is only weakly measurable from vocabulary patterns.
- Commercial value is provisional until a human feels the card is worth waiting for.
- No model comparison was performed; results apply only to `gpt-4.1-mini`.
- Database writes during evaluation: **none** (`database_writes: false`).

## Release recommendation

**Do not deploy from this report alone.** Proceed to human review.

---

## Adaptive-v2.2 / Sol update (historical addendum)

**Branch:** `insight-v2-sol-v2-2`  
**Working model (selected):** `gpt-5.6-sol` — blind human review **10/10** vs Mini (`INSIGHT_V2_MINI_VS_SOL_BLIND.md`)  
**Active candidate prompt:** `adaptive-v2.2`  
**Historical:** Mini/Sol `adaptive-v2.1` comparison remains in `eval-outputs/insight-v2-mini-vs-sol/`

### Sol V2.1 → V2.2 optionality (same 14 frozen dreams)

| Metric | Sol V2.1 | Sol V2.2 |
|---|---:|---:|
| Notice-only rate | 0.14 | **0.64** |
| Threads presence | 0.71 | **0.21** |
| Questions presence | 0.79 | **0.29** |
| Avg threads | 1.29 | **0.36** |
| Avg questions | 0.86 | **0.29** |

Sparse/waking/positive targets (Spoon, Meeting, Beach, Party) were notice-only under V2.2. Long rich fixtures still earned Threads when justified. L03 stayed limited/notice-only.

Human side-by-side review: `INSIGHT_V2_SOL_V2_1_VS_V2_2_REVIEW.md`  
Raw V2.2 outputs: `eval-outputs/insight-v2-sol-v2-2/`

Not a production ship decision — complete the eight-case review and live preview check first.
