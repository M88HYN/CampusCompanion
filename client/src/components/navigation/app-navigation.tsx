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
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  const initials =
    (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <Sidebar collapsible="icon" aria-label="Primary sidebar navigation" className="border-r border-border transition-all duration-300 ease-in-out bg-surface-gradient">
      <SidebarHeader className="px-4 py-4 border-b border-border bg-gradient-to-r from-background to-muted/40">
        <div className="flex items-center gap-3">
          <StudyMateLogo />
          <div
            className={`min-w-0 transition-all duration-200 ${isCollapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"}`}
          >
            <p className="text-base font-semibold text-foreground">StudyMate</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {sections.map((section) => (
          <SidebarGroup key={section.heading} className="px-2 py-2">
            <SidebarGroupLabel className={`px-1 text-[11px] font-semibold tracking-wide text-muted-foreground transition-all duration-200 ${isCollapsed ? "opacity-0 max-h-0 overflow-hidden py-0" : "opacity-100"}`}>
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

      <SidebarFooter className="px-4 py-4 border-t border-border space-y-3 bg-gradient-to-r from-background to-muted/40">
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className={`min-w-0 transition-all duration-200 ${isCollapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"}`}>
            <p className="truncate text-sm font-medium text-foreground">
              {user?.firstName || user?.email || "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || "No email"}</p>
          </div>
        </div>

        <Button
          onClick={onLogout}
          variant="outline"
          className={`w-full transition-all duration-200 ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
          aria-label="Log out"
        >
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
