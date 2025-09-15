import path from "path";
import { fileURLToPath } from "url";

// FORCE RECOMPILATION - REMOVED CINEMATIC MODE AND SCENE-SETTING 2025-08-13 10:40:40 AM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from "fs";
import { postProcessMoodyResponse } from "../utils/moodybotPostProcess";
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

// Load system prompt from file
const moodyPrompt = fs.readFileSync(path.resolve("server/system_prompt.txt"), "utf-8");

export async function generateChatResponse(
  userMessage: string,
  mode: string = "savage",
  userId?: number,
  sessionId?: number,
  conversationHistory: ChatCompletionMessageParam[] = [],
  imageData?: string
): Promise<{ aiReply: string; selectedMode: string; isAutoSelected: boolean }> {
  // Get API key from environment variable - REQUIRED for security
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  
  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY environment variable is not set");
    return {
      aiReply: "MoodyBot is not properly configured. Please set the OPENROUTER_API_KEY environment variable.",
      selectedMode: mode,
      isAutoSelected: mode === "savage"
    };
  }
  
  console.log("🔑 Using API key from environment variable:", apiKey.substring(0, 20) + "...");
  console.log("🔑 API key length:", apiKey.length);
  console.log("🔑 API key format check:", apiKey.startsWith("sk-or-v1-") ? "✅ Valid format" : "❌ Invalid format");
  console.log("🔑 API key first/last 4 chars:", apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4));

  const selectedMode = mode === "savage" ? selectModeFromMessage(userMessage) : mode;
  const isAutoSelected = mode === "savage";

  // Use centralized config for consistency

  let enhancedPrompt = moodyPrompt;
  // Removed cinematic mode - keeping responses direct and natural
  enhancedPrompt += `

IMPORTANT: Do NOT add scene-setting text, cinematic descriptions, or italics formatting. 
Respond directly and conversationally without any "*scene description*" or similar formatting.
Keep responses natural, direct, and focused on the user's message.`;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: enhancedPrompt },
    ...conversationHistory.filter(msg => 
      typeof msg.content === 'string' || 
      (Array.isArray(msg.content) && msg.content.every(item => typeof item === 'object' && 'type' in item))
    ),
    { role: "user", content: userMessage }
  ];

 try {

  console.log("Using model:", OPENROUTER_MODEL_DYNAMIC, "for natural conversation");
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
      model: OPENROUTER_MODEL_DYNAMIC,
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
  
  const finalReply = postProcessMoodyResponse(aiRaw);
  console.log("Post-processed response:", finalReply);

  appendToTextLog(
    `Mode: ${selectedMode} (Auto: ${isAutoSelected})\nUser: ${userId ?? "anon"}\nMessage: ${userMessage}${imageData ? ' [with image]' : ''}\nReply: ${finalReply}`
  );

  return {
    aiReply: finalReply,
    selectedMode,
    isAutoSelected
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
      isAutoSelected
    };
  }

  if (error.response?.status === 429) {
    return {
      aiReply: "MoodyBot is getting too many requests. Please try again in a moment.",
      selectedMode,
      isAutoSelected
    };
  }

  if (error.response?.status === 401) {
    return {
      aiReply: "MoodyBot's API key is invalid or expired. Please contact support to fix this issue.",
      selectedMode,
      isAutoSelected
    };
  }

  if (error.response?.status === 400) {
    return {
      aiReply: "MoodyBot received an invalid request. Please try rephrasing your message.",
      selectedMode,
      isAutoSelected
    };
  }

  // Log the specific error for debugging
  console.error("Specific error message:", error.message);
  console.error("Error stack:", error.stack);
  console.error("Full error object:", JSON.stringify(error, null, 2));

  return {
    aiReply: "MoodyBot is in a bad mood. Try again later.",
    selectedMode,
    isAutoSelected
  };
}
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
