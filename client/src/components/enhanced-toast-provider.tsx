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

function EnhancedToast({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: () => void;
}) {
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800";
      case "error":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
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
