/**
 * Paired blind evaluation: recognition-v3.0 vs adaptive-v2.2.1
 * Six dreams × two prompts = 12 model calls (no retries unless technical failure aborts).
 *
 * Outputs: eval-outputs/insight-recognition-v3-vs-v2-2-1/
 *   - blind-review.md          (no prompt/version identity)
 *   - answer-key.json          (mapping — not for blind review)
 *   - run-summary.json         (counts/tokens — no A/B mapping)
 *   - raw/*.json               (opaque generation ids)
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomInt } from "node:crypto";
import OpenAI from "openai";
import {
  INSIGHT_RECOGNITION_V3_PROMPT_VERSION,
  INSIGHT_V2_MODEL,
  INSIGHT_V2_PROMPT_VERSION_FALLBACK,
  INSIGHT_V2_SCHEMA_VERSION,
  SYSTEM_PROMPT_RECOGNITION_V3,
  SYSTEM_PROMPT_V2,
  buildInsightRecognitionV3UserContent,
  buildInsightV2UserContent,
  normalizeInsightV2,
  validateInsightV2,
} from "../../lib/insight-v2.mjs";
import { generateInsightWithSol, SOL_REQUEST_SETTINGS } from "../../lib/insight-v2-openai.mjs";
import { RECOGNITION_FIXTURES } from "../insight-v3/recognition-fixtures.mjs";
import { COMPARISON_DREAMS } from "./comparison-dreams.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "eval-outputs", "insight-recognition-v3-vs-v2-2-1");
const RAW_DIR = path.join(OUT_DIR, "raw");

const PROMPT_VARIANTS = {
  recognition_v3: {
    prompt_version: INSIGHT_RECOGNITION_V3_PROMPT_VERSION,
    systemPrompt: SYSTEM_PROMPT_RECOGNITION_V3,
    userContentBuilder: buildInsightRecognitionV3UserContent,
    builder_name: "buildInsightRecognitionV3UserContent",
  },
  adaptive_v2_2_1: {
    prompt_version: INSIGHT_V2_PROMPT_VERSION_FALLBACK,
    systemPrompt: SYSTEM_PROMPT_V2,
    userContentBuilder: buildInsightV2UserContent,
    builder_name: "buildInsightV2UserContent",
  },
};

/** Stable blind case order — canonical input resolution below. */
const BLIND_CASES = [
  { case_id: "BLIND-01", title: "The Thursday Review", fixture_keys: ["R10"] },
  { case_id: "BLIND-02", title: "Room 714", fixture_keys: ["R11"] },
  { case_id: "BLIND-03", title: "The Meeting", fixture_keys: ["C04"] },
  { case_id: "BLIND-04", title: "The Hotel", fixture_keys: ["C09"] },
  { case_id: "BLIND-05", title: "Long bizarre dream", fixture_keys: ["L02"] },
  { case_id: "BLIND-06", title: "Long relationship dream with contradictory emotions", fixture_keys: ["L04"] },
];

function resolveCanonicalDreams() {
  const byRecognitionId = Object.fromEntries(RECOGNITION_FIXTURES.map((f) => [f.id, f]));
  const byComparisonId = Object.fromEntries(COMPARISON_DREAMS.map((d) => [d.id, d]));

  const resolved = [];
  for (const spec of BLIND_CASES) {
    const key = spec.fixture_keys[0];
    let source;
    let record;

    if (key.startsWith("R")) {
      record = byRecognitionId[key];
      if (!record) throw new Error(`Missing recognition fixture: ${key}`);
      source = `scripts/insight-v3/recognition-fixtures.mjs#${key}`;
    } else {
      record = byComparisonId[key];
      if (!record) throw new Error(`Missing comparison dream: ${key}`);
      source = `scripts/insight-v2/comparison-dreams.mjs#${key}`;
    }

    if (record.title !== spec.title && spec.title !== "Room 714") {
      // L04 title in comparison-dreams is "Long relationship dream with contradictory emotions"
      if (!(spec.case_id === "BLIND-06" && record.title.includes("Long relationship"))) {
        throw new Error(`Title mismatch for ${spec.case_id}: expected "${spec.title}", got "${record.title}"`);
      }
    }

    resolved.push({
      case_id: spec.case_id,
      display_title: spec.title,
      fixture_id: key,
      input_source: source,
      title: record.title,
      dream_body: record.text,
      context_mode: record.context_mode ?? "dream_only",
      waking_context: record.waking_context ?? null,
      category: record.category ?? record.type ?? null,
    });
  }
  return resolved;
}

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

