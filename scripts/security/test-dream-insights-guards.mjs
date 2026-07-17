#!/usr/bin/env node
/**
 * Static checks for Dream Insights API guard constants and helpers.
 * Does not call Supabase or OpenAI.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiPath = path.resolve(__dirname, "../../api/dream-insights.js");
const source = readFileSync(apiPath, "utf8");

const requiredPatterns = [
  ["MAX_REQUEST_BYTES", /const MAX_REQUEST_BYTES = 4096/],
  ["hourly rate cap", /MAX_NEW_INSIGHTS_PER_HOUR = 15/],
  ["daily rate cap", /MAX_NEW_INSIGHTS_PER_DAY = 60/],
  ["UUID validation", /UUID_RE/],
  ["CORS allowlist", /function isAllowedOrigin/],
  ["no wildcard CORS default", /allowOrigin = isAllowedOrigin\(origin\) \? origin : "null"/],
  ["request body size guard", /BODY_TOO_LARGE/],
  ["no stack logging", /console\.error\(stack\)/, false],
];

let failed = 0;

for (const [label, pattern, shouldMatch = true] of requiredPatterns) {
  const matched = pattern.test(source);
  if (matched !== shouldMatch) {
    console.error(`FAIL: ${label}`);
    failed += 1;
  } else {
    console.log(`ok: ${label}`);
  }
}

const openaiAdapter = readFileSync(
  path.resolve(__dirname, "../../lib/insight-v2-openai.mjs"),
  "utf8"
);
if (!/store:\s*false/.test(openaiAdapter)) {
  console.error("FAIL: OpenAI adapter must set store: false");
  failed += 1;
} else {
  console.log("ok: OpenAI adapter store: false");
}

if (failed > 0) {
  process.exit(1);
}

console.log("All Dream Insights guard checks passed.");
