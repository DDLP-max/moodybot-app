import {
  users,
  chatSessions,
  chatMessages,
  journalEntries,
  quoteCards,
  moodTracking,
  damageProfile,
  reflectionStacks,
  type User,
  type InsertUser,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type JournalEntry,
  type InsertJournalEntry,
  type QuoteCard,
  type InsertQuoteCard,
  type MoodTracking,
  type InsertMoodTracking,
  type DamageProfile,
  type InsertDamageProfile,
  type ReflectionStack,
  type InsertReflectionStack,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Chat Sessions
  getChatSession(id: number): Promise<ChatSession | undefined>;
  getChatSessionsByUser(userId: number): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;

  // Chat Messages
  getChatMessages(sessionId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Journal Entries
  getJournalEntries(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;

  // Quote Cards
  getQuoteCards(userId: number): Promise<QuoteCard[]>;
  createQuoteCard(card: InsertQuoteCard): Promise<QuoteCard>;

  // Mood Tracking
  getMoodTracking(userId: number): Promise<MoodTracking[]>;
  createMoodTracking(mood: InsertMoodTracking): Promise<MoodTracking>;

  // Damage Profile
  getDamageProfile(userId: number): Promise<DamageProfile | undefined>;
  upsertDamageProfile(profile: InsertDamageProfile & { userId: number }): Promise<DamageProfile>;

  // Reflection Stacks
  getReflectionStacks(): Promise<ReflectionStack[]>;
  createReflectionStack(stack: InsertReflectionStack): Promise<ReflectionStack>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private chatSessions: Map<number, ChatSession> = new Map();
  private chatMessages: Map<number, ChatMessage> = new Map();
  private journalEntries: Map<number, JournalEntry> = new Map();
  private quoteCards: Map<number, QuoteCard> = new Map();
  private moodTracking: Map<number, MoodTracking> = new Map();
  private damageProfiles: Map<number, DamageProfile> = new Map();
  private reflectionStacks: Map<number, ReflectionStack> = new Map();
  
  private userIdCounter = 1;
  private sessionIdCounter = 1;
  private messageIdCounter = 1;
  private journalIdCounter = 1;
  private quoteIdCounter = 1;
  private moodIdCounter = 1;
  private damageIdCounter = 1;
  private stackIdCounter = 1;

  constructor() {
    this.initializeReflectionStacks();
  }

  private initializeReflectionStacks() {
    const defaultStacks: InsertReflectionStack[] = [
      {
        title: "LATE NIGHT SPIRAL",
        description: "Face the 3AM thoughts",
        prompts: [
          "What truth are you avoiding right now?",
          "What pattern keeps you awake?",
          "What would you tell your past self about this moment?"
        ],
        duration: 60,
        category: "night"
      },
      {
        title: "SHAME INVENTORY",
        description: "What are you hiding?",
        prompts: [
          "What are you most ashamed of?",
          "Who would you be without this shame?",
          "What story do you tell yourself about your worth?"
        ],
        duration: 60,
        category: "shadow"
      },
      {
        title: "PATTERN BREAK",
        description: "Interrupt the loop",
        prompts: [
          "What loop are you stuck in?",
          "What would happen if you stopped?",
          "What are you gaining from this pattern?"
        ],
        duration: 60,
        category: "patterns"
      }
    ];

    defaultStacks.forEach(stack => this.createReflectionStack(stack));
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Chat Sessions
  async getChatSession(id: number): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async getChatSessionsByUser(userId: number): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values()).filter(session => session.userId === userId);
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = this.sessionIdCounter++;
    const session: ChatSession = {
      ...insertSession,
      id,
      createdAt: new Date()
    };
    this.chatSessions.set(id, session);
    return session;
  }

  // Chat Messages
  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.messageIdCounter++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Journal Entries
  async getJournalEntries(userId: number): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.journalIdCounter++;
    const entry: JournalEntry = {
      ...insertEntry,
      id,
      createdAt: new Date()
    };
    this.journalEntries.set(id, entry);
    return entry;
  }

  // Quote Cards
  async getQuoteCards(userId: number): Promise<QuoteCard[]> {
    return Array.from(this.quoteCards.values())
      .filter(card => card.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createQuoteCard(insertCard: InsertQuoteCard): Promise<QuoteCard> {
    const id = this.quoteIdCounter++;
    const card: QuoteCard = {
      ...insertCard,
      id,
      createdAt: new Date()
    };
    this.quoteCards.set(id, card);
    return card;
  }

  // Mood Tracking
  async getMoodTracking(userId: number): Promise<MoodTracking[]> {
    return Array.from(this.moodTracking.values())
      .filter(mood => mood.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createMoodTracking(insertMood: InsertMoodTracking): Promise<MoodTracking> {
    const id = this.moodIdCounter++;
    const mood: MoodTracking = {
      ...insertMood,
      id,
      createdAt: new Date()
    };
    this.moodTracking.set(id, mood);
    return mood;
  }

  // Damage Profile
  async getDamageProfile(userId: number): Promise<DamageProfile | undefined> {
    return Array.from(this.damageProfiles.values()).find(profile => profile.userId === userId);
  }

  async upsertDamageProfile(profile: InsertDamageProfile & { userId: number }): Promise<DamageProfile> {
    const existing = await this.getDamageProfile(profile.userId);
    
    if (existing) {
      const updated: DamageProfile = {
        ...existing,
        ...profile,
        updatedAt: new Date()
      };
      this.damageProfiles.set(existing.id, updated);
      return updated;
    } else {
      const id = this.damageIdCounter++;
      const newProfile: DamageProfile = {
        ...profile,
        id,
        updatedAt: new Date()
      };
      this.damageProfiles.set(id, newProfile);
      return newProfile;
    }
  }

  // Reflection Stacks
  async getReflectionStacks(): Promise<ReflectionStack[]> {
    return Array.from(this.reflectionStacks.values());
  }

  async createReflectionStack(insertStack: InsertReflectionStack): Promise<ReflectionStack> {
    const id = this.stackIdCounter++;
    const stack: ReflectionStack = {
      ...insertStack,
      id
    };
    this.reflectionStacks.set(id, stack);
    return stack;
  }
}

export const storage = new MemStorage();
