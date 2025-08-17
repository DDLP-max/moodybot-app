import { Button } from "@/components/ui/button";
import { Eye, Sparkles, Target } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-sm border-b border-primary/20">
        <div className="flex items-center justify-between px-4 py-3">
          <a 
            href="https://moodybot.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Eye className="text-primary text-xl" />
            <span className="font-black text-lg gradient-text">MoodyBot</span>
          </a>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background">
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-background to-accent/5" />
          </div>
          
          <motion.div 
            className="relative z-10 text-center px-6 w-full max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.h1 
              className="font-black text-6xl md:text-8xl mb-4 animate-pulse-slow"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2 }}
            >
              <span className="gradient-text text-shadow-neon">MoodyBot</span>
            </motion.h1>
            
            {/* MoodyBot Character Image */}
            <motion.div
              className="mb-6 px-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <img
                src="/moodybot-min.png"
                alt="MoodyBot AI Character"
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full mx-auto border-4 border-primary/20 shadow-2xl shadow-primary/20"
              />
            </motion.div>
            
            <p className="text-xl md:text-2xl font-bold mb-2 text-muted-foreground">AI FOR THE REAL YOU</p>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              No toxic positivity. No bullshit. Just brutal honesty and real growth.
            </p>
            
            {/* Chat Options */}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8 w-full px-4">
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 sm:px-8 py-4 font-black text-base sm:text-lg shadow-brutal hover:shadow-neon transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                onClick={() => setLocation("/dynamic")}
              >
                <Eye className="mr-2 h-5 w-5" />
                DYNAMIC MODE
              </Button>
              
              <Button 
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 px-6 sm:px-8 py-4 font-black text-base sm:text-lg shadow-brutal hover:shadow-neon transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                onClick={() => setLocation("/copywriter")}
              >
                <Target className="mr-2 h-5 w-5" />
                COPYWRITER MODE
              </Button>
            </div>
            
            {/* Mode Descriptions */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
              <div className="text-center p-4 bg-background/50 rounded-lg border border-primary/20">
                <h3 className="font-bold text-blue-500 mb-2 flex items-center justify-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Dynamic Mode
                </h3>
                <p className="text-xs text-muted-foreground">
                  AI-powered persona selection. MoodyBot automatically adapts to your emotional state and message content.
                </p>
              </div>
              
              <div className="text-center p-4 bg-background/50 rounded-lg border border-primary/20">
                <h3 className="font-bold text-green-500 mb-2 flex items-center justify-center">
                  <Target className="h-4 w-4 mr-2" />
                  Copywriter Mode
                </h3>
                <p className="text-xs text-muted-foreground">
                  Professional marketing copy generation using Ogilvy + Kennedy principles. Create compelling titles, hooks, CTAs, and captions.
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
