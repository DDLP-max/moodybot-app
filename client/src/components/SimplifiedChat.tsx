import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Plus, Image, X, Upload, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { dynamicPersonaEngine, type PersonaAnalysis } from "@/lib/dynamicPersonaEngine";
import { useQuestionLimit } from "@/hooks/use-question-limit";
import { getShareUrl } from "@/config/environment";

interface Message {
  role: string;
  content: string;
  image?: string;
  imageDescription?: string;
  personaAnalysis?: PersonaAnalysis;
}

export default function SimplifiedChat() {
  const [location, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [currentSession, setCurrentSession] = useState<{ mode: string; sessionId: number; userId: number } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { questionLimit, refreshQuestionLimit } = useQuestionLimit();
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
            console.log("User created/found:", userData);
            userId = userData.id;
          } else {
            console.error("Failed to create user, status:", userResponse.status);
            const errorText = await userResponse.text();
            console.error("User creation error:", errorText);
          }
        } catch (error) {
          console.error("Error creating/getting user:", error);
        }

        // Create a new session
        console.log("Creating new session with userId:", userId);
        const newSessionResponse = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: userId,
            mode: "dynamic", // Changed from "savage" to "dynamic"
            title: "New Chat"
          }),
        });
        
        console.log("Session response status:", newSessionResponse.status);
        
        if (newSessionResponse.ok) {
          const sessionData = await newSessionResponse.json();
          console.log("Session created successfully:", sessionData);
          setCurrentSession({
            sessionId: sessionData.id,
            userId: sessionData.userId,
            mode: sessionData.mode
          });
        } else {
          console.error("Failed to create new session, status:", newSessionResponse.status);
          const errorText = await newSessionResponse.text();
          console.error("Session creation error:", errorText);
          // Set a fallback session for testing
          setCurrentSession({
            sessionId: 1,
            userId: userId,
            mode: "dynamic"
          });
        }

        // Check question limit
        await refreshQuestionLimit(userId);

      } catch (error) {
        console.error("Session initialization error:", error);
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
          message: messageText, // Changed from 'content' to 'message' to match backend
          mode: selectedMode, // Use dynamically selected mode
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send message");
      }

      const data = await response.json();
      
      // Update question limit with the response data
      if (data.remaining !== undefined && data.limit !== undefined) {
        setQuestionLimit({
          remaining: data.remaining,
          limit: data.limit
        });
      }
      
      // Check if we got a proper AI response
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
      
      console.log("Adding AI message:", aiMessage);
      setMessages((prev) => {
        const newMessages = [...prev, aiMessage];
        console.log("Messages after adding AI:", newMessages);
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
      
      // Refresh question limit after successful request
      if (currentSession) {
        await refreshQuestionLimit(currentSession.userId);
      }
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      const errorMessage = error.message.includes("MoodyBot has gone quiet") 
        ? "MoodyBot is thinking... Please try again in a moment."
        : `Error: ${error.message}`;
      
      // Add error message without removing existing messages
      setMessages((prev) => {
        // Check if this error message is already the last message
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.content === errorMessage) {
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
    if ((questionLimit?.remaining ?? 0) <= 0) return;

    const messageText = message;
    setMessage("");

    // Add user message immediately to show it in the chat
    const userMessage: Message = {
      role: "user",
      content: messageText,
      personaAnalysis: currentPersonaAnalysis
    };
    console.log("Adding user message:", userMessage);
    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      console.log("Messages after adding user:", newMessages);
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
      
      if (trimmedLine.match(/^[🥃🎬💔🔥🧠🎭🧨📽️👑🔺✍️🛞]/)) {
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
                      <Eye className="h-3 w-3" />
      <span className="font-medium">{analysis.selectedPersonas.primary.name}</span>
      {analysis.selectedPersonas.secondary && (
        <>
          <span>+</span>
          <span>{analysis.selectedPersonas.secondary.name}</span>
        </>
      )}
      <span className="text-xs opacity-70">({Math.round(analysis.confidence * 100)}% confidence)</span>
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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
              // Use environment-aware URL: production URL in production, current location in development
              const shareUrl = getShareUrl();
              
              if (navigator.share) {
                navigator.share({
                  title: 'MoodyBot - AI Emotional Intelligence',
                  text: 'Check out MoodyBot - the AI that adapts to your emotional state and provides personalized support!',
                  url: shareUrl
                });
              } else {
                // Fallback for browsers that don't support navigator.share
                navigator.clipboard.writeText(shareUrl);
                // You could add a toast notification here
              }
            }}
            className="text-muted-foreground hover:text-primary"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/chat")}
            className="text-muted-foreground hover:text-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Premium subscription bar is now always visible above */}

      {/* Premium Subscription Bar - Always show to encourage upgrades */}
      <div className="p-3 border-b border-primary/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              🚀 Upgrade to MoodyBot Premium
            </p>
            <p className="text-xs text-muted-foreground">
              {questionLimit ? (
                questionLimit.remaining > 0 
                  ? `${questionLimit.remaining} free question${questionLimit.remaining === 1 ? '' : 's'} remaining`
                  : 'No free questions remaining'
              ) : 'Unlimited emotional intelligence upgrades'}
            </p>
          </div>
          <Button
            onClick={() => window.open('https://moodybot.gumroad.com/l/moodybot-webapp', '_blank')}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
          >
            Subscribe $9/month
          </Button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <AnimatePresence>
          {messages.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`max-w-lg mb-4 px-5 py-3 rounded-2xl shadow-lg bg-white text-black ${
                message.role === "user" ? "ml-auto" : "mr-auto"
              }`}
              style={{ wordBreak: "break-word" }}
            >
              {/* Persona indicator for user messages */}
              {message.role === "user" && message.personaAnalysis && (
                <div className="mb-2">
                  <PersonaIndicator analysis={message.personaAnalysis} />
                </div>
              )}
              
              <div className="whitespace-pre-wrap leading-relaxed">
                {formatMessageContent(message.content)}
              </div>
              
              {/* Message actions - Share button for AI responses */}
              {message.role === "assistant" && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Use environment-aware URL: production URL in production, current location in development
                      const shareUrl = getShareUrl();
                      const shareText = `"${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"\n\n- MoodyBot AI\n\nTry it yourself: ${shareUrl}`;
                      
                      if (navigator.share) {
                        navigator.share({
                          title: 'MoodyBot Response',
                          text: shareText,
                          url: shareUrl
                        });
                      } else {
                        // Fallback: copy to clipboard
                        navigator.clipboard.writeText(shareText);
                        // You could add a toast notification here
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>Share</span>
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-primary/20 bg-surface/50">
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="text"
            placeholder={questionLimit && questionLimit.remaining <= 0 ? "Subscribe to continue your journey..." : "Share your story, your pain, your truth... MoodyBot will adapt to you"}
            className="flex-1 p-3 rounded-full bg-background border border-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && message.trim()) {
                handleSendMessage();
              }
            }}
            disabled={sendMessageMutation.isPending || isInitializing || (questionLimit?.remaining ?? 0) <= 0}
          />
          
          {/* Disabled Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={true}
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary opacity-50"
            disabled={true}
            title="Image uploads temporarily disabled"
          >
            <Image className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Send Button */}
        <div className="flex justify-center">
          {(questionLimit?.remaining ?? 0) <= 0 ? (
            <Button
              onClick={() => window.open('https://moodybot.gumroad.com/l/moodybot-webapp', '_blank')}
              className="w-full md:w-auto rounded-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
            >
              Subscribe to Premium
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              className="w-full md:w-auto rounded-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={sendMessageMutation.isPending || isInitializing}
            >
              {sendMessageMutation.isPending ? "Crafting..." : "Send Message"}
            </Button>
          )}
        </div>
        
        {/* Dynamic Mode Instructions */}
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground">
            🧠 Dynamic Mode: MoodyBot automatically selects the best persona based on your emotional state and message content
          </p>
        </div>
      </div>
    </div>
  );
}
