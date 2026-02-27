import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  testId?: string;
  onNavigate?: () => void;
}

export function NavItem({ href, label, icon: Icon, isActive, testId, onNavigate }: NavItemProps) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  const navLink = (
    <Link
      href={href}
      aria-label={`Go to ${label}`}
      data-testid={testId}
      onClick={onNavigate}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-300 ease-out",
        "before:absolute before:left-0 before:top-1/2 before:h-7 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:transition-all before:duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isCollapsed && "justify-center px-2",
        isActive
          ? "before:bg-sidebar-accent before:opacity-100 before:scale-y-100 bg-gradient-to-r from-sidebar-accent to-secondary text-sidebar-accent-foreground shadow-sm"
          : "before:bg-sidebar-accent before:opacity-0 before:scale-y-0 text-muted-foreground hover:-translate-y-[1px] hover:bg-gradient-to-r hover:from-sidebar-accent/25 hover:to-secondary/20 hover:text-foreground hover:shadow-sm dark:hover:from-sidebar-accent/35 dark:hover:to-secondary/25",
      )}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center shrink-0">
        <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-sidebar-accent-foreground" : "text-muted-foreground group-hover:text-foreground")} />
      </span>
      <span
        className={cn(
          "truncate transition-all duration-300 ease-out",
          isCollapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-[140px] translate-x-0 opacity-100",
        )}
      >
        {label}
      </span>
    </Link>
  );

  return (
    <li>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{navLink}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ) : (
        navLink
      )}
    </li>
  );
}
