/**
 * Hard rejection + Dynamic post-process integration tests.
 * Runs against the SAME postProcess path used by generateChatResponse.
 */
import assert from "assert";
import {
  LANDING_ENGINE_VERSION,
  lastSentence,
  postProcessMoodyResponse,
  validateLanding,
} from "./utils/moodybotPostProcess.ts";
import {
  applyRecognitionLanding,
  isBrokenCloser,
} from "./utils/recognitionLanding.ts";

const BAD =
  "What about feminists hate woman looks different now that you've seen it named?";

function testValidateLandingRejectsExactFailure() {
  const v = validateLanding(BAD);
  assert.strictEqual(v.ok, false, "exact failure must be REJECTED");
  assert.ok(v.reason.startsWith("REJECTED"), v.reason);
}

function testMalformedFamilyRejected() {
  const cases = [
    "What about X looks different now that you've seen it named?",
    "What about Y hate Z looks different?",
    "Something ended. Now that you've seen it named?",
    "What about feminists hate woman looks different now that you've seen it named?",
  ];
  for (const c of cases) {
    assert.strictEqual(
      validateLanding(c).ok,
      false,
      `should reject: ${c}`
    );
    assert.strictEqual(isBrokenCloser(c), true, `broken: ${c}`);
  }
}

function testApplyLandingStripsBrokenCloser() {
  const draft =
    "Healthy ideas don't require loyalty tests.\n\n" + BAD;
  const { text, modified } = applyRecognitionLanding(
    draft,
    "Why do feminists hate women praising men?"
  );
  assert.ok(modified);
  assert.ok(!/seen it named/i.test(text), text);
  assert.ok(!/what about feminists/i.test(text), text);
  assert.strictEqual(validateLanding(lastSentence(text)).ok, true);
}

function testPostProcessDynamicPath() {
  const draft =
    "The accusation stops being analysis the moment disagreement becomes evidence.\n\n" +
    BAD;
  const result = postProcessMoodyResponse(
    draft,
    "Why do feminists hate women praising men?",
    { mode: "dynamic", appendRandomCta: false }
  );
  assert.strictEqual(result.landingEngineVersion, "recognition-landing-v1");
  assert.ok(!/seen it named/i.test(result.text), result.text);
  assert.ok(!/looks different now that you've seen it named/i.test(result.text));
  // Random CTA must not be appended for Dynamic
  assert.ok(!/Breathe before you reply/i.test(result.text));
  assert.ok(!/You wanted the truth/i.test(result.text));
}

function testLandingEngineVersionConstant() {
  assert.strictEqual(LANDING_ENGINE_VERSION, "recognition-landing-v1");
}

testValidateLandingRejectsExactFailure();
testMalformedFamilyRejected();
testApplyLandingStripsBrokenCloser();
testPostProcessDynamicPath();
testLandingEngineVersionConstant();
console.log("All recognition landing tests passed.");
console.log("landing_engine_version=", LANDING_ENGINE_VERSION);
