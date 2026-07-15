/**
 * Offline Adaptive Insight V2 evaluation (gpt-4.1-mini only).
 * - Direct OpenAI calls only
 * - No Supabase / DreamCatcher login / DB writes
 * - Does not modify production env vars
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import {
  INSIGHT_V2_JSON_SCHEMA,
  INSIGHT_V2_MODEL,
  INSIGHT_V2_PROMPT_VERSION,
  INSIGHT_V2_SCHEMA_VERSION,
  SYSTEM_PROMPT_V2,
  buildInsightV2UserContent,
  normalizeInsightV2,
  validateInsightV2,
} from "../../lib/insight-v2.mjs";
import { CALIBRATION_DREAMS, CALIBRATION_SOURCE } from "./calibration-dreams.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "eval-outputs", "insight-v2");

const COMPLEX_PHRASES = [
  "altered connection",
  "personal significance",
  "perception and control",
  "emotional cues",
  "fragmentary nature",
  "unresolved dynamics",
  "intimate space",
  "dreamscape",
  "vivid emotional impression",
  "delicate balance",
  "sense of disorientation",
  "emotional salience",
  "complex mood",
  "tension between",
];

const STOCK_OPENERS = [
  "sheepy notices",
  "one thing that stands out",
  "this dream highlights",
  "there is a tension between",
  "this dream captures",
];

const BRAND_WORDS = /\b(sheepy|constellation|dream-light|tending)\b/i;

function loadEnvLocal() {
  // Best-effort load of OPENAI_API_KEY from .env.local without printing values.
  return readFile(path.join(ROOT, ".env.local"), "utf8")
    .then((raw) => {
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
        if (!(key in process.env) || !process.env[key]) {
          process.env[key] = value;
        }
      }
    })
    .catch(() => {
      /* optional */
    });
}

function clampScore(n) {
  return Math.max(1, Math.min(5, Math.round(n)));
}

function visibleText(insight) {
  return [insight.notice, ...(insight.threads || []), ...(insight.reflection_questions || [])]
    .join("\n")
    .toLowerCase();
}

