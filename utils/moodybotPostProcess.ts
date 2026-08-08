// utils/moodybotPostProcess.ts
import {
  LANDING_ENGINE_VERSION,
  applyRecognitionLanding,
  lastSentence,
  responseTextAfterSurfaceSemanticallyEquals,
  validateLanding,
} from "./recognitionLanding";

export { LANDING_ENGINE_VERSION, validateLanding, lastSentence };

export const moodyReplacements: Record<string, string> = {
  "darling": "volatile angel",
  "beautiful mess": "gorgeously ruined soul",
  "sweetheart": "feral romantic",
  "babe": "existential gymnast",
  "honey": "doomed optimist",
  "cutie": "emotional hostage",
  "love": "walking contradiction",
  "sunshine": "neon heartbreak",
  "baby girl": "sentient ache"
};

export function replaceMoodyDescriptors(text: string): string {
  let result = text;
  for (const [k, v] of Object.entries(moodyReplacements)) {
    const regex = new RegExp(`\\b${k}\\b`, 'gi');
    result = result.replace(regex, v);
  }
  return result;
}

export function polishSentences(text: string): string {
  // Preserve newlines — system prompt paragraph/line-break rules depend on them
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
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n");
}

export function cleanWeakOpeners(text: string): string {
  return text.replace(/^ah[,\.\s]+/i, '').trimStart();
}

export function appendSignature(text: string, signature = "\ud83e\udd43 @MoodyBotAI"): string {
  return text.includes(signature) ? text : `${text}\n${signature}`;
}

export function cleanMoodySignoffs(text: string): string {
  return text.replace(/\b(Bet it hits different.*?|Now cry about it\.?|Be honest.*?|Deal with it\.?)+$/i, '').trim();
}

export function getRandomCta(): string {
  const ctas = [
    "Breathe before you reply.",
    "Tag \ud83e\udd43 @MoodyBotAI if it wrecked you.",
    "He won’t save you, but he’ll make you feel seen.",
    "You wanted the truth, right?"
  ];
  return ctas[Math.floor(Math.random() * ctas.length)];
}

/** Typography-only pass. Must not invent a new closer sentence. */
export function finalSurfaceRender(text: string): string {
  let out = (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s*[—–]\s*/g, " - ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out;
}

export type PostProcessResult = {
  text: string;
  landingEngineVersion: string;
  landing: string;
  draftLastSentence: string;
  afterLandingLastSentence: string;
  afterSurfaceLastSentence: string;
  landingModified: boolean;
};

/**
 * Dynamic Mode pipeline:
 * polish → recognition landing → surface (typography) → signature.
 * Random CTA is disabled for Dynamic — it was rewriting closers after landing.
 */
export function postProcessMoodyResponse(
  raw: string,
  userMessage: string = "",
  options: { mode?: string; appendRandomCta?: boolean } = {}
): PostProcessResult {
  const mode = (options.mode || "dynamic").toLowerCase();
  const draftLastSentence = lastSentence(raw);

  let processed = cleanWeakOpeners(raw);
  processed = polishSentences(processed);
  processed = replaceMoodyDescriptors(processed);
  processed = cleanMoodySignoffs(processed);

  const landed = applyRecognitionLanding(processed, userMessage);
  processed = landed.text;
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

  processed = appendSignature(processed);

  // Legacy CTA only when explicitly opted in — never for Dynamic Mode
  if (options.appendRandomCta === true && mode !== "dynamic") {
    processed += `\n${getRandomCta()}`;
  }

  return {
    text: processed,
    landingEngineVersion: LANDING_ENGINE_VERSION,
    landing: landed.landing,
    draftLastSentence,
    afterLandingLastSentence,
    afterSurfaceLastSentence,
    landingModified: landed.modified,
  };
}
