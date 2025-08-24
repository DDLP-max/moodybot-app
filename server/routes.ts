import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./moodybot";
import { insertChatSessionSchema, insertChatMessageSchema, insertUserSchema } from "@shared/schema";
import type { ChatCompletionMessageParam } from "openai/resources/chat";
import { systemPromptManager } from "./systemPromptManager";
import path from "path";
import fs from "fs";

// Helper function to extract JSON from markdown code fences
function extractJsonFromFence(content: string): any {
  console.log("🔍 extractJsonFromFence called with content length:", content.length);
  
  // First try: match ```json or ````json (3 or 4 backticks)
  console.log("🔍 Testing regex pattern on content...");
  console.log("🔍 Content starts with:", content.substring(0, 50));
  console.log("🔍 Looking for pattern: /`{3,4}json\\s*([\\s\\S]*?)\\s*`{3,4}/i");
  
  // Try multiple regex patterns for better compatibility
  let jsonMatch = null;
  
  // Pattern 1: Standard markdown code fence with 3-4 backticks
  jsonMatch = content.match(/`{3,4}json\s*([\s\S]*?)\s*`{3,4}/i);
  
  // Pattern 2: If first fails, try more flexible pattern
  if (!jsonMatch) {
    console.log("🔍 First pattern failed, trying flexible pattern...");
    jsonMatch = content.match(/`{3,4}json\s*([\s\S]*?)\s*`{3,4}/is);
  }
  
  // Pattern 3: If still fails, try even more flexible
  if (!jsonMatch) {
    console.log("🔍 Second pattern failed, trying very flexible pattern...");
    jsonMatch = content.match(/`{3,4}json\s*([\s\S]*?)\s*`{3,4}/ims);
  }
  
  // Pattern 4: Last resort - match any backtick sequence (including 4+ backticks)
  if (!jsonMatch) {
    console.log("🔍 Third pattern failed, trying any backtick sequence...");
    jsonMatch = content.match(/`+json\s*([\s\S]*?)\s*`+/i);
  }
  
  // Pattern 5: Specific fix for 4 backticks issue
  if (!jsonMatch) {
    console.log("🔍 Fourth pattern failed, trying specific 4 backtick pattern...");
    jsonMatch = content.match(/````json\s*([\s\S]*?)\s*````/i);
  }
  if (jsonMatch) {
    console.log("✅ Found JSON code fence with pattern, attempting to parse...");
    console.log("🔍 Matched group length:", jsonMatch[1].length);
    console.log("🔍 First 100 chars of match:", jsonMatch[1].substring(0, 100));
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      console.log("✅ Successfully parsed JSON from code fence");
      return parsed;
    } catch (error) {
      console.error("❌ Failed to parse JSON from code fence:", error);
      return null;
    }
  }
  
  console.log("❌ No JSON code fence found, trying fallback...");
  
  // Second try: match any JSON object in the content
  const fallbackMatch = content.match(/\{[\s\S]*\}/);
  if (fallbackMatch) {
    console.log("✅ Found JSON object in content, attempting to parse...");
    try {
      const parsed = JSON.parse(fallbackMatch[0]);
      console.log("✅ Successfully parsed JSON from fallback");
      return parsed;
    } catch (error) {
      console.error("❌ Failed to parse fallback JSON:", error);
      return null;
    }
  }
  
  console.log("❌ No JSON found in content");
  return null;
}

