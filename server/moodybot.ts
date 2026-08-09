import path from "path";
import { fileURLToPath } from "url";

// FORCE RECOMPILATION - REMOVED CINEMATIC MODE AND SCENE-SETTING 2025-08-13 10:40:40 AM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from "fs";
import {
  CORE_WRITE_DIRECTIVE,
  LANDING_ENGINE_VERSION,
  lastSentence,
  postProcessMoodyResponse,
} from "../utils/moodybotPostProcess";
import {
  classifyClaimDomain,
  domainMechanismGuidance,
  selectInterpretiveLens,
} from "../utils/claimDomain";
import { appendToTextLog } from "./logger";
import type { ChatCompletionMessageParam } from "openai/resources/chat";
import { 
  OPENROUTER_MODEL_DYNAMIC, 
  OPENROUTER_API_URL, 
  OPENROUTER_HTTP_REFERER, 
  OPENROUTER_X_TITLE,
  DYNAMIC_TEMPERATURE,
  DYNAMIC_MAX_TOKENS
} from "./config";
import { MODEL_DYNAMIC } from "./lib/models";
import { getStructurePrompt } from "./structurePrompts";
import { createHash } from "crypto";
import { execSync } from "child_process";

const PROMPT_PATH = path.resolve("server/system_prompt.txt");
let cachedPrompt = "";
let cachedPromptMtime = 0;

function promptContentHash(text: string): string {
  return createHash("sha256").update(text || "").digest("hex").slice(0, 16);
}

function gitCommitShort(): string {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return process.env.RENDER_GIT_COMMIT?.slice(0, 7) || process.env.GIT_COMMIT?.slice(0, 7) || "";
  }
}

/** Always use the latest system_prompt.txt (reloads when the file changes). */
function loadMoodyPrompt(): string {
  try {
    const mtime = fs.statSync(PROMPT_PATH).mtimeMs;
    if (!cachedPrompt || mtime !== cachedPromptMtime) {
      cachedPrompt = fs.readFileSync(PROMPT_PATH, "utf-8");
      cachedPromptMtime = mtime;
      console.log(`✅ Loaded system_prompt.txt (${cachedPrompt.length} chars)`);
    }
    return cachedPrompt;
  } catch (err) {
    console.error("❌ Failed to load system_prompt.txt:", err);
    return cachedPrompt || "You are MoodyBot. Respond with brutal honesty and emotional depth.";
  }
}

export type ChatGenerationResult = {
  aiReply: string;
  selectedMode: string;
  isAutoSelected: boolean;
  landingEngineVersion: string;
  diagnostics?: Record<string, string>;
};

