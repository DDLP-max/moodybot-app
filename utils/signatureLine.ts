/**
 * Signature Line — rare earned ending, never a required module.
 * PRIMARY RULE: the body is allowed to be the last line.
 * BODY_ENDS_RESPONSE is preferred. NO_SIGNATURE_FOUND is success.
 */

export const SIGNATURE_ENGINE_VERSION = "minimal-write-v1";
/** Creative Signature Line discovery — OFF on default Dynamic path. */
export const CREATIVE_ENDING_TOOLS_ENABLED =
  process.env.MOODYBOT_CREATIVE_ENDINGS === "1";
export const NO_SIGNATURE_FOUND = "NO_SIGNATURE_FOUND";

const MAX_WORDS = 18;
const MAX_WORDS_EXCEPTIONAL = 22;
const MIN_WORDS = 4;
const DISCOVERY_THRESHOLD = 0.72;
const SIMILARITY_REJECT = 0.62;
const REDUNDANCY_REJECT = 0.55;

const TERMINAL_RHYTHM_EXAMPLES = [
  "before the example spreads",
  "the paper trail does the talking",
  "the relationship was already telling you",
  "the performance runs out",
  "before the example becomes contagious",
  "examples are more dangerous than arguments",
];

const recentSignatures: string[] = [];

const GENERIC = [
  "everything happens for a reason", "life is complicated", "truth always wins",
  "truth wins", "power corrupts", "gratitude matters", "movements need enemies",
  "everything changes", "stories protect themselves", "boundaries matter",
  "trust the process", "the truth hurts", "change is hard",
];

const AI_PROFOUND = [
  "in a world where", "at the end of the day", "the reality is that",
  "a powerful reminder", "speaks volumes", "the human condition",
];

