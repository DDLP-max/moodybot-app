import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/ui/bottom-nav";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Journal from "@/pages/journal";
import Cards from "@/pages/cards";
import Profile from "@/pages/profile";
import Reflect from "@/pages/reflect";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:sessionId" component={Chat} />
      <Route path="/journal" component={Journal} />
      <Route path="/cards" component={Cards} />
      <Route path="/profile" component={Profile} />
      <Route path="/reflect" component={Reflect} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground pb-20">
          <Toaster />
          <Router />
          <BottomNav />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
