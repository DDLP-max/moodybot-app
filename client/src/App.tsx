import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QuestionLimitProvider } from "./hooks/use-question-limit";
import Router from "./router"; // or just inline it above

function App() {
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
