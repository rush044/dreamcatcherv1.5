/**
 * Sol + adaptive-v2.2 offline evaluation only.
 * Reuses frozen 14-dream comparison set. Does not regenerate Mini or Sol V2.1.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import OpenAI from "openai";
import {
  INSIGHT_V2_MODEL,
  INSIGHT_V2_PROMPT_VERSION,
  INSIGHT_V2_SCHEMA_VERSION,
  SYSTEM_PROMPT_V2,
  normalizeInsightV2,
  validateInsightV2,
} from "../../lib/insight-v2.mjs";
import { generateInsightWithSol } from "../../lib/insight-v2-openai.mjs";
import { COMPARISON_DREAMS } from "./comparison-dreams.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "eval-outputs", "insight-v2-sol-v2-2");
const V21_ALL = path.join(ROOT, "eval-outputs", "insight-v2-mini-vs-sol", "all-results.json");

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

function detectReportOpening(notice) {
  const lower = String(notice || "").toLowerCase();
  const phrases = [
    "the dream includes",
    "the dream centers on",
    "the dream highlights",
    "the dream shares",
    "the dream shows",
    "the dream captures",
    "the dream suggests",
  ];
  return phrases.find((p) => lower.startsWith(p)) || null;
}

function optionalityMetrics(rows) {
  const ok = rows.filter((r) => r.insight);
  let withThreads = 0;
  let withQuestions = 0;
  let noticeOnly = 0;
  let threadCount = 0;
  let questionCount = 0;
  let dreamer = 0;
  let report = 0;
  let latency = 0;
  let tokensIn = 0;
  let tokensOut = 0;
  let reasoning = 0;
  let cost = 0;
  const depth = { limited: 0, focused: 0, rich: 0 };

  for (const r of ok) {
    const t = r.insight.threads.length;
    const q = r.insight.reflection_questions.length;
    threadCount += t;
    questionCount += q;
    if (t) withThreads += 1;
    if (q) withQuestions += 1;
    if (!t && !q) noticeOnly += 1;
    depth[r.insight.depth] = (depth[r.insight.depth] || 0) + 1;
    const text = [r.insight.notice, ...r.insight.threads, ...r.insight.reflection_questions].join("\n");
    if (/\bthe dreamer\b/i.test(text)) dreamer += 1;
    if (detectReportOpening(r.insight.notice)) report += 1;
    latency += r.latency_ms || 0;
    tokensIn += r.usage?.input_tokens || 0;
    tokensOut += r.usage?.output_tokens || 0;
    reasoning += r.usage?.reasoning_tokens || 0;
    cost += r.estimated_cost_usd || 0;
  }

  return {
    count: ok.length,
    depth_distribution: depth,
    notice_only_rate: ok.length ? Number((noticeOnly / ok.length).toFixed(2)) : null,
    threads_presence_rate: ok.length ? Number((withThreads / ok.length).toFixed(2)) : null,
    questions_presence_rate: ok.length ? Number((withQuestions / ok.length).toFixed(2)) : null,
    avg_thread_count: ok.length ? Number((threadCount / ok.length).toFixed(2)) : null,
    avg_question_count: ok.length ? Number((questionCount / ok.length).toFixed(2)) : null,
    pct_the_dreamer: ok.length ? Number(((dreamer / ok.length) * 100).toFixed(1)) : null,
    pct_report_opening: ok.length ? Number(((report / ok.length) * 100).toFixed(1)) : null,
    latency_avg_ms: ok.length ? Math.round(latency / ok.length) : null,
    tokens: { input: tokensIn, output: tokensOut, reasoning },
    estimated_cost_usd: Number(cost.toFixed(6)),
  };
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

async function main() {
  await loadEnvLocal();
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY unavailable.");
    process.exit(2);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const promptHash = createHash("sha256").update(SYSTEM_PROMPT_V2).digest("hex");
  console.log(`Sol V2.2 eval model=${INSIGHT_V2_MODEL} prompt=${INSIGHT_V2_PROMPT_VERSION}`);
  console.log(`Prompt sha256=${promptHash.slice(0, 12)}… dreams=${COMPARISON_DREAMS.length}`);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const rows = [];

  for (const dream of COMPARISON_DREAMS) {
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
      const row = {
        dream_id: dream.id,
        dream_title: dream.title,
        dream_type: dream.type,
        dream_text: dream.text,
        synthetic_label: dream.synthetic_label,
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
        api_error: null,
        raw_content: gen.rawContent,
      };
      rows.push(row);
      await writeFile(path.join(OUT_DIR, `raw-${dream.id}.json`), JSON.stringify(row, null, 2), "utf8");
      if (validation_error) console.log(`VALIDATION ${validation_error}`);
      else {
        console.log(
          `ok depth=${insight.depth} threads=${insight.threads.length} q=${insight.reflection_questions.length}`
        );
      }
    } catch (error) {
      const row = {
        dream_id: dream.id,
        dream_title: dream.title,
        dream_text: dream.text,
        model: INSIGHT_V2_MODEL,
        prompt_version: INSIGHT_V2_PROMPT_VERSION,
        schema_version: INSIGHT_V2_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        insight: null,
        validation_error: null,
        api_error: error?.message || String(error),
      };
      rows.push(row);
      console.log(`FAIL ${row.api_error}`);
      await writeFile(path.join(OUT_DIR, `raw-${dream.id}.json`), JSON.stringify(row, null, 2), "utf8");
    }
  }

  const v21All = JSON.parse(await readFile(V21_ALL, "utf8"));
  const v21Sol = v21All.filter((r) => r.model === "gpt-5.6-sol");
  const metricsV22 = optionalityMetrics(rows);
  const metricsV21 = optionalityMetrics(v21Sol);

  const summary = {
    run_id: new Date().toISOString().replace(/[:.]/g, "-"),
    model: INSIGHT_V2_MODEL,
    prompt_version: INSIGHT_V2_PROMPT_VERSION,
    prompt_sha256: promptHash,
    schema_version: INSIGHT_V2_SCHEMA_VERSION,
    database_writes: false,
    v2_2: metricsV22,
    v2_1_sol_baseline: metricsV21,
    results: rows,
  };

  await writeFile(path.join(OUT_DIR, "all-results.json"), JSON.stringify(rows, null, 2), "utf8");
  await writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2), "utf8");

  // Human review artifact (8 cases)
  const reviewIds = ["C02", "C04", "C05", "C15", "C14", "C09", "L02", "L04"];
  const review = [];
  review.push("# Insight V2 — Sol adaptive-v2.1 vs adaptive-v2.2 Review");
  review.push("");
  review.push("Working model: `gpt-5.6-sol` (confirmed by blind human review).");
  review.push("Question: does adaptive-v2.2 improve optionality without losing Sol’s strengths?");
  review.push("");
  review.push("Not blind — labels are intentional.");
  review.push("");
  review.push("## Optionality snapshot");
  review.push("");
  review.push("| Metric | Sol V2.1 | Sol V2.2 |");
  review.push("|---|---:|---:|");
  review.push(`| Notice-only rate | ${metricsV21.notice_only_rate} | ${metricsV22.notice_only_rate} |`);
  review.push(`| Threads presence | ${metricsV21.threads_presence_rate} | ${metricsV22.threads_presence_rate} |`);
  review.push(`| Questions presence | ${metricsV21.questions_presence_rate} | ${metricsV22.questions_presence_rate} |`);
  review.push(`| Avg threads | ${metricsV21.avg_thread_count} | ${metricsV22.avg_thread_count} |`);
  review.push(`| Avg questions | ${metricsV21.avg_question_count} | ${metricsV22.avg_question_count} |`);
  review.push(`| % “the dreamer” | ${metricsV21.pct_the_dreamer}% | ${metricsV22.pct_the_dreamer}% |`);
  review.push(`| % report opening | ${metricsV21.pct_report_opening}% | ${metricsV22.pct_report_opening}% |`);
  review.push(`| Avg latency ms | ${metricsV21.latency_avg_ms} | ${metricsV22.latency_avg_ms} |`);
  review.push(`| Est. cost USD | ${metricsV21.estimated_cost_usd} | ${metricsV22.estimated_cost_usd} |`);
  review.push("");
  review.push("---");
  review.push("");

  for (const id of reviewIds) {
    const dream = COMPARISON_DREAMS.find((d) => d.id === id);
    const v21 = v21Sol.find((r) => r.dream_id === id);
    const v22 = rows.find((r) => r.dream_id === id);
    review.push(`## ${dream.title}`);
    review.push("");
    if (dream.synthetic_label) review.push(`**${dream.synthetic_label}**`);
    review.push("");
    review.push("### Dream text");
    review.push("");
    review.push(`> ${dream.text}`);
    review.push("");
    review.push("### V2.1");
    review.push("");
    review.push(formatVisible(v21?.insight));
    review.push("");
    review.push(`Depth: ${v21?.insight?.depth ?? "n/a"} · Visible sections: ${sectionCount(v21?.insight)}`);
    review.push("");
    review.push("### V2.2");
    review.push("");
    review.push(formatVisible(v22?.insight));
    review.push("");
    review.push(`Depth: ${v22?.insight?.depth ?? "n/a"} · Visible sections: ${sectionCount(v22?.insight)}`);
    review.push("");
    review.push("**Better:** V2.1 / V2.2 / Tie");
    review.push("");
    review.push("**Reason:**");
    review.push("");
    review.push("> ");
    review.push("");
    review.push("**Comfortable shipping V2.2:** Yes / No");
    review.push("");
    review.push("---");
    review.push("");
  }

  await writeFile(path.join(ROOT, "INSIGHT_V2_SOL_V2_1_VS_V2_2_REVIEW.md"), review.join("\n"), "utf8");

  console.log("V2.1 metrics", metricsV21);
  console.log("V2.2 metrics", metricsV22);
  console.log(`Wrote ${OUT_DIR}`);
  console.log("Wrote INSIGHT_V2_SOL_V2_1_VS_V2_2_REVIEW.md");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
