/**
 * Integration-style test: same post-process path as
 * POST /api/chat/messages → generateChatResponse → postProcessMoodyResponse
 *
 * Does not call OpenRouter. Injects the exact broken closer as model output.
 */
import assert from "assert";
import { postProcessMoodyResponse } from "./utils/moodybotPostProcess.ts";

const USER = "Why do feminists hate women praising men?";
const MODEL_DRAFT = [
  "The accusation stops being analysis the moment disagreement becomes evidence of betrayal.",
  "",
  "What about feminists hate woman looks different now that you've seen it named?",
].join("\n");

const result = postProcessMoodyResponse(MODEL_DRAFT, USER, {
  mode: "dynamic",
  appendRandomCta: false,
});

assert.strictEqual(result.landingEngineVersion, "signature-line-v3");
assert.ok(
  !/looks different now that you've seen it named/i.test(result.text),
  result.text
);
assert.ok(!/seen it named/i.test(result.text), result.text);
assert.ok(!/what about feminists/i.test(result.text), result.text);
assert.strictEqual(result.landing, "signature_line");
const closer = result.afterLandingLastSentence.replace(/🥃/g, "").trim();
assert.ok(
  !closer.endsWith("?") || /stretch|carrying|cracked/i.test(closer),
  `unexpected forced question closer: ${closer}`
);
// Must reveal one layer deeper — not restate the thesis body
assert.ok(
  !/accusation stops being analysis/i.test(closer),
  `restated thesis as Signature Line: ${closer}`
);

console.log("Dynamic endpoint landing integration test passed.");
console.log("final_http_last_sentence=", result.afterSurfaceLastSentence);
console.log("landing_engine_version=", result.landingEngineVersion);
