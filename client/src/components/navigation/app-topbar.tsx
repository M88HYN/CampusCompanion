/* Top bar for search, quick jumps, and account controls. */

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
import { useAppLanguage } from "@/lib/app-language";

interface AppTopbarProps {
  user: AppUser | null;
  onLogout: () => void;
}

interface SearchTarget {
  label: string;
  path: string;
  description: string;
  keywords: string[];
  group: "Decks" | "Cards" | "Notes" | "Quiz History";
}

const SEARCH_GROUP_ORDER: SearchTarget["group"][] = ["Decks", "Cards", "Notes", "Quiz History"];

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

interface SearchCard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags?: string | null;
}

interface QuizHistoryEntry {
  quizTitle?: string;
  topic?: string;
  score?: number;
  maxScore?: number;
  accuracy?: number;
}

interface SearchAnalyticsResponse {
  recentActivity?: QuizHistoryEntry[];
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

// Builds the top bar and keeps the quick search responsive.
export function AppTopbar({ user, onLogout }: AppTopbarProps) {
  const { t } = useAppLanguage();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
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

  const { data: cards = [] } = useQuery<SearchCard[]>({
    queryKey: ["/api/flashcards", "all", 500],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/flashcards?filter=all&limit=500");
      return (await response.json()) as SearchCard[];
    },
    staleTime: 30000,
  });

