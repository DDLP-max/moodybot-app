"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Image, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { dynamicPersonaEngine, type PersonaAnalysis } from "@/lib/dynamicPersonaEngine";
import { useFreeResponses } from "@/hooks/useFreeResponses";
import { useSubscription } from "@/hooks/useSubscription";
import { toNumericId } from "@/lib/sessionUtils";
import ModeShell from "@/components/ModeShell";
import ModeCard from "@/components/ModeCard";
import UpgradeBanner from "@/components/UpgradeBanner";
import AppFooter from "@/components/AppFooter";
import StandardHeader from "@/components/StandardHeader";

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
  const [attachment, setAttachment] = useState<{ url: string; dataUrl: string; mime: string } | null>(null);
  const [attachError, setAttachError] = useState("");

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
        const uRes = await fetch("/api/users", { method: "GET", credentials: "include" });
        const ctype = uRes.headers.get("content-type") || "";
        const raw = await uRes.text();
        if (!uRes.ok) throw new Error(`users ${uRes.status}: ${raw.slice(0,120)}`);
        let userId: string | undefined;
        if (ctype.includes("application/json")) {
          ({ id: userId } = JSON.parse(raw));
        } else {
          throw new Error(`users returned HTML (check middleware/routes): ${raw.slice(0,120)}`);
        }
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
    mutationFn: async (payload: { text: string; imageData?: string; imageMime?: string }) => {
      if (!currentSession) {
        throw new Error("No active session");
      }

      // Analyze user input for UI persona indicator (server also auto-selects)
      const personaAnalysis = dynamicPersonaEngine.analyzeUserInput(payload.text, currentSession.userId.toString());
      setCurrentPersonaAnalysis(personaAnalysis);

      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          userId: currentSession.userId,
          message: payload.text,
          imageData: payload.imageData,
          imageMime: payload.imageMime,
          mode: "dynamic",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send message");
      }

      const data = await response.json();

      // Free-trial exhausted — surface the subscription message instead of a blank reply
      if (data.limitReached) {
        throw new Error(data.subscriptionMessage || "Free trial limit reached. Subscribe to continue.");
      }
      
      // Return the AI response
      if (data.aiMessage && data.aiMessage.content) {
        return data.aiMessage.content;
      } else if (data.aiReply) {
        return data.aiReply;
      } else {
        console.error("No AI response found in data:", data);
        throw new Error("MoodyBot returned an empty response. Please try again.");
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
      const raw = error instanceof Error ? error.message : String(error);
      const errorMessage = raw.includes("Subscribe to MoodyBot") || raw.includes("free trial")
        ? raw
        : `Sorry, I encountered an error: ${raw}`;
      
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

  const takeImageFile = (file: File | null | undefined) => {
    if (!file) return;
    const mime = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
      setAttachError("Send a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 8_000_000) {
      setAttachError("That image is too big. Send it smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setAttachment((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { url: URL.createObjectURL(file), dataUrl, mime };
      });
      setAttachError("");
    };
    reader.readAsDataURL(file);
  };

  const clearAttachment = () => {
    setAttachment((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setAttachError("");
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !attachment) return;
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

    const messageText = message.trim();
    const image = attachment;
    setMessage("");
    setAttachment(null);

    const userMessage: Message = {
      role: "user",
      content: messageText,
      image: image?.url,
      personaAnalysis: currentPersonaAnalysis || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      await sendMessageMutation.mutateAsync({
        text: messageText,
        imageData: image?.dataUrl,
        imageMime: image?.mime,
      });
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
      <StandardHeader modeLabel="DYNAMIC MODE" />

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
                    {message.image && (
                      <img src={message.image} alt="" className="mb-2 max-h-64 rounded-lg" />
                    )}
                    {message.content && (
                      <div className="mt-2">
                        {formatMessageContent(message.content)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                <p className="text-lg font-medium">Your conversational accomplice 🥃</p>
                <p className="text-sm">Send a thought, a photograph, or a screenshot.</p>
              </div>
            )}
          </div>

          {/* Composer */}
          <div
            className="border-t border-white/10 p-4 md:p-6"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              takeImageFile(event.dataTransfer.files?.[0]);
            }}
          >
            {attachment && (
              <div className="mb-3 flex items-start gap-3">
                <img src={attachment.url} alt="" className="h-24 w-24 rounded-lg object-cover" />
                <button type="button" onClick={clearAttachment} className="text-sm text-white/70 underline">
                  Remove
                </button>
              </div>
            )}
            <form className="flex items-end gap-3" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  takeImageFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="ghost"
                className="px-3 text-white"
                disabled={sendMessageMutation.isPending || isInitializing || isGated}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach an image"
              >
                <Image className="h-5 w-5" />
              </Button>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={(event) => {
                  const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
                  if (file) {
                    event.preventDefault();
                    takeImageFile(file);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 resize-y rounded-xl bg-black/30 border border-white/10 
                           placeholder-white/40 text-white p-3 min-h-[52px] focus:outline-none focus:ring-2 ring-violet-400"
                placeholder="Message MoodyBot or attach an image..."
                disabled={sendMessageMutation.isPending || isInitializing || isGated}
              />
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || isInitializing || isGated || (!message.trim() && !attachment)}
                className="px-4 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold shadow-lg"
              >
                {sendMessageMutation.isPending ? "Crafting..." : "Send"}
              </Button>
            </form>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {attachError || "JPG · PNG · WEBP"}
            </p>
          </div>
        </div>
      </ModeShell>


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
