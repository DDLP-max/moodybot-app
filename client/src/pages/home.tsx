import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
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
            className="relative z-10 text-center px-6"
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
            <p className="text-xl md:text-2xl font-bold mb-2 text-muted-foreground">AI FOR THE REAL YOU</p>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              No toxic positivity. No bullshit. Just brutal honesty and real growth.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/80 px-8 py-4 font-black text-lg shadow-brutal hover:shadow-neon transition-all duration-300 transform hover:scale-105"
              onClick={() => setLocation("/chat")}
            >
              ENTER THE VOID
            </Button>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
