import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });
import { OpenAI } from "openai";
import { logApiInteraction, logError } from "./logger";
import fs from "fs";
import { postProcessMoodyResponse } from '../utils/moodybotPostProcess';
import { appendToTextLog } from './logger'; // if not already imported
const moodyPrompt = fs.readFileSync("./server/system_prompt.txt", "utf-8");
const signature = process.env.MOODYBOT_SIGNATURE || "🥃 @MoodyBotAI";

// ✅ FORCE OpenAI package to behave
if (!process.env.OPENAI_API_KEY && process.env.OPENROUTER_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENROUTER_API_KEY;
}

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,  // The actual key you're using
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    "HTTP-Referer": "https://moodybot.ai",
    "X-Title": "MoodyBotAI",
  },
});

console.log("ENV LOADED ->", {
  NODE_ENV: process.env.NODE_ENV,
  OPENROUTER_KEY_HEAD: process.env.OPENROUTER_API_KEY?.slice(0, 8),
  OPENAI_KEY_HEAD: process.env.OPENAI_API_KEY?.slice(0, 8),
});

export default openai;

export interface ChatModeConfig {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export const chatModes: Record<string, ChatModeConfig> = {
  savage: {
    systemPrompt: moodyPrompt,
    temperature: 0.7,
    maxTokens: 800
  },
  validation: {
    systemPrompt: moodyPrompt,
    temperature: 0.8,
    maxTokens: 800
  },
  oracle: {
    systemPrompt: moodyPrompt,
    temperature: 0.9,
    maxTokens: 800
  },
  dealer: {
    systemPrompt: moodyPrompt,
    temperature: 0.6,
    maxTokens: 800
  }
};

export async function generateChatResponse(
  mode: string,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  userId?: number,
  sessionId?: number
): Promise<string> {
  const config = chatModes[mode];
  if (!config) {
    throw new Error(`Unknown chat mode: ${mode}`);
  }

  const messages = [
    { role: "system", content: config.systemPrompt },
    ...conversationHistory.slice(-10), // Keep last 10 messages for context
    { role: "user", content: userMessage }
  ];

  try {
    console.log("Making API call with:", { model: "gpt-4o", mode, messageCount: messages.length });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });

    let aiResponse = response.choices[0].message.content || "I have nothing to say right now.";
    console.log("API response received:", aiResponse.substring(0, 100));
    const finalReply = postProcessMoodyResponse(aiResponse);

    // Log the interaction
    logApiInteraction({
  type: "chat",
  mode,
  input: userMessage,
  output: finalReply,
  userId,
  sessionId,
  timestamp: new Date().toISOString()
});

appendToTextLog(
  `Mode: ${mode}\nUser: ${userId ?? 'anon'}\nMessage: ${userMessage}\nReply: ${finalReply}`
);

return finalReply;

  } catch (error) {
    console.error("OpenRouter API error:", error);
    logError(error, `Chat generation - Mode: ${mode}, User: ${userId}, Session: ${sessionId}`);
    throw new Error("Failed to generate response. The AI is processing your darkness.");
  }
}

export async function generateJournalPrompt(mood?: string, userId?: number): Promise<string> {
  const moodContext = mood ? `The user's current mood is: ${mood}.` : "";
  const inputText = `Generate a dark journaling prompt for mood: ${mood || 'unspecified'}`;
  
  try {
    const response = await openai.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: `You are a dark journaling prompt generator. Create deeply probing, uncomfortable questions that force genuine self-reflection. No toxic positivity - embrace the shadow. Questions should be psychologically challenging and designed to uncover hidden truths. ${moodContext} Generate one powerful, unsettling prompt.`
        },
        {
          role: "user",
          content: "Generate a dark journaling prompt that cuts deep."
        }
      ],
      temperature: 0.8,
      max_tokens: 100,
    });

    const prompt = response.choices[0].message.content || "What truth are you avoiding right now?";

    // Log the interaction
    logApiInteraction({
      type: "journal",
      input: inputText,
      output: prompt,
      userId,
      timestamp: new Date().toISOString()
    });

    return prompt;
  } catch (error) {
    console.error("OpenRouter API error:", error);
    logError(error, `Journal prompt generation - User: ${userId}, Mood: ${mood}`);
    return "What truth are you avoiding right now?";
  }
}

export async function generateQuoteCard(journalContent: string, userId?: number): Promise<{ quote: string; source: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: `You are a quote generator that transforms raw, honest journal entries into powerful, shareable quotes. Extract the deepest truth from the user's writing and turn it into a profound, dark, poetic quote that captures their essence. The quote should be raw, authentic, and emotionally resonant. Also generate a creative source attribution that references when or how this insight emerged. Respond in JSON format with "quote" and "source" fields.`
        },
        {
          role: "user",
          content: `Transform this journal entry into a powerful quote: ${journalContent}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 150,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const quote = result.quote || "You are not broken. You are breaking through.";
    const source = result.source || "Born from your depths";

    // Log the interaction
    logApiInteraction({
      type: "quote",
      input: journalContent.substring(0, 200) + "...",
      output: `Quote: "${quote}" - Source: ${source}`,
      userId,
      timestamp: new Date().toISOString()
    });

    return { quote, source };
  } catch (error) {
    console.error("OpenRouter API error:", error);
    logError(error, `Quote generation - User: ${userId}`);
    return {
      quote: "You are not broken. You are breaking through.",
      source: "Born from your depths"
    };
  }
}

export async function analyzeDamagePatterns(
  journalEntries: string[],
  moodData: Array<{ mood: string; intensity: number; notes?: string }>,
  userId?: number
): Promise<{ patterns: any[]; triggers: any[]; loops: any[] }> {
  const inputSummary = `${journalEntries.length} journal entries, ${moodData.length} mood records`;
  
  try {
    const response = await openai.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: `You are a psychological pattern analyst. Analyze the user's journal entries and mood data to identify destructive patterns, triggers, and emotional loops. Be brutally honest about what you see. Look for self-sabotage, avoidance behaviors, relationship patterns, and recurring themes. Respond in JSON format with arrays for "patterns", "triggers", and "loops". Each item should have "name", "description", and "frequency" fields.`
        },
        {
          role: "user",
          content: `Analyze these journal entries: ${journalEntries.join('\n---\n')} 
          
          And this mood data: ${JSON.stringify(moodData)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const analysis = {
      patterns: result.patterns || [],
      triggers: result.triggers || [],
      loops: result.loops || []
    };

    // Log the interaction
    logApiInteraction({
      type: "analysis",
      input: inputSummary,
      output: `Found ${analysis.patterns.length} patterns, ${analysis.triggers.length} triggers, ${analysis.loops.length} loops`,
      userId,
      timestamp: new Date().toISOString()
    });

    return analysis;
  } catch (error) {
    console.error("OpenRouter API error:", error);
    logError(error, `Damage pattern analysis - User: ${userId}`);
    return {
      patterns: [],
      triggers: [],
      loops: []
    };
  }
}
