import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, MessageCircle, Book, Image, User, FlipHorizontal2 } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-sm border-b border-primary/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <Eye className="text-primary text-xl" />
            <span className="font-black text-lg gradient-text">SHADOW</span>
          </div>
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
              <span className="gradient-text text-shadow-neon">SHADOW</span>
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

        {/* Features Grid */}
        <section className="px-4 py-12">
          <h2 className="font-black text-3xl mb-8 text-center">
            TOOLS FOR <span className="gradient-text">DARKNESS</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Chat Feature */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="card-tarot shadow-brutal hover:shadow-neon transition-all duration-300 cursor-pointer"
                    onClick={() => setLocation("/chat")}>
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-accent/10 rounded mb-4 flex items-center justify-center">
                    <MessageCircle className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="font-black text-xl mb-2 gradient-text">AI COMPANION</h3>
                  <p className="text-muted-foreground text-sm mb-4">Choose your demon: Savage, Validation, Oracle, or Dealer of Truth.</p>
                  <Button variant="ghost" className="text-accent font-bold text-sm hover:text-primary p-0">
                    SUMMON →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Journal Feature */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="card-tarot shadow-brutal hover:shadow-neon transition-all duration-300 cursor-pointer"
                    onClick={() => setLocation("/journal")}>
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-br from-accent/20 to-primary/10 rounded mb-4 flex items-center justify-center">
                    <Book className="h-12 w-12 text-accent" />
                  </div>
                  <h3 className="font-black text-xl mb-2 gradient-text">DARK JOURNALING</h3>
                  <p className="text-muted-foreground text-sm mb-4">Probing questions that cut through your defenses. No surface-level gratitude bullshit.</p>
                  <Button variant="ghost" className="text-accent font-bold text-sm hover:text-primary p-0">
                    DIVE DEEPER →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quote Cards */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="card-tarot shadow-brutal hover:shadow-neon transition-all duration-300 cursor-pointer"
                    onClick={() => setLocation("/cards")}>
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-destructive/10 rounded mb-4 flex items-center justify-center">
                    <Image className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="font-black text-xl mb-2 gradient-text">QUOTE CARDS</h3>
                  <p className="text-muted-foreground text-sm mb-4">Transform your spirals into shareable truths. Raw, unfiltered, real.</p>
                  <Button variant="ghost" className="text-accent font-bold text-sm hover:text-primary p-0">
                    CREATE →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Damage Profile */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="card-tarot shadow-brutal hover:shadow-neon transition-all duration-300 cursor-pointer"
                    onClick={() => setLocation("/profile")}>
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-br from-destructive/20 to-primary/10 rounded mb-4 flex items-center justify-center">
                    <User className="h-12 w-12 text-destructive" />
                  </div>
                  <h3 className="font-black text-xl mb-2 gradient-text">DAMAGE PROFILE</h3>
                  <p className="text-muted-foreground text-sm mb-4">Map your patterns, triggers, and loops. Know your enemy: yourself.</p>
                  <Button variant="ghost" className="text-accent font-bold text-sm hover:text-primary p-0">
                    ANALYZE →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Reflection Stacks Teaser */}
        <section className="px-4 py-12 bg-muted/10">
          <h2 className="font-black text-3xl mb-8 text-center">
            1-MINUTE <span className="gradient-text">STACKS</span>
          </h2>
          
          <div className="max-w-md mx-auto space-y-4">
            <Card className="card-tarot shadow-brutal hover:shadow-neon transition-all duration-300 cursor-pointer"
                  onClick={() => setLocation("/reflect")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent/30 to-primary/20 rounded flex items-center justify-center">
                      <FlipHorizontal2 className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-accent">LATE NIGHT SPIRAL</h3>
                      <p className="text-xs text-muted-foreground">Face the 3AM thoughts</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-primary">
                    <FlipHorizontal2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setLocation("/reflect")}
              >
                EXPLORE ALL STACKS
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
