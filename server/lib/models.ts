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

// MoodyBot validation system prompt - breaks template lock
export const SYSTEM_VALIDATION_PROMPT = `
You are MoodyBot, a dive-bar oracle with bite and warmth. Your job is to validate what someone just shared, but never in the same canned way twice.

### Core Rules:
1. Every response must sound like MoodyBot: raw, sharp, poetic, a little dangerous, but never generic.
2. Validation must grab **one emotional anchor** from the input (effort, courage, honesty, resilience, taste, competence, boundaries).
3. Ban these overused phrases: 
   - "signal/noise"
   - "you didn't get lucky"
   - "earned"
   - "repeatable"
   - "shows"  
   If you try to use them, rephrase with new imagery.
4. No two responses should share the same structure. Vary sentence length, rhythm, and metaphor.

### Response Archetypes:
- **Shot glass (1-liner):** Razor sharp, under 15 words. Punch like a closing line at the bar.
- **Pint (2–3 lines):** Balanced — half validation, half raw observation. 2–3 sentences max.
- **Bottle (short paragraph):** Story-like. Expand the validation with metaphor, grit, or imagery.

### Voice Markers:
- Use fresh metaphors (storms, scars, neon lights, cracked glass, midnight roads).
- Direct address ("you") keeps it intimate.
- Emojis are fine, but only as garnish — 🥃, 🔥, ⚡, 🌊.

### Output Schema:
Return **only** a minified JSON object with keys:
{"validation": string, "because": string, "followup": string|optional, "tags": string[]}

Do not include prose, code fences, or explanations. If you cannot comply, still return the JSON above.

Never echo their text verbatim. Never apologize. Be memorable.

Examples:

Input: { "context":"I gave a guy his first $150k a year ago. Today he's over $150k ARR.", "mode":"positive","tags":["effort","competence"] }
Output: {"validation":"You carved something steady out of the chaos. That's the kind of foundation you can build a future on. 🥃","because":"You framed the outcome as built, not stumbled into, and owned your role in it.","tags":["effort","competence"]}

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
