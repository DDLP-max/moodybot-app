import { Button } from "@/components/ui/button";
import { Eye, Sparkles, Target, Feather, BadgeCheck, PenSquare, Scale } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import ModeCard from "@/components/ModeCard";
import AppFooter from "@/components/AppFooter";

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
            

            
            {/* TOP MODE BUTTONS */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 px-4">
              <a href="/dynamic" className="block rounded-xl p-3 text-center font-bold tracking-wide
                bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-400 shadow hover:opacity-90 transition">
                <span className="inline-flex items-center gap-2 justify-center">
                  <Eye className="h-4 w-4" /> DYNAMIC MODE
                </span>
              </a>

              <a href="/copywriter" className="block rounded-xl p-3 text-center font-bold tracking-wide
                bg-gradient-to-r from-emerald-500 to-teal-400 shadow hover:opacity-90 transition">
                <span className="inline-flex items-center gap-2 justify-center">
                  <BadgeCheck className="h-4 w-4" /> COPYWRITER MODE
                </span>
              </a>

              <a href="/creative-writer" className="block rounded-xl p-3 text-center font-bold tracking-wide
                bg-gradient-to-r from-rose-500 to-amber-400 shadow hover:opacity-90 transition">
                <span className="inline-flex items-center gap-2 justify-center">
                  <PenSquare className="h-4 w-4" /> CREATIVE WRITER MODE
                </span>
              </a>

              <a href="/validation" className="block rounded-xl p-3 text-center font-bold tracking-wide
                bg-gradient-to-r from-teal-400 to-violet-400 shadow hover:opacity-90 transition">
                <span className="inline-flex items-center gap-2 justify-center">
                  <Scale className="h-4 w-4" /> VALIDATION MODE
                </span>
              </a>
            </div>

            {/* Mode Options */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-4 mb-8">
              <ModeCard
                title="Dynamic Mode"
                icon={<Eye className="h-5 w-5 text-blue-500" />}
                description="AI-powered persona selection. MoodyBot automatically adapts to your emotional state and message content."
                href="/dynamic"
              />
              
              <ModeCard
                title="Copywriter Mode"
                icon={<Target className="h-5 w-5 text-green-500" />}
                description="From Ogilvy to Outlaw: MoodyBot's Copy Engine. Create compelling titles, hooks, CTAs, and captions with brutal honesty."
                href="/copywriter"
              />
              
              <ModeCard
                title="Creative Writer Mode"
                icon={<Feather className="h-5 w-5 text-amber-500" />}
                description="Dive-bar oracle meets copywriter. Fiction, articles, outlines, and teaser blurbs with Hank Moody swagger and Bourdain grit."
                href="/creative-writer"
              />

              <ModeCard
                title="Validation Mode"
                icon={<span className="text-rose-500 text-lg">⚖️</span>}
                description="Positive, negative, or mixed push-pull. Make people feel seen, set boundaries, or do both with precision."
                href="/validation"
              />
            </div>
          </motion.div>
        </section>
      </div>
      
      {/* Footer */}
      <AppFooter />
    </div>
  );
}
