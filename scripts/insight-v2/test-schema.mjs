import {
  validateInsightV2,
  normalizeInsightV2,
  validateInsightV1,
  isInsightV1,
  isInsightV2,
  validateStoredInsight,
} from "../../lib/insight-v2.mjs";

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

const v2 = {
  version: 2,
  depth: "limited",
  notice: "Not enough here.",
  threads: [],
  reflection_questions: [],
  confidence: "low",
  pattern_candidates: [
    {
      type: "image",
      label: "spoon",
      evidence: "only retained image",
      confidence: "explicit",
    },
  ],
};

assert(validateInsightV2(v2) === null, "valid v2");
assert(isInsightV2(v2), "isInsightV2");
const norm = normalizeInsightV2(v2);
assert(norm.version === 2 && norm.threads.length === 0, "normalize v2");

const badLimited = { ...v2, threads: ["extra"] };
assert(validateInsightV2(badLimited), "limited cannot have threads");

const tooManyQ = {
  ...v2,
  depth: "focused",
  reflection_questions: ["a", "b", "c"],
};
assert(validateInsightV2(tooManyQ), "max 2 questions");

const v1 = {
  summary: "Hello",
  emotions: [],
  people: [],
  places: [],
  symbols: [],
  themes: [],
  reflection_questions: ["a", "b", "c"],
  uncertainty_note: "maybe",
  return_message: "bye",
};
assert(validateInsightV1(v1) === null, "valid v1");
assert(isInsightV1(v1), "isInsightV1");
assert(validateStoredInsight(v1) === null, "stored v1");
assert(validateStoredInsight(v2) === null, "stored v2");

if (failures.length) {
  console.error("Schema tests FAILED");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}
console.log("Schema tests PASSED");
