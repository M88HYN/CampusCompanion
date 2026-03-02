/*
==========================================================
File: client/src/components/ui/skeleton-card.tsx

Module: Flashcards and Spaced Repetition

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

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  lines?: number;
  showImage?: boolean;
}

/*
----------------------------------------------------------
Component: SkeletonCard

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- lines: Input consumed by this routine during execution
- showImage: Input consumed by this routine during execution

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
export function SkeletonCard({ lines = 3, showImage = false }: SkeletonCardProps) {
  return (
    <Card className="animate-pulse">
      {showImage && (
        <div className="h-40 bg-slate-200 dark:bg-slate-700" />
      )}
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array(lines)
          .fill(0)
          .map((_, i) => (
            <Skeleton
              key={i}
              className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
            />
          ))}
      </CardContent>
    </Card>
  );
}

/*
----------------------------------------------------------
Component: SkeletonStatCard

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
export function SkeletonStatCard() {
  return (
    <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-900 animate-pulse">
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
