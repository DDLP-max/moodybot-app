import { Button } from "@/components/ui/button";
import { MessageCircle, Book, Image, User, Eye } from "lucide-react";
import { useLocation } from "wouter";

export function BottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/chat", icon: MessageCircle, label: "CHAT" },
    { path: "/journal", icon: Book, label: "JOURNAL" },
    { path: "/cards", icon: Image, label: "CARDS" },
    { path: "/profile", icon: User, label: "PROFILE" },
    { path: "/reflect", icon: Eye, label: "REFLECT" },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-background/90 backdrop-blur-sm border-t border-primary/20 z-50">
      <div className="flex justify-around py-3">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Button
            key={path}
            variant="ghost"
            size="sm"
            onClick={() => setLocation(path)}
            className={`flex flex-col items-center space-y-1 px-2 py-2 ${
              location === path || (path === "/chat" && location.startsWith("/chat"))
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            } transition-colors`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-bold">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
