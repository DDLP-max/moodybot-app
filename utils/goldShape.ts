/**
 * Gold-shape delivery: cut → name → prove once → stop → 🥃
 * At most one structural compression. Not creative authorship.
 */
export const GOLD_SHAPE_VERSION = "gold-shape-v1";

const WHISKEY = "🥃";
const WORD_RE = /[A-Za-z']+/g;
const LIKE_A = /\blike a\b|\bas if\b|\bas though\b/gi;
const ESSAY_NOUNS =
  /\b(ideology|universal claim|defection|dialectic|paradigm|systemic mechanism|resentment economy|grievance economy|incentive structure|narrative contract|framework)\b/gi;
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
};

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

export function selectStructure(userMessage: string, draft: string): string {
  const wc = words(draft).length;
  const ss = sentences(draft);
  const paras = (draft || "").split("\n").filter((p) => p.trim());
  const narrative = /\b(for (example|instance)|seasons?|years?|proof|daenerys|she |he |they )\b/i.test(draft);
  if (wc <= 45 && ss.length <= 2) return "SNAP";
  if (paras.length >= 3 || (narrative && (wc >= 70 || ss.length >= 4))) return "STORY";
  if (/\b(tell me (the )?story|walk me through|what happened)\b/i.test(userMessage)) return "STORY";
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

export function evaluateGoldShape(userMessage: string, draft: string, structure: string): string[] {
  const failures: string[] = [];
  const body = stripWhiskey(draft);
  const ss = sentences(body);
  const wc = words(body).length;
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
  if (essayHits >= 2 && (structure === "SNAP" || structure === "KNIFE")) failures.push("multi_mechanism_essay");

  let dupPairs = 0;
  for (let i = 0; i < ss.length - 1; i++) {
    if (overlapRatio(ss[i], ss[i + 1]) >= 0.7) dupPairs++;
  }
  if (dupPairs >= 2 || (dupPairs >= 1 && ss.length >= 5)) failures.push("thesis_repetition");

  const spear = detectSpear(ss);
  if (!spear.ok) failures.push("no_spear");
  else if (spear.index >= 0 && spear.index < ss.length - 1 && structure !== "STORY") {
    const after = ss.slice(spear.index + 1);
    if (spear.index <= 1) {
      const restaty = after.filter((a) => overlapRatio(a, spear.line) >= 0.6).length;
      if (restaty >= 2) failures.push("post_payoff_drift");
    } else if (after.length >= 2) {
      const rest = after.filter((a) => overlapRatio(a, spear.line) >= 0.5).length;
      if (rest >= 2) failures.push("post_payoff_drift");
    }
  }

  const likeCount = (body.match(LIKE_A) || []).length;
  if (likeCount >= 2) failures.push("stacked_metaphor");
  if (CTA_TAIL.test(body)) failures.push("cta_or_costume_tail");
  if (structure === "SNAP" && wc > 70) failures.push("snap_overlong");
  if (structure === "KNIFE" && wc > 140) failures.push("knife_overlong");
  if (structure === "KNIFE" && ss.length > 7) failures.push("knife_too_many_sentences");
  return failures;
}

function compressOnce(userMessage: string, draft: string, structure: string, failures: string[]): string {
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

  if (
    failures.includes("post_payoff_drift") &&
    (structure === "SNAP" || structure === "KNIFE")
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
  if (failures.includes("essay_diction") || failures.includes("multi_mechanism_essay")) {
    text = text
      .replace(/\bresentment economy\b/i, "shared grievance story")
      .replace(/\bideology\b/i, "script")
      .replace(/\buniversal claim\b/i, "blanket story")
      .replace(/\bdefection\b/i, "exit");
  }
  return text.replace(/\s+([,.!?;:])/g, "$1");
}

export function applyGoldShapePass(
  userMessage: string,
  draft: string,
  structure?: string
): { text: string; report: GoldShapeReport } {
  const selected = structure || selectStructure(userMessage, draft);
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
  };

  const failures = evaluateGoldShape(userMessage, body, selected);
  report.quality_failures = failures;
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
    "essay_diction",
  ]);
  if (failures.some((f) => triggers.has(f))) {
    const compressed = compressOnce(userMessage, body, selected, failures);
    if (stripWhiskey(compressed)) {
      report.quality_rewrite_triggered = true;
      body = stripWhiskey(compressed);
      report.quality_failures = evaluateGoldShape(userMessage, body, selected);
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
  };
}
