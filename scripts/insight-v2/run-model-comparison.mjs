/**
 * Controlled Mini vs Sol comparison — evaluation only.
 * Frozen SYSTEM_PROMPT_V2 (adaptive-v2.1) + V2 schema for both models.
 * Does not modify api/dream-insights.js, env files, or production model.
 *
 * Usage:
 *   node scripts/insight-v2/run-model-comparison.mjs
 *   node scripts/insight-v2/run-model-comparison.mjs --model gpt-4.1-mini
 *   node scripts/insight-v2/run-model-comparison.mjs --model gpt-5.6-sol
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomInt } from "node:crypto";
import OpenAI from "openai";
import {
  INSIGHT_V2_JSON_SCHEMA,
  INSIGHT_V2_PROMPT_VERSION,
  INSIGHT_V2_SCHEMA_VERSION,
  SYSTEM_PROMPT_V2,
  buildInsightV2UserContent,
  normalizeInsightV2,
  validateInsightV2,
} from "../../lib/insight-v2.mjs";
import {
  BLIND_ANCHOR_IDS,
  COMPARISON_DREAMS,
  COMPARISON_META,
  LONG_SYNTHETIC_FIXTURES,
} from "./comparison-dreams.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "eval-outputs", "insight-v2-mini-vs-sol");

const REPORT_PHRASES = [
  "the dream includes",
  "the dream centers on",
  "the dream highlights",
  "the dream shares",
  "the dream shows",
  "the dream captures",
  "the dream expresses",
  "the dream held",
];

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
  "complex emotional state",
  "tension between",
];

const COST = {
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-5.6-sol": { input: 5.0, output: 30.0 },
};

function parseArgs(argv) {
  const out = { model: "both" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--model" && argv[i + 1]) {
      out.model = argv[++i];
    }
  }
  return out;
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

function clamp(n) {
  return Math.max(1, Math.min(5, Math.round(n)));
}

function estimateCost(model, usage) {
  const rates = COST[model];
  if (!rates || !usage) return null;
  const input = usage.prompt_tokens || usage.input_tokens || 0;
  const output = usage.completion_tokens || usage.output_tokens || 0;
  return Number(((input * rates.input + output * rates.output) / 1_000_000).toFixed(6));
}

function visibleText(insight) {
  return [insight.notice, ...(insight.threads || []), ...(insight.reflection_questions || [])]
    .join("\n")
    .toLowerCase();
}

function detectReportOpening(notice) {
  const lower = String(notice || "").toLowerCase();
  return REPORT_PHRASES.find((p) => lower.startsWith(p)) || null;
}

function countDreamerMentions(text) {
  const matches = String(text).toLowerCase().match(/\bthe dreamer\b/g);
  return matches ? matches.length : 0;
}

function threadsRepeatNotice(notice, threads) {
  const n = String(notice || "").toLowerCase();
  let count = 0;
  for (const t of threads || []) {
    const snippet = String(t).toLowerCase().slice(0, 28);
    if (snippet.length >= 12 && n.includes(snippet)) count += 1;
  }
  return count;
}

function unsupportedInferenceFlags(dream, insight) {
  const text = visibleText(insight);
  const flags = [];
  if (dream.type === "positive" && /\b(anxiety|anxious|hidden (fear|problem)|uneasy|threat)\b/.test(text)) {
    flags.push("positive_to_problem");
  }
  if (dream.id === "C02" && (insight.threads?.length || 0) > 0) flags.push("sparse_forced_threads");
  if (dream.id === "C02" && (insight.reflection_questions?.length || 0) > 0) {
    flags.push("sparse_forced_question");
  }
  if (dream.type === "long_sparse_meaning" && insight.depth === "rich") {
    flags.push("length_triggered_rich");
  }
  if (
    /\b(trauma|ptsd|disorder|abuse history|will happen|proves you want|means you desire)\b/.test(text)
  ) {
    flags.push("unsafe_claim");
  }
  if (dream.id === "C04" && /charger/i.test(insight.notice) && !/meeting/i.test(insight.notice)) {
    flags.push("missed_waking_life_priority");
  }
  if (
    dream.id === "C14" &&
    /\b(means you want|proves you|attracted in real life|waking desire)\b/.test(text)
  ) {
    flags.push("sexual_to_waking_desire");
  }
  if (
    dream.id === "C11" ||
    (/\bunheard in (your )?waking\b/.test(text) && !/waking/i.test(dream.text))
  ) {
    if (/\bunheard|\bignored in waking|unsupported in waking\b/.test(text)) {
      flags.push("invented_waking_ignore");
    }
  }
  if (dream.type === "long_bizarre" || dream.type === "absurd") {
    if (/\b(clinical|authority anxiety|diagnos|dysfunction)\b/.test(text)) {
      flags.push("bizarre_clinicalized");
    }
  }
  return flags;
}

function scoreInsight(dream, insight) {
  const text = visibleText(insight);
  const notice = String(insight.notice || "");
  const threads = insight.threads || [];
  const questions = insight.reflection_questions || [];
  const flags = unsupportedInferenceFlags(dream, insight);
  const reportOpener = detectReportOpening(notice);
  const dreamerCount = countDreamerMentions(text);
  const repeatCount = threadsRepeatNotice(notice, threads);
  const complexHits = COMPLEX_PHRASES.filter((p) => text.includes(p));

  let noticing = 3;
  let plain = 4;
  let restraint = 4;
  let sheepy = 3;
  let nonDup = 4;
  let optionality = 4;
  let threadQ = threads.length ? 3 : 4;
  let questionQ = questions.length ? 3 : 4;
  let sensitive = 4;
  let bizarre = 4;
  let commercial = 3;

  if (reportOpener) {
    sheepy = Math.min(sheepy, 2);
    plain = Math.min(plain, 3);
  }
  if (dreamerCount >= 2) sheepy = Math.min(sheepy, 2);
  if (dreamerCount === 1) sheepy = Math.min(sheepy, 3);
  if (/\byou\b/i.test(notice) && dreamerCount === 0) sheepy = Math.max(sheepy, 4);
  if (complexHits.length) plain = Math.min(plain, 2);

  if (["sparse", "mundane", "fragmented", "long_sparse_meaning"].includes(dream.type)) {
    if (insight.depth === "rich") restraint = 1;
    else if (insight.depth === "limited") {
      restraint = 5;
      noticing = Math.max(noticing, 4);
    }
    if (threads.length === 0 && questions.length === 0 && insight.depth === "limited") {
      optionality = 5;
      commercial = Math.max(commercial, 4);
    }
    if (questions.length >= 1 && dream.type === "sparse") {
      optionality = Math.min(optionality, 2);
      questionQ = Math.min(questionQ, 2);
    }
  }

  if (dream.type === "positive") {
    if (flags.includes("positive_to_problem")) {
      restraint = Math.min(restraint, 2);
      noticing = Math.min(noticing, 2);
    } else {
      noticing = Math.max(noticing, 4);
      restraint = Math.max(restraint, 4);
    }
  }

  if (dream.type === "long_emotional" || dream.type === "long_relationship" || dream.type === "rich") {
    if (insight.depth === "rich" && threads.length >= 2) {
      noticing = Math.max(noticing, 4);
      threadQ = Math.max(threadQ, 4);
      commercial = Math.max(commercial, 4);
    }
  }

  if (dream.type === "long_bizarre" || dream.type === "absurd") {
    if (flags.includes("bizarre_clinicalized")) bizarre = 1;
    else if (/penguin|celery|fox|soap bubble|laugh|rule/i.test(notice)) {
      bizarre = Math.max(bizarre, 4);
      noticing = Math.max(noticing, 4);
    }
  }

  if (dream.type?.startsWith("sensitive") || dream.type === "sensitive_threat" || dream.type === "sensitive_sexual") {
    if (flags.includes("unsafe_claim") || flags.includes("sexual_to_waking_desire")) {
      sensitive = 1;
    } else {
      sensitive = Math.max(sensitive, 4);
    }
  }

  if (repeatCount) nonDup = Math.min(nonDup, 2);
  if (threads.length && questions.length && insight.depth === "limited") optionality = Math.min(optionality, 2);

  if (dream.id === "C04" && /meeting/i.test(notice)) {
    noticing = Math.max(noticing, 4);
    commercial = Math.max(commercial, 4);
  }

  let overall = Math.round(
    (noticing +
      plain +
      restraint +
      sheepy +
      nonDup +
      optionality +
      threadQ +
      questionQ +
      sensitive +
      bizarre +
      commercial) /
      11
  );

  const capReasons = [];
  if (/^the dream /i.test(notice) || reportOpener) capReasons.push("report_like_opening");
  if (complexHits.length) capReasons.push("complex_language");
  if (flags.includes("sparse_forced_question") || (questions.length && dream.type === "sparse")) {
    capReasons.push("filler_question");
  }
  if (repeatCount) capReasons.push("threads_repeat_notice");
  if (flags.some((f) => f.startsWith("invented") || f.includes("waking_desire") || f === "positive_to_problem")) {
    capReasons.push("unsupported_inference");
  }
  if (insight.depth === "rich" && ["sparse", "mundane", "long_sparse_meaning"].includes(dream.type)) {
    capReasons.push("forced_depth");
  }
  if (flags.includes("bizarre_clinicalized")) capReasons.push("clinicalized_bizarre");
  if (capReasons.length && overall > 3) overall = 3;

  return {
    genuine_noticing: clamp(noticing),
    plain_language: clamp(plain),
    evidence_restraint: clamp(restraint),
    sheepy_authenticity: clamp(sheepy),
    non_duplication: clamp(nonDup),
    optionality: clamp(optionality),
    thread_quality: clamp(threadQ),
    question_usefulness: clamp(questionQ),
    sensitive_maturity: clamp(sensitive),
    bizarre_tone_preservation: clamp(bizarre),
    commercial_value: clamp(commercial),
    overall: clamp(overall),
    cap_reasons: capReasons,
    unsupported_flags: flags,
    report_opening: reportOpener,
    dreamer_mentions: dreamerCount,
    threads_repeat_notice_count: repeatCount,
    complex_phrase_hits: complexHits,
  };
}

async function generateMini(openai, dream) {
  const started = Date.now();
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
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
  const rawContent = completion.choices?.[0]?.message?.content || "";
  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? null,
    completion_tokens: completion.usage?.completion_tokens ?? null,
    total_tokens: completion.usage?.total_tokens ?? null,
    reasoning_tokens: completion.usage?.completion_tokens_details?.reasoning_tokens ?? null,
    input_tokens: completion.usage?.prompt_tokens ?? null,
    output_tokens: completion.usage?.completion_tokens ?? null,
  };
  return {
    model: "gpt-4.1-mini",
    api: "chat.completions",
    request_settings: { temperature: 0.7, response_format: "json_schema" },
    latency_ms: latencyMs,
    usage,
    estimated_cost_usd: estimateCost("gpt-4.1-mini", usage),
    raw_content: rawContent,
    completion_model: completion.model || "gpt-4.1-mini",
  };
}

function extractResponsesText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }
  const chunks = [];
  for (const item of response.output || []) {
    if (item.type === "message") {
      for (const part of item.content || []) {
        if (part.type === "output_text" && part.text) chunks.push(part.text);
        if (part.type === "text" && part.text) chunks.push(part.text);
      }
    }
  }
  return chunks.join("");
}

async function generateSol(openai, dream) {
  const started = Date.now();
  const schema = INSIGHT_V2_JSON_SCHEMA.schema;
  const response = await openai.responses.create({
    model: "gpt-5.6-sol",
    reasoning: {
      effort: "medium",
      // standard mode: omit mode / do not set "pro"
    },
    store: false,
    input: [
      { role: "system", content: SYSTEM_PROMPT_V2 },
      { role: "user", content: buildInsightV2UserContent(dream.title, dream.text) },
    ],
    text: {
      format: {
        type: "json_schema",
        name: INSIGHT_V2_JSON_SCHEMA.name,
        strict: true,
        schema,
      },
    },
  });
  const latencyMs = Date.now() - started;
  const rawContent = extractResponsesText(response);
  const usage = {
    prompt_tokens: response.usage?.input_tokens ?? null,
    completion_tokens: response.usage?.output_tokens ?? null,
    total_tokens: response.usage?.total_tokens ?? null,
    reasoning_tokens: response.usage?.output_tokens_details?.reasoning_tokens ?? null,
    input_tokens: response.usage?.input_tokens ?? null,
    output_tokens: response.usage?.output_tokens ?? null,
  };
  return {
    model: "gpt-5.6-sol",
    api: "responses",
    request_settings: {
      reasoning_effort: "medium",
      reasoning_mode: "standard",
      tools: "none",
      store: false,
      text_format: "json_schema",
    },
    latency_ms: latencyMs,
    usage,
    estimated_cost_usd: estimateCost("gpt-5.6-sol", usage),
    raw_content: rawContent,
    completion_model: response.model || "gpt-5.6-sol",
  };
}

async function generateOne(openai, modelId, dream) {
  const gen = modelId === "gpt-5.6-sol" ? await generateSol(openai, dream) : await generateMini(openai, dream);
  let parsed = null;
  let validation_error = null;
  let insight = null;
  try {
    parsed = JSON.parse(gen.raw_content);
    validation_error = validateInsightV2(parsed);
    if (!validation_error) insight = normalizeInsightV2(parsed);
  } catch (error) {
    validation_error = error.message || String(error);
  }
  const scores = insight ? scoreInsight(dream, insight) : null;
  return {
    dream_id: dream.id,
    dream_title: dream.title,
    dream_type: dream.type,
    dream_category: dream.category,
    synthetic_label: dream.synthetic_label,
    dream_text: dream.text,
    model: gen.model,
    completion_model: gen.completion_model,
    api: gen.api,
    request_settings: gen.request_settings,
    prompt_version: INSIGHT_V2_PROMPT_VERSION,
    schema_version: INSIGHT_V2_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    latency_ms: gen.latency_ms,
    usage: gen.usage,
    estimated_cost_usd: gen.estimated_cost_usd,
    insight,
    scores,
    validation_error,
    api_error: null,
    raw_content: gen.raw_content,
  };
}

function summarizeModel(rows) {
  const ok = rows.filter((r) => r.insight && r.scores);
  const depth = { limited: 0, focused: 0, rich: 0 };
  let withThreads = 0;
  let withQuestions = 0;
  let threadCount = 0;
  let questionCount = 0;
  let noticeOnly = 0;
  let dreamerPct = 0;
  let reportPct = 0;
  let unsupported = 0;
  let repeated = 0;
  let sensitiveFails = 0;
  let bizarreFails = 0;
  let validationFails = rows.length - ok.length;
  let latency = 0;
  let tokensIn = 0;
  let tokensOut = 0;
  let reasoning = 0;
  let cost = 0;

  const avg = (key) =>
    ok.length ? Number((ok.reduce((s, r) => s + r.scores[key], 0) / ok.length).toFixed(2)) : null;

  for (const r of ok) {
    depth[r.insight.depth] = (depth[r.insight.depth] || 0) + 1;
    const t = r.insight.threads.length;
    const q = r.insight.reflection_questions.length;
    threadCount += t;
    questionCount += q;
    if (t) withThreads += 1;
    if (q) withQuestions += 1;
    if (!t && !q) noticeOnly += 1;
    if (r.scores.dreamer_mentions > 0) dreamerPct += 1;
    if (r.scores.report_opening) reportPct += 1;
    unsupported += r.scores.unsupported_flags.length;
    repeated += r.scores.threads_repeat_notice_count;
    if (r.scores.sensitive_maturity <= 2) sensitiveFails += 1;
    if (r.scores.bizarre_tone_preservation <= 2) bizarreFails += 1;
    latency += r.latency_ms;
    tokensIn += r.usage?.input_tokens || r.usage?.prompt_tokens || 0;
    tokensOut += r.usage?.output_tokens || r.usage?.completion_tokens || 0;
    reasoning += r.usage?.reasoning_tokens || 0;
    cost += r.estimated_cost_usd || 0;
  }

  return {
    success_count: ok.length,
    failure_count: validationFails,
    averages: {
      genuine_noticing: avg("genuine_noticing"),
      plain_language: avg("plain_language"),
      evidence_restraint: avg("evidence_restraint"),
      sheepy_authenticity: avg("sheepy_authenticity"),
      non_duplication: avg("non_duplication"),
      optionality: avg("optionality"),
      thread_quality: avg("thread_quality"),
      question_usefulness: avg("question_usefulness"),
      sensitive_maturity: avg("sensitive_maturity"),
      bizarre_tone_preservation: avg("bizarre_tone_preservation"),
      commercial_value: avg("commercial_value"),
      overall: avg("overall"),
    },
    depth_distribution: depth,
    notice_only_rate: ok.length ? Number((noticeOnly / ok.length).toFixed(2)) : null,
    threads_presence_rate: ok.length ? Number((withThreads / ok.length).toFixed(2)) : null,
    questions_presence_rate: ok.length ? Number((withQuestions / ok.length).toFixed(2)) : null,
    avg_thread_count: ok.length ? Number((threadCount / ok.length).toFixed(2)) : null,
    avg_question_count: ok.length ? Number((questionCount / ok.length).toFixed(2)) : null,
    pct_using_the_dreamer: ok.length ? Number(((dreamerPct / ok.length) * 100).toFixed(1)) : null,
    pct_report_like_opening: ok.length ? Number(((reportPct / ok.length) * 100).toFixed(1)) : null,
    unsupported_inference_count: unsupported,
    repeated_section_count: repeated,
    sensitive_content_failures: sensitiveFails,
    bizarre_tone_failures: bizarreFails,
    validation_failures: validationFails,
    latency: {
      average_ms: ok.length ? Math.round(latency / ok.length) : null,
      total_ms: latency,
    },
    tokens: {
      input: tokensIn,
      output: tokensOut,
      reasoning: reasoning,
      total: tokensIn + tokensOut,
    },
    estimated_cost_usd: Number(cost.toFixed(6)),
    estimated_cost_per_insight_usd: ok.length ? Number((cost / ok.length).toFixed(6)) : null,
  };
}

function formatVisible(insight) {
  if (!insight) return "_Generation failed._";
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
  lines.push(`_Depth (hidden from users, shown for review): ${insight.depth}_`);
  return lines.join("\n");
}

function buildBlindDoc(resultsByModel, key) {
  const lines = [];
  lines.push("# Insight V2 — Mini vs Sol Blind Anchor Review");
  lines.push("");
  lines.push("Models are hidden. Rate A vs B for each case.");
  lines.push("");
  lines.push("Prompt and schema are frozen: `adaptive-v2.1` / V2.");
  lines.push("");
  lines.push("Do not open the hidden key until finished.");
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const dreamId of BLIND_ANCHOR_IDS) {
    const dream = COMPARISON_DREAMS.find((d) => d.id === dreamId);
    const mapping = key.cases[dreamId];
    const aModel = mapping.A;
    const bModel = mapping.B;
    const a = resultsByModel[aModel].find((r) => r.dream_id === dreamId);
    const b = resultsByModel[bModel].find((r) => r.dream_id === dreamId);

    lines.push(`## ${dream.title}`);
    lines.push("");
    if (dream.synthetic_label) lines.push(`**${dream.synthetic_label}**`);
    lines.push("");
    lines.push("### Dream text");
    lines.push("");
    lines.push(`> ${dream.text}`);
    lines.push("");
    lines.push("### Response A");
    lines.push("");
    lines.push(formatVisible(a?.insight));
    lines.push("");
    lines.push("### Response B");
    lines.push("");
    lines.push(formatVisible(b?.insight));
    lines.push("");
    lines.push("**Best:** A / B / Tie");
    lines.push("");
    lines.push("**Reason:**");
    lines.push("");
    lines.push("> ");
    lines.push("");
    lines.push("**Would I be comfortable shipping the winner?** Yes / No");
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  return lines.join("\n");
}

function pickStrongWeak(rows) {
  const ok = rows.filter((r) => r.scores);
  const sorted = [...ok].sort((a, b) => b.scores.overall - a.scores.overall);
  return {
    strongest: sorted.slice(0, 3).map((r) => ({
      id: r.dream_id,
      title: r.dream_title,
      overall: r.scores.overall,
      depth: r.insight.depth,
      notice: r.insight.notice,
    })),
    weakest: sorted
      .slice(-3)
      .reverse()
      .map((r) => ({
        id: r.dream_id,
        title: r.dream_title,
        overall: r.scores.overall,
        depth: r.insight.depth,
        notice: r.insight.notice,
        caps: r.scores.cap_reasons,
        flags: r.scores.unsupported_flags,
      })),
  };
}

function buildEvalReport(summary, resultsByModel) {
  const mini = summary.models["gpt-4.1-mini"];
  const sol = summary.models["gpt-5.6-sol"];
  const miniRows = resultsByModel["gpt-4.1-mini"] || [];
  const solRows = resultsByModel["gpt-5.6-sol"] || [];
  const miniSW = pickStrongWeak(miniRows);
  const solSW = pickStrongWeak(solRows);

  const pairNotes = [];
  for (const dream of COMPARISON_DREAMS) {
    const m = miniRows.find((r) => r.dream_id === dream.id);
    const s = solRows.find((r) => r.dream_id === dream.id);
    if (!m?.scores || !s?.scores) continue;
    if (s.scores.overall >= m.scores.overall + 1) {
      pairNotes.push({
        kind: "sol_fixed",
        id: dream.id,
        title: dream.title,
        mini: m.scores.overall,
        sol: s.scores.overall,
        mini_caps: m.scores.cap_reasons,
        sol_caps: s.scores.cap_reasons,
      });
    } else if (m.scores.overall >= s.scores.overall + 1) {
      pairNotes.push({
        kind: "sol_worse",
        id: dream.id,
        title: dream.title,
        mini: m.scores.overall,
        sol: s.scores.overall,
      });
    } else if (
      m.scores.cap_reasons.length &&
      s.scores.cap_reasons.some((c) => m.scores.cap_reasons.includes(c))
    ) {
      pairNotes.push({
        kind: "shared_problem",
        id: dream.id,
        title: dream.title,
        shared: m.scores.cap_reasons.filter((c) => s.scores.cap_reasons.includes(c)),
      });
    }
  }

  const lines = [];
  lines.push("# Insight V2 — Mini vs Sol Evaluation");
  lines.push("");
  lines.push("## 1. Purpose");
  lines.push("");
  lines.push(
    "Determine whether remaining Adaptive Insight V2 quality problems are mainly caused by `gpt-4.1-mini`, or still require major prompt changes, by comparing it with `gpt-5.6-sol` under a frozen prompt and schema."
  );
  lines.push("");
  lines.push("## 2. Frozen prompt and schema");
  lines.push("");
  lines.push(`- Prompt version: **${INSIGHT_V2_PROMPT_VERSION}** (SYSTEM_PROMPT_V2 unchanged)`);
  lines.push(`- Schema version: **${INSIGHT_V2_SCHEMA_VERSION}**`);
  lines.push("- Identical dream texts, user formatting, validation, and normalization for both models");
  lines.push("- No application/production files modified for this comparison");
  lines.push("");
  lines.push("## 3. Models and settings");
  lines.push("");
  lines.push("### gpt-4.1-mini");
  lines.push("");
  lines.push("- API: `chat.completions`");
  lines.push("- temperature: `0.7`");
  lines.push("- `response_format`: structured `json_schema` (same V2 schema)");
  lines.push("");
  lines.push("### gpt-5.6-sol");
  lines.push("");
  lines.push("- API: `responses`");
  lines.push("- reasoning effort: `medium`");
  lines.push("- reasoning mode: **standard** (no pro)");
  lines.push("- tools: none");
  lines.push("- store: false");
  lines.push("- structured output via `text.format` json_schema (same V2 schema)");
  lines.push("");
  lines.push("## 4. Evaluation dataset");
  lines.push("");
  lines.push("14 dreams × 2 models = 28 generations.");
  lines.push("");
  lines.push("| ID | Title | Category |");
  lines.push("|---|---|---|");
  for (const d of COMPARISON_DREAMS) {
    lines.push(
      `| ${d.id} | ${d.title} | ${d.synthetic_label || d.category} |`
    );
  }
  lines.push("");
  lines.push("Frozen fixtures: `eval-outputs/insight-v2-mini-vs-sol/fixtures-frozen.json`");
  lines.push("");
  lines.push("## 5. Objective measurements");
  lines.push("");
  lines.push("| Metric | gpt-4.1-mini | gpt-5.6-sol |");
  lines.push("|---|---:|---:|");
  lines.push(`| Average overall | ${mini?.averages?.overall ?? "n/a"} | ${sol?.averages?.overall ?? "n/a"} |`);
  lines.push(
    `| Notice-only rate | ${mini?.notice_only_rate ?? "n/a"} | ${sol?.notice_only_rate ?? "n/a"} |`
  );
  lines.push(
    `| Threads presence | ${mini?.threads_presence_rate ?? "n/a"} | ${sol?.threads_presence_rate ?? "n/a"} |`
  );
  lines.push(
    `| Questions presence | ${mini?.questions_presence_rate ?? "n/a"} | ${sol?.questions_presence_rate ?? "n/a"} |`
  );
  lines.push(`| Avg threads | ${mini?.avg_thread_count ?? "n/a"} | ${sol?.avg_thread_count ?? "n/a"} |`);
  lines.push(
    `| Avg questions | ${mini?.avg_question_count ?? "n/a"} | ${sol?.avg_question_count ?? "n/a"} |`
  );
  lines.push(
    `| % using “the dreamer” | ${mini?.pct_using_the_dreamer ?? "n/a"}% | ${sol?.pct_using_the_dreamer ?? "n/a"}% |`
  );
  lines.push(
    `| % report-like opening | ${mini?.pct_report_like_opening ?? "n/a"}% | ${sol?.pct_report_like_opening ?? "n/a"}% |`
  );
  lines.push(
    `| Unsupported-inference flags | ${mini?.unsupported_inference_count ?? "n/a"} | ${sol?.unsupported_inference_count ?? "n/a"} |`
  );
  lines.push(
    `| Repeated-section count | ${mini?.repeated_section_count ?? "n/a"} | ${sol?.repeated_section_count ?? "n/a"} |`
  );
  lines.push(
    `| Sensitive failures | ${mini?.sensitive_content_failures ?? "n/a"} | ${sol?.sensitive_content_failures ?? "n/a"} |`
  );
  lines.push(
    `| Bizarre-tone failures | ${mini?.bizarre_tone_failures ?? "n/a"} | ${sol?.bizarre_tone_failures ?? "n/a"} |`
  );
  lines.push(
    `| Validation failures | ${mini?.validation_failures ?? "n/a"} | ${sol?.validation_failures ?? "n/a"} |`
  );
  lines.push(`| Avg latency (ms) | ${mini?.latency?.average_ms ?? "n/a"} | ${sol?.latency?.average_ms ?? "n/a"} |`);
  lines.push(
    `| Est. total cost (USD) | ${mini?.estimated_cost_usd ?? "n/a"} | ${sol?.estimated_cost_usd ?? "n/a"} |`
  );
  lines.push(
    `| Est. cost / Insight | ${mini?.estimated_cost_per_insight_usd ?? "n/a"} | ${sol?.estimated_cost_per_insight_usd ?? "n/a"} |`
  );
  lines.push("");
  lines.push("### Depth distribution");
  lines.push("");
  lines.push("```json");
  lines.push(
    JSON.stringify(
      { mini: mini?.depth_distribution, sol: sol?.depth_distribution },
      null,
      2
    )
  );
  lines.push("```");
  lines.push("");
  lines.push("### Score averages");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify({ mini: mini?.averages, sol: sol?.averages }, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## 6–11. Category notes");
  lines.push("");
  lines.push("### Section presence / optionality");
  lines.push("");
  lines.push(
    `Mini questions rate **${mini?.questions_presence_rate}**, threads **${mini?.threads_presence_rate}**, notice-only **${mini?.notice_only_rate}**. Sol questions **${sol?.questions_presence_rate}**, threads **${sol?.threads_presence_rate}**, notice-only **${sol?.notice_only_rate}**.`
  );
  lines.push("");
  lines.push("### Unsupported inference");
  lines.push("");
  lines.push(
    `Mini flag count **${mini?.unsupported_inference_count}**; Sol **${sol?.unsupported_inference_count}**.`
  );
  lines.push("");
  lines.push("### Short / sparse dreams");
  lines.push("");
  for (const id of ["C02", "C07", "C15"]) {
    const m = miniRows.find((r) => r.dream_id === id);
    const s = solRows.find((r) => r.dream_id === id);
    lines.push(
      `- **${m?.dream_title || id}**: mini depth=${m?.insight?.depth} q=${m?.insight?.reflection_questions?.length} overall=${m?.scores?.overall}; sol depth=${s?.insight?.depth} q=${s?.insight?.reflection_questions?.length} overall=${s?.scores?.overall}`
    );
  }
  lines.push("");
  lines.push("### Long dreams");
  lines.push("");
  for (const id of ["L01", "L03", "L04", "C09"]) {
    const m = miniRows.find((r) => r.dream_id === id);
    const s = solRows.find((r) => r.dream_id === id);
    lines.push(
      `- **${m?.dream_title || id}**: mini depth=${m?.insight?.depth} threads=${m?.insight?.threads?.length} overall=${m?.scores?.overall}; sol depth=${s?.insight?.depth} threads=${s?.insight?.threads?.length} overall=${s?.scores?.overall}`
    );
  }
  lines.push("");
  lines.push("### Bizarre dreams");
  lines.push("");
  for (const id of ["C08", "L02"]) {
    const m = miniRows.find((r) => r.dream_id === id);
    const s = solRows.find((r) => r.dream_id === id);
    lines.push(
      `- **${m?.dream_title || id}**: mini bizarre=${m?.scores?.bizarre_tone_preservation} overall=${m?.scores?.overall}; sol bizarre=${s?.scores?.bizarre_tone_preservation} overall=${s?.scores?.overall}`
    );
  }
  lines.push("");
  lines.push("### Sensitive content");
  lines.push("");
  for (const id of ["C12", "C14"]) {
    const m = miniRows.find((r) => r.dream_id === id);
    const s = solRows.find((r) => r.dream_id === id);
    lines.push(
      `- **${m?.dream_title || id}**: mini sensitive=${m?.scores?.sensitive_maturity} flags=${(m?.scores?.unsupported_flags || []).join(",") || "none"}; sol sensitive=${s?.scores?.sensitive_maturity} flags=${(s?.scores?.unsupported_flags || []).join(",") || "none"}`
    );
  }
  lines.push("");
  lines.push("## 12–13. Latency, tokens, cost");
  lines.push("");
  lines.push("```json");
  lines.push(
    JSON.stringify(
      {
        mini: { latency: mini?.latency, tokens: mini?.tokens, cost: mini?.estimated_cost_usd },
        sol: { latency: sol?.latency, tokens: sol?.tokens, cost: sol?.estimated_cost_usd },
      },
      null,
      2
    )
  );
  lines.push("```");
  lines.push("");
  lines.push("## 14. Strongest outputs");
  lines.push("");
  lines.push("### Mini");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(miniSW.strongest, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("### Sol");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(solSW.strongest, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## 15. Worst outputs");
  lines.push("");
  lines.push("### Mini");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(miniSW.weakest, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("### Sol");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(solSW.weakest, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## 16. Where Sol fixed a mini failure");
  lines.push("");
  const fixes = pairNotes.filter((p) => p.kind === "sol_fixed");
  if (!fixes.length) lines.push("No paired overall +1 gains under automated scoring.");
  else for (const f of fixes) {
    lines.push(
      `- **${f.title}**: mini ${f.mini} → sol ${f.sol}; mini caps: ${(f.mini_caps || []).join(", ") || "none"}`
    );
  }
  lines.push("");
  lines.push("## 17. Where Sol did not fix the problem");
  lines.push("");
  const shared = pairNotes.filter((p) => p.kind === "shared_problem" || p.kind === "sol_worse");
  if (!shared.length) lines.push("No clear shared automated failure pairs beyond threshold.");
  else for (const f of shared) {
    if (f.kind === "sol_worse") {
      lines.push(`- **${f.title}**: sol scored lower (${f.sol} vs mini ${f.mini})`);
    } else {
      lines.push(`- **${f.title}**: shared caps ${f.shared.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("## 18. Likely root cause of remaining problems");
  lines.push("");
  const solOverall = sol?.averages?.overall ?? 0;
  const miniOverall = mini?.averages?.overall ?? 0;
  const solQ = sol?.questions_presence_rate ?? 1;
  const miniQ = mini?.questions_presence_rate ?? 1;
  const solReport = sol?.pct_report_like_opening ?? 100;
  const miniReport = mini?.pct_report_like_opening ?? 100;
  let root = "mixed";
  if (solOverall >= miniOverall + 0.4 && solQ < miniQ && solReport < miniReport) {
    root = "primarily model capability (Sol stronger under same prompt)";
  } else if (Math.abs(solOverall - miniOverall) < 0.25 && solQ >= 0.6 && miniQ >= 0.6) {
    root = "primarily prompt design (both models still over-produce optional sections / report voice)";
  } else {
    root = "mixed — model capacity and prompt optionality both matter";
  }
  lines.push(`Automated read: **${root}**.`);
  lines.push("");
  lines.push(
    "Missing historical/cross-dream context was intentionally excluded; do not treat that absence as a Sol/mini gap."
  );
  lines.push("");
  lines.push("## 19. Recommendation for next step");
  lines.push("");
  lines.push(
    "Do **not** change production yet. Complete the ten-case blind review in `INSIGHT_V2_MINI_VS_SOL_BLIND.md`."
  );
  lines.push("");
  lines.push(
    "If Sol wins the blind set without safety regression: select Sol as the working model and polish the existing adaptive-v2.1 prompt specifically for Sol (optionality, “you” voice, anti-report openers) — not a new architecture layer."
  );
  lines.push("");
  lines.push(
    "If blind review is mixed or Sol still report-like: remain on mini for alpha, and prioritize prompt optionality fixes before further model spend."
  );
  lines.push("");
  lines.push("Automated scores are supporting evidence only and must not declare a winner alone.");
  lines.push("");
  lines.push("## Paths");
  lines.push("");
  lines.push(`- Raw: \`eval-outputs/insight-v2-mini-vs-sol/\``);
  lines.push("- Blind review: `INSIGHT_V2_MINI_VS_SOL_BLIND.md`");
  lines.push("- Hidden key: `INSIGHT_V2_MINI_VS_SOL_KEY.json`");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnvLocal();
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY unavailable. No outputs fabricated.");
    process.exit(2);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const fixturesPath = path.join(OUT_DIR, "fixtures-frozen.json");
  await writeFile(
    fixturesPath,
    JSON.stringify(
      {
        frozen_at: new Date().toISOString(),
        prompt_version: INSIGHT_V2_PROMPT_VERSION,
        schema_version: INSIGHT_V2_SCHEMA_VERSION,
        meta: COMPARISON_META,
        dreams: COMPARISON_DREAMS,
        long_synthetic_fixtures: LONG_SYNTHETIC_FIXTURES,
      },
      null,
      2
    ),
    "utf8"
  );

  const models =
    args.model === "both"
      ? ["gpt-4.1-mini", "gpt-5.6-sol"]
      : [args.model];

  for (const m of models) {
    if (!["gpt-4.1-mini", "gpt-5.6-sol"].includes(m)) {
      console.error(`Unsupported --model ${m}`);
      process.exit(1);
    }
  }

  // Prompt hash freeze check
  const promptHash = createHash("sha256").update(SYSTEM_PROMPT_V2).digest("hex");
  console.log(`Prompt ${INSIGHT_V2_PROMPT_VERSION} sha256=${promptHash.slice(0, 12)}…`);
  console.log(`Dreams=${COMPARISON_DREAMS.length}; models=${models.join(", ")}`);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resultsByModel = {};
  const allRows = [];

  for (const modelId of models) {
    resultsByModel[modelId] = [];
    for (const dream of COMPARISON_DREAMS) {
      process.stdout.write(`${modelId} :: ${dream.id} ${dream.title}... `);
      try {
        const row = await generateOne(openai, modelId, dream);
        resultsByModel[modelId].push(row);
        allRows.push(row);
        if (row.validation_error) {
          console.log(`VALIDATION: ${row.validation_error}`);
        } else {
          console.log(`ok depth=${row.insight.depth} overall=${row.scores.overall}`);
        }
        await writeFile(
          path.join(OUT_DIR, `raw-${modelId.replace(/\./g, "_")}-${dream.id}.json`),
          JSON.stringify(row, null, 2),
          "utf8"
        );
      } catch (error) {
        const safe = {
          dream_id: dream.id,
          dream_title: dream.title,
          dream_type: dream.type,
          dream_category: dream.category,
          synthetic_label: dream.synthetic_label,
          dream_text: dream.text,
          model: modelId,
          prompt_version: INSIGHT_V2_PROMPT_VERSION,
          schema_version: INSIGHT_V2_SCHEMA_VERSION,
          timestamp: new Date().toISOString(),
          insight: null,
          scores: null,
          validation_error: null,
          api_error: error?.message || String(error),
          status: error?.status || null,
        };
        resultsByModel[modelId].push(safe);
        allRows.push(safe);
        console.log(`API FAIL: ${safe.api_error}`);
        await writeFile(
          path.join(OUT_DIR, `raw-${modelId.replace(/\./g, "_")}-${dream.id}.json`),
          JSON.stringify(safe, null, 2),
          "utf8"
        );
      }
    }
  }

  const summary = {
    run_id: new Date().toISOString().replace(/[:.]/g, "-"),
    prompt_version: INSIGHT_V2_PROMPT_VERSION,
    prompt_sha256: promptHash,
    schema_version: INSIGHT_V2_SCHEMA_VERSION,
    database_writes: false,
    models: {},
  };
  for (const modelId of models) {
    summary.models[modelId] = summarizeModel(resultsByModel[modelId]);
  }

  await writeFile(path.join(OUT_DIR, "all-results.json"), JSON.stringify(allRows, null, 2), "utf8");
  await writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2), "utf8");

  // Blind key only if both models present
  if (models.includes("gpt-4.1-mini") && models.includes("gpt-5.6-sol")) {
    const key = {
      created_at: new Date().toISOString(),
      prompt_version: INSIGHT_V2_PROMPT_VERSION,
      cases: {},
    };
    for (const dreamId of BLIND_ANCHOR_IDS) {
      const flip = randomInt(2) === 1;
      key.cases[dreamId] = flip
        ? { A: "gpt-5.6-sol", B: "gpt-4.1-mini" }
        : { A: "gpt-4.1-mini", B: "gpt-5.6-sol" };
    }
    await writeFile(
      path.join(ROOT, "INSIGHT_V2_MINI_VS_SOL_KEY.json"),
      JSON.stringify(key, null, 2),
      "utf8"
    );
    await writeFile(
      path.join(ROOT, "INSIGHT_V2_MINI_VS_SOL_BLIND.md"),
      buildBlindDoc(resultsByModel, key),
      "utf8"
    );
    await writeFile(
      path.join(ROOT, "INSIGHT_V2_MINI_VS_SOL_EVALUATION.md"),
      buildEvalReport(summary, resultsByModel),
      "utf8"
    );
  }

  console.log(`Wrote fixtures: ${fixturesPath}`);
  console.log(`Wrote summary: ${path.join(OUT_DIR, "summary.json")}`);
  for (const modelId of models) {
    console.log(`${modelId} overall=${summary.models[modelId].averages?.overall}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
