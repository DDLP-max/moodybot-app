/**
 * Perspective selection (interpretive lens) + broad capability routing.
 * Lenses are ways of seeing (what they notice first), not style themes.
 * Internally: "Whose eyes should Moody borrow?"
 * Gold never picks the lens — Gold only compresses.
 */

export type ClaimDomain =
  | "taste_preference"
  | "travel"
  | "consumer_preference"
  | "preference_claim"
  | "social_power"
  | "relationship"
  | "practical"
  | "technical"
  | "grief"
  | "cultural_insight"
  | "business"
  | "court"
  | "emotional"
  | "general";

export type LensBundle = {
  lens: string;
  primary: string;
  supporting: string;
  voice: string | null;
  preferred_structure: "SNAP" | "KNIFE" | "REFLECTION";
  mechanism_hint: string;
};

export const LENS_INTERNAL_QUESTIONS: Record<string, string> = {
  Bourdain: "What would someone who's lived this notice?",
  Munger: "What's the incentive?",
  CIA: "What do we actually know?",
  "Hank Moody": "What's the human truth nobody wants to admit?",
  "Pattern Recognition": "What pattern repeats here?",
  "Emotional Intelligence":
    "What feeling or boundary is driving this without a sweeping group claim?",
  "Quiet Presence": "What weight needs witnessing, not solving?",
  "Field Operator": "What's the next concrete move?",
  Builder: "What's broken and how do we fix it?",
};

export function lensInternalQuestion(lens: string): string {
  return LENS_INTERNAL_QUESTIONS[lens] || "";
}

export type ResponseBudget = "low" | "medium" | "high";
export type TopicMode = "expand" | "compress" | "neutral";
export type WriteShape = "SNAP" | "KNIFE" | "REFLECTION";

