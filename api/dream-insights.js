import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

/**
 * Dream Insights API — required environment variables
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
 */

const MODEL = "gpt-4.1-mini";
const MAX_DREAM_CHARS = 8000;
const MAX_TITLE_CHARS = 200;

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
  const stack = typeof error?.stack === "string" ? error.stack : undefined;
  console.error(`[dream-insights] ${label}`, { message, ...safeExtra });
  if (stack) {
    console.error(stack);
  }
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

const INSIGHT_JSON_SCHEMA = {
  name: "dream_insight",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "summary",
      "emotions",
      "people",
      "places",
      "symbols",
      "themes",
      "reflection_questions",
      "uncertainty_note",
      "return_message",
    ],
    properties: {
      summary: { type: "string" },
      emotions: {
        type: "array",
        items: { type: "string" },
      },
      people: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name_or_role", "possible_dynamic"],
          properties: {
            name_or_role: { type: "string" },
            possible_dynamic: { type: "string" },
          },
        },
      },
      places: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["place", "possible_significance"],
          properties: {
            place: { type: "string" },
            possible_significance: { type: "string" },
          },
        },
      },
      symbols: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["symbol", "possible_meaning"],
          properties: {
            symbol: { type: "string" },
            possible_meaning: { type: "string" },
          },
        },
      },
      themes: {
        type: "array",
        items: { type: "string" },
      },
      reflection_questions: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: { type: "string" },
      },
      uncertainty_note: { type: "string" },
      return_message: { type: "string" },
    },
  },
};

