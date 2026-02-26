import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  testId?: string;
  onNavigate?: () => void;
}

export function NavItem({ href, label, icon: Icon, isActive, testId, onNavigate }: NavItemProps) {
  return (
    <li>
      <Link
        href={href}
        aria-label={`Go to ${label}`}
        data-testid={testId}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
          isActive
            ? "border-l-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
            : "border-l-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-teal-600 dark:text-teal-300" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200")} />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}
