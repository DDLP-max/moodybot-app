import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import AppFooter from "@/components/AppFooter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mode cards configuration with better icons
  const MODE_CARDS = [
    {
      title: "DYNAMIC MODE",
      icon: "⚡", // Lightning bolt for energy/adaptation
      description: "AI-powered persona selection. MoodyBot automatically adapts to your emotional state and message content.",
      color: "from-purple-500 to-indigo-500",
      href: "/dynamic"
    },
    {
      title: "COPYWRITER MODE", 
      icon: "✍️", // Writing hand instead of T
      description: "From Ogilvy to Outlaw: MoodyBot's Copy Engine. Create compelling titles, hooks, CTAs, and captions with brutal honesty.",
      color: "from-green-400 to-teal-500",
      href: "/copywriter"
    },
    {
      title: "CREATIVE WRITER MODE",
      icon: "🎭", // Drama masks for creative expression
      description: "Stories, essays, and blurbs with a sharp MoodyBot edge.",
      color: "from-orange-400 to-red-500",
      href: "/creative-writer"
    },
    {
      title: "VALIDATION MODE",
      icon: "🎯", // Target for precision validation
      description: "Positive, negative, or mixed push-pull. Make people feel seen, set boundaries, or do both with precision.",
      color: "from-teal-400 to-purple-400",
      href: "/validation"
    }
  ];

  return (
    <div 
      className="main-container min-h-screen bg-background text-foreground overflow-x-hidden"
      style={{ 
        minHeight: '100vh',
        minHeight: '100dvh', // Dynamic viewport height for mobile
        paddingTop: isMobile ? 'env(safe-area-inset-top, 20px)' : '0',
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 80px)' : '20px'
      }}
    >
      {/* Fixed Navigation Bar */}
      <nav 
        className="header fixed top-0 w-full z-50 bg-background/90 backdrop-blur-sm border-b border-primary/20" 
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 0.75rem)',
          background: 'linear-gradient(135deg, #0D1B2A 0%, #1C1C1C 100%)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <a 
            href="https://moodybot.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-violet-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
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
        <section 
          className="relative flex items-center justify-center overflow-hidden"
          style={{ 
            minHeight: isMobile ? 'calc(100vh - 4rem - env(safe-area-inset-top, 0.75rem))' : '100vh',
            paddingTop: 'max(env(safe-area-inset-top, 1rem))'
          }}
        >
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
              className="font-black text-4xl sm:text-6xl md:text-8xl mb-4 animate-pulse-slow"
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
            
            <p className="text-lg sm:text-xl md:text-2xl font-bold mb-2 text-muted-foreground">AI FOR THE REAL YOU</p>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-sm mx-auto">
              No toxic positivity. No bullshit. Just brutal honesty and real growth.
            </p>
            
            {/* Mode Options */}
            <div className="mode-cards-container max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-4 mb-8">
              {MODE_CARDS.map((mode, index) => (
                <div key={index} className="flex flex-col items-center">
                  <a 
                    href={mode.href} 
                    className={`mode-card block rounded-xl p-3 text-center font-bold tracking-wide
                      bg-gradient-to-r ${mode.color} text-white w-full py-4 shadow hover:opacity-90 transition`}
                    style={{ minHeight: '120px' }}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="text-2xl">{mode.icon}</span>
                      <span className="text-sm sm:text-base">{mode.title}</span>
                    </div>
                  </a>
                  <p className="text-xs sm:text-sm text-gray-300 mt-2 text-center leading-relaxed">
                    {mode.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>
      
      {/* Footer */}
      <AppFooter />
    </div>
  );
}
