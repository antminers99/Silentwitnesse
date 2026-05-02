import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Protocol from "@/pages/protocol";
import Safety from "@/pages/safety";
import Verify from "@/pages/verify";
import Registry from "@/pages/records";
import CreateRecord from "@/pages/create";
import RecordDetail from "@/pages/record-detail";
import AdminReview from "@/pages/admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/protocol" component={Protocol} />
      <Route path="/safety" component={Safety} />
      <Route path="/records" component={Registry} />
      <Route path="/records/:packageHash" component={RecordDetail} />
      <Route path="/verify" component={Verify} />
      <Route path="/create" component={CreateRecord} />
      <Route path="/admin/review" component={AdminReview} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
