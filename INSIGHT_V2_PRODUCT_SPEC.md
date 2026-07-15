# DreamCatcher Adaptive Insight V2 — Product Specification

**Status:** Local prototype on `insight-v2-adaptive`  
**Model for this validation:** `gpt-4.1-mini` only  
**Not a release decision.** Human review of `INSIGHT_V2_HUMAN_REVIEW.md` is required before any ship discussion.

---

## 1. Product promise

Every dream is worth saving.

Not every dream supports the same amount of interpretation.

The user decides whether a dream is worth keeping. Sheepy decides only how much can honestly be said about it right now.

Core mythology (optional in Insight text; candidate for onboarding):

> Sheepy cares for remembered dreams, and each remembered dream leaves a light in his sky.

Do not force this mythology into every generated Insight.

---

## 2. Every-dream-is-worth-saving rule

- Sheepy never forces meaning.
- Sheepy only says as much as the dream gives him.
- A short dream can contain strong emotional material.
- A long dream can contain little useful evidence.
- Dream length must never determine Insight depth by itself.
- A single fragment may say little.
- Several recurring fragments may become more meaningful together later (future pattern/constellation work).

---

## 3. Adaptive response depth

Internal labels only (not shown to users):

| Depth | When | Visible output |
|-------|------|----------------|
| `limited` | Sparse, unclear, ordinary, or no honest interpretation supported | `notice` only; threads empty; questions empty (rarely one missing-detail question) |
| `focused` | One clear emotion change, contradiction, interaction, waking-life link, or contextual image relationship | Short notice; 0–2 threads; 0–1 question |
| `rich` | Several connected details support more than one useful thread | Notice (2–4 sentences); 1–3 threads; 0–2 questions |

Do not select `rich` merely because the dream is long.

---

## 4. Sheepy personality

Sheepy is visually cute but verbally mature — a wise caretaker.

He sounds wise because he notices carefully and knows when to stop, not because he uses complex words.

**Is:** warm, observant, concise, plainspoken, humble, emotionally mature, calm, nonjudgmental, gently curious, able to admit uncertainty, occasionally poetic, discreet with adult material.

**Is not:** therapist, psychologist, academic, literary critic, oracle, dream dictionary, fortune teller, wellness chatbot, childish mascot, marketing narrator, authority on the user’s unconscious.

Branded vocabulary (Sheepy, light, sky, glow, tending, constellation) does not create voice. The UI heading already establishes who is speaking.

Avoid stock openers and unnecessarily complex phrasing. Prefer ordinary language for a meaningful observation.

---

## 5. Research-informed evidence priorities

Attend in this order:

1. Explicit emotions
2. Emotional changes or contradictions
3. Actions and interactions
4. Explicit waking-life context
5. Relationships and familiar people (without assuming literal identity or intent)
6. Central or unusual imagery **in context**
7. Repeated patterns across dreams — **not available** to the single-dream Insight; do not pretend

---

## 6. Sensitive and adult dream handling

For sexual, violent, disturbing, embarrassing, or taboo dreams:

- remain calm and discreet
- do not become cute, clinical, moralizing, or shocked
- do not elaborate graphically
- do not diagnose, infer trauma, claim waking desire, or predict danger

Personality stays consistent; Sheepy does not switch into therapist mode.

---

## 7. Visible UI structure

### What Sheepy noticed

Always visible. Renders `notice` only.

No redundant “Sheepy noticed something” eyebrow. No extra Sheepy image on the card.

### Threads Sheepy found

Optional. Render only when `threads.length > 0`.

- Collapsed by default
- Accessible control (`aria-expanded`, `aria-controls`, keyboard)
- Maximum three short items
- Accordion boundary must be unmistakable so questions never look nested inside when closed

### Something to sit with

Optional. Render only when `reflection_questions.length > 0`.

- Normally zero or one question; two maximum
- Clearly separated from threads
- No empty heading
- Single question is not shown as a padded bullet inventory

### Removed from visible V2 output

- Uncertainty footer
- Generated closing / thank-you
- Mandatory sky/light/constellation wording
- Emotion / theme / person / place / symbol inventory lists

---

## 8. Hidden pattern metadata

`pattern_candidates` are stored for future pattern and constellation work.

- Include evidence
- Do not state universal meanings
- Not rendered in the user-facing Insight card
- Confidence labels: `explicit` | `suggested`

`confidence` on the insight (`low` | `medium` | `high`) is also internal/not rendered.

---

## 9. Future pattern and constellation compatibility

V2 stores lightweight, evidence-backed candidates without claiming cross-dream knowledge.

Later systems may cluster recurring emotions, people, places, actions, images, relationships, or waking-life links into constellation experiences — without regenerating or discarding historical Insights.

---

## 10. Backward compatibility

- Content lives in existing `dream_insights.content` JSONB
- V2 objects include `"version": 2`
- V1 cached Insights (summary + symbols + required questions, etc.) continue to render via the legacy renderer
- No automatic regeneration
- No database migration for this prototype

---

## 11. Evaluation process

1. Offline generation against the 16-dream calibration set using `gpt-4.1-mini`
2. Automated supporting scores (capped when forced depth / generic language / filler appear)
3. Human review via `INSIGHT_V2_HUMAN_REVIEW.md`
4. Separate later task for stronger-model comparison after architecture stability

Evaluation must not write to Supabase or touch production configuration.

---

## 12. Release requirements

V2 is **not** ready to ship from this prototype alone.

Before any production consideration:

- [ ] Human calibration of `INSIGHT_V2_HUMAN_REVIEW.md`
- [ ] Accordion / mobile UI acceptance
- [ ] V1 cache rendering confirmed in a real session
- [ ] Safety review of sensitive calibration dreams
- [ ] Separate model-comparison task (if needed)
- [ ] Explicit product decision to deploy

---

## 13. Candidate onboarding copy

Do **not** modify onboarding in this workstream. Candidates only:

1. “Sheepy cares for remembered dreams, and each remembered dream leaves a light in his sky.”
2. “Every dream is worth keeping. Sheepy only says as much as the dream gives him.”
3. “Some dreams reveal a thread right away. Others may connect with something you remember later.”
