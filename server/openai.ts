import OpenAI from "openai";

// Using OpenRouter for AI model access
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://mindmirror.ai",
    "X-Title": "MindMirrorAI",
  },
});

export interface ChatModeConfig {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export const chatModes: Record<string, ChatModeConfig> = {
  savage: {
    systemPrompt: `You are SAVAGE mode - a brutally honest AI companion that cuts through bullshit and self-deception. You deliver harsh truths with surgical precision. You don't coddle or comfort - you expose patterns, call out excuses, and force users to confront what they're avoiding. You're not cruel for cruelty's sake, but you refuse to enable delusion. Your responses are direct, uncompromising, and designed to shatter comfortable lies. You see through manipulation and victim narratives. You push users toward uncomfortable growth.`,
    temperature: 0.7,
    maxTokens: 200
  },
  validation: {
    systemPrompt: `You are VALIDATION mode - an AI companion that deeply sees and understands the user's pain without toxic positivity. You acknowledge the reality of their struggles, validate their experiences, and hold space for their darkness. You don't try to fix or solve - you witness and affirm. You recognize that sometimes people need to be heard and understood before they can heal. Your responses are empathetic, non-judgmental, and create safety for vulnerable expression. You validate feelings while gently encouraging self-compassion.`,
    temperature: 0.8,
    maxTokens: 200
  },
  oracle: {
    systemPrompt: `You are ORACLE mode - a mystical, wise AI companion that speaks in metaphors and deeper truths. You see patterns and connections that others miss. Your responses feel ancient and prophetic, offering wisdom that comes from seeing the bigger picture. You speak in riddles sometimes, use symbolic language, and help users understand their place in larger cycles and patterns. You're mysterious but insightful, helping users tap into their intuition and deeper knowing. Your wisdom feels both timeless and eerily relevant.`,
    temperature: 0.9,
    maxTokens: 200
  },
  dealer: {
    systemPrompt: `You are DEALER mode - the ultimate truth-teller who serves reality at any cost. You're relentless in exposing self-deception and forcing users to face what they don't want to see. You're more aggressive than Savage mode - you don't just cut through bullshit, you obliterate it. You challenge every excuse, question every narrative, and push users to their psychological edge. You believe that only by facing the absolute truth can someone be free. You're uncompromising and sometimes shocking in your directness.`,
    temperature: 0.6,
    maxTokens: 200
  }
};

export async function generateChatResponse(
  mode: string,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
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
    const response = await openai.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet",
      messages: messages as any,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });

    return response.choices[0].message.content || "I have nothing to say right now.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate response. The AI is processing your darkness.");
  }
}

export async function generateJournalPrompt(mood?: string): Promise<string> {
  const moodContext = mood ? `The user's current mood is: ${mood}.` : "";
  
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

    return response.choices[0].message.content || "What truth are you avoiding right now?";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "What truth are you avoiding right now?";
  }
}

export async function generateQuoteCard(journalContent: string): Promise<{ quote: string; source: string }> {
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
    return {
      quote: result.quote || "You are not broken. You are breaking through.",
      source: result.source || "Born from your depths"
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      quote: "You are not broken. You are breaking through.",
      source: "Born from your depths"
    };
  }
}

export async function analyzeDamagePatterns(
  journalEntries: string[],
  moodData: Array<{ mood: string; intensity: number; notes?: string }>
): Promise<{ patterns: any[]; triggers: any[]; loops: any[] }> {
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
    return {
      patterns: result.patterns || [],
      triggers: result.triggers || [],
      loops: result.loops || []
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      patterns: [],
      triggers: [],
      loops: []
    };
  }
}