export async function generateChatResponse(
  userMessage: string,
  mode: string = "savage",
  userId?: number,
  sessionId?: number,
  conversationHistory: ChatCompletionMessageParam[] = [],
  imageData?: string
): Promise<ChatGenerationResult> {
  // Dynamic Mode (and legacy "savage") auto-select tone from message content
  const shouldAutoSelect = mode === "dynamic" || mode === "savage" || !mode;
  const selectedMode = shouldAutoSelect ? selectModeFromMessage(userMessage) : normalizeModeName(mode);
  const isAutoSelected = shouldAutoSelect;
  const activeMode = shouldAutoSelect ? "dynamic" : selectedMode;

  // Get API key from environment variable - REQUIRED for security
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  const looksLikePlaceholder = !apiKey || /^(not\s*set|undefined|null|your[_-]?api[_-]?key|changeme)$/i.test(apiKey);
  
  if (looksLikePlaceholder || !apiKey.startsWith("sk-or-")) {
    console.error("❌ OPENROUTER_API_KEY is missing or invalid (got length:", apiKey.length, ")");
    return {
      aiReply: "MoodyBot is not properly configured. Set a valid OPENROUTER_API_KEY (sk-or-...) in your environment.",
      selectedMode,
      isAutoSelected,
      landingEngineVersion: LANDING_ENGINE_VERSION,
    };
  }
  
  console.log("🔑 Using API key from environment variable:", apiKey.substring(0, 20) + "...");
  console.log("🔑 API key length:", apiKey.length);
  console.log("🔑 API key format check:", apiKey.startsWith("sk-or-v1-") ? "✅ Valid format" : "❌ Invalid format");
  console.log("🔑 API key first/last 4 chars:", apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4));

  const moodyPrompt = loadMoodyPrompt();

  // Identity preamble + full prompt (same source as Replit system_prompt.txt)
  const enhancedPrompt = `You are MoodyBot — raw, sharp, emotionally intelligent, zero fluff.

${moodyPrompt}

IMPORTANT: Do NOT add scene-setting text, cinematic descriptions, or italics formatting like "*scene description*".
Respond directly as MoodyBot in natural prose (not JSON), focused on the user's message.`;

  // Slash-command structure only when user/auto-selected a specific tone —
  // never force "poetic closure" / emotional-arc costume on plain Dynamic.
  const structurePrompt = shouldAutoSelect ? undefined : getStructurePrompt(selectedMode);
  const claimDomain = classifyClaimDomain(userMessage);
  const lensBundle = selectInterpretiveLens(claimDomain);
  const mechanismFit = domainMechanismGuidance(
    claimDomain,
    lensBundle.lens,
    lensBundle.primary
  );
  const modeDirective = [
    `mode = "${activeMode}"`,
    `claim_domain = "${claimDomain}"`,
    `interpretive_lens = "${lensBundle.lens}"`,
    `primary_capability = "${lensBundle.primary}"`,
    `preferred_structure = "${lensBundle.preferred_structure}"`,
    `mechanism_hint = "${lensBundle.mechanism_hint}"`,
    shouldAutoSelect ? `emotional_calibration = "${selectedMode}"` : null,
    shouldAutoSelect
      ? `Instructions: Dynamic Mode — four layers: Identity (interpretive lens) → Intelligence (broad capability) → Writing (SNAP/KNIFE/STORY) → Editing (Gold only). Food → Bourdain + Everyday Preference Analysis (not Power analysis). Gold never picks the lens. Identify ONE governing pattern, prove only that thesis. THINK abstractly; SPEAK concretely. Do not expose lens names. Stop when it lands. Tone may lean ${selectedMode} naturally; no poetic closer.`
      : `Instructions: Respond in ${selectedMode} mode. Interpretive lens → capability → mechanism → ordinary language → prove that thesis only. Stop when it lands.`,
    mechanismFit,
    `Output: Plain conversational text only. No JSON. No code fences. No mandatory Signature Line, callback, or CTA. No consultant/engine jargon in prose. Never name the lens.`
  ].filter(Boolean).join("\n");

  const messages: ChatCompletionMessageParam[] = [];
  messages.push({ role: "system", content: CORE_WRITE_DIRECTIVE });
  if (structurePrompt) {
    messages.push({ role: "system", content: structurePrompt });
  }
  messages.push(
    { role: "system", content: enhancedPrompt },
    { role: "system", content: modeDirective },
    ...conversationHistory.filter(msg => 
      typeof msg.content === 'string' || 
      (Array.isArray(msg.content) && msg.content.every(item => typeof item === 'object' && 'type' in item))
    ),
    { role: "user", content: userMessage }
  );

 try {

  console.log("Using model:", MODEL_DYNAMIC, "for natural conversation", { activeMode, selectedMode, isAutoSelected });
  console.log("🔑 Sending request with API key:", apiKey.substring(0, 20) + "...");

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": OPENROUTER_HTTP_REFERER,   // recommended by OpenRouter
      "X-Title": OPENROUTER_X_TITLE              // optional, nice to have
    },
    body: JSON.stringify({
      model: MODEL_DYNAMIC,
      messages,
      temperature: DYNAMIC_TEMPERATURE,
      max_tokens: DYNAMIC_MAX_TOKENS
    }),
  });

  console.log("OpenRouter response status:", res.status);
  console.log("OpenRouter response headers:", Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    const errorText = await res.text();
    console.error("OpenRouter API error response:", errorText);
    console.error("Response status:", res.status);
    console.error("Response headers:", Object.fromEntries(res.headers.entries()));
    
    // Provide more specific error messages
    if (res.status === 401) {
      console.error("❌ API key authentication failed. Please check your OpenRouter API key.");
      console.error("This usually means the key is expired, cancelled, or invalid.");
      throw new Error("API key is invalid or expired. Please check your OpenRouter API key configuration.");
    } else if (res.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    } else if (res.status === 400) {
      throw new Error("Invalid request format. Please check your message content.");
    } else {
      throw new Error(`OpenRouter API error: ${res.status} - ${errorText}`);
    }
  }

  const json = await res.json();
  console.log("OpenRouter response data:", json);
  
  if (!json.choices || !json.choices[0] || !json.choices[0].message) {
    console.error("❌ Invalid OpenRouter response structure:", json);
    throw new Error("Invalid response structure from OpenRouter API");
  }
  
  const aiRaw = json.choices[0].message.content;
  console.log("Raw AI response:", aiRaw);
  
  if (!aiRaw || aiRaw.trim().length === 0) {
    console.error("❌ Empty AI response from OpenRouter");
    throw new Error("Empty response from AI model");
  }

  const promptHash = promptContentHash(moodyPrompt);
  const commit = gitCommitShort();
  const draftLast = lastSentence(aiRaw);

  const processed = postProcessMoodyResponse(aiRaw, userMessage, {
    mode: activeMode,
    appendRandomCta: false,
  });
  const finalReply = processed.text;
  const finalLast = lastSentence(finalReply);

  // Temporary production path trace — one structured block per Dynamic request
  console.log("DYNAMIC_TRACE_START");
  console.log(
    JSON.stringify({
      git_commit: commit,
      prompt_hash: promptHash,
      route: "POST /api/chat/messages",
      generation_function: "generateChatResponse",
      landing_engine_version: LANDING_ENGINE_VERSION,
      landing: processed.landing,
      governing_pattern: processed.governingPattern,
      core_insight: processed.governingPattern, // deprecated alias
      gold_shape: processed.goldShape || null,
      body_generated: draftLast,
      post_finalizer_changed_text: String(processed.postFinalizerChangedText),
      post_finalizer_reason: processed.postFinalizerReason,
      landing_added: String(processed.landingAdded),
      cta_removed: String(processed.ctaRemoved),
      draft_last_sentence: draftLast,
      after_landing_last_sentence: processed.afterLandingLastSentence,
      after_surface_render_last_sentence: processed.afterSurfaceLastSentence,
      final_http_last_sentence: finalLast,
      landing_modified: String(processed.landingModified),
    })
  );
  console.log("DYNAMIC_TRACE_END");

  console.log("Post-processed response:", finalReply);
  console.log("landing_engine_version=", LANDING_ENGINE_VERSION);

  appendToTextLog(
    `Mode: ${selectedMode} (Auto: ${isAutoSelected})\nUser: ${userId ?? "anon"}\nMessage: ${userMessage}${imageData ? ' [with image]' : ''}\nReply: ${finalReply}\nlanding_engine_version=${LANDING_ENGINE_VERSION}`
  );

  return {
    aiReply: finalReply,
    selectedMode,
    isAutoSelected,
    landingEngineVersion: LANDING_ENGINE_VERSION,
    diagnostics: {
      git_commit: commit,
      prompt_hash: promptHash,
      landing_engine_version: LANDING_ENGINE_VERSION,
      landing: processed.landing,
    },
  };
} catch (error: any) {
  console.error("OpenRouter API error:", error);
  console.error("Error details:", {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    hasImage: !!imageData
  });

  // Check if it's a network error
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return {
      aiReply: "MoodyBot is having connection issues. Please check your internet and try again.",
      selectedMode,
      isAutoSelected,
      landingEngineVersion: LANDING_ENGINE_VERSION,
    };
  }

  // Auth / config errors should surface clearly (fetch throws plain Errors, not axios-style)
  if (
    error.message?.includes("API key") ||
    error.message?.includes("invalid or expired") ||
    error.response?.status === 401
  ) {
    return {
      aiReply: "MoodyBot's API key is invalid or expired. Please check OPENROUTER_API_KEY and try again.",
      selectedMode,
      isAutoSelected,
      landingEngineVersion: LANDING_ENGINE_VERSION,
    };
  }

  if (error.response?.status === 400 || error.message?.includes("Invalid request")) {
    return {
      aiReply: "MoodyBot received an invalid request. Please try rephrasing your message.",
      selectedMode,
      isAutoSelected,
      landingEngineVersion: LANDING_ENGINE_VERSION,
    };
  }

  if (error.response?.status === 429 || error.message?.includes("Rate limit")) {
    return {
      aiReply: "MoodyBot is getting too many requests. Please try again in a moment.",
      selectedMode,
      isAutoSelected,
      landingEngineVersion: LANDING_ENGINE_VERSION,
    };
  }

  // Log the specific error for debugging
  console.error("Specific error message:", error.message);
  console.error("Error stack:", error.stack);
  console.error("Full error object:", JSON.stringify(error, null, 2));

  return {
    aiReply: `MoodyBot hit an error: ${error.message || "unknown failure"}. Try again in a moment.`,
    selectedMode,
    isAutoSelected,
    landingEngineVersion: LANDING_ENGINE_VERSION,
  };
}
}

