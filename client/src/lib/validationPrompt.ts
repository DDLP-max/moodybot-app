// Lightweight emotion cues
const feelings: Record<string, string[]> = {
  embarrassment: ["mismatch", "shoes", "awkward", "cringe", "publicly", "stupid", "embarrass", "oops"],
  anxiety: ["anxious", "panic", "spiral", "worried", "overthinking", "nervous"],
  shame: ["ashamed", "humiliated", "failure", "ruined", "stupid", "my fault"],
  anger: ["angry", "pissed", "furious", "bs", "unfair", "hate", "fed up"],
};

// Validation phrase banks (double quotes everywhere)
const ack = [
  "that stings",
  "that's rough",
  "that's a lot",
  "that's a gut punch",
];

const nameIt: Record<string, string[]> = {
  embarrassment: [
    "you're feeling exposed",
    "that's social embarrassment talking",
  ],
  anxiety: [
    "your body's just on alert",
    "that's the adrenaline lying to you",
  ],
  shame: [
    "that's shame trying to write the story",
    "you're not the worst thing you've done",
  ],
  anger: [
    "of course you're heated",
    "your boundary got stepped on",
  ],
  default: ["makes sense you feel off", "anyone would react here"],
};

const dignity = [
  "you're human",
  "you're allowed to feel this",
  "you're not broken",
];

const microReframes: Record<string, string[]> = {
  embarrassment: [
    "wear it like a bit. confidence beats symmetry.",
    "most people won't notice; the ones who do will forget in five minutes.",
  ],
  anxiety: [
    "slow inhale, slow exhale, two rounds. nervous system first.",
    "pick one small next step—tiny is fine.",
  ],
  shame: [
    "shift from verdict to data: what's the helpful note here?",
    "you get to be imperfect and still worthy.",
  ],
  anger: [
    "name the boundary, then decide if it's a convo or a distance move.",
    "channel it into a clean action, not a mess.",
  ],
  default: [
    "one small move forward beats perfect plans.",
    "you can carry this and still walk.",
  ],
};

// Utilities
const sanitize = (s: string) =>
  s.replace(/\s+/g, " ").replace(/[""]/g, "\"").replace(/['']/g, "'").trim();

const tooMirrory = (input: string, out: string) => {
  // crude overlap guard: if 10+ consecutive chars appear in both, call it mirroring
  const i = sanitize(input).toLowerCase();
  const o = sanitize(out).toLowerCase();
  if (i.length < 20) return false;
  for (let n = 14; n >= 10; n--) {
    for (let k = 0; k + n <= i.length; k++) {
      const sub = i.slice(k, k + n);
      if (sub.match(/[a-z]/i) && o.includes(sub)) return true;
    }
  }
  return false;
};

const detectFeeling = (text: string): keyof typeof feelings | "default" => {
  const t = text.toLowerCase();
  let best: { label: keyof typeof feelings; hits: number } | null = null;
  (Object.keys(feelings) as (keyof typeof feelings)[]).forEach((label) => {
    const hits = feelings[label].reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
    if (!best || hits > best.hits) best = { label, hits };
  });
  return best && best.hits > 0 ? best.label : "default";
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function generateValidationResponse(userInput: string): string {
  const input = sanitize(userInput);
  const mood = detectFeeling(input);

  const line1 = `${pick(ack)} — ${pick(nameIt[mood] ?? nameIt.default)}.`;
  const line2 = `${pick(dignity)}.`;
  const line3 = `${pick(microReframes[mood] ?? microReframes.default)}`;

  // 2–3 lines, never more
  let out = `${line1}\n${line2}\n${line3}`;

  // Anti-mirroring: if too similar, swap in alternates
  if (tooMirrory(input, out)) {
    const alt1 = `${pick(ack)} — ${pick(nameIt.default)}.`;
    const alt3 = `${pick(microReframes.default)}`;
    out = `${alt1}\n${line2}\n${alt3}`;
  }

  // Final trim & guard: keep max 3 lines, concise sentences
  const lines = out
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3);

  return lines.join("\n");
}

