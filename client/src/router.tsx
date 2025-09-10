import { Switch, Route } from "wouter";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import SimplifiedChat from "@/components/SimplifiedChat";
import Demo from "@/pages/demo";
import Copywriter from "@/pages/copywriter";
import CreativeWriter from "@/pages/creative-writer";

import NotFound from "@/pages/not-found"; // Optional fallback

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:sessionId" component={Chat} />
      <Route path="/dynamic" component={SimplifiedChat} />
      <Route path="/demo" component={Demo} />
      <Route path="/copywriter" component={Copywriter} />
      <Route path="/creative-writer" component={CreativeWriter} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default Router;
