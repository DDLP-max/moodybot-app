"use client";

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Image, X, Upload, Sparkles } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import { useMutation } from "@tanstack/react-query";
import { dynamicPersonaEngine, type PersonaAnalysis } from "@/lib/dynamicPersonaEngine";
import { useFreeReplies } from "@/features/freeReplies/useFreeReplies";
import ModeShell from "@/components/ModeShell";
import ModeCard from "@/components/ModeCard";
import AppFooter from "@/components/AppFooter";

interface Message {
  role: string;
  content: string;
  image?: string;
  imageDescription?: string;
  personaAnalysis?: PersonaAnalysis;
}

export default function DynamicPage() {
  const [location, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [currentSession, setCurrentSession] = useState<{ mode: string; sessionId: number; userId: number } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { ready, count, consume } = useFreeReplies(3);
  const [currentPersonaAnalysis, setCurrentPersonaAnalysis] = useState<PersonaAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsInitializing(true);
        console.log("Starting session initialization...");
        
        // First, try to create a default user if it doesn't exist
        let userId = 1;
        try {
          console.log("Attempting to create/get user...");
          const userResponse = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "moodybot_user",
              password: "default_password"
            }),
          });
          
          console.log("User response status:", userResponse.status);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData.userId;
            console.log("User created/retrieved with ID:", userId);
          } else {
            console.log("User creation failed, using default ID");
          }
        } catch (userError) {
          console.log("User creation error, using default ID:", userError);
        }

        // Create a new session
        console.log("Creating new session...");
        const newSessionResponse = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: userId,
            mode: "savage",
            title: "New Chat"
          }),
        });
        
        console.log("Session response status:", newSessionResponse.status);
        
        if (newSessionResponse.ok) {
          const sessionData = await newSessionResponse.json();
          console.log("Session created:", sessionData);
          setCurrentSession({
            mode: sessionData.mode,
            sessionId: sessionData.sessionId,
            userId: userId
          });
        } else {
          const errorText = await newSessionResponse.text();
          console.error("Session creation failed:", errorText);
        }

        // Refresh question limit
        refreshQuestionLimit();

      } catch (error) {
        console.error("Session initialization error:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [refreshQuestionLimit]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!currentSession) {
        throw new Error("No active session");
      }

      // Analyze user input for dynamic persona selection
      const personaAnalysis = dynamicPersonaEngine.analyzeUserInput(messageText, currentSession.userId.toString());
      setCurrentPersonaAnalysis(personaAnalysis);

      // Determine the mode to send to the backend
      const selectedMode = personaAnalysis.selectedPersonas.primary.name.toLowerCase();

      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          message: messageText,
          mode: selectedMode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send message");
      }

      const data = await response.json();
      
      // Consume one free reply
      consume();
      
      // Return the AI response
      if (data.aiMessage && data.aiMessage.content) {
        return data.aiMessage.content;
      } else if (data.aiReply) {
        return data.aiReply;
      } else {
        console.error("No AI response found in data:", data);
        return "MoodyBot is thinking...";
      }
    },
    onSuccess: async (aiReply) => {
      console.log("Message sent successfully:", aiReply);
      
      // Add only the AI response since user message was already added
      const aiMessage: Message = {
        role: "assistant",
        content: aiReply,
        personaAnalysis: currentPersonaAnalysis
      };
      
      setMessages(prev => {
        const newMessages = [...prev, aiMessage];
        return newMessages;
      });
      
      // Update performance metrics
      if (currentPersonaAnalysis && currentSession) {
        dynamicPersonaEngine.updatePerformance(
          currentSession.userId.toString(),
          currentPersonaAnalysis.selectedPersonas,
          true // Assume success for now
        );
      }
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      const errorMessage = `Sorry, I encountered an error: ${error.message}`;
      
      setMessages(prev => {
        // Check if the last message is already an error message to avoid duplicates
        if (prev.length > 0 && prev[prev.length - 1].content.includes("Sorry, I encountered an error")) {
          return prev;
        }
        // Add error message to the end
        return [...prev, { role: "assistant", content: errorMessage }];
      });
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (sendMessageMutation.isPending || isInitializing) return;
    if (!ready || count <= 0) return;

    const messageText = message;
    setMessage("");

    // Add user message immediately to show it in the chat
    const userMessage: Message = {
      role: "user",
      content: messageText,
      personaAnalysis: currentPersonaAnalysis
    };
    
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      return newMessages;
    });

    try {
      await sendMessageMutation.mutateAsync(messageText);
    } catch (error) {
      // Error handled by onError in useMutation
    }
  };

  // Format message content with proper line breaks and styling
  const formatMessageContent = (content: string) => {
    if (!content) return '';
    
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        return <br key={index} />;
      }
      
      if (trimmedLine.startsWith('*')) {
        return (
          <span key={index} className="text-gray-600 italic text-sm block">
            {trimmedLine}
          </span>
        );
      }
      
      if (trimmedLine.includes('@MoodyBotAI')) {
        // Make @MoodyBotAI clickable and hyperlinked
        const parts = trimmedLine.split('@MoodyBotAI');
        return (
          <span key={index} className="text-purple-600 font-medium block">
            {parts[0]}
            <a 
              href="https://x.com/MoodyBotAI" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              @MoodyBotAI
            </a>
            {parts[1]}
          </span>
        );
      }
      
      // Check if this looks like a title or header (short, all caps, or starts with #)
      if (trimmedLine.length < 50 && (trimmedLine === trimmedLine.toUpperCase() || trimmedLine.startsWith('#'))) {
        return (
          <span key={index} className="text-lg block">
            {trimmedLine}
          </span>
        );
      }
      
      return (
        <span key={index} className="block">
          {trimmedLine}
        </span>
      );
    });
  };

  // Persona indicator component
  const PersonaIndicator = ({ analysis }: { analysis: PersonaAnalysis }) => (
    <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
      <Sparkles className="h-3 w-3" />
      <span>{analysis.selectedPersonas.primary.name}</span>
      {analysis.selectedPersonas.secondary && (
        <>
          <span>+</span>
          <span>{analysis.selectedPersonas.secondary.name}</span>
        </>
      )}
    </div>
  );

  if (isInitializing) {
    return (
      <div className="page-scroll flex-1 bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing MoodyBot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-scroll flex-1 bg-background text-foreground">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-4">
        <PageTitle
          title="MoodyBot • Dynamic Mode"
          subtitle="Share your story, your pain, your truth — MoodyBot will adapt to you."
          back
        />

        {/* promo banner */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/20 to-fuchsia-500/20 p-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/90">
              {ready ? (
                count > 0 
                  ? `${count} free question${count === 1 ? '' : 's'} remaining`
                  : 'No free questions remaining'
              ) : 'Loading...'}
            </span>
            <Button
              onClick={() => window.open('https://moodybot.gumroad.com/l/moodybot-webapp', '_blank')}
              size="sm"
              className="rounded-lg bg-[#7A3AF9] px-3 py-1.5 text-sm font-medium hover:brightness-110"
            >
              Subscribe $9/month
            </Button>
          </div>
        </div>

        {/* main chat card */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">

        {/* Chat panel */}
        <ModeCard className="mt-6">
          {/* Message history */}
          <div className="p-4 md:p-6 min-h-[40vh]">
            <AnimatePresence>
              {messages.map((message, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div className={`inline-block max-w-[80%] p-3 rounded-none ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}>
                    {message.personaAnalysis && (
                      <PersonaIndicator analysis={message.personaAnalysis} />
                    )}
                    <div className="mt-2">
                      {formatMessageContent(message.content)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                <p className="text-lg font-medium">Welcome to Dynamic Mode</p>
                <p className="text-sm">Share your story, your pain, your truth... MoodyBot will adapt to you</p>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-white/10 p-4 md:p-6">
            <form className="flex items-end gap-3" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 resize-y rounded-none bg-black/30 border border-white/10 
                           placeholder-white/40 text-white p-3 min-h-[52px] focus:outline-none focus:ring-2 ring-violet-400"
                placeholder="Share your story, your pain, your truth... MoodyBot will adapt to you"
                disabled={sendMessageMutation.isPending || isInitializing || !ready || count <= 0}
              />
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || isInitializing || !ready || count <= 0}
                className="px-4 py-3 rounded-none bg-violet-500 hover:bg-violet-400 text-white font-semibold shadow-lg"
              >
                {sendMessageMutation.isPending ? "Crafting..." : (!ready || count <= 0) ? "Subscribe to continue" : "Send Message"}
              </Button>
            </form>
            
            {/* Dynamic Mode Instructions */}
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">
                🧠 Dynamic Mode: MoodyBot automatically selects the best persona based on your emotional state and message content
              </p>
            </div>
          </div>
        </ModeCard>
        </section>
      </div>
    </div>
  );
}
