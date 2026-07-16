/**
 * Shared OpenAI request adapter for Adaptive Insight V2 generation.
 * Sol uses Responses API (proven in Mini-vs-Sol comparison).
 * Mini chat-completions retained only for historical offline eval scripts.
 *
 * Active default: recognition-v3.0
 * Fallback available: SYSTEM_PROMPT_V2 (adaptive-v2.2.1)
 */

import {
  INSIGHT_V2_JSON_SCHEMA,
  INSIGHT_V2_MODEL,
  SYSTEM_PROMPT_RECOGNITION_V3,
  SYSTEM_PROMPT_V2,
  buildInsightRecognitionV3UserContent,
  buildInsightV2UserContent,
} from "./insight-v2.mjs";

export const SOL_REQUEST_SETTINGS = {
  model: "gpt-5.6-sol",
  api: "responses",
  reasoning_effort: "medium",
  reasoning_mode: "standard",
  tools: "none",
  store: false,
  text_format: "json_schema",
};

export function extractResponsesText(response) {
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

/**
 * Generate one Insight via gpt-5.6-sol + recognition-v3.0 (Responses API).
 * Pass systemPrompt: SYSTEM_PROMPT_V2 to use adaptive-v2.2.1 fallback.
 * @returns {{ rawContent: string, usage: object, completionModel: string }}
 */
export async function generateInsightWithSol(
  openai,
  {
    title,
    body,
    systemPrompt = SYSTEM_PROMPT_RECOGNITION_V3,
    userContentBuilder = null,
  } = {}
) {
  const buildUser =
    userContentBuilder ||
    (systemPrompt === SYSTEM_PROMPT_V2
      ? buildInsightV2UserContent
      : buildInsightRecognitionV3UserContent);

  const response = await openai.responses.create({
    model: INSIGHT_V2_MODEL,
    reasoning: {
      effort: "medium",
    },
    store: false,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: buildUser(title, body) },
    ],
    text: {
      format: {
        type: "json_schema",
        name: INSIGHT_V2_JSON_SCHEMA.name,
        strict: true,
        schema: INSIGHT_V2_JSON_SCHEMA.schema,
      },
    },
  });

  return {
    rawContent: extractResponsesText(response),
    usage: {
      input_tokens: response.usage?.input_tokens ?? null,
      output_tokens: response.usage?.output_tokens ?? null,
      total_tokens: response.usage?.total_tokens ?? null,
      reasoning_tokens: response.usage?.output_tokens_details?.reasoning_tokens ?? null,
    },
    completionModel: response.model || INSIGHT_V2_MODEL,
  };
}
