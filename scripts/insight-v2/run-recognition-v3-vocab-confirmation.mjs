/**
 * Focused confirmation: 3 recognition-v3 outputs after vocabulary correction.
 * Does not overwrite prior blind eval artifacts.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import {
  INSIGHT_RECOGNITION_V3_PROMPT_VERSION,
  INSIGHT_V2_MODEL,
  INSIGHT_V2_SCHEMA_VERSION,
  normalizeInsightV2,
  validateInsightV2,
} from "../../lib/insight-v2.mjs";
import { generateInsightWithSol, SOL_REQUEST_SETTINGS } from "../../lib/insight-v2-openai.mjs";
import { RECOGNITION_FIXTURES } from "../insight-v3/recognition-fixtures.mjs";
import { COMPARISON_DREAMS } from "./comparison-dreams.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "eval-outputs", "insight-recognition-v3-vocab-correction");
const BASELINE_DIR = path.join(ROOT, "eval-outputs", "insight-recognition-v3-vs-v2-2-1", "raw");

const CASES = [
  { case_id: "BLIND-01", fixture_id: "R10", baseline_file: "BLIND-01-gen-01.json" },
  { case_id: "BLIND-03", fixture_id: "C04", baseline_file: "BLIND-03-gen-05.json" },
  { case_id: "BLIND-06", fixture_id: "L04", baseline_file: "BLIND-06-gen-11.json" },
];

async function loadEnvLocal() {
  try {
    const raw = await readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env) || !process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

function resolveDream(fixtureId) {
  const r = RECOGNITION_FIXTURES.find((f) => f.id === fixtureId);
  if (r) return { title: r.title, body: r.text, source: `recognition-fixtures.mjs#${fixtureId}` };
  const c = COMPARISON_DREAMS.find((d) => d.id === fixtureId);
  if (c) return { title: c.title, body: c.text, source: `comparison-dreams.mjs#${fixtureId}` };
  throw new Error(`Missing fixture ${fixtureId}`);
}

function flagVocab(text) {
  const patterns = [
    /anticipatory rehearsal/i,
    /under rehearsal/i,
    /rehearsing/i,
    /practicing how/i,
    /\bpracticing\b/i,
    /your mind is trying out/i,
    /your mind trying out/i,
    /your mind is rehearsing/i,
    /your mind is testing/i,
  ];
  return patterns.filter((p) => p.test(text)).map((p) => p.source);
}

async function main() {
  await loadEnvLocal();
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const results = [];
  let paidCalls = 0;

  for (const spec of CASES) {
    const dream = resolveDream(spec.fixture_id);
    const baseline = JSON.parse(await readFile(path.join(BASELINE_DIR, spec.baseline_file), "utf8"));

    console.log(`Generating ${spec.case_id} — ${dream.title}…`);
    const generated = await generateInsightWithSol(openai, { title: dream.title, body: dream.body });
    paidCalls += 1;

    const parsed = JSON.parse(generated.rawContent);
    const validationError = validateInsightV2(parsed);
    if (validationError) {
      console.error(`Schema failed ${spec.case_id}: ${validationError}`);
      process.exit(1);
    }

    const insight = normalizeInsightV2(parsed);
    const visible = [insight.notice, ...(insight.threads || []), ...(insight.reflection_questions || [])].join(
      "\n"
    );

    const row = {
      case_id: spec.case_id,
      fixture_id: spec.fixture_id,
      input_source: dream.source,
      title: dream.title,
      dream_body: dream.body,
      prompt_version: INSIGHT_RECOGNITION_V3_PROMPT_VERSION,
      correction_note: "vocabulary correction round — same identifier, updated prompt text",
      model: INSIGHT_V2_MODEL,
      reasoning_effort: SOL_REQUEST_SETTINGS.reasoning_effort,
      schema_version: INSIGHT_V2_SCHEMA_VERSION,
      completion_model: generated.completionModel,
      timestamp: new Date().toISOString(),
      usage: {
        input_tokens: generated.usage.input_tokens,
        cached_input_tokens: null,
        output_tokens: generated.usage.output_tokens,
        total_tokens: generated.usage.total_tokens,
        reasoning_tokens: generated.usage.reasoning_tokens,
      },
      validation_error: null,
      vocab_flags: flagVocab(visible),
      raw_content: generated.rawContent,
      insight,
      baseline_winner_file: spec.baseline_file,
      baseline_notice: baseline.insight.notice,
      baseline_vocab_flags: flagVocab(
        [baseline.insight.notice, ...(baseline.insight.threads || []), ...(baseline.insight.reflection_questions || [])].join(
          "\n"
        )
      ),
    };

    results.push(row);
    await writeFile(path.join(OUT_DIR, `${spec.case_id}-corrected.json`), JSON.stringify(row, null, 2), "utf8");
  }

  const totalUsage = results.reduce(
    (acc, r) => {
      acc.input_tokens += r.usage.input_tokens || 0;
      acc.output_tokens += r.usage.output_tokens || 0;
      acc.total_tokens += r.usage.total_tokens || 0;
      acc.reasoning_tokens += r.usage.reasoning_tokens || 0;
      return acc;
    },
    { input_tokens: 0, output_tokens: 0, total_tokens: 0, reasoning_tokens: 0 }
  );

  await writeFile(
    path.join(OUT_DIR, "run-summary.json"),
    JSON.stringify(
      {
        paid_calls_executed: paidCalls,
        schema_validation: "all_pass",
        prompt_version: INSIGHT_RECOGNITION_V3_PROMPT_VERSION,
        model: INSIGHT_V2_MODEL,
        reasoning_effort: SOL_REQUEST_SETTINGS.reasoning_effort,
        total_usage: totalUsage,
        cases: results.map((r) => ({
          case_id: r.case_id,
          vocab_flags: r.vocab_flags,
          baseline_vocab_flags: r.baseline_vocab_flags,
          usage: r.usage,
        })),
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Done. ${paidCalls} calls. Wrote ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
