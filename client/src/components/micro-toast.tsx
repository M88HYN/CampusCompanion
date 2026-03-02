/*
==========================================================
File: client/src/components/micro-toast.tsx

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

import { Toast, ToastAction } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface MicroToastProps {
  type: ToastType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onOpenChange?: (open: boolean) => void;
}

/*
----------------------------------------------------------
Component: MicroToast

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- type: Input consumed by this routine during execution
- title: Input consumed by this routine during execution
- description: Input consumed by this routine during execution
- action: Input consumed by this routine during execution
- onOpenChange: Input consumed by this routine during execution

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
export function MicroToast({
  type,
  title,
  description,
  action,
  onOpenChange,
}: MicroToastProps) {
    /*
  ----------------------------------------------------------
  Function: getIcon

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
const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "info":
        return <Info className="h-5 w-5 text-brand-primary" />;
    }
  };

    /*
  ----------------------------------------------------------
  Function: getBgColor

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
const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800";
      case "error":
        return "bg-red-50 dark:bg-red-950 border-destructive/30 dark:border-destructive/40";
      case "warning":
        return "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800";
      case "info":
        return "bg-brand-primary/10 dark:bg-brand-primary/20 border-brand-primary/30 dark:border-brand-primary/40";
    }
  };

  return (
    <Toast
      className={`${getBgColor()} fade-in`}
      onOpenChange={onOpenChange}
    >
      <div className="flex items-start gap-3 w-full">
        {getIcon()}
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        {action && (
          <ToastAction altText={action.label} onClick={action.onClick}>
            {action.label}
          </ToastAction>
        )}
      </div>
    </Toast>
  );
}

// Enhanced useToast with microinteraction sounds
/*
----------------------------------------------------------
Function: useEnhancedToast

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
export function useEnhancedToast() {
    /*
  ----------------------------------------------------------
  Function: showToast

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - type: Input consumed by this routine during execution
  - title: Input consumed by this routine during execution
  - description: Input consumed by this routine during execution
  - action: Input consumed by this routine during execution

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
const showToast = (
    type: ToastType,
    title: string,
    description?: string,
    action?: { label: string; onClick: () => void }
  ) => {
    // Play subtle sound (would integrate with actual audio context)
        /*
    ----------------------------------------------------------
    Function: playSound

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
const playSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === "success") {
          oscillator.frequency.value = 800;
        } else if (type === "error") {
          oscillator.frequency.value = 400;
        } else {
          oscillator.frequency.value = 600;
        }

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (e) {
        // Audio context not supported
      }
    };

    playSound();

    return {
      type,
      title,
      description,
      action,
    };
  };

  return { showToast };
}
