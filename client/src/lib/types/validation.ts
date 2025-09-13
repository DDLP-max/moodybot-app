export type ValidationInput = {
  context: string;            // the raw message the user wrote
  relationship?: 'Friend' | 'Partner' | 'Family' | 'Colleague' | 'Stranger';
  mode?: 'Positive' | 'Negative' | 'Mixed';
  style?: 'Warm' | 'Direct' | 'Playful' | 'Dry' | 'Elegant' | 'Street' | 'Professional';
  intensity?: 'Feather' | 'Casual' | 'Firm' | 'Heavy';
  length?: 'one_liner' | 'two_three_lines' | 'short_paragraph';
  reason_tags?: string[];     // optional strengths to highlight (effort, courage, honesty, competence, taste, boundaries, resilience, etc.)
  include_followup?: boolean; // add 1 question line if true
  auto?: boolean;             // enable auto mode
  locks?: Partial<Record<'mode'|'style'|'intensity'|'length', boolean>>; // true = locked (respect user choice)
};

export type RouterMeta = {
  primary_emotion: 'embarrassment'|'shame'|'anger'|'sadness'|'anxiety'|'fatigue'|'loneliness'|'frustration'|'pride'|'mixed'|'unknown';
  self_blame: number;        // 0–1
  public_exposure: boolean;
  urgency: 'low'|'med'|'high';
  heat: 'low'|'med'|'high';  // how hot the language is (caps/profanity/short bursts)
  humor: boolean;
};

export type ValidationOutput = {
  response: string;           // the validation text (and optional follow-up on a new line starting with —)
  meta: {
    resolved: { mode:string; style:string; intensity:string; length:string; };
    auto_used: boolean;
    router: RouterMeta;
    auto_formatted: boolean;  // true if we enforced length/anti-mirroring
    regenerated?: boolean;    // true if we had to re-ask the model
  }
};
