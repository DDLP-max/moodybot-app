/**
 * Earned endings for Dynamic Mode.
 * BODY_ENDS_RESPONSE is first-class. Signature Line is optional discovery.
 */

import {
  SIGNATURE_ENGINE_VERSION,
  bodyAlreadyLands,
  ensureSignatureLine,
  lastSentence,
} from "./signatureLine";

export { lastSentence };
export const LANDING_ENGINE_VERSION = SIGNATURE_ENGINE_VERSION;

const BROKEN_CLOSER_PATTERNS: RegExp[] = [
  /^what about\b.+\blooks different\b/i,
  /^what about\b.+\bseen it named\b/i,
  /\bhate \w+ looks\b/i,
  /\bfeminists?\b.+\blooks different\b/i,
  /\bseen it named\b/i,
];

export type LandingValidation = { ok: boolean; reason: string };

export function isBrokenCloser(text: string): boolean {
  const s = (text || "").trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (BROKEN_CLOSER_PATTERNS.some((pat) => pat.test(lower))) return true;
  if (lower.startsWith("what about ") && lower.includes(" looks ")) return true;
  return false;
}

export function validateLanding(closer: string): LandingValidation {
  const s = (closer || "").trim();
  if (!s) return { ok: true, reason: "empty" };
  if (isBrokenCloser(s)) return { ok: false, reason: "REJECTED:malformed_topic_staple" };
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
    if (!validateLanding(closer).ok || isBrokenCloser(closer) || closer.endsWith("?")) {
      out = paras.slice(0, -1).join("\n\n").trim();
    }
  }

  if (out.endsWith("?") || isBrokenCloser(out.split(/(?<=[.!?])\s+/).pop() || "")) {
    const sentences = out.split(/(?<=[.!?])\s+/);
    if (sentences.length >= 2) {
      const final = sentences[sentences.length - 1] || "";
      if (!validateLanding(final).ok || isBrokenCloser(final) || final.endsWith("?")) {
        out = sentences.slice(0, -1).join(" ").trim();
      }
    }
  }

  if (/seen it named/i.test(out)) {
    out = out
      .split(/(?<=[.!?])\s+/)
      .filter((s) => validateLanding(s).ok && !isBrokenCloser(s))
      .join(" ")
      .trim();
  }

  return out;
}

export function applyRecognitionLanding(
  text: string,
  userMessage: string
): { text: string; modified: boolean; landing: string } {
  const before = (text || "").trim();
  let out = stripTrailingBrokenSentence(before);
  let modified = out !== before;

  const um = (userMessage || "").toLowerCase();
  if (/\b(died|funeral|grief|can't stop crying)\b/.test(um)) {
    return { text: out, modified, landing: "silence" };
  }
  if (/what should i do|what do i say|how should i handle|what now/.test(um)) {
    return { text: out, modified, landing: "action" };
  }

  // Body already finished — stop writing
  if (bodyAlreadyLands(out)) {
    return { text: out, modified, landing: "body_ends_response" };
  }

  const ensured = ensureSignatureLine(out, userMessage, {});
  out = ensured.text;
  modified = modified || ensured.modified;

  if (isBrokenCloser(out.split(/(?<=[.!?])\s+/).pop() || "") || /seen it named/i.test(out)) {
    out = stripTrailingBrokenSentence(out);
    modified = true;
  }

  return {
    text: out,
    modified,
    landing: ensured.landing || "body_ends_response",
  };
}

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
  const count = (s: string) => s.split(/(?<=[.!?])\s+/).filter((x) => x.trim()).length;
  if (count(b) > count(a)) return false;
  if (/seen it named|what about .+ looks different/i.test(afterSurface)) return false;
  return true;
}
