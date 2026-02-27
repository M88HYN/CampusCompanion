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
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User as AppUser } from "@shared/models/auth";
import { NavItem } from "./nav-item";
import { StudyMateLogo } from "./studymate-logo";
import { useAppLanguage } from "@/lib/app-language";

interface AppNavigationProps {
  user: AppUser | null;
  onLogout: () => void;
}

export function AppNavigation({ user, onLogout }: AppNavigationProps) {
  const { t } = useAppLanguage();
  const [location] = useLocation();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

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
                    isActive={location === item.href}
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
    </Sidebar>
  );
}
