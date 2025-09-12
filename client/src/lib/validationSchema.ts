import { z } from "zod";

export const ValidationSchema = z.object({
  chips: z.object({
    polarity: z.enum(["positive", "negative", "mixed"]),
    style: z.enum(["warm", "neutral", "tough", "poetic"]),
    length: z.enum(["one_liner", "two_three", "short_paragraph"]),
    intensity: z.enum(["feather", "casual", "firm", "heavy"]),
  }),
  messages: z.object({
    validation: z.string().min(3),
    because: z.string().min(3),
    depth: z.string().min(3),
  })
});

export type ValidationPayload = z.infer<typeof ValidationSchema>;
