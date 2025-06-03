import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Book, Sparkles, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { JournalEntry } from "@shared/schema";

const MOCK_USER_ID = 1;

export default function Journal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isWriting, setIsWriting] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentEntry, setCurrentEntry] = useState("");

  // Fetch journal entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: [`/api/journal/${MOCK_USER_ID}`],
  });

  // Fetch journal prompt
  const generatePromptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/journal/prompt");
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentPrompt(data.prompt);
      setIsWriting(true);
    },
    onError: () => {
      toast({
        title: "Failed to generate prompt",
        description: "The darkness isn't speaking. Try again.",
        variant: "destructive",
      });
    },
  });

  // Save journal entry
  const saveEntryMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/journal", {
        userId: MOCK_USER_ID,
        prompt: currentPrompt,
        content,
        mood: null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/journal/${MOCK_USER_ID}`] });
      setIsWriting(false);
      setCurrentEntry("");
      setCurrentPrompt("");
      toast({
        title: "Entry saved",
        description: "Your truth has been captured.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save entry",
        description: "Your words couldn't reach the void. Try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveEntry = () => {
    if (!currentEntry.trim()) return;
    saveEntryMutation.mutate(currentEntry);
  };

  const handleStartWriting = () => {
    if (currentPrompt) {
      setIsWriting(true);
    } else {
      generatePromptMutation.mutate();
    }
  };

  const handleCancelWriting = () => {
    setIsWriting(false);
    setCurrentEntry("");
  };

  if (isWriting) {
    return (
      <div className="min-h-screen bg-background p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancelWriting}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Book className="text-primary text-xl" />
            <span className="font-black text-lg gradient-text">REFLECT</span>
          </div>
          <Button
            onClick={handleSaveEntry}
            disabled={!currentEntry.trim() || saveEntryMutation.isPending}
            className="bg-primary hover:bg-primary/80 font-bold text-sm"
          >
            SAVE
          </Button>
        </div>

        {/* Writing Interface */}
        <div className="max-w-2xl mx-auto">
          <Card className="card-tarot shadow-brutal mb-6">
            <CardContent className="p-6">
              <h3 className="font-bold text-sm text-accent mb-4 uppercase">Today's Probe</h3>
              <p className="text-sm text-foreground italic">{currentPrompt}</p>
            </CardContent>
          </Card>

          <Card className="card-tarot shadow-neon">
            <CardContent className="p-6">
              <Textarea
                value={currentEntry}
                onChange={(e) => setCurrentEntry(e.target.value)}
                placeholder="Let the darkness flow through your fingers..."
                className="min-h-[400px] bg-transparent border-none resize-none focus:ring-0 text-base"
                autoFocus
              />
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              {currentEntry.length} characters of truth
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          <Book className="text-primary text-xl" />
          <span className="font-black text-lg gradient-text">JOURNAL</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStartWriting}
          className="text-accent hover:text-primary"
          disabled={generatePromptMutation.isPending}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Start Writing Button */}
      <div className="max-w-md mx-auto mb-8">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleStartWriting}
            disabled={generatePromptMutation.isPending}
            className="w-full bg-primary hover:bg-primary/80 font-black text-lg py-6 shadow-brutal hover:shadow-neon transition-all duration-300"
          >
            {generatePromptMutation.isPending ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                CHANNELING DARKNESS...
              </>
            ) : (
              <>
                <Book className="mr-2 h-5 w-5" />
                START WRITING
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Journal Entries */}
      <div className="max-w-2xl mx-auto">
        <h2 className="font-black text-2xl mb-6 text-center">
          YOUR <span className="gradient-text">ARCHIVE</span>
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <Card className="card-tarot">
            <CardContent className="p-8 text-center">
              <Book className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Your journal awaits your first confession...
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4">
              <AnimatePresence>
                {entries.map((entry: JournalEntry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="card-tarot hover:shadow-neon transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-sm text-accent">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 italic">
                          "{entry.prompt}"
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {entry.content.length > 200
                            ? `${entry.content.substring(0, 200)}...`
                            : entry.content}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
