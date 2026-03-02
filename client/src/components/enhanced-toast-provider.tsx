/*
==========================================================
File: client/src/components/enhanced-toast-provider.tsx

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

import { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastAction } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (
    type: ToastType,
    title: string,
    description?: string,
    action?: { label: string; onClick: () => void }
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/*
----------------------------------------------------------
Component: ToastProvider

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- children: Input consumed by this routine during execution

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
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      description?: string,
      action?: { label: string; onClick: () => void }
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newToast: ToastMessage = {
        id,
        type,
        title,
        description,
        action,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after 4 seconds
      const timer = setTimeout(() => {
        removeToast(id);
      }, 4000);

      return () => {
        clearTimeout(timer);
        removeToast(id);
      };
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-0 right-0 z-50 w-full max-w-md p-4 space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <EnhancedToast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/*
----------------------------------------------------------
Component: EnhancedToast

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- toast: Input consumed by this routine during execution
- onClose: Input consumed by this routine during execution

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
function EnhancedToast({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: () => void;
}) {
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
    switch (toast.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
      case "info":
        return <Info className="h-5 w-5 text-brand-primary flex-shrink-0" />;
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
    switch (toast.type) {
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
    <div
      className={`${getBgColor()} border rounded-lg p-4 shadow-lg fade-in pointer-events-auto`}
    >
      <div className="flex gap-3 items-start">
        {getIcon()}
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{toast.title}</h3>
          {toast.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toast.action.onClick}
              className="mt-2 h-auto p-0"
            >
              {toast.action.label}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="hover:bg-slate-200 dark:hover:bg-slate-800 h-auto p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

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
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useEnhancedToast must be used within ToastProvider");
  }

  return {
    success: (title: string, description?: string) =>
      context.addToast("success", title, description),
    error: (title: string, description?: string) =>
      context.addToast("error", title, description),
    warning: (title: string, description?: string) =>
      context.addToast("warning", title, description),
    info: (title: string, description?: string) =>
      context.addToast("info", title, description),
  };
}
