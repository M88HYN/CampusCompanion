import {
  BookOpen,
  BrainCircuit,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  Zap,
  Lightbulb,
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

type UserRole = "student" | "instructor" | "admin";

interface AppSidebarProps {
  userRole?: UserRole;
}

export function AppSidebar({ userRole = "student" }: AppSidebarProps) {
  const [location] = useLocation();

  const learningTools = [
    {
      title: "Dashboard",
      url: "/",
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
      <SidebarHeader className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-b-2 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
            <Zap className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400 bg-clip-text text-transparent">
              StudyMate
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Study Smart</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <SidebarGroup>
          <SidebarGroupLabel className="text-purple-700 dark:text-purple-300 font-bold">Learning Tools</SidebarGroupLabel>
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
          <SidebarGroupLabel className="text-purple-700 dark:text-purple-300 font-bold">System</SidebarGroupLabel>
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
      <SidebarFooter className="p-4 border-t-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <a href="/settings" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
          <Avatar className="border-2 border-purple-300 dark:border-purple-700">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white font-bold">JD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">John Doe</span>
            <Badge
              className={`w-fit text-xs border-0 ${
                userRole === "admin"
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                  : userRole === "instructor"
                  ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white"
                  : "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
              }`}
              data-testid={`badge-role-${userRole}`}
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          </div>
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
