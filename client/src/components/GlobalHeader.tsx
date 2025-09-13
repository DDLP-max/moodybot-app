"use client";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function GlobalHeader() {
  const [, setLocation] = useLocation();

  // guard against accidental body locks from older releases
  useEffect(() => {
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflow = "auto";
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F14]/80 backdrop-blur-md border-b border-white/10 pt-[max(10px,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2">
        {/* Row: wraps by default, single-line on sm+ */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Left: brand + mode trail (wrappable) */}
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
            >
              <span className="inline-block h-5 w-5 rounded-full bg-fuchsia-500/70" />
              <span className="text-base font-semibold">MoodyBot</span>
            </button>
            <span className="text-sm text-white/60 min-w-0 whitespace-normal break-words">
              • Dynamic Mode
            </span>
          </div>

          {/* Push actions right on sm+, allow wrap on xs */}
          <div className="sm:flex-1" />

          {/* Action buttons: hidden on very small screens (use overflow menu) */}
          <div className="hidden xs:flex flex-wrap items-center gap-2 min-w-0">
            <a
              href="https://x.com/MoodyBotAI"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21l-6.53 7.46L22.5 22h-6.9l-4.39-5.73L5.9 22H3.15l7.02-8.02L1.5 2h6.9l4.01 5.35L18.24 2Zm-2.42 18h1.87L8.27 4h-1.9l9.44 16Z"/></svg>
              <span className="hidden sm:inline">X</span>
            </a>

            <button
              onClick={() => window.open('https://moodybot.ai', '_blank')}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 8h-3v9H6v-9H3l9-8z"/></svg>
              <span className="hidden sm:inline">Website</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
              onClick={() => {
                const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://app.moodybot.ai';
                navigator.share?.({ title: "MoodyBot", url: shareUrl }).catch(()=>{});
              }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.27 3.27 0 000-1.39l7.02-4.11A3 3 0 0018 7.91a3.09 3.09 0 10-3.09-3.09A3 3 0 0016.09 7l-7.02 4.11a3.09 3.09 0 100 3.78L16.1 19a3 3 0 102-2.92z"/></svg>
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          {/* XS overflow menu (<= 400–480px) */}
          <details className="xs:hidden group relative">
            <summary className="list-none inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10 cursor-pointer">
              ⋯
            </summary>
            <div className="absolute right-0 mt-2 min-w-[160px] rounded-xl border border-white/10 bg-[#0B0F14]/95 p-2 shadow-lg">
              <a href="https://x.com/MoodyBotAI" target="_blank" rel="noreferrer" className="block px-2 py-1 text-sm rounded hover:bg-white/5">X</a>
              <button
                onClick={() => window.open('https://moodybot.ai', '_blank')}
                className="block w-full text-left px-2 py-1 text-sm rounded hover:bg-white/5"
              >
                Website
              </button>
              <button
                className="block w-full text-left px-2 py-1 text-sm rounded hover:bg-white/5"
                onClick={() => {
                  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://app.moodybot.ai';
                  navigator.share?.({ title: "MoodyBot", url: shareUrl }).catch(()=>{});
                }}
              >
                Share
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
