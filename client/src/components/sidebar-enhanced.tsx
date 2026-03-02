/*
==========================================================
File: client/src/components/sidebar-enhanced.tsx

Module: Frontend Experience

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Presentation Layer (Frontend UI)

System Interaction:
- Consumes API endpoints via query/mutation utilities and renders user-facing interfaces
- Collaborates with shared types to preserve frontend-backend contract integrity

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Brain,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  testId: string;
}

const navItems: NavItem[] = [
  {
    icon: BarChart3,
    label: "Dashboard",
    href: "/dashboard",
    testId: "nav-dashboard",
  },
  {
    icon: BookOpen,
    label: "Notes",
    href: "/notes",
    testId: "nav-notes",
  },
  {
    icon: Brain,
    label: "Flashcards",
    href: "/flashcards",
    testId: "nav-flashcards",
  },
  {
    icon: MessageSquare,
    label: "Quizzes",
    href: "/quizzes",
    testId: "nav-quizzes",
  },
  {
    icon: Settings,
    label: "Insights",
    href: "/insights",
    testId: "nav-insights",
  },
];

/*
----------------------------------------------------------
Component: SidebarEnhanced

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
export function SidebarEnhanced() {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();

  return (
    <div
      className={`transition-all duration-300 bg-card border-r border-border h-screen flex flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Toggle Button */}
      <div className="p-4 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-2 px-2">
        <TooltipProvider>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start transition-all ${
                        isActive
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      data-testid={item.testId}
                    >
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 ${
                          collapsed ? "" : "mr-3"
                        }`}
                      />
                      {!collapsed && <span>{item.label}</span>}
                      {isActive && !collapsed && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div
          className={`text-xs text-muted-foreground text-center ${
            collapsed ? "truncate" : ""
          }`}
        >
          {!collapsed && <p>Version 1.0</p>}
        </div>
      </div>
    </div>
  );
}
