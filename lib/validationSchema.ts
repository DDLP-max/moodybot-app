import { z } from "zod";

// Individual enums for reusability
export const Intensity = z.enum(["feather","casual","firm","heavy"]);
export const Length = z.enum(["1-line","2-3-lines","short-paragraph"]);
export const Relationship = z.enum(["stranger","acquaintance","friend","partner","family","coworker","client","mentor","self"]);
export const Style = z.enum(["MoodyBot","Gentle","Direct","Clinical","Playful","Poetic"]);
export const Mode = z.enum(["positive","negative","mixed"]);
export const FollowupStyle = z.enum(["question","prompt","reflection"]);

// Main validation schema - single source of truth
export const ValidationSchema = z.object({
  message: z.string().min(1),
  relationship: Relationship,
  mode: Mode,
  style: Style,
  intensity: Intensity,
  length: Length,
  include_followup: z.boolean().default(false),
  followup_style: FollowupStyle.optional(),
  tags: z.array(z.string()).default([]),
  system_flavor: z.literal("validation").default("validation"),
  version: z.literal("v1").default("v1"),
}).strict();

export type ValidationPayload = z.infer<typeof ValidationSchema>;

// UI mapping helpers
export const uiToApi = (state: {
  context: string;
  relationship: string;
  mode: string;
  style: string;
  intensity: number[];
  length: string;
  includeFollowup: boolean;
  reasonTags: string[];
}): ValidationPayload => {
  const intensityMap = ['feather','casual','firm','heavy'];
  const lengthMap = { 
    'one_liner': '1-line', 
    'short': '2-3-lines', 
    'paragraph': 'short-paragraph' 
  };
  const styleMap = {
    'moodybot': 'MoodyBot',
    'warm': 'Gentle',
    'blunt': 'Direct',
    'clinical': 'Clinical',
    'playful': 'Playful'
  };

  const payload = {
    message: state.context || "",
    relationship: state.relationship || "friend",
    mode: state.mode || "positive",
    style: styleMap[state.style as keyof typeof styleMap] || "MoodyBot",
    intensity: intensityMap[state.intensity[0] ?? 1] as any,
    length: lengthMap[state.length as keyof typeof lengthMap] || "2-3-lines",
    include_followup: !!state.includeFollowup,
    followup_style: "question" as const,
    tags: Array.isArray(state.reasonTags) ? state.reasonTags : [],
    system_flavor: "validation" as const,
    version: "v1" as const,
  };

  const parsed = ValidationSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Client-side validation failed: ${JSON.stringify(parsed.error.flatten())}`);
  }
  
  return parsed.data; // clean, typed, guaranteed-valid
};
