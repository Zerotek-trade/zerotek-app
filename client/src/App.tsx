import { Switch, Route, useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Markets from "@/pages/markets";
import Trade from "@/pages/trade";
import Positions from "@/pages/positions";
import Agent from "@/pages/agent";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import Faucet from "@/pages/faucet";
import Guidebook from "@/pages/guidebook";
import News from "@/pages/news";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Cookies from "@/pages/cookies";
import Docs from "@/pages/docs";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full relative">
        {/* film grain overlay for premium feel */}
        <div className="film-grain" aria-hidden="true" />
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 px-4 h-14 border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto scroll-smooth">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  const { user, isLoading, login } = useAuth();
  const [location] = useLocation();

  const publicRoutes = ["/", "/terms", "/privacy", "/cookies", "/docs"];
  const isPublicRoute = publicRoutes.some(route => 
    route === "/" ? location === "/" : location.startsWith(route)
  );

  // Show minimal loading state while auth loads for protected routes
  if (isLoading && !isPublicRoute) {
    return null;
  }

  // Landing page always shows landing - no auto-redirect for logged in users
  if (location === "/") {
    return <Landing />;
  }

  if (location === "/terms") return <Terms />;
  if (location === "/privacy") return <Privacy />;
  if (location === "/cookies") return <Cookies />;
  if (location === "/docs") return <Docs />;

  if (!user && location.startsWith("/app")) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="noise-overlay" />
        <div className="text-center space-y-4">
          <Brand size="lg" className="justify-center mb-6" />
          <p className="text-muted-foreground">please sign in to continue</p>
          <Button onClick={login} className="btn-premium" data-testid="button-login-prompt">
            sign in
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/app" component={Dashboard} />
        <Route path="/app/faucet" component={Faucet} />
        <Route path="/app/markets" component={Markets} />
        <Route path="/app/trade/:symbol" component={Trade} />
        <Route path="/app/positions" component={Positions} />
        <Route path="/app/agent" component={Agent} />
        <Route path="/app/news" component={News} />
        <Route path="/app/history" component={History} />
        <Route path="/app/guidebook" component={Guidebook} />
        <Route path="/app/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
