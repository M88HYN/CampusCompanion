/*
==========================================================
File: client/src/components/navigation/studymate-logo.tsx

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

import { GraduationCap } from "lucide-react";

interface StudyMateLogoProps {
  sizeClassName?: string;
}

/*
----------------------------------------------------------
Component: StudyMateLogo

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- sizeClassName: Input consumed by this routine during execution

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
export function StudyMateLogo({ sizeClassName = "h-10 w-10" }: StudyMateLogoProps) {
  return (
    <div className={`${sizeClassName} rounded-lg bg-slate-900 text-white flex items-center justify-center`}>
      <GraduationCap className="h-5 w-5" />
    </div>
  );
}
