import { Bell, Menu, Search, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { User as AppUser } from "@shared/models/auth";

interface AppTopbarProps {
  user: AppUser | null;
  onLogout: () => void;
}

export function AppTopbar({ user, onLogout }: AppTopbarProps) {
  const queryClient = useQueryClient();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      return (await response.json()) as { quizReminders?: boolean };
    },
    staleTime: 30000,
  });

  useEffect(() => {
    setNotificationsEnabled(settings?.quizReminders ?? true);
  }, [settings]);

  const updateNotificationsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest("PATCH", "/api/settings", {
        quizReminders: enabled,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    updateNotificationsMutation.mutate(enabled);
  };

  const initials =
    (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 md:min-w-[220px]">
          <SidebarTrigger
            className="md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </SidebarTrigger>

          <Link href="/dashboard" className="flex items-center gap-2" aria-label="Go to dashboard">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center text-xs font-bold">
              SM
            </div>
            <span className="hidden text-sm font-semibold text-slate-900 dark:text-white sm:inline">StudyMate</span>
          </Link>
        </div>

        <div className="hidden flex-1 md:flex md:justify-center">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              aria-label="Search"
              placeholder="Search notes, flashcards, quizzes..."
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notification preferences"
                className="focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <Bell className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Quiz Reminders</p>
                    <p className="text-xs text-muted-foreground">Enable reminder notifications</p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationsToggle}
                    aria-label="Toggle quiz reminders"
                    disabled={updateNotificationsMutation.isPending}
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 px-2 focus-visible:ring-2 focus-visible:ring-teal-500"
                aria-label="Open user menu"
              >
                <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                  <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[120px] truncate text-sm md:inline">
                  {user?.firstName || user?.email || "User"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
