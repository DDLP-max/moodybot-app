import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MoodSelector } from "@/components/ui/mood-selector";
import { Eye, Send, Plus, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChatSession, ChatMessage } from "@shared/schema";

const MOCK_USER_ID = 1; // In real app, this would come from auth

export default function Chat() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [selectedMode, setSelectedMode] = useState("savage");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(
    sessionId ? parseInt(sessionId) : null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch chat sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: [`/api/chat/sessions/${MOCK_USER_ID}`],
  });

  // Fetch messages for current session
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/chat/messages/${currentSessionId}`],
    enabled: !!currentSessionId,
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (mode: string) => {
      const response = await apiRequest("POST", "/api/chat/sessions", {
        userId: MOCK_USER_ID,
        mode,
        title: `${mode.toUpperCase()} Session`,
      });
      return response.json();
    },
    onSuccess: (session: ChatSession) => {
      setCurrentSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: [`/api/chat/sessions/${MOCK_USER_ID}`] });
      setLocation(`/chat/${session.id}`);
    },
    onError: () => {
      toast({
        title: "Failed to create session",
        description: "The void is not responding. Try again.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentSessionId) throw new Error("No session");
      
      const response = await apiRequest("POST", "/api/chat/messages", {
        sessionId: currentSessionId,
        role: "user",
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/messages/${currentSessionId}`] });
      setMessage("");
      setTimeout(scrollToBottom, 100);
    },
    onError: () => {
      toast({
        title: "Message failed",
        description: "Your thoughts couldn't reach the void. Try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    if (!currentSessionId) {
      // Create new session first
      await createSessionMutation.mutateAsync(selectedMode);
    }

    sendMessageMutation.mutate(message);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setLocation("/chat");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!currentSessionId) {
    return (
      <div className="min-h-screen bg-background p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
            <span className="font-black text-lg gradient-text">SHADOW</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Mode Selection */}
        <div className="max-w-md mx-auto">
          <h2 className="font-black text-3xl mb-8 text-center">
            CHOOSE YOUR <span className="gradient-text">DEMON</span>
          </h2>
          
          <MoodSelector selectedMode={selectedMode} onModeSelect={setSelectedMode} />

          <Button
            className="w-full mt-8 bg-primary hover:bg-primary/80 font-black shadow-brutal hover:shadow-neon transition-all duration-300"
            onClick={() => createSessionMutation.mutate(selectedMode)}
            disabled={createSessionMutation.isPending}
          >
            {createSessionMutation.isPending ? "SUMMONING..." : "ENTER THE CONVERSATION"}
          </Button>

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold text-lg mb-4 text-center text-muted-foreground">
                RECENT SESSIONS
              </h3>
              <div className="space-y-2">
                {sessions.slice(0, 3).map((session: ChatSession) => (
                  <Card
                    key={session.id}
                    className="card-tarot cursor-pointer hover:shadow-neon transition-all duration-300"
                    onClick={() => setLocation(`/chat/${session.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-primary uppercase">
                            {session.mode}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Eye className="h-5 w-5 text-accent" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentSession = sessions.find((s: ChatSession) => s.id === currentSessionId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary/20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center">
          <div className="flex items-center space-x-2 mb-1">
            <Eye className="text-accent text-sm" />
            <span className="text-xs font-bold text-accent uppercase">
              {currentSession?.mode || "UNKNOWN"} MODE
            </span>
          </div>
          <span className="font-black text-lg gradient-text">SHADOW</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewChat}
          className="text-muted-foreground hover:text-primary"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messagesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                  <Skeleton className="h-16 w-64 rounded-lg" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Eye className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p>The void awaits your thoughts...</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg: ChatMessage) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary/20 border border-primary/30"
                        : "bg-muted border border-muted-foreground/30"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center mb-2">
                        <Eye className="text-accent mr-2 h-4 w-4" />
                        <span className="text-xs font-bold text-accent uppercase">
                          {currentSession?.mode} MODE
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {sendMessageMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted border border-muted-foreground/30 rounded-lg px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-primary/20">
        <div className="max-w-2xl mx-auto flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Speak your truth..."
            className="bg-muted border-muted-foreground/30 placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-primary hover:bg-primary/80 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
