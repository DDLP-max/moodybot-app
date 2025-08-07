// utils/moodybotPostProcess.ts

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
  return text
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
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
  return text.includes(signature) ? text : `${text}\n\n${signature}`;
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

export function postProcessMoodyResponse(raw: string): string {
  let processed = cleanWeakOpeners(raw);
  processed = polishSentences(processed);
  processed = replaceMoodyDescriptors(processed);
  processed = cleanMoodySignoffs(processed);
  processed = appendSignature(processed);
  processed += `\n\n${getRandomCta()}`;
  return processed;
}
