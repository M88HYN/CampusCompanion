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

export function MicroToast({
  type,
  title,
  description,
  action,
  onOpenChange,
}: MicroToastProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
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
export function useEnhancedToast() {
  const showToast = (
    type: ToastType,
    title: string,
    description?: string,
    action?: { label: string; onClick: () => void }
  ) => {
    // Play subtle sound (would integrate with actual audio context)
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
