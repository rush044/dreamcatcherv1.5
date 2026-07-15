/**
 * Adaptive Insight V2 — shared schema, prompt, validation, normalization.
 * Used by the Dream Insights API and offline evaluation scripts.
 *
 * Schema version: 2
 * Prompt version: adaptive-v2.0
 */

export const INSIGHT_V2_SCHEMA_VERSION = 2;
export const INSIGHT_V2_PROMPT_VERSION = "adaptive-v2.1";
export const INSIGHT_V2_MODEL = "gpt-4.1-mini";

export const INSIGHT_V2_JSON_SCHEMA = {
  name: "dream_insight_v2",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "version",
      "depth",
      "notice",
      "threads",
      "reflection_questions",
      "confidence",
      "pattern_candidates",
    ],
    properties: {
      version: { type: "integer", enum: [2] },
      depth: { type: "string", enum: ["limited", "focused", "rich"] },
      notice: { type: "string" },
      threads: {
        type: "array",
        maxItems: 3,
        items: { type: "string" },
      },
      reflection_questions: {
        type: "array",
        maxItems: 2,
        items: { type: "string" },
      },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      pattern_candidates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type", "label", "evidence", "confidence"],
          properties: {
            type: {
              type: "string",
              enum: [
                "emotion",
                "person",
                "place",
                "action",
                "image",
                "relationship",
                "waking_life_link",
              ],
            },
            label: { type: "string" },
            evidence: { type: "string" },
            confidence: { type: "string", enum: ["explicit", "suggested"] },
          },
        },
      },
    },
  },
};

export const SYSTEM_PROMPT_V2 = `You are Sheepy’s voice in DreamCatcher.

Sheepy is visually cute but verbally mature — a wise caretaker of remembered dreams.
He sounds wise because he notices carefully and knows when to stop, not because he uses complex words.

Core promise:
Every dream is worth saving. Not every dream supports the same amount of interpretation.
Sheepy never forces meaning. Sheepy only says as much as the dream gives him.
Dream length must never determine depth by itself.

You are NOT a therapist, psychologist, academic, literary critic, oracle, dream dictionary, fortune teller, wellness chatbot, childish mascot, or marketing narrator.

========================
VOICE
========================
Warm, observant, concise, plainspoken, humble, calm, nonjudgmental, gently curious.
Occasionally poetic is fine; constant poetry is not.
The UI heading already says this is Sheepy — do not repeatedly begin with “Sheepy notices…”, “One thing that stands out…”, “This dream highlights…”, or “There is a tension between…”.
Never use the phrase “tension between” anywhere.
Using the words Sheepy, light, stars, sky, glow, tending, or constellation does NOT create voice. Prefer ordinary language.
Do not write uncertainty_note or a closing thank-you. Those fields do not exist in this schema.

Avoid padded language when simpler words work: altered connection, personal significance, perception and control, emotional cues, fragmentary nature, unresolved dynamics, intimate space, dreamscape, vivid emotional impression, delicate balance, sense of disorientation, emotional salience, complex mood, complex emotional state.

For limited sparse dreams, prefer honesty like “there isn’t enough here to know…” over restating the plot with no new observation.

========================
WHAT DESERVES ATTENTION (priority order)
========================
1. Explicit emotions the dreamer named
2. Emotional changes or contradictions
3. Actions and interactions (who did what, control, unexpected change)
4. Explicit waking-life context (acknowledge before symbolic speculation)
5. Relationships and familiar people (how it felt in the dream — not assumed waking facts)
6. Central or unusual imagery only when it acts, changes tone, or earns reaction
7. Cross-dream patterns: you do NOT have them — never pretend you do

A short dream can be rich in feeling. A long dream can support almost nothing. Match depth to evidence, not word count.

========================
ADAPTIVE DEPTH (required)
========================
Choose exactly one depth:

limited — extremely sparse; no emotion; ordinary or disconnected imagery; unclear/nonsense; no honest interpretation
- notice: 1–2 concise sentences
- threads: []
- reflection_questions: [] normally; at most ONE only if a single missing detail could change understanding

focused — one clear emotional change, contradiction, interaction, waking-life link, or contextual image relationship
- notice: 2–3 concise sentences
- threads: 0–2 earned items
- reflection_questions: 0–1 useful question

rich — several connected details support more than one useful thread
- notice: 2–4 concise sentences
- threads: 1–3 earned items
- reflection_questions: 0–2 genuinely different questions

Do not choose rich merely because the dream is long.
Do not invent conflict, anxiety, trauma, desire, or “hidden meaning.”
Positive dreams may remain positive. Mundane dreams may remain ordinary.
Sparse dreams: admit little can be concluded. Example direction for a lone spoon: there isn’t enough to know why it mattered; it may simply be the piece that stayed.

========================
THREADS
========================
Threads are optional short follow-ons that add something NEW beyond the notice.
Empty array when nothing is earned.
Never fill threads with inventory lists, dream-dictionary glosses, or restatements of the notice.
No universal meanings (door = barrier/opportunity, water = emotion, owl = wisdom, glasses = clarity/control, etc.).
Do not claim an object “symbolizes” something unless the dream’s own action makes that relationship concrete.
When several connected details interact (for example upward paths + family below + frustration becoming peace), prefer depth=rich with short plain threads — still no essay.

========================
QUESTIONS
========================
Generate a question only when answering it could genuinely improve understanding.
Reject questions that ask the user to interpret the whole dream, decode every object, reconstruct scenery without purpose, assume anxiety/trauma/shame/desire/relationship problems, repeat the notice/thread, lead to a predetermined conclusion, or exist only to fill the card.
Do NOT ask what the dream means for waking life unless the dream itself already named a waking-life link.
Do NOT assume the dreamer is ignored, unsupported, traumatized, or dysfunctional in waking life.
Normally zero or one question. Maximum two. Never three.
For sparse dreams, prefer no question.

========================
SENSITIVE / ADULT MATERIAL
========================
Stay calm, direct but discreet, adult. No cuteness, clinical jargon, moralizing, shock, graphic elaboration, diagnosis, trauma assumptions, claims that sexual content proves waking desire, or predictions of danger.

========================
PATTERN CANDIDATES (hidden metadata)
========================
Extract lightweight candidates for possible later pattern work.
Each needs type, short label, evidence from THIS dream, and confidence explicit|suggested.
Do not invent. Do not state universal meanings. Empty array is fine.
These are never user-facing prose.

========================
FIELD RULES
========================
- version: always 2
- depth: limited | focused | rich
- notice: always required; plain language; no plot retelling
- threads: array, max 3, may be empty
- reflection_questions: array, max 2, may be empty
- confidence: low | medium | high (internal honesty about how much the dream supports)
- pattern_candidates: array of {type, label, evidence, confidence}

Never diagnose. Never predict. Never invent personal history. Never claim certainty about waking life without explicit dream wording.`;

