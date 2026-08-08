/**
 * Signature Line Engine — the sentence the reader remembers tomorrow.
 *
 * MoodyBot is a writer. The last sentence is a first-class writing object.
 * generateSignatureLine runs AFTER the body exists and reacts to it.
 */

export const SIGNATURE_ENGINE_VERSION = "signature-line-v2";

const MAX_WORDS = 18;
const MAX_WORDS_EXCEPTIONAL = 22;
const MIN_WORDS = 4;

const recentSignatures: string[] = [];
const RECENT_MAX = 32;

const GENERIC_APHORISMS = [
  "everything happens for a reason",
  "life is complicated",
  "truth always wins",
  "power corrupts",
  "trust the process",
  "you got this",
  "stay strong",
  "believe in yourself",
  "it is what it is",
  "live your truth",
  "time heals all wounds",
  "knowledge is power",
  "change is hard",
  "the truth hurts",
];

const AI_PROFOUND = [
  "in a world where",
  "at the end of the day",
  "the reality is that",
  "it's important to remember",
  "a powerful reminder",
  "speaks volumes",
  "the human condition",
];

const ENGAGEMENT = [
  "do you want",
  "would you like",
  "let me know",
  "say the word",
  "does that make sense",
  "subscribe",
  "@moodybot",
];

const SUMMARY = [
  "in other words",
  "to summarize",
  "to sum up",
  "in summary",
  "basically",
  "all in all",
  "the bottom line is",
];

export type ResponsePlanLike = {
  central_insight?: string;
  original_subject?: string;
  primary_capability?: string;
  intervention?: string;
  anchors?: string[];
  intent?: string;
  selected_command?: string;
  needs_practical_action?: boolean;
};

