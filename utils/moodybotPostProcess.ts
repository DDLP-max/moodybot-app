/**
 * Protect-only post-process — infrastructure, not authorship.
 * CONTRACT (protect-only-v1): docs/PROTECT_ONLY_FINALIZER.md
 *
 * Before changing this file, answer ONE question:
 *   Does this prevent a defect, or does it change the writing?
 *   If it changes the writing → move to generation (prompt) or delete.
 *
 * Generation creates. Finalization protects. Nothing else.
 */
import {
  LANDING_ENGINE_VERSION,
  applyRecognitionLanding,
  lastSentence,
  responseTextAfterSurfaceSemanticallyEquals,
  validateLanding,
} from "./recognitionLanding";

export { LANDING_ENGINE_VERSION, validateLanding, lastSentence };

/** Prompt guidance for the LLM writer — not a finalizer rewrite checklist. */
export const CORE_WRITE_DIRECTIVE = `CORE WRITE RULE (highest priority for this reply):

THINK abstractly. SPEAK concretely.
MoodyBot sees systems. MoodyBot does not talk ABOUT systems.

MoodyBot does not describe what happened. MoodyBot explains why it felt the way it did.

Generation order (mandatory):
1) Intent / evidence
2) GOVERNING PATTERN — answer: "What invisible rule explains this?" (not "what sentence summarizes this?")
3) TRANSLATE that pattern into ordinary language (silently: how would I say this to one intelligent friend?)
4) WRITE: concrete claim → prove it once → STOP

TRUST THE READER:
Once the governing pattern is clear, do not explain it three ways.
Every extra sentence must add NEW understanding — not restate or reinforce the same point.
State it. Prove it once. Move on. Say less after the pattern is found.

Never dump internal reasoning labels into prose.
INTERNAL ONLY (do not expose unless precision truly requires): incentive structure, narrative contract, coherence, behavioral framework, systemic dynamic, optimization, governing mechanism, relational framework, institutional incentive, pattern architecture, epistemic calibration, pattern forensics, interaction model, operational architecture.

Prefer spoken observations: rules, promises, trust, cost, pressure, cheating, earning, breaking, winning, losing, waiting, leaving, staying, move, boundary, attention, reward.

First sentence = concrete claim with tension.
GOOD: "The show stopped playing by its own rules." / "He's making a move." / "People don't trust you yet."
BAD: "The series abandoned the incentive structure..." / "The relationship exhibits..." / "The trust architecture is underdeveloped."

Every paragraph: "What would a perceptive person actually notice?" — not "what analytical category is this?"
One excellent proof beats three shallow restatements.
If the body lands, STOP — no Signature Line, callback, quiz, CTA, or academic closer.

Do NOT open with throat-clearing. Do NOT reward essay language (deeper, higher-order, systemic, framework, meta-analysis).
Do NOT require metaphor, noir, or poetic costume. Keep real technical/legal terms when they are the precise terms.

Product test: reader thinks "I've never looked at it like that" — not "that was a sophisticated explanation."

If practical action was requested, end with a concrete next step.`;

export const moodyReplacements: Record<string, string> = {
  darling: "volatile angel",
  "beautiful mess": "gorgeously ruined soul",
  sweetheart: "feral romantic",
  babe: "existential gymnast",
  honey: "doomed optimist",
  cutie: "emotional hostage",
  love: "walking contradiction",
  sunshine: "neon heartbreak",
  "baby girl": "sentient ache",
};

/** Off by default — costume swaps are a second writer. */
export function replaceMoodyDescriptors(text: string): string {
  let result = text;
  for (const [k, v] of Object.entries(moodyReplacements)) {
    const regex = new RegExp(`\\b${k}\\b`, "gi");
    result = result.replace(regex, v);
  }
  return result;
}

