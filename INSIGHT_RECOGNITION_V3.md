# DreamCatcher Insight Recognition V3.0

**Branch:** `insight-v3-recognition`  
**Prompt identifier:** `recognition-v3.0`  
**Fallback (unchanged):** `adaptive-v2.2.1` (`SYSTEM_PROMPT_V2` in `lib/insight-v2.mjs`)  
**Model:** `gpt-5.6-sol` (unchanged)  
**Schema:** V2 (unchanged storage shape)  
**Status:** Preview candidate only. Emotional quality and production readiness require authenticated human review.

---

## 1. Recognition benchmark

The Insight succeeds when the user feels:

> “DreamCatcher helped me see or understand something meaningful about what my subconscious may be processing.”

Strong reactions look like:

- “I had not connected those things before.”
- “That might explain why the dream stayed with me.”
- “I did not realize that could be what I was feeling.”
- “That actually makes sense for me.”
- “Sheepy noticed something I had not noticed.”

Necessary but not sufficient: schema compliance, elegant prose, accurate summary, optionality, cautious wording.

Product failures include: plot summary only; repeating feelings already written; generic symbols; broad labels; Threads that rename scenes/objects; reflective questions without recognition; structural shape without a meaningful subconscious hypothesis.

**Human taste authority:** automated checks may assess schema, grounding heuristics, contradictions, certainty, summary, repetition, malformed questions, and caching. The user is the final judge of recognition, resonance, usefulness, blandness, invasiveness, and return-worthiness. Do not declare emotional success from AI evaluation.

---

## 2. Core Sheepy rule

Every dream is worth keeping. Sheepy only says as much as the dream gives him.

This preserves restraint. It must not justify bland paraphrasing when the dream contains enough evidence for a meaningful interpretation.

---

## 3. Raw first-save priority

The original rapid dream capture is primary evidence about what occurred in the dream.

Evidence types (do not merge):

1. Raw dream capture  
2. Later dream-memory corrections  
3. Known waking-life facts  
4. The dreamer’s own interpretation  
5. Sheepy’s hypothesis  

Later commentary may correct, clarify, contextualize, or reduce confidence. It must not automatically erase meaningful raw behavior. Contradictions may themselves be meaningful.

---

## 4. Private interpretation method

The model reasons silently. It must not expose chain-of-thought.

Privately examine dream evidence, consider multiple subconscious functions, reject unsupported hypotheses, and select the earned recognition with the strongest support + novelty + clarity + uncertainty respect.

People and public figures are treated as potentially meaningful without automatic literal or automatic symbolic readings. Sensitive themes may be explored when evidence supports them; never from demographics alone; never as proven fact from thin evidence.

---

## 5. Three-section semantics (V2 fields unchanged)

| UI section | Field | V3 semantics |
|------------|-------|--------------|
| What Sheepy noticed | `notice` | Central recognition: one meaningful tension/function/pattern/possibility/contradiction/rehearsal/attachment/unresolved movement. Connect to concrete evidence. Beyond paraphrase. |
| Threads Sheepy found | `threads` | Default `[]`. Max product target 2. Deepen central interpretation from distinct angles. Name tensions/functions, not objects. |
| Something to sit with | `reflection_questions` | Default `[]`. Max one. Only when answer could distinguish readings or uncover association. Include open escape. |

Schema still allows up to 3 threads and 2 questions (V2 unchanged). Product prompt targets 0–2 threads and 0–1 question.

---

## 6. Full organic benchmarks (evaluation / docs — not pasted in full at runtime)

### Organic 1 — Watching another life, then imagining your own

**Dream evidence:** Close to streamer Clavicular (cameraman/observer) during public commotion; Clavicular falls to his death; church shooting/hostage while dreamer remains mostly spectator; possible miracle imagery (photographs / white dove); cinematic time skip into later life with possible child, dog, beach; dog injured and loses legs; money/compensation in aftermath; some details uncertain.

**Known context:** Unemployed; watched Clavicular heavily then less; God more present but not fully Christian; beginning to accept financial instability might prevent fatherhood though child may be wanted; women/romance not central.

**Strong context-assisted output (preserved):**

> The dream begins with you inside someone else’s dramatic life, but ends by trying to imagine a life that belongs to you.
>
> You seem to begin behind the camera—close to Clavicular’s intensity, but still observing somebody else’s story. Because his life occupied so much of your attention while your own professional future felt stalled, his fall may not be about wanting him harmed. It may mark that borrowed world losing some of its hold, forcing the dream to search for what comes after watching somebody else live.
>
> The spectator position continues during the church crisis. You remain near danger and meaning without becoming the person directing events. The church and possible miracle imagery matter because faith is emotionally present for you even though your beliefs remain unresolved. Part of your mind may already look toward God as refuge or explanation before your conscious identity has settled.
>
> The final time skip changes the scale of the story. Public spectacle gives way to a child, a dog, care, injury and money. The child may connect to a desire for fatherhood that your practical mind is beginning to surrender because of financial instability.
>
> But the future is not idealized. The dog becomes injured and dependent, and money enters the story. Your mind may be holding the desire and fear together: wanting a life and family of your own while worrying that you may not be able to protect or support what depends on you.
>
> One possible deeper movement is from watching other people live intensely toward confronting the life you may want for yourself—and the reasons you fear you may never be able to build it.

