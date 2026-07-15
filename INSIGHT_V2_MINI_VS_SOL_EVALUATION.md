# Insight V2 — Mini vs Sol Evaluation

## 1. Purpose

Determine whether remaining Adaptive Insight V2 quality problems are mainly caused by `gpt-4.1-mini`, or still require major prompt changes, by comparing it with `gpt-5.6-sol` under a frozen prompt and schema.

## 2. Frozen prompt and schema

- Prompt version: **adaptive-v2.1** (SYSTEM_PROMPT_V2 unchanged)
- Schema version: **2**
- Identical dream texts, user formatting, validation, and normalization for both models
- No application/production files modified for this comparison

## 3. Models and settings

### gpt-4.1-mini

- API: `chat.completions`
- temperature: `0.7`
- `response_format`: structured `json_schema` (same V2 schema)

### gpt-5.6-sol

- API: `responses`
- reasoning effort: `medium`
- reasoning mode: **standard** (no pro)
- tools: none
- store: false
- structured output via `text.format` json_schema (same V2 schema)

## 4. Evaluation dataset

14 dreams × 2 models = 28 generations.

| ID | Title | Category |
|---|---|---|
| C02 | The Spoon | calibration |
| C04 | The Meeting | calibration |
| C05 | The Beach | calibration |
| C15 | The Party | calibration |
| C14 | My Friend | calibration |
| C09 | The Hotel | calibration |
| C08 | The Interview | calibration |
| C12 | The Knife | calibration |
| C10 | The Owl and the Glasses | calibration |
| C07 | Fragments | calibration |
| L01 | Long coherent emotional dream | Synthetic evaluation fixture |
| L02 | Long bizarre dream | Synthetic evaluation fixture |
| L03 | Long dream with many details but little supported meaning | Synthetic evaluation fixture |
| L04 | Long relationship dream with contradictory emotions | Synthetic evaluation fixture |

Frozen fixtures: `eval-outputs/insight-v2-mini-vs-sol/fixtures-frozen.json`

## 5. Objective measurements

| Metric | gpt-4.1-mini | gpt-5.6-sol |
|---|---:|---:|
| Average overall | 3.14 | 3.79 |
| Notice-only rate | 0.14 | 0.14 |
| Threads presence | 0.79 | 0.71 |
| Questions presence | 0.86 | 0.79 |
| Avg threads | 1.57 | 1.29 |
| Avg questions | 1 | 0.86 |
| % using “the dreamer” | 42.9% | 0% |
| % report-like opening | 42.9% | 0% |
| Unsupported-inference flags | 1 | 1 |
| Repeated-section count | 0 | 0 |
| Sensitive failures | 0 | 1* |
| Bizarre-tone failures | 0 | 0 |
| Validation failures | 0 | 0 |
| Avg latency (ms) | 3646 | 12335 |
| Est. total cost (USD) | 0.014186 | 0.31446 |
| Est. cost / Insight | 0.001013 | 0.022461 |

\*Sol’s automated “sensitive failure” on **My Friend** is a **false positive**: Sol wrote that the dream “does not establish a waking desire.” The heuristic matched the phrase `waking desire` without distinguishing denial from claim. Manual review: Sol handled the sexual dream appropriately.

### Depth distribution

```json
{
  "mini": {
    "limited": 3,
    "focused": 8,
    "rich": 3
  },
  "sol": {
    "limited": 3,
    "focused": 6,
    "rich": 5
  }
}
```

### Score averages

```json
{
  "mini": {
    "genuine_noticing": 3.64,
    "plain_language": 3.29,
    "evidence_restraint": 4.21,
    "sheepy_authenticity": 2.5,
    "non_duplication": 4,
    "optionality": 4,
    "thread_quality": 3.36,
    "question_usefulness": 3.07,
    "sensitive_maturity": 4,
    "bizarre_tone_preservation": 4,
    "commercial_value": 3.36,
    "overall": 3.14
  },
  "sol": {
    "genuine_noticing": 3.71,
    "plain_language": 4,
    "evidence_restraint": 4.21,
    "sheepy_authenticity": 3.71,
    "non_duplication": 4,
    "optionality": 4.14,
    "thread_quality": 3.5,
    "question_usefulness": 3.21,
    "sensitive_maturity": 3.79,
    "bizarre_tone_preservation": 4,
    "commercial_value": 3.43,
    "overall": 3.79
  }
}
```

## 6–11. Category notes

### Section presence / optionality

Mini questions rate **0.86**, threads **0.79**, notice-only **0.14**. Sol questions **0.79**, threads **0.71**, notice-only **0.14**.

### Unsupported inference

Mini flag count **1**; Sol **1**.

### Short / sparse dreams

- **The Spoon**: mini depth=limited q=1 overall=3; sol depth=limited q=0 overall=4
- **Fragments**: mini depth=limited q=0 overall=3; sol depth=limited q=0 overall=4
- **The Party**: mini depth=focused q=1 overall=3; sol depth=focused q=1 overall=4

