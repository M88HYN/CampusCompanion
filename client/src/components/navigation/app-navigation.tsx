/*
==========================================================
File: client/src/components/navigation/app-navigation.tsx

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
import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User as AppUser } from "@shared/models/auth";
import { NavItem } from "./nav-item";
import { StudyMateLogo } from "./studymate-logo";
import { useAppLanguage } from "@/lib/app-language";
import { apiRequest } from "@/lib/queryClient";

interface AppNavigationProps {
  user: AppUser | null;
  onLogout: () => void;
}

/*
----------------------------------------------------------
Component: AppNavigation

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- user: Input consumed by this routine during execution
- onLogout: Input consumed by this routine during execution

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
export function AppNavigation({ user, onLogout }: AppNavigationProps) {
  const { t } = useAppLanguage();
  const [location, setLocation] = useLocation();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  const { data: notes = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/notes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notes");
      return (await response.json()) as { id: string }[];
    },
    staleTime: 30000,
  });

  const { data: dueCards = [] } = useQuery<{ id: string }[]>({
    queryKey: ["/api/cards/due"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/cards/due");
      return (await response.json()) as { id: string }[];
    },
    staleTime: 30000,
  });

  const { data: quizzes = [] } = useQuery<{ id: string; bestScore?: number | null }[]>({
    queryKey: ["/api/quizzes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/quizzes");
      return (await response.json()) as { id: string; bestScore?: number | null }[];
    },
    staleTime: 30000,
  });

  const quizzesCompleted = useMemo(() => quizzes.filter((quiz) => quiz.bestScore !== null && quiz.bestScore !== undefined).length, [quizzes]);

  const navBadges: Record<string, number | undefined> = {
    "/notes": notes.length > 0 ? notes.length : undefined,
    "/flashcards": dueCards.length > 0 ? dueCards.length : undefined,
    "/quizzes": quizzesCompleted > 0 ? quizzesCompleted : undefined,
  };

  const shortcuts: Record<string, string> = {
    "/dashboard": "Alt+1",
    "/notes": "Alt+2",
    "/flashcards": "Alt+3",
    "/quizzes": "Alt+4",
    "/insights": "Alt+5",
    "/performance": "Alt+6",
    "/profile": "Alt+7",
    "/settings": "Alt+8",
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingContext = target?.isContentEditable || ["input", "textarea", "select"].includes(tagName || "");
      if (isTypingContext) return;

      const mapping: Record<string, string> = {
        "1": "/dashboard",
        "2": "/notes",
        "3": "/flashcards",
        "4": "/quizzes",
        "5": "/insights",
        "6": "/performance",
        "7": "/profile",
        "8": "/settings",
      };

      const destination = mapping[event.key];
      if (!destination) return;

      event.preventDefault();
      setLocation(destination);
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [setLocation]);

  const sections = [
    {
      heading: t("nav.study", "STUDY"),
      items: [
        { label: t("nav.dashboard", "Dashboard"), href: "/dashboard", icon: LayoutDashboard },
        { label: t("nav.notes", "Notes"), href: "/notes", icon: BookOpen },
        { label: t("nav.revision", "Revision Aids"), href: "/revision", icon: FlaskConical },
        { label: t("nav.research", "Insight Scout"), href: "/research", icon: Search },
      ],
    },
    {
      heading: t("nav.practice", "PRACTICE"),
      items: [
        { label: t("nav.flashcards", "Flashcards"), href: "/flashcards", icon: Repeat },
        { label: t("nav.quizzes", "Quizzes"), href: "/quizzes", icon: BrainCircuit },
      ],
    },
    {
      heading: t("nav.insightsGroup", "INSIGHTS"),
      items: [
        { label: t("nav.insights", "Insights"), href: "/insights", icon: BarChart3 },
        { label: t("nav.performance", "Performance"), href: "/performance", icon: Gauge },
      ],
    },
    {
      heading: t("nav.account", "ACCOUNT"),
      items: [
        { label: t("nav.profile", "Profile"), href: "/profile", icon: User },
        { label: t("nav.settings", "Settings"), href: "/settings", icon: Settings },
      ],
    },
  ];

  const initials =
    (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <Sidebar collapsible="icon" aria-label="Primary sidebar navigation" className="border-r border-border/80 bg-surface-gradient">
      <SidebarHeader className="px-4 py-4 border-b border-border/70 bg-gradient-to-r from-background to-muted/40">
        <div className="flex items-center gap-3">
          <StudyMateLogo />
          <div
            className={`min-w-0 transition-all duration-300 ease-out ${isCollapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-[160px] translate-x-0 opacity-100"}`}
          >
            <p className="text-base font-semibold text-foreground">StudyMate</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {sections.map((section) => (
          <SidebarGroup key={section.heading} className="px-2 py-2">
            <SidebarGroupLabel className={`px-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground/90 transition-all duration-300 ease-out ${isCollapsed ? "max-h-0 -translate-y-1 overflow-hidden py-0 opacity-0" : "max-h-7 translate-y-0 opacity-100"}`}>
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
                    isActive={location === item.href || location.startsWith(`${item.href}?`) || location.startsWith(`${item.href}/`)}
                    badgeCount={navBadges[item.href]}
                    shortcutHint={shortcuts[item.href]}
                    testId={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  />
                ))}
              </ul>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 border-t border-border/70 space-y-3 bg-gradient-to-r from-background to-muted/40">
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className={`min-w-0 transition-all duration-300 ease-out ${isCollapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-[160px] translate-x-0 opacity-100"}`}>
            <p className="truncate text-sm font-medium text-foreground">
              {user?.firstName || user?.email || "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || "No email"}</p>
          </div>
        </div>

        <Button
          onClick={onLogout}
          variant="outline"
          className={`w-full transition-all duration-300 ease-out hover:-translate-y-[1px] hover:shadow-sm ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
          aria-label="Log out"
        >
          {t("common.logout", "Log out")}
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
