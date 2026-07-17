import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  INSIGHT_V2_MODEL,
  normalizeInsightV2,
  normalizeStoredInsight,
  validateInsightV2,
  validateStoredInsight,
} from "../lib/insight-v2.mjs";
import { generateInsightWithSol } from "../lib/insight-v2-openai.mjs";

/**
 * Dream Insights API — Adaptive Insight V2.2 generation (Sol feature branch).
 * -------------------------------------------------
 * Local (`.env.local`) and Vercel (Development / Preview / Production):
 *
 * Preferred for this serverless function (reuse the same publishable project values):
 *   SUPABASE_URL              — project URL (same value as VITE_SUPABASE_URL)
 *   SUPABASE_ANON_KEY         — publishable/anon key (same value as VITE_SUPABASE_PUBLISHABLE_KEY)
 *
 * Accepted fallbacks (so existing Vite credentials still work):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY
 *   SUPABASE_PUBLISHABLE_KEY  — alias for the anon/publishable key
 *
 * Also required for generation (server-only; never prefix with VITE_):
 *   OPENAI_API_KEY
 *
 * Do NOT use a Supabase service-role key here. Ownership is enforced with the
 * caller's JWT + Row Level Security on `dreams` / `dream_insights`.
 *
 * Cached V1 and prior V2 insights remain valid and are returned as-is (normalized).
 * New generations use gpt-5.6-sol + recognition-v3.0 via the Responses API.
 * Prompt version changes do not regenerate existing cached insights.
 * Fallback prompt adaptive-v2.2.1 remains available in lib/insight-v2.mjs.
 */

const MODEL = INSIGHT_V2_MODEL;
const MAX_DREAM_CHARS = 8000;
const MAX_TITLE_CHARS = 200;
const MAX_REQUEST_BYTES = 4096;
const MAX_NEW_INSIGHTS_PER_HOUR = 15;
const MAX_NEW_INSIGHTS_PER_DAY = 60;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Log server diagnostics without printing secrets or tokens. */
function logServerError(label, error, extra = {}) {
  const safeExtra = {};
  for (const [key, value] of Object.entries(extra)) {
    if (typeof value === "boolean" || typeof value === "number") {
      safeExtra[key] = value;
    } else if (typeof value === "string" && value.length < 80 && !/key|token|secret|bearer|authorization/i.test(key)) {
      safeExtra[key] = value;
    }
  }

  const message = error?.message || String(error || "unknown error");
  console.error(`[dream-insights] ${label}`, { message, ...safeExtra });
}

function resolveSupabaseEnv() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";

  return {
    supabaseUrl: supabaseUrl.trim(),
    supabaseAnonKey: supabaseAnonKey.trim(),
    hasSupabaseUrl: Boolean((process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim()),
    hasSupabaseAnonKey: Boolean(
      (
        process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        ""
      ).trim()
    ),
    usedUrlSource: process.env.SUPABASE_URL
      ? "SUPABASE_URL"
      : process.env.VITE_SUPABASE_URL
        ? "VITE_SUPABASE_URL"
        : "none",
    usedKeySource: process.env.SUPABASE_ANON_KEY
      ? "SUPABASE_ANON_KEY"
      : process.env.SUPABASE_PUBLISHABLE_KEY
        ? "SUPABASE_PUBLISHABLE_KEY"
        : process.env.VITE_SUPABASE_PUBLISHABLE_KEY
          ? "VITE_SUPABASE_PUBLISHABLE_KEY"
          : "none",
  };
}

function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;

  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (configured.includes(origin)) return true;

  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (hostname.endsWith(".vercel.app")) return true;
  } catch {
    return false;
  }

  return false;
}

function getCorsHeaders(origin) {
  const allowOrigin = isAllowedOrigin(origin) ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(res, status, body, origin) {
  const headers = {
    "Content-Type": "application/json",
    ...getCorsHeaders(origin),
  };
  res.statusCode = status;
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(body));
}

function readBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function createUserSupabase(accessToken) {
  const env = resolveSupabaseEnv();

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    const err = new Error(
      "Supabase env missing for Dream Insights. Set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY)."
    );
    err.code = "SUPABASE_ENV_MISSING";
    err.diagnostics = {
      hasSupabaseUrl: env.hasSupabaseUrl,
      hasSupabaseAnonKey: env.hasSupabaseAnonKey,
      usedUrlSource: env.usedUrlSource,
      usedKeySource: env.usedKeySource,
    };
    throw err;
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_REQUEST_BYTES) {
      const err = new Error("Request body too large.");
      err.code = "BODY_TOO_LARGE";
      throw err;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function hoursAgoIso(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function countRecentInsightGenerations(supabase, userId, sinceIso) {
  const { count, error } = await supabase
    .from("dream_insights")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sinceIso);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";

  if (req.method === "OPTIONS") {
    json(res, 204, {}, origin);
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed." }, origin);
    return;
  }

  try {
    const accessToken = readBearerToken(req);
    if (!accessToken) {
      json(res, 401, { error: "Sign in to generate a Dream Insight." }, origin);
      return;
    }

    let supabase;
    try {
      supabase = createUserSupabase(accessToken);
    } catch (error) {
      logServerError("createUserSupabase failed", error, {
        code: error?.code || "unknown",
        hasSupabaseUrl: error?.diagnostics?.hasSupabaseUrl,
        hasSupabaseAnonKey: error?.diagnostics?.hasSupabaseAnonKey,
        usedUrlSource: error?.diagnostics?.usedUrlSource,
        usedKeySource: error?.diagnostics?.usedKeySource,
        hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      });
      json(res, 500, { error: "Dream Insights is temporarily unavailable." }, origin);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      json(res, 401, { error: "Your session expired. Log in again." }, origin);
      return;
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      if (error?.code === "BODY_TOO_LARGE") {
        json(res, 413, { error: "Request too large." }, origin);
        return;
      }
      json(res, 400, { error: "Invalid request body." }, origin);
      return;
    }

    const dreamId = typeof body?.dreamId === "string" ? body.dreamId.trim() : "";
    if (!dreamId) {
      json(res, 400, { error: "A dream id is required." }, origin);
      return;
    }

    if (!UUID_RE.test(dreamId)) {
      json(res, 400, { error: "Invalid dream id." }, origin);
      return;
    }

    const { data: dream, error: dreamError } = await supabase
      .from("dreams")
      .select("id, user_id, title, body")
      .eq("id", dreamId)
      .maybeSingle();

    if (dreamError) {
      logServerError("dream load failed", dreamError, { code: dreamError.code || "unknown" });
      json(res, 500, { error: "Couldn’t load that dream right now." }, origin);
      return;
    }

    // RLS returns no row for dreams the caller does not own (or that do not exist).
    if (!dream || dream.user_id !== user.id) {
      json(res, 404, { error: "Dream not found." }, origin);
      return;
    }

    const dreamBody = String(dream.body || "").trim();
    if (!dreamBody) {
      json(res, 400, { error: "This dream has no text to reflect on." }, origin);
      return;
    }

    if (dreamBody.length > MAX_DREAM_CHARS) {
      json(
        res,
        400,
        {
          error: `This dream is too long for Insights right now (max ${MAX_DREAM_CHARS} characters).`,
        },
        origin
      );
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from("dream_insights")
      .select("id, content, created_at, updated_at")
      .eq("dream_id", dreamId)
      .maybeSingle();

    if (existingError) {
      const msg = String(existingError.message || "").toLowerCase();
      if (msg.includes("dream_insights") || msg.includes("schema cache") || existingError.code === "42P01") {
        json(
          res,
          503,
          {
            error:
              "Dream Insights storage isn’t ready yet. Ask the project owner to run the Supabase migration.",
          },
          origin
        );
        return;
      }
      logServerError("existing insight check failed", existingError, {
        code: existingError.code || "unknown",
      });
      json(res, 500, { error: "Couldn’t check for an existing insight." }, origin);
      return;
    }

    if (existing?.content) {
      const validationError = validateStoredInsight(existing.content);
      if (!validationError) {
        json(
          res,
          200,
          {
            insight: normalizeStoredInsight(existing.content),
            createdAt: existing.created_at,
            updatedAt: existing.updated_at,
            cached: true,
          },
          origin
        );
        return;
      }
      logServerError("cached insight failed validation", new Error(validationError));
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      logServerError("OPENAI_API_KEY missing", new Error("OPENAI_API_KEY is not set"), {
        hasOpenAiKey: false,
      });
      json(res, 503, { error: "Dream Insights isn’t configured yet." }, origin);
      return;
    }

    try {
      const hourlyCount = await countRecentInsightGenerations(supabase, user.id, hoursAgoIso(1));
      if (hourlyCount >= MAX_NEW_INSIGHTS_PER_HOUR) {
        json(res, 429, { error: "Too many insights right now. Please try again later." }, origin);
        return;
      }

      const dailyCount = await countRecentInsightGenerations(supabase, user.id, hoursAgoIso(24));
      if (dailyCount >= MAX_NEW_INSIGHTS_PER_DAY) {
        json(res, 429, { error: "Daily insight limit reached. Please try again tomorrow." }, origin);
        return;
      }
    } catch (error) {
      logServerError("insight rate limit check failed", error, {
        code: error?.code || "unknown",
      });
      json(res, 500, { error: "Couldn’t start this insight right now." }, origin);
      return;
    }

    const title = String(dream.title || "").trim().slice(0, MAX_TITLE_CHARS);
    const openai = new OpenAI({ apiKey: openaiKey });

    let rawContent;
    try {
      const generated = await generateInsightWithSol(openai, {
        title,
        body: dreamBody,
      });
      rawContent = generated.rawContent;
    } catch (error) {
      logServerError("OpenAI request failed", error, {
        status: error?.status || 0,
        model: MODEL,
      });
      json(res, 502, { error: "The reflection service had trouble. Please try again." }, origin);
      return;
    }

    if (!rawContent) {
      json(res, 502, { error: "No reflection was returned. Please try again." }, origin);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      json(res, 502, { error: "The reflection came back in an unexpected form. Please try again." }, origin);
      return;
    }

    const validationError = validateInsightV2(parsed);
    if (validationError) {
      logServerError("malformed insight", new Error(validationError));
      json(res, 502, { error: "The reflection couldn’t be validated. Please try again." }, origin);
      return;
    }

    const insight = normalizeInsightV2(parsed);
    const now = new Date().toISOString();

    const { data: saved, error: saveError } = await supabase
      .from("dream_insights")
      .upsert(
        {
          dream_id: dream.id,
          user_id: user.id,
          content: insight,
          updated_at: now,
        },
        { onConflict: "dream_id" }
      )
      .select("content, created_at, updated_at")
      .single();

    if (saveError) {
      logServerError("insight save failed", saveError, { code: saveError.code || "unknown" });
      json(
        res,
        500,
        {
          error:
            "The reflection was created but couldn’t be saved. Please try again in a moment.",
        },
        origin
      );
      return;
    }

    json(
      res,
      200,
      {
        insight: saved.content,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
        cached: false,
      },
      origin
    );
  } catch (error) {
    logServerError("unexpected handler error", error);
    json(res, 500, { error: "Something went wrong generating this insight." }, origin);
  }
}
