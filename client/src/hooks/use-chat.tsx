import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatSession, ChatMessage } from "@shared/schema";

export function useChat(userId: number) {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // Fetch chat sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: [`/api/chat/sessions/${userId}`],
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
        userId,
        mode,
        title: `${mode.toUpperCase()} Session`,
      });
      return response.json();
    },
    onSuccess: (session: ChatSession) => {
      setCurrentSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: [`/api/chat/sessions/${userId}`] });
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
    },
  });

  const getCurrentSession = () => {
    return sessions.find((s: ChatSession) => s.id === currentSessionId);
  };

  return {
    sessions,
    messages,
    currentSessionId,
    sessionsLoading,
    messagesLoading,
    setCurrentSessionId,
    createSession: createSessionMutation.mutate,
    sendMessage: sendMessageMutation.mutate,
    getCurrentSession,
    isCreatingSession: createSessionMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
  };
}
