import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";
import Notes from "@/pages/notes";
import Quizzes from "@/pages/quizzes";
import Flashcards from "@/pages/flashcards";
import Research from "@/pages/research";
import Revision from "@/pages/revision";
import Insights from "@/pages/insights";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Dashboard />} />
      <Route path="/notes" component={() => <Notes />} />
      <Route path="/quizzes" component={() => <Quizzes />} />
      <Route path="/flashcards" component={() => <Flashcards />} />
      <Route path="/research" component={() => <Research />} />
      <Route path="/revision" component={() => <Revision />} />
      <Route path="/insights" component={() => <Insights />} />
      <Route path="/settings" component={() => <Settings />} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light">
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar userRole="student" />
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
                <main className="flex-1 overflow-hidden">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
