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
  preferred_structure: "SNAP" | "KNIFE" | "STORY";
  mechanism_hint: string;
};

export const LENS_INTERNAL_QUESTIONS: Record<string, string> = {
  Bourdain: "What would someone who's lived this notice?",
  Munger: "What's the incentive?",
  CIA: "What do we actually know?",
  "Hank Moody": "What's the human truth nobody wants to admit?",
  "Pattern Recognition": "What pattern repeats here?",
  "Emotional Intelligence": "What feeling or boundary is driving this?",
  "Quiet Presence": "What weight needs witnessing, not solving?",
  "Field Operator": "What's the next concrete move?",
  Builder: "What's broken and how do we fix it?",
};

export function lensInternalQuestion(lens: string): string {
  return LENS_INTERNAL_QUESTIONS[lens] || "";
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

  const taste = [
    "mcdonald", "burger", "fries", "pizza", "coffee", "beer", "wine",
    "restaurant", "taste", "delicious", "food", "sushi", "steak",
    "dessert", "recipe", "hungry", "eat", "dining", "best place for",
    "best burger", "best fries", "favorite food", "espresso", "kitchen",
    "chef", "cuisine", "menu",
  ];
  if (taste.some((t) => text.includes(t))) return "taste_preference";

  const travel = [
    "airport", "travel", "flight", "hotel", "passport", "abroad",
    "backpacking", "tourist", "layover", "hostel", "road trip",
  ];
  if (travel.some((t) => text.includes(t))) return "travel";

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

  const social = [
    "feminist", "feminism", "patriarchy", "pick me", "misogyn",
    "society", "ideology", "woke", "privilege", "oppression",
    "men are", "women are", "gender", "politics", "democrat",
    "republican", "culture war",
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
      preferred_structure: "SNAP",
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
      "Notices recurring social structures only when present. Common failure: same mechanism every time.",
    ].join("\n");
  }
  if (lens === "Emotional Intelligence") {
    return [
      "LENS AUTHENTICITY — Emotional Intelligence (way of seeing, not a theme):",
      qLine.trim(),
      "Notices the hidden emotional dynamic — not dating advice, therapy, or validation.",
      'PASS: "Everything else is your history trying to sell you a harder story."',
      "Common failure: therapy-speak.",
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
    "3) Writing — SNAP / KNIFE / STORY",
    "4) Editing — Gold compression only (never picks the lens)",
    "One question: Bourdain=lived notice; Munger=incentive; CIA=what do we know; Hank=human truth; Pattern=what repeats; EI=feeling/boundary.",
    "Gold never decides what Moody thinks. Gold only decides how he says it.",
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
