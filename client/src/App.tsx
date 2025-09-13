import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuestionLimitProvider } from "./hooks/use-question-limit";
import Router from "./router"; // or just inline it above
import { useEffect } from "react";

function App() {
  // Defensive scroll fix - ensure no scroll traps
  useEffect(() => {
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflow = 'auto';
    
    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <QuestionLimitProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <Router />
          </div>
        </QuestionLimitProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