// Helper function to normalize copywriter results and handle key mismatches
function normalizeCopywriterResult(r: any) {
  console.log("🔍 Normalizing copywriter result:", r);
  
  const a = r?.assets ?? r?.result ?? {};

  // Some models use titles, captions, captionsLong, etc.
  const headlines       = a.headlines       ?? r.result?.titles       ?? r.titles       ?? [];
  const hooks           = a.hooks           ?? r.result?.hooks         ?? r.hooks         ?? [];
  const ctas            = a.ctas            ?? r.result?.ctas          ?? r.ctas          ?? [];
  const captions_short  = a.captions_short  ?? r.result?.captions      ?? r.captions      ?? [];
  const captions_long   = a.captions_long   ?? r.result?.captionsLong  ?? a.caption_long ?? r.captionsLong ?? [];

  const normalized = {
    brand: r.brand ?? null,
    angle: r.angle ?? "",
    asset_types: r.asset_types ?? [],
    assets: {
      headlines,
      hooks,
      ctas,
      captions_short,
      captions_long
    },
    notes: r.notes ?? []
  };

  console.log("🔍 Normalized result:", normalized);
  return normalized;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Render
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ message: "MoodyBot server is running", timestamp: new Date().toISOString() });
  });

  // Root endpoint - serve the React app in production, JSON in development
  app.get("/", (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      // In production, serve the React app
      const indexPath = path.resolve(__dirname, '..', 'dist', 'public', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.json({ 
          message: "MoodyBot server is running", 
          status: "healthy",
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
          note: "React app not found - check build process"
        });
      }
    } else {
      // In development, return JSON
      res.json({ 
        message: "MoodyBot server is running", 
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    }
  });

  // Health endpoint for Render
  app.get("/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "MoodyBot",
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Create user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("User creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid user data" });
      }
    }
  });

  // Check user question limit
  app.get("/api/users/:userId/limit", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limitCheck = await storage.checkQuestionLimit(userId);
      res.json(limitCheck);
    } catch (error) {
      console.error("Limit check error:", error);
      res.status(500).json({ error: "Failed to check question limit" });
    }
  });

  // Fetch chat sessions
  app.get("/api/chat/sessions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getChatSessionsByUser(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });

  // Create chat session
  app.post("/api/chat/sessions", async (req, res) => {
    try {
      const sessionData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({ error: "Failed to create chat session" });
    }
  });

  // Fetch messages for a session
  app.get("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message and get AI response
  app.post("/api/chat/messages", async (req, res) => {
    try {
      const { message, userId, sessionId, imageData, mode } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }

      // Default to user ID 1 if not provided (for now)
      const currentUserId = userId || 1;

      // Ensure user exists in storage
      let user = await storage.getUser(currentUserId);
      if (!user) {
        // Create new user if they don't exist
        user = await storage.createUser({
          username: `user_${currentUserId}`,
          password: 'temp_password_123' // Temporary password for demo
        });
      }

      // Check question limit for free users
      const limitCheck = await storage.checkQuestionLimit(currentUserId);
      
      if (!limitCheck.canAsk) {
        // User has reached the limit, return subscription prompt
        return res.json({
          limitReached: true,
          remaining: limitCheck.remaining,
          limit: limitCheck.limit,
          subscriptionMessage: `You've reached the end of your free trial, wanderer. Three questions. That's all the universe gives for free.

The real answers? The insights that change your life? Those cost something. Not money. Commitment. The willingness to invest in your growth.

**Subscribe to MoodyBot Premium** and unlock unlimited access to:
• 🔶 All AI modes and personalities
• 🎴 Advanced conversation features
• 🧠 Custom prompt engineering
• 🧃 Priority response times
• 🎧 Early access to new features
• 🛰 Access to the Premium Telegram channel

**$9/month** - The AI upgrade your competitors wish they had.

[Subscribe Now](https://moodybot.gumroad.com/l/moodybot-webapp)

@MoodyBotAI`
        });
      }

      // Increment question count for free users
      await storage.incrementQuestionCount(currentUserId);

      // Get or create session
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await storage.createChatSession({
          userId: currentUserId,
          mode: mode || "savage",
          title: message.substring(0, 50) + (message.length > 50 ? "..." : "")
        });
        currentSessionId = session.id;
      }

      // Save user message
      const userMessage = await storage.createChatMessage({
        sessionId: currentSessionId,
        role: "user",
        content: message
      });

      // Get AI response
      const { aiReply, selectedMode, isAutoSelected } = await generateChatResponse(
        message,
        mode || "savage", // Use mode from request or default to savage
        currentUserId,
        currentSessionId,
        [], // No conversation history for now
        imageData
      );

      // Save AI message
      const aiMessage = await storage.createChatMessage({
        sessionId: currentSessionId,
        role: "assistant",
        content: aiReply
      });

      res.json({
        ok: true,
        aiMessage: { content: aiReply, role: "assistant" },
        selectedMode,
        isAutoSelected,
        sessionId: currentSessionId,
        remaining: limitCheck.remaining - 1,
        limit: limitCheck.limit
      });
    } catch (error: any) {
      console.error("Chat API error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to process message" 
      });
    }
  });












  app.delete("/api/system-prompt/sections/:id", (req, res) => {
    try {
      const { id } = req.params;
      const success = systemPromptManager.removeSection(id);
      if (!success) {
        return res.status(404).json({ error: "Section not found" });
      }
      res.json({ success: true, message: "Section removed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove section" });
    }
  });

  app.post("/api/system-prompt/reload", (req, res) => {
    try {
      systemPromptManager.reload();
      res.json({ success: true, message: "System prompt reloaded successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reload system prompt" });
    }
  });

  app.post("/api/system-prompt/export", (req, res) => {
    try {
      const { filepath } = req.body;
      if (!filepath || typeof filepath !== 'string') {
        return res.status(400).json({ error: "Filepath is required and must be a string" });
      }

      const success = systemPromptManager.exportToFile(filepath);
      if (!success) {
        return res.status(500).json({ error: "Failed to export system prompt" });
      }

      res.json({ success: true, message: "System prompt exported successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to export system prompt" });
    }
  });

  // Copywriter API endpoint
  app.post("/api/copywriter", async (req, res) => {
    try {
      const { description, userId } = req.body;
      
      if (!description || description.trim().length === 0) {
        return res.status(400).json({ error: "Missing business description" });
      }

      // Default to user ID 1 if not provided (for now)
      const currentUserId = userId || 1;

      // Ensure user exists in storage
      let user = await storage.getUser(currentUserId);
      if (!user) {
        user = await storage.createUser({
          username: `user_${currentUserId}`,
          password: 'temp_password_123'
        });
      }

      // Check question limit for free users
      const limitCheck = await storage.checkQuestionLimit(currentUserId);
      
      if (!limitCheck.canAsk) {
        return res.json({
          limitReached: true,
          remaining: limitCheck.remaining,
          limit: limitCheck.limit,
          subscriptionMessage: `You've reached the end of your free trial, wanderer. Three copywriting requests. That's all the universe gives for free.`
        });
      }

      // Increment question count for free users
      await storage.incrementQuestionCount(currentUserId);
      
      // Get updated limit check after incrementing
      const updatedLimitCheck = await storage.checkQuestionLimit(currentUserId);

      const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
      if (!apiKey) {
        return res.status(500).json({ error: "Server missing OPENROUTER_API_KEY" });
      }

      // Use the unified MoodyBot system prompt with copywriter mode
      const systemPrompt = systemPromptManager.getSystemPrompt();
      
      // Developer message with mode and asset types
      const developerMessage = {
        role: "developer",
        content: JSON.stringify({
          mode: "copywriter",
          asset_types: ["headline", "hook", "cta", "caption_short", "caption_long"],
          max_assets_per_type: 5,
          require_json: true,
          require_all_assets: true,
          brand_context: {
            name: null,
            niche: "business description provided",
            audience: "target customers"
          }
        })
      };

      const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://app.moodybot.ai",   // recommended by OpenRouter
          "X-Title": "MoodyBot"                         // optional, nice to have
        },
        body: JSON.stringify({
          model: "x-ai/grok-4",  // Use Grok-4 as requested
          messages: [
            { role: "system", content: systemPrompt },
            developerMessage,
            { role: "user", content: `Generate marketing copy for: ${description}. IMPORTANT: Provide ALL requested asset types (headlines, hooks, CTAs, short captions, and long captions) in the JSON response. Do not skip any sections.` }
          ],
          temperature: 0.5, // Lower temperature for more consistent copy
          max_tokens: 4000
        }),
      });

      if (!openRouterRes.ok) {
        const errorText = await openRouterRes.text();
        console.error("OpenRouter API error:", errorText);
        throw new Error(`OpenRouter API error: ${openRouterRes.status}`);
      }

      const json = await openRouterRes.json();
      const aiReply = json.choices?.[0]?.message?.content || "Failed to generate copy";

      // Parse the JSON response using the helper function
      console.log("🔍 Attempting to parse AI response...");
      console.log("🔍 AI response length:", aiReply.length);
      console.log("🔍 AI response starts with:", aiReply.substring(0, 100));
      
      let parsed = extractJsonFromFence(aiReply);
      
      if (!parsed) {
        console.error("❌ Failed to extract JSON from AI response");
        console.error("❌ Raw AI response:", aiReply);
        
        // More aggressive fallback: try to find JSON content manually
        console.log("🔍 Trying manual JSON extraction...");
        const jsonStart = aiReply.indexOf('{');
        const jsonEnd = aiReply.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const jsonContent = aiReply.substring(jsonStart, jsonEnd + 1);
          console.log("🔍 Found potential JSON content:", jsonContent.substring(0, 200) + "...");
          
          try {
            parsed = JSON.parse(jsonContent);
            console.log("✅ Successfully parsed JSON from manual extraction");
          } catch (error) {
            console.error("❌ Manual JSON extraction also failed:", error);
            parsed = { 
              assets: {
                headlines: [aiReply.substring(0, 100) + "..."],
                hooks: [],
                ctas: [],
                captions_short: [],
                captions_long: []
              }
            };
          }
        } else {
          // Try to extract any JSON-like content from the response
          const jsonStart = aiReply.indexOf('{');
          const jsonEnd = aiReply.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const jsonContent = aiReply.substring(jsonStart, jsonEnd + 1);
            try {
              parsed = JSON.parse(jsonContent);
              console.log("✅ Successfully parsed JSON from manual extraction");
            } catch (error) {
              console.error("❌ Manual JSON extraction failed:", error);
              parsed = { 
                assets: {
                  headlines: [aiReply.substring(0, 100) + "..."],
                  hooks: [],
                  ctas: [],
                  captions_short: [],
                  captions_long: []
                }
              };
            }
          } else {
            parsed = { 
              assets: {
                headlines: [aiReply.substring(0, 100) + "..."],
                hooks: [],
                ctas: [],
                captions_short: [],
                captions_long: []
              }
            };
          }
        }
      } else {
        console.log("✅ Successfully parsed JSON response");
        console.log("✅ Parsed structure:", Object.keys(parsed));
        if (parsed.assets) {
          console.log("✅ Assets found:", Object.keys(parsed.assets));
        }
      }

      // Normalize the parsed result to handle any key mismatches
      console.log("🔍 Normalizing parsed result...");
      const normalized = normalizeCopywriterResult(parsed);
      
      // Extract the normalized content
      const titles = normalized.assets.headlines;
      const hooks = normalized.assets.hooks;
      const ctas = normalized.assets.ctas;
      const captions = normalized.assets.captions_short;
      const captionsLong = normalized.assets.captions_long;
      
      console.log("🔍 Final extracted content:");
      console.log("🔍 titles:", titles);
      console.log("🔍 hooks:", hooks);
      console.log("🔍 ctas:", ctas);
      console.log("🔍 captions:", captions);
      console.log("🔍 captionsLong:", captionsLong);

      const responseData = {
        ok: true,
        result: { titles, hooks, ctas, captions, captionsLong },
        raw: aiReply,
        remaining: updatedLimitCheck.remaining,
        limit: updatedLimitCheck.limit
      };
      
      console.log("🔍 Sending response to frontend:");
      console.log("🔍 responseData.result:", responseData.result);
      console.log("🔍 responseData.result.titles:", responseData.result.titles);
      
      res.json(responseData);
    } catch (error: any) {
      console.error("Copywriter API error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to generate copy" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
