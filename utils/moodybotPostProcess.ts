// utils/moodybotPostProcess.ts — protective post-process, not a second writer
import {
  LANDING_ENGINE_VERSION,
  applyRecognitionLanding,
  lastSentence,
  responseTextAfterSurfaceSemanticallyEquals,
  validateLanding,
} from "./recognitionLanding";

export { LANDING_ENGINE_VERSION, validateLanding, lastSentence };

export const CORE_WRITE_DIRECTIVE = `CORE WRITE RULE (highest priority for this reply):

MoodyBot does not describe what happened. MoodyBot explains why it felt the way it did.

Silently decide: what is the most interesting true thing here?
Then: what underlying rule explains the examples?
Lead with that insight in the FIRST sentence. Use one or two proofs. Then STOP.

Do NOT open with throat-clearing ("the clearest case", "there are several factors", "at its core").
Do NOT inventory examples without a controlling thesis.
Do NOT add a Signature Line, Recognition Callback, quiz question, CTA, or fake profound closer.
Do NOT require metaphor, noir, or poetic costume. Sharp plain language is allowed.

If practical action was requested, end with a concrete next step.
Otherwise end when the answer lands.`;

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

/** Persona costume swaps — OFF on default Dynamic path. */
export function replaceMoodyDescriptors(text: string): string {
  let result = text;
  for (const [k, v] of Object.entries(moodyReplacements)) {
    const regex = new RegExp(`\\b${k}\\b`, "gi");
    result = result.replace(regex, v);
  }
  return result;
}

export function polishSentences(text: string): string {
  return text
    .replace(/\.{2,}/g, ".")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\s([?.!])/g, "$1")
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
  return text.replace(/^ah[,\.\s]+/i, "").trimStart();
}

export function appendSignature(text: string, signature = "\ud83e\udd43 @MoodyBotAI"): string {
  return text.includes(signature) ? text : `${text}\n${signature}`;
}

export function cleanMoodySignoffs(text: string): string {
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

/** Typography-only pass. Must not invent a new closer sentence. */
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
  coreInsight: string;
};

/**
 * Minimal Dynamic Mode pipeline:
 * light format → strip broken CTA/closers → surface typography → brand line.
 * No signature manufacture. No persona costume swaps. No random CTA.
 */
export function postProcessMoodyResponse(
  raw: string,
  userMessage: string = "",
  options: { mode?: string; appendRandomCta?: boolean; applyPersonaCostume?: boolean } = {}
): PostProcessResult {
  const mode = (options.mode || "dynamic").toLowerCase();
  const bodyGenerated = (raw || "").trim();
  const draftLastSentence = lastSentence(raw);
  const reasons: string[] = [];

  let processed = cleanWeakOpeners(raw);
  processed = polishSentences(processed);
  // Persona costume OFF by default — was competing with real writing
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

  // Brand watermark only (not a Signature Line / writing closer)
  const beforeBrand = processed;
  processed = appendSignature(processed);
  if (processed !== beforeBrand) reasons.push("brand_watermark");

  let ctaRemoved = false;
  if (options.appendRandomCta === true && mode !== "dynamic") {
    processed += `\n${getRandomCta()}`;
    reasons.push("legacy_cta");
  }

  // Detect if a CTA-like paragraph was stripped during landing cleanup
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
    coreInsight: draftLastSentence.slice(0, 240),
  };
}