function formatVisibleInsight(insight) {
  if (!insight) return "_No insight returned._";
  const lines = ["**What Sheepy noticed**", "", insight.notice, ""];
  if (insight.threads?.length) {
    lines.push("**Threads Sheepy found**", "");
    for (const t of insight.threads) lines.push(`- ${t}`);
    lines.push("");
  }
  if (insight.reflection_questions?.length) {
    lines.push("**Something to sit with**", "");
    for (const q of insight.reflection_questions) lines.push(`- ${q}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function usageFromResponse(usage) {
  return {
    input_tokens: usage?.input_tokens ?? null,
    cached_input_tokens: usage?.cached_input_tokens ?? usage?.input_tokens_details?.cached_tokens ?? null,
    output_tokens: usage?.output_tokens ?? null,
    total_tokens: usage?.total_tokens ?? null,
    reasoning_tokens: usage?.reasoning_tokens ?? usage?.output_tokens_details?.reasoning_tokens ?? null,
  };
}

async function generateOne(openai, variantKey, dream) {
  const variant = PROMPT_VARIANTS[variantKey];
  const userContent = variant.userContentBuilder(dream.title, dream.dream_body);

  const generated = await generateInsightWithSol(openai, {
    title: dream.title,
    body: dream.dream_body,
    systemPrompt: variant.systemPrompt,
    userContentBuilder: variant.userContentBuilder,
  });

  let parsed;
  try {
    parsed = JSON.parse(generated.rawContent);
  } catch (error) {
    const err = new Error(`JSON parse failed for ${dream.case_id} ${variantKey}: ${error.message}`);
    err.rawContent = generated.rawContent;
    throw err;
  }

  const validationError = validateInsightV2(parsed);
  if (validationError) {
    const err = new Error(`Schema validation failed for ${dream.case_id} ${variantKey}: ${validationError}`);
    err.rawContent = generated.rawContent;
    err.parsed = parsed;
    throw err;
  }

  const insight = normalizeInsightV2(parsed);

  return {
    variant_key: variantKey,
    prompt_version: variant.prompt_version,
    system_prompt_binding: variantKey === "recognition_v3" ? "SYSTEM_PROMPT_RECOGNITION_V3" : "SYSTEM_PROMPT_V2",
    user_content_builder: variant.builder_name,
    user_content_exact: userContent,
    model: INSIGHT_V2_MODEL,
    reasoning_effort: SOL_REQUEST_SETTINGS.reasoning_effort,
    schema_version: INSIGHT_V2_SCHEMA_VERSION,
    completion_model: generated.completionModel,
    usage: usageFromResponse(generated.usage),
    raw_content: generated.rawContent,
    insight,
    validation_error: null,
    timestamp: new Date().toISOString(),
  };
}

function buildBlindReviewMarkdown(cases) {
  const lines = [
    "# Insight blind review — paired outputs",
    "",
    "Rate each case without knowing which output used which prompt direction.",
    "Do not open `answer-key.json` until you have finished scoring every case.",
    "",
    "---",
    "",
  ];

  for (const c of cases) {
    lines.push(`## ${c.case_id} — ${c.display_title}`, "");
    lines.push("### Dream input", "");
    lines.push(`**Title:** ${c.title}`, "");
    lines.push(`**Context mode:** ${c.context_mode}`, "");
    if (c.waking_context) {
      lines.push("", "**Waking context (included in dream body):**", "", c.waking_context, "");
    } else {
      lines.push("", "**Waking context:** none beyond what appears in the dream text below.", "");
    }
    lines.push("**Dream text (exact):**", "", "> " + c.dream_body.split("\n").join("\n> "), "", "");
    lines.push("### Output A", "", formatVisibleInsight(c.output_a.insight), "", "");
    lines.push("### Output B", "", formatVisibleInsight(c.output_b.insight), "", "");
    lines.push("### Review form", "");
    lines.push("**Cognitive value:**");
    lines.push("- A: 1–5");
    lines.push("- B: 1–5");
    lines.push("");
    lines.push("**Emotional quality:**");
    lines.push("- A: 1–5");
    lines.push("- B: 1–5");
    lines.push("");
    lines.push("**Overall:**");
    lines.push("- A / B / Tie");
    lines.push("");
    lines.push("**Guard failures:**");
    lines.push("- unsupported inference");
    lines.push("- repetition");
    lines.push("- polished-but-empty");
    lines.push("- overcompression");
    lines.push("- forced or leading question");
    lines.push("- other");
    lines.push("");
    lines.push("**Would I want Sheepy to say this?**");
    lines.push("- A: Yes / No");
    lines.push("- B: Yes / No");
    lines.push("");
    lines.push("**Optional notes:**");
    lines.push("- What felt meaningful?");
    lines.push("- What felt wrong or generic?");
    lines.push("- What did Sheepy notice that the dreamer had not already typed?");
    lines.push("");
    lines.push("---", "");
  }

  return lines.join("\n");
}

async function main() {
  await loadEnvLocal();
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing. Set in .env.local or environment.");
    process.exit(1);
  }

  const dreams = resolveCanonicalDreams();
  console.log("Resolved canonical inputs for 6 dreams.");
  for (const d of dreams) {
    console.log(`  ${d.case_id} ${d.fixture_id} ← ${d.input_source}`);
  }

  await mkdir(RAW_DIR, { recursive: true });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const generations = [];
  let paidCalls = 0;

  for (const dream of dreams) {
    for (const variantKey of ["recognition_v3", "adaptive_v2_2_1"]) {
      console.log(`Generating ${dream.case_id} — ${variantKey}…`);
      try {
        const row = await generateOne(openai, variantKey, dream);
        paidCalls += 1;
        generations.push({ ...row, case_id: dream.case_id, dream });
      } catch (error) {
        console.error(`FAILED ${dream.case_id} ${variantKey}:`, error.message);
        await writeFile(
          path.join(OUT_DIR, "run-failure.json"),
          JSON.stringify(
            {
              failed_at_call: paidCalls + 1,
              case_id: dream.case_id,
              variant_key: variantKey,
              message: error.message,
              raw_content: error.rawContent ?? null,
            },
            null,
            2
          ),
          "utf8"
        );
        process.exit(1);
      }
    }
  }

  if (paidCalls !== 12) {
    console.error(`Expected 12 calls, got ${paidCalls}`);
    process.exit(1);
  }

  // Opaque raw filenames — mapping only in answer-key.json
  let genIndex = 0;
  for (const g of generations) {
    genIndex += 1;
    const opaqueId = `gen-${String(genIndex).padStart(2, "0")}`;
    g.opaque_generation_id = opaqueId;
    await writeFile(
      path.join(RAW_DIR, `${g.case_id}-${opaqueId}.json`),
      JSON.stringify(
        {
          case_id: g.case_id,
          opaque_generation_id: opaqueId,
          fixture_id: g.dream.fixture_id,
          input_source: g.dream.input_source,
          title: g.dream.title,
          dream_body: g.dream.dream_body,
          context_mode: g.dream.context_mode,
          prompt_version: g.prompt_version,
          system_prompt_binding: g.system_prompt_binding,
          user_content_builder: g.user_content_builder,
          user_content_exact: g.user_content_exact,
          model: g.model,
          reasoning_effort: g.reasoning_effort,
          schema_version: g.schema_version,
          completion_model: g.completion_model,
          timestamp: g.timestamp,
          usage: g.usage,
          validation_error: g.validation_error,
          raw_content: g.raw_content,
          insight: g.insight,
        },
        null,
        2
      ),
      "utf8"
    );
  }

  const answerKeyCases = [];
  const blindCases = [];

  for (const dream of dreams) {
    const v3 = generations.find((g) => g.case_id === dream.case_id && g.variant_key === "recognition_v3");
    const v221 = generations.find((g) => g.case_id === dream.case_id && g.variant_key === "adaptive_v2_2_1");

    if (!v3 || !v221) {
      console.error(`Missing pair for ${dream.case_id}`);
      process.exit(1);
    }

    const sameDreamEvidence =
      v3.dream.title === v221.dream.title && v3.dream.dream_body === v221.dream.dream_body;
    if (!sameDreamEvidence) {
      console.error(`Dream evidence mismatch within pair ${dream.case_id}`);
      process.exit(1);
    }

    const v3IsA = randomInt(2) === 0;
    const outputA = v3IsA ? v3 : v221;
    const outputB = v3IsA ? v221 : v3;

    blindCases.push({
      case_id: dream.case_id,
      display_title: dream.display_title,
      title: dream.title,
      dream_body: dream.dream_body,
      context_mode: dream.context_mode,
      waking_context: dream.waking_context,
      fixture_id: dream.fixture_id,
      input_source: dream.input_source,
      output_a: { insight: outputA.insight, opaque_generation_id: outputA.opaque_generation_id },
      output_b: { insight: outputB.insight, opaque_generation_id: outputB.opaque_generation_id },
    });

    answerKeyCases.push({
      case_id: dream.case_id,
      display_title: dream.display_title,
      fixture_id: dream.fixture_id,
      input_source: dream.input_source,
      title: dream.title,
      dream_body: dream.dream_body,
      context_mode: dream.context_mode,
      input_integrity: {
        identical_title: v3.dream.title === v221.dream.title,
        identical_dream_body: v3.dream.dream_body === v221.dream.dream_body,
        identical_context_mode: v3.dream.context_mode === v221.dream.context_mode,
        recognition_v3_user_content: v3.user_content_exact,
        adaptive_v2_2_1_user_content: v221.user_content_exact,
      },
      blind_labels: {
        A: {
          prompt_version: outputA.prompt_version,
          variant_key: outputA.variant_key,
          opaque_generation_id: outputA.opaque_generation_id,
          raw_file: `raw/${dream.case_id}-${outputA.opaque_generation_id}.json`,
        },
        B: {
          prompt_version: outputB.prompt_version,
          variant_key: outputB.variant_key,
          opaque_generation_id: outputB.opaque_generation_id,
          raw_file: `raw/${dream.case_id}-${outputB.opaque_generation_id}.json`,
        },
      },
      generations: {
        recognition_v3: {
          opaque_generation_id: v3.opaque_generation_id,
          prompt_version: v3.prompt_version,
          system_prompt_binding: v3.system_prompt_binding,
          user_content_builder: v3.user_content_builder,
        },
        adaptive_v2_2_1: {
          opaque_generation_id: v221.opaque_generation_id,
          prompt_version: v221.prompt_version,
          system_prompt_binding: v221.system_prompt_binding,
          user_content_builder: v221.user_content_builder,
        },
      },
    });
  }

  const totalUsage = generations.reduce(
    (acc, g) => {
      acc.input_tokens += g.usage.input_tokens || 0;
      acc.cached_input_tokens += g.usage.cached_input_tokens || 0;
      acc.output_tokens += g.usage.output_tokens || 0;
      acc.total_tokens += g.usage.total_tokens || 0;
      acc.reasoning_tokens += g.usage.reasoning_tokens || 0;
      return acc;
    },
    { input_tokens: 0, cached_input_tokens: 0, output_tokens: 0, total_tokens: 0, reasoning_tokens: 0 }
  );

  const runSummary = {
    run_id: new Date().toISOString(),
    branch: "insight/recognition-v3-reevaluation",
    paid_calls_executed: paidCalls,
    pairs_complete: blindCases.length,
    schema_validation: "all_pass",
    input_pair_integrity: "identical_title_body_context_within_each_pair",
    model: INSIGHT_V2_MODEL,
    reasoning_effort: SOL_REQUEST_SETTINGS.reasoning_effort,
    schema_version: INSIGHT_V2_SCHEMA_VERSION,
    prompt_versions_used: [INSIGHT_RECOGNITION_V3_PROMPT_VERSION, INSIGHT_V2_PROMPT_VERSION_FALLBACK],
    blind_packet: "blind-review.md",
    answer_key: "answer-key.json",
    total_usage: totalUsage,
    per_call_usage: generations.map((g) => ({
      case_id: g.case_id,
      opaque_generation_id: g.opaque_generation_id,
      prompt_version: g.prompt_version,
      usage: g.usage,
    })),
    note: "A/B mapping is stored only in answer-key.json",
  };

  await writeFile(path.join(OUT_DIR, "run-summary.json"), JSON.stringify(runSummary, null, 2), "utf8");
  await writeFile(
    path.join(OUT_DIR, "answer-key.json"),
    JSON.stringify({ cases: answerKeyCases, total_usage: totalUsage }, null, 2),
    "utf8"
  );
  await writeFile(path.join(OUT_DIR, "blind-review.md"), buildBlindReviewMarkdown(blindCases), "utf8");

  console.log(`\nDone. ${paidCalls} calls, ${blindCases.length} pairs.`);
  console.log(`Wrote ${OUT_DIR}`);
  console.log("Blind packet: blind-review.md");
  console.log("Answer key: answer-key.json (do not open until review complete)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
