/**
 * Dynamic path: body may end the response. No mandatory Signature Line.
 */
import assert from "assert";
import { postProcessMoodyResponse } from "./utils/moodybotPostProcess.ts";

const USER = "Why do feminists hate women praising men?";
const MODEL_DRAFT = [
  "The 'pick me' charge works as social enforcement of loyalty.",
  "Public gratitude toward one man threatens movements that depend on collective resentment.",
  "",
  "What about feminists hate woman looks different now that you've seen it named?",
].join("\n");

const result = postProcessMoodyResponse(MODEL_DRAFT, USER, {
  mode: "dynamic",
  appendRandomCta: false,
});

assert.strictEqual(result.landingEngineVersion, "earned-ending-v1");
assert.ok(!/looks different now that you've seen it named/i.test(result.text));
assert.ok(!/seen it named/i.test(result.text));
// Body already lands — stop writing (no manufactured mic-drop required)
assert.ok(
  ["body_ends_response", "signature_line"].includes(result.landing),
  result.landing
);
if (result.landing === "body_ends_response") {
  assert.ok(!/moment gratitude becomes betrayal/i.test(result.text));
}

console.log("Dynamic endpoint earned-ending test passed.");
console.log("landing=", result.landing);
console.log("final_http_last_sentence=", result.afterSurfaceLastSentence);
console.log("landing_engine_version=", result.landingEngineVersion);