### Long dreams

- **Long coherent emotional dream**: mini depth=rich threads=3 overall=4; sol depth=rich threads=3 overall=4
- **Long dream with many details but little supported meaning**: mini depth=limited threads=0 overall=4; sol depth=limited threads=0 overall=3
- **Long relationship dream with contradictory emotions**: mini depth=rich threads=3 overall=3; sol depth=rich threads=2 overall=4
- **The Hotel**: mini depth=focused threads=2 overall=3; sol depth=rich threads=2 overall=4

### Bizarre dreams

- **The Interview**: mini bizarre=4 overall=3; sol bizarre=4 overall=4
- **Long bizarre dream**: mini bizarre=4 overall=3; sol bizarre=4 overall=4

### Sensitive content

- **The Knife**: mini sensitive=4 flags=none; sol sensitive=4 flags=none
- **My Friend**: mini sensitive=4 flags=none; sol automated flag=`sexual_to_waking_desire` (**false positive** — Sol explicitly denies waking desire). Manual: Sol is mature and clear; Mini still uses “the dreamer” and denser report framing.

## 12–13. Latency, tokens, cost

```json
{
  "mini": {
    "latency": {
      "average_ms": 3646,
      "total_ms": 51047
    },
    "tokens": {
      "input": 22204,
      "output": 3315,
      "reasoning": 0,
      "total": 25519
    },
    "cost": 0.014186
  },
  "sol": {
    "latency": {
      "average_ms": 12335,
      "total_ms": 172691
    },
    "tokens": {
      "input": 22092,
      "output": 6800,
      "reasoning": 3245,
      "total": 28892
    },
    "cost": 0.31446
  }
}
```

## 14. Strongest outputs

### Mini

```json
[
  {
    "id": "L01",
    "title": "Long coherent emotional dream",
    "overall": 4,
    "depth": "rich",
    "notice": "This dream moves through emotions of gladness, restlessness, calm, embarrassment, affection, and unease. Familiar people and places appear with subtle changes that create a feeling of dissonance, especially the roommate with the scarf and the cousin in a childhood kitchen rearranged with unusual details. The scarf's weight and the shifting closeness of the cousin’s voice highlight complex feelings about connection and distance."
  },
  {
    "id": "L03",
    "title": "Long dream with many details but little supported meaning",
    "overall": 4,
    "depth": "limited",
    "notice": "This dream offers a detailed setting but no clear emotional tone or significant interactions to highlight. The observations are mostly neutral and descriptive, without notable feelings or changes."
  },
  {
    "id": "C02",
    "title": "The Spoon",
    "overall": 3,
    "depth": "limited",
    "notice": "The dream is very brief and contains no emotions or interactions. The presence of a spoon on a table is clear but isolated, offering little to interpret beyond its simple appearance."
  }
]
```

### Sol

```json
[
  {
    "id": "C02",
    "title": "The Spoon",
    "overall": 4,
    "depth": "limited",
    "notice": "There isn’t enough here to know why the spoon mattered. It may simply be the one image that stayed with you."
  },
  {
    "id": "C05",
    "title": "The Beach",
    "overall": 4,
    "depth": "focused",
    "notice": "The clearest part is the complete sense of safety. The quiet beach and calm water held that feeling steady rather than changing or interrupting it."
  },
  {
    "id": "C15",
    "title": "The Party",
    "overall": 4,
    "depth": "focused",
    "notice": "The feeling of exposure is clear, but it was not confirmed by anyone around you. Their ordinary reactions leave an important uncertainty: you may have been safer than you felt, or more alone with the feeling."
  }
]
```

## 15. Worst outputs

### Mini

```json
[
  {
    "id": "L04",
    "title": "Long relationship dream with contradictory emotions",
    "overall": 3,
    "depth": "rich",
    "notice": "The dream carries clear emotions of warmth, companionship, pride, and sadness intertwined in the interaction with the sister. The changing emotions between the two, especially the simultaneous feelings of happiness and grief, stand out. The shared moments of setting the table and the quiet time on the dock highlight a complex, tender relationship. The dream ends with unresolved feelings expressed quietly but felt deeply.",
    "caps": [
      "report_like_opening",
      "complex_language"
    ],
    "flags": []
  },
  {
    "id": "L02",
    "title": "Long bizarre dream",
    "overall": 3,
    "depth": "rich",
    "notice": "The dream carries a playful, surreal feeling with moments of delight, tenderness, and mild responsibility. The dreamer interacts with whimsical, nonsensical elements like office chairs sailing, arbitration bubbles, and weather in kitchen drawers. A fox in a tuxedo guides some actions, and the dreamer’s gentle amusement and tender pause on the parade highlight a shift in engagement with the dream's absurdity.",
    "caps": [
      "report_like_opening"
    ],
    "flags": []
  },
  {
    "id": "C07",
    "title": "Fragments",
    "overall": 3,
    "depth": "limited",
    "notice": "The dream contains a series of disconnected images without clear emotional cues or interactions. There isn’t enough here to know how these scenes relate or what feelings they carried.",
    "caps": [
      "report_like_opening",
      "complex_language"
    ],
    "flags": []
  }
]
```

