"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Eye, Globe, Home, Menu, Share2, Twitter } from "lucide-react";
import { useLocation } from "wouter";
import { getShareUrl } from "@/config/environment";

type Props = {
  modeLabel?: string;        // e.g. "Dynamic Mode", "Copywriter Mode"
  showBack?: boolean;        // default true
};

export default function StandardHeader({ modeLabel, showBack = true }: Props) {
  const [location, setLocation] = useLocation();

  return (
    <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-surface/50">
      <div className="flex items-center space-x-3">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-primary"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Logo -> home */}
        <div
          onClick={() => setLocation("/")}
          className="flex items-center space-x-2 cursor-pointer select-none"
          title="Go to Home"
        >
          <Eye className="h-5 w-5 text-primary" />
          <span className="font-black text-lg gradient-text">MoodyBot</span>
        </div>

        {modeLabel && <span className="text-sm text-muted-foreground">• {modeLabel}</span>}
      </div>

      {/* Mobile-friendly dropdown (kills +New Chat) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>MoodyBot</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setLocation("/")}>
            <Home className="h-4 w-4 mr-2" /> Home
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open("https://moodybot.ai", "_blank")}>
            <Globe className="h-4 w-4 mr-2" /> Website
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open("https://x.com/MoodyBotAI", "_blank")}>
            <Twitter className="h-4 w-4 mr-2" /> @MoodyBotAI
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              const url = getShareUrl();
              if (navigator.share) navigator.share({ title: "MoodyBot", url });
              else navigator.clipboard.writeText(url);
            }}
          >
            <Share2 className="h-4 w-4 mr-2" /> Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}