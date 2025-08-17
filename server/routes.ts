import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./moodybot";
import { insertChatSessionSchema, insertChatMessageSchema, insertUserSchema } from "@shared/schema";
import type { ChatCompletionMessageParam } from "openai/resources/chat";

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

      const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
      if (!apiKey) {
        return res.status(500).json({ error: "Server missing OPENROUTER_API_KEY" });
      }

      // Structured prompt that demands JSON
      const copywriterPrompt = `You are an expert copywriter using Ogilvy + Kennedy principles. You MUST return ONLY valid JSON in this exact format:

{
  "titles": ["headline 1", "headline 2", "headline 3"],
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "captions": ["caption 1", "caption 2", "caption 3"],
  "ctas": ["cta 1", "cta 2", "cta 3"]
}

Rules:
- Return ONLY valid JSON, no other text
- Each array must contain 3-5 compelling marketing copy elements
- Use the business description to create relevant, specific copy

Business: ${description}

Generate marketing copy in the exact JSON format specified above.`;

      const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://app.moodybot.ai",   // recommended by OpenRouter
          "X-Title": "MoodyBot"                         // optional, nice to have
        },
        body: JSON.stringify({
          model: "x-ai/grok-2-latest",  // safer, valid model slug
          messages: [
            { role: "system", content: copywriterPrompt },
            { role: "user", content: `Generate marketing copy for: ${description}` }
          ],
          temperature: 0.7,
          max_tokens: 800
        }),
      });

      if (!openRouterRes.ok) {
        const errorText = await openRouterRes.text();
        console.error("OpenRouter API error:", errorText);
        throw new Error(`OpenRouter API error: ${openRouterRes.status}`);
      }

      const json = await openRouterRes.json();
      const aiReply = json.choices?.[0]?.message?.content || "Failed to generate copy";

      // Parse the JSON response with fallback
      let parsed: any;
      try {
        parsed = JSON.parse(aiReply);
      } catch {
        // Fallback: try to extract JSON from the response
        const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            parsed = { 
              titles: [aiReply.substring(0, 100) + "..."],
              hooks: [],
              ctas: [],
              captions: []
            };
          }
        } else {
          parsed = { 
            titles: [aiReply.substring(0, 100) + "..."],
            hooks: [],
            ctas: [],
            captions: []
          };
        }
      }

      // Ensure we have the expected structure
      const titles = parsed.titles || [];
      const hooks = parsed.hooks || [];
      const ctas = parsed.ctas || [];
      const captions = parsed.captions || [];

      res.json({
        ok: true,
        result: { titles, hooks, ctas, captions },
        raw: aiReply,
        remaining: limitCheck.remaining - 1,
        limit: limitCheck.limit
      });
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
