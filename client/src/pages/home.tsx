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

  const writingTools = [
    { title: "Copy", href: "/copywriter" },
    { title: "Stories", href: "/creative-writer" },
    { title: "A read", href: "/validation" },
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
                    alt="MoodyBot"
                    className="w-full h-full object-contain rounded-full block"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </motion.div>
            
            <p className="text-lg sm:text-xl md:text-2xl font-bold mb-2 text-muted-foreground">AI has enough intelligence. It could use a personality.</p>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">
              Say something. Or show me something.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Button
                onClick={() => setLocation("/dynamic")}
                className="rounded-full px-6 py-3 bg-violet-500 hover:bg-violet-400 text-white font-semibold"
              >
                Talk to MoodyBot →
              </Button>
              <a
                href="https://moodybot.ai/#sees"
                className="rounded-full px-6 py-3 border border-white/20 text-sm font-semibold text-white/80 hover:text-white"
              >
                See it in action →
              </a>
            </div>

            <nav className="text-sm text-muted-foreground" aria-label="Writing tools">
              {writingTools.map((tool, index) => (
                <span key={tool.href}>
                  {index > 0 && <span className="mx-2">·</span>}
                  <a href={tool.href} className="hover:text-white">{tool.title}</a>
                </span>
              ))}
            </nav>
          </motion.div>
        </section>
      </div>
      
      {/* Footer */}
      <AppFooter />
    </div>
  );
}
