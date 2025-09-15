/**
 * Centralized configuration for MoodyBot
 * Prevents model name mismatches between different routes
 */

// OpenRouter model configurations
export const OPENROUTER_MODEL_DYNAMIC = "x-ai/grok-4";
export const OPENROUTER_MODEL_VALIDATION = "x-ai/grok-4";

// API configuration
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_HTTP_REFERER = "https://app.moodybot.ai";
export const OPENROUTER_X_TITLE = "MoodyBot";

// Default model parameters
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 256;
export const DYNAMIC_MAX_TOKENS = 1200;
export const DYNAMIC_TEMPERATURE = 0.85;