function wordCount(text: string): number {
  return ((text || "").match(/[A-Za-z0-9']+/g) || []).length;
}

function norm(text: string): string {
  return (text || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function contentTokens(text: string): Set<string> {
  const stop = new Set([
    "the", "and", "for", "that", "this", "with", "from", "about", "have",
    "what", "when", "where", "which", "your", "you", "how", "did", "does",
    "are", "was", "were", "been", "into", "than", "then", "just", "like",
    "not", "but", "its", "they", "them", "their", "our", "out", "all",
  ]);
  return new Set(
    (norm(text).match(/[a-z0-9']+/g) || []).filter((t) => t.length > 2 && !stop.has(t))
  );
}

function isSingleSentence(text: string): boolean {
  const s = (text || "").trim();
  if (!s || !/[.!]$/.test(s)) return false;
  const body = s.slice(0, -1);
  if (body.includes("?") || body.includes("!") || body.includes(".")) return false;
  return true;
}

function hasTurn(line: string): boolean {
  return /\b(but|becomes?|before|after|where|when|don't|doesn't|isn't|stops?|started|reveals?|explains?|pretending|usually|already|never|only|without|instead|rarely|needs?|runs?\s+out)\b/i.test(
    line
  );
}

export type SignatureQuality = {
  specificity: boolean;
  compression: boolean;
  authorship: boolean;
  inevitability: boolean;
  memory: boolean;
  reasons: string[];
  ok: boolean;
};

export function scoreSignatureLine(
  line: string,
  opts: { body?: string; userMessage?: string; anchors?: string[]; centralInsight?: string } = {}
): SignatureQuality {
  const lower = norm(line);
  const reasons: string[] = [];
  const conversation = new Set([
    ...contentTokens(opts.userMessage || ""),
    ...contentTokens(opts.centralInsight || ""),
    ...contentTokens((opts.anchors || []).join(" ")),
    ...contentTokens(opts.body || ""),
  ]);

  let specificity = true;
  if (GENERIC_APHORISMS.some((a) => lower.includes(a) || lower.replace(/[.!]$/, "") === a)) {
    specificity = false;
    reasons.push("specificity:generic_aphorism");
  }

  let compression = true;
  if (SUMMARY.some((m) => lower.includes(m))) {
    compression = false;
    reasons.push("compression:mechanical_summary");
  }

  let authorship = true;
  if (ENGAGEMENT.some((m) => lower.includes(m)) || AI_PROFOUND.some((m) => lower.includes(m))) {
    authorship = false;
    reasons.push("authorship:ai_or_engagement");
  }
  if (/^(so,|so |look,|well,|anyway,)/i.test(line)) {
    authorship = false;
    reasons.push("authorship:chat_opener");
  }

  const lineToks = contentTokens(line);
  let inevitability = true;
  if (conversation.size && lineToks.size) {
    let overlap = false;
    for (const t of lineToks) {
      if (conversation.has(t)) {
        overlap = true;
        break;
      }
    }
    if (!overlap && !(hasTurn(line) && wordCount(line) <= 12)) {
      inevitability = false;
      reasons.push("inevitability:not_earned_by_body");
    }
  }

  const wc = wordCount(line);
  let memory =
    isSingleSentence(line) &&
    !line.trim().endsWith("?") &&
    wc >= MIN_WORDS &&
    wc <= MAX_WORDS_EXCEPTIONAL &&
    (wc <= 10 || hasTurn(line));
  if (!memory) reasons.push("memory:fail");

  const ok = specificity && compression && authorship && inevitability && memory;
  return { specificity, compression, authorship, inevitability, memory, reasons, ok };
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
  const q = scoreSignatureLine(s, {
    body: opts.body,
    userMessage: opts.userMessage,
  });
  if (!q.ok) return { ok: false, reason: "REJECTED:" + (q.reasons[0] || "quality") };
  return { ok: true, reason: "ok" };
}

function remember(text: string): void {
  const n = norm(text);
  if (!n) return;
  recentSignatures.push(n);
  while (recentSignatures.length > RECENT_MAX) recentSignatures.shift();
}

function topicLine(userMessage: string, body: string): string | null {
  const blob = `${userMessage} ${body}`.toLowerCase();
  const bank: Array<[RegExp, string[]]> = [
    [
      /feminist|feminism|praising|pick me|loyalty|equality/,
      [
        "The moment gratitude becomes betrayal, the argument stopped being about equality.",
        "The script usually survives by making disagreement feel like betrayal.",
        "The moment gratitude needs permission, the argument changed.",
      ],
    ],
    [/boundary|boundaries/, ["Boundaries rarely end relationships — they reveal them."]],
    [
      /story|narrative|defending/,
      [
        "The story started defending itself long before it started defending people.",
        "The story started defending itself long before it started defending women.",
      ],
    ],
    [/backstage/, ["The backstage explains the stage."]],
    [/paper trail|receipts|performance/, ["The paper trail is where the performance runs out."]],
    [/dirty talk|porn|script/, ["The script library grew — the language only followed."]],
    [/cancel|late at night|low priority/, ["Convenience dressed as connection is still just convenience."]],
  ];
  for (const [re, lines] of bank) {
    if (!re.test(blob)) continue;
    for (const line of lines) {
      if (recentSignatures.includes(norm(line))) continue;
      if (validateSignatureLine(line, { allowExceptionalLength: true, userMessage, body }).ok) {
        return line;
      }
    }
  }
  return null;
}

export function lastLineIsSignature(text: string, userMessage = ""): boolean {
  const paras = (text || "").trim().split(/\n\s*\n/);
  const last = (paras[paras.length - 1] || "").trim();
  const body = paras.slice(0, -1).join("\n\n");
  return validateSignatureLine(last, {
    body,
    userMessage,
    checkNovelty: false,
  }).ok;
}

function extractFromBody(body: string, userMessage: string): string | null {
  const sentences = (body || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s && !s.endsWith("?"));
  for (let i = sentences.length - 1; i >= 0; i--) {
    const s = sentences[i];
    if (validateSignatureLine(s, { allowExceptionalLength: true, userMessage, body, checkNovelty: false }).ok) {
      return s;
    }
  }
  return null;
}

/** Write the last sentence after the body exists. */
export function generateSignatureLine(
  plan: ResponsePlanLike | null | undefined,
  draft: string,
  userMessage = ""
): string | null {
  let body = (draft || "").trim();
  if (body.endsWith("?")) {
    const sents = body.split(/(?<=[.!?])\s+/);
    if (sents.length >= 2) body = sents.slice(0, -1).join(" ").trim();
  }
  if (lastLineIsSignature(body, userMessage)) {
    const paras = body.split(/\n\s*\n/);
    return (paras[paras.length - 1] || "").trim();
  }
  const extracted = extractFromBody(body, userMessage);
  if (extracted) return extracted;
  return topicLine(userMessage, body);
}

export function craftSignatureLine(userMessage: string, body: string): string | null {
  return generateSignatureLine({}, body, userMessage);
}

export function ensureSignatureLine(
  text: string,
  userMessage: string,
  plan?: ResponsePlanLike
): { text: string; modified: boolean; signature: string | null } {
  let base = (text || "").trim();
  if (lastLineIsSignature(base, userMessage)) {
    const paras = base.split(/\n\s*\n/);
    const line = (paras[paras.length - 1] || "").trim();
    remember(line);
    return { text: base, modified: false, signature: line };
  }
  if (base.endsWith("?")) {
    const sents = base.split(/(?<=[.!?])\s+/);
    if (sents.length >= 2) base = sents.slice(0, -1).join(" ").trim();
  }
  const line = generateSignatureLine(plan || {}, base, userMessage);
  if (!line || !validateSignatureLine(line, { allowExceptionalLength: true, userMessage, body: base, checkNovelty: false }).ok) {
    return { text: base, modified: false, signature: null };
  }
  const paras = base.split(/\n\s*\n/);
  const last = (paras[paras.length - 1] || "").trim();
  if (last === line) {
    remember(line);
    return { text: base, modified: false, signature: line };
  }
  const out = base ? `${base.replace(/\s+$/, "")}\n\n${line}` : line;
  remember(line);
  return { text: out, modified: true, signature: line };
}
