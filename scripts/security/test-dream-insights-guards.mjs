#!/usr/bin/env node
/**
 * Behavioral checks for Dream Insights API request guards.
 * Does not call Supabase or OpenAI.
 */

import { Readable } from "node:stream";
import {
  isAllowedOrigin,
  MAX_REQUEST_BYTES,
  readJsonBody,
} from "../../api/dream-insights.js";

let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`ok: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
    failed += 1;
  }
}

async function testParsedBodyWithinLimit() {
  const body = { dreamId: "11111111-1111-4111-8111-111111111111" };
  const result = await readJsonBody({ body });
  assert("parsed body within limit returns object", result.dreamId === body.dreamId);
}

async function testParsedBodyTooLarge() {
  const body = { dreamId: "x".repeat(MAX_REQUEST_BYTES + 1) };
  let code = null;
  try {
    await readJsonBody({ body });
  } catch (error) {
    code = error?.code || null;
  }
  assert("parsed body over MAX_REQUEST_BYTES throws BODY_TOO_LARGE", code === "BODY_TOO_LARGE");
}

async function testStreamBodyTooLarge() {
  const payload = "x".repeat(MAX_REQUEST_BYTES + 1);
  const stream = Readable.from([Buffer.from(payload, "utf8")]);
  let code = null;
  try {
    await readJsonBody(stream);
  } catch (error) {
    code = error?.code || null;
  }
  assert("stream body over MAX_REQUEST_BYTES throws BODY_TOO_LARGE", code === "BODY_TOO_LARGE");
}

function testOriginAcceptance() {
  const previous = process.env.ALLOWED_ORIGINS;
  try {
    delete process.env.ALLOWED_ORIGINS;

    assert("localhost http allowed", isAllowedOrigin("http://localhost:5173") === true);
    assert("127.0.0.1 allowed", isAllowedOrigin("http://127.0.0.1:3000") === true);
    assert("missing origin rejected", isAllowedOrigin("") === false);
    assert("arbitrary vercel.app rejected without allowlist", isAllowedOrigin("https://evil.vercel.app") === false);
    assert("foreign origin rejected without allowlist", isAllowedOrigin("https://evil.example.com") === false);

    process.env.ALLOWED_ORIGINS = "https://dreamcatcher.example.com, https://preview.example.com";
    assert(
      "exact ALLOWED_ORIGINS entry accepted",
      isAllowedOrigin("https://dreamcatcher.example.com") === true
    );
    assert(
      "non-listed origin rejected even with ALLOWED_ORIGINS set",
      isAllowedOrigin("https://evil.vercel.app") === false
    );
  } finally {
    if (previous === undefined) {
      delete process.env.ALLOWED_ORIGINS;
    } else {
      process.env.ALLOWED_ORIGINS = previous;
    }
  }
}

await testParsedBodyWithinLimit();
await testParsedBodyTooLarge();
await testStreamBodyTooLarge();
testOriginAcceptance();

if (failed > 0) {
  process.exit(1);
}

console.log("All Dream Insights guard checks passed.");
