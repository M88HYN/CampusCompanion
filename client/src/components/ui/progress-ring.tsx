/*
==========================================================
File: client/src/components/ui/progress-ring.tsx

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

import React from "react";

interface ProgressRingProps {
  accuracy: number; // 0-100
  radius?: number;
  strokeWidth?: number;
}

/*
----------------------------------------------------------
Component: ProgressRing

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- accuracy: Input consumed by this routine during execution
- radius: Input consumed by this routine during execution
- strokeWidth: Input consumed by this routine during execution

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
export function ProgressRing({
  accuracy,
  radius = 45,
  strokeWidth = 4,
}: ProgressRingProps) {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracy / 100) * circumference;

    /*
  ----------------------------------------------------------
  Function: getColor

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - value: Input consumed by this routine during execution

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
const getColor = (value: number) => {
    if (value >= 80) return "#10b981"; // green
    if (value >= 60) return "#3b82f6"; // blue
    if (value >= 40) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={radius * 2 + strokeWidth}
          height={radius * 2 + strokeWidth}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-slate-200 dark:text-slate-700"
          />

          {/* Progress circle */}
          <circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke={getColor(accuracy)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="progress-ring-circle"
          />
        </svg>

        {/* Center text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {Math.round(accuracy)}%
          </span>
          <span className="text-xs text-muted-foreground">Accuracy</span>
        </div>
      </div>
    </div>
  );
}
