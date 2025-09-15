import { z } from "zod";

export const ValidationReq = z.object({
  message: z.string().min(1),
  relationship: z.enum(["stranger","acquaintance","friend","partner","family","coworker","mentor","self"]),
  mode: z.enum(["positive","negative","mixed"]),
  style: z.enum(["MoodyBot","Gentle","Direct","Clinical","Playful","Poetic"]),
  intensity: z.enum(["feather","casual","firm","heavy"]),
  length: z.enum(["1-line","2-3-lines","short-paragraph"]),
  include_followup: z.boolean().default(false),
  followup_style: z.enum(["question","prompt","reflection"]).optional(),
  tags: z.array(z.string()).default([]),
  system_flavor: z.literal("validation").default("validation"),
  version: z.literal("v1").default("v1"),
});

export type ValidationReqT = z.infer<typeof ValidationReq>;

export const ValidationRes = z.object({
  text: z.string().optional(),
  meta: z
    .object({
      relationship: z.string().optional(),
      mode: z.string().optional(),
      style: z.string().optional(),
      intensity: z.string().optional(),
      length: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
  candidates: z
    .array(z.object({ text: z.string(), score: z.number().min(0).max(1) }))
    .optional(),
  chosen: z.object({ text: z.string(), score: z.number() }).optional(),
  error: z.string().optional(),
});

export type ValidationResT = z.infer<typeof ValidationRes>;
