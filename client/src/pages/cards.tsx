import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteCard } from "@/components/ui/quote-card";
import { ArrowLeft, Image, Plus, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuoteCard as QuoteCardType, JournalEntry } from "@shared/schema";

const MOCK_USER_ID = 1;

export default function Cards() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Fetch quote cards
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: [`/api/quotes/${MOCK_USER_ID}`],
  });

  // Fetch journal entries for card generation
  const { data: journalEntries = [] } = useQuery({
    queryKey: [`/api/journal/${MOCK_USER_ID}`],
  });

  // Generate quote card mutation
  const generateCardMutation = useMutation({
    mutationFn: async (entryContent: string) => {
      const response = await apiRequest("POST", "/api/quotes/generate", {
        journalContent: entryContent,
        userId: MOCK_USER_ID,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/quotes/${MOCK_USER_ID}`] });
      setSelectedEntry(null);
      toast({
        title: "Quote card created",
        description: "Your truth has been crystallized.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to generate card",
        description: "The darkness couldn't be captured. Try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateCard = (entry: JournalEntry) => {
    generateCardMutation.mutate(entry.content);
  };

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
          <Image className="text-primary text-xl" />
          <span className="font-black text-lg gradient-text">CARDS</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Generation Section */}
      {journalEntries.length > 0 && (
        <div className="max-w-md mx-auto mb-8">
          <h2 className="font-black text-xl mb-4 text-center">
            CREATE FROM <span className="gradient-text">PAIN</span>
          </h2>
          
          <Card className="card-tarot shadow-brutal">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Transform your journal entries into shareable truth cards
              </p>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {journalEntries.slice(0, 5).map((entry: JournalEntry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-muted/20 rounded cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => handleGenerateCard(entry)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-accent">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-primary hover:text-accent"
                        disabled={generateCardMutation.isPending}
                      >
                        {generateCardMutation.isPending ? (
                          <Sparkles className="h-3 w-3 animate-spin" />
                        ) : (
                          "CREATE"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.content.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quote Cards Gallery */}
      <div className="max-w-2xl mx-auto">
        <h2 className="font-black text-2xl mb-6 text-center">
          YOUR <span className="gradient-text">TRUTH</span> COLLECTION
        </h2>

        {cardsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <Card className="card-tarot">
            <CardContent className="p-8 text-center">
              <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No quote cards yet. Start journaling to create your first truth card.
              </p>
              <Button
                onClick={() => setLocation("/journal")}
                className="bg-primary hover:bg-primary/80"
              >
                <Plus className="mr-2 h-4 w-4" />
                START JOURNALING
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {cards.map((card: QuoteCardType) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <QuoteCard
                      quote={card.quote}
                      source={card.source}
                      createdAt={card.createdAt}
                    />
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