**Strong dream-only output (preserved):**

> The repeated role may matter more than any isolated symbol: you are close to the action, but mostly watching it. You appear near a public figure’s dramatic life and then remain a spectator during the church crisis.
>
> One possible reading is that the dream is exploring what it feels like to live near other people’s intensity without fully entering a story of your own.
>
> The later time skip changes that. The dream moves away from spectacle and toward a child, a dog and a simpler life built around care. Yet the dog’s injury prevents that future from becoming a perfect escape. Once the life becomes personal, it also becomes vulnerable and asks something of you.
>
> The dream may be shifting from watching a life toward imagining what it would mean to become responsible for one.

**Restraint:** no wish-for-harm; no default envy; no inventing unemployment/faith/fatherhood without context; no forced romance; no proven fatherhood intention; preserve uncertainty.

### Organic 2 — Family search and the brother who leaves

**Raw evidence:** Futuristic/post-apocalyptic destruction; looking for mother and younger brother; after transition mother absent; ending settles on independent brother leaving without conversation near cleaning lady and brown playground-like structure.

**Known context:** ~2 years without speaking to mother; consciously little emotion toward her; misses younger brother deeply.

**Strong context-assisted output (preserved):**

> The dream’s original search for both your mother and brother matters, even though the ending does not treat them equally.
>
> You consciously feel little toward your mother, and she disappears after the transition. The dream therefore does not prove that you miss her or want to reconnect. But the raw act of searching for both of them may suggest that some part of your mind still reaches toward family as a whole when everything else is destroyed.
>
> The dream finally settles on your brother.
>
> You remember him as independent, and you remember watching him leave without either of you speaking. Knowing that you miss him, the scene may hold both comfort and sadness: he seems capable of continuing, but his independence also means his life is growing and moving forward without your presence.
>
> One possible deeper movement is that the dream begins by searching for a lost family connection, but ends with the person whose absence you actually feel.

**Strong dream-only output (preserved):**

> The destruction may be less important than who the dream searches for afterward.
>
> The dream ends not with a rescue or reunion, but with an independent brother leaving without conversation. That image may hold two things at once: reassurance that he can continue on his own, and the pain of distance from someone whose life is moving forward.
>
> The absence of dialogue may be part of the emotional structure rather than an empty detail.

### Organic 3 — Threshold and observer pattern

**Evidence:** Repeated university-crush dreams watching without speaking; sexual dreams approached but not completed; older underwear exposure dream. Context: real attraction; inhibition; harsh self-judgment (do not adopt as diagnosis).

**Strong output (preserved):**

> The central action may be what never happens.
>
> Across these dreams, attraction or participation comes close, but speech, intimacy, or action stops at the threshold. Even in dreams—where the ordinary consequences are reduced—the stopping mechanism remains.
>
> One possible reading is that caution, fear of judgment, or self-monitoring became internalized strongly enough that desire repeatedly turns into observation or retreat.
>
> The people in the sexual dreams do not automatically prove literal desire for each person. The repeated approach-and-stop pattern may reveal more than the identity of the partner.
>
> The underwear dream may show the opposite side of the same tension: instead of choosing vulnerability, you are exposed before you feel ready.

---

## 7. Research mechanisms (from completed case research)

| Case | Mechanism |
|------|-----------|
| Stella | Emotional stand-in: one friendship carries another’s disappointment pattern |
| Axel | Boundary already beginning; dream validates a step already taken |
| Juliana | Belonging has ended; familiar place can feel like trespass |
| Siobhan / Nic | Interrupted goodbye; place belongs to lived relationship |
| Julia | Bizarre day residue becomes personal beside actual language/situation |
| Simi | Getting the shape but missing the person = product failure |

Authoritative research artifact: Cursor canvas `dream-insight-case-research.canvas.tsx`.

---

## 8. Blandness failures

Reject/revise when: first paragraph retells events; repeats stated feelings; “themes of” without specific tension; fits many unrelated dreams; Threads rename objects; universal symbols; label soup; notices transitions without destination meaning; “change” without identifying the change; waking explanation as entire Insight; abstract question; asks user to decode confusing wording.

---

## 9. Overinterpretation failures

Reject/revise when: hidden feeling as fact; proves trauma/romance/desire from thin evidence; denies desire despite evidence; death as wish; church auto-religious; prophecy; diagnosis; action commands; converts emotion shift into changed intention; invents biography; meaning for every detail; one reading as only reading.

---

## 10. Caching / regeneration

Existing Insights remain cached by `dream_id`. Prompt version changes do **not** regenerate old Insights. Refresh, tab switch, logout/login, and reopening an old dream return the stored content when valid.

---

## 11. Runtime vs evaluation-only

**Live request:** system prompt `recognition-v3.0` (compact mechanisms + organic compact examples) + user message with title + full dream body from Supabase (`id, user_id, title, body`). Frontend sends dream ID only. No card-preview truncation reaches the model (server loads full `body`, max 8000 chars).

**Evaluation/docs only:** full organic prose, research deep-dives, fixture expected criteria, objective heuristics, raw model dumps.
