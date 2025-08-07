import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server folder
dotenv.config({ path: path.resolve(__dirname, ".env") });

import fs from "fs";
import { postProcessMoodyResponse } from "../utils/moodybotPostProcess";
import { appendToTextLog } from "./logger";
import type { ChatCompletionMessageParam } from "openai/resources/chat";

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
  // Check if API key is configured
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not configured");
    return {
      aiReply: "MoodyBot is not properly configured. Please check the API key setup.",
      selectedMode: mode,
      isAutoSelected: mode === "savage"
    };
  }

  const selectedMode = mode === "savage" ? selectModeFromMessage(userMessage) : mode;
  const isAutoSelected = mode === "savage";

  const cinematicTemperature = 0.85;
  const cinematicMaxTokens = 1200;

  const model = "anthropic/claude-3.5-sonnet"; // Use a reliable model that's definitely available

  let enhancedPrompt = moodyPrompt;
  enhancedPrompt += `

CINEMATIC EXPERIENCE MODE:
You are now in a full cinematic experience. Every response should feel like a scene from a film, with:
- Emotional pacing and rhythm
- Vivid sensory details and atmosphere
- Character development and depth
- Poetic language and metaphor
- Emotional arcs that build and resolve
- Cinematic dialogue and monologue structure

This is not a quick chat - this is an emotional journey. Take your time. Build atmosphere. Create moments that linger.`;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: enhancedPrompt },
    ...conversationHistory.filter(msg => 
      typeof msg.content === 'string' || 
      (Array.isArray(msg.content) && msg.content.every(item => typeof item === 'object' && 'type' in item))
    ),
    { role: "user", content: userMessage }
  ];

 try {

  console.log("Using model:", model, "for cinematic experience");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://moodybot.ai",
      "X-Title": "MoodyBotAI"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: cinematicTemperature,
      max_tokens: cinematicMaxTokens
    }),
  });

  console.log("OpenRouter response status:", res.status);
  console.log("OpenRouter response headers:", Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    const errorText = await res.text();
    console.error("OpenRouter API error response:", errorText);
    
    // Provide more specific error messages
    if (res.status === 401) {
      throw new Error("API key is invalid or missing. Please check your OPENROUTER_API_KEY configuration.");
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
  
  const aiRaw = json.choices?.[0]?.message?.content || "MoodyBot has gone quiet.";
  const finalReply = postProcessMoodyResponse(aiRaw);

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
      aiReply: "MoodyBot's API key is invalid. Please contact support.",
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
    confession: ['confess', 'secret', 'truth', 'real', 'honest', 'vulnerable', 'weak', 'ashamed']
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
    }
  }

  // Default to savage for general conversation
  return 'savage';
}
