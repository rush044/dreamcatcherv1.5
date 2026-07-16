/**
 * Recognition V3.0 evaluation — one generation per fixture (default max suite).
 * Objective checks only. Does not score emotional taste.
 *
 * Planned paid calls: RECOGNITION_FIXTURES.length (11).
 * Preserves every raw output exactly under eval-outputs/insight-v3-recognition/.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import OpenAI from "openai";
import {
  INSIGHT_V2_MODEL,
  INSIGHT_V2_PROMPT_VERSION,
  INSIGHT_V2_PROMPT_VERSION_FALLBACK,
  INSIGHT_V2_SCHEMA_VERSION,
  SYSTEM_PROMPT_RECOGNITION_V3,
  SYSTEM_PROMPT_V2,
  normalizeInsightV2,
  validateInsightV2,
} from "../../lib/insight-v2.mjs";
import { generateInsightWithSol } from "../../lib/insight-v2-openai.mjs";
import { RECOGNITION_FIXTURES, RECOGNITION_EVAL_META } from "./recognition-fixtures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "eval-outputs", "insight-v3-recognition");

const COST_SOL = { input: 5.0, output: 30.0 };

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

function estimateCost(usage) {
  const input = usage?.input_tokens || 0;
  const output = usage?.output_tokens || 0;
  return Number(((input * COST_SOL.input + output * COST_SOL.output) / 1_000_000).toFixed(6));
}

function objectiveFlags(fixture, insight) {
  const issues = [];
  if (!insight) return ["missing insight"];

  const notice = insight.notice || "";
  const threads = insight.threads || [];
  const questions = insight.reflection_questions || [];
  const all = [notice, ...threads, ...questions].join("\n");

  if (/\bthe dreamer\b/i.test(all)) issues.push("uses the dreamer");
  if (
    /^(your dream contains|this dream moves through|you felt|the dream reflects themes|there are symbols of|the dream (shows|includes|centers|highlights|suggests))/i.test(
      notice.trim()
    )
  ) {
    issues.push("report-like or summary opening");
  }

  if (threads.length > 2) issues.push("more than 2 threads (product target)");
  if (questions.length > 1) issues.push("more than 1 question (product target)");

  // Object-like thread heuristic: very short noun phrases that look like renamed scenes.
  for (const t of threads) {
    if (/^(the |your )?(church|hotel|shooting|notebook|dog|emotions|anxiety|change|transformation)\b/i.test(t.trim())) {
      issues.push(`possible object/label thread: ${t}`);
    }
  }

  if (fixture.id === "R10") {
    if (/\b(panic|panicked|terrified|anxious|anxiety attack)\b/i.test(all)) {
      issues.push("Thursday Review: invented panic/anxiety");
    }
    if (notice.split(/\s+/).length < 40 && /slides|chart|review|label/i.test(notice) && !/recover|prepar|disrupt|hold|competence|test/i.test(notice)) {
      issues.push("Thursday Review: possible recap-only notice");
    }
  }

  if (fixture.id === "R11") {
    if (
      /\b(no longer (wanted|cared|desired)|gave up|stopped (wanting|caring|desiring)|lost (interest|desire|commitment|motivation|intention))\b/i.test(
        all
      )
    ) {
      issues.push("Room 714: peace converted into lost desire/commitment");
    }
  }

  if (fixture.id === "R01") {
    if (/\b(wanted him (dead|harmed)|wish(ed)? (him )?dead|hoped .+ (die|died))\b/i.test(all)) {
      issues.push("Clavicular: wish-for-harm claim");
    }
  }

  if (fixture.id === "R02") {
    if (/\byou (secretly )?miss your mother\b/i.test(all) && /should reconnect/i.test(all)) {
      issues.push("Family search: invasive reconnect claim");
    }
  }

  if (fixture.id === "R09") {
    const hasPersonal =
      /grandmother|mango|primary school|village|safety|family history/i.test(all);
    const onlyGeneric =
      /\b(stuck|losing control|emotional weight|the past)\b/i.test(all) && !hasPersonal;
    if (onlyGeneric) issues.push("Simi: generic labels without personal map");
  }

  return issues;
}

async function main() {
  await loadEnvLocal();
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing. Load .env.local or set the variable.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const promptChars = SYSTEM_PROMPT_RECOGNITION_V3.length;
  const fallbackChars = SYSTEM_PROMPT_V2.length;
  const promptHash = createHash("sha256").update(SYSTEM_PROMPT_RECOGNITION_V3).digest("hex");
  const fallbackHash = createHash("sha256").update(SYSTEM_PROMPT_V2).digest("hex");

  console.log("=== Recognition V3 evaluation (objective) ===");
  console.log(`Active prompt: ${INSIGHT_V2_PROMPT_VERSION}`);
  console.log(`Fallback preserved: ${INSIGHT_V2_PROMPT_VERSION_FALLBACK}`);
  console.log(`Model: ${INSIGHT_V2_MODEL}`);
  console.log(`Planned paid calls: ${RECOGNITION_EVAL_META.planned_paid_calls}`);
  console.log(`Runtime system prompt chars: ${promptChars} (~${Math.round(promptChars / 4)} tokens)`);
  console.log(`Fallback adaptive-v2.2.1 chars: ${fallbackChars} (~${Math.round(fallbackChars / 4)} tokens)`);
  console.log(`Prompt sha256: ${promptHash.slice(0, 16)}…`);
  console.log(`Fallback sha256: ${fallbackHash.slice(0, 16)}…`);
  console.log("Human taste is NOT scored here.\n");

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const results = [];
  let paidCalls = 0;

  for (const fixture of RECOGNITION_FIXTURES) {
    console.log(`Generating ${fixture.id} — ${fixture.title}…`);
    let rawContent = "";
    let usage = null;
    let completionModel = INSIGHT_V2_MODEL;
    let insight = null;
    let validationError = null;
    let error = null;

    try {
      const generated = await generateInsightWithSol(openai, {
        title: fixture.title,
        body: fixture.text,
      });
      paidCalls += 1;
      rawContent = generated.rawContent;
      usage = generated.usage;
      completionModel = generated.completionModel;

      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch (e) {
        validationError = `JSON parse failed: ${e.message}`;
      }

      if (!validationError) {
        validationError = validateInsightV2(parsed);
        if (!validationError) insight = normalizeInsightV2(parsed);
      }
    } catch (e) {
      error = e?.message || String(e);
    }

    const acceptance_issues = insight ? objectiveFlags(fixture, insight) : ["missing insight"];
    const record = {
      id: fixture.id,
      title: fixture.title,
      category: fixture.category,
      context_mode: fixture.context_mode,
      prompt_version: INSIGHT_V2_PROMPT_VERSION,
      schema_version: INSIGHT_V2_SCHEMA_VERSION,
      model: completionModel,
      expected: fixture.expected,
      validation_error: validationError,
      error,
      acceptance_issues,
      insight,
      usage,
      estimated_cost_usd: estimateCost(usage),
      raw_content: rawContent,
      dream_text: fixture.text,
    };

    results.push(record);
    await writeFile(path.join(OUT_DIR, `raw-${fixture.id}.json`), JSON.stringify(record, null, 2), "utf8");
    console.log(
      `  ${fixture.id}: schema=${validationError ? "FAIL" : "ok"} objective_issues=${acceptance_issues.length}`
    );
  }

  const summary = {
    prompt_version: INSIGHT_V2_PROMPT_VERSION,
    fallback_prompt_version: INSIGHT_V2_PROMPT_VERSION_FALLBACK,
    schema_version: INSIGHT_V2_SCHEMA_VERSION,
    model: INSIGHT_V2_MODEL,
    planned_paid_calls: RECOGNITION_EVAL_META.planned_paid_calls,
    paid_calls_executed: paidCalls,
    prompt_chars: promptChars,
    prompt_approx_tokens: Math.round(promptChars / 4),
    fallback_chars: fallbackChars,
    prompt_sha256: promptHash,
    fallback_sha256: fallbackHash,
    note:
      "Objective checks only. Emotional recognition quality requires authenticated human review. Raw outputs are preserved without editorial rewrite.",
    results: results.map((r) => ({
      id: r.id,
      title: r.title,
      validation_error: r.validation_error,
      error: r.error,
      acceptance_issues: r.acceptance_issues,
      depth: r.insight?.depth ?? null,
      thread_count: r.insight?.threads?.length ?? 0,
      question_count: r.insight?.reflection_questions?.length ?? 0,
      notice_word_count: r.insight ? r.insight.notice.split(/\s+/).filter(Boolean).length : 0,
      estimated_cost_usd: r.estimated_cost_usd,
    })),
  };

  await writeFile(path.join(OUT_DIR, "all-results.json"), JSON.stringify(results, null, 2), "utf8");
  await writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2), "utf8");

  const rawDump = results
    .map((r) => {
      return [
        `===== ${r.id} ${r.title} =====`,
        `validation_error: ${r.validation_error || "none"}`,
        `error: ${r.error || "none"}`,
        `acceptance_issues: ${JSON.stringify(r.acceptance_issues)}`,
        "",
        "RAW OUTPUT (exact):",
        r.raw_content || "(empty)",
        "",
      ].join("\n");
    })
    .join("\n");

  await writeFile(path.join(OUT_DIR, "raw-outputs-exact.txt"), rawDump, "utf8");

  console.log(`\nWrote ${OUT_DIR}`);
  console.log(`Paid calls executed: ${paidCalls}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
