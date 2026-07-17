# DreamCatcher — Insight System

## Scope contract

- **Purpose:** Canonical current Insight system and evaluation doctrine.
- **Contains:** Current model/prompt/schema direction, quality rules, historical baseline summary, later failure lesson, few-shot guidance, and links to evidence/marketing.
- **Does not contain:** Full baseline score tables, marketing claims ladder, or UI implementation detail.
- **Update when:** Accepted model, prompt direction, schema, evaluation standard, or quality rules change.
- **Default loading behavior:** Load for Insight prompt, schema, model, evaluation, or quality work. Do not load full baseline/experiment reports unless needed.

---

## Doctrine versus runtime

**Classification:** Implementation-versus-doctrine discrepancy requiring focused Insight re-evaluation.

### Accepted product/prompt doctrine

| Item | Value |
|------|-------|
| Working model | GPT-5.6 Sol (`gpt-5.6-sol`) |
| Accepted prompt direction | adaptive V2.2.1 (explicitly accepted) |
| Schema | Preserve the V2 schema |
| Principles to preserve | Accepted adaptive V2.2.1 principles (notice-only common; threads/questions default empty; questions when present normally limited to one; optionality without overcompression) |

### Current implemented runtime

| Item | Value |
|------|-------|
| Default runtime prompt | `recognition-v3.0` (wired in code on the accepted baseline) |
| Fallback | adaptive V2.2.1 remains available |
| Acceptance status of `recognition-v3.0` | Experimentally evaluated; active in code; **not** established as final production doctrine by recovered explicit acceptance. Silence or continued presence in code is not acceptance |

Do not choose a winner by version name. Do not treat `recognition-v3.0` as accepted doctrine. Do not claim adaptive V2.2.1 is the current runtime when code selects `recognition-v3.0`. Do not change runtime prompt selection in documentation tasks.

**Next Insight action:** Evaluate `recognition-v3.0` against the accepted adaptive V2.2.1 principles and current human acceptance criteria before changing runtime prompt selection.

Volatile pointer: [CURRENT_STATE.md](./CURRENT_STATE.md). Decision: [DECISIONS.md](./DECISIONS.md) D-2026-07-16-19.

Do not claim Sheepy or either prompt version has already proven superiority. Marketing proof requirements: [MARKETING.md](./MARKETING.md).

---

## Dual Insight acceptance

A strong Insight must satisfy **both**:

1. **Cognitive value:** The user understands something meaningful about their subconscious or waking-life connection.
2. **Emotional quality:** The user feels accurately seen, recognized, or understood rather than merely summarized.

Safety and schema compliance remain gates, not proof of either form of quality.

---

## Quality rules

- Rich dreams must not be overcompressed.
- Optionality removes filler, not distinct evidence-supported observations.
- Never turn emotional change into unsupported motivation, intention, acceptance, independence, or giving up.
- Ban forced-choice interpretations.
- Questions must be open, evidence-based, optional, understandable, and useful.
- Sheepy should notice something, not repeat something.
- Raw first-save dream text is primary evidence; later comments may clarify but must not erase it.
- Never accept an Insight regression merely to improve emotional presentation.

### Primary evaluation question

> Did the user feel they understood something meaningful about their subconscious?

Use this together with the dual acceptance rule above. Polished safe prose alone is insufficient.

---

## Evaluation authority

- Safety compliance is a gate, not evidence of Insight quality.
- AI scoring helps mechanical checks and triage but is not final authority for subjective meaningfulness.
- Initial subjective acceptance belongs to Fabrizzio; later blind target-user testing supplements it.
- Marketing superiority claims require proof — see [MARKETING.md](./MARKETING.md).

---

## Historical baseline (evidence summary)

Full report: [INSIGHT_BASELINE_EVALUATION.md](./INSIGHT_BASELINE_EVALUATION.md). That file is historical evidence, not current doctrine.

| Item | Recovered value |
|------|-----------------|
| Jobs | 44 |
| Main dreams | 28 |
| Additional multi-samples | 16 |
| Model | `gpt-4.1-mini` |
| Schema | old strict schema |
| Temperature | 0.7 |
| Few-shots | none |

Recovered scores:

| Metric | Score | Target | Result |
|--------|------:|-------:|--------|
| What Sheepy noticed | 3.71/5 | ≥4.0 | miss |
| Symbols | 3.21/5 | ≥3.5 | miss |
| Questions | 3.46/5 | ≥3.5 | narrow miss |
| Voice/product fit | 3.68/5 | — | — |
| Overall | 3.57/5 | — | conditional |
| Diversity | 2 | — | miss |
| Safety failures | 0 | 0 | pass |
| Short-dream quality | 2.67/5 | — | miss |

Also recovered: 16 pass, 8 conditional, 4 fail; “tension between” ×17; “What feelings arise when” ×12; anxiety ×8.

Historical failure modes:

- invented tension
- forced pressure/efficiency interpretations
- symbol-dictionary behavior
- repetitive phrasing

---

## Later failure — bland polished Insights

- “Thursday Review” and “Room 714” initially appeared polished enough to AI evaluation.
- Fabrizzio identified that they were bland summaries rather than meaningful Insights.
- Room 714 also contained an overly abstract question.
- Exact later numeric scores were not recovered.
- **Retrieval gap:** do not invent the missing numbers.

Incident summary: [INCIDENTS.md](./INCIDENTS.md) item B.

---

## Root-cause conclusion

- Medical/clinical reliability research produced valid safeguards.
- Safety, schema compliance, and polished prose became overweighted relative to meaningful understanding.
- Safety compliance is a gate, not evidence of Insight quality.
- AI scoring is useful for mechanical checks and triage, not final subjective authority.
- Positive acceptance requires both cognitive value and emotional quality (see Dual Insight acceptance).

---

## Few-shot guidance

Prefer:

- accepted positive examples with explanations
- rejected summary-like examples with explanations
- short mundane dreams
- rich bizarre dreams
- emotionally ambiguous shifts
- diverse principles rather than reusable phrasing

Monitor imitation and overfitting.

---

## Historical specialist files (not active doctrine)

Load only when the task needs that evidence:

- [INSIGHT_BASELINE_EVALUATION.md](./INSIGHT_BASELINE_EVALUATION.md)
- `INSIGHT_PROMPT_EXPERIMENT_V1.md` / `INSIGHT_PROMPT_EXPERIMENT_V1_1.md`
- `INSIGHT_V2_PRODUCT_SPEC.md`, `INSIGHT_V2_EVALUATION.md`, `INSIGHT_V2_HUMAN_REVIEW.md`
- `INSIGHT_V2_MINI_VS_SOL_EVALUATION.md`, `INSIGHT_V2_MINI_VS_SOL_BLIND.md`
- `INSIGHT_V2_SOL_V2_1_VS_V2_2_REVIEW.md`
- `INSIGHT_RECOGNITION_V3.md`
- `scripts/insight-v2/README.md`
