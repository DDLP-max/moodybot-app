import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateChatResponse, 
  generateJournalPrompt, 
  generateQuoteCard, 
  analyzeDamagePatterns 
} from "./openai";
import { 
  insertChatSessionSchema, 
  insertChatMessageSchema, 
  insertJournalEntrySchema,
  insertQuoteCardSchema,
  insertMoodTrackingSchema,
  insertDamageProfileSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Chat Sessions
  app.get("/api/chat/sessions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getChatSessionsByUser(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });

  app.post("/api/chat/sessions", async (req, res) => {
    try {
      const sessionData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  // Chat Messages
  app.get("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const userMessage = await storage.createChatMessage(messageData);

      // Generate AI response if this was a user message
      if (messageData.role === "user") {
        const session = await storage.getChatSession(messageData.sessionId);
        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }

        // Get conversation history
        const messages = await storage.getChatMessages(messageData.sessionId);
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Generate AI response
        const aiResponse = await generateChatResponse(
          session.mode,
          messageData.content,
          conversationHistory
        );

        // Save AI response
        const aiMessage = await storage.createChatMessage({
          sessionId: messageData.sessionId,
          role: "assistant",
          content: aiResponse
        });

        res.json({ userMessage, aiMessage });
      } else {
        res.json({ userMessage });
      }
    } catch (error) {
      console.error("Chat message error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Journal Entries
  app.get("/api/journal/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const entries = await storage.getJournalEntries(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/journal", async (req, res) => {
    try {
      const entryData = insertJournalEntrySchema.parse(req.body);
      const entry = await storage.createJournalEntry(entryData);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: "Invalid journal entry data" });
    }
  });

  app.get("/api/journal/prompt", async (req, res) => {
    try {
      const mood = req.query.mood as string;
      const prompt = await generateJournalPrompt(mood);
      res.json({ prompt });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate journal prompt" });
    }
  });

  // Quote Cards
  app.get("/api/quotes/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const cards = await storage.getQuoteCards(userId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote cards" });
    }
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const cardData = insertQuoteCardSchema.parse(req.body);
      const card = await storage.createQuoteCard(cardData);
      res.json(card);
    } catch (error) {
      res.status(400).json({ error: "Invalid quote card data" });
    }
  });

  app.post("/api/quotes/generate", async (req, res) => {
    try {
      const { journalContent, userId } = req.body;
      if (!journalContent || !userId) {
        return res.status(400).json({ error: "Journal content and user ID required" });
      }

      const { quote, source } = await generateQuoteCard(journalContent);
      
      const card = await storage.createQuoteCard({
        userId: parseInt(userId),
        quote,
        source,
        imageUrl: null
      });

      res.json(card);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate quote card" });
    }
  });

  // Mood Tracking
  app.get("/api/mood/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const moods = await storage.getMoodTracking(userId);
      res.json(moods);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mood data" });
    }
  });

  app.post("/api/mood", async (req, res) => {
    try {
      const moodData = insertMoodTrackingSchema.parse(req.body);
      const mood = await storage.createMoodTracking(moodData);
      res.json(mood);
    } catch (error) {
      res.status(400).json({ error: "Invalid mood data" });
    }
  });

  // Damage Profile
  app.get("/api/damage-profile/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profile = await storage.getDamageProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Damage profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch damage profile" });
    }
  });

  app.post("/api/damage-profile/analyze", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      const userIdNum = parseInt(userId);
      
      // Get user's journal entries and mood data
      const journalEntries = await storage.getJournalEntries(userIdNum);
      const moodData = await storage.getMoodTracking(userIdNum);

      const journalTexts = journalEntries.map(entry => entry.content);
      const moodItems = moodData.map(mood => ({
        mood: mood.mood,
        intensity: mood.intensity,
        notes: mood.notes
      }));

      // Analyze patterns
      const analysis = await analyzeDamagePatterns(journalTexts, moodItems);

      // Save damage profile
      const profile = await storage.upsertDamageProfile({
        userId: userIdNum,
        patterns: analysis.patterns,
        triggers: analysis.triggers,
        loops: analysis.loops
      });

      res.json(profile);
    } catch (error) {
      console.error("Damage profile analysis error:", error);
      res.status(500).json({ error: "Failed to analyze damage patterns" });
    }
  });

  // Reflection Stacks
  app.get("/api/reflection-stacks", async (req, res) => {
    try {
      const stacks = await storage.getReflectionStacks();
      res.json(stacks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reflection stacks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
