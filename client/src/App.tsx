import { Switch, Route, useLocation, Redirect } from "wouter";
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import Notes from "@/pages/notes";
import Quizzes from "@/pages/quizzes";
import Flashcards from "@/pages/flashcards";
import Research from "@/pages/research";
import Revision from "@/pages/revision";
import Insights from "@/pages/insights";
import Settings from "@/pages/settings";
import Login from "@/pages/login";

console.log("[App.tsx] Module loading");

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/dashboard" component={() => <Dashboard />} />
      <Route path="/notes" component={() => <Notes />} />
      <Route path="/quizzes" component={() => <Quizzes />} />
      <Route path="/flashcards" component={() => <Flashcards />} />
      <Route path="/research" component={() => <Research />} />
      <Route path="/revision" component={() => <Revision />} />
      <Route path="/insights" component={() => <Insights />} />
      <Route path="/settings" component={() => <Settings />} />
      {/* Catch-all: redirect unknown routes to dashboard */}
      <Route>
        {() => <Redirect to="/dashboard" />}
      </Route>
    </Switch>
  );
}

function MainLayout({ onLogout }: { onLogout: () => void }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole="student" onLogout={onLogout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-3 border-b-2 border-teal-200 dark:border-teal-800 bg-gradient-to-r from-white to-teal-50 dark:from-slate-900 dark:to-teal-950 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="text-teal-600 dark:text-teal-400" />
              <h1 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent hidden sm:block">
                StudyMate
              </h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <AppRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-900 dark:to-teal-950/30">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading StudyMate...</p>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  console.log("[AuthenticatedApp] Rendering", { isLoading, isAuthenticated, location, user: user?.email });

  // Show loading screen
  if (isLoading) {
    console.log("[AuthenticatedApp] Still loading auth...");
    return <LoadingScreen />;
  }

  // Not authenticated - show login only
  if (!isAuthenticated) {
    console.log("[AuthenticatedApp] User not authenticated, showing login");
    return (
      <div className="w-full min-h-screen bg-white">
        <Switch>
          <Route path="/login" component={() => <Login />} />
          {/* Catch-all: redirect to login for all unauthenticated users */}
          <Route>
            {() => <Redirect to="/login" />}
          </Route>
        </Switch>
      </div>
    );
  }

  console.log("[AuthenticatedApp] User authenticated", { email: user?.email });

  // User is authenticated - show main app
  // If they try to access login, redirect to dashboard
  if (location === "/login") {
    return <Redirect to="/dashboard" />;
  }

  return <MainLayout onLogout={logout} />;
}

export default function App() {
  console.log("[App] Root component rendering");
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider defaultTheme="light">
            <AuthenticatedApp />
            <Toaster />
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Error Boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error:", error);
    console.error("Error Info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-red-500 mb-2">Error: {this.state.error?.message}</p>
            <p className="text-gray-600 mb-6">The application encountered an error. Please refresh the page to continue.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