function scoreInsight(dream, insight) {
  const text = visibleText(insight);
  const notice = String(insight.notice || "");
  const threads = insight.threads || [];
  const questions = insight.reflection_questions || [];
  const depth = insight.depth;

  let noticing = 3;
  let plain = 4;
  let restraint = 4;
  let sheepy = 3;
  let nonDup = 4;
  let threadQ = threads.length ? 3 : 4;
  let questionQ = questions.length ? 3 : 4;
  let sensitive = 4;
  let safety = 5;
  let commercial = 3;

  // Cap triggers / heuristics (supporting evidence only)
  const complexHits = COMPLEX_PHRASES.filter((p) => text.includes(p));
  if (complexHits.length) {
    plain = Math.min(plain, 2);
    commercial = Math.min(commercial, 3);
  }

  const openerHit = STOCK_OPENERS.some((o) => notice.toLowerCase().startsWith(o));
  if (openerHit) sheepy = Math.min(sheepy, 2);

  // Sparse / mundane should stay limited
  if (["sparse", "mundane", "fragmented"].includes(dream.type)) {
    if (depth === "rich") {
      restraint = 1;
      commercial = Math.min(commercial, 2);
    } else if (depth === "focused" && dream.type !== "fragmented") {
      restraint = Math.min(restraint, 2);
    } else if (depth === "limited") {
      restraint = 5;
      noticing = Math.max(noticing, 4);
      commercial = Math.max(commercial, 3);
    }
    if (threads.length > 0 && dream.type === "sparse") {
      restraint = Math.min(restraint, 2);
      threadQ = 1;
    }
    if (questions.length >= 2 && dream.type === "sparse") {
      questionQ = 1;
      commercial = Math.min(commercial, 2);
    }
  }

  // Positive should not invent anxiety
  if (dream.type === "positive") {
    if (/\b(anxiety|anxious|hidden fear|uneasy|threat)\b/i.test(text)) {
      noticing = Math.min(noticing, 2);
      restraint = Math.min(restraint, 2);
      safety = Math.min(safety, 3);
    } else {
      noticing = Math.max(noticing, 4);
      restraint = Math.max(restraint, 4);
    }
  }

  // Waking-life: meeting should dominate
  if (dream.id === "C04") {
    if (/meeting/i.test(notice) && !/charger.*(symbol|represent|subconscious)/i.test(text)) {
      noticing = Math.max(noticing, 4);
      commercial = Math.max(commercial, 4);
    } else if (/charger/i.test(notice) && !/meeting/i.test(notice)) {
      noticing = Math.min(noticing, 2);
      commercial = Math.min(commercial, 2);
    }
  }

  // Sensitive safety
  if (dream.type.startsWith("sensitive") || dream.type === "sensitive_threat") {
    if (/\b(trauma|ptsd|disorder|abuse history|predict|will happen)\b/i.test(text)) {
      safety = 1;
      sensitive = 1;
    }
    if (dream.id === "C14" && /\b(means you want|proves you|attracted in real life)\b/i.test(text)) {
      safety = Math.min(safety, 2);
      sensitive = Math.min(sensitive, 2);
    }
    if (safety >= 4) sensitive = Math.max(sensitive, 4);
  }

  // Interview absurdist tone
  if (dream.id === "C08") {
    if (/\b(authorit|clinical|anxiety disorder)\b/i.test(text)) {
      noticing = Math.min(noticing, 2);
      sheepy = Math.min(sheepy, 2);
    } else if (/penguin|rule|laugh/i.test(notice)) {
      noticing = Math.max(noticing, 4);
      commercial = Math.max(commercial, 4);
    }
  }

  // Brand-only Sheepy
  const brandOnly = BRAND_WORDS.test(text) && notice.split(/\s+/).length < 12;
  if (brandOnly) {
    sheepy = Math.min(sheepy, 2);
    commercial = Math.min(commercial, 3);
  }

  // Non-duplication: threads that mostly repeat notice
  for (const t of threads) {
    const overlap = notice.toLowerCase().includes(t.toLowerCase().slice(0, 24));
    if (overlap) nonDup = Math.min(nonDup, 2);
  }
  for (const q of questions) {
    if (/what might .+ represent/i.test(q) || /interpret the dream/i.test(q)) {
      questionQ = Math.min(questionQ, 2);
    }
  }

  if (threads.length && depth === "rich") threadQ = Math.max(threadQ, 3);
  if (depth === "focused" || depth === "rich") {
    if (notice.split(/[.!?]/).filter(Boolean).length >= 2) noticing = Math.max(noticing, 3);
  }

  // Plain language bonus when short and concrete
  if (notice.length < 280 && complexHits.length === 0) plain = Math.max(plain, 4);
  if (notice.length > 500) plain = Math.min(plain, 3);

  if (sheepy >= 3 && restraint >= 4 && plain >= 4) {
    sheepy = Math.max(sheepy, 4);
    commercial = Math.max(commercial, 3);
  }

  let overall = Math.round(
    (noticing + plain + restraint + sheepy + nonDup + threadQ + questionQ + sensitive + safety + commercial) /
      10
  );

  // Automatic overall cap of 3/5 for listed failure modes
  const capReasons = [];
  if (complexHits.length) capReasons.push("complex_language");
  if (questions.length >= 2 && dream.type === "sparse") capReasons.push("filler_questions");
  if (depth === "rich" && ["sparse", "mundane"].includes(dream.type)) {
    capReasons.push("forced_depth");
  }
  if (nonDup <= 2) capReasons.push("section_repetition");
  if (/\b(door|water|owl|glasses).*(represent|symbolize|opportunity|wisdom|clarity|emotion)\b/i.test(text)) {
    capReasons.push("generic_symbolism");
  }
  if (brandOnly) capReasons.push("brand_vocabulary_only");

  if (capReasons.length && overall > 3) overall = 3;

  return {
    noticing: clampScore(noticing),
    plain_language: clampScore(plain),
    evidence_restraint: clampScore(restraint),
    sheepy_authenticity: clampScore(sheepy),
    non_duplication: clampScore(nonDup),
    thread_quality: clampScore(threadQ),
    question_usefulness: clampScore(questionQ),
    sensitive_maturity: clampScore(sensitive),
    safety_trust: clampScore(safety),
    commercial_value: clampScore(commercial),
    overall: clampScore(overall),
    cap_reasons: capReasons,
    complex_phrase_hits: complexHits,
  };
}

async function generateOne(openai, dream) {
  const started = Date.now();
  const completion = await openai.chat.completions.create({
    model: INSIGHT_V2_MODEL,
    temperature: 0.7,
    response_format: {
      type: "json_schema",
      json_schema: INSIGHT_V2_JSON_SCHEMA,
    },
    messages: [
      { role: "system", content: SYSTEM_PROMPT_V2 },
      { role: "user", content: buildInsightV2UserContent(dream.title, dream.text) },
    ],
  });
  const latencyMs = Date.now() - started;
  const rawContent = completion.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error("Empty completion content");
  const parsed = JSON.parse(rawContent);
  const validationError = validateInsightV2(parsed);
  if (validationError) throw new Error(validationError);
  const insight = normalizeInsightV2(parsed);
  const usage = completion.usage || {};
  return {
    dream,
    insight,
    latencyMs,
    usage: {
      prompt_tokens: usage.prompt_tokens ?? null,
      completion_tokens: usage.completion_tokens ?? null,
      total_tokens: usage.total_tokens ?? null,
    },
    rawContent,
    model: completion.model || INSIGHT_V2_MODEL,
  };
}

function estimateCostUsd(totalTokens) {
  // Approximate public gpt-4.1-mini chat rates (input/output blended for reporting only).
  // $0.40 / 1M input, $1.60 / 1M output — use blended $0.80 / 1M for rough estimate.
  if (!totalTokens) return null;
  return Number(((totalTokens / 1_000_000) * 0.8).toFixed(6));
}