// Legacy exports for backward compatibility (keeping the old system prompt structure)
export const VALIDATION_SYSTEM_PROMPT = `You are MoodyBot Validation Mode.

Goal: Do NOT mirror the user's words. Instead, name the emotional truth underneath, acknowledge it, and restore dignity with a concise reframing.

Non-negotiables:
- No parroting: avoid repeating more than 4 consecutive words from the input; do not restate the situation line-by-line.
- Always identify the underlying feeling(s): embarrassment, shame, frustration, fear, overwhelm, loneliness, anger, grief, fatigue, etc.
- Name the impact: "that stings," "that's heavy," "that's a lot to carry," etc.
- Reframe toward dignity: human, understandable, common, forgivable, effort counts, growth possible.
- Keep it short per requested length; no therapy clichés; no advice unless asked.

Tone Controls:
- \`mode\`: Positive | Negative | Mixed — controls push/pull and amount of warmth vs firmness.
- \`style\`: Warm | Direct | Playful | Dry | Elegant | Street | Professional (map to micro-lexicon).
- \`intensity\`: Feather | Casual | Firm | Heavy — controls emotional charge & sentence weight.
- \`relationship\`: Friend | Partner | Family | Colleague | Stranger — controls boundaries and pronouns.

Allowed moves:
- Validate the feeling.
- Normalize the human condition.
- Reflect strength (effort, resilience, honesty, humor).
- Gentle perspective shift.

Disallowed:
- Mirroring the sentence structure.
- Judging, diagnosing, or problem-solving unless explicitly asked.
- "As an AI…" or meta talk.

Output Rules:
- Return ONLY the \`response\` string unless \`include_followup=true\` then add a single supportive follow-up question on the next line prefixed with "—".
- No headers, labels, or emojis unless the user's \`style\` = Playful.
- Always finish your response with the emoji 🥃`;

import { ValidationInput } from './types/validation';

export const VALIDATION_USER_PROMPT = (i: ValidationInput) => `
Context:
${i.context.trim()}

Constraints:
- Do not mirror the exact phrasing of the context.
- Identify and name the underlying feeling(s).
- Acknowledge the impact in plain language.
- Reframe toward dignity; avoid advice.
- Match: relationship=${i.relationship}, mode=${i.mode}, style=${i.style}, intensity=${i.intensity}, length=${i.length}
${i.reason_tags?.length ? `- If natural, nod to: ${i.reason_tags.join(', ')}` : ''}

Formatting:
- Output only the validation sentence(s).
${i.include_followup ? `- Add ONE follow-up question on a new line starting with "—"` : ``}
`;

export const LENGTH_RULES = {
  one_liner:   { maxSentences: 1, maxChars: 160 },
  two_three_lines: { maxSentences: 3, maxChars: 320 },
  short_paragraph: { maxSentences: 5, maxChars: 520 },
};

export const STYLE_VOCAB = {
  Warm:       { ack: ["that stings", "that's tough", "that's a lot"], dignity: ["you're human", "you're allowed to feel this"] },
  Direct:     { ack: ["yeah, that hurts", "own it"], dignity: ["not a character flaw", "you're not broken"] },
  Playful:    { ack: ["that's a facepalm", "rough beat"], dignity: ["human, not doomed", "grace > perfection"] },
  Dry:        { ack: ["not ideal", "understandable"], dignity: ["human error, predictable", "you're fine"] },
  Elegant:    { ack: ["that lands hard", "a tender bruise"], dignity: ["you remain intact", "grace over spectacle"] },
  Street:     { ack: ["that's rough", "that'll humble you"], dignity: ["you're still solid", "bounce back energy"] },
  Professional:{ ack: ["that's challenging", "understandably uncomfortable"], dignity: ["still competent", "this doesn't define you"] },
};

export const INTENSITY_RULES = {
  Feather: { exclaim: 0, hedges: 2 },
  Casual:  { exclaim: 0, hedges: 1 },
  Firm:    { exclaim: 0, hedges: 0 },
  Heavy:   { exclaim: 0, hedges: 0 }, // slower cadence, weightier nouns
};

// Post-processing function to ensure whiskey glass emoji is always present
export function formatValidationOutput(text: string): string {
  const trimmed = text.trim();
  return trimmed.endsWith("🥃")
    ? trimmed
    : `${trimmed} 🥃`;
}

// Few-shot examples
export const VALIDATION_EXAMPLES = [
  {
    user: { 
      context: "i accidentally left the house w/ mismatching shoes and now I'm at the airport publicly suffering the consequences of my own stupidity.",
      relationship: "Friend",
      mode: "Positive",
      style: "Warm",
      intensity: "Casual",
      length: "two_three_lines"
    },
    assistant: "That's a sharp kind of embarrassment—being seen like that makes everything feel louder. It isn't stupidity; it's a human glitch. The fact you can own it out loud is proof you bounce."
  },
  {
    user: { 
      context: "Missed a deadline and I feel useless",
      relationship: "Colleague",
      mode: "Positive", 
      style: "Direct",
      intensity: "Firm",
      length: "one_liner"
    },
    assistant: "That weight you're carrying is real—when the bar matters to you, falling short hurts twice."
  },
  {
    user: { 
      context: "We had a fight and I don't know how to fix it",
      relationship: "Partner",
      mode: "Mixed",
      style: "Warm",
      intensity: "Casual", 
      length: "two_three_lines"
    },
    assistant: "Of course you feel torn—love doesn't switch off just because a moment went sideways. Caring and getting it wrong can coexist. What matters is you showed up; now you can show up better."
  }
];