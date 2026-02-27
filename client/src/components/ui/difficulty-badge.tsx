import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, BookOpen, AlertCircle, Trophy } from "lucide-react";

export type CardStatus = "new" | "learning" | "struggling" | "mastered";

interface DifficultyBadgeProps {
  status: string;
  easeFactor?: number;
}

export function DifficultyBadge({ status, easeFactor }: DifficultyBadgeProps) {
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
