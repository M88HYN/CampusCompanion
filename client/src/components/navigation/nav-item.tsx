/*
==========================================================
File: client/src/components/navigation/nav-item.tsx

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

import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  testId?: string;
  onNavigate?: () => void;
  badgeCount?: number;
  shortcutHint?: string;
}

/*
----------------------------------------------------------
Component: NavItem

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- href: Input consumed by this routine during execution
- label: Input consumed by this routine during execution
- Icon: Input consumed by this routine during execution
- isActive: Input consumed by this routine during execution
- testId: Input consumed by this routine during execution
- onNavigate: Input consumed by this routine during execution

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
export function NavItem({ href, label, icon: Icon, isActive, testId, onNavigate, badgeCount, shortcutHint }: NavItemProps) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const showBadge = typeof badgeCount === "number" && badgeCount > 0;
  const displayedCount = typeof badgeCount === "number" ? Math.min(badgeCount, 99) : 0;

  const navLink = (
    <Link
      href={href}
      aria-label={`Go to ${label}`}
      data-testid={testId}
      onClick={onNavigate}
      className={cn(
        "group relative flex h-11 md:h-10 items-center gap-3 rounded-lg border px-3 text-sm font-medium touch-manipulation transition-all duration-300 ease-out",
        "before:absolute before:left-0 before:top-1/2 before:h-7 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:transition-all before:duration-300",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:p-[1px] after:content-['']",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isCollapsed && "justify-center px-2",
        isActive
          ? "before:bg-gradient-to-b before:from-cyan-400 before:to-indigo-500 before:opacity-100 before:scale-y-100 bg-gradient-to-r from-sidebar-accent/80 to-secondary/60 border-transparent text-sidebar-accent-foreground shadow-[0_0_14px_-6px_hsl(var(--sidebar-accent))] after:bg-gradient-to-b after:from-cyan-400/70 after:via-indigo-400/60 after:to-transparent"
          : "before:bg-sidebar-accent before:opacity-0 before:scale-y-0 border-border/50 text-muted-foreground after:bg-transparent hover:-translate-y-[1px] hover:border-sidebar-accent/45 hover:bg-gradient-to-r hover:from-sidebar-accent/25 hover:to-secondary/20 hover:text-foreground hover:shadow-sm dark:hover:from-sidebar-accent/35 dark:hover:to-secondary/25",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-indigo-500 transition-all duration-300",
          isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
        )}
      />
      <span className="inline-flex h-5 w-5 items-center justify-center shrink-0">
        <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-sidebar-accent-foreground" : "text-muted-foreground group-hover:text-foreground")} />
      </span>
      <span
        className={cn(
          "truncate transition-all duration-300 ease-out",
          isCollapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-[140px] translate-x-0 opacity-100",
        )}
      >
        {label}
      </span>
      {!isCollapsed && showBadge ? (
        <Badge className="ml-auto h-5 min-w-5 rounded-full border-0 bg-gradient-to-r from-cyan-500 to-indigo-600 px-1.5 text-[10px] font-semibold text-white">
          {displayedCount === 99 ? "99+" : displayedCount}
        </Badge>
      ) : null}
    </Link>
  );

  return (
    <li>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{navLink}</TooltipTrigger>
          <TooltipContent side="right">
            <div className="flex items-center gap-2">
              <span>{label}</span>
              {showBadge ? (
                <Badge className="h-5 min-w-5 rounded-full border-0 bg-gradient-to-r from-cyan-500 to-indigo-600 px-1.5 text-[10px] font-semibold text-white">
                  {displayedCount === 99 ? "99+" : displayedCount}
                </Badge>
              ) : null}
              {shortcutHint ? <span className="text-[10px] text-muted-foreground">{shortcutHint}</span> : null}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        navLink
      )}
    </li>
  );
}
