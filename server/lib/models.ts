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
