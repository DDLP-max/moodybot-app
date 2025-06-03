import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { JournalEntry } from "@shared/schema";

export function useJournal(userId: number) {
  const [currentPrompt, setCurrentPrompt] = useState("");

  // Fetch journal entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: [`/api/journal/${userId}`],
  });

  // Generate journal prompt
  const generatePromptMutation = useMutation({
    mutationFn: async (mood?: string) => {
      const url = mood ? `/api/journal/prompt?mood=${mood}` : "/api/journal/prompt";
      const response = await apiRequest("GET", url);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentPrompt(data.prompt);
    },
  });

  // Save journal entry
  const saveEntryMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/journal", {
        userId,
        prompt: currentPrompt,
        content,
        mood: null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/journal/${userId}`] });
      setCurrentPrompt("");
    },
  });

  return {
    entries,
    currentPrompt,
    isLoading,
    generatePrompt: generatePromptMutation.mutate,
    saveEntry: saveEntryMutation.mutate,
    setCurrentPrompt,
    isGeneratingPrompt: generatePromptMutation.isPending,
    isSavingEntry: saveEntryMutation.isPending,
  };
}
