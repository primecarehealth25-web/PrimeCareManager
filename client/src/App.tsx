import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import Dashboard from "@/pages/dashboard";
import Registration from "@/pages/registration";
import Billing from "@/pages/billing";
import MedicineMaster from "@/pages/medicine-master";
import TreatmentMaster from "@/pages/treatment-master";
import Reports from "@/pages/reports";
import Expenses from "@/pages/expenses";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/registration" component={Registration} />
      <Route path="/billing" component={Billing} />
      <Route path="/medicine-master" component={MedicineMaster} />
      <Route path="/treatment-master" component={TreatmentMaster} />
      <Route path="/reports" component={Reports} />
      <Route path="/expenses" component={Expenses} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main>
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
