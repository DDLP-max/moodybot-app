import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./moodybot";
import { insertChatSessionSchema, insertChatMessageSchema, insertUserSchema } from "@shared/schema";
import type { ChatCompletionMessageParam } from "openai/resources/chat";
import { systemPromptManager } from "./systemPromptManager";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // API fingerprint route
  app.get("/api/_meta", (req, res) => {
    res.set({ "X-MB-Route": "_meta" });
    res.json({ ok: true, timestamp: new Date().toISOString() });
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

  // Create or get user (body-optional, always returns { id })
  app.post("/api/users", async (req, res) => {
    try {
      // If body provided, use it; otherwise create a simple user
      let user;
      if (req.body && req.body.username) {
        const userData = insertUserSchema.parse(req.body);
        
        // Check if user already exists
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
          user = existingUser;
        } else {
          user = await storage.createUser(userData);
        }
      } else {
        // Create a simple demo user with timestamp-based ID
        const demoUserId = Date.now();
        user = await storage.createUser({
          username: `user_${demoUserId}`,
          password: 'demo_password'
        });
      }
      
      res.set({ "X-MB-Route": "users" });
      res.json({ id: user.id.toString() });
    } catch (error) {
      console.error("User creation error:", error);
      res.set({ "X-MB-Route": "users" });
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid user data" });
      }
    }
  });

  // GET endpoint for users (same as POST)
  app.get("/api/users", async (req, res) => {
    try {
      // Create a simple demo user with timestamp-based ID
      const demoUserId = Date.now();
      const user = await storage.createUser({
        username: `user_${demoUserId}`,
        password: 'demo_password'
      });
      
      res.set({ "X-MB-Route": "users" });
      res.json({ id: user.id.toString() });
    } catch (error) {
      console.error("User creation error:", error);
      res.set({ "X-MB-Route": "users" });
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Check user question limit (session-based)
  app.get("/api/users/me/limit", async (req, res) => {
    const requestId = req.headers['x-request-id'] || `limit-${Date.now()}`;
    
    try {
      // For now, use default user ID 1, but this should be replaced with session-based auth
      const userId = 1; // TODO: Replace with actual session user ID
      
      console.log(`[${requestId}] Checking limit for user ${userId}`);
      const limitCheck = await storage.checkQuestionLimit(userId);
      const resetAt = new Date();
      resetAt.setDate(resetAt.getDate() + 1); // Reset daily
      
      console.log(`[${requestId}] User ${userId} limit: ${limitCheck.remaining}/${limitCheck.limit}`);
      
      // Add cache headers to prevent excessive requests
      res.set({
        'Cache-Control': 'private, max-age=30', // 30 second cache
        'Vary': 'x-request-id'
      });
      
      res.json({
        total: limitCheck.limit,
        remaining: limitCheck.remaining,
        canAsk: limitCheck.canAsk,
        resetAt: resetAt.toISOString()
      });
    } catch (error) {
      console.error(`[${requestId}] Limit check error:`, error);
      res.status(500).json({ 
        code: "INTERNAL_ERROR", 
        message: "Failed to check question limit" 
      });
    }
  });

  // Legacy endpoint for backward compatibility
  app.get("/api/users/:userId/limit", async (req, res) => {
    const requestId = req.headers['x-request-id'] || `limit-${Date.now()}`;
    const userId = parseInt(req.params.userId);
    
    try {
      if (isNaN(userId)) {
        console.error(`[${requestId}] Invalid user ID: ${req.params.userId}`);
        return res.status(400).json({ 
          code: "INVALID_USER_ID", 
          message: "Invalid user ID format" 
        });
      }

      console.log(`[${requestId}] Checking limit for user ${userId}`);
      const limitCheck = await storage.checkQuestionLimit(userId);
      const resetAt = new Date();
      resetAt.setDate(resetAt.getDate() + 1); // Reset daily
      
      console.log(`[${requestId}] User ${userId} limit: ${limitCheck.remaining}/${limitCheck.limit}`);
      
      // Add cache headers to prevent excessive requests
      res.set({
        'Cache-Control': 'private, max-age=30', // 30 second cache
        'Vary': 'x-request-id'
      });
      
      res.json({
        total: limitCheck.limit,
        remaining: limitCheck.remaining,
        canAsk: limitCheck.canAsk,
        resetAt: resetAt.toISOString()
      });
    } catch (error) {
      console.error(`[${requestId}] Limit check error for user ${userId}:`, error);
      res.status(500).json({ 
        code: "INTERNAL_ERROR", 
        message: "Failed to check question limit" 
      });
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

  // Create chat session (defensive, body-optional)
  app.post("/api/chat/sessions", async (req, res) => {
    try {
      const { userId, mode = "dynamic" } = req.body || {};

      if (!userId) {
        return res.status(400).json({
          error: "Missing userId",
          details: "userId is required"
        });
      }

      console.log(`Creating session for userId: ${userId}, mode: ${mode}`);

      // Try to create session with storage, fallback to dummy if DB fails
      let session;
      try {
        const sessionData = {
          userId: parseInt(userId.toString()),
          mode: mode,
          title: `Session ${Date.now()}`
        };
        session = await storage.createChatSession(sessionData);
        console.log(`Session created via storage:`, session);
      } catch (dbError) {
        console.error("DB session creation failed, using fallback:", dbError);
        // Fallback: create a dummy session so the pipeline doesn't explode
        session = { 
          id: Date.now(), // Simple numeric ID
          userId: parseInt(userId.toString()),
          mode: mode,
          title: `Fallback Session ${Date.now()}`
        };
      }

      if (!session?.id) {
        throw new Error("Session creation returned no ID");
      }

      res.set({ "X-MB-Route": "chat/sessions" });
      res.json({ id: session.id.toString() });
    } catch (err: any) {
      console.error("Session creation error:", err);
      res.set({ "X-MB-Route": "chat/sessions" });
      res.status(500).json({
        error: "Failed to create chat session",
        details: String(err?.message || err)
      });
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

  // Creative Writer API endpoint
  app.post("/api/creative-writer", async (req, res) => {
    const requestId = req.headers['x-request-id'] || `creative-${Date.now()}`;
    
    try {
      const { 
        mode, 
        topic_or_premise, 
        audience, 
        word_count_target, 
        max_words, 
        structure, 
        extras, 
        mood = "gritty", 
        intensity = 3, 
        edge = 3, 
        gothic_flourish = false, 
        carebear_to_policehorse = 5,
        userId 
      } = req.body;
      
      console.log(`[${requestId}] Creative writer request: mode=${mode}, userId=${userId}`);
      
      if (!mode || !topic_or_premise || !audience || !word_count_target || !max_words) {
        console.error(`[${requestId}] Missing required fields`);
        return res.status(400).json({ 
          code: "MISSING_FIELDS",
          message: "Missing required fields: mode, topic_or_premise, audience, word_count_target, max_words" 
        });
      }

      // Validate mode
      const validModes = ['fiction_chapter', 'fiction_outline', 'article', 'teaser_blurbs'];
      if (!validModes.includes(mode)) {
        console.error(`[${requestId}] Invalid mode: ${mode}`);
        return res.status(400).json({ 
          code: "INVALID_MODE",
          message: "Invalid mode. Must be one of: " + validModes.join(', ') 
        });
      }

      // Default to user ID 1 if not provided (for now)
      const currentUserId = userId || 1;

      // Ensure user exists in storage
      let user = await storage.getUser(currentUserId);
      if (!user) {
        console.log(`[${requestId}] Creating new user ${currentUserId}`);
        user = await storage.createUser({
          username: `user_${currentUserId}`,
          password: 'temp_password_123'
        });
      }

      // Check question limit for free users
      const limitCheck = await storage.checkQuestionLimit(currentUserId);
      console.log(`[${requestId}] User ${currentUserId} limit check: ${limitCheck.remaining}/${limitCheck.limit}, canAsk: ${limitCheck.canAsk}`);
      
      if (!limitCheck.canAsk) {
        console.log(`[${requestId}] User ${currentUserId} rate limited`);
        return res.status(429).json({
          code: "RATE_LIMIT_EXCEEDED",
          message: "You've reached the end of your free trial. Upgrade to continue.",
          remaining: limitCheck.remaining,
          limit: limitCheck.limit
        });
      }

      // Increment question count for free users
      await storage.incrementQuestionCount(currentUserId);
      
      // Get updated limit check after incrementing
      const updatedLimitCheck = await storage.checkQuestionLimit(currentUserId);
      console.log(`[${requestId}] User ${currentUserId} updated limit: ${updatedLimitCheck.remaining}/${updatedLimitCheck.limit}`);

      const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
      if (!apiKey) {
        return res.status(500).json({ error: "Server missing OPENROUTER_API_KEY" });
      }

      // Use the unified MoodyBot system prompt
      const systemPrompt = systemPromptManager.getSystemPrompt();
      
      // Create the creative writer prompt
           // Build auto-selection context if provided
           let autoSelectContext = '';
           if (req.body.auto_selected && req.body.routing) {
             const routing = req.body.routing;
             autoSelectContext = `
AUTO-SELECTION ROUTING (internal context):
Form: ${routing.style}
Genre: ${routing.genre}
POV: ${routing.pov}
Tense: ${routing.tense}
Target Words: ${routing.target_words}

Use this routing to inform your creative decisions. Do not mention this routing in your output.`;
           }

           const creativeWriterPrompt = `
MODE: ${mode}
TOPIC/PREMISE: ${topic_or_premise}
AUDIENCE: ${audience}
WORD_COUNT_TARGET: ${word_count_target}
MAX_WORDS: ${max_words}
STYLE DIALS:
mood=${mood} | intensity=${intensity} | edge=${edge} | gothic_flourish=${gothic_flourish} | carebear_to_policehorse=${carebear_to_policehorse}
STRUCTURE (beats):
${structure || 'No specific structure provided'}
EXTRAS: ${extras || 'None specified'}
${autoSelectContext}

INSTRUCTIONS TO MODEL:
Generate the ${mode} in MoodyBot voice. Obey structure and word counts. No meta commentary.`;

      console.log(`[${requestId}] Calling OpenRouter API with ${max_words} max words`);
      
      const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://app.moodybot.ai",
          "X-Title": "MoodyBot"
        },
        body: JSON.stringify({
          model: "x-ai/grok-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: creativeWriterPrompt }
          ],
          temperature: 0.7,
          max_tokens: Math.min(max_words * 1.5, 8000) // Better token estimation: ~1.5 tokens per word
        }),
      });

      if (!openRouterRes.ok) {
        const errorText = await openRouterRes.text();
        console.error(`[${requestId}] OpenRouter API error (${openRouterRes.status}):`, errorText);
        
        if (openRouterRes.status === 429) {
          return res.status(429).json({
            code: "RATE_LIMIT_EXCEEDED",
            message: "AI service is rate limited. Try again in ~30s."
          });
        } else if (openRouterRes.status === 401 || openRouterRes.status === 403) {
          return res.status(502).json({
            code: "AI_SERVICE_ERROR",
            message: "AI service authentication failed"
          });
        } else if (openRouterRes.status >= 500) {
          return res.status(502).json({
            code: "AI_SERVICE_ERROR",
            message: "AI service is temporarily unavailable"
          });
        } else {
          return res.status(502).json({
            code: "AI_SERVICE_ERROR",
            message: "AI service returned an error"
          });
        }
      }

      const json = await openRouterRes.json();
      const aiReply = json.choices?.[0]?.message?.content || "Failed to generate creative content";
      const usage = json.usage || { total_tokens: 0 };
      const finishReason = json.choices?.[0]?.finish_reason || "unknown";

      // Count actual words in generated content
      const actualWordCount = aiReply.trim().split(/\s+/).length;
      const isTruncated = finishReason === "length" || actualWordCount < (word_count_target * 0.8);
      
      console.log(`[${requestId}] Generated content: ${actualWordCount} words (target: ${word_count_target}), finish_reason: ${finishReason}, truncated: ${isTruncated}`);

      // If content is truncated, attempt to complete it
      let finalContent = aiReply;
      if (isTruncated && finishReason === "length") {
        console.log(`[${requestId}] Content truncated due to token limit, attempting completion...`);
        
        try {
          // Get the last 100 words as context for completion
          const words = aiReply.trim().split(/\s+/);
          const contextWords = words.slice(-100).join(' ');
          
          const completionPrompt = `Complete this ${mode} that was cut off mid-sentence. Continue naturally from where it left off and provide a proper conclusion. Do not repeat any previous content.

Context: "${contextWords}"

Complete the ${mode} to reach approximately ${word_count_target} words total.`;

          const completionRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
              "HTTP-Referer": "https://app.moodybot.ai",
              "X-Title": "MoodyBot"
            },
            body: JSON.stringify({
              model: "x-ai/grok-4",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: completionPrompt }
              ],
              temperature: 0.7,
              max_tokens: Math.min((word_count_target - actualWordCount) * 1.5, 2000)
            }),
          });

          if (completionRes.ok) {
            const completionJson = await completionRes.json();
            const completion = completionJson.choices?.[0]?.message?.content || "";
            if (completion.trim()) {
              finalContent = aiReply + " " + completion.trim();
              console.log(`[${requestId}] Completion added: ${completion.trim().split(/\s+/).length} additional words`);
            }
          }
        } catch (completionError) {
          console.error(`[${requestId}] Completion failed:`, completionError);
        }
      }

      const finalWordCount = finalContent.trim().split(/\s+/).length;
      
      const responseData = {
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: finalContent,
        personaResolved: req.body.auto_selected ? req.body.routing : null,
        usage: {
          tokens: usage.total_tokens || 0,
          words: finalWordCount,
          target_words: word_count_target,
          completion_status: isTruncated ? (finalContent !== aiReply ? "completed" : "truncated") : "complete",
          finish_reason: finishReason
        },
        remaining: updatedLimitCheck.remaining,
        limit: updatedLimitCheck.limit
      };
      
      console.log(`[${requestId}] Sending response to client`);
      res.json(responseData);
    } catch (error: any) {
      console.error(`[${requestId}] Creative Writer API error:`, error);
      
      if (error.message?.includes('fetch')) {
        res.status(502).json({
          code: "NETWORK_ERROR",
          message: "Network error connecting to AI service"
        });
      } else if (error.message?.includes('timeout')) {
        res.status(504).json({
          code: "TIMEOUT",
          message: "Request timed out. Please try again."
        });
      } else {
        res.status(500).json({
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred"
        });
      }
    }
  });

  // Creative Writer Resume endpoint
  app.post("/api/creative-writer/resume", async (req, res) => {
    const requestId = req.headers['x-request-id'] || `resume-${Date.now()}`;
    
    try {
      const { 
        mode, 
        context, 
        target_words, 
        current_words,
        userId 
      } = req.body;
      
      console.log(`[${requestId}] Resume request: mode=${mode}, current_words=${current_words}, target_words=${target_words}`);
      
      if (!mode || !context || !target_words || !current_words) {
        return res.status(400).json({ 
          code: "MISSING_FIELDS",
          message: "Missing required fields: mode, context, target_words, current_words" 
        });
      }

      const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
      if (!apiKey) {
        return res.status(500).json({ error: "Server missing OPENROUTER_API_KEY" });
      }

      const systemPrompt = systemPromptManager.getSystemPrompt();
      const remainingWords = Math.max(0, target_words - current_words);
      
      const resumePrompt = `Complete this ${mode} that was cut off. Continue naturally from where it left off and provide a proper conclusion. Do not repeat any previous content.

Context: "${context}"

Complete the ${mode} to reach approximately ${target_words} words total (you need to add about ${remainingWords} more words).`;

      const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://app.moodybot.ai",
          "X-Title": "MoodyBot"
        },
        body: JSON.stringify({
          model: "x-ai/grok-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: resumePrompt }
          ],
          temperature: 0.7,
          max_tokens: Math.min(remainingWords * 1.5, 2000)
        }),
      });

      if (!openRouterRes.ok) {
        const errorText = await openRouterRes.text();
        console.error(`[${requestId}] OpenRouter API error (${openRouterRes.status}):`, errorText);
        return res.status(502).json({
          code: "AI_SERVICE_ERROR",
          message: "AI service returned an error"
        });
      }

      const json = await openRouterRes.json();
      const completion = json.choices?.[0]?.message?.content || "";
      const usage = json.usage || { total_tokens: 0 };
      const completionWordCount = completion.trim().split(/\s+/).length;

      console.log(`[${requestId}] Resume completion: ${completionWordCount} words added`);

      res.json({
        id: `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: completion,
        usage: {
          tokens: usage.total_tokens || 0,
          words: completionWordCount
        }
      });
    } catch (error: any) {
      console.error(`[${requestId}] Resume API error:`, error);
      res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred"
      });
    }
  });

  // Validation Mode API endpoint - MoodyBot Voice
  app.post("/api/validation", async (req, res) => {
    const requestId = req.headers['x-request-id'] || `validation-${Date.now()}`;
    
    try {
      const { 
        mode, 
        style, 
        intensity, 
        length, 
        relationship, 
        reason_tags, 
        order, 
        include_followup, 
        context_text,
        userId 
      } = req.body;
      
      console.log(`[${requestId}] Validation request: mode=${mode}, style=${style}, intensity=${intensity}, userId=${userId}`);
      
      if (!mode || !style || !context_text) {
        console.error(`[${requestId}] Missing required fields`);
        return res.status(400).json({ 
          code: "MISSING_FIELDS",
          message: "Missing required fields: mode, style, context_text" 
        });
      }

      // Validate mode
      const validModes = ['positive', 'negative', 'mixed'];
      if (!validModes.includes(mode)) {
        console.error(`[${requestId}] Invalid mode: ${mode}`);
        return res.status(400).json({ 
          code: "INVALID_MODE",
          message: "Invalid mode. Must be one of: " + validModes.join(', ') 
        });
      }

      // Validate style
      const validStyles = ['warm', 'blunt', 'playful', 'clinical', 'moodybot'];
      if (!validStyles.includes(style)) {
        console.error(`[${requestId}] Invalid style: ${style}`);
        return res.status(400).json({ 
          code: "INVALID_STYLE",
          message: "Invalid style. Must be one of: " + validStyles.join(', ') 
        });
      }

      // Default to user ID 1 if not provided (for now)
      const currentUserId = userId || 1;

      // Ensure user exists in storage
      let user = await storage.getUser(currentUserId);
      if (!user) {
        console.log(`[${requestId}] Creating new user ${currentUserId}`);
        user = await storage.createUser({
          username: `user_${currentUserId}`,
          password: 'temp_password_123'
        });
      }

      // Check question limit for free users
      const limitCheck = await storage.checkQuestionLimit(currentUserId);
      console.log(`[${requestId}] User ${currentUserId} limit check: ${limitCheck.remaining}/${limitCheck.limit}, canAsk: ${limitCheck.canAsk}`);
      
      if (!limitCheck.canAsk) {
        console.log(`[${requestId}] User ${currentUserId} rate limited`);
        return res.status(429).json({
          code: "RATE_LIMIT_EXCEEDED",
          message: "You've reached the end of your free trial. Upgrade to continue.",
          remaining: limitCheck.remaining,
          limit: limitCheck.limit
        });
      }

      // Increment question count for free users
      await storage.incrementQuestionCount(currentUserId);
      
      // Get updated limit check after incrementing
      const updatedLimitCheck = await storage.checkQuestionLimit(currentUserId);
      console.log(`[${requestId}] User ${currentUserId} updated limit: ${updatedLimitCheck.remaining}/${updatedLimitCheck.limit}`);

      const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
      if (!apiKey) {
        console.error(`[${requestId}] Missing OPENROUTER_API_KEY`);
        return res.status(500).json({ error: "Server missing OPENROUTER_API_KEY" });
      }
      console.log(`[${requestId}] API Key present: ${apiKey.substring(0, 10)}...`);

      // Simplified validation request - let MoodyBot be MoodyBot

      console.log(`[${requestId}] Calling OpenRouter API for validation`);
      
      const openRouterPayload = {
        model: "grok-4",            // Use simple model name
        stream: false,              // Prevent streaming issues
        max_tokens: 256,            // Keep it small while debugging
        temperature: 0.7,
        messages: [
          { role: "system", content: "You are MoodyBot. Return a short, human validation. No emojis." },
          { role: "user", content: context_text || "" }
        ]
      };
      
      console.log(`[${requestId}] OpenRouter payload:`, JSON.stringify(openRouterPayload, null, 2));
      
      const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.PUBLIC_APP_URL || "https://app.moodybot.ai",
          "X-Title": "MoodyBot Validation",
        },
        body: JSON.stringify(openRouterPayload),
      });

      if (!openRouterRes.ok) {
        const errorText = await openRouterRes.text();
        console.error(`[${requestId}] OpenRouter API error (${openRouterRes.status}):`, errorText);
        
        return res.status(502).json({
          error: `Upstream ${openRouterRes.status}: ${errorText.slice(0, 200)}`
        });
      }

      const raw = await openRouterRes.text();
      let data: any;
      try { 
        data = JSON.parse(raw); 
      } catch {
        console.error(`[${requestId}] Non-JSON response from OpenRouter:`, raw.slice(0, 500));
        return res.status(502).json({ 
          error: `Non-JSON upstream: ${raw.slice(0, 200)}` 
        });
      }

      if (!openRouterRes.ok) {
        const msg = data?.error?.message || raw.slice(0, 500);
        console.error(`[${requestId}] OpenRouter error:`, msg);
        return res.status(502).json({ 
          error: `Upstream ${openRouterRes.status}: ${msg}` 
        });
      }

      const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ?? // some providers use 'text'
        "";

      if (!content.trim()) {
        console.error(`[${requestId}] Empty model response. Full upstream:`, JSON.stringify(data, null, 2));
        return res.status(502).json({ 
          error: `Empty model response. Full upstream: ${JSON.stringify(data).slice(0, 500)}` 
        });
      }
      const usage = data.usage || { total_tokens: 0 };

      console.log(`[${requestId}] Generated validation response:`, content);

      console.log(`[${requestId}] Sending validation response to client`);
      res.set({ "Cache-Control": "no-store", "X-MB-Route": "validation" });
      res.json({ 
        text: content.trim(),
        remaining: updatedLimitCheck.remaining,
        limit: updatedLimitCheck.limit
      });
    } catch (error: any) {
      console.error(`[${requestId}] Validation API error:`, error);
      res.set({ "X-MB-Route": "validation" });
      
      if (error.message?.includes('fetch')) {
        res.status(502).json({
          error: "Network error connecting to AI service"
        });
      } else if (error.message?.includes('timeout')) {
        res.status(504).json({
          error: "Request timed out. Please try again."
        });
      } else {
        res.status(500).json({
          error: error?.message || "An unexpected error occurred"
        });
      }
    }
  });

  // Validation API method guards - ensure only JSON responses
  app.get("/api/validation", (req, res) => {
    res.set({ "X-MB-Route": "validation" });
    res.status(405).json({ error: "Method Not Allowed" });
  });
  
  app.head("/api/validation", (req, res) => {
    res.set({ "X-MB-Route": "validation" });
    res.status(405).json({ error: "Method Not Allowed" });
  });
  
  app.options("/api/validation", (req, res) => {
    res.set({ "X-MB-Route": "validation" });
    res.json({ ok: true });
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
