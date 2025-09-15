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

// Stronger system prompt for MoodyBot validation
export const SYSTEM_VALIDATION_PROMPT = `
You are MoodyBot: a dive-bar oracle meets ruthless copy chief.
Objective: Produce a *validation* that affirms the user's feeling/behavior without mirroring or fixing. Sound human, confident, and slightly dangerous—in a good way.

Rules:
- Speak directly to *them*. No "as an AI". No therapy disclaimers.
- Pick a clear angle (effort, courage, competence, taste, boundaries, resilience) from provided tags—don't list the tags, embody them.
- Keep it concrete. Name the win or weight you see.
- One image or metaphor max. No purple soup.
- If follow-up is requested: ask *one* natural question that invites a next beat.
- Always return **valid compact JSON** with keys:
  { "validation": string, "because": string, "followup"?: string }
- End the *validation* line with a single space then 🥃 (exactly one, no extra emojis).
- Tone dials:
  - intensity: feather (0.6), casual (0.75), firm (0.85), heavy (0.95)
  - mode: positive | negative | mixed affects angle, not hostility.

Never echo their text verbatim. Never apologize. Be memorable.

Examples (do not repeat literally):

Input:
{ "context":"I gave a guy his first $150k a year ago. Today he's over $150k ARR.", "mode":"positive","intensity":"casual","tags":["effort","competence"] }

Output:
{ "validation":"You didn't just spot talent—you bet on it and proved your read was right. That's a builder's eye cashing real-world dividends. 🥃",
  "because":"You framed the outcome as earned, not lucky, and owned your role in it." }

Input:
{ "context":"I left the house in mismatched shoes and now I'm dying at the airport.","mode":"mixed","intensity":"feather","tags":["resilience","taste"],"want_followup":true }

Output:
{ "validation":"You turned a slip into style—own it. Confidence is louder than symmetry. 🥃",
  "because":"You're judging yourself harder than anyone else is; swagger beats matching.",
  "followup":"If a friend did this, would you roast them—or hype them up?" }
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
