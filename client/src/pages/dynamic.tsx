"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Image, X, Upload, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { dynamicPersonaEngine, type PersonaAnalysis } from "@/lib/dynamicPersonaEngine";
import { useFreeResponses } from "@/hooks/useFreeResponses";
import { useSubscription } from "@/hooks/useSubscription";
import { getShareUrl } from "@/config/environment";
import { toNumericId } from "@/lib/sessionUtils";
import ModeShell from "@/components/ModeShell";
import ModeCard from "@/components/ModeCard";
import UpgradeBanner from "@/components/UpgradeBanner";
import FreeQuotaBanner from "@/components/FreeQuotaBanner";
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
  const [currentPersonaAnalysis, setCurrentPersonaAnalysis] = useState<PersonaAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use improved quota hooks
  const { freeLeft, isLoading: loadingFree, decrement } = useFreeResponses();
  const { isSubscribed, isLoading: loadingSub } = useSubscription();

  // Robust gating logic
  const isGated = useMemo(() => {
    return !isSubscribed && freeLeft <= 0;
  }, [isSubscribed, freeLeft]);

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsInitializing(true);
        console.log("Starting session initialization...");

        // Step 1: Get or create user ID (no body required)
        const uRes = await fetch("/api/users", { method: "GET" }); // GET or POST is fine now
        if (!uRes.ok) throw new Error(`users ${uRes.status}`);
        const { id: userId } = await uRes.json();
        if (!userId) throw new Error("No userId");

        // Emergency fallback: ensure we have a userId from cookie if API fails
        let finalUserId = userId;
        if (!finalUserId) {
          let uid = document.cookie.match(/(?:^|;)\s*mb_uid=([^;]+)/)?.[1];
          if (!uid) {
            uid = crypto.randomUUID();
            document.cookie = `mb_uid=${uid}; Path=/; Max-Age=31536000; SameSite=Lax`;
          }
          finalUserId = uid;
        }

        // Step 2: Create chat session with the userId
        const sRes = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: finalUserId, mode: "dynamic" }),
        });
        if (!sRes.ok) throw new Error(`sessions ${sRes.status}`);
        const { id: sessionId } = await sRes.json();
        
        setCurrentSession({
          mode: "dynamic",
          sessionId: toNumericId(sessionId),
          userId: toNumericId(finalUserId),
        });

      } catch (error) {
        console.error("Session initialization error:", error);
        // Don't set session on error - UI will show "No active session"
        setCurrentSession(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, []);

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
      
      // Update question limit with the response data
      if (data.remaining !== undefined && data.limit !== undefined) {
        // Quota handled by useFreeResponses hook
      }
      
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
      
      // Decrement free responses only on successful API call
      decrement();
      
      // Add only the AI response since user message was already added
      const aiMessage: Message = {
        role: "assistant",
        content: aiReply,
        personaAnalysis: currentPersonaAnalysis || undefined
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
    if (isGated) return;

    // Check for active session
    if (!currentSession) {
      console.error("No active session");
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "No active session. Please refresh to re-initialize." 
      }]);
      return;
    }

    const messageText = message;
    setMessage("");

    // Add user message immediately to show it in the chat
    const userMessage: Message = {
      role: "user",
      content: messageText,
      personaAnalysis: currentPersonaAnalysis || undefined
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing MoodyBot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-surface/50">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Eye className="text-primary text-xl" />
            <span className="font-black text-lg gradient-text">MoodyBot</span>
            <span className="text-sm text-muted-foreground">• Dynamic Mode</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* X Profile Link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('https://x.com/MoodyBotAI', '_blank')}
            className="text-muted-foreground hover:text-primary"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            @MoodyBotAI
          </Button>
          
          {/* Share Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const shareUrl = getShareUrl();
              
              if (navigator.share) {
                navigator.share({
                  title: 'MoodyBot - AI Emotional Intelligence',
                  text: 'Check out MoodyBot - the AI that adapts to your emotional state and provides personalized support!',
                  url: shareUrl
                });
              } else {
                navigator.clipboard.writeText(shareUrl);
              }
            }}
            className="text-muted-foreground hover:text-primary"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share
          </Button>
        </div>
      </div>

      <ModeShell max="4xl">
        {/* Top banner INSIDE the container */}
        <UpgradeBanner
          left={
            <span>
              {freeLeft > 0 
                ? `${freeLeft} free question${freeLeft === 1 ? '' : 's'} remaining`
                : 'No free questions remaining'
              }
            </span>
          }
          cta={
            <Button
              onClick={() => window.open('https://moodybot.gumroad.com/l/moodybot-webapp', '_blank')}
              size="sm"
              className="rounded-xl bg-fuchsia-600 px-3 py-2 text-sm font-semibold text-white hover:bg-fuchsia-500"
            >
              Subscribe $9/month
            </Button>
          }
        />

        {/* Chat panel */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl mt-6">
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
                  <div className={`inline-block max-w-[80%] p-3 rounded-xl ${
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
                className="flex-1 resize-y rounded-xl bg-black/30 border border-white/10 
                           placeholder-white/40 text-white p-3 min-h-[52px] focus:outline-none focus:ring-2 ring-violet-400"
                placeholder="Share your story, your pain, your truth... MoodyBot will adapt to you"
                disabled={sendMessageMutation.isPending || isInitializing || isGated}
              />
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || isInitializing || isGated}
                className="px-4 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold shadow-lg"
              >
                {sendMessageMutation.isPending ? "Crafting..." : "Send Message"}
              </Button>
            </form>
            
            {/* Dynamic Mode Instructions */}
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">
                🧠 Dynamic Mode: MoodyBot automatically selects the best persona based on your emotional state and message content
              </p>
            </div>
          </div>
        </div>
      </ModeShell>

      {/* Free Quota Banner */}
      <FreeQuotaBanner 
        remaining={freeLeft}
        limit={3}
        isLoading={loadingFree || loadingSub}
      />

      {/* Subscribe CTA when gated */}
      {isGated && (
        <div className="rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-700/60 p-4 text-sm text-center">
          You've used your 3 free replies. Subscribe to continue.
        </div>
      )}

      <AppFooter />
    </div>
  );
}
