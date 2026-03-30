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
  PlayCircle, CreditCard, ArrowUpRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

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

  const studyActions = generateStudyNowActions();
  const quickWins = generateQuickWins();

  if (isLoadingMetrics || isLoadingDecks || isLoadingQuizzes || isLoadingNotes) {
    return (
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
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

  return (
    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ── Welcome Header ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
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
                    {getGreeting()}, {userName}!
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 rounded-xl p-4 text-white shadow-lg shadow-violet-500/25 dark:shadow-none dark:ring-1 dark:ring-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200 cursor-default">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">Quizzes Done</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" data-testid="stat-quizzes-completed">{quizzesCompleted}</div>
            <p className="text-xs opacity-80 mt-1">
              {quizzesCompleted > 0 ? `${quizzes.length} available` : "Start your first quiz"}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/25 dark:shadow-none dark:ring-1 dark:ring-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 cursor-default">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">Accuracy</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" data-testid="stat-accuracy">{accuracy}%</div>
            <p className="text-xs opacity-80 mt-1">
              {accuracy >= 80 ? "Excellent performance" : accuracy >= 60 ? "Good — keep improving" : "Across all quizzes"}
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-500 rounded-xl p-4 text-white shadow-lg shadow-sky-500/25 dark:shadow-none dark:ring-1 dark:ring-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-200 cursor-default">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">Cards Reviewed</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" data-testid="stat-flashcards-reviewed">{flashcardsReviewed}</div>
            <p className="text-xs opacity-80 mt-1">
              {flashcardsReviewed > 0 ? `${totalCardsCount} total cards` : "No reviews yet"}
            </p>
          </div>

          <div className={`rounded-xl p-4 text-white shadow-lg dark:shadow-none dark:ring-1 dark:ring-white/10 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-default ${dueToday > 0 ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 shadow-rose-500/25 hover:shadow-rose-500/30' : 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 shadow-slate-500/25 hover:shadow-slate-500/30'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">Due Today</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" data-testid="stat-due-today">{dueToday}</div>
            <p className="text-xs opacity-80 mt-1">
              {dueToday > 0 ? "flashcards need review" : "All caught up!"}
            </p>
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="flex flex-wrap gap-3">
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
              onClick={() => setLocation("/quizzes")}
              className="gap-2 rounded-xl border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all"
            >
              <PlayCircle className="h-4 w-4" />
              Start Quiz
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/flashcards")}
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

        {/* ── Main Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — 2/3 width */}
          <div className="lg:col-span-2 space-y-6">

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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {features.map((feature) => (
                <Link href={feature.href} key={feature.title}>
                  <Card
                    className={`hover:-translate-y-1 hover:shadow-lg cursor-pointer transition-all duration-200 relative border-0 ${feature.bgGradient} text-white overflow-hidden h-full shadow-md shadow-slate-300/50 dark:shadow-none`}
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
          <div className="space-y-5">

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
                    <WeakTopicCard key={index} {...area} />
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
