import { Switch, Route } from "wouter";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found"; // Optional fallback

function Router() {
  return (
     <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:sessionId" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default Router;
