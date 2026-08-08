/**
 * Recognition Landing + Signature Line gate for Dynamic Mode.
 *
 * landing_engine_version must appear in every Dynamic response log.
 */

import {
  SIGNATURE_ENGINE_VERSION,
  ensureSignatureLine,
  generateSignatureLine,
  lastLineIsSignature,
  validateSignatureLine,
} from "./signatureLine";

export const LANDING_ENGINE_VERSION = SIGNATURE_ENGINE_VERSION;

const BROKEN_CLOSER_PATTERNS: RegExp[] = [
  /^what about\b.+\blooks different\b/i,
  /^what about\b.+\bseen it named\b/i,
  /\bhate \w+ looks\b/i,
  /\bfeminists?\b.+\blooks different\b/i,
  /\bwhat about (?:the )?(?:\w+\s+){2,6}looks\b/i,
  /\bseen it named\b/i,
  /\bstill holds\?$/i,
];

export type LandingValidation = {
  ok: boolean;
  reason: string;
};

export function lastSentence(text: string): string {
  const body = (text || "")
    .replace(/\s*🥃\s*/g, " ")
    .replace(/@MoodyBotAI/gi, "")
    .trim();
  if (!body) return "";
  const paras = body.split(/\n\s*\n/);
  const lastPara = (paras[paras.length - 1] || "").trim();
  const lines = lastPara
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const candidate = lines[lines.length - 1] || lastPara;
  const sentences = candidate
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences[sentences.length - 1] || candidate;
}

export function isBrokenCloser(text: string): boolean {
  const s = (text || "").trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (BROKEN_CLOSER_PATTERNS.some((pat) => pat.test(lower))) return true;
  if (lower.startsWith("what about ") && lower.includes(" looks ")) return true;
  if (
    /\b(?:feminists?|women|men|porn|dirty talk)\b.+\b(?:looks different|seen it named)\b/i.test(
      lower
    )
  ) {
    return true;
  }
  return false;
}

/** Hard rejection gate — exact failure and malformed family. */
export function validateLanding(closer: string): LandingValidation {
  const s = (closer || "").trim();
  if (!s) return { ok: true, reason: "empty" };
  if (isBrokenCloser(s)) {
    return { ok: false, reason: "REJECTED:malformed_topic_staple" };
  }
  if (/^what about\b/i.test(s) && /\bhate\b/i.test(s)) {
    return { ok: false, reason: "REJECTED:what_about_hate_stack" };
  }
  if (/now that you've seen it named\??$/i.test(s)) {
    return { ok: false, reason: "REJECTED:seen_it_named_template" };
  }
  return { ok: true, reason: "ok" };
}

function stripTrailingBrokenSentence(text: string): string {
  let out = (text || "").trim();
  if (!out) return out;

  const lines = out.split("\n");
  while (lines.length) {
    const last = (lines[lines.length - 1] || "").trim();
    if (
      !last ||
      /@MoodyBotAI/i.test(last) ||
      /^🥃/.test(last) ||
      /breathe before you reply/i.test(last) ||
      /tag .*@MoodyBotAI/i.test(last) ||
      /he won.?t save you/i.test(last) ||
      /you wanted the truth/i.test(last)
    ) {
      lines.pop();
      continue;
    }
    break;
  }
  out = lines.join("\n").trim();

  const paras = out.split(/\n\s*\n/);
  if (paras.length >= 2) {
    const closer = (paras[paras.length - 1] || "").trim();
    if (!validateLanding(closer).ok || isBrokenCloser(closer)) {
      out = paras.slice(0, -1).join("\n\n").trim();
    }
  }

  if (out.endsWith("?") || isBrokenCloser(lastSentence(out))) {
    const sentences = out.split(/(?<=[.!?])\s+/);
    if (sentences.length >= 2) {
      const final = sentences[sentences.length - 1] || "";
      if (!validateLanding(final).ok || isBrokenCloser(final)) {
        out = sentences.slice(0, -1).join(" ").trim();
      }
    }
  }

  if (/seen it named/i.test(out) || /what about .+ looks different/i.test(out)) {
    out = out
      .split(/(?<=[.!?])\s+/)
      .filter((s) => validateLanding(s).ok && !isBrokenCloser(s))
      .join(" ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return out;
}

/**
 * Apply Signature Line after model draft.
 * Order: Signature Line → (callback handled in prompts) → silence fallback.
 */
export function applyRecognitionLanding(
  text: string,
  userMessage: string
): { text: string; modified: boolean; landing: string } {
  const before = (text || "").trim();
  let out = stripTrailingBrokenSentence(before);
  let modified = out !== before;

  const um = (userMessage || "").toLowerCase();
  const practical =
    /what should i do|what do i say|how should i handle|what now/.test(um);
  const grief = /\b(died|funeral|grief|can't stop crying)\b/.test(um);

  if (grief) {
    return { text: out, modified, landing: "silence" };
  }
  if (practical) {
    return { text: out, modified, landing: "action" };
  }

  if (lastLineIsSignature(out, userMessage)) {
    return { text: out, modified, landing: "signature_line" };
  }

  // Generate AFTER body exists — react to the draft
  generateSignatureLine({}, out, userMessage);
  const ensured = ensureSignatureLine(out, userMessage, {});
  out = ensured.text;
  modified = modified || ensured.modified;

  if (isBrokenCloser(lastSentence(out)) || /seen it named/i.test(out)) {
    out = stripTrailingBrokenSentence(out);
    modified = true;
  }

  const landing =
    ensured.signature && validateSignatureLine(ensured.signature, { allowExceptionalLength: true }).ok
      ? "signature_line"
      : lastLineIsSignature(out)
        ? "signature_line"
        : "silence";

  return { text: out, modified, landing };
}

/** Surface render may change typography only — no new sentences. */
export function responseTextAfterSurfaceSemanticallyEquals(
  afterLanding: string,
  afterSurface: string
): boolean {
  const normalize = (t: string) =>
    (t || "")
      .replace(/[“”]/g, '"')
      .replace(/[—–]/g, "-")
      .replace(/\s*🥃\s*/g, " ")
      .replace(/@MoodyBotAI/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const a = normalize(afterLanding);
  const b = normalize(afterSurface);
  if (a === b) return true;

  const countSentences = (s: string) =>
    s.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 0).length;
  if (countSentences(b) > countSentences(a)) return false;
  if (/seen it named|what about .+ looks different/i.test(afterSurface)) {
    return false;
  }
  const aCore = a.replace(/[.!?]+$/g, "").trim();
  return (
    b.includes(aCore.slice(0, Math.min(80, aCore.length))) ||
    a.includes(b.slice(0, Math.min(80, b.length)))
  );
}
