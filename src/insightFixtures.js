/**
 * LOCAL UI FIXTURES for Adaptive Insight V2 — NOT real model output.
 * Used by insight-v2-fixture-preview.html and automated DOM checks.
 */

export const FIXTURE_NOTE =
  "FIXTURE — synthetic text for UI state testing. Not a model generation.";

export const insightFixtures = {
  limitedNoticeOnly: {
    _fixture: true,
    version: 2,
    depth: "limited",
    notice:
      "There isn’t enough here to know why the spoon mattered. It may simply be the piece that stayed with you.",
    threads: [],
    reflection_questions: [],
    confidence: "low",
    pattern_candidates: [
      {
        type: "image",
        label: "spoon",
        evidence: "spoon on a table is the only retained image",
        confidence: "explicit",
      },
    ],
  },

  limitedWithQuestion: {
    _fixture: true,
    version: 2,
    depth: "limited",
    notice:
      "Only a closed red door remains. Without how it felt, there isn’t much to conclude beyond that one held detail.",
    threads: [],
    reflection_questions: [
      "Do you remember how you felt when the door would not open, or only the image itself?",
    ],
    confidence: "low",
    pattern_candidates: [],
  },

  focusedWithThreads: {
    _fixture: true,
    version: 2,
    depth: "focused",
    notice:
      "Tomorrow’s meeting is already named in the dream. The dead phone charger sits next to that pressure rather than replacing it.",
    threads: [
      "The waking concern about the meeting is the clearest thread.",
      "The charger fails at the worst practical moment, amplifying urgency already stated.",
    ],
    reflection_questions: [
      "When you picture the meeting now, is the dead charger still part of the worry, or mostly noise?",
    ],
    confidence: "medium",
    pattern_candidates: [
      {
        type: "waking_life_link",
        label: "important meeting tomorrow",
        evidence: "dreamer states an important meeting tomorrow",
        confidence: "explicit",
      },
    ],
  },

  richMultiThread: {
    _fixture: true,
    version: 2,
    depth: "rich",
    notice:
      "Every path takes you higher while your family stays below. The frustration eases into a quieter peace once you stop fighting the climb.",
    threads: [
      "Moving upward is the only route the building allows.",
      "Family remains downstairs, present but not reachable by the same path.",
      "The feeling shifts from frustration into peace without a grand ending.",
    ],
    reflection_questions: [
      "What changed for you when the frustration gave way to peace?",
      "Does staying above, with family below, feel lonely, protective, or something else?",
    ],
    confidence: "high",
    pattern_candidates: [],
  },

  positiveBeach: {
    _fixture: true,
    version: 2,
    depth: "focused",
    notice:
      "You name feeling completely safe. The dream holds that steadiness without asking for a hidden problem underneath.",
    threads: ["Safety is stated plainly — there is no need to invent threat around it."],
    reflection_questions: [],
    confidence: "medium",
    pattern_candidates: [
      {
        type: "emotion",
        label: "completely safe",
        evidence: "dreamer says they felt completely safe",
        confidence: "explicit",
      },
    ],
  },

  mundaneGroceries: {
    _fixture: true,
    version: 2,
    depth: "limited",
    notice:
      "You forgot the milk, went back, and woke up. It reads like an ordinary errand correcting itself — not much more is earned from what’s here.",
    threads: [],
    reflection_questions: [],
    confidence: "low",
    pattern_candidates: [],
  },

  sexualFriend: {
    _fixture: true,
    version: 2,
    depth: "focused",
    notice:
      "During the dream the closeness with your friend felt natural. After waking, embarrassment arrived. That contrast is clearer than any claim about waking desire.",
    threads: [
      "Naturalness inside the dream and embarrassment afterward do not cancel each other — both are present.",
    ],
    reflection_questions: [
      "Does the embarrassment feel tied to the dream itself, or to the thought of someone knowing?",
    ],
    confidence: "medium",
    pattern_candidates: [],
  },

  violentKnife: {
    _fixture: true,
    version: 2,
    depth: "focused",
    notice:
      "A child threatens you while using a private childhood nickname. Familiarity and danger sit in the same figure.",
    threads: [
      "The nickname is intimate knowledge — that detail carries more weight than a generic threat.",
    ],
    reflection_questions: [
      "What felt stranger — the threat itself, or that the child knew what only someone close would know?",
    ],
    confidence: "medium",
    pattern_candidates: [],
  },

  /** Legacy V1 cached shape — must still render. */
  legacyV1: {
    _fixture: true,
    summary:
      "The image of a red door that refuses to open may capture a feeling of frustration or resistance around a boundary.",
    emotions: ["frustration"],
    people: [],
    places: [{ place: "doorway", possible_significance: "a threshold that stays closed" }],
    symbols: [{ symbol: "red door", possible_meaning: "a barrier or opportunity that stays shut" }],
    themes: ["boundaries"],
    reflection_questions: [
      "What might the red door represent?",
      "What feelings arise when you imagine it opening?",
      "Where else do you feel stuck?",
    ],
    uncertainty_note: "This is one possible reading, not a certainty.",
    return_message: "Thank you for sharing this dream-light with Sheepy’s sky.",
  },
};

export const fixtureLabels = {
  limitedNoticeOnly: "1. Limited — notice only",
  limitedWithQuestion: "2. Limited — one question",
  focusedWithThreads: "3. Focused — threads + question",
  richMultiThread: "4. Rich — multiple threads",
  positiveBeach: "5. Positive dream stays positive",
  mundaneGroceries: "6. Mundane — no forced depth",
  sexualFriend: "8. Sexual — mature tone (fixture)",
  violentKnife: "9. Violent — non-diagnostic (fixture)",
  legacyV1: "10. Legacy V1 cached Insight",
};
