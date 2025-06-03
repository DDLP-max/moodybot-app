import { Card, CardContent } from "@/components/ui/card";
import { Eye, Heart, Sparkles, Skull } from "lucide-react";
import { motion } from "framer-motion";

interface MoodSelectorProps {
  selectedMode: string;
  onModeSelect: (mode: string) => void;
}

const modes = [
  {
    id: "savage",
    name: "SAVAGE",
    description: "Brutal truth, no mercy",
    color: "text-accent",
    icon: Skull,
  },
  {
    id: "validation",
    name: "VALIDATION",
    description: "You're heard, deeply",
    color: "text-green-400",
    icon: Heart,
  },
  {
    id: "oracle",
    name: "ORACLE",
    description: "Wisdom from the void",
    color: "text-yellow-400",
    icon: Sparkles,
  },
  {
    id: "dealer",
    name: "DEALER",
    description: "Truth at any cost",
    color: "text-destructive",
    icon: Eye,
  },
];

export function MoodSelector({ selectedMode, onModeSelect }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {modes.map((mode, index) => {
        const Icon = mode.icon;
        const isSelected = selectedMode === mode.id;
        
        return (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className={`card-tarot cursor-pointer transition-all duration-300 ${
                isSelected
                  ? "shadow-neon border-primary/50"
                  : "shadow-brutal hover:shadow-neon"
              }`}
              onClick={() => onModeSelect(mode.id)}
            >
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-full h-24 bg-gradient-to-br from-muted/20 to-background rounded mb-4 flex items-center justify-center group-hover:animate-glitch">
                    <Icon className={`h-8 w-8 ${mode.color}`} />
                  </div>
                  <h3 className={`font-black text-lg mb-2 ${mode.color}`}>
                    {mode.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {mode.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
