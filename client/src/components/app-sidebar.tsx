import {
  BookOpen,
  BrainCircuit,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  Rocket,
  Lightbulb,
  BarChart3,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

type UserRole = "student" | "instructor" | "admin";

interface AppSidebarProps {
  userRole?: UserRole;
  onLogout?: () => void;
}

export function AppSidebar({ userRole = "student", onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const learningTools = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Notes",
      url: "/notes",
      icon: BookOpen,
    },
    {
      title: "Quizzes",
      url: "/quizzes",
      icon: BrainCircuit,
    },
    {
      title: "Flashcards",
      url: "/flashcards",
      icon: GraduationCap,
    },
    {
      title: "Insight Scout",
      url: "/research",
      icon: Sparkles,
    },
    {
      title: "Revision Help",
      url: "/revision",
      icon: Lightbulb,
    },
    {
      title: "Learning Insights",
      url: "/insights",
      icon: BarChart3,
    },
  ];

  const adminTools = [
    {
      title: "User Management",
      url: "/admin/users",
      icon: Users,
      roles: ["admin"] as UserRole[],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "default";
      case "instructor":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 bg-primary border-b border-primary/70 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-white shadow-md">
            <Rocket className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary-foreground">
              StudyMate
            </span>
            <span className="text-xs text-primary-foreground/80 font-medium">Learn Faster</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-bold">Learning Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {learningTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-bold">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminTools
                .filter((item) => !item.roles || item.roles.includes(userRole))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <a href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border bg-card space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="border-2 border-border">
            <AvatarFallback className="bg-secondary text-white font-bold">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "User"}
            </span>
            <Badge
              className={`w-fit text-xs border-0 ${
                userRole === "admin"
                  ? "bg-destructive text-white"
                  : userRole === "instructor"
                  ? "bg-secondary text-white"
                  : "bg-primary text-white"
              }`}
              data-testid={`badge-role-${userRole}`}
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          </div>
        </div>
        {onLogout && (
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full justify-start text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