  const { data: quizHistory = [] } = useQuery<QuizHistoryEntry[]>({
    queryKey: ["/api/user/analytics", "recentActivity"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/analytics");
      const analytics = (await response.json()) as SearchAnalyticsResponse;
      return analytics.recentActivity ?? [];
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

      // Switch the bar styling once the page starts to scroll.
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

    // Saves the reminder toggle back to settings.
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

  const deckTitleById = new Map(decks.map((deck) => [deck.id, deck.title]));
  const cardTargets: SearchTarget[] = cards.map((card) => {
    const frontPreview = card.front.trim().slice(0, 70);
    const backPreview = card.back.trim().slice(0, 70);
    const deckTitle = deckTitleById.get(card.deckId);

    return {
      label: frontPreview || "Untitled card",
      path: `/flashcards?deckId=${encodeURIComponent(card.deckId)}&cardId=${encodeURIComponent(card.id)}`,
      description: `Card${deckTitle ? ` • ${deckTitle}` : ""}${backPreview ? ` • ${backPreview}` : ""}`,
      keywords: ["card", "flashcard", card.front, card.back, card.tags || "", deckTitle || ""],
      group: "Cards",
    };
  });

  const quizHistoryTargets: SearchTarget[] = quizHistory.map((activity, index) => {
    const scoreText =
      typeof activity.score === "number" && typeof activity.maxScore === "number"
        ? `${activity.score}/${activity.maxScore}`
        : typeof activity.accuracy === "number"
          ? `${activity.accuracy}%`
          : "Recent attempt";

    return {
      label: activity.quizTitle || "Untitled quiz",
      path: "/quizzes?tab=analytics",
      description: `Quiz attempt${activity.topic ? ` • ${activity.topic}` : ""} • ${scoreText}`,
      keywords: ["quiz", "history", "attempt", activity.quizTitle || "", activity.topic || "", scoreText, String(index)],
      group: "Quiz History",
    };
  });

  const allSearchTargets = [...deckTargets, ...cardTargets, ...noteTargets, ...quizHistoryTargets];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTargets = normalizedQuery
    ? allSearchTargets.filter((target) => {
        const haystack = `${target.label} ${target.description} ${target.keywords.join(" ")}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }).slice(0, 12)
    : allSearchTargets.slice(0, 12);

  const groupedFilteredTargets = SEARCH_GROUP_ORDER
    .map((group) => ({
      group,
      items: filteredTargets.filter((target) => target.group === group),
    }))
    .filter((group) => group.items.length > 0);

    // Jumps to the selected search result and closes the panel.
    const handleSearchNavigate = (target: SearchTarget) => {
    setLocation(target.path);
    setSearchQuery("");
    setIsSearchOpen(false);
  setIsMobileSearchOpen(false);
  };

    // Submits the current search and opens the first match.
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
      className={`sticky top-0 z-30 px-3 py-3 sm:px-4 md:px-6 lg:px-8 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isScrolled
          ? "border-b border-white/30 bg-gradient-to-r from-primary/95 via-brand-primary/95 to-secondary/95 text-primary-foreground backdrop-blur-xl shadow-[0_14px_34px_-22px_rgba(2,6,23,0.55)]"
          : "border-b border-white/20 bg-gradient-to-r from-primary/90 via-brand-primary/90 to-secondary/90 text-primary-foreground backdrop-blur-lg"
      }`}
    >
      {/* Keeps the header centred within the page shell. */}
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2 md:gap-4">
        <div className="flex min-w-0 items-center gap-2 md:gap-3 md:min-w-[220px]">
          <SidebarTrigger
            className="button-priority-transition"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </SidebarTrigger>

          <Link href="/dashboard" className="flex items-center gap-2 min-w-0" aria-label="Go to dashboard">
            <StudyMateLogo sizeClassName="h-8 w-8" />
            <span className="hidden text-sm font-semibold text-primary-foreground sm:inline">StudyMate</span>
          </Link>
        </div>

        <div className="hidden flex-1 md:flex md:justify-center">
          {/* Gives search a clearer, lifted look without changing the behaviour. */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/65" />
            <Input
              aria-label="Search and navigate"
              placeholder={t("topbar.searchPlaceholder", "Search decks, cards, notes, quiz history...")}
              className="h-11 rounded-xl border-white/35 bg-white/88 pl-10 text-foreground shadow-[0_10px_24px_-20px_rgba(2,6,23,0.95)] placeholder:text-foreground/65 focus-visible:border-white/70 focus-visible:ring-white/40 focus-visible:shadow-[0_0_0_4px_rgba(255,255,255,0.22)]"
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

            {isSearchOpen && groupedFilteredTargets.length > 0 ? (
              <div
                className="search-dropdown-transition absolute z-40 mt-2 w-full rounded-2xl border border-border/80 bg-card/95 shadow-[0_18px_30px_-22px_rgba(15,23,42,0.95)] backdrop-blur-sm"
                role="listbox"
                aria-label="Search results"
              >
                {groupedFilteredTargets.map(({ group, items }) => (
                  <div key={group} className="py-1">
                    <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group}
                    </p>
                    {items.map((target) => (
                      <button
                        key={`${target.group}-${target.path}-${target.label}`}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onMouseDown={() => handleSearchNavigate(target)}
                        aria-label={`Go to ${target.label}`}
                      >
                        <p className="text-sm font-medium text-foreground">{target.label}</p>
                        <p className="text-xs text-muted-foreground">{target.description}</p>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
          </form>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle mobile search"
                className="button-priority-transition md:hidden text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              setIsMobileSearchOpen((prev) => !prev);
              setIsSearchOpen((prev) => !prev);
            }}
          >
            <Search className="h-4 w-4" />
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notification preferences"
                className="button-priority-transition relative text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
              <DropdownMenuLabel>{t("topbar.notifications", "Notifications")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{t("topbar.quizReminders", "Quiz Reminders")}</p>
                    <p className="text-xs text-muted-foreground">{t("topbar.enableReminders", "Enable reminder notifications")}</p>
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
                    {t("topbar.actionItems", "Action items")}
                  </p>
                  {!notificationsEnabled ? (
                    <p className="text-xs text-muted-foreground">{t("topbar.remindersPaused", "Reminders are paused.")}</p>
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
                    <p className="text-xs text-muted-foreground">{t("topbar.noUrgent", "No urgent tasks right now.")}</p>
                  )}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="button-priority-transition h-10 gap-2 rounded-xl px-2 text-primary-foreground hover:bg-white/10 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
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
            <DropdownMenuContent
              align="end"
              className="w-60 rounded-xl border border-border/80 bg-popover/95 p-1 shadow-xl backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            >
              <DropdownMenuLabel className="px-2 py-1.5">
                <p className="truncate text-sm font-semibold">{user?.firstName || "User"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email || "No email"}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2 rounded-md transition-colors">
                  <User className="h-4 w-4" />
                  {t("nav.profile", "Profile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 rounded-md transition-colors">
                  <Settings className="h-4 w-4" />
                  {t("nav.settings", "Settings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>{t("common.logout", "Log out")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isMobileSearchOpen ? (
        <div className="md:hidden mt-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/70" />
            <Input
              aria-label="Mobile search and navigate"
              placeholder={t("topbar.searchPlaceholder", "Search decks, cards, notes, quiz history...")}
              className="h-10 pl-9"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />

            {isSearchOpen && groupedFilteredTargets.length > 0 ? (
              <div
                className="search-dropdown-transition absolute z-40 mt-2 w-full rounded-xl border border-border bg-card shadow-md max-h-[50vh] overflow-auto"
                role="listbox"
                aria-label="Mobile search results"
              >
                {groupedFilteredTargets.map(({ group, items }) => (
                  <div key={`mobile-${group}`} className="py-1">
                    <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group}
                    </p>
                    {items.map((target) => (
                      <button
                        key={`mobile-${target.group}-${target.path}-${target.label}`}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onMouseDown={() => handleSearchNavigate(target)}
                        aria-label={`Go to ${target.label}`}
                      >
                        <p className="text-sm font-medium text-foreground truncate">{target.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{target.description}</p>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
          </form>
        </div>
      ) : null}
    </header>
  );
}
