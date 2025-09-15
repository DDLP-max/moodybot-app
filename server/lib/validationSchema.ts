import { z } from 'zod';

// Relaxed validation schema to reduce fallbacks
export const ValidationSchema = z.object({
  validation: z.string().min(12).max(400),
  because: z.string().min(5).max(280).optional(),
  followup: z.string().min(5).max(200).optional(),
  tags: z.array(z.string()).max(8).optional()
});

export type ValidationResponse = z.infer<typeof ValidationSchema>;
