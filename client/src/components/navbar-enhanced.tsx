/*
==========================================================
File: client/src/components/navbar-enhanced.tsx

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
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

interface NavbarProps {
  onLogout?: () => void;
  userName?: string;
}

/*
----------------------------------------------------------
Component: Navbar

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- onLogout: Input consumed by this routine during execution
- userName: Input consumed by this routine during execution

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
export function Navbar({ onLogout, userName = "Student" }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav className="sticky top-0 z-40 w-full bg-primary text-primary-foreground backdrop-blur-md border-b border-primary/80 shadow-md transition-all duration-200 ease-in-out">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 bg-secondary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">CC</span>
            </div>
            <h1 className="font-bold text-lg hidden sm:inline text-primary-foreground">
              Campus Companion
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl hover:bg-primary/80 text-primary-foreground"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-primary-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-primary-foreground" />
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-xl hover:bg-primary/80 text-primary-foreground"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-semibold mr-2">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="flex items-center gap-2 text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
