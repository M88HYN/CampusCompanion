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
import { Link, useLocation } from "wouter";
import type { User as AppUser } from "@shared/models/auth";
import { StudyMateLogo } from "./studymate-logo";

interface AppTopbarProps {
  user: AppUser | null;
  onLogout: () => void;
}

interface SearchTarget {
  label: string;
  path: string;
  description: string;
  keywords: string[];
  group?: "Navigation" | "Notes" | "Decks";
}

const SEARCH_TARGETS: SearchTarget[] = [
  { label: "Dashboard", path: "/dashboard", description: "Overview and quick actions", keywords: ["home", "overview", "dashboard"], group: "Navigation" },
  { label: "Notes", path: "/notes", description: "Study notes and blocks", keywords: ["note", "notes", "writing"], group: "Navigation" },
  { label: "Flashcards", path: "/flashcards", description: "Spaced repetition cards", keywords: ["flashcards", "cards", "revision cards"], group: "Navigation" },
  { label: "Quizzes", path: "/quizzes", description: "Quiz list and attempts", keywords: ["quiz", "quizzes", "test"], group: "Navigation" },
  { label: "Quiz Analytics", path: "/quizzes?tab=analytics", description: "Quiz analytics section", keywords: ["quiz analytics", "accuracy", "scores"], group: "Navigation" },
  { label: "Quiz Review", path: "/quizzes?tab=review", description: "Spaced quiz review", keywords: ["review", "quiz review"], group: "Navigation" },
  { label: "Revision Aids", path: "/revision", description: "Revision helper", keywords: ["revision", "recap", "revision aids"], group: "Navigation" },
  { label: "Insight Scout", path: "/research", description: "AI-powered study assistant", keywords: ["research", "insight scout", "ai"], group: "Navigation" },
  { label: "Insights", path: "/insights", description: "Learning insights dashboard", keywords: ["insights", "learning data"], group: "Navigation" },
  { label: "Performance", path: "/performance", description: "Performance analytics", keywords: ["performance", "analytics", "metrics"], group: "Navigation" },
  { label: "Profile", path: "/profile", description: "User profile page", keywords: ["profile", "account"], group: "Navigation" },
  { label: "Settings", path: "/settings", description: "All preferences", keywords: ["settings", "preferences", "config"], group: "Navigation" },
  { label: "Settings: Account", path: "/settings?tab=account", description: "Account settings tab", keywords: ["account settings", "account"], group: "Navigation" },
  { label: "Settings: Notifications", path: "/settings?tab=notifications", description: "Notification preferences tab", keywords: ["notifications", "reminders"], group: "Navigation" },
  { label: "Settings: Privacy", path: "/settings?tab=privacy", description: "Privacy settings tab", keywords: ["privacy"], group: "Navigation" },
  { label: "Settings: Security", path: "/settings?tab=security", description: "Security settings tab", keywords: ["security", "password"], group: "Navigation" },
  { label: "Settings: Insight Scout", path: "/settings?tab=insight-scout", description: "AI settings tab", keywords: ["insight scout", "ai settings"], group: "Navigation" },
];

interface SearchNote {
  id: string;
  title: string;
  subject?: string | null;
  tags?: string | null;
}

interface SearchDeck {
  id: string;
  title: string;
  subject?: string | null;
  description?: string | null;
  tags?: string | null;
}

interface DueCard {
  id: string;
}

interface FlashcardStats {
  totalCards: number;
  dueNow: number;
  new: number;
  struggling: number;
  mastered: number;
}