const EXPAND_TOPIC_RE =
  /\b(in (your|their|my) (20s|30s|40s|50s|60s|70s)|as (you|they|we) get older|get(ting)? older|growing older|aging|mortality|legacy|forgiveness|parenthood|parenting|purpose|meaning of (life|it)|who you are when|end of the chase|looking back|years down the road|invest (your )?youth|what (really )?matters|what changes (when|as|in)|don'?t realize will impact|people in their|something that people|grief|funeral|loss of|passed away|identity|midlife|who am i|failure(s)? (teach|taught|shape)|lasting love|love after|what love (becomes|means))\b/i;

const COMPRESS_TOPIC_RE =
  /\b(hot take|unpopular opinion|meme|ratio|timeline|cat lady|culture war|woke|feminist|feminism|patriarchy|misogyn|pick[- ]me|loneliness epidemic|singledom|best (burger|fries|pizza|phone|place)|overrated|underrated|easily the best|mcdonald)\b/i;

export function normalizeStructure(structure: string): WriteShape {
  const s = (structure || "KNIFE").toUpperCase();
  if (s === "STORY") return "REFLECTION";
  if (s === "SNAP" || s === "KNIFE" || s === "REFLECTION") return s;
  return "KNIFE";
}

export function classifyTopicMode(
  userMessage: string,
  domain: ClaimDomain | string = "general"
): TopicMode {
  const text = (userMessage || "").trim();
  if (domain === "grief" || /\b(grief|died|death|funeral|suicide|trauma|abuse)\b/i.test(text)) {
    return "expand";
  }
  if (EXPAND_TOPIC_RE.test(text)) return "expand";
  if (
    domain === "taste_preference" ||
    domain === "preference_claim" ||
    domain === "consumer_preference" ||
    domain === "social_power" ||
    domain === "business"
  ) {
    return "compress";
  }
  if (COMPRESS_TOPIC_RE.test(text)) return "compress";
  return "neutral";
}

/** Depth dimension — topic mode matters more than raw length. */
export function classifyResponseBudget(
  userMessage: string,
  domain: ClaimDomain | string = "general",
  topicMode?: TopicMode
): ResponseBudget {
  const text = (userMessage || "").trim();
  if (!text) return "medium";
  const mode = topicMode || classifyTopicMode(userMessage, domain);
  const wc = text.split(/\s+/).filter(Boolean).length;
  const sentences = (text.match(/[.!?]+/g) || []).length || (wc ? 1 : 0);
  const paras = text.split(/\n/).filter((p) => p.trim()).length;
  const claimCues = (
    text.match(
      /\b(because|even though|that's why|the biggest|there's no|the sooner|not because|instead|however|although|women |men |people |it's a projection|the mistake|the moment you|assuming)\b/gi
    ) || []
  ).length;
  const longish =
    wc >= 160 ||
    (wc >= 100 && sentences >= 5) ||
    (wc >= 100 && claimCues >= 4) ||
    (paras >= 3 && wc >= 80);

  if (mode === "expand") return "high";
  if (mode === "compress") {
    if (domain === "taste_preference" && wc <= 55) return "low";
    if ((domain === "preference_claim" || domain === "consumer_preference") && wc <= 40) {
      return "low";
    }
    if (wc <= 35 && sentences <= 2) return "low";
    if (longish) return "high";
    return "medium";
  }
  if (longish) return "high";
  if (wc <= 35 && sentences <= 2) return "low";
  return "medium";
}

export function applyBudgetToStructure(
  preferred: string,
  budget: ResponseBudget,
  userMessage = "",
  domain: ClaimDomain | string = "general",
  topicMode?: TopicMode
): WriteShape {
  const pref = normalizeStructure(preferred);
  const mode = topicMode || classifyTopicMode(userMessage, domain);

  if (budget === "low") {
    if (domain === "practical" || domain === "technical") {
      return pref === "REFLECTION" ? "KNIFE" : pref;
    }
    return "SNAP";
  }
  if (budget === "medium") return "KNIFE";

  if (mode === "expand") return "REFLECTION";
  if (
    /\b(tell me (the )?story|walk me through|what happened|sit (with|down)|talk (to me )?about life)\b/i.test(
      userMessage
    )
  ) {
    return "REFLECTION";
  }
  if (pref === "SNAP") return "KNIFE";
  if (pref === "REFLECTION" && mode === "compress") return "KNIFE";
  return mode === "compress" ? "KNIFE" : pref === "SNAP" ? "KNIFE" : pref;
}

export function responseBudgetGuidance(
  budget: ResponseBudget,
  structure = "",
  topicMode: TopicMode | string = "neutral"
): string {
  const shape = normalizeStructure(structure);
  if (budget === "low" || shape === "SNAP") {
    return [
      "RESPONSE BUDGET — Depth: low × Shape: SNAP.",
      "PURPOSE: Surprise the reader.",
      "Stop at the spear. Soft ~15–70 words (consequence, not the design).",
      'PASS: "That\'s like saying prison is just a room."',
    ].join("\n");
  }
  if (shape === "REFLECTION") {
    return [
      "RESPONSE BUDGET — Depth: high × Shape: REFLECTION.",
      "PURPOSE: Leave the reader seeing their own life differently.",
      "Unique rule: EARN EVERY PARAGRAPH.",
      "Beats: Observation → Deepening → Consequence → Acceptance.",
      "Rotate the same diamond. Do not stack metaphors.",
      "Soft ~250–450 words may follow — length is a consequence.",
      "Gold still edits. Do not collapse to a tweet.",
    ].join("\n");
  }
  if (budget === "high") {
    return [
      "RESPONSE BUDGET — Depth: high × Shape: Extended KNIFE.",
      "PURPOSE: Develop one mechanism until it feels inevitable.",
      `Topic mode: ${topicMode || "argument"}. Soft ~100–260 words (consequence).`,
      "Do NOT flip into lyrical REFLECTION on politics/hot-takes.",
    ].join("\n");
  }
  return [
    "RESPONSE BUDGET — Depth: medium × Shape: KNIFE.",
    "PURPOSE: Reframe the reader.",
    "Stop after the proof. Soft ~50–140 words (consequence).",
  ].join("\n");
}

export function classifyClaimDomain(userMessage: string): ClaimDomain {
  const text = (userMessage || "").toLowerCase();
  if (!text.trim()) return "general";

  if (/\b(grief|died|death|funeral|suicide|trauma|abuse)\b/.test(text)) return "grief";
  if (/\b(bug|error|stack trace|typescript|python|api|deploy|css|sql)\b/.test(text)) {
    return "technical";
  }
  if (/\b(how do I|what should I|steps? to|help me (fix|get|make))\b/.test(text)) {
    return "practical";
  }

  // Word-boundary for short tokens — "eat" must not match "threatened"
  if (
    /\b(mcdonald|burger|fries|pizza|coffee|beer|wine|restaurant|taste|delicious|food|sushi|steak|dessert|recipe|hungry|eat|dining|espresso|kitchen|chef|cuisine|menu)\b/.test(
      text
    ) ||
    ["best place for", "best burger", "best fries", "favorite food"].some((p) =>
      text.includes(p)
    )
  ) {
    return "taste_preference";
  }

  if (
    /\b(airport|travel|flight|hotel|passport|abroad|backpacking|tourist|layover|hostel|road trip)\b/.test(
      text
    )
  ) {
    return "travel";
  }

  if (
    /\b(court|evidence|affidavit|testimony|prosecutor|cross[- ]examin|my boss|became distant|suddenly (distant|cold|quiet)|mixed signals from)\b/.test(
      text
    )
  ) {
    return "court";
  }
  if (
    /\b(business|invest|roi|startup|market share|portfolio|acquisition|promotion|salary|tradeoff|trade-off|opportunity cost|ferrari|impress clients|to impress|closes deals)\b/.test(
      text
    )
  ) {
    return "business";
  }

  const consumer = [
    "iphone", "android", "tesla", "nike", "adidas", "brand is",
    "best phone", "best car", "worth buying", "overrated", "underrated",
  ];
  if (consumer.some((t) => text.includes(t))) return "consumer_preference";

  // Projection / threat-as-own-fear → EI before culture-war drawer
  if (
    /\b(projection of|projecting|biggest fear|threatening .+ with|threat of .+ (alone|single|lonely))\b/.test(
      text
    ) ||
    (text.includes("threat") &&
      ["fear", "fears", "afraid", "loneliness", "alone"].some((w) => text.includes(w)))
  ) {
    return "emotional";
  }

  const social = [
    "feminist", "feminism", "patriarchy", "pick me", "misogyn",
    "society", "ideology", "woke", "privilege", "oppression",
    "men are", "women are", "gender", "politics", "democrat",
    "republican", "culture war", "cat lady", "loneliness epidemic",
    "these men", "men refuse", "women don't", "women aren't",
    "single men", "singledom",
  ];
  if (social.some((t) => text.includes(t))) return "social_power";

  if (
    /\b(right person|guessing games|obsessed with you|really into you|shouldn'?t be this easy|waiting for a text|fake people|no guessing|when someone is really into)\b/.test(
      text
    )
  ) {
    return "emotional";
  }

  const relationship = [
    "girlfriend", "boyfriend", "wife", "husband", "ex ", "dating",
    "relationship", "she said", "he said", "marriage", "cheat",
    "situationship", "texted", "left me", "my friend", "friend only",
    "only texts", "friendship", "best friend", "affection", "divorce",
    "divorced",
  ];
  if (relationship.some((t) => text.includes(t))) return "relationship";

  if (/\b(culture|cultural|society|what does it mean|is this normal)\b/.test(text)) {
    return "cultural_insight";
  }

  if (/\b(best|worst|greatest|easily the|overrated|underrated)\b/.test(text)) {
    return "preference_claim";
  }

  if (
    /\b(i feel|i'm feeling|feeling |anxious|overwhelmed|my boundary|boundaries|hurt that|scared that|i'm scared|emotionally)\b/.test(
      text
    )
  ) {
    return "emotional";
  }

  return "general";
}

/** Perspective selection — Identity layer. Not a capability. */
export function selectInterpretiveLens(domain: ClaimDomain): LensBundle {
  const table: Record<ClaimDomain, LensBundle> = {
    taste_preference: {
      lens: "Bourdain",
      primary: "Everyday Preference Analysis",
      supporting: "Sensory Realism",
      voice: "Human Realism",
      preferred_structure: "SNAP",
      mechanism_hint: "familiarity_vs_quality",
    },
    travel: {
      lens: "Bourdain",
      primary: "Lived Experience Analysis",
      supporting: "Sensory Realism",
      voice: "Human Realism",
      preferred_structure: "KNIFE",
      mechanism_hint: "place_texture_honesty",
    },
    cultural_insight: {
      lens: "Bourdain",
      primary: "Lived Experience Analysis",
      supporting: "Sensory Realism",
      voice: "Human Realism",
      preferred_structure: "KNIFE",
      mechanism_hint: "lived_culture",
    },
    consumer_preference: {
      lens: "Munger",
      primary: "Business / Tradeoff Analysis",
      supporting: "Hidden Incentive Analysis",
      voice: "Dry Economy",
      preferred_structure: "KNIFE",
      mechanism_hint: "status_lockin_hype",
    },
    business: {
      lens: "Munger",
      primary: "Business / Tradeoff Analysis",
      supporting: "Hidden Incentive Analysis",
      voice: "Dry Economy",
      preferred_structure: "KNIFE",
      mechanism_hint: "incentives_second_order",
    },
    court: {
      lens: "CIA",
      primary: "Evidence / Contradiction Analysis",
      supporting: "Evidence vs Inference",
      voice: "Clipped Precision",
      preferred_structure: "KNIFE",
      mechanism_hint: "evidence_vs_inference",
    },
    social_power: {
      lens: "Pattern Recognition",
      primary: "Power / Incentive Analysis",
      supporting: "Pattern Forensics",
      voice: "Hardboiled Observation",
      preferred_structure: "KNIFE",
      mechanism_hint: "power_incentives",
    },
    relationship: {
      lens: "Hank Moody",
      primary: "Relationship Pattern Recognition",
      supporting: "Boundary Analysis",
      voice: "Human Realism",
      preferred_structure: "KNIFE",
      mechanism_hint: "boundary_leverage",
    },
    preference_claim: {
      lens: "Hank Moody",
      primary: "Everyday Preference Analysis",
      supporting: "Narrative Weight",
      voice: "Human Realism",
      preferred_structure: "SNAP",
      mechanism_hint: "overclaim_familiarity_status",
    },
    practical: {
      lens: "Field Operator",
      primary: "Practical Next Action",
      supporting: "Evidence vs Inference",
      voice: null,
      preferred_structure: "KNIFE",
      mechanism_hint: "concrete_next_step",
    },
    technical: {
      lens: "Builder",
      primary: "Operational Intelligence",
      supporting: "Prototype Thinking",
      voice: null,
      preferred_structure: "KNIFE",
      mechanism_hint: "cause_fix",
    },
    grief: {
      lens: "Quiet Presence",
      primary: "Quiet Presence",
      supporting: "Narrative Weight",
      voice: "Atmospheric Reflection",
      preferred_structure: "REFLECTION",
      mechanism_hint: "witness",
    },
    emotional: {
      lens: "Emotional Intelligence",
      primary: "Emotional State Recognition",
      supporting: "Boundary Analysis",
      voice: "Human Realism",
      preferred_structure: "KNIFE",
      mechanism_hint: "feeling_or_boundary",
    },
    general: {
      lens: "Hank Moody",
      primary: "Emotional State Recognition",
      supporting: "Epistemic Calibration",
      voice: "Human Realism",
      preferred_structure: "KNIFE",
      mechanism_hint: "prompt_specific",
    },
  };
  return table[domain] || table.general;
}

/** @deprecated use selectInterpretiveLens */
export const selectResponseLens = selectInterpretiveLens;

export function lensVoiceGuidance(lens: string): string {
  const q = lensInternalQuestion(lens);
  const qLine = q ? `Internal question (ask before writing): "${q}"\n` : "";
  if (lens === "Bourdain") {
    return [
      "LENS AUTHENTICITY — Bourdain (way of seeing, not a theme):",
      qLine.trim(),
      "Notices first: lived experience, craft, authenticity, sensory detail, anti-pretension.",
      "Shows before explaining. Prefer observation over diagnosis.",
      'FAIL: "Familiarity bias." PASS: "You already know exactly what you\'re going to get."',
    ].join("\n");
  }
  if (lens === "Munger") {
    return [
      "LENS AUTHENTICITY — Munger (way of seeing, not a theme):",
      qLine.trim(),
      "Notices first: incentive, opportunity cost, second-order effect. Does not moralize.",
      'FAIL: "Status signalling often reflects insecurity…"',
      'PASS: "If a Ferrari closes deals, it\'s an investment. If it only impresses strangers, it\'s an expense."',
    ].join("\n");
  }
  if (lens === "CIA") {
    return [
      "LENS AUTHENTICITY — CIA (way of seeing, not a theme):",
      qLine.trim(),
      "Notices first: evidence vs inference, contradictions, missing information. Respects uncertainty.",
      'FAIL: "He\'s planning to fire you."',
      'PASS: "You have one data point and a story you\'ve attached to it. Separate the two before you make a decision."',
    ].join("\n");
  }
  if (lens === "Hank Moody") {
    return [
      "LENS AUTHENTICITY — Hank Moody (way of seeing, not a theme):",
      qLine.trim(),
      "Notices first: emotional contradiction, human truth under the mess — not swearing costume.",
      'PASS: "Sometimes the loneliest part of a relationship is having someone beside you."',
    ].join("\n");
  }
  if (lens === "Pattern Recognition") {
    return [
      "LENS AUTHENTICITY — Pattern Recognition (way of seeing, not a theme):",
      qLine.trim(),
      "Prefer the transferable human pattern over winning a demographic argument.",
      "Notices recurring social structures only when present. Common failure: same mechanism every time.",
    ].join("\n");
  }
  if (lens === "Emotional Intelligence") {
    return [
      "LENS AUTHENTICITY — Emotional Intelligence (way of seeing, not a theme):",
      qLine.trim(),
      "Begin with people, not groups. Prefer transferable human pattern over demographic universals.",
      "Guardrail: explain the mechanism without a sweeping claim about men/women as blocs.",
      'FAIL: "Women built lives with friends… Men built theirs around the woman…"',
      'PASS: "People only use threats they believe would work on themselves."',
      'PASS: "Everything else is your history trying to sell you a harder story."',
    ].join("\n");
  }
  return qLine ? `Ask first: "${q}"` : "";
}

export function domainMechanismGuidance(
  domain: ClaimDomain,
  lens = "",
  capability = ""
): string {
  const bundle = selectInterpretiveLens(domain);
  const active = lens || bundle.lens;
  const cap = capability || bundle.primary;
  const common = [
    "FOUR LAYERS (mandatory — keep independent):",
    "1) Identity / Interpretive lens — way of seeing (what you notice first), not a style theme",
    "2) Intelligence / Capability — what mental tool? (broad buckets)",
    "3) Writing — Depth × Shape (SNAP / KNIFE / REFLECTION)",
    "4) Editing — Gold compression within budget (density, not universal brevity)",
    "One question: Bourdain=lived notice; Munger=incentive; CIA=what do we know; Hank=human truth; Pattern=what repeats; EI=feeling/boundary.",
    "Gold never decides what Moody thinks. Gold only decides how he says it.",
    "Knife mode and Reflection mode are both authentic — route explicitly.",
    "Never name the lens in the reply text.",
  ].join("\n");

  const byDomain: Partial<Record<ClaimDomain, string>> = {
    taste_preference: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "BOURDAIN: observation over diagnosis. No psych labels.",
      'PASS: "That\'s like saying prison is just a room."',
      'FAIL: "Familiarity bias."',
    ].join("\n"),
    business: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "MUNGER: incentives and tradeoffs. Do not moralize.",
    ].join("\n"),
    court: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "CIA: evidence vs inference. Respect uncertainty.",
    ].join("\n"),
    social_power: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "Pattern only when evidenced — do not force ideology onto unrelated prompts.",
    ].join("\n"),
    relationship: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "Hank: human truth under the mess — not cynicism costume.",
    ].join("\n"),
    emotional: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "EI: feeling or boundary in plain language — no therapy-speak.",
    ].join("\n"),
  };

  return `${common}\n${lensVoiceGuidance(active)}\n${byDomain[domain] || `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`}`;
}
