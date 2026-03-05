/*
==========================================================
File: client/src/App.tsx

Module: Frontend Experience

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Shared Domain Layer

System Interaction:
- Consumes API endpoints via query/mutation utilities and renders user-facing interfaces
- Collaborates with shared types to preserve frontend-backend contract integrity

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

import { Switch, Route, useLocation, Redirect } from "wouter";
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { AppTopbar } from "@/components/navigation/app-topbar";
import { useAuth } from "@/hooks/use-auth";
import { AppLanguageProvider } from "@/lib/app-language";
import Dashboard from "@/pages/dashboard";
import Notes from "@/pages/notes";
import Quizzes from "@/pages/quizzes";
import Flashcards from "@/pages/flashcards";
import Research from "@/pages/research";
import Revision from "@/pages/revision";
import Insights from "@/pages/insights";
import Performance from "@/pages/performance";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Landing from "@/pages/landing";

console.log("[App.tsx] Module loading");

/*
----------------------------------------------------------
Component: AppRouter

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- None: Operates using closure/module state only

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
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
      <Route path="/performance" component={() => <Performance />} />
      <Route path="/profile" component={() => <Profile />} />
      <Route path="/settings" component={() => <Settings />} />
      {/* Catch-all: redirect unknown routes to dashboard */}
      <Route>
        {() => <Redirect to="/dashboard" />}
      </Route>
    </Switch>
  );
}

/*
----------------------------------------------------------
Component: MainLayout

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- user: Input consumed by this routine during execution
- onLogout: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
function MainLayout({
  user,
  onLogout,
}: {
  user: ReturnType<typeof useAuth>["user"];
  onLogout: () => void;
}) {
  const [location] = useLocation();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-svh w-full overflow-hidden bg-app-gradient">
        <AppNavigation user={user} onLogout={onLogout} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-background/80 via-background/70 to-secondary/10 backdrop-blur-[1px]">
          <AppTopbar user={user} onLogout={onLogout} />
          <main id="app-main-scroll" className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-transparent via-background/10 to-secondary/10">
            <div key={location} className="route-transition playful-route-shell page-stagger">
              <AppRouter />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

/*
----------------------------------------------------------
Component: AuthenticatedApp

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- None: Operates using closure/module state only

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
function AuthenticatedApp() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  console.log("[AuthenticatedApp] Rendering", { isLoading, isAuthenticated, location, user: user?.email });

  // Don't show splash/preload screen
  if (isLoading) {
    return location === "/login" ? (
      <div className="w-full min-h-screen bg-app-gradient">
        <Login />
      </div>
    ) : location === "/" ? (
      <Landing />
    ) : (
      <Redirect to="/" />
    );
  }

  // Not authenticated - allow public landing and login pages
  if (!isAuthenticated) {
    console.log("[AuthenticatedApp] User not authenticated, showing public entry");

    if (location === "/") {
      return <Landing />;
    }

    if (location === "/login") {
      return (
        <div className="w-full min-h-screen bg-app-gradient">
          <Login />
        </div>
      );
    }

    return <Redirect to="/" />;
  }

  console.log("[AuthenticatedApp] User authenticated", { email: user?.email });

  // User is authenticated - show main app
  // If authenticated user lands on public routes, redirect to dashboard
  if (location === "/" || location === "/login") {
    return <Redirect to="/dashboard" />;
  }

  return <MainLayout user={user} onLogout={logout} />;
}

/*
----------------------------------------------------------
Component: App

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- None: Operates using closure/module state only

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
export default function App() {
  console.log("[App] Root component rendering");
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppLanguageProvider>
            <ThemeProvider defaultTheme="light">
              <AuthenticatedApp />
              <Toaster />
            </ThemeProvider>
          </AppLanguageProvider>
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

    /*
  ----------------------------------------------------------
  Function: getDerivedStateFromError

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - error: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

    /*
  ----------------------------------------------------------
  Function: componentDidCatch

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - error: Input consumed by this routine during execution
  - errorInfo: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error:", error);
    console.error("Error Info:", errorInfo);
  }

    /*
  ----------------------------------------------------------
  Function: render

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-background">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
            <p className="text-destructive mb-2">Error: {this.state.error?.message}</p>
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
