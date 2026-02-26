import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Repeat,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User as AppUser } from "@shared/models/auth";
import { NavItem } from "./nav-item";
import { StudyMateLogo } from "./studymate-logo";

interface AppNavigationProps {
  user: AppUser | null;
  onLogout: () => void;
}

const sections = [
  {
    heading: "STUDY TOOLS",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Notes", href: "/notes", icon: BookOpen },
      { label: "Flashcards", href: "/flashcards", icon: Repeat },
      { label: "Quizzes", href: "/quizzes", icon: BrainCircuit },
      { label: "Revision Aids", href: "/revision", icon: FlaskConical },
      { label: "Insight Scout", href: "/research", icon: Search },
    ],
  },
  {
    heading: "ANALYTICS",
    items: [
      { label: "Insights", href: "/insights", icon: BarChart3 },
      { label: "Performance", href: "/performance", icon: Gauge },
    ],
  },
  {
    heading: "ACCOUNT",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AppNavigation({ user, onLogout }: AppNavigationProps) {
  const [location] = useLocation();

  const initials =
    (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <Sidebar aria-label="Primary sidebar navigation" className="border-r border-slate-200 dark:border-slate-800">
      <SidebarHeader className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <StudyMateLogo />
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900 dark:text-white">StudyMate</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {sections.map((section) => (
          <SidebarGroup key={section.heading} className="px-2 py-2">
            <SidebarGroupLabel className="px-1 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              {section.heading}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <ul className="space-y-1" aria-label={section.heading}>
                {section.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={location === item.href}
                    testId={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  />
                ))}
              </ul>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
            <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {user?.firstName || user?.email || "User"}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || "No email"}</p>
          </div>
        </div>

        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start"
          aria-label="Log out"
        >
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
