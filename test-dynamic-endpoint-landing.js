/**
 * Dynamic path: protective post-process only. No forced Signature Line.
 */
import assert from "assert";
import { postProcessMoodyResponse } from "./utils/moodybotPostProcess.ts";

const USER = "Why did Game of Thrones season 8 fail?";
const MODEL_DRAFT = [
  "Game of Thrones didn't fail because the characters ended in the wrong places.",
  "It failed because the show stopped earning the distance between cause and consequence.",
  "",
  "Daenerys is the cleanest example: madness may have been a plausible destination, but the show skipped the road.",
  "",
  "What about feminists hate woman looks different now that you've seen it named?",
].join("\n");

const result = postProcessMoodyResponse(MODEL_DRAFT, USER, {
  mode: "dynamic",
  appendRandomCta: false,
});

assert.strictEqual(result.landingEngineVersion, "minimal-write-v1");
assert.strictEqual(result.landing, "body_ends_response");
assert.strictEqual(result.landingAdded, false);
assert.ok(!/seen it named/i.test(result.text));
assert.ok(result.text.toLowerCase().includes("stopped earning"));
assert.ok(!/moment gratitude becomes betrayal/i.test(result.text));

console.log("Dynamic endpoint minimal-write test passed.");
console.log("landing=", result.landing);
console.log("landing_added=", result.landingAdded);
console.log("post_finalizer_reason=", result.postFinalizerReason);
console.log("landing_engine_version=", result.landingEngineVersion);