export function AppTopbar({ user, onLogout }: AppTopbarProps) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      return (await response.json()) as { quizReminders?: boolean };
    },
    staleTime: 30000,
  });

  const { data: notes = [] } = useQuery<SearchNote[]>({
    queryKey: ["/api/notes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notes");
      return (await response.json()) as SearchNote[];
    },
    staleTime: 30000,
  });

  const { data: decks = [] } = useQuery<SearchDeck[]>({
    queryKey: ["/api/decks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/decks");
      return (await response.json()) as SearchDeck[];
    },
    staleTime: 30000,
  });

  const { data: dueCards = [] } = useQuery<DueCard[]>({
    queryKey: ["/api/cards/due"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/cards/due");
      return (await response.json()) as DueCard[];
    },
    staleTime: 30000,
  });

  const { data: flashcardStats } = useQuery<FlashcardStats>({
    queryKey: ["/api/flashcards/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/flashcards/stats");
      return (await response.json()) as FlashcardStats;
    },
    staleTime: 30000,
  });

  useEffect(() => {
    setNotificationsEnabled(settings?.quizReminders ?? true);
  }, [settings]);

  useEffect(() => {
    const scrollContainer = document.getElementById("app-main-scroll");
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 8);
    };

    handleScroll();
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

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

  const noteTargets: SearchTarget[] = notes.map((note) => ({
    label: note.title,
    path: `/notes?noteId=${encodeURIComponent(note.id)}`,
    description: `Note${note.subject ? ` • ${note.subject}` : ""}`,
    keywords: ["note", note.title, note.subject || "", note.tags || ""],
    group: "Notes",
  }));

  const deckTargets: SearchTarget[] = decks.map((deck) => ({
    label: deck.title,
    path: `/flashcards?deckId=${encodeURIComponent(deck.id)}`,
    description: `Deck${deck.subject ? ` • ${deck.subject}` : ""}`,
    keywords: ["deck", "flashcards", deck.title, deck.subject || "", deck.description || "", deck.tags || ""],
    group: "Decks",
  }));

  const allSearchTargets = [...SEARCH_TARGETS, ...noteTargets, ...deckTargets];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTargets = normalizedQuery
    ? allSearchTargets.filter((target) => {
        const haystack = `${target.label} ${target.description} ${target.keywords.join(" ")}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }).slice(0, 6)
    : allSearchTargets.slice(0, 6);

  const handleSearchNavigate = (target: SearchTarget) => {
    setLocation(target.path);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (filteredTargets.length > 0) {
      handleSearchNavigate(filteredTargets[0]);
    }
  };

  const initials =
    (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const reminderItems = [
    flashcardStats?.dueNow
      ? {
          id: "due-cards",
          text: `Review ${flashcardStats.dueNow} due flashcard${flashcardStats.dueNow !== 1 ? "s" : ""}`,
        }
      : null,
    flashcardStats?.struggling
      ? {
          id: "struggling-cards",
          text: `Revisit ${flashcardStats.struggling} struggling card${flashcardStats.struggling !== 1 ? "s" : ""}`,
        }
      : null,
    flashcardStats?.new
      ? {
          id: "new-cards",
          text: `Start ${Math.min(flashcardStats.new, 5)} new card${Math.min(flashcardStats.new, 5) !== 1 ? "s" : ""}`,
        }
      : null,
  ].filter(Boolean).slice(0, 3) as { id: string; text: string }[];

  return (
    <header
      className={`sticky top-0 z-30 px-4 py-3 md:px-6 transition-all duration-200 ease-in-out ${
        isScrolled
          ? "border-b border-primary/70 bg-gradient-to-r from-primary via-brand-primary to-secondary text-primary-foreground backdrop-blur-xl shadow-md"
          : "border-b border-primary/60 bg-gradient-to-r from-primary via-brand-primary to-secondary text-primary-foreground backdrop-blur"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 md:min-w-[220px]">
          <SidebarTrigger
            className="transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </SidebarTrigger>

          <Link href="/dashboard" className="flex items-center gap-2" aria-label="Go to dashboard">
            <StudyMateLogo sizeClassName="h-8 w-8" />
            <span className="hidden text-sm font-semibold text-primary-foreground sm:inline">StudyMate</span>
          </Link>
        </div>

        <div className="hidden flex-1 md:flex md:justify-center">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/70" />
            <Input
              aria-label="Search and navigate"
              placeholder="Search pages, tabs, sections..."
              className="h-10 pl-9"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => {
                setTimeout(() => setIsSearchOpen(false), 120);
              }}
            />

            {isSearchOpen && filteredTargets.length > 0 ? (
              <div
                className="search-dropdown-transition absolute z-40 mt-2 w-full rounded-xl border border-border bg-card shadow-md"
                role="listbox"
                aria-label="Search results"
              >
                {filteredTargets.map((target) => (
                  <button
                    key={target.path}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onMouseDown={() => handleSearchNavigate(target)}
                    aria-label={`Go to ${target.label}`}
                  >
                    <p className="text-sm font-medium text-foreground">{target.label}</p>
                    <p className="text-xs text-muted-foreground">{target.description}</p>
                    {target.group ? (
                      <p className="text-[10px] uppercase tracking-wide text-secondary mt-0.5">{target.group}</p>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </form>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notification preferences"
                className="relative text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Bell className="h-4 w-4" />
                {dueCards.length > 0 ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1rem] h-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white"
                    aria-label={`${Math.min(dueCards.length, 99)} notifications`}
                  >
                    {dueCards.length > 99 ? "99+" : dueCards.length}
                  </span>
                ) : null}
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

                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Action items
                  </p>
                  {!notificationsEnabled ? (
                    <p className="text-xs text-muted-foreground">Reminders are paused.</p>
                  ) : reminderItems.length > 0 ? (
                    <ul className="space-y-1.5">
                      {reminderItems.map((item) => (
                        <li key={item.id} className="text-xs text-foreground/90 flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary" />
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No urgent tasks right now.</p>
                  )}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 px-2 text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open user menu"
              >
                <Avatar className="h-8 w-8 border border-primary-foreground/40">
                  <AvatarFallback className="bg-secondary text-white">
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
