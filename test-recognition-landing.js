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
import { bodyAlreadyLands, bodyAlreadySaidThis, deletionTest } from "./utils/signatureLine.ts";

const BAD =
  "What about feminists hate woman looks different now that you've seen it named?";

function testValidateLandingRejectsExactFailure() {
  const v = validateLanding(BAD);
  assert.strictEqual(v.ok, false);
  assert.ok(v.reason.startsWith("REJECTED"));
}

function testBodyAlreadyLandsStops() {
  const body =
    "The 'pick me' charge works as social enforcement of loyalty. " +
    "Public gratitude threatens movements built on resentment.";
  assert.strictEqual(bodyAlreadyLands(body), true);
  const { text, landing } = applyRecognitionLanding(body + "\n\n" + BAD, "Why feminists?");
  assert.ok(!/seen it named/i.test(text));
  assert.strictEqual(landing, "body_ends_response");
}

function testRestatementRejected() {
  const body = "The 'pick me' charge works as social enforcement.";
  const weak = "The 'pick me' charge works as social enforcement, not protection.";
  assert.strictEqual(bodyAlreadySaidThis(weak, body), true);
  assert.strictEqual(deletionTest(body, weak), false);
}

function testPostProcessDynamicPath() {
  const draft =
    "The accusation stops being analysis the moment disagreement becomes evidence of betrayal.\n\n" +
    BAD;
  const result = postProcessMoodyResponse(
    draft,
    "Why do feminists hate women praising men?",
    { mode: "dynamic", appendRandomCta: false }
  );
  assert.strictEqual(result.landingEngineVersion, "earned-ending-v1");
  assert.ok(!/seen it named/i.test(result.text));
  assert.ok(["body_ends_response", "signature_line", "silence"].includes(result.landing));
}

function testLandingEngineVersionConstant() {
  assert.strictEqual(LANDING_ENGINE_VERSION, "earned-ending-v1");
}

testValidateLandingRejectsExactFailure();
testBodyAlreadyLandsStops();
testRestatementRejected();
testPostProcessDynamicPath();
testLandingEngineVersionConstant();
console.log("All recognition landing tests passed.");
console.log("landing_engine_version=", LANDING_ENGINE_VERSION);
void lastSentence;
void isBrokenCloser;