function wordCount(text: string): number {
  return ((text || "").match(/[A-Za-z0-9']+/g) || []).length;
}

function norm(text: string): string {
  return (text || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function contentTokens(text: string): Set<string> {
  const stop = new Set([
    "the", "and", "for", "that", "this", "with", "from", "about", "have",
    "what", "when", "where", "which", "your", "you", "how", "not", "but",
    "they", "them", "their", "are", "was", "were", "been", "into",
  ]);
  return new Set(
    (norm(text).match(/[a-z0-9']+/g) || []).filter((t) => t.length > 2 && !stop.has(t))
  );
}

function isSingleSentence(text: string): boolean {
  const s = (text || "").trim();
  if (!s || !/[.!]$/.test(s)) return false;
  const body = s.slice(0, -1);
  return !body.includes("?") && !body.includes("!") && !body.includes(".");
}

function bodySentences(body: string): string[] {
  return (body || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s && !s.endsWith("?"));
}

function finalParagraph(text: string): string {
  const paras = (text || "").trim().split(/\n\s*\n/);
  return (paras[paras.length - 1] || "").trim();
}

export function lastSentence(text: string): string {
  const body = (text || "")
    .replace(/\s*🥃\s*/g, " ")
    .replace(/@MoodyBotAI/gi, "")
    .trim();
  if (!body) return "";
  const lastPara = finalParagraph(body);
  const sentences = lastPara
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences[sentences.length - 1] || lastPara;
}

export function semanticSimilarity(a: string, b: string): number {
  const ta = contentTokens(a);
  const tb = contentTokens(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = new Set([...ta, ...tb]).size;
  return inter / Math.max(union, 1);
}

export function isShorterParaphrase(line: string, body: string): boolean {
  const lineToks = contentTokens(line);
  if (lineToks.size < 3) return false;
  const lineWc = wordCount(line);
  for (const sent of bodySentences(body)) {
    const sentToks = contentTokens(sent);
    if (!sentToks.size) continue;
    let subset = true;
    for (const t of lineToks) {
      if (!sentToks.has(t)) {
        subset = false;
        break;
      }
    }
    if (subset && lineWc < wordCount(sent)) return true;
    let overlap = 0;
    for (const t of lineToks) if (sentToks.has(t)) overlap++;
    if (
      overlap / lineToks.size >= 0.8 &&
      lineWc <= wordCount(sent) &&
      [...lineToks].filter((t) => !sentToks.has(t)).length <= 1
    ) {
      return true;
    }
  }
  return false;
}

export function bodyAlreadySaidThis(line: string, body: string): boolean {
  const lineN = norm(line);
  const lineToks = contentTokens(line);
  if (!lineN || !body || !lineToks.size) return false;
  for (const sent of bodySentences(body)) {
    const sentN = norm(sent);
    const sentToks = contentTokens(sent);
    if (!sentN || !sentToks.size) continue;
    if (lineN === sentN || lineN.replace(/[.!]$/, "") === sentN.replace(/[.!]$/, "")) {
      return true;
    }
    let subset = true;
    for (const t of lineToks) {
      if (!sentToks.has(t)) {
        subset = false;
        break;
      }
    }
    if (subset && lineToks.size >= 3) return true;
    let overlap = 0;
    for (const t of lineToks) if (sentToks.has(t)) overlap++;
    const ratio = overlap / lineToks.size;
    if (ratio >= 0.72) return true;
  }
  const fp = finalParagraph(body);
  if (fp && semanticSimilarity(line, fp) >= SIMILARITY_REJECT) {
    const novel = [...contentTokens(line)].filter((t) => !contentTokens(fp).has(t));
    if (novel.length < 2) return true;
  }
  return false;
}

export function addsDeeperLayer(line: string, body: string): boolean {
  if (!body) return false;
  const lineToks = contentTokens(line);
  const bodyToks = contentTokens(body);
  const novel = [...lineToks].filter((t) => !bodyToks.has(t));
  const reveal =
    /\b(becomes?|became|stopped being|already ending|runs?\s+out|pretending|needs? permission|survives by|long before|was already|no longer|instead|don't end|rarely end|explains?|announces itself)\b/i.test(
      line
    );
  if (/\b(matter|matters|important|real|true|valid)\b\.?$/i.test(norm(line))) return false;
  return reveal && novel.length >= 2;
}

export function isSemanticallyRedundant(line: string, body: string): boolean {
  if (!line || !body) return false;
  if (bodyAlreadySaidThis(line, body) || isShorterParaphrase(line, body)) return true;
  const sents = bodySentences(body);
  const final = sents[sents.length - 1] || "";
  const fp = finalParagraph(body);
  for (const target of [final, fp, body].filter(Boolean)) {
    const sim = semanticSimilarity(line, target);
    const novel = [...contentTokens(line)].filter((t) => !contentTokens(target).has(t));
    if (sim >= SIMILARITY_REJECT && novel.length < 2) return true;
    if (
      sim >= REDUNDANCY_REJECT &&
      wordCount(line) <= wordCount(target) &&
      novel.length < 3 &&
      !addsDeeperLayer(line, body)
    ) {
      return true;
    }
  }
  return false;
}

export function hasTerminalRhythm(final: string): boolean {
  const lower = (final || "").trim().toLowerCase().replace(/[.!]+$/, "");
  if (!lower) return false;
  if (TERMINAL_RHYTHM_EXAMPLES.some((ex) => lower.includes(ex))) return true;
  if (
    /\b(?:before|once|until)\b.+\b(?:spreads?|contagious|runs?\s+out|ends?|talking|telling you)\b/i.test(
      lower
    )
  ) {
    return true;
  }
  if (
    /\b(?:enforcement|disciplinary|threatens?|resentment|defection|loyalty|narrative|punish|breach|collective)\b/i.test(
      lower
    ) &&
    lower.split(/\s+/).length >= 10 &&
    /\b(?:spreads?|talking|telling|runs?\s+out|resentment|defection|enforcement|narrative|breach|loyalty|betrayal)\.?$/i.test(
      lower
    )
  ) {
    return true;
  }
  return false;
}

export function bodyAlreadyLands(body: string): boolean {
  const text = (body || "").trim();
  if (!text) return false;
  const last = finalParagraph(text);
  if (!last || last.endsWith("?")) return false;
  if (/do you want|would you like|seen it named|what about |say the word/i.test(last)) {
    return false;
  }
  if (/in other words|to summarize|to sum up|in summary|basically|all in all/i.test(last)) {
    return false;
  }
  const sentences = last.split(/(?<=[.!])\s+/).map((s) => s.trim()).filter(Boolean);
  if (!sentences.length) return false;
  const final = sentences[sentences.length - 1];
  if (!/[.!]$/.test(final)) return false;
  const stem = final.replace(/[.!]+$/, "").trim();
  if (/\b(?:because|since|which means|however|although|though|but)\s*$/i.test(stem)) {
    return false;
  }
  const wc = final.split(/\s+/).length;
  if (wc < 7) return false;
  const rhythm = hasTerminalRhythm(final);
  const insight =
    /\b(enforcement|disciplinary|threatens?|reveals?|betrayal|convenience|protection|resentment|defection|loyalty|narrative|grievance|already|stopped|becomes?|explains?|survives?|pretending|punish|breach|collective|subtractive)\b/i.test(
      final
    );
  const hedging = /\b(maybe|perhaps|might|seems? to)\b/i.test(final);
  const multi = bodySentences(text).length >= 2;
  const solid = wc >= 12 && !hedging && insight;
  const rhythmicClose = rhythm && wc >= 8 && !hedging;
  if (rhythmicClose && (insight || multi || wc >= 14)) return true;
  if (solid && (rhythm || multi)) return true;
  // Completed argument: setup sentences + closing insight
  if (insight && multi && wc >= 7 && !hedging) return true;
  return false;
}

export function bodyAloneStrongerOrEqual(body: string, signature: string): boolean {
  if (!signature?.trim()) return true;
  if (bodyAlreadyLands(body)) return true;
  if (isSemanticallyRedundant(signature, body)) return true;
  if (bodyAlreadySaidThis(signature, body)) return true;
  if (isShorterParaphrase(signature, body)) return true;
  if (!addsDeeperLayer(signature, body)) return true;
  const fp = finalParagraph(body);
  if (fp && semanticSimilarity(signature, fp) >= SIMILARITY_REJECT) return true;
  return false;
}

/** True = keep signature. False = delete (A ≥ B). */
export function deletionTest(body: string, signature: string): boolean {
  if (!signature?.trim()) return false;
  if (bodyAloneStrongerOrEqual(body, signature)) return false;
  return true;
}

export type SignatureLineScore = {
  total: number;
  ok: boolean;
  reasons: string[];
};

export function scoreDiscovery(
  line: string,
  body: string,
  userMessage = ""
): SignatureLineScore {
  const reasons: string[] = [];
  const lower = norm(line);
  if (GENERIC.some((g) => lower.includes(g))) reasons.push("bumper_sticker");
  if (AI_PROFOUND.some((g) => lower.includes(g))) reasons.push("fake_profundity");
  if (bodyAlreadySaidThis(line, body)) reasons.push("restates_or_shortens");
  if (body && !deletionTest(body, line)) reasons.push("fails_deletion_test");

  const lineToks = contentTokens(line);
  const bodyToks = contentTokens(body);
  const novel = [...lineToks].filter((t) => !bodyToks.has(t));
  const novelInsight = Math.min(1, novel.length / 3);
  const unexpected = novel.length >= 2 ? 1 : 0.35;
  let overlap = false;
  for (const t of lineToks) if (bodyToks.has(t)) overlap = true;
  const deeper = addsDeeperLayer(line, body);
  const inevitable = overlap ? 1 : deeper && novel.length >= 2 ? 0.9 : 0.2;
  const addsMeaning = deeper ? 1 : 0;
  const differentAbstraction = novel.length >= 2 && deeper ? 1 : 0.25;
  const total =
    (novelInsight + unexpected + inevitable + addsMeaning + differentAbstraction) / 5;
  if (total < DISCOVERY_THRESHOLD) reasons.push("below_discovery_threshold");
  return { total, ok: total >= DISCOVERY_THRESHOLD && reasons.length === 0, reasons };
}

export function validateSignatureLine(
  text: string,
  opts: {
    allowExceptionalLength?: boolean;
    checkNovelty?: boolean;
    body?: string;
    userMessage?: string;
  } = {}
): { ok: boolean; reason: string } {
  const s = (text || "").trim();
  if (!s) return { ok: false, reason: "REJECTED:empty" };
  if (s.endsWith("?")) return { ok: false, reason: "REJECTED:question" };
  if (!isSingleSentence(s)) return { ok: false, reason: "REJECTED:not_one_sentence" };
  const wc = wordCount(s);
  const limit = opts.allowExceptionalLength ? MAX_WORDS_EXCEPTIONAL : MAX_WORDS;
  if (wc > limit) return { ok: false, reason: "REJECTED:too_long" };
  if (wc < MIN_WORDS) return { ok: false, reason: "REJECTED:too_short" };
  if (opts.checkNovelty !== false && recentSignatures.includes(norm(s))) {
    return { ok: false, reason: "REJECTED:slogan_reuse" };
  }
  if (opts.body && !deletionTest(opts.body, s)) {
    return { ok: false, reason: "REJECTED:fails_deletion_test" };
  }
  const disc = scoreDiscovery(s, opts.body || "", opts.userMessage);
  if (!disc.ok) return { ok: false, reason: "REJECTED:" + (disc.reasons[0] || "discovery") };
  return { ok: true, reason: "ok" };
}

function remember(text: string): void {
  const n = norm(text);
  if (!n) return;
  recentSignatures.push(n);
  while (recentSignatures.length > 32) recentSignatures.shift();
}

function candidateBank(userMessage: string, body: string): string[] {
  const blob = `${userMessage} ${body}`.toLowerCase();
  if (/feminist|feminism|praising|pick me|loyalty|equality/.test(blob)) {
    return [
      "The moment gratitude becomes betrayal, the argument stopped being about equality.",
      "The moment gratitude needs permission, the argument changed.",
    ];
  }
  if (/boundary|boundaries/.test(blob)) {
    return [
      "Boundaries don't end relationships — they reveal the ones that were already ending.",
    ];
  }
  return [];
}

export function lastLineIsSignature(text: string, userMessage = ""): boolean {
  const paras = (text || "").trim().split(/\n\s*\n/);
  if (paras.length < 2) return false;
  const last = (paras[paras.length - 1] || "").trim();
  const prior = paras.slice(0, -1).join("\n\n");
  return validateSignatureLine(last, {
    body: prior,
    userMessage,
    checkNovelty: false,
    allowExceptionalLength: true,
  }).ok;
}

export function discoverSignatureLine(
  _plan: unknown,
  draft: string,
  userMessage = ""
): string | null {
  let body = (draft || "").trim();
  if (body.endsWith("?")) {
    const sents = body.split(/(?<=[.!?])\s+/);
    if (sents.length >= 2) body = sents.slice(0, -1).join(" ").trim();
  }
  if (bodyAlreadyLands(body)) return null;

  for (const cand of candidateBank(userMessage, body)) {
    if (recentSignatures.includes(norm(cand))) continue;
    const disc = scoreDiscovery(cand, body, userMessage);
    if (!disc.ok) continue;
    if (
      validateSignatureLine(cand, {
        body,
        userMessage,
        allowExceptionalLength: true,
      }).ok &&
      deletionTest(body, cand)
    ) {
      return cand;
    }
  }
  return null;
}

export function generateSignatureLine(
  plan: unknown,
  draft: string,
  userMessage = ""
): string | null {
  return discoverSignatureLine(plan, draft, userMessage);
}

export function craftSignatureLine(userMessage: string, body: string): string | null {
  return discoverSignatureLine({}, body, userMessage);
}

export function ensureSignatureLine(
  text: string,
  userMessage: string,
  _plan?: unknown
): { text: string; modified: boolean; signature: string | null; landing: string } {
  let base = (text || "").trim();
  if (base.endsWith("?")) {
    const sents = base.split(/(?<=[.!?])\s+/);
    if (sents.length >= 2) base = sents.slice(0, -1).join(" ").trim();
  }

  if (bodyAlreadyLands(base)) {
    return { text: base, modified: false, signature: null, landing: "body_ends_response" };
  }

  if (lastLineIsSignature(base, userMessage)) {
    const paras = base.split(/\n\s*\n/);
    const line = (paras[paras.length - 1] || "").trim();
    const prior = paras.slice(0, -1).join("\n\n");
    if (deletionTest(prior, line)) {
      remember(line);
      return { text: base, modified: false, signature: line, landing: "signature_line" };
    }
    return { text: prior || base, modified: true, signature: null, landing: "body_ends_response" };
  }

  const line = discoverSignatureLine({}, base, userMessage);
  if (!line || !deletionTest(base, line)) {
    return { text: base, modified: false, signature: null, landing: "body_ends_response" };
  }
  const out = `${base.replace(/\s+$/, "")}\n\n${line}`;
  remember(line);
  return { text: out, modified: true, signature: line, landing: "signature_line" };
}
