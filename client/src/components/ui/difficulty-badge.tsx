/*
==========================================================
File: client/src/components/ui/difficulty-badge.tsx

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

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, BookOpen, AlertCircle, Trophy } from "lucide-react";

export type CardStatus = "new" | "learning" | "struggling" | "mastered";

interface DifficultyBadgeProps {
  status: string;
  easeFactor?: number;
}

/*
----------------------------------------------------------
Component: DifficultyBadge

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- status: Input consumed by this routine during execution
- easeFactor: Input consumed by this routine during execution

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
export function DifficultyBadge({ status, easeFactor }: DifficultyBadgeProps) {
    /*
  ----------------------------------------------------------
  Function: getStatusInfo

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - status: Input consumed by this routine during execution
  - ease: Input consumed by this routine during execution

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
const getStatusInfo = (
    status: string,
    ease?: number
  ): {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
    description: string;
  } => {
    // Check ease factor first to determine struggling
    if (ease !== undefined && ease < 2.3) {
      return {
        label: "Struggling",
        color: "text-destructive dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/30 border-destructive/30 dark:border-destructive/40",
        icon: AlertCircle,
        description: "This card needs more practice. Low success rate detected.",
      };
    }

    switch (status.toLowerCase()) {
      case "new":
        return {
          label: "New",
          color: "text-brand-primary dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-900/30 border-brand-primary/30 dark:border-brand-primary/40",
          icon: BookOpen,
          description: "Fresh card - hasn't been reviewed yet.",
        };
      case "learning":
        return {
          label: "Learning",
          color: "text-orange-600 dark:text-orange-400",
          bgColor: "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
          icon: Zap,
          description: "You're learning this - reviewing regularly to build memory.",
        };
      case "mastered":
        return {
          label: "Mastered",
          color: "text-success dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900/30 border-success/30 dark:border-success/40",
          icon: Trophy,
          description: "Excellent! You've mastered this concept.",
        };
      default:
        return {
          label: "Learning",
          color: "text-orange-600 dark:text-orange-400",
          bgColor: "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
          icon: Zap,
          description: "Card is being reviewed regularly.",
        };
    }
  };

  const info = getStatusInfo(status, easeFactor);
  const Icon = info.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${info.bgColor} ${info.color} border cursor-help flex items-center gap-1`}
          >
            <Icon className="h-3 w-3" />
            {info.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
