import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Eye, Play, Pause, RotateCcw, Moon, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { ReflectionStack } from "@shared/schema";

export default function Reflect() {
  const [, setLocation] = useLocation();
  const [activeStack, setActiveStack] = useState<ReflectionStack | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  // Fetch reflection stacks
  const { data: stacks = [], isLoading } = useQuery({
    queryKey: ["/api/reflection-stacks"],
  });

  const startReflection = (stack: ReflectionStack) => {
    setActiveStack(stack);
    setCurrentPromptIndex(0);
    setTimeLeft(stack.duration);
    setIsRunning(true);
  };

  const stopReflection = () => {
    setActiveStack(null);
    setCurrentPromptIndex(0);
    setIsRunning(false);
    setTimeLeft(60);
  };

  const nextPrompt = () => {
    if (activeStack && currentPromptIndex < activeStack.prompts.length - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
    } else {
      stopReflection();
    }
  };

  const getStackIcon = (category: string) => {
    switch (category) {
      case "night":
        return <Moon className="h-6 w-6" />;
      case "shadow":
        return <Eye className="h-6 w-6" />;
      case "patterns":
        return <RotateCcw className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getStackColor = (category: string) => {
    switch (category) {
      case "night":
        return "text-accent";
      case "shadow":
        return "text-green-400";
      case "patterns":
        return "text-yellow-400";
      default:
        return "text-primary";
    }
  };

  // Timer effect
  useState(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            nextPrompt();
            return activeStack?.duration || 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  });

  if (activeStack) {
    const currentPrompt = activeStack.prompts[currentPromptIndex];
    const progress = ((currentPromptIndex + 1) / activeStack.prompts.length) * 100;

    return (
      <div className="min-h-screen bg-background p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={stopReflection}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="font-black text-lg gradient-text uppercase">
              {activeStack.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {currentPromptIndex + 1} of {activeStack.prompts.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={isRunning ? () => setIsRunning(false) : () => setIsRunning(true)}
            className="text-primary hover:text-accent"
          >
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="w-full h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Timer */}
        <motion.div
          className="text-center mb-8"
          key={timeLeft}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-6xl font-black gradient-text mb-2">
            {timeLeft}
          </div>
          <p className="text-sm text-muted-foreground">seconds remaining</p>
        </motion.div>

        {/* Current Prompt */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            key={currentPromptIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto text-center"
          >
            <Card className="card-tarot shadow-neon">
              <CardContent className="p-8">
                <h2 className="text-xl font-bold mb-6 leading-relaxed">
                  {currentPrompt}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Let this question penetrate your defenses...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={nextPrompt}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            NEXT PROMPT
          </Button>
          <Button
            variant="destructive"
            onClick={stopReflection}
          >
            END SESSION
          </Button>
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
          <Eye className="text-primary text-xl" />
          <span className="font-black text-lg gradient-text">REFLECT</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Stacks List */}
      <div className="max-w-md mx-auto">
        <h2 className="font-black text-3xl mb-8 text-center">
          1-MINUTE <span className="gradient-text">STACKS</span>
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {stacks.map((stack: ReflectionStack, index: number) => (
                <motion.div
                  key={stack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="card-tarot shadow-brutal hover:shadow-neon transition-all duration-300 cursor-pointer"
                    onClick={() => startReflection(stack)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`${getStackColor(stack.category)}`}>
                            {getStackIcon(stack.category)}
                          </div>
                          <div>
                            <h3 className={`font-bold text-sm ${getStackColor(stack.category)} uppercase`}>
                              {stack.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {stack.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {stack.prompts.length} prompts • {stack.duration}s each
                            </p>
                          </div>
                        </div>
                        <div className="text-primary">
                          <Play className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Card className="card-tarot mt-8">
          <CardContent className="p-6 text-center">
            <Eye className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-bold text-sm mb-2">HOW IT WORKS</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Each stack contains deep reflection prompts designed to break through your mental patterns. 
              Spend one minute with each question. Let it disturb you. Let it reveal what you're hiding from yourself.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
