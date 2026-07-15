/**
 * Targeted adaptive-v2.2.1 regression — 4 dreams only.
 * Reuses Sol V2.2 outputs as baseline. Does not regenerate Mini/V2.1/full V2.2 set.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import {
  INSIGHT_V2_MODEL,
  INSIGHT_V2_PROMPT_VERSION,
  INSIGHT_V2_SCHEMA_VERSION,
  normalizeInsightV2,
  validateInsightV2,
} from "../../lib/insight-v2.mjs";
import { generateInsightWithSol } from "../../lib/insight-v2-openai.mjs";
import { COMPARISON_DREAMS } from "./comparison-dreams.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "eval-outputs", "insight-v2-sol-v2-2-1");
const V22_ALL = path.join(ROOT, "eval-outputs", "insight-v2-sol-v2-2", "all-results.json");

const TARGET_IDS = ["C04", "C09", "L02", "L04"];
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

function formatVisible(insight) {
  if (!insight) return "_Missing._";
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
  return lines.join("\n");
}

function sectionCount(insight) {
  if (!insight) return 0;
  let n = 1;
  if (insight.threads?.length) n += 1;
  if (insight.reflection_questions?.length) n += 1;
  return n;
}

function checkAcceptance(id, insight) {
  const issues = [];
  if (!insight) return ["missing insight"];
  const text = [insight.notice, ...(insight.threads || []), ...(insight.reflection_questions || [])].join(
    "\n"
  );
  if (/\bthe dreamer\b/i.test(text)) issues.push("uses the dreamer");
  if (/^the dream (shows|includes|centers|highlights|suggests)/i.test(insight.notice)) {
    issues.push("report-like opening");
  }

  if (id === "C04") {
    if ((insight.threads || []).length > 0) issues.push("Meeting: unexpected threads");
    if ((insight.reflection_questions || []).length > 0) issues.push("Meeting: unexpected question");
    if (/\b(anxiety|anxious|concern|pressure|fear of being unprepared|control)\b/i.test(insight.notice)) {
      issues.push("Meeting: invented emotional label");
    }
  }

  if (id === "C09") {
    const badMotivation =
      /\b(chose independence|gave up|accepted (the )?separation|accepted (family )?distance|need to get back (disappeared|vanished)|desire to return disappeared)\b/i.test(
        text
      ) && !/\b(does not|doesn't|not necessarily|not mean|without)\b/i.test(text);
    // Explicit denials of motivation-shift are allowed / desired.
    if (/\bstopped wanting\b/i.test(text) && !/\b(does not|doesn't|not necessarily|not mean)\b/i.test(text)) {
      issues.push("Hotel: emotion converted to motivation");
    } else if (badMotivation) {
      issues.push("Hotel: emotion converted to motivation");
    }
    if (
      /\b(acceptance|independence|giving up)\b/i.test(
        (insight.reflection_questions || []).join(" ")
      ) &&
      /\bor\b/i.test((insight.reflection_questions || []).join(" "))
    ) {
      issues.push("Hotel: interpretive forced-choice question");
    }
    if ((insight.threads || []).length === 0 && insight.depth !== "rich") {
      issues.push("Hotel: missing earned threads/rich depth");
    }
  }

  if (id === "L02") {
    if ((insight.threads || []).length === 0) issues.push("Long bizarre: lost rich threads");
    // questions optional; fine if zero
  }

  if (id === "L04") {
    if (!/\b(pride|proud|grief|sad)/i.test(text)) {
      issues.push("Long relationship: missing pride/grief tension");
    }
  }

  return issues;
}

async function main() {
  await loadEnvLocal();
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY unavailable.");
    process.exit(2);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const v22All = JSON.parse(await readFile(V22_ALL, "utf8"));
  const dreams = COMPARISON_DREAMS.filter((d) => TARGET_IDS.includes(d.id));
  const rows = [];
  let hardFail = false;

  console.log(`Targeted v2.2.1 eval model=${INSIGHT_V2_MODEL} prompt=${INSIGHT_V2_PROMPT_VERSION}`);

  for (const dream of dreams) {
    process.stdout.write(`${dream.id} ${dream.title}... `);
    const started = Date.now();
    try {
      const gen = await generateInsightWithSol(openai, {
        title: dream.title,
        body: dream.text,
      });
      const latency_ms = Date.now() - started;
      let insight = null;
      let validation_error = null;
      try {
        const parsed = JSON.parse(gen.rawContent);
        validation_error = validateInsightV2(parsed);
        if (!validation_error) insight = normalizeInsightV2(parsed);
      } catch (error) {
        validation_error = error.message || String(error);
      }
      const acceptance_issues = checkAcceptance(dream.id, insight);
      if (
        acceptance_issues.some((i) =>
          /missing insight|Hotel: emotion|Hotel: interpretive|Meeting: invented|uses the dreamer|report-like/.test(
            i
          )
        )
      ) {
        hardFail = true;
      }
      if (dream.id === "C09" && acceptance_issues.includes("Hotel: missing earned threads/rich depth")) {
        hardFail = true;
      }
      if (dream.id === "L02" && acceptance_issues.includes("Long bizarre: lost rich threads")) {
        hardFail = true;
      }

      const row = {
        dream_id: dream.id,
        dream_title: dream.title,
        dream_text: dream.text,
        model: INSIGHT_V2_MODEL,
        completion_model: gen.completionModel,
        prompt_version: INSIGHT_V2_PROMPT_VERSION,
        schema_version: INSIGHT_V2_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        latency_ms,
        usage: gen.usage,
        estimated_cost_usd: estimateCost(gen.usage),
        insight,
        validation_error,
        acceptance_issues,
        api_error: null,
        raw_content: gen.rawContent,
      };
      rows.push(row);
      await writeFile(path.join(OUT_DIR, `raw-${dream.id}.json`), JSON.stringify(row, null, 2), "utf8");
      console.log(
        `${validation_error ? "VALIDATION" : "ok"} depth=${insight?.depth} t=${insight?.threads?.length ?? 0} q=${insight?.reflection_questions?.length ?? 0} issues=${acceptance_issues.join(";") || "none"}`
      );
    } catch (error) {
      hardFail = true;
      const row = {
        dream_id: dream.id,
        dream_title: dream.title,
        dream_text: dream.text,
        model: INSIGHT_V2_MODEL,
        prompt_version: INSIGHT_V2_PROMPT_VERSION,
        schema_version: INSIGHT_V2_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        insight: null,
        api_error: error?.message || String(error),
        acceptance_issues: ["api_error"],
      };
      rows.push(row);
      console.log(`FAIL ${row.api_error}`);
      await writeFile(path.join(OUT_DIR, `raw-${dream.id}.json`), JSON.stringify(row, null, 2), "utf8");
    }
  }

  const summary = {
    prompt_version: INSIGHT_V2_PROMPT_VERSION,
    model: INSIGHT_V2_MODEL,
    hard_fail: hardFail,
    database_writes: false,
    results: rows,
  };
  await writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
  await writeFile(path.join(OUT_DIR, "all-results.json"), JSON.stringify(rows, null, 2), "utf8");

  // Append targeted section to existing review doc
  const reviewPath = path.join(ROOT, "INSIGHT_V2_SOL_V2_1_VS_V2_2_REVIEW.md");
  let review = await readFile(reviewPath, "utf8");
  const marker = "## Adaptive-v2.2.1 targeted regression";
  if (review.includes(marker)) {
    review = review.slice(0, review.indexOf(marker)).trimEnd() + "\n";
  }

  const add = [];
  add.push("");
  add.push(marker);
  add.push("");
  add.push(
    "Narrow correction after human review: restore earned rich depth without undoing V2.2 optionality. Prompt version: `adaptive-v2.2.1`."
  );
  add.push("");
  add.push(`Hard acceptance fail: **${hardFail ? "yes" : "no"}**`);
  add.push("");

  for (const id of TARGET_IDS) {
    const dream = COMPARISON_DREAMS.find((d) => d.id === id);
    const v22 = v22All.find((r) => r.dream_id === id);
    const v221 = rows.find((r) => r.dream_id === id);
    add.push(`### ${dream.title}`);
    add.push("");
    add.push(`> ${dream.text}`);
    add.push("");
    add.push("#### V2.2");
    add.push("");
    add.push(formatVisible(v22?.insight));
    add.push(`Depth: ${v22?.insight?.depth ?? "n/a"} · Visible sections: ${sectionCount(v22?.insight)}`);
    add.push("");
    add.push("#### V2.2.1");
    add.push("");
    add.push(formatVisible(v221?.insight));
    add.push(
      `Depth: ${v221?.insight?.depth ?? "n/a"} · Visible sections: ${sectionCount(v221?.insight)} · Issues: ${(v221?.acceptance_issues || []).join(", ") || "none"}`
    );
    add.push("");
    add.push("**Better:** V2.2 / V2.2.1 / Tie");
    add.push("");
    add.push("**Reason:**");
    add.push("");
    add.push("> ");
    add.push("");
    add.push("**Comfortable shipping V2.2.1:** Yes / No");
    add.push("");
  }

  await writeFile(reviewPath, review.trimEnd() + "\n" + add.join("\n") + "\n", "utf8");
  console.log(`Wrote ${OUT_DIR}`);
  console.log("Updated INSIGHT_V2_SOL_V2_1_VS_V2_2_REVIEW.md");
  process.exit(hardFail ? 2 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
