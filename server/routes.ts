import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./moodybot"; // or "./openai" if that's still the active filename
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

  // TODO: Re-enable when OpenRouter supports vision models
  // Image test endpoint
  // app.post("/api/test-image", async (req, res) => {
  //   try {
  //     const { image } = req.body;
  //     if (!image) {
  //       return res.status(400).json({ error: "No image provided" });
  //     }
  //     
  //     console.log("Testing image processing:", {
  //       hasImage: !!image,
  //       imageLength: image.length,
  //       imageStartsWithData: image.startsWith('data:')
  //     });
  //     
  //     res.json({ 
  //       message: "Image received successfully", 
  //       imageLength: image.length,
  //       imageFormat: image.startsWith('data:') ? 'data-url' : 'base64'
  //     });
  //   } catch (error) {
  //     console.error("Image test error:", error);
  //     res.status(500).json({ error: "Image test failed" });
  //   }
  // });

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
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid session data" });
      }
    }
  });

  // Fetch messages from a session
  app.get("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send user message and generate AI reply
  app.post("/api/chat/messages", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      
      if (messageData.role === "user") {
        const session = await storage.getChatSession(messageData.sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });

        // Check question limit for free users
        const limitCheck = await storage.checkQuestionLimit(session.userId);
        
        if (!limitCheck.canAsk) {
          // User has reached the limit, return subscription prompt
          const subscriptionMessage = await storage.createChatMessage({
            sessionId: messageData.sessionId,
            role: "assistant",
            content: `*Camera pans to a dimly lit corner where shadows dance on empty walls*

You've reached the end of your free trial, wanderer. Three questions. That's all the universe gives for free.

*Close-up on weathered hands, turning over a coin*

The real conversations? The ones that cut deep enough to bleed truth? Those cost something. Not money. Commitment. The willingness to sit in the dark with your own demons.

*Wide shot of an empty room, one chair waiting*

MoodyBot isn't a chatbot. It's a mirror that shows you what you're afraid to see. And mirrors don't work for free.

**Subscribe to MoodyBot Premium** and unlock unlimited access to:
• 🔶 Brutal clarity, validation, roast therapy
• 🎴 Premium quote card drops  
• 🧠 Custom MoodyBot replies
• 🧃 Emotional Damage Audit access
• 🎧 Early access to voice drops and story packs
• 🛰 Access to the Premium Telegram channel

**$9/month** - The emotional intelligence upgrade your ex was never ready for.

[Subscribe Now](https://moodybot.gumroad.com/l/moodybot-webapp)

@MoodyBotAI

*Fade to black*`
          });

          return res.json({
            userMessage: messageData,
            aiMessage: subscriptionMessage,
            limitReached: true,
            remaining: limitCheck.remaining,
            limit: limitCheck.limit
          });
        }

        // Increment question count for free users
        await storage.incrementQuestionCount(session.userId);

        const userMessage = await storage.createChatMessage(messageData);

        const history = await storage.getChatMessages(messageData.sessionId);
        const conversation: ChatCompletionMessageParam[] = history.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content
        }));

        // TODO: Re-enable when OpenRouter supports vision models
        // Check if there's an image in the request
        // const imageData = req.body.image;
        let enhancedMessage = messageData.content;
        
        // console.log("Route processing:", {
        //   hasImage: !!imageData,
        //   imageLength: imageData?.length,
        //   originalMessage: messageData.content
        // });
        
        // if (imageData) {
        //   // Validate image data format
        //   if (typeof imageData !== 'string' || imageData.length === 0) {
        //     return res.status(400).json({ error: "Invalid image data" });
        //   }
        //   
        //   // Add image context to the message
        //   enhancedMessage = `[Image attached] ${messageData.content || "Analyze this image"}`;
        // }
        
        // Ensure we have some content for the message
        if (!enhancedMessage.trim()) {
          return res.status(400).json({ error: "Message content is required" });
        }

        const { aiReply, selectedMode, isAutoSelected } = await generateChatResponse(
          enhancedMessage,
          session.mode || "savage",
          session.userId,
          messageData.sessionId,
          conversation
          // TODO: Re-enable when OpenRouter supports vision models
          // imageData // Pass image data to the AI function
        );

        const aiMessage = await storage.createChatMessage({
          sessionId: messageData.sessionId,
          role: "assistant",
          content: aiReply
        });

        // Return the selected mode along with the messages
        res.json({ 
          userMessage, 
          aiMessage,
          selectedMode: selectedMode,
          isAutoSelected: isAutoSelected,
          remaining: limitCheck.remaining - 1,
          limit: limitCheck.limit
        });
      } else {
        res.json({ userMessage: messageData });
      }
    } catch (error) {
      console.error("Chat message error:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to process chat message" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
