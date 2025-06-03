import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, User, TrendingDown, Zap, RotateCcw, Brain } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DamageProfile, MoodTracking } from "@shared/schema";

const MOCK_USER_ID = 1;

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch damage profile
  const { data: damageProfile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/damage-profile/${MOCK_USER_ID}`],
    retry: false,
  });

  // Fetch mood tracking data
  const { data: moodData = [], isLoading: moodLoading } = useQuery({
    queryKey: [`/api/mood/${MOCK_USER_ID}`],
  });

  // Analyze damage patterns mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/damage-profile/analyze", {
        userId: MOCK_USER_ID,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/damage-profile/${MOCK_USER_ID}`] });
      toast({
        title: "Analysis complete",
        description: "Your patterns have been exposed.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "The void couldn't process your damage. Try again.",
        variant: "destructive",
      });
    },
  });

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return "text-green-400";
    if (intensity <= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getPatternIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "triggers":
        return <Zap className="h-4 w-4" />;
      case "loops":
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <TrendingDown className="h-4 w-4" />;
    }
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
          <User className="text-primary text-xl" />
          <span className="font-black text-lg gradient-text">PROFILE</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="text-accent hover:text-primary"
        >
          <Brain className="h-5 w-5" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Damage Analysis Button */}
        <Card className="card-tarot shadow-brutal">
          <CardContent className="p-6 text-center">
            <h2 className="font-black text-2xl mb-4">
              DAMAGE <span className="gradient-text">ANALYSIS</span>
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Map your patterns, triggers, and emotional loops. Know your enemy: yourself.
            </p>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="bg-destructive hover:bg-destructive/80 font-black shadow-brutal hover:shadow-neon transition-all duration-300"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Brain className="mr-2 h-5 w-5 animate-pulse" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 w-5" />
                  ANALYZE DAMAGE
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Damage Profile Results */}
        {profileLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : damageProfile ? (
          <div className="space-y-4">
            {/* Patterns */}
            {damageProfile.patterns && damageProfile.patterns.length > 0 && (
              <Card className="card-tarot">
                <CardContent className="p-6">
                  <h3 className="font-black text-lg mb-4 flex items-center">
                    <TrendingDown className="mr-2 h-5 w-5 text-destructive" />
                    DESTRUCTIVE <span className="gradient-text ml-1">PATTERNS</span>
                  </h3>
                  <div className="space-y-3">
                    {damageProfile.patterns.map((pattern: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-muted/20 rounded border-l-4 border-destructive"
                      >
                        <h4 className="font-bold text-sm text-destructive mb-1">
                          {pattern.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {pattern.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">Frequency:</span>
                          <Progress 
                            value={pattern.frequency * 10} 
                            className="w-20 h-2" 
                          />
                          <span className="text-xs text-destructive">
                            {pattern.frequency}/10
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Triggers */}
            {damageProfile.triggers && damageProfile.triggers.length > 0 && (
              <Card className="card-tarot">
                <CardContent className="p-6">
                  <h3 className="font-black text-lg mb-4 flex items-center">
                    <Zap className="mr-2 h-5 w-5 text-yellow-400" />
                    EMOTIONAL <span className="gradient-text ml-1">TRIGGERS</span>
                  </h3>
                  <div className="space-y-3">
                    {damageProfile.triggers.map((trigger: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-muted/20 rounded border-l-4 border-yellow-400"
                      >
                        <h4 className="font-bold text-sm text-yellow-400 mb-1">
                          {trigger.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {trigger.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">Intensity:</span>
                          <Progress 
                            value={trigger.frequency * 10} 
                            className="w-20 h-2" 
                          />
                          <span className="text-xs text-yellow-400">
                            {trigger.frequency}/10
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loops */}
            {damageProfile.loops && damageProfile.loops.length > 0 && (
              <Card className="card-tarot">
                <CardContent className="p-6">
                  <h3 className="font-black text-lg mb-4 flex items-center">
                    <RotateCcw className="mr-2 h-5 w-5 text-primary" />
                    MENTAL <span className="gradient-text ml-1">LOOPS</span>
                  </h3>
                  <div className="space-y-3">
                    {damageProfile.loops.map((loop: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-muted/20 rounded border-l-4 border-primary"
                      >
                        <h4 className="font-bold text-sm text-primary mb-1">
                          {loop.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {loop.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">Occurrence:</span>
                          <Progress 
                            value={loop.frequency * 10} 
                            className="w-20 h-2" 
                          />
                          <span className="text-xs text-primary">
                            {loop.frequency}/10
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="card-tarot">
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No damage profile yet. Start journaling and tracking moods to build your profile.
              </p>
              <div className="flex space-x-2 justify-center">
                <Button
                  onClick={() => setLocation("/journal")}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  JOURNAL
                </Button>
                <Button
                  onClick={() => analyzeMutation.mutate()}
                  className="bg-destructive hover:bg-destructive/80"
                >
                  ANALYZE
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Mood Data */}
        {moodData.length > 0 && (
          <Card className="card-tarot">
            <CardContent className="p-6">
              <h3 className="font-black text-lg mb-4">
                RECENT <span className="gradient-text">STATES</span>
              </h3>
              <ScrollArea className="max-h-64">
                <div className="space-y-3">
                  {moodData.slice(0, 10).map((mood: MoodTracking) => (
                    <div key={mood.id} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                      <div>
                        <h4 className="font-bold text-sm text-accent">{mood.mood}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(mood.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-sm ${getIntensityColor(mood.intensity)}`}>
                          {mood.intensity}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
