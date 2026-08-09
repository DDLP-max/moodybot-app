/**
 * Gold-shape delivery: cut → name → prove once → stop → 🥃
 * At most one structural compression. Not creative authorship.
 */
export const GOLD_SHAPE_VERSION = "gold-shape-v1";

const WHISKEY = "🥃";
const WORD_RE = /[A-Za-z']+/g;
const LIKE_A = /\blike a\b|\bas if\b|\bas though\b/gi;
const CONFERENCE_SIGNALS =
  /\b(ideology|universal claim|defection|dialectic|paradigm|systemic(?:\s+mechanism)?|resentment economy|grievance economy|incentive structure|incentives?|narrative contract|framework|meta-analysis|inconsistency|fixed boundaries|asymmetric incentives|social validation|status signalling|status signaling|resource extraction|boundary violation|wherever .+ reward)\b/gi;
const ESSAY_NOUNS = CONFERENCE_SIGNALS;
const STOCK_SOCIAL_MECHANISMS =
  /\b(rule[- ]shopping|grievance script|resentment economy|loyalty program|collective (grievance|injury)|pick[- ]me enforcement|shared injury story|defection from the)\b/i;
const TASTE_DOMAIN_MARKERS =
  /\b(mcdonald|burger|fries|pizza|coffee|food|taste|restaurant|delicious|sushi|steak|dessert|eat|dining)\b/i;
const PREFERENCE_DOMAIN_MARKERS =
  /\b(best|worst|overrated|underrated|favorite|familiar|consistency|convenience|nostalgia|value|brand|iphone|tesla)\b/i;
const SOCIAL_PROMPT_MARKERS =
  /\b(feminist|feminism|patriarchy|pick[- ]me|misogyn|ideology|woke|privilege|oppression|gender|politics|culture war|grievance)\b/i;
const CTA_TAIL =
  /(want me to|let me know if|say the word|tag @|mention @|what do you think\??\s*$|agree\??\s*$|stay (dangerous|sharp))/i;
const SPEAR_MARKERS =
  /\b(not .+[,.—-] it's|isn't .+[,.—-] it's|that's not|doesn't |you're (describing|not)|the (pressure|deal|point|tell|spell) |keeping the story|loyalty program|fear dressed|changes the courtroom)\b/i;

export type GoldShapeReport = {
  selected_structure: string;
  premise_relocated: boolean;
  dominant_mechanism_count: number;
  draft_word_count: number;
  final_word_count: number;
  quality_rewrite_triggered: boolean;
  quality_failures: string[];
  spear_detected: boolean;
  whiskey_tail_present: boolean;
  spear_line: string;
  mechanism_mismatch: boolean;
  response_budget: string;
};

function normalizeStructureName(structure: string): string {
  const s = (structure || "KNIFE").toUpperCase();
  if (s === "STORY") return "REFLECTION";
  if (s === "SNAP" || s === "KNIFE" || s === "REFLECTION") return s;
  return "KNIFE";
}

function budgetSoftCaps(budget: string): {
  SNAP: number;
  KNIFE: number;
  REFLECTION: number;
  knife_sentences: number;
  reflection_sentences: number;
} {
  const b = (budget || "medium").toLowerCase();
  if (b === "high") {
    return { SNAP: 90, KNIFE: 260, REFLECTION: 480, knife_sentences: 10, reflection_sentences: 18 };
  }
  if (b === "low") {
    return { SNAP: 70, KNIFE: 110, REFLECTION: 200, knife_sentences: 5, reflection_sentences: 8 };
  }
  return { SNAP: 70, KNIFE: 140, REFLECTION: 320, knife_sentences: 7, reflection_sentences: 12 };
}

/** Favorite-drawer social mechanism on a non-social prompt — diagnose only. */
export function detectMechanismMismatch(userMessage: string, draft: string): boolean {
  const body = stripWhiskey(draft);
  if (!STOCK_SOCIAL_MECHANISMS.test(body)) return false;
  const um = userMessage || "";
  if (SOCIAL_PROMPT_MARKERS.test(um)) return false;
  if (TASTE_DOMAIN_MARKERS.test(um) || PREFERENCE_DOMAIN_MARKERS.test(um)) return true;
  return false;
}

function words(text: string): string[] {
  return (text || "").match(WORD_RE) || [];
}

export function stripWhiskey(text: string): string {
  return (text || "").replace(/\s*🥃\s*/g, " ").trim();
}

export function ensureWhiskey(text: string): string {
  const body = stripWhiskey(text).replace(/\s+$/g, "");
  if (!body) return WHISKEY;
  return `${body} ${WHISKEY}`;
}

function sentences(text: string): string[] {
  const body = stripWhiskey(text).trim();
  if (!body) return [];
  const parts = body.split(/(?<=[.!?…])\s+(?=[A-Z"'“‘0-9*])/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [body];
}

function tokenSet(text: string): Set<string> {
  const stop = new Set([
    "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "is", "are",
    "was", "were", "be", "that", "this", "it", "as", "with", "by", "from", "at",
    "you", "your", "not", "but",
  ]);
  return new Set(words(text).map((w) => w.toLowerCase()).filter((w) => w.length > 2 && !stop.has(w)));
}

function overlapRatio(a: string, b: string): number {
  const sa = tokenSet(a);
  const sb = tokenSet(b);
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / Math.max(1, Math.min(sa.size, sb.size));
}

function isConferenceTalkSentence(sentence: string): boolean {
  const s = (sentence || "").trim();
  if (!s) return false;
  const w = words(s);
  // Short precise mechanism names are spears — keep
  if (
    w.length <= 4 &&
    !/\b(wherever|insofar|whereby|incentives?|inconsistency|framework)\b/i.test(s)
  ) {
    return false;
  }
  const hits = (s.match(CONFERENCE_SIGNALS) || []).length;
  if (hits >= 2) return true;
  if (hits >= 1 && /\b(wherever|insofar|whereby|hence|thus|respectively)\b/i.test(s)) {
    return true;
  }
  if (w.length >= 10) {
    const concrete = (
      s.match(
        /\b(people|person|man|woman|cost|benefit|standard|rule|pay|drop|grab|ignore|line|drink|door|story)\b/gi
      ) || []
    ).length;
    if (hits >= 1 && concrete === 0) return true;
  }
  return false;
}

export function selectStructure(userMessage: string, draft: string, preferred?: string): string {
  const wc = words(draft).length;
  const ss = sentences(draft);
  const paras = (draft || "").split("\n").filter((p) => p.trim());
  const pref = preferred ? normalizeStructureName(preferred) : "";
  const contemplative =
    /\b(for (example|instance)|seasons?|years?|proof|daenerys|she |he |they |sneaks up|whisper|chase ends)\b/i.test(
      draft
    );
  if (pref === "REFLECTION") return "REFLECTION";
  if (wc <= 45 && ss.length <= 2) return "SNAP";
  if (
    paras.length >= 3 ||
    (contemplative && (wc >= 120 || ss.length >= 5)) ||
    /\b(tell me (the )?story|walk me through|get older|in (your|their) \d|purpose|legacy|mortality)\b/i.test(
      userMessage
    )
  ) {
    return "REFLECTION";
  }
  return "KNIFE";
}

function detectSpear(ss: string[]): { ok: boolean; line: string; index: number } {
  let bestI = -1;
  let bestScore = -1;
  let best = "";
  ss.forEach((s, i) => {
    const n = words(s).length;
    if (n < 4 || n > 28) return;
    let score = 0;
    if (n >= 6 && n <= 18) score += 2;
    if (SPEAR_MARKERS.test(s)) score += 3;
    if (/\b(not|never|isn't|doesn't|that's|failed because|proof)\b/i.test(s)) score += 1;
    score += i * 0.15;
    if (score > bestScore) {
      bestScore = score;
      bestI = i;
      best = s;
    }
  });
  if (bestI >= 0 && bestScore >= 2) return { ok: true, line: best, index: bestI };
  for (let i = ss.length - 1; i >= 0; i--) {
    if (words(ss[i]).length >= 5 && words(ss[i]).length <= 22) {
      return { ok: true, line: ss[i], index: i };
    }
  }
  return ss.length ? { ok: true, line: ss[ss.length - 1], index: ss.length - 1 } : { ok: false, line: "", index: -1 };
}

export function evaluateGoldShape(
  userMessage: string,
  draft: string,
  structure: string,
  responseBudget = "medium"
): string[] {
  const failures: string[] = [];
  const body = stripWhiskey(draft);
  const ss = sentences(body);
  const wc = words(body).length;
  structure = normalizeStructureName(structure);
  const caps = budgetSoftCaps(responseBudget);
  const high = (responseBudget || "").toLowerCase() === "high";
  const reflection = structure === "REFLECTION";
  if (!ss.length) return ["empty"];

  let restated = 0;
  for (const s of ss.slice(0, 4)) {
    if (overlapRatio(s, userMessage) >= 0.62 && words(s).length >= 8) restated++;
  }
  if (restated >= 2 || (restated >= 1 && ss.length >= 4 && overlapRatio(body, userMessage) >= 0.55)) {
    failures.push("premise_restatement");
  }

  const essayHits = (body.match(ESSAY_NOUNS) || []).length;
  if (essayHits >= 3) failures.push("essay_diction");
  const essayThreshold = high || reflection ? 3 : 2;
  if (essayHits >= essayThreshold && (structure === "SNAP" || structure === "KNIFE")) {
    failures.push("multi_mechanism_essay");
  }

  let dupPairs = 0;
  for (let i = 0; i < ss.length - 1; i++) {
    if (overlapRatio(ss[i], ss[i + 1]) >= 0.7) dupPairs++;
  }
  if (dupPairs >= 2 || (dupPairs >= 1 && ss.length >= 5)) failures.push("thesis_repetition");

  const spear = detectSpear(ss);
  if (!spear.ok) failures.push("no_spear");
  else if (spear.index >= 0 && spear.index < ss.length - 1) {
    const after = ss.slice(spear.index + 1);
    if (reflection || high) {
      const trailing = after.length > 3 ? after.slice(-2) : [];
      if (trailing.length && trailing.every((a) => overlapRatio(a, spear.line) >= 0.55)) {
        failures.push("post_payoff_drift");
      }
    } else if (spear.index <= 1) {
      const restaty = after.filter((a) => overlapRatio(a, spear.line) >= 0.6).length;
      if (restaty >= 2) failures.push("post_payoff_drift");
    } else if (after.length >= 2) {
      const rest = after.filter((a) => overlapRatio(a, spear.line) >= 0.5).length;
      if (rest >= 2) failures.push("post_payoff_drift");
    }
  }

  const likeCount = (body.match(LIKE_A) || []).length;
  if (likeCount >= (high || reflection ? 3 : 2)) failures.push("stacked_metaphor");
  if (CTA_TAIL.test(body)) failures.push("cta_or_costume_tail");
  if (isConferenceTalkSentence(ss[ss.length - 1])) {
    failures.push("abstract_closer");
  }
  if (detectMechanismMismatch(userMessage, body)) {
    failures.push("mechanism_mismatch");
  }
  if (structure === "SNAP" && wc > caps.SNAP) failures.push("snap_overlong");
  if (structure === "KNIFE" && wc > caps.KNIFE) failures.push("knife_overlong");
  if (structure === "KNIFE" && ss.length > caps.knife_sentences) {
    failures.push("knife_too_many_sentences");
  }
  if (structure === "REFLECTION" && wc > caps.REFLECTION) failures.push("reflection_overlong");
  if (structure === "REFLECTION" && ss.length > caps.reflection_sentences) {
    failures.push("reflection_too_many_sentences");
  }
  return failures;
}

function compressOnce(
  userMessage: string,
  draft: string,
  structure: string,
  failures: string[],
  responseBudget = "medium"
): string {
  let ss = sentences(stripWhiskey(draft));
  if (!ss.length) return draft;

  let last = ss[ss.length - 1].replace(CTA_TAIL, "").trim();
  last = last.replace(/\s*(Stay (dangerous|sharp)\.?|That'?s the game\.?)\s*$/i, "").trim();
  if (last) ss[ss.length - 1] = last;
  else ss = ss.slice(0, -1);
  if (!ss.length) return stripWhiskey(draft);

  if (failures.includes("premise_restatement") || failures.includes("thesis_repetition")) {
    ss = ss.filter((s) => {
      if (overlapRatio(s, userMessage) >= 0.65 && words(s).length >= 8) {
        return SPEAR_MARKERS.test(s) && words(s).length <= 20;
      }
      return true;
    });
  }

  if (ss.length >= 2) {
    const compact: string[] = [ss[0]];
    for (let i = 1; i < ss.length; i++) {
      const prev = compact[compact.length - 1];
      if (overlapRatio(ss[i], prev) >= 0.68) continue;
      compact.push(ss[i]);
    }
    ss = compact;
  }

  if ((ss.join(" ").match(LIKE_A) || []).length >= 2) {
    let seen = 0;
    ss = ss.filter((s) => {
      const m = (s.match(LIKE_A) || []).length;
      if (m && seen >= 1) return false;
      if (m) seen++;
      return true;
    });
  }

  structure = normalizeStructureName(structure);
  const high = (responseBudget || "").toLowerCase() === "high";
  const reflection = structure === "REFLECTION";
  if (
    failures.includes("post_payoff_drift") &&
    (structure === "SNAP" || structure === "KNIFE") &&
    !high &&
    !reflection
  ) {
    const spear = detectSpear(ss);
    if (spear.ok && spear.index >= 0) {
      const trimmed = ss.slice(0, spear.index + 1);
      for (const s of ss.slice(spear.index + 1)) {
        if (overlapRatio(s, spear.line) >= 0.6) continue;
        trimmed.push(s);
        break;
      }
      ss = trimmed;
    }
  }

  let text = ss.join(" ").replace(/\s+/g, " ").trim();
  // Editorial cash-out: drop conference-talk closer if spoken proof already landed.
  // Generation owns Abstract→Spoken translation — no hardcoded paraphrase dictionary.
  if (failures.includes("abstract_closer")) {
    const ss2 = sentences(text);
    if (ss2.length >= 2 && isConferenceTalkSentence(ss2[ss2.length - 1])) {
      const prior = ss2.slice(0, -1);
      if (prior.some((p) => !isConferenceTalkSentence(p) && words(p).length >= 6)) {
        text = prior.join(" ").trim();
      }
    }
  }
  return text.replace(/\s+([,.!?;:])/g, "$1");
}

export function applyGoldShapePass(
  userMessage: string,
  draft: string,
  structure?: string,
  responseBudget = "medium"
): { text: string; report: GoldShapeReport } {
  const budget = (responseBudget || "medium").toLowerCase();
  let selected = normalizeStructureName(structure || selectStructure(userMessage, draft, structure));
  if (structure) selected = normalizeStructureName(structure);
  if (budget === "high" && selected === "SNAP") selected = "KNIFE";
  let body = stripWhiskey(draft);
  const report: GoldShapeReport = {
    selected_structure: selected,
    premise_relocated: false,
    dominant_mechanism_count: 1,
    draft_word_count: words(body).length,
    final_word_count: 0,
    quality_rewrite_triggered: false,
    quality_failures: [],
    spear_detected: false,
    whiskey_tail_present: false,
    spear_line: "",
    mechanism_mismatch: false,
    response_budget: budget,
  };

  const failures = evaluateGoldShape(userMessage, body, selected, budget);
  report.quality_failures = failures;
  report.mechanism_mismatch = failures.includes("mechanism_mismatch");
  // mechanism_mismatch is diagnostic only — do not invent a better insight here.
  const triggers = new Set([
    "premise_restatement",
    "thesis_repetition",
    "post_payoff_drift",
    "cta_or_costume_tail",
    "stacked_metaphor",
    "multi_mechanism_essay",
    "knife_overlong",
    "snap_overlong",
    "knife_too_many_sentences",
    "reflection_overlong",
    "reflection_too_many_sentences",
    "essay_diction",
    "abstract_closer",
  ]);
  if (failures.some((f) => triggers.has(f))) {
    const compressed = compressOnce(userMessage, body, selected, failures, budget);
    if (stripWhiskey(compressed)) {
      report.quality_rewrite_triggered = true;
      body = stripWhiskey(compressed);
      report.quality_failures = evaluateGoldShape(userMessage, body, selected, budget);
      report.mechanism_mismatch = report.quality_failures.includes("mechanism_mismatch");
    }
  }

  const spear = detectSpear(sentences(body));
  report.spear_detected = spear.ok;
  report.spear_line = (spear.line || "").slice(0, 240);
  report.final_word_count = words(body).length;
  report.premise_relocated = /\b(that's not|you're (not|describing)|pick me)/i.test(sentences(body)[0] || "");
  return { text: body, report };
}

export function goldShapeDiagnostics(report: GoldShapeReport): Record<string, string> {
  return {
    gold_shape_version: GOLD_SHAPE_VERSION,
    selected_structure: report.selected_structure,
    premise_relocated: String(report.premise_relocated),
    dominant_mechanism_count: String(report.dominant_mechanism_count),
    draft_word_count: String(report.draft_word_count),
    final_word_count: String(report.final_word_count),
    quality_rewrite_triggered: String(report.quality_rewrite_triggered),
    quality_failures: report.quality_failures.length ? report.quality_failures.join(",") : "none",
    spear_detected: String(report.spear_detected),
    spear_line: (report.spear_line || "").slice(0, 240),
    whiskey_tail_present: String(report.whiskey_tail_present),
    mechanism_mismatch: String(report.mechanism_mismatch),
    response_budget: report.response_budget || "medium",
  };
}
