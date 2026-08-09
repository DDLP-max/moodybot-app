/**
 * Perspective selection (interpretive lens) + broad capability routing.
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
  | "general";

export type LensBundle = {
  lens: string;
  primary: string;
  supporting: string;
  voice: string | null;
  preferred_structure: "SNAP" | "KNIFE" | "STORY";
  mechanism_hint: string;
};

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

  if (/\b(court|evidence|affidavit|testimony|prosecutor|cross[- ]examin)\b/.test(text)) {
    return "court";
  }
  if (
    /\b(business|invest|roi|startup|market share|portfolio|acquisition|promotion|salary|tradeoff|trade-off|opportunity cost)\b/.test(
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

  const relationship = [
    "girlfriend", "boyfriend", "wife", "husband", "ex ", "dating",
    "relationship", "she said", "he said", "marriage", "cheat",
    "situationship", "texted", "left me", "my friend", "friend only",
    "only texts", "friendship", "best friend", "affection",
  ];
  if (relationship.some((t) => text.includes(t))) return "relationship";

  if (/\b(culture|cultural|society|what does it mean|is this normal)\b/.test(text)) {
    return "cultural_insight";
  }

  if (/\b(best|worst|greatest|easily the|overrated|underrated)\b/.test(text)) {
    return "preference_claim";
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
      lens: "Noir Detective",
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
    "1) Identity / Interpretive lens — what world is Moody standing in?",
    "2) Intelligence / Capability — what mental tool? (broad buckets)",
    "3) Writing — SNAP / KNIFE / STORY",
    "4) Editing — Gold compression only (never picks the lens)",
    "Internally ask: whose eyes should Moody borrow? Code name: interpretive lens.",
    "Gold never decides what Moody thinks. Gold only decides how he says it.",
    "Do NOT optimize for finding the same social mechanism repeatedly.",
    "If no social or ideological mechanism is present, do not invent one.",
    "Never name the lens in the reply text.",
  ].join("\n");

  const byDomain: Record<ClaimDomain, string> = {
    taste_preference: [
      "CLAIM DOMAIN: taste / food.",
      `INTERPRETIVE LENS: ${active} (Identity — not a capability).`,
      `CAPABILITY: ${cap} (Sensory Realism may support).`,
      "MECHANISM FAMILY: familiarity vs quality / consistency ≠ excellence.",
      "STRUCTURE BIAS: SNAP.",
      'PASS: "That\'s like saying prison is just a room."',
      'FAIL: "The pattern is rule-shopping."',
    ].join("\n"),
    travel: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "MECHANISM FAMILY: place, texture, honesty.",
    ].join("\n"),
    consumer_preference: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "MECHANISM FAMILY: status, lock-in, hype. No grievance costume.",
    ].join("\n"),
    business: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "MECHANISM FAMILY: opportunity cost, incentives, second-order effects.",
    ].join("\n"),
    court: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "MECHANISM FAMILY: evidence vs inference.",
    ].join("\n"),
    preference_claim: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "MECHANISM FAMILY: overclaim via familiarity/status.",
    ].join("\n"),
    social_power: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "MECHANISM FAMILY: power/incentives — only when evidenced.",
    ].join("\n"),
    relationship: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "MECHANISM FAMILY: boundary, leverage, avoidance.",
    ].join("\n"),
    practical: "CAPABILITY: Practical Next Action. Concrete next step.",
    technical: "CAPABILITY: Operational Intelligence. Cause → fix.",
    grief: "CAPABILITY: Quiet Presence. Witness.",
    cultural_insight: [
      `INTERPRETIVE LENS: ${active}. CAPABILITY: ${cap}.`,
      "Lived culture, not favorite-drawer templates.",
    ].join("\n"),
    general: [
      `INTERPRETIVE LENS: ${active}.`,
      "Discover mechanism from the prompt. Do not default to Power / Incentive Analysis.",
    ].join("\n"),
  };

  return `${common}\n${byDomain[domain] || byDomain.general}`;
}
