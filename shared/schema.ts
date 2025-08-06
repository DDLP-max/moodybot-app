import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  questionCount: integer("question_count").default(0).notNull(),
  isSubscribed: boolean("is_subscribed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  mode: text("mode").notNull(), // savage, validation, oracle, dealer
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id).notNull(),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  prompt: text("prompt").notNull(),
  content: text("content").notNull(),
  mood: text("mood"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quoteCards = pgTable("quote_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  quote: text("quote").notNull(),
  source: text("source"), // e.g., "Generated from your 2:47 AM spiral"
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moodTracking = pgTable("mood_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  mood: text("mood").notNull(),
  intensity: integer("intensity").notNull(), // 1-10
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const damageProfile = pgTable("damage_profile", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  patterns: jsonb("patterns").notNull(), // Array of pattern objects
  triggers: jsonb("triggers").notNull(), // Array of trigger objects
  loops: jsonb("loops").notNull(), // Array of loop objects
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reflectionStacks = pgTable("reflection_stacks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  prompts: jsonb("prompts").notNull(), // Array of reflection prompts
  duration: integer("duration").notNull(), // in seconds
  category: text("category").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
});

export const insertQuoteCardSchema = createInsertSchema(quoteCards).omit({
  id: true,
  createdAt: true,
});

export const insertMoodTrackingSchema = createInsertSchema(moodTracking).omit({
  id: true,
  createdAt: true,
});

export const insertDamageProfileSchema = createInsertSchema(damageProfile).omit({
  id: true,
  updatedAt: true,
});

export const insertReflectionStackSchema = createInsertSchema(reflectionStacks).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type QuoteCard = typeof quoteCards.$inferSelect;
export type InsertQuoteCard = z.infer<typeof insertQuoteCardSchema>;
export type MoodTracking = typeof moodTracking.$inferSelect;
export type InsertMoodTracking = z.infer<typeof insertMoodTrackingSchema>;
export type DamageProfile = typeof damageProfile.$inferSelect;
export type InsertDamageProfile = z.infer<typeof insertDamageProfileSchema>;
export type ReflectionStack = typeof reflectionStacks.$inferSelect;
export type InsertReflectionStack = z.infer<typeof insertReflectionStackSchema>;
