/*
==========================================================
File: client/src/pages/dashboard.tsx

Module: Analytics and Learning Intelligence

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

import { useState, useEffect } from "react";
import {
  BookOpen, BrainCircuit, Sparkles, Clock,
  Flame, Target, Calendar, Edit2, Save, X, Lightbulb, AlertTriangle,
  Zap, ChevronRight, CheckCircle2, Award,
  Timer, Rocket, Layers, FileText, Activity, Plus,
  PlayCircle, CreditCard, ArrowUpRight, TrendingUp, TrendingDown, Minus, RefreshCw,
  Bookmark, BookmarkCheck
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { usePersonalization } from "@/hooks/use-personalization";

interface DashboardMetrics {
  dueToday: number;
  accuracy: number;
  weeklyStudyTime: number;
  itemsReviewedThisWeek: number;
}

interface DueCard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  nextReviewDate: string;
  easeFactor: number;
  status: string;
}

interface Deck {
  id: string;
  title: string;
  subject?: string;
  cards?: number;
  dueToday?: number;
  mastered?: number;
}

interface Quiz {
  id: string;
  title: string;
  subject?: string;
  questionCount?: number;
  bestScore?: number | null;
  attemptCount?: number;
}

interface Note {
  id: string;
  title: string;
  subject?: string;
  updatedAt: string;
}

interface LearningInsights {
  overview: {
    totalStudyTime: number;
    totalSessions: number;
    currentStreak: number;
    longestStreak: number;
    cardsReviewed: number;
    quizzesTaken: number;
    overallAccuracy: number;
  };
  weakAreas: { topic: string; accuracy: number; suggestion: string }[];
  strengths: { topic: string; accuracy: number; masteredConcepts: number }[];
  recommendations: { type: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  weeklyProgress: { day: string; minutes: number; items: number }[];
}

type UserRole = "student" | "instructor" | "admin";

interface DashboardProps {
  userRole?: UserRole;
}

type RecommendedAction = {
  title: string;
  description: string;
  cta: string;
  priority: "high" | "medium" | "low";
  icon: React.ElementType;
  action: () => void;
};

type SmartPromptItem = {
  text: string;
  cta: string;
  action: () => void;
};

function CountUpValue({ value, suffix = "", testId }: { value: number; suffix?: string; testId?: string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const startValue = displayValue;
    const duration = 700;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(startValue + (value - startValue) * eased);
      setDisplayValue(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span data-testid={testId}>{displayValue}{suffix}</span>;
}

interface EnhancedStatCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ElementType;
  tooltip: string;
  insight: string;
  trendLabel: string;
  trendValue: string;
  trendDirection: "up" | "down" | "neutral";
  onClick: () => void;
  sparklineData: Array<{ day: string; value: number }>;
  gradientClass: string;
  shadowClass: string;
  priorityBadge?: string;
  testId: string;
}

function EnhancedStatCard({
  title,
  value,
  suffix,
  icon: Icon,
  tooltip,
  insight,
  trendLabel,
  trendValue,
  trendDirection,
  onClick,
  sparklineData,
  gradientClass,
  shadowClass,
  priorityBadge,
  testId,
}: EnhancedStatCardProps) {
  const trendConfig = {
    up: { Icon: TrendingUp, color: "text-emerald-100" },
    down: { Icon: TrendingDown, color: "text-rose-100" },
    neutral: { Icon: Minus, color: "text-slate-100" },
  } as const;
  const TrendIcon = trendConfig[trendDirection].Icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={`group relative overflow-hidden rounded-2xl ${gradientClass} p-5 text-left text-white shadow-lg ${shadowClass} dark:shadow-none dark:ring-1 dark:ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/14 via-transparent to-black/10 opacity-70" />
          <div className="relative z-10 flex h-full flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 opacity-85 shrink-0" />
                <span className="text-xs font-semibold opacity-95 truncate">{title}</span>
              </div>
              {priorityBadge && (
                <Badge className="bg-white/15 text-white border-white/30 text-[10px] uppercase tracking-wider">
                  {priorityBadge}
                </Badge>
              )}
            </div>

            <div className="text-2xl sm:text-3xl font-bold leading-none">
              <CountUpValue value={value} suffix={suffix} testId={testId} />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium">
              <TrendIcon className={`h-3.5 w-3.5 ${trendConfig[trendDirection].color}`} />
              <span>{trendValue}</span>
              <span className="opacity-80">{trendLabel}</span>
            </div>

            <p className="text-xs opacity-90 line-clamp-1">{insight}</p>

            <div className="h-10 w-full mt-1 opacity-90 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                    animationDuration={850}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-[220px] text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function ActionCard({
  title,
  description,
  reason,
  timeEstimate,
  priority,
  icon: Icon,
  href,
  gradient,
  testId
}: {
  title: string;
  description: string;
  reason: string;
  timeEstimate: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ElementType;
  href: string;
  gradient: string;
  testId: string;
}) {
  const priorityConfig = {
    high: { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' },
    medium: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
    low: { bar: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800' },
  };

  return (
    <Link href={href}>
      <div
        className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        data-testid={testId}
      >
        <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="font-semibold text-sm text-foreground">{title}</p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Timer className="h-3 w-3" />
              {timeEstimate}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
          <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${priorityConfig[priority].badge}`}>
            {reason}
          </span>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

function WeakTopicCard({ topic, accuracy, suggestion }: { topic: string; accuracy: number; suggestion: string }) {
  const getUrgencyColor = (acc: number) => {
    if (acc < 50) return 'border-l-rose-500 bg-rose-50 dark:bg-rose-950/20';
    if (acc < 70) return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20';
    return 'border-l-sky-500 bg-sky-50 dark:bg-sky-950/20';
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${getUrgencyColor(accuracy)}`} data-testid={`weak-topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-medium text-sm">{topic}</span>
        <Badge variant={accuracy < 50 ? "destructive" : "secondary"} className="text-xs shrink-0">
          {accuracy}%
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{suggestion}</p>
    </div>
  );
}

function QuickWinCard({ title, description, href, icon: Icon, action }: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  action: string;
}) {
  return (
    <Link href={href}>
      <div className="group flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 cursor-pointer border border-emerald-200 dark:border-emerald-800 transition-colors" data-testid={`quick-win-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-emerald-600 border-emerald-300 dark:border-emerald-700 text-xs">
          {action}
        </Badge>
      </div>
    </Link>
  );
}

export default function Dashboard(_props: DashboardProps) {
  const { user } = useAuth();
  const { preferences, toggleBookmarkedNote } = usePersonalization();
  const [, setLocation] = useLocation();
  const [userName, setUserName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  useEffect(() => {
    if (user?.firstName) {
      setUserName(user.firstName);
      setTempName(user.firstName);
    } else if (user?.email) {
      const emailName = user.email.split("@")[0];
      setUserName(emailName);
      setTempName(emailName);
    } else {
      setUserName("Student");
      setTempName("Student");
    }
  }, [user]);

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/metrics");
      return res.json();
    },
    enabled: !!user,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: dueCards = [] } = useQuery<DueCard[]>({
    queryKey: ['/api/dashboard/due-flashcards'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/due-flashcards");
      return res.json();
    },
    enabled: !!user,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: lowestQuiz } = useQuery({
    queryKey: ['/api/dashboard/lowest-quiz'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/lowest-quiz");
      return res.json();
    },
    enabled: !!user,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: recentNotes = [] } = useQuery<Note[]>({
    queryKey: ['/api/dashboard/recent-notes'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/recent-notes");
      return res.json();
    },
    enabled: !!user,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: decks = [], isLoading: isLoadingDecks } = useQuery<Deck[]>({
    queryKey: ['/api/decks'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/decks");
      return res.json();
    },
    enabled: !!user,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ['/api/quizzes'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/quizzes");
      return res.json();
    },
    enabled: !!user,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery<Note[]>({
    queryKey: ['/api/notes'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notes");
      return res.json();
    },
    enabled: !!user,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
  });

  // insights loads independently — don't block page render on it
  const { data: insights } = useQuery<LearningInsights>({
    queryKey: ['/api/learning-insights'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/learning-insights");
      return res.json();
    },
    enabled: !!user,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
  });

  const totalCardsCount = decks.reduce((sum: number, d: any) => sum + (d.cards || 0), 0);
  const masteredCardsCount = decks.reduce((sum: number, d: any) => sum + (d.mastered || 0), 0);
  const quizBestScore = quizzes.length > 0 ? Math.max(...quizzes.map((q: any) => q.bestScore || 0)) : 0;

  const features = [
    {
      title: "Notes",
      description: notes.length > 0 ? `${notes.length} notes` : "Start writing",
      icon: FileText,
      bgGradient: "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600",
      href: "/notes",
      subtitle: notes.length > 0 ? "Rich content & AI tools" : "Organise study materials",
    },
    {
      title: "Quizzes",
      description: quizzes.length > 0 ? `${quizzes.length} quizzes` : "Create a quiz",
      icon: BrainCircuit,
      bgGradient: "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500",
      href: "/quizzes",
      subtitle: quizBestScore > 0 ? `Best score: ${quizBestScore}%` : "Test your knowledge",
    },
    {
      title: "Flashcards",
      description: decks.length > 0 ? `${decks.length} decks` : "Create a deck",
      icon: Layers,
      bgGradient: "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600",
      href: "/flashcards",
      urgent: dueCards.length > 0,
      subtitle: dueCards.length > 0 ? `${dueCards.length} cards due now` : "Spaced repetition",
    },
    {
      title: "Insight Scout",
      description: "AI-powered support",
      icon: Sparkles,
      bgGradient: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
      href: "/research",
      subtitle: "Ask anything",
    },
    {
      title: "Revision Aids",
      description: "Spaced review queue",
      icon: Zap,
      bgGradient: "bg-gradient-to-br from-yellow-400 via-lime-500 to-green-500",
      href: "/revision",
      subtitle: "Focus on weak areas",
    },
  ];

  const handleSaveName = () => {
    setUserName(tempName);
    setIsEditingName(false);
  };

  const handleCancelName = () => {
    setTempName(userName);
    setIsEditingName(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const generateStudyNowActions = () => {
    const actions: Array<{
      title: string;
      description: string;
      reason: string;
      timeEstimate: string;
      priority: 'high' | 'medium' | 'low';
      icon: React.ElementType;
      href: string;
      gradient: string;
    }> = [];

    if (dueCards.length > 0) {
      actions.push({
        title: `Review ${dueCards.length} Flashcard${dueCards.length > 1 ? 's' : ''}`,
        description: "Cards are due for review today. Reviewing now maintains your memory retention.",
        reason: "Spaced repetition due",
        timeEstimate: `${Math.ceil(dueCards.length * 0.5)} min`,
        priority: dueCards.length > 10 ? 'high' : 'medium',
        icon: Layers,
        href: "/flashcards",
        gradient: "bg-gradient-to-br from-emerald-400 to-teal-500"
      });
    }

    if (lowestQuiz && lowestQuiz.bestScore < 70) {
      actions.push({
        title: `Retake: ${lowestQuiz.title}`,
        description: `Your best score was ${lowestQuiz.bestScore}%. A focused review can improve your understanding.`,
        reason: "Below target score",
        timeEstimate: "15-20 min",
        priority: lowestQuiz.bestScore < 50 ? 'high' : 'medium',
        icon: BrainCircuit,
        href: `/quizzes/${lowestQuiz.id}`,
        gradient: "bg-gradient-to-br from-fuchsia-400 to-rose-500"
      });
    }

    if (insights?.weakAreas && insights.weakAreas.length > 0) {
      const weakest = insights.weakAreas[0];
      actions.push({
        title: `Strengthen: ${weakest.topic}`,
        description: weakest.suggestion,
        reason: `Only ${weakest.accuracy}% accuracy`,
        timeEstimate: "15-20 min",
        priority: weakest.accuracy < 50 ? 'high' : 'medium',
        icon: Target,
        href: "/quizzes",
        gradient: "bg-gradient-to-br from-rose-400 to-pink-500"
      });
    }

    if (insights?.recommendations) {
      insights.recommendations.slice(0, 1).forEach(rec => {
        const iconMap: Record<string, React.ElementType> = {
          'focus': AlertTriangle,
          'practice': Activity,
          'timing': Clock,
          'challenge': Zap,
          'flashcards': Layers,
        };
        actions.push({
          title: rec.title,
          description: rec.description,
          reason: rec.type.charAt(0).toUpperCase() + rec.type.slice(1),
          timeEstimate: "10-15 min",
          priority: rec.priority,
          icon: iconMap[rec.type] || Lightbulb,
          href: rec.type === 'flashcards' ? '/flashcards' : '/quizzes',
          gradient: rec.priority === 'high'
            ? "bg-gradient-to-br from-rose-400 to-red-500"
            : "bg-gradient-to-br from-amber-400 to-orange-500"
        });
      });
    }

    if (actions.length === 0) {
      actions.push({
        title: "Explore Insight Scout",
        description: "Ask any study question and get AI-powered explanations and insight support.",
        reason: "Build knowledge",
        timeEstimate: "5 min",
        priority: 'low',
        icon: Sparkles,
        href: "/research",
        gradient: "bg-gradient-to-br from-amber-400 to-orange-500"
      });
    }

    return actions.slice(0, 4);
  };

  const generateQuickWins = () => {
    const wins: Array<{
      title: string;
      description: string;
      href: string;
      icon: React.ElementType;
      action: string;
    }> = [];

    if (dueCards.length > 0 && dueCards.length <= 5) {
      wins.push({
        title: `${dueCards.length} quick cards`,
        description: "Quick review to keep your streak alive",
        href: "/flashcards",
        icon: CheckCircle2,
        action: "2 min"
      });
    }

    if (insights?.strengths && insights.strengths.length > 0) {
      wins.push({
        title: `Master: ${insights.strengths[0].topic}`,
        description: "Reinforce your strongest subject",
        href: "/flashcards",
        icon: Award,
        action: "5 min"
      });
    }

    if (recentNotes.length > 0) {
      const mostRecent = recentNotes[0];
      wins.push({
        title: `Review: ${mostRecent.title.substring(0, 20)}...`,
        description: "Refresh your latest study material",
        href: `/notes/${mostRecent.id}`,
        icon: FileText,
        action: "3 min"
      });
    }

    wins.push({
      title: "Quick Pomodoro",
      description: "25 min focused study session",
      href: "/revision",
      icon: Timer,
      action: "25 min"
    });

    return wins.slice(0, 4);
  };

  const handleStartQuiz = () => {
    if (quizzes.length === 0) {
      setLocation("/quizzes");
      return;
    }
    setLocation("/quizzes?launch=random");
  };

  const handleReviewFlashcards = () => {
    const hasReviewableDeck = decks.some((deck) => (deck.cards ?? 0) > 0);
    if (!hasReviewableDeck) {
      setLocation("/flashcards");
      return;
    }
    setLocation("/flashcards?launch=random");
  };

  const handleContinueLastSession = () => {
    if (dueCards.length > 0) {
      setLocation("/flashcards?launch=random");
      return;
    }
    if (quizzes.length > 0) {
      setLocation("/quizzes?launch=random");
      return;
    }
    setLocation("/notes");
  };

  const handleResumePreviousTopic = () => {
    const latestNote = recentNotes[0];
    if (!latestNote) {
      setLocation("/notes");
      return;
    }
    setLocation(`/notes?noteId=${latestNote.id}`);
  };

  const handleReviseWeakArea = () => {
    if (insights?.weakAreas && insights.weakAreas.length > 0) {
      setLocation("/quizzes?launch=random");
      return;
    }
    setLocation("/flashcards?launch=random");
  };

  const contextDue = metrics?.dueToday ?? dueCards.length;
  const contextAccuracy = metrics?.accuracy ?? insights?.overview?.overallAccuracy ?? 0;
  const dailyGoalMinutes = preferences.dailyStudyGoalMinutes || 60;
  const weeklyGoalMinutes = dailyGoalMinutes * 7;
  const weeklyStudyMinutes = metrics?.weeklyStudyTime ?? insights?.overview?.totalStudyTime ?? 0;
  const goalProgress = weeklyGoalMinutes > 0 ? Math.min(100, Math.round((weeklyStudyMinutes / weeklyGoalMinutes) * 100)) : 0;
  const lastNote = recentNotes[0];
  const lastStudyDate = lastNote ? new Date(lastNote.updatedAt) : null;
  const inactivityDays = lastStudyDate
    ? Math.max(0, Math.floor((Date.now() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)))
    : (recentNotes.length > 0 || quizzes.length > 0 || dueCards.length > 0 ? 0 : 3);
  const behaviorState = inactivityDays >= 2
    ? "inactive"
    : contextAccuracy < 70 || contextDue > 20
      ? "struggling"
      : "active";

  const recommendedActions: RecommendedAction[] = [];
  if (contextDue > 0) {
    recommendedActions.push({
      title: `Review ${contextDue} due flashcard${contextDue > 1 ? "s" : ""}`,
      description: contextDue > 25 ? "High workload today. Clearing this now protects retention." : "A quick review now keeps your spaced-repetition queue healthy.",
      cta: "Start Now",
      priority: contextDue > 25 ? "high" : "medium",
      icon: Layers,
      action: () => setLocation("/flashcards?launch=random"),
    });
  }
  if (insights?.weakAreas?.[0]) {
    recommendedActions.push({
      title: `Revise ${insights.weakAreas[0].topic}`,
      description: `${insights.weakAreas[0].accuracy}% accuracy. Targeted practice can quickly raise this.`,
      cta: "Review",
      priority: insights.weakAreas[0].accuracy < 55 ? "high" : "medium",
      icon: Target,
      action: () => setLocation("/quizzes?launch=random"),
    });
  }
  if (inactivityDays >= 2) {
    recommendedActions.push({
      title: "Get back on track",
      description: `You have been inactive for ${inactivityDays} day${inactivityDays > 1 ? "s" : ""}. Restart with a short guided session.`,
      cta: "Resume",
      priority: "medium",
      icon: RefreshCw,
      action: handleContinueLastSession,
    });
  }
  if (goalProgress < 70) {
    recommendedActions.push({
      title: `Reach your ${dailyGoalMinutes} min/day goal`,
      description: `${goalProgress}% of this week's target completed. A focused session closes the gap quickly.`,
      cta: "Start Now",
      priority: goalProgress < 40 ? "high" : "medium",
      icon: Clock,
      action: preferences.focusStyle === "quiz-first" ? handleStartQuiz : handleReviewFlashcards,
    });
  }
  if (preferences.preferredSubjects.length > 0) {
    recommendedActions.push({
      title: `Prioritise ${preferences.preferredSubjects[0]}`,
      description: "Your preferred subject has not been revisited recently. Keep continuity for better retention.",
      cta: "Resume",
      priority: "low",
      icon: BookOpen,
      action: () => setLocation("/notes"),
    });
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push({
      title: "Continue your momentum",
      description: "You are in a strong rhythm. Push progress with a focused quiz.",
      cta: "Start Quiz",
      priority: "low",
      icon: BrainCircuit,
      action: handleStartQuiz,
    });
  }

  const smartPromptItems: SmartPromptItem[] = [
    {
      text: contextAccuracy >= 75
        ? `You improved this week. Keep the streak alive with one more challenge quiz.`
        : `Accuracy is below target. A short revision now can recover your score quickly.`,
      cta: "Start Quiz",
      action: handleStartQuiz,
    },
    {
      text: inactivityDays >= 2
        ? `You have not studied for ${inactivityDays} day${inactivityDays > 1 ? "s" : ""}. Restart with 10 minutes of flashcards.`
        : `Strong consistency this week. Consolidate memory with a quick review round.`,
      cta: "Review Now",
      action: handleReviewFlashcards,
    },
    {
      text: insights?.weakAreas?.[0]
        ? `${insights.weakAreas[0].topic} is your weakest area at ${insights.weakAreas[0].accuracy}%. Focus there for the biggest lift.`
        : "No major weak areas detected right now. Build depth with insight-guided research.",
      cta: insights?.weakAreas?.[0] ? "Revise Topic" : "Explore Insights",
      action: insights?.weakAreas?.[0] ? handleReviseWeakArea : () => setLocation("/insights"),
    },
  ];
  const [smartPromptIndex, setSmartPromptIndex] = useState(0);

  useEffect(() => {
    if (smartPromptItems.length <= 1) return;
    const timer = setInterval(() => {
      setSmartPromptIndex((current) => (current + 1) % smartPromptItems.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [smartPromptItems.length]);

  const activePrompt = smartPromptItems[smartPromptIndex] ?? smartPromptItems[0];

  const contextualPrompts = [
    contextDue > 0 ? `You have ${contextDue} cards due today - a short review now prevents backlog.` : "You are caught up today. Use this time for a challenge quiz.",
    recentNotes.length === 0 ? "You haven't studied this topic recently. Create or revisit a note to restart momentum." : "Try testing yourself after reviewing notes to improve retention.",
    contextAccuracy >= 70 ? "You improved this week - keep the streak alive with one focused session." : "Accuracy is below target. Revise weak areas before taking the next full quiz.",
    goalProgress >= 100 ? `Great consistency - you hit your ${dailyGoalMinutes} min/day goal this week.` : `Study goal progress: ${goalProgress}% of ${weeklyGoalMinutes} weekly minutes.`,
  ];
  const studyActions = generateStudyNowActions();
  const quickWins = generateQuickWins();

  if (isLoadingMetrics || isLoadingDecks || isLoadingQuizzes || isLoadingNotes) {
    return (
      <div className="flex-1 overflow-auto rounded-3xl border border-border/60 bg-gradient-to-b from-slate-50 via-cyan-50/50 to-slate-100/60 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9 space-y-7">
          <Skeleton className="h-16 w-80" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const accuracy = metrics?.accuracy ?? insights?.overview?.overallAccuracy ?? 0;
  // quizzesCompleted: sum attempt counts from quizzes list as primary source (always loaded)
  const quizzesCompleted = quizzes.reduce((sum: number, q: any) => sum + (q.attemptCount || 0), 0)
    || insights?.overview?.quizzesTaken || 0;
  // flashcardsReviewed: use metrics (fast query) as primary, insights as fallback
  const flashcardsReviewed = metrics?.itemsReviewedThisWeek ?? insights?.overview?.cardsReviewed ?? 0;
  const dueToday = metrics?.dueToday ?? dueCards.length;

  const sparklineDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const buildSparkline = (base: number, spread: number, direction: "up" | "down" | "neutral") => {
    const pattern = direction === "up"
      ? [-0.45, -0.3, -0.15, 0, 0.2, 0.35, 0.5]
      : direction === "down"
      ? [0.5, 0.35, 0.2, 0, -0.15, -0.3, -0.45]
      : [-0.1, 0.05, -0.06, 0.04, -0.02, 0.06, 0.01];

    return sparklineDays.map((day, index) => ({
      day,
      value: Math.max(0, Number((base + spread * pattern[index]).toFixed(1))),
    }));
  };

  const weakTopic = insights?.weakAreas?.[0]?.topic;
  const quizzesTrendDirection: "up" | "down" | "neutral" = quizzesCompleted > 0 ? "up" : "neutral";
  const accuracyTrendDirection: "up" | "down" | "neutral" = accuracy >= 70 ? "up" : accuracy >= 50 ? "neutral" : "down";
  const cardsTrendDirection: "up" | "down" | "neutral" = flashcardsReviewed > 0 ? "up" : "neutral";
  const dueTrendDirection: "up" | "down" | "neutral" = dueToday > 20 ? "up" : dueToday > 0 ? "neutral" : "down";

  return (
    // Route-level visual wrapper for smoother page entrance and premium surface depth.
    <div className="route-transition flex-1 overflow-auto rounded-3xl border border-border/60 bg-gradient-to-b from-slate-50 via-cyan-50/45 to-slate-100/60 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9 space-y-8 md:space-y-9">

        {/* ── Welcome Header ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 shadow-[0_14px_26px_-22px_rgba(15,23,42,0.7)] p-5 sm:p-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isEditingName ? (
                <>
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="max-w-[200px] h-9 text-xl font-bold"
                    data-testid="input-edit-name"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName} data-testid="button-save-name">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelName} data-testid="button-cancel-name">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {getGreeting()}, {userName} 👋
                  </h1>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setIsEditingName(true)} data-testid="button-edit-name">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Your personal learning command centre — here's what matters most today.
            </p>
          </div>
          {insights?.overview?.currentStreak && insights.overview.currentStreak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 text-sm font-semibold shrink-0">
              <Flame className="h-4 w-4" />
              {insights.overview.currentStreak} day streak
            </div>
          )}
        </div>

        {/* ── Summary Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          <EnhancedStatCard
            title="Quizzes Done"
            value={quizzesCompleted}
            icon={BrainCircuit}
            tooltip="Quizzes Done = total completed quiz attempts across your account."
            insight={quizzesCompleted > 0 ? `${quizzes.length} quizzes available for practice` : "Start your first quiz to build momentum"}
            trendLabel="this week"
            trendValue={quizzesCompleted > 0 ? `+${Math.max(1, Math.min(6, Math.round(quizzesCompleted / 3)))}` : "0"}
            trendDirection={quizzesTrendDirection}
            onClick={() => setLocation("/quizzes")}
            sparklineData={buildSparkline(Math.max(1, quizzesCompleted), Math.max(1, quizzesCompleted * 0.7), quizzesTrendDirection)}
            gradientClass="bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600"
            shadowClass="shadow-violet-500/25 hover:shadow-violet-500/30"
            testId="stat-quizzes-completed"
          />

          <EnhancedStatCard
            title="Accuracy"
            value={Math.round(accuracy)}
            suffix="%"
            icon={Target}
            tooltip="Accuracy = average quiz performance over time."
            insight={accuracy >= 80 ? "Excellent performance - stay consistent" : accuracy >= 60 ? (weakTopic ? `Good - watch ${weakTopic}` : "Good - keep improving") : (weakTopic ? `Weak in ${weakTopic}` : "Needs focused revision")}
            trendLabel="this week"
            trendValue={accuracyTrendDirection === "up" ? "+4%" : accuracyTrendDirection === "down" ? "-3%" : "0%"}
            trendDirection={accuracyTrendDirection}
            onClick={() => setLocation("/insights")}
            sparklineData={buildSparkline(Math.max(10, accuracy), 14, accuracyTrendDirection)}
            gradientClass="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600"
            shadowClass="shadow-emerald-500/25 hover:shadow-emerald-500/30"
            testId="stat-accuracy"
          />

          <EnhancedStatCard
            title="Cards Reviewed"
            value={flashcardsReviewed}
            icon={Layers}
            tooltip="Cards Reviewed = total flashcards completed during your current weekly cycle."
            insight={flashcardsReviewed > 0 ? (dueToday > flashcardsReviewed ? "You are behind schedule" : `${totalCardsCount} total cards in your library`) : "No reviews yet"}
            trendLabel="this week"
            trendValue={flashcardsReviewed > 0 ? `+${Math.max(1, Math.round(flashcardsReviewed / 6))}` : "0"}
            trendDirection={cardsTrendDirection}
            onClick={() => setLocation("/flashcards")}
            sparklineData={buildSparkline(Math.max(2, flashcardsReviewed), Math.max(3, flashcardsReviewed * 0.5), cardsTrendDirection)}
            gradientClass="bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-500"
            shadowClass="shadow-sky-500/25 hover:shadow-sky-500/30"
            testId="stat-flashcards-reviewed"
          />

          <EnhancedStatCard
            title="Due Today"
            value={dueToday}
            icon={Calendar}
            tooltip="Due Today = flashcards currently scheduled for review under spaced repetition."
            insight={dueToday > 25 ? `${dueToday} flashcards need review` : dueToday > 0 ? "A quick review now prevents backlog" : "All caught up"}
            trendLabel={dueToday > 0 ? "pending now" : "today"}
            trendValue={dueToday > 20 ? `+${dueToday}` : dueToday > 0 ? `${dueToday}` : "-100%"}
            trendDirection={dueTrendDirection}
            onClick={() => setLocation("/flashcards")}
            sparklineData={buildSparkline(Math.max(1, dueToday), Math.max(3, dueToday * 0.35), dueTrendDirection)}
            gradientClass={dueToday > 0 ? "bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600" : "bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600"}
            shadowClass={dueToday > 25 ? "shadow-rose-500/30 ring-2 ring-rose-200/70 dark:ring-rose-400/30 hover:shadow-rose-500/40" : dueToday > 0 ? "shadow-rose-500/25 hover:shadow-rose-500/30" : "shadow-slate-500/25 hover:shadow-slate-500/30"}
            priorityBadge={dueToday > 25 ? "High Priority" : undefined}
            testId="stat-due-today"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setLocation("/insights")}
            className="text-left rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 p-3 hover:-translate-y-0.5 transition-transform"
          >
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Mini Insight</p>
            <p className="text-sm font-semibold mt-0.5">Best Study Day: Monday</p>
            <p className="text-xs text-muted-foreground mt-1">Tap for full analytics breakdown.</p>
          </button>
          <button
            type="button"
            onClick={handleReviewFlashcards}
            className="text-left rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 p-3 hover:-translate-y-0.5 transition-transform"
          >
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Micro Pattern</p>
            <p className="text-sm font-semibold mt-0.5">Flashcards Lift Retention</p>
            <p className="text-xs text-muted-foreground mt-1">Keep review streaks for stronger recall.</p>
          </button>
          <button
            type="button"
            onClick={handleStartQuiz}
            className="text-left rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 p-3 hover:-translate-y-0.5 transition-transform"
          >
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Focus Window</p>
            <p className="text-sm font-semibold mt-0.5">Prime Session: Evening</p>
            <p className="text-xs text-muted-foreground mt-1">Attempt a timed quiz in your peak window.</p>
          </button>
        </div>

        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold">Personal Goal Progress</p>
                <p className="text-xs text-muted-foreground">
                  {weeklyStudyMinutes} / {weeklyGoalMinutes} minutes this week ({goalProgress}%)
                </p>
              </div>
              <div className="w-full md:w-64">
                <Progress value={goalProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-indigo-200/70 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-sm">Recommended Actions</CardTitle>
                <CardDescription className="text-xs">Top priorities chosen from weak areas, workload, and activity patterns.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">Showing {Math.min(2, recommendedActions.length)} priorities</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendedActions.slice(0, 2).map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200/70 dark:border-indigo-800/40 bg-white/90 dark:bg-slate-900/90 p-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 text-white">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.priority === "high" && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                  <Button size="sm" onClick={item.action} className="h-8 px-3 text-xs" data-testid={`recommended-action-${index}`}>
                    {item.cta}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Quick Actions ────────────────────────────────────────── */}
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.85)] p-5 sm:p-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="flex flex-wrap gap-3.5">
            <Button
              variant="outline"
              onClick={() => setLocation("/notes")}
              className="gap-2 rounded-xl border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Note
            </Button>
            <Button
              variant="outline"
              onClick={handleStartQuiz}
              className="gap-2 rounded-xl border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all"
            >
              <PlayCircle className="h-4 w-4" />
              Start Quiz
            </Button>
            <Button
              variant="outline"
              onClick={handleReviewFlashcards}
              className="gap-2 rounded-xl border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all"
            >
              <CreditCard className="h-4 w-4" />
              Review Flashcards
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/research")}
              className="gap-2 rounded-xl border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Insight Scout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className={`border bg-white/90 dark:bg-slate-900/90 shadow-sm ${behaviorState === "active" ? "border-emerald-200/80 dark:border-emerald-900/50" : behaviorState === "struggling" ? "border-amber-200/80 dark:border-amber-900/40" : "border-slate-200/80 dark:border-slate-800"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Continue Last Session</CardTitle>
              <CardDescription className="text-xs">Resume from where your momentum is strongest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-slate-200/70 dark:border-slate-800 p-2.5 bg-slate-50/70 dark:bg-slate-800/40">
                <p className="text-xs text-muted-foreground">Next best step</p>
                <p className="text-sm font-semibold mt-0.5">{dueToday > 0 ? "Flashcard review session" : quizzes.length > 0 ? "Quick quiz session" : "Open your latest notes"}</p>
                <p className="text-xs text-muted-foreground mt-1">{lastStudyDate ? `Last activity: ${lastStudyDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : "No recent activity tracked"}</p>
              </div>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleContinueLastSession} data-testid="button-continue-last-session">
                <Rocket className="h-4 w-4" />
                Continue Last Session
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resume Previous Topic</CardTitle>
              <CardDescription className="text-xs">Jump back into your latest note context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-slate-200/70 dark:border-slate-800 p-2.5 bg-slate-50/70 dark:bg-slate-800/40">
                <p className="text-xs text-muted-foreground">Topic context</p>
                <p className="text-sm font-semibold mt-0.5">{lastNote?.title || "No recent note"}</p>
                <p className="text-xs text-muted-foreground mt-1">{lastNote?.subject || "General"} · Last score: {quizBestScore || 0}%</p>
              </div>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleResumePreviousTopic} data-testid="button-resume-topic">
                <FileText className="h-4 w-4" />
                Resume Previous Topic
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Revise Weak Area</CardTitle>
              <CardDescription className="text-xs">Prioritize low-confidence topics first.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-rose-200/70 dark:border-rose-900/40 p-2.5 bg-rose-50/70 dark:bg-rose-950/20">
                <p className="text-xs text-muted-foreground">Priority target</p>
                <p className="text-sm font-semibold mt-0.5">{insights?.weakAreas?.[0]?.topic || "No weak topic flagged"}</p>
                <p className="text-xs text-muted-foreground mt-1">Accuracy: {insights?.weakAreas?.[0]?.accuracy ?? Math.round(contextAccuracy)}%</p>
              </div>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleReviseWeakArea} data-testid="button-revise-weak-area">
                <Target className="h-4 w-4" />
                Revise Weak Area
              </Button>
            </CardContent>
          </Card>
        </div>

        {preferences.studyPromptsEnabled && (
        <Card className="border border-sky-200/70 dark:border-sky-900/40 bg-sky-50/60 dark:bg-sky-950/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm">Smart Prompts</CardTitle>
                <CardDescription className="text-xs">Rotating guidance based on your recent activity and trend signals.</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">Adaptive</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-sky-900 dark:text-sky-300 font-medium min-h-[42px] transition-all duration-300">
              {activePrompt.text}
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-8 text-xs" onClick={activePrompt.action} data-testid="button-smart-prompt-cta">
                {activePrompt.cta}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setSmartPromptIndex((current) => (current + 1) % smartPromptItems.length)}>
                Next Prompt
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              {contextualPrompts.map((prompt, index) => (
                <p key={index} className="text-[11px] text-sky-900/90 dark:text-sky-300/90">{prompt}</p>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm">
          <CardContent className="py-4">
            {behaviorState === "inactive" && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold">Get back on track</p>
                  <p className="text-xs text-muted-foreground">A short restart session now will rebuild your rhythm quickly.</p>
                </div>
                <Button size="sm" onClick={handleContinueLastSession}>Resume</Button>
              </div>
            )}
            {behaviorState === "active" && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold">You are in a strong flow</p>
                  <p className="text-xs text-muted-foreground">Push forward with higher-difficulty quizzes and keep momentum.</p>
                </div>
                <Button size="sm" onClick={handleStartQuiz}>Challenge Me</Button>
              </div>
            )}
            {behaviorState === "struggling" && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold">Targeted support recommended</p>
                  <p className="text-xs text-muted-foreground">Focus weak areas first, then retake a quick quiz to validate gains.</p>
                </div>
                <Button size="sm" onClick={handleReviseWeakArea}>Revise Now</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Main Grid ────────────────────────────────────────────── */}
        {/* Main dashboard modules with larger spacing for better scanability. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* Left column — 2/3 width */}
          <div className="lg:col-span-2 space-y-7">

            {/* Continue Where You Left Off */}
            <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent shadow-sm flex items-center justify-center">
                      <Rocket className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Continue Where You Left Off</CardTitle>
                      <CardDescription className="text-xs">Prioritised tasks for maximum impact</CardDescription>
                    </div>
                  </div>
                  <Link href="/insights">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
                      View Insights <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {studyActions.length > 0 ? (
                  studyActions.map((action, index) => (
                    <ActionCard
                      key={index}
                      {...action}
                      testId={`action-${index}`}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
                    <p className="font-semibold text-sm">All caught up!</p>
                    <p className="text-xs mt-1">No urgent tasks right now — great work!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {features.map((feature) => (
                <Link href={feature.href} key={feature.title}>
                  <Card
                    className={`hover:-translate-y-1 hover:scale-[1.015] hover:shadow-lg cursor-pointer transition-all duration-300 relative border-0 ${feature.bgGradient} text-white overflow-hidden h-full shadow-md shadow-slate-300/50 dark:shadow-none`}
                    data-testid={`card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {feature.urgent && (
                      <Badge variant="destructive" className="absolute top-2 right-2 text-xs bg-white text-destructive font-bold animate-pulse">
                        Due
                      </Badge>
                    )}
                    <CardContent className="p-3">
                      <div className="w-10 h-10 rounded-lg bg-white/25 backdrop-blur-sm flex items-center justify-center mb-2">
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="font-bold text-sm">{feature.title}</p>
                      <p className="text-xs text-white/90 font-medium">{feature.description}</p>
                      {feature.subtitle && (
                        <p className="text-xs text-white/70 mt-1">{feature.subtitle}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Flashcard Mastery Bar */}
            {totalCardsCount > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Flashcard Mastery</span>
                    <span className="text-xs font-bold text-foreground">{Math.round((masteredCardsCount / totalCardsCount) * 100)}%</span>
                  </div>
                  <Progress value={(masteredCardsCount / totalCardsCount) * 100} className="h-2" />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{masteredCardsCount} / {totalCardsCount} mastered</span>
              </div>
            )}
          </div>

          {/* Right sidebar — 1/3 width */}
          <div className="space-y-6">

            {/* Recent Notes */}
            {recentNotes.length > 0 && (
              <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                        <FileText className="h-3.5 w-3.5 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold">Recent Notes</CardTitle>
                    </div>
                    <Link href="/notes">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground px-2">
                        All <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-1">
                  {recentNotes.slice(0, 4).map((note) => (
                    <Link href={`/notes/${note.id}`} key={note.id}>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                        <div className="w-8 h-8 rounded-md bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
                          <BookOpen className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{note.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {note.subject || "General"} &middot; {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleBookmarkedNote(note.id);
                          }}
                          data-testid={`bookmark-note-${note.id}`}
                        >
                          {preferences.bookmarkedNoteIds.includes(note.id)
                            ? <BookmarkCheck className="h-4 w-4 text-amber-500" />
                            : <Bookmark className="h-4 w-4 text-muted-foreground" />}
                        </span>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Weak Topics */}
            {insights?.weakAreas && insights.weakAreas.length > 0 && (
              <Card className="border border-rose-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <CardHeader className="pb-2 border-b border-rose-50 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                      <AlertTriangle className="h-3.5 w-3.5 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Needs Attention</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-2">
                  {insights.weakAreas.slice(0, 3).map((area, index) => (
                    <div key={index} className="space-y-2">
                      <WeakTopicCard {...area} />
                      <div className="flex items-center gap-2 pl-1">
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setLocation("/notes")}>Revise</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setLocation("/quizzes?launch=random")}>Take Quiz</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setLocation("/flashcards?launch=random")}>Review Flashcards</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Wins */}
            <Card className="border border-emerald-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-2 border-b border-emerald-50 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Quick Wins</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {quickWins.map((win, index) => (
                  <QuickWinCard key={index} {...win} />
                ))}
              </CardContent>
            </Card>

            {/* Strengths */}
            {insights?.strengths && insights.strengths.length > 0 && (
              <Card className="border border-violet-100 dark:border-slate-800 shadow-sm bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 dark:bg-slate-900">
                <CardHeader className="pb-2 border-b border-violet-100/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                      <Award className="h-3.5 w-3.5 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Your Strengths</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-2">
                  {insights.strengths.slice(0, 3).map((strength, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-sm font-medium truncate">{strength.topic}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                        {strength.accuracy}%
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
