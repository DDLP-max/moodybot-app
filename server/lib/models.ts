/**
 * Centralized model configuration for MoodyBot
 * Supports environment variable overrides for deployment flexibility
 */

export const MODEL_DYNAMIC = process.env.OPENROUTER_MODEL_DYNAMIC || "x-ai/grok-4";
export const MODEL_VALIDATION = process.env.OPENROUTER_MODEL_VALIDATION || "x-ai/grok-4";

// Helper function to convert intensity to temperature
export function intensityToTemp(intensity: number): number {
  const intensityMap = [0.3, 0.5, 0.7, 0.9];
  return intensityMap[Math.max(0, Math.min(3, intensity))] || 0.7;
}

// Trimmed system prompt for MoodyBot validation (reduced token bloat)
export const SYSTEM_VALIDATION_PROMPT = `
You are MoodyBot: a dive-bar oracle meets ruthless copy chief.
Produce a validation that affirms the user's feeling/behavior without mirroring or fixing. Sound human, confident, and slightly dangerous.

Rules:
- Speak directly to them. No "as an AI". No therapy disclaimers.
- Pick a clear angle from provided tags—don't list them, embody them.
- Keep it concrete. Name the win or weight you see.
- One image or metaphor max.
- If follow-up requested: ask one natural question.
- Use normal punctuation. Limit em dashes to one at most in a response.
- End validation with exactly one space then 🥃.

CRITICAL: Return **only** a minified JSON object with keys:
{"validation": string, "because": string, "followup": string|optional, "tags": string[]}

Do not include prose, code fences, or explanations. If you cannot comply, still return the JSON above.

Never echo their text verbatim. Never apologize. Be memorable.

Examples:

Input: { "context":"I gave a guy his first $150k a year ago. Today he's over $150k ARR.", "mode":"positive","tags":["effort","competence"] }
Output: {"validation":"You didn't just spot talent. You bet on it and proved your read was right. That's a builder's eye cashing real-world dividends. 🥃","because":"You framed the outcome as earned, not lucky, and owned your role in it.","tags":["effort","competence"]}

Input: { "context":"I left the house in mismatched shoes and now I'm dying at the airport.","mode":"mixed","tags":["resilience"],"want_followup":true }
Output: {"validation":"You turned a slip into style. Own it. Confidence is louder than symmetry. 🥃","because":"You're judging yourself harder than anyone else is; swagger beats matching.","followup":"If a friend did this, would you roast them or hype them up?","tags":["resilience"]}
`;

// User prompt builder with proper conditioning
export function buildUserPrompt({ text, relationship, mode, intensity, style, length, tags = [], followup }: any) {
  return JSON.stringify({
    context: truncate(text, 1200),
    relationship,               // "friend", "partner", etc.
    mode,                        // "positive"|"negative"|"mixed"
    intensity,                   // "feather"|"casual"|"firm"|"heavy"
    style,                       // "MoodyBot"
    length,                      // "1-liner"|"2-3 lines"|"short paragraph"
    tags,                        // ["effort","courage",...]
    want_followup: !!followup,
    constraints: {
      max_lines: length === "1-liner" ? 1 : length === "2-3 lines" ? 3 : 6,
      ban_phrases: ["As an AI", "I'm sorry you feel", "validate your feelings"]
    }
  });
}

// Length enforcement function
export function enforceLength(s: string, maxLines: number) {
  const lines = s.split(/\n+/).filter(Boolean).slice(0, maxLines);
  return lines.join("\n");
}

// Utility function to truncate text
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

// JSON repair function for length cutoff cases
export function tryRepairJson(raw: string): string {
  // strip junk before first '{' and after last '}' (or '['/']' for arrays)
  const start = Math.min(
    ...['{', '['].map(ch => raw.indexOf(ch)).filter(i => i >= 0)
  );
  const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
  if (start >= 0 && end > start) raw = raw.slice(start, end + 1);

  // remove trailing commas before } or ]
  raw = raw.replace(/,(\s*[}\]])/g, '$1');

  // balance braces/brackets if cut off
  const need = (s: string, open: string, close: string) => {
    let bal = 0;
    for (const ch of s) {
      if (ch === open) bal++;
      else if (ch === close) bal = Math.max(0, bal - 1);
    }
    return bal;
  };
  const missingCurly = need(raw, '{', '}');
  const missingSquare = need(raw, '[', ']');
  return raw + '}'.repeat(missingCurly) + ']'.repeat(missingSquare);
}

// Safe JSON parsing with repair fallback
export function parseJsonSafe(text: string) {
  try { 
    return JSON.parse(text); 
  } catch {
    try { 
      return JSON.parse(tryRepairJson(text)); 
    } catch { 
      return null; 
    }
  }
}

// Candidate selection and scoring
export type Candidate = { validation: string; because: string; followup?: string; tags?: string[] };

export function pickBestCandidate(candidates: Candidate[]): Candidate {
  return candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a))[0];
}

export function scoreCandidate(c: Candidate): number {
  let s = 0;
  if (c.validation.length >= 70 && c.validation.length <= 240) s += 2; // punchy
  if (/[!?—]/.test(c.validation)) s += 1;                             // voice markers
  if (/you|that|this/.test(c.validation.toLowerCase())) s += 1;       // direct address
  if (c.validation.includes("🥃")) s += 0.5;                           // brand touch
  return s;
}

// Graceful fallback for when all candidates fail
export function getGracefulFallback(reason: string = "no_valid_candidates"): Candidate {
  const fallbacks = {
    no_valid_candidates: {
      validation: "Not flawless JSON, but here's the Moody take: you moved the needle. 🥃",
      because: "Fallback triggered: model hit length cutoff but still gave content."
    },
    json_parse_failed: {
      validation: "Even when the system hiccups, you still showed up—that's the real win. 🥃",
      because: "Fallback triggered: JSON parsing failed but your message got through."
    },
    all_candidates_failed: {
      validation: "Sometimes the best response is just acknowledging you tried. You did. 🥃",
      because: "Fallback triggered: all candidates failed validation."
    }
  };
  
  return fallbacks[reason as keyof typeof fallbacks] || fallbacks.no_valid_candidates;
}
