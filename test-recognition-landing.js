import assert from "assert";
import {
  CORE_WRITE_DIRECTIVE,
  LANDING_ENGINE_VERSION,
  lastSentence,
  postProcessMoodyResponse,
  validateLanding,
} from "./utils/moodybotPostProcess.ts";
import {
  applyRecognitionLanding,
  isBrokenCloser,
} from "./utils/recognitionLanding.ts";
import {
  CREATIVE_ENDING_TOOLS_ENABLED,
  bodyAlreadySaidThis,
  deletionTest,
  isShorterParaphrase,
} from "./utils/signatureLine.ts";

const BAD =
  "What about feminists hate woman looks different now that you've seen it named?";

const GOT_INSIGHT =
  "Game of Thrones didn't fail because the characters ended in the wrong places. " +
  "It failed because the show stopped earning the distance between cause and consequence.\n\n" +
  "Daenerys is the cleanest example: madness may have been a plausible destination, " +
  "but the show skipped the road.";

function testValidateLandingRejectsExactFailure() {
  const v = validateLanding(BAD);
  assert.strictEqual(v.ok, false);
  assert.ok(v.reason.startsWith("REJECTED"));
}

function testMinimalWriteNoForcedSignature() {
  assert.strictEqual(CREATIVE_ENDING_TOOLS_ENABLED, false);
  assert.strictEqual(LANDING_ENGINE_VERSION, "protect-only-v1");
  const { text, landing, landingAdded } = applyRecognitionLanding(GOT_INSIGHT, "Why season 8?");
  assert.strictEqual(landing, "body_ends_response");
  assert.strictEqual(landingAdded, false);
  assert.ok(text.toLowerCase().includes("stopped earning"));
  assert.ok(!/moment gratitude becomes betrayal/i.test(text));
}

function testNoQuestionOrCtaForced() {
  const withJunk = GOT_INSIGHT + "\n\nDo you want me to break this down? Say the word.\n\n" + BAD;
  const result = postProcessMoodyResponse(withJunk, "Why season 8?", {
    mode: "dynamic",
    appendRandomCta: false,
  });
  assert.strictEqual(result.landing, "body_ends_response");
  assert.strictEqual(result.landingAdded, false);
  assert.ok(!/seen it named/i.test(result.text));
  assert.ok(!/do you want/i.test(result.text));
  assert.ok(!/say the word/i.test(result.text));
}

function testSignatureRejectedWhenShorterParaphrase() {
  const body =
    "Public gratitude toward one man threatens movements that depend on collective resentment of all men.";
  const weak = "Public gratitude toward one man threatens movements.";
  assert.strictEqual(isShorterParaphrase(weak, body), true);
  assert.strictEqual(bodyAlreadySaidThis(weak, body), true);
  assert.strictEqual(deletionTest(body, weak), false);
}

function testInventoryDraftNotDecorated() {
  const inventory =
    "Game of Thrones stands as the clearest case. After seven seasons of intricate plotting, " +
    "the final season compressed years of character logic into six rushed episodes.\n\n" +
    "Daenerys's arc collapsed. Jon was exiled. Bran became king.";
  const result = postProcessMoodyResponse(inventory, "Why season 8 failed?", {
    mode: "dynamic",
    appendRandomCta: false,
  });
  assert.strictEqual(result.landingAdded, false);
  assert.ok(!/power protects itself/i.test(result.text));
  assert.ok(!/stories defend themselves/i.test(result.text));
  // Persona costume should not rewrite the body on default path
  assert.ok(result.text.toLowerCase().includes("daenerys"));
}

function testLandingEngineVersionConstant() {
  assert.strictEqual(LANDING_ENGINE_VERSION, "protect-only-v1");
}

function testWriteDirectiveRequiresProofNotRecap() {
  const lower = CORE_WRITE_DIRECTIVE.toLowerCase();
  assert.ok(lower.includes("thesis") && lower.includes("proof"));
  assert.ok(lower.includes("plot summary"));
  assert.ok(lower.includes("mechanism") || lower.includes("governing pattern"));
}

testValidateLandingRejectsExactFailure();
testMinimalWriteNoForcedSignature();
testNoQuestionOrCtaForced();
testSignatureRejectedWhenShorterParaphrase();
testInventoryDraftNotDecorated();
testLandingEngineVersionConstant();
testWriteDirectiveRequiresProofNotRecap();
console.log("All protect-only landing tests passed.");
console.log("landing_engine_version=", LANDING_ENGINE_VERSION);
void lastSentence;
void isBrokenCloser;
