import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Dashboard from "@/pages/dashboard";
import Registration from "@/pages/registration";
import Billing from "@/pages/billing";
import MedicineMaster from "@/pages/medicine-master";
import TreatmentMaster from "@/pages/treatment-master";
import Reports from "@/pages/reports";
import Expenses from "@/pages/expenses";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";


function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} /> 
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
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // don't run on server, only in browser
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");

    // if not logged in and not already on /login, send to login
    if (!token && location !== "/login") {
      setLocation("/login");
    }
  }, [location, setLocation]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {/* Hide navbar on login page if you want */}
          {location !== "/login" && <Navbar />}
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