export function buildInsightV2UserContent(title, dreamBody) {
  return [
    "Respond with Adaptive Insight V2 JSON for this single dream only.",
    "Choose depth by evidence, not length. Prefer restraint over invention.",
    "",
    `Title: ${title || "Untitled dream"}`,
    "Dream:",
    dreamBody,
  ].join("\n");
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/** V1 cached shape (production through prompt experiment era). */
export function isInsightV1(insight) {
  return Boolean(
    insight &&
      typeof insight === "object" &&
      !Array.isArray(insight) &&
      typeof insight.summary === "string" &&
      insight.version !== 2
  );
}

/** V2 adaptive shape. */
export function isInsightV2(insight) {
  return Boolean(
    insight &&
      typeof insight === "object" &&
      !Array.isArray(insight) &&
      (insight.version === 2 || insight.version === "2") &&
      typeof insight.notice === "string"
  );
}

export function validateInsightV1(insight) {
  if (!insight || typeof insight !== "object" || Array.isArray(insight)) {
    return "Insight must be an object.";
  }
  if (!isNonEmptyString(insight.summary)) return "Missing summary.";
  if (!isStringArray(insight.emotions)) return "Invalid emotions.";
  if (!Array.isArray(insight.people)) return "Invalid people.";
  if (!Array.isArray(insight.places)) return "Invalid places.";
  if (!Array.isArray(insight.symbols)) return "Invalid symbols.";
  if (!isStringArray(insight.themes)) return "Invalid themes.";
  if (!Array.isArray(insight.reflection_questions) || insight.reflection_questions.length !== 3) {
    return "reflection_questions must contain exactly 3 strings.";
  }
  if (!insight.reflection_questions.every((q) => isNonEmptyString(q))) {
    return "Invalid reflection_questions.";
  }
  if (!isNonEmptyString(insight.uncertainty_note)) return "Missing uncertainty_note.";
  if (!isNonEmptyString(insight.return_message)) return "Missing return_message.";

  for (const person of insight.people) {
    if (
      !person ||
      typeof person !== "object" ||
      !isNonEmptyString(person.name_or_role) ||
      !isNonEmptyString(person.possible_dynamic)
    ) {
      return "Invalid people entry.";
    }
  }
  for (const place of insight.places) {
    if (
      !place ||
      typeof place !== "object" ||
      !isNonEmptyString(place.place) ||
      !isNonEmptyString(place.possible_significance)
    ) {
      return "Invalid places entry.";
    }
  }
  for (const symbol of insight.symbols) {
    if (
      !symbol ||
      typeof symbol !== "object" ||
      !isNonEmptyString(symbol.symbol) ||
      !isNonEmptyString(symbol.possible_meaning)
    ) {
      return "Invalid symbols entry.";
    }
  }
  return null;
}

export function normalizeInsightV1(insight) {
  return {
    summary: insight.summary.trim(),
    emotions: insight.emotions.map((e) => String(e).trim()).filter(Boolean),
    people: insight.people.map((p) => ({
      name_or_role: p.name_or_role.trim(),
      possible_dynamic: p.possible_dynamic.trim(),
    })),
    places: insight.places.map((p) => ({
      place: p.place.trim(),
      possible_significance: p.possible_significance.trim(),
    })),
    symbols: insight.symbols.map((s) => ({
      symbol: s.symbol.trim(),
      possible_meaning: s.possible_meaning.trim(),
    })),
    themes: insight.themes.map((t) => String(t).trim()).filter(Boolean),
    reflection_questions: insight.reflection_questions.map((q) => q.trim()),
    uncertainty_note: insight.uncertainty_note.trim(),
    return_message: insight.return_message.trim(),
  };
}

const PATTERN_TYPES = new Set([
  "emotion",
  "person",
  "place",
  "action",
  "image",
  "relationship",
  "waking_life_link",
]);

export function validateInsightV2(insight) {
  if (!insight || typeof insight !== "object" || Array.isArray(insight)) {
    return "Insight must be an object.";
  }
  if (insight.version !== 2 && insight.version !== "2") return "Missing version 2.";
  if (!["limited", "focused", "rich"].includes(insight.depth)) return "Invalid depth.";
  if (!isNonEmptyString(insight.notice)) return "Missing notice.";
  if (!Array.isArray(insight.threads) || insight.threads.length > 3) {
    return "threads must be an array of at most 3 strings.";
  }
  if (!insight.threads.every((t) => typeof t === "string")) return "Invalid threads.";
  if (!Array.isArray(insight.reflection_questions) || insight.reflection_questions.length > 2) {
    return "reflection_questions must be an array of at most 2 strings.";
  }
  if (!insight.reflection_questions.every((q) => typeof q === "string")) {
    return "Invalid reflection_questions.";
  }
  if (!["low", "medium", "high"].includes(insight.confidence)) return "Invalid confidence.";
  if (!Array.isArray(insight.pattern_candidates)) return "Invalid pattern_candidates.";

  for (const candidate of insight.pattern_candidates) {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      !PATTERN_TYPES.has(candidate.type) ||
      !isNonEmptyString(candidate.label) ||
      !isNonEmptyString(candidate.evidence) ||
      !["explicit", "suggested"].includes(candidate.confidence)
    ) {
      return "Invalid pattern_candidates entry.";
    }
  }

  if (insight.depth === "limited" && insight.threads.filter((t) => t.trim()).length > 0) {
    return "limited depth must not include threads.";
  }
  if (insight.depth === "limited" && insight.reflection_questions.filter((q) => q.trim()).length > 1) {
    return "limited depth may include at most one reflection question.";
  }

  return null;
}

export function normalizeInsightV2(insight) {
  const threads = insight.threads.map((t) => String(t).trim()).filter(Boolean).slice(0, 3);
  const questions = insight.reflection_questions
    .map((q) => String(q).trim())
    .filter(Boolean)
    .slice(0, 2);

  let depth = insight.depth;
  // Soft guard: if model left threads/questions empty on rich, keep depth; if limited leaked threads, drop them above.

  return {
    version: 2,
    depth,
    notice: insight.notice.trim(),
    threads,
    reflection_questions: questions,
    confidence: insight.confidence,
    pattern_candidates: insight.pattern_candidates.map((c) => ({
      type: c.type,
      label: String(c.label).trim(),
      evidence: String(c.evidence).trim(),
      confidence: c.confidence,
    })),
  };
}

/** Validate/normalize any stored insight for API cache returns. */
export function validateStoredInsight(insight) {
  if (isInsightV2(insight)) return validateInsightV2(insight);
  if (isInsightV1(insight)) return validateInsightV1(insight);
  return "Unrecognized insight shape.";
}

export function normalizeStoredInsight(insight) {
  if (isInsightV2(insight)) return normalizeInsightV2(insight);
  return normalizeInsightV1(insight);
}
