import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import AppFooter from "@/components/AppFooter";

const lines = [
  "The pizza that knows you're not calling anyone else either. 🥃",
  "The sketches are still pretending the curtain has a future. 🥃",
  "Families don't guilt you for needing a day off. They just call you selfish when the guilt stops working. 🥃",
];

const writingTools = [
  { title: "Copy", detail: "Titles, hooks, and captions", href: "/copywriter" },
  { title: "Stories", detail: "Essays and longer pieces", href: "/creative-writer" },
  { title: "Read a situation", detail: "What a message is actually doing", href: "/validation" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [line, setLine] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLine((current) => (current + 1) % lines.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <nav
        className="shrink-0 border-b border-white/10 bg-background/90"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 py-2">
          <a
            href="https://moodybot.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 opacity-70 transition-opacity hover:opacity-100"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-teal-400 to-violet-500">
              <span className="text-xs font-bold text-white">M</span>
            </div>
            <span className="gradient-text text-sm font-semibold">MoodyBot</span>
          </a>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-300">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      <main className="flex flex-1 items-center justify-center px-6 py-6">
        <motion.div
          className="w-full max-w-3xl text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="mb-4 animate-pulse-slow font-black text-4xl sm:text-6xl md:text-8xl"
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <span className="gradient-text text-shadow-neon">MoodyBot</span>
          </motion.h1>

          <div className="hero-avatar-container mb-6 px-4">
            <div
              className="hero-avatar relative mx-auto overflow-visible rounded-full shadow-lg ring-1 ring-white/10"
              style={{
                width: "clamp(72px, 22vw, 112px)",
                height: "clamp(72px, 22vw, 112px)",
                aspectRatio: "1 / 1",
              }}
            >
              <div className="h-full w-full rounded-full bg-gradient-to-b from-violet-500/10 to-transparent p-1">
                <img
                  src="/moodybot-min.png"
                  alt="MoodyBot"
                  className="block h-full w-full rounded-full object-contain"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>

          <p className="mb-2 text-lg font-bold text-zinc-50 sm:text-xl md:text-2xl" style={{ color: "#fafafa" }}>
            AI has enough intelligence. It could use a personality.
          </p>
          <p className="mx-auto mb-6 max-w-md text-sm text-zinc-300 sm:text-base">
            Say something. Or show me something.
          </p>

          <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => setLocation("/dynamic")}
              className="rounded-full bg-violet-500 px-6 py-3 font-semibold text-white hover:bg-violet-400"
            >
              Talk to MoodyBot →
            </Button>
            <a
              href="https://moodybot.ai/#sees"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 hover:text-white"
            >
              See it in action →
            </a>
          </div>

          <p className="mx-auto min-h-12 max-w-xl text-base text-zinc-200 sm:text-lg" aria-live="polite">
            {lines[line]}
          </p>

          <nav className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3" aria-label="Writing tools">
            {writingTools.map((tool) => (
              <a key={tool.href} href={tool.href} className="block hover:text-white">
                <span className="block text-sm font-semibold text-zinc-200">{tool.title}</span>
                <span className="mt-1 block text-xs text-zinc-500">{tool.detail}</span>
              </a>
            ))}
          </nav>
        </motion.div>
      </main>

      <AppFooter />
    </div>
  );
}
