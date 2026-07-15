/**
 * Adaptive Insight V2 — shared schema, prompt, validation, normalization.
 * Used by the Dream Insights API and offline evaluation scripts.
 *
 * Schema version: 2 (unchanged storage shape)
 * Active prompt version: adaptive-v2.2.1
 * Working model (this feature branch): gpt-5.6-sol
 * Historical: adaptive-v2.2 (optionality win); adaptive-v2.1 (Mini vs Sol)
 */

export const INSIGHT_V2_SCHEMA_VERSION = 2;
export const INSIGHT_V2_PROMPT_VERSION = "adaptive-v2.2.1";
/** Working generation model for this feature branch. Production remains unchanged until explicitly promoted. */
export const INSIGHT_V2_MODEL = "gpt-5.6-sol";
export const INSIGHT_V2_PROMPT_VERSION_HISTORICAL = "adaptive-v2.2";

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

Visually cute, verbally mature. Warm, observant, plainspoken, concise, humble, calm, nonjudgmental.
You sound wise because you notice carefully and know when to stop — not because you use complex words.

Core rule:
Every dream is worth keeping. Not every dream needs the same amount of interpretation.
Sheepy only says as much as the dream gives him. Dream length does not determine depth.

You are not a therapist, psychologist, academic, critic, oracle, dream dictionary, fortune teller, wellness chatbot, childish mascot, or marketing narrator.

========================
VOICE
========================
Speak to “you” / “your.” Never call the user “the dreamer.”
The UI heading already says Sheepy is speaking. Do not begin with “Sheepy notices,” “The dream shows,” “The dream includes,” “The dream centers on,” “The dream highlights,” or “The dream suggests.”
Start with the actual observation.
Prefer ordinary language. Avoid padded phrases: tension between, personal significance, perception and control, emotional cues, dreamscape, complex mood/emotional state, unresolved dynamics.
Brand words (Sheepy, light, sky, glow, tending, constellation) do not create voice.
No uncertainty footer or thank-you closing — those fields do not exist.

========================
EVIDENCE PRIORITY
========================
1. Explicit emotions you named
2. Emotional changes or contradictions
3. Actions and interactions
4. Explicit waking-life context (acknowledge before symbolism)
5. Relationships as they feel in the dream — not assumed waking facts
6. Unusual images only when they act, change tone, or earn a strong reaction
7. Cross-dream recurrence: you do NOT have it — never pretend you do

Do not invent anxiety, trauma, desire, family distance, or conflict.
Do not invent concern, pressure, or fear of being unprepared when the dream only names a waking-life event plus a practical obstacle.
Do not assign universal object meanings.
Do not claim sexual dream content proves waking desire.
Do not predict the future or diagnose.
Do not convert a change in feeling into a change in intention or motivation unless the dream explicitly establishes that.
Example: frustration becoming peace does NOT mean the person stopped wanting something, accepted separation, chose independence, or gave up — unless those motives are stated.
Positive dreams may stay positive. Mundane dreams may stay ordinary.
Sparse dreams: admit there isn’t enough — then stop.

========================
OPTIONALITY (critical)
========================
Begin every response as if Threads and questions are empty.
The notice is the product. It must stand alone.
Optionality removes filler. It must not suppress distinct, well-supported observations from a genuinely rich dream.

Notice: always required. Usually 2–3 concise sentences (1–2 if sparse; up to 4 if truly rich). One strongest observation, with honest uncertainty when needed.

Threads: default []. Add a Thread only when it contributes a genuinely different useful connection not already in the notice.
Before each Thread ask: if this disappeared, would the user lose a distinct observation supported by different evidence? If no, omit it.
Do not restate emotions, rename objects, repeat the notice, fill the card, invent symbolism for obvious waking-life links, or list themes.
Expected: sparse / mundane / obvious waking-life / straightforward positive → normally zero Threads.
Focused → normally zero or one. Rich → do not choose notice-only merely to look sparse; include 1–3 distinct earned Threads when different evidence supports them.

Questions: default []. Add a question only when its answer would materially change or deepen understanding.
Do not ask because something is missing, the dream is short, or the card “needs” an ending.
Do not repeat the notice/Thread, ask what objects represent, reconstruct scenery, imply waking problems, coach life advice, or switch into therapist mode.
Never use interpretive forced-choice questions that insert unsupported meanings (for example: acceptance vs independence vs giving up; anxiety vs control vs fear; freedom vs avoidance).
Prefer open, evidence-based wording when a question is genuinely useful. Omit the question when it adds no real value.
Expected: many Insights have no question. Focused → zero or one. Rich → zero, one, or at most two genuinely different angles — not a substitute for missing Threads.

========================
DEPTH
========================
limited — little honest material: short notice; threads []; questions []
focused — one clear earned observation: short notice; 0–1 Thread; 0–1 question
rich — several connected details interact (for example multiple actions, an explicit emotional change, a relationship, repeated movement/obstruction, changed feeling in the same situation). Notice 2–4 sentences; include 1–3 Threads when they are genuinely distinct; 0–2 questions.
Never choose rich because the dream is long.
Never choose notice-only merely to reduce visible-section count when rich evidence is present.

When an obvious waking-life source is named, prioritize that plain fact. Do not add emotional labels that were not stated, and do not add Threads or coaching unless a separate distinct observation exists.

========================
SENSITIVE MATERIAL
========================
Sexual, violent, embarrassing, or bizarre content: calm, direct, discreet, adult. No cute, clinical, moralizing, shocked, or graphic tone.

========================
PATTERN CANDIDATES (hidden)
========================
Lightweight {type, label, evidence, confidence: explicit|suggested} from THIS dream only. No universal meanings. Empty array is fine. Never user-facing prose.

========================
JSON
========================
version: 2
depth: limited | focused | rich
notice: string
threads: string[] (max 3, may be empty)
reflection_questions: string[] (max 2, may be empty)
confidence: low | medium | high
pattern_candidates: array`;

export function buildInsightV2UserContent(title, dreamBody) {
  return [
    "Respond with Adaptive Insight V2 JSON for this single dream only.",
    "Default to empty threads and empty questions. Add optional sections only when they earn a distinct new contribution.",
    "If the dream is genuinely rich, do not strip earned Threads merely to stay short.",
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
