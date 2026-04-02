import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";

// Layout & Pages
import { AppLayout } from "./components/layout/app-layout";
import LoginPage from "./pages/login";
import Dashboard from "./pages/dashboard";
import Inventory from "./pages/inventory";
import Reports from "./pages/reports";
import Requests from "./pages/requests";
import UsersPage from "./pages/users";
import Profile from "./pages/profile";
import Support from "./pages/support";
import Guidelines from "./pages/guidelines";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: "linear-gradient(135deg, #0a1f0e 0%, #0d3318 60%, #0a1f0e 100%)" }}
      >
        <div className="flex flex-col items-center gap-5 animate-pulse">
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10">
            <img src="/jamia.png" alt="Jamia Logo" className="w-14 h-14 object-contain" />
          </div>
          <div className="text-center">
            <p className="text-yellow-400 text-xs font-black uppercase tracking-[0.3em] mb-2">
              Initializing System
            </p>
            <p
              className="text-white text-xl font-black"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Jamia Lab Inventory
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <LoginPage />}
      </Route>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/inventory">
        <ProtectedRoute component={Inventory} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      <Route path="/requests">
        <ProtectedRoute component={Requests} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={UsersPage} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/support">
        <ProtectedRoute component={Support} />
      </Route>
      <Route path="/guidelines">
        <ProtectedRoute component={Guidelines} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
