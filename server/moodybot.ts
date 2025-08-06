import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server folder
dotenv.config({ path: path.resolve(__dirname, ".env") });

import { OpenAI } from "openai";
import fs from "fs";
import { postProcessMoodyResponse } from "../utils/moodybotPostProcess";
import { appendToTextLog } from "./logger";
import type { ChatCompletionMessageParam } from "openai/resources/chat";

// Load system prompt from file
const moodyPrompt = fs.readFileSync(path.resolve("server/system_prompt.txt"), "utf-8");

// Fallback for key compatibility
if (!process.env.OPENAI_API_KEY && process.env.OPENROUTER_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENROUTER_API_KEY;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
  defaultHeaders: process.env.OPENROUTER_API_KEY ? {
    "HTTP-Referer": "https://moodybot.ai",
    "X-Title": "MoodyBotAI",
  } : undefined,
});

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

// Main function
export async function generateChatResponse(
  userMessage: string,
  mode: string = "savage",
  userId?: number,
  sessionId?: number,
  conversationHistory: ChatCompletionMessageParam[] = [],
  imageData?: string
): Promise<{ aiReply: string; selectedMode: string; isAutoSelected: boolean }> {
  // Auto-select mode if none specified or if mode is just "savage" (default)
  const selectedMode = mode === "savage" ? selectModeFromMessage(userMessage) : mode;
  const isAutoSelected = mode === "savage"; // If mode was "savage" (default), it was auto-selected
  
  const temperature = 0.75;
  const maxTokens = 800;

  // Enhance the system prompt for cinematic experience
  let enhancedPrompt = moodyPrompt;
  
  // Add cinematic experience instructions
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
    // Filter out any messages that might have malformed image content
    ...conversationHistory.filter(msg => 
      typeof msg.content === 'string' || 
      (Array.isArray(msg.content) && msg.content.every(item => 
        typeof item === 'object' && 'type' in item
      ))
    ),
  ];

  // Create the user message with or without image
  // TODO: Re-enable when OpenRouter supports vision models
  // if (imageData) {
  //   console.log("Processing image message:", {
  //     hasImage: !!imageData,
  //     imageLength: imageData?.length,
  //     imageStartsWithData: imageData?.startsWith('data:'),
  //     userMessage: userMessage || "Analyze this image"
  //   });
  //   
  //   // Since we can't send images to the API, we'll process them as text prompts
  //   // The actual image processing will be handled in the try block above
  // } else {
  //   messages.push({ role: "user", content: userMessage });
  // }
  
  // For now, always treat as text-only
  messages.push({ role: "user", content: userMessage });

  try {
    // Model selection for cinematic experience through OpenRouter
    let model = "gpt-4";
    if (process.env.OPENROUTER_API_KEY) {
      model = "xai/grok-beta"; // Use Grok-4 through OpenRouter for cinematic experience
    }
    
    console.log("Using model:", model, "for cinematic experience");
    
    // Enhanced parameters for cinematic responses
    const cinematicTemperature = 0.85; // Higher creativity for cinematic feel
    const cinematicMaxTokens = 1200; // Longer responses for cinematic experience
    
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: cinematicTemperature,
      max_tokens: cinematicMaxTokens,
    });

    const aiRaw = response.choices?.[0]?.message?.content || "MoodyBot has gone quiet.";
    const finalReply = postProcessMoodyResponse(aiRaw);

    appendToTextLog(
      `Mode: ${selectedMode} (Auto: ${isAutoSelected})\nUser: ${userId ?? "anon"}\nMessage: ${userMessage}${imageData ? ' [with image]' : ''}\nReply: ${finalReply}`
    );

    return { 
      aiReply: finalReply, 
      selectedMode: selectedMode, 
      isAutoSelected: isAutoSelected 
    };
  } catch (error: any) {
    console.error("OpenRouter API error:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      hasImage: !!imageData
    });
    
    // TODO: Re-enable when OpenRouter supports vision models
    // Handle specific image-related errors
    // if (imageData && (error.message?.includes('vision') || error.message?.includes('model') || error.message?.includes('unsupported'))) {
    //   return { 
    //     aiReply: "MoodyBot can't process images right now. Please describe what you see in the image, and I'll respond to that instead. For example: 'I see a hot dog with lots of ketchup on it'", 
    //     selectedMode: selectedMode, 
    //     isAutoSelected: isAutoSelected 
    //   };
    // }
    
    if (error.response?.status === 429) {
      return { 
        aiReply: "MoodyBot is getting too many requests. Please try again in a moment.", 
        selectedMode: selectedMode, 
        isAutoSelected: isAutoSelected 
      };
    }
    if (error.response?.status === 401) {
      return { 
        aiReply: "MoodyBot's API key is invalid. Please contact support.", 
        selectedMode: selectedMode, 
        isAutoSelected: isAutoSelected 
      };
    }
    // TODO: Re-enable when OpenRouter supports vision models
    // if (error.response?.status === 400 && imageData) {
    //   return { 
    //     aiReply: "MoodyBot couldn't process that image. The image might be too large, unclear, or in an unsupported format. Try a smaller, clearer image or describe what you see.", 
    //     selectedMode: selectedMode, 
    //     isAutoSelected: isAutoSelected 
    //   };
    // }
    return { 
      aiReply: "MoodyBot is in a bad mood. Try again later.", 
      selectedMode: selectedMode, 
      isAutoSelected: isAutoSelected 
    };
  }
}
