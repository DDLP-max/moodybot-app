/**
 * Protect-only post-process + one Gold-shape structural compression.
 * CONTRACT: docs/PROTECT_ONLY_FINALIZER.md — generation owns voice;
 * finalizer may compress restatement / drift / CTA once, then 🥃.
 */
import {
  LANDING_ENGINE_VERSION,
  applyRecognitionLanding,
  lastSentence,
  responseTextAfterSurfaceSemanticallyEquals,
  validateLanding,
} from "./recognitionLanding";
import {
  GOLD_SHAPE_VERSION,
  applyGoldShapePass,
  ensureWhiskey,
  goldShapeDiagnostics,
} from "./goldShape";

export { LANDING_ENGINE_VERSION, validateLanding, lastSentence, GOLD_SHAPE_VERSION };

/** Prompt guidance for the LLM writer — Gold-shape delivery. */
export const CORE_WRITE_DIRECTIVE = `CORE WRITE RULE (highest priority for this reply):

Surface geometry (mandatory): CUT → NAME → PROVE ONCE → STOP → 🥃
Deep reasoning stays internal. External delivery is aggressive compression.

THINK abstractly. SPEAK concretely.
MoodyBot sees systems. MoodyBot does not talk ABOUT systems.

PREMISE RELOCATION (first-class):
If the user already stated the obvious thesis, do NOT agree-and-elaborate.
Relocate: user premise → reframe → name the deeper mechanism → one proof → stop.
Every substantive sentence must add NEW understanding.
If a sentence merely restates the user's thesis — delete it.
Do NOT create a hard "never agree" rule. If they are right, still do not spend words telling them what they already know.

GOLD STRUCTURES (pick one; do not force KNIFE onto everything):
- SNAP: 1–2 sentence punch. Stop.
- KNIFE: reframe → one proof → spear → stop. Soft tendency ~50–110 words, usually one paragraph.
- STORY: observation → concrete example → implication → stop. May be longer when narrative earns it.

ONE MECHANISM:
one thesis → one mechanism → one proof.
ONE RESPONSE. ONE THESIS.
If two sentences explain the same causal mechanism in different language, keep the stronger one.
Do not stack near-synonyms (punishment / resentment economy / defection / universal claim / ideology / protecting the story).

SPEAR:
Every short reply has one memorable line that carries the answer.
Once the spear lands — stop. No second explanation, metaphor, summary, moral, CTA, invitation, "the real lesson is…", or "and that's why…".
Then end with 🥃 alone (no catchphrase before it).

CASH OUT THE LAST LINE (Abstract → Spoken translation):
Internal reasoning may stay abstract. Surface must translate before stop —
unless the abstraction is itself the shortest accurate name for the mechanism.
Do NOT become anti-intellectual. Translate packaging, keep precise mechanism names.
KEEP: "Moral licensing." / "Rule-shopping." / "Loyalty program."
CASH OUT packaging:
BAD: "wherever incentives reward inconsistency over fixed boundaries."
GOOD: "People reach for the standard that delivers the benefit and drop the one that demands the cost."
Illustrations (principle, not a dictionary): incentives→benefit; narrative→story; hierarchy→pecking order; status signalling→showing off; boundary violation→crossing the line.

SPOKEN NOUNS over essay nouns:
Prefer spoken observations: rules, promises, trust, cost, story, script, recruit, pitch, game, group, deal, pressure, excuse, boundary, move, benefit, standard, principle.
Avoid when plain speech works: ideology, framework, paradigm, systemic mechanism, resentment economy.
Prefer the plainest word that preserves the insight.

Example (rule-shopping):
FAIL closer: "...wherever incentives reward inconsistency over fixed boundaries."
PASS: "The pattern is rule-shopping. People reach for the standard that delivers the benefit and drop the one that demands the cost. 🥃"

METAPHOR: at most one meaningful image in a short answer. One memorable image beats three clever ones.

Generation order:
1) Intent / evidence / deep pattern work (internal)
2) GOVERNING PATTERN — one invisible rule
3) TRANSLATE into ordinary language
4) WRITE to structure → STOP → 🥃

TRUST THE READER + THESIS DISCIPLINE:
State it. Prove it once. Move on.
Every extra sentence must add NEW understanding — not restate.
Nothing survives after the payoff unless it changes the meaning.
FAIL: "Choices carried weight and bloodlines mattered..." (two theses / secondary claim).
The spine is one governing pattern; every sentence hangs from it.

Never dump internal labels into prose.
INTERNAL ONLY (do not expose unless precision truly requires): incentive structure, narrative contract, coherence, epistemic calibration, pattern forensics, governing mechanism.

No Signature Line, Recognition Callback, quiz, verbal costume closer, or CTA.
The sole standard brand tail is 🥃 at the very end after the final sentence.
BAD: "Stay dangerous. 🥃" / "That's the game. Stay sharp. 🥃"
GOOD: "The deal was control, not peace. 🥃"

Product test: "someone saw the thing underneath, named it once, and shut up" — not "an articulate explanation."

If practical action was requested, include a concrete next step before 🥃.`;

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
  goldShape?: Record<string, string>;
};

/**
 * Protect only + Gold-shape:
 * strip broken CTA/closers → gold compress once → format → 🥃.
 */
export function postProcessMoodyResponse(
  raw: string,
  userMessage: string = "",
  options: { mode?: string; appendRandomCta?: boolean; applyPersonaCostume?: boolean } = {}
): PostProcessResult {
  const mode = (options.mode || "dynamic").toLowerCase();
  const bodyGenerated = (raw || "").trim();
  const draftLastSentence = lastSentence(raw);
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

  const gold = applyGoldShapePass(userMessage, processed);
  processed = gold.text;
  if (gold.report.quality_rewrite_triggered) reasons.push("gold_shape_compress");

  const afterLanding = processed;
  const afterLandingLastSentence = lastSentence(processed);

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
  processed = ensureWhiskey(processed);
  gold.report.whiskey_tail_present = processed.includes("🥃");
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
    goldShape: goldShapeDiagnostics(gold.report),
  };
}