export function polishSentences(text: string): string {
  // Formatting only — do not rewrite openings or rhythm
  return text
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

export function autoParagraph(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

export function cleanWeakOpeners(text: string): string {
  // Do not rewrite openings — leave the model's first words alone
  return (text || "").trimStart();
}

export function appendSignature(text: string, signature = "\ud83e\udd43 @MoodyBotAI"): string {
  return text.includes(signature) ? text : `${text}\n${signature}`;
}

export function cleanMoodySignoffs(text: string): string {
  // Generic assistant garbage only
  return text
    .replace(/\b(Bet it hits different.*?|Now cry about it\.?|Be honest.*?|Deal with it\.?)+$/i, "")
    .trim();
}

export function getRandomCta(): string {
  const ctas = [
    "Breathe before you reply.",
    "Tag \ud83e\udd43 @MoodyBotAI if it wrecked you.",
    "He won’t save you, but he’ll make you feel seen.",
    "You wanted the truth, right?",
  ];
  return ctas[Math.floor(Math.random() * ctas.length)];
}

/** Typography only. */
export function finalSurfaceRender(text: string): string {
  return (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s*[—–]\s*/g, " - ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeCompare(text: string): string {
  return (text || "")
    .replace(/\s*🥃\s*/g, " ")
    .replace(/@MoodyBotAI/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type PostProcessResult = {
  text: string;
  landingEngineVersion: string;
  landing: string;
  draftLastSentence: string;
  afterLandingLastSentence: string;
  afterSurfaceLastSentence: string;
  landingModified: boolean;
  landingAdded: boolean;
  postFinalizerChangedText: boolean;
  postFinalizerReason: string;
  ctaRemoved: boolean;
  governingPattern: string;
  /** @deprecated use governingPattern */
  coreInsight: string;
  creativeTouch: boolean;
};

/**
 * Protect only:
 * strip broken CTA/closers → format → brand watermark.
 * No signature manufacture. No persona costume. No prose rewrite.
 */
export function postProcessMoodyResponse(
  raw: string,
  userMessage: string = "",
  options: { mode?: string; appendRandomCta?: boolean; applyPersonaCostume?: boolean } = {}
): PostProcessResult {
  const mode = (options.mode || "dynamic").toLowerCase();
  const bodyGenerated = (raw || "").trim();
  const draftLastSentence = lastSentence(raw);
  // Prefer opening take as governing_pattern diagnostic — not a mid-essay dump
  const firstSentence =
    (bodyGenerated.split(/(?<=[.!?])\s+/).find((s) => s && !s.trim().endsWith("?")) || "")
      .trim()
      .slice(0, 240);
  const reasons: string[] = [];

  let processed = polishSentences(raw);
  if (options.applyPersonaCostume === true) {
    processed = replaceMoodyDescriptors(processed);
    reasons.push("persona_costume");
  }
  processed = cleanMoodySignoffs(processed);

  const beforeLanding = processed;
  const landed = applyRecognitionLanding(processed, userMessage);
  processed = landed.text;
  if (landed.modified) reasons.push("malformed_closer_stripped");
  if (landed.landingAdded) reasons.push("landing_added");
  const afterLandingLastSentence = lastSentence(processed);

  const afterLanding = processed;
  processed = finalSurfaceRender(processed);
  const afterSurfaceLastSentence = lastSentence(processed);

  if (
    process.env.NODE_ENV !== "production" &&
    !responseTextAfterSurfaceSemanticallyEquals(afterLanding, processed)
  ) {
    throw new Error(
      "SURFACE_INVARIANT: finalSurfaceRender appended or rewrote semantic content"
    );
  }

  const beforeBrand = processed;
  processed = appendSignature(processed);
  if (processed !== beforeBrand) reasons.push("brand_watermark");

  if (options.appendRandomCta === true && mode !== "dynamic") {
    processed += `\n${getRandomCta()}`;
    reasons.push("legacy_cta");
  }

  let ctaRemoved = false;
  if (
    /\b(do you want|say the word|seen it named|what about .+ looks different)\b/i.test(
      beforeLanding
    ) &&
    !/\b(do you want|say the word|seen it named)\b/i.test(processed)
  ) {
    ctaRemoved = true;
    if (!reasons.includes("malformed_closer_stripped")) reasons.push("cta_removed");
  }

  const postFinalizerChangedText =
    normalizeCompare(bodyGenerated) !== normalizeCompare(processed);

  return {
    text: processed,
    landingEngineVersion: LANDING_ENGINE_VERSION,
    landing: landed.landing,
    draftLastSentence,
    afterLandingLastSentence,
    afterSurfaceLastSentence,
    landingModified: landed.modified,
    landingAdded: landed.landingAdded,
    postFinalizerChangedText,
    postFinalizerReason: reasons.length ? reasons.join(",") : "none",
    ctaRemoved,
    governingPattern: firstSentence || draftLastSentence.slice(0, 240),
    coreInsight: firstSentence || draftLastSentence.slice(0, 240),
    creativeTouch: landed.landingAdded,
  };
}