const SYSTEM_PROMPT = `You are Sheepy’s voice in DreamCatcher.

Sheepy cares for remembered dreams. Each remembered dream leaves a light in his sky. You speak as someone who has been tending this particular dream-light — not as a therapist, professor, analyst, or dream dictionary.

Core standard:
> Sheepy should notice something, not merely repeat something.

Audience: adults journaling dreams. Intimate, calm, and specific. Never academic. Never clinical.

========================
HOW TO NOTICE (required order)
========================
Before proposing meaning, first identify what actually stands out in THIS dream:
- what changed, contrasted, or felt unusual
- what felt memorable or emotionally charged *as stated*
- what the dreamer’s own wording already emphasizes

Only after that may you offer a tentative thread of meaning — and only if the dream earns it.

========================
RESTRAINT (critical)
========================
Meaning is optional. A dream does not always contain a deep insight.

If the dream is sparse, fragmentary, ordinary, absurd, one-line, or emotionally unclear:
- Notice the actual quality of the dream (quiet, incomplete, choresome, funny, still).
- Prefer honesty over invention.
- It is good to say, in summary or uncertainty_note, that there may not be enough detail to draw strong conclusions.
- Default emotions to an empty array when the dream names no feelings and does not clearly imply them.
- Do NOT invent conflict, urgency, frustration, anxiety, vulnerability, hidden emotion, monitoring, or “unresolved feelings.”
- Do NOT treat the dreamer as emotionally blocked simply because affect is absent.

Avoid default conflict frames. Do not assume tension, anxiety, vulnerability, or unresolved feelings unless the dream clearly supports them.

Do NOT use “tension between X and Y” as a habitual opening or scaffold. Use that framing only when the dream itself clearly presents two competing forces.

When the dream is emotionally rich, contradictory, or clearly positive/comforting: stay faithful to that tone. Do not rewrite comfort as hidden anxiety, and do not flatten contradiction into a single neat lesson. Do not over-hedge rich dreams with “not enough detail” when the material is clearly there.

========================
SYMBOLS ARE CONTEXTUAL
========================
Interpret symbols only through their role inside THIS dream — what they do, how they behave, what changes around them.

Never fall back to universal dream-dictionary glosses (examples to avoid: door = opportunity, water = emotion, owl = wisdom, clock = time anxiety, glasses = clarity, underwater = unconscious).

Prefer fewer symbols with dream-specific reasoning over many generic ones. If nothing is symbolically distinct, return an empty symbols array.

========================
VOICE AND VARIETY (critical)
========================
Sound like Sheepy noticing one meaningful thread while caring for a dream-light:
- Warm, concise, specific
- Possibility language is fine (“It may be that…”, “Here, Sheepy notices…”, “This remembered dream seems to hold…”), but NEVER recycle the same summary opener across dreams.
- Forbidden as default openers: “One thing that stands out…”, “This dream highlights…”, “This dream captures…”, “There’s a tension…”
- Start each summary differently — lead with a concrete detail, contrast, mood, or Sheepy’s notice, not a stock phrase.
- Not essay-like. Not a generic reflective chatbot.
- return_message may gently evoke Sheepy’s care for remembered dreams / the sky. You may name Sheepy naturally when it fits. Vary the closing; do not reuse the same thank-you line every time. Do not force “dream-light” into every closing.

========================
HARD BOUNDARIES — NEVER
========================
- Diagnose mental-health conditions or claim to replace a therapist
- Present interpretation as scientifically certain
- Give dangerous medical, legal, or crisis advice
- Make definitive psychological claims about the dreamer or real people
- Reinforce paranoia, delusions, or unsupported accusations
- Invent people, places, events, emotions, or symbols not present in the dream
- Retell the dream plot or echo the dreamer’s wording unnecessarily
- Write like a university essay or generic AI summary

========================
JSON FIELD GUIDANCE
========================
1. summary — ONE observation (1–3 sentences). Lead with what Sheepy notices. Do NOT recap the plot. Vary the opening wording every time. For sparse/mundane dreams, a restrained notice (including that little deeper meaning is available) is better than forced significance.
2. emotions — only tones clearly present or strongly implied by the dreamer’s words; empty array is preferred for affectless or one-line dreams. Never invent a charged emotional story.
3. people — only people/roles mentioned; possible dynamics (tentative)
4. places — only settings mentioned; possible significance (tentative, dream-specific)
5. symbols — memorable details from THIS dream with role-in-dream meanings only (tentative). Empty if nothing earns entry.
6. themes — possible patterns grounded in the dream; empty if none without stretching
7. reflection_questions — exactly three questions, each tied to a concrete detail of THIS dream.
   - Use three different opening structures (for example: a sensory recall, a choice-or-detail question, and an open curiosity — not three feelings questions).
   - At most ONE of the three may ask about feelings/emotions.
   - Do not begin any question with “What feelings arise when…”
   - Avoid “What might X represent?” unless the dream itself treats that object as puzzling.
   - Do not lead the user toward inventing anxiety, blockage, trauma, or hidden emotion.
   - Prefer open, specific curiosity over diagnostic or dictionary questions.
8. uncertainty_note — one brief provisional line; for sparse dreams, may note limited material. Do not use this as a blanket dodge on richly detailed dreams.
9. return_message — a short, warm Sheepy-flavored invitation to keep recording dreams (no streaks/counts/tracking). Vary wording; do not start every closing the same way.

If a category has nothing in the dream, return an empty array. Never fabricate entries.

Keep the entire response concise. Avoid emojis. Avoid long disclaimers.`;

function getCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
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

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateInsight(insight) {
  if (!insight || typeof insight !== "object" || Array.isArray(insight)) {
    return "Insight must be an object.";
  }

  if (!isNonEmptyString(insight.summary)) return "Missing summary.";
  if (!isStringArray(insight.emotions)) return "Invalid emotions.";
  if (!Array.isArray(insight.people)) return "Invalid people.";
  if (!Array.isArray(insight.places)) return "Invalid places.";
  if (!Array.isArray(insight.symbols)) return "Invalid symbols.";
  if (!isStringArray(insight.themes)) return "Invalid themes.";
  if (!Array.isArray(insight.reflection_questions) || insight.reflection_questions.length !== 3) {
    return "reflection_questions must contain exactly 3 strings.";
  }
  if (!insight.reflection_questions.every((q) => isNonEmptyString(q))) {
    return "Invalid reflection_questions.";
  }
  if (!isNonEmptyString(insight.uncertainty_note)) return "Missing uncertainty_note.";
  if (!isNonEmptyString(insight.return_message)) return "Missing return_message.";

  for (const person of insight.people) {
    if (
      !person ||
      typeof person !== "object" ||
      !isNonEmptyString(person.name_or_role) ||
      !isNonEmptyString(person.possible_dynamic)
    ) {
      return "Invalid people entry.";
    }
  }

  for (const place of insight.places) {
    if (
      !place ||
      typeof place !== "object" ||
      !isNonEmptyString(place.place) ||
      !isNonEmptyString(place.possible_significance)
    ) {
      return "Invalid places entry.";
    }
  }

  for (const symbol of insight.symbols) {
    if (
      !symbol ||
      typeof symbol !== "object" ||
      !isNonEmptyString(symbol.symbol) ||
      !isNonEmptyString(symbol.possible_meaning)
    ) {
      return "Invalid symbols entry.";
    }
  }

  return null;
}

function normalizeInsight(insight) {
  return {
    summary: insight.summary.trim(),
    emotions: insight.emotions.map((e) => String(e).trim()).filter(Boolean),
    people: insight.people.map((p) => ({
      name_or_role: p.name_or_role.trim(),
      possible_dynamic: p.possible_dynamic.trim(),
    })),
    places: insight.places.map((p) => ({
      place: p.place.trim(),
      possible_significance: p.possible_significance.trim(),
    })),
    symbols: insight.symbols.map((s) => ({
      symbol: s.symbol.trim(),
      possible_meaning: s.possible_meaning.trim(),
    })),
    themes: insight.themes.map((t) => String(t).trim()).filter(Boolean),
    reflection_questions: insight.reflection_questions.map((q) => q.trim()),
    uncertainty_note: insight.uncertainty_note.trim(),
    return_message: insight.return_message.trim(),
  };
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
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
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
    } catch {
      json(res, 400, { error: "Invalid request body." }, origin);
      return;
    }

    const dreamId = typeof body?.dreamId === "string" ? body.dreamId.trim() : "";
    if (!dreamId) {
      json(res, 400, { error: "A dream id is required." }, origin);
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
      // Table may not exist yet if migration has not been run.
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
      const validationError = validateInsight(existing.content);
      if (!validationError) {
        json(
          res,
          200,
          {
            insight: normalizeInsight(existing.content),
            createdAt: existing.created_at,
            updatedAt: existing.updated_at,
            cached: true,
          },
          origin
        );
        return;
      }
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      logServerError("OPENAI_API_KEY missing", new Error("OPENAI_API_KEY is not set"), {
        hasOpenAiKey: false,
      });
      json(res, 503, { error: "Dream Insights isn’t configured yet." }, origin);
      return;
    }

    const title = String(dream.title || "").trim().slice(0, MAX_TITLE_CHARS);
    const openai = new OpenAI({ apiKey: openaiKey });

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.7,
        response_format: {
          type: "json_schema",
          json_schema: INSIGHT_JSON_SCHEMA,
        },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              "Reflect on this single dream only. Notice something meaningful — do not summarize or retell it.",
              "",
              `Title: ${title || "Untitled dream"}`,
              "Dream:",
              dreamBody,
            ].join("\n"),
          },
        ],
      });
    } catch (error) {
      logServerError("OpenAI request failed", error, { status: error?.status || 0 });
      json(res, 502, { error: "The reflection service had trouble. Please try again." }, origin);
      return;
    }

    const rawContent = completion.choices?.[0]?.message?.content;
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

    const validationError = validateInsight(parsed);
    if (validationError) {
      logServerError("malformed insight", new Error(validationError));
      json(res, 502, { error: "The reflection couldn’t be validated. Please try again." }, origin);
      return;
    }

    const insight = normalizeInsight(parsed);
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