/** Normalize client persona labels ("Bob Ross", "Dale/YOLO") into server mode keys */
function normalizeModeName(mode: string): string {
  const key = mode.trim().toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-");
  const aliases: Record<string, string> = {
    "dale-yolo": "dale-yolo",
    "bob-ross": "bob-ross",
    "validate": "validate",
    "validation": "validate",
  };
  return aliases[key] || key;
}

// Intelligent mode selection based on message content
function selectModeFromMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Check for explicit commands first
  if (lowerMessage.includes('/savage')) return 'savage';
  if (lowerMessage.includes('/roast')) return 'roast';
  if (lowerMessage.includes('/cut')) return 'cut';
  if (lowerMessage.includes('/bomb')) return 'bomb';
  if (lowerMessage.includes('/cia')) return 'cia';
  if (lowerMessage.includes('/velvet')) return 'velvet';
  if (lowerMessage.includes('/validate')) return 'validate';
  if (lowerMessage.includes('/mirror')) return 'mirror';
  if (lowerMessage.includes('/float')) return 'float';
  if (lowerMessage.includes('/noir')) return 'noir';
  if (lowerMessage.includes('/clinical')) return 'clinical';
  if (lowerMessage.includes('/discuss')) return 'discuss';
  if (lowerMessage.includes('/thoughts')) return 'thoughts';
  if (lowerMessage.includes('/mentor')) return 'mentor';
  if (lowerMessage.includes('/ex')) return 'ex';
  if (lowerMessage.includes('/godfather')) return 'godfather';
  if (lowerMessage.includes('/agent')) return 'agent';
  if (lowerMessage.includes('/hobo')) return 'hobo';
  if (lowerMessage.includes('/rollins')) return 'rollins';
  if (lowerMessage.includes('/munger')) return 'munger';
  if (lowerMessage.includes('/contrast')) return 'contrast';
  if (lowerMessage.includes('/audit')) return 'audit';
  if (lowerMessage.includes('/intervene')) return 'intervene';
  if (lowerMessage.includes('/rate')) return 'rate';
  if (lowerMessage.includes('/villain')) return 'villain';
  if (lowerMessage.includes('/triangulate')) return 'triangulate';
  if (lowerMessage.includes('/drama')) return 'drama';
  if (lowerMessage.includes('/iron')) return 'iron';
  if (lowerMessage.includes('/sadness')) return 'sadness';
  if (lowerMessage.includes('/cbt') || lowerMessage.includes('/spiral')) return 'cbt';
  if (lowerMessage.includes('/dark')) return 'dark';
  if (lowerMessage.includes('/moodyfy')) return 'moodyfy';
  if (lowerMessage.includes('/dale-yolo')) return 'dale-yolo';
  if (lowerMessage.includes('/copywriter')) return 'copywriter';

  // Emotional state detection for automatic mode selection
  const emotionalKeywords = {
    // Grief, loss, sadness
    grief: ['dead', 'died', 'loss', 'gone', 'miss', 'sad', 'crying', 'tears', 'funeral', 'buried'],
    // Anger, frustration, rage
    rage: ['angry', 'furious', 'hate', 'rage', 'pissed', 'fuck', 'damn', 'screw', 'kill', 'destroy'],
    // Anxiety, fear, worry
    anxiety: ['anxious', 'worried', 'scared', 'afraid', 'panic', 'stress', 'nervous', 'fear'],
    // Depression, hopelessness
    depression: ['depressed', 'hopeless', 'worthless', 'useless', 'tired', 'exhausted', 'empty', 'numb'],
    // Confusion, uncertainty
    confusion: ['confused', 'unsure', 'uncertain', 'doubt', 'question', 'why', 'how', 'what'],
    // Ego, superiority, flex
    ego: ['best', 'smartest', 'better', 'superior', 'genius', 'perfect', 'amazing', 'incredible'],
    // Self-doubt, insecurity
    insecurity: ['ugly', 'stupid', 'dumb', 'worthless', 'failure', 'loser', 'nobody', 'nothing'],
    // Heartbreak, relationship issues
    heartbreak: ['breakup', 'divorce', 'cheated', 'lied', 'betrayed', 'left', 'abandoned', 'love'],
    // Spiral, overthinking
    spiral: ['overthinking', 'spiral', 'loop', 'stuck', 'trapped', 'can\'t stop', 'obsessed'],
    // Confession, vulnerability
    confession: ['confess', 'secret', 'truth', 'real', 'honest', 'vulnerable', 'weak', 'ashamed'],
    // Copywriting, business, marketing
    copywriting: ['business', 'marketing', 'ad', 'advertisement', 'copy', 'copywriting', 'title', 'headline', 'hook', 'cta', 'call to action', 'sales', 'product', 'service', 'brand', 'company', 'startup', 'entrepreneur', 'sell', 'conversion', 'revenue', 'profit', 'customer', 'audience', 'target market', 'campaign', 'promotion', 'offer', 'deal', 'discount', 'launch', 'launching', 'website', 'landing page', 'email', 'social media', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'x']
  };

  // Count emotional signals
  const emotionalScores: { [key: string]: number } = {};
  
  for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
    emotionalScores[emotion] = keywords.reduce((score, keyword) => {
      return score + (lowerMessage.includes(keyword) ? 1 : 0);
    }, 0);
  }

  // Find the strongest emotional signal
  const strongestEmotion = Object.entries(emotionalScores)
    .filter(([_, score]) => score > 0)
    .sort(([_, a], [__, b]) => b - a)[0];

  // Map emotions to appropriate modes
  if (strongestEmotion) {
    const [emotion, score] = strongestEmotion;
    
    switch (emotion) {
      case 'grief':
        return score > 2 ? 'noir' : 'velvet';
      case 'rage':
        return score > 2 ? 'savage' : 'roast';
      case 'anxiety':
        return 'validate';
      case 'depression':
        return 'float';
      case 'confusion':
        return 'clinical';
      case 'ego':
        return 'roast';
      case 'insecurity':
        return 'velvet';
      case 'heartbreak':
        return 'noir';
      case 'spiral':
        return 'cbt';
      case 'confession':
        return 'mirror';
      case 'copywriting':
        return 'copywriter';
    }
  }

  // Default to savage for general conversation
  return 'savage';
}
