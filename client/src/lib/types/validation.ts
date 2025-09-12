export type ValidationInput = {
  context: string;            // the raw message the user wrote
  relationship: 'Friend' | 'Partner' | 'Family' | 'Colleague' | 'Stranger';
  mode: 'Positive' | 'Negative' | 'Mixed';
  style: 'Warm' | 'Direct' | 'Playful' | 'Dry' | 'Elegant' | 'Street' | 'Professional';
  intensity: 'Feather' | 'Casual' | 'Firm' | 'Heavy';
  length: 'one_liner' | 'two_three_lines' | 'short_paragraph';
  reason_tags?: string[];     // optional strengths to highlight (effort, courage, honesty, competence, taste, boundaries, resilience, etc.)
  include_followup?: boolean; // add 1 question line if true
};

export type ValidationOutput = {
  response: string;           // the validation text (and optional follow-up on a new line starting with —)
  meta: {
    style: string;
    mode: string;
    intensity: string;
    length: string;
    auto_formatted: boolean;  // true if we enforced length/anti-mirroring
    regenerated?: boolean;    // true if we had to re-ask the model
  }
};
