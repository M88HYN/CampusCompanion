/*
==========================================================
File: client/src/components/theme-toggle.tsx

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

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

/*
----------------------------------------------------------
Component: ThemeToggle

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
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={`rounded-xl border transition-all duration-200 ${
        isLight
          ? "border-primary-foreground/40 bg-white/15 text-white hover:bg-white/25 shadow-sm"
          : "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
      }`}
      data-testid="button-theme-toggle"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