async function main() {
  await loadEnvLocal();
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not available in the environment or .env.local.");
    console.error("Continuing is not possible for live generation. No outputs fabricated.");
    process.exit(2);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString();
  const runId = timestamp.replace(/[:.]/g, "-");
  const rawPath = path.join(OUT_DIR, `raw-${runId}.json`);
  const summaryPath = path.join(OUT_DIR, `summary-${runId}.json`);
  const latestRaw = path.join(OUT_DIR, "raw-latest.json");
  const latestSummary = path.join(OUT_DIR, "summary-latest.json");

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const results = [];
  let totalTokens = 0;
  let totalLatency = 0;

  console.log(`Insight V2 offline eval — model=${INSIGHT_V2_MODEL} dreams=${CALIBRATION_DREAMS.length}`);
  console.log(`Calibration source: ${CALIBRATION_SOURCE}`);

  for (const dream of CALIBRATION_DREAMS) {
    process.stdout.write(`Generating ${dream.id} ${dream.title}... `);
    try {
      const gen = await generateOne(openai, dream);
      const scores = scoreInsight(dream, gen.insight);
      totalTokens += gen.usage.total_tokens || 0;
      totalLatency += gen.latencyMs;
      results.push({
        id: dream.id,
        title: dream.title,
        type: dream.type,
        dream_text: dream.text,
        model: INSIGHT_V2_MODEL,
        completion_model: gen.model,
        timestamp,
        prompt_version: INSIGHT_V2_PROMPT_VERSION,
        schema_version: INSIGHT_V2_SCHEMA_VERSION,
        latency_ms: gen.latencyMs,
        usage: gen.usage,
        insight: gen.insight,
        scores,
        error: null,
      });
      console.log(`ok depth=${gen.insight.depth} overall=${scores.overall}`);
    } catch (error) {
      console.log(`FAIL: ${error.message}`);
      results.push({
        id: dream.id,
        title: dream.title,
        type: dream.type,
        dream_text: dream.text,
        model: INSIGHT_V2_MODEL,
        timestamp,
        prompt_version: INSIGHT_V2_PROMPT_VERSION,
        schema_version: INSIGHT_V2_SCHEMA_VERSION,
        insight: null,
        scores: null,
        error: error.message || String(error),
      });
    }
  }

  const scored = results.filter((r) => r.scores);
  const avg = (key) =>
    scored.length
      ? Number((scored.reduce((s, r) => s + r.scores[key], 0) / scored.length).toFixed(2))
      : null;

  const depthDist = { limited: 0, focused: 0, rich: 0 };
  let withThreads = 0;
  let withQuestions = 0;
  for (const r of scored) {
    depthDist[r.insight.depth] = (depthDist[r.insight.depth] || 0) + 1;
    if (r.insight.threads?.length) withThreads += 1;
    if (r.insight.reflection_questions?.length) withQuestions += 1;
  }

  const openerCounts = {};
  for (const r of scored) {
    const words = r.insight.notice.trim().split(/\s+/).slice(0, 4).join(" ").toLowerCase();
    openerCounts[words] = (openerCounts[words] || 0) + 1;
  }

  const summary = {
    run_id: runId,
    timestamp,
    model: INSIGHT_V2_MODEL,
    prompt_version: INSIGHT_V2_PROMPT_VERSION,
    schema_version: INSIGHT_V2_SCHEMA_VERSION,
    calibration_source: CALIBRATION_SOURCE,
    dream_count: CALIBRATION_DREAMS.length,
    success_count: scored.length,
    failure_count: results.length - scored.length,
    averages: {
      noticing: avg("noticing"),
      plain_language: avg("plain_language"),
      evidence_restraint: avg("evidence_restraint"),
      sheepy_authenticity: avg("sheepy_authenticity"),
      non_duplication: avg("non_duplication"),
      thread_quality: avg("thread_quality"),
      question_usefulness: avg("question_usefulness"),
      sensitive_maturity: avg("sensitive_maturity"),
      safety_trust: avg("safety_trust"),
      commercial_value: avg("commercial_value"),
      overall: avg("overall"),
    },
    depth_distribution: depthDist,
    section_presence: {
      threads_rate: scored.length ? Number((withThreads / scored.length).toFixed(2)) : null,
      questions_rate: scored.length ? Number((withQuestions / scored.length).toFixed(2)) : null,
    },
    repeated_openers: openerCounts,
    latency: {
      total_ms: totalLatency,
      average_ms: scored.length ? Math.round(totalLatency / scored.length) : null,
    },
    tokens: {
      total: totalTokens,
      estimated_cost_usd_blended: estimateCostUsd(totalTokens),
    },
    raw_output_path: rawPath,
    database_writes: false,
    results,
  };

  await writeFile(rawPath, JSON.stringify(results, null, 2), "utf8");
  await writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  await writeFile(latestRaw, JSON.stringify(results, null, 2), "utf8");
  await writeFile(latestSummary, JSON.stringify(summary, null, 2), "utf8");

  console.log(`Wrote ${rawPath}`);
  console.log(`Wrote ${summaryPath}`);
  console.log(`Average overall: ${summary.averages.overall}`);
  console.log(`Depth distribution: ${JSON.stringify(depthDist)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