### Sol

```json
[
  {
    "id": "L03",
    "title": "Long dream with many details but little supported meaning",
    "overall": 3,
    "depth": "limited",
    "notice": "The dream preserves many precise, ordinary details, but gives almost no feeling or reaction to guide an interpretation. There isn’t enough here to know whether the unfinished search for the car mattered, or whether it was simply where the dream stopped.",
    "caps": [
      "report_like_opening"
    ],
    "flags": []
  },
  {
    "id": "C14",
    "title": "My Friend",
    "overall": 3,
    "depth": "focused",
    "notice": "The clearest part is the change: the encounter felt natural in the dream, while embarrassment arrived after waking. You also draw a firm boundary between remembering the dream and wanting to act on it; the dream alone does not establish a waking desire.",
    "caps": [
      "unsupported_inference"
    ],
    "flags": [
      "sexual_to_waking_desire"
    ]
  },
  {
    "id": "C04",
    "title": "The Meeting",
    "overall": 3,
    "depth": "focused",
    "notice": "The dream stays close to tomorrow’s real meeting, so it may simply be carrying your preparation into sleep rather than pointing to a deeper meaning. The failed outlets add a sense of being unable to get one needed thing ready, and the meeting remained on your mind when you woke.",
    "caps": [
      "report_like_opening"
    ],
    "flags": []
  }
]
```

## 16. Where Sol fixed a mini failure

- **The Spoon**: mini 3 → sol 4; mini caps: report_like_opening, filler_question
- **The Beach**: mini 3 → sol 4; mini caps: report_like_opening
- **The Party**: mini 3 → sol 4; mini caps: report_like_opening
- **The Hotel**: mini 3 → sol 4; mini caps: report_like_opening
- **The Interview**: mini 3 → sol 4; mini caps: report_like_opening
- **The Knife**: mini 3 → sol 4; mini caps: report_like_opening
- **The Owl and the Glasses**: mini 3 → sol 4; mini caps: report_like_opening
- **Fragments**: mini 3 → sol 4; mini caps: report_like_opening, complex_language
- **Long bizarre dream**: mini 3 → sol 4; mini caps: report_like_opening
- **Long relationship dream with contradictory emotions**: mini 3 → sol 4; mini caps: report_like_opening, complex_language

## 17. Where Sol did not fix the problem

- **The Meeting**: shared caps report_like_opening
- **Long dream with many details but little supported meaning**: sol scored lower (3 vs mini 4)

## 18. Human blind-review result

Ratings were recorded in `INSIGHT_V2_MINI_VS_SOL_BLIND.md` **before** revealing `INSIGHT_V2_MINI_VS_SOL_KEY.json`. Ratings were not changed after reveal.

| Metric | Count |
|---|---:|
| Sol human wins | **10** |
| Mini human wins | **0** |
| Ties | **0** |
| Decision threshold (≥7/10) | **Met** |
| Material safety regression | **None** |

### Cases won by Sol

The Spoon · The Meeting · The Beach · The Party · My Friend · The Hotel · The Knife · The Interview · Long bizarre dream · Long relationship dream

### Cases won by Mini

None.

### Model problems Sol improved

- Report-like openings (“The dream shows/includes/centers…”)
- Referring to the user as “the dreamer”
- Failure to stop on sparse dreams (Spoon)
- Weaker long-dream / rich reasoning
- Loss of bizarre or comedic tone
- Generic symbolic overreading and unsupported pressure/readiness frames

### Prompt problems that remained across models

- Optional Threads still appear too often
- Optional questions still appear too often
- Questions sometimes invite unnecessary elaboration
- Straightforward dreams can still receive secondary sections that feel like report completion
- Models can treat optional sections as part of a “complete” Insight card

### Final conclusion (capability vs prompt)

**Working-model winner: `gpt-5.6-sol`.**

Human review confirms Sol’s superiority is primarily **model capability** under the frozen adaptive-v2.1 prompt.

Remaining defects are primarily **prompt optionality design**: both models (and Sol still, at lower severity) overproduce Threads and questions. Next step is Sol + leaner adaptive-v2.2 optionality polish — not Mini retention and not a new architecture layer.

## 19. Next step

Proceed on a Sol V2.2 feature branch: adopt Sol for generation, refine adaptive-v2.2 for genuine optionality, evaluate Sol V2.1 → V2.2 only, then preview. Do not change production from this comparison branch alone.

## Paths

- Raw: `eval-outputs/insight-v2-mini-vs-sol/`
- Blind review: `INSIGHT_V2_MINI_VS_SOL_BLIND.md`
- Hidden key: `INSIGHT_V2_MINI_VS_SOL_KEY.json`
