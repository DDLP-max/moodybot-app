import { Button } from "@/components/ui/button";
import { Eye, Sparkles, Target, Feather } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-sm border-b border-primary/20" style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}>
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

      <div className="pt-16" style={{ paddingTop: 'calc(4rem + max(env(safe-area-inset-top), 0.75rem))' }}>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
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
              className="mb-6 px-4 hero-avatar-container"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <div className="relative mx-auto rounded-full ring-1 ring-white/10 shadow-lg overflow-visible hero-avatar" 
                   style={{ 
                     width: 'clamp(72px, 22vw, 112px)', 
                     height: 'clamp(72px, 22vw, 112px)',
                     aspectRatio: '1 / 1'
                   }}>
                <div className="p-1 rounded-full bg-gradient-to-b from-violet-500/10 to-transparent h-full w-full">
                  <img
                    src="/moodybot-min.png"
                    alt="MoodyBot AI Character"
                    className="w-full h-full object-contain rounded-full block"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </motion.div>
            
            <p className="text-xl md:text-2xl font-bold mb-2 text-muted-foreground">AI FOR THE REAL YOU</p>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              No toxic positivity. No bullshit. Just brutal honesty and real growth.
            </p>
            

            
            {/* Mode Options */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-4 mb-8">
              {/* Dynamic Mode */}
              <div className="flex flex-col items-center space-y-3">
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 sm:px-8 py-4 font-black text-base sm:text-lg shadow-brutal hover:shadow-neon transition-all duration-300 transform hover:scale-105 w-full"
                  onClick={() => setLocation("/dynamic")}
                >
                  <Eye className="mr-2 h-5 w-5" />
                  DYNAMIC MODE
                </Button>
              </div>
              
              {/* Copywriter Mode */}
              <div className="flex flex-col items-center space-y-3">
                <Button 
                  className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 px-6 sm:px-8 py-4 font-black text-base sm:text-lg shadow-brutal hover:shadow-neon transition-all duration-300 transform hover:scale-105 w-full"
                  onClick={() => setLocation("/copywriter")}
                >
                  <Target className="mr-2 h-5 w-5" />
                  COPYWRITER MODE
                </Button>
              </div>
              
              {/* Creative Writer Mode */}
              <div className="flex flex-col items-center space-y-3">
                <Button
                  className="bg-gradient-to-r from-red-700 to-amber-500 hover:from-red-800 hover:to-amber-600 px-6 sm:px-8 py-4 font-black text-base sm:text-lg shadow-brutal hover:shadow-neon transition-all duration-300 transform hover:scale-105 w-full"
                  onClick={() => setLocation("/creative-writer")}
                >
                  <Feather className="mr-2 h-5 w-5 text-amber-200" />
                  CREATIVE WRITER MODE
                </Button>
              </div>

              {/* Validation Mode */}
              <div className="flex flex-col items-center space-y-3">
                <Button
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 px-6 sm:px-8 py-4 font-black text-base sm:text-lg shadow-brutal hover:shadow-neon transition-all duration-300 transform hover:scale-105 w-full"
                  onClick={() => setLocation("/validation")}
                >
                  <span className="mr-2 text-rose-200 text-lg">⚖️</span>
                  VALIDATION MODE
                </Button>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
