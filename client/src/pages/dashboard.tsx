import { useState, useEffect } from "react";
import { 
  BookOpen, BrainCircuit, GraduationCap, Sparkles, Clock, TrendingUp, 
  Flame, Target, Calendar, Edit2, Save, X, Lightbulb, AlertTriangle,
  Zap, ChevronRight, Play, CheckCircle2, ArrowRight, Award, BarChart3,
  Timer, Brain, Rocket, Layers, FileText, Activity
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

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
  const priorityColors = {
    high: 'bg-rose-500',
    medium: 'bg-amber-500',
    low: 'bg-sky-500'
  };

  return (
    <Link href={href}>
      <Card className="hover-elevate cursor-pointer transition-all border border-slate-100 shadow-md shadow-slate-200/50 dark:shadow-none dark:border-slate-800 overflow-hidden h-full bg-white dark:bg-slate-900" data-testid={testId}>
        <div className={`h-1.5 ${priorityColors[priority]}`} />
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shrink-0`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm">{title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Timer className="h-3 w-3" />
                  {timeEstimate}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs font-normal">
                  {reason}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-medium text-sm">{topic}</span>
        <Badge variant={accuracy < 50 ? "destructive" : "secondary"} className="text-xs shrink-0">
          {accuracy}% accuracy
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
      <div className="flex items-center gap-3 flex-wrap p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 hover-elevate cursor-pointer border border-emerald-200 dark:border-emerald-800" data-testid={`quick-win-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="shrink-0 text-emerald-600 border-emerald-300 dark:border-emerald-700">
          {action}
        </Badge>
      </div>
    </Link>
  );
}

export default function Dashboard({ userRole = "student" }: DashboardProps) {
  const { user } = useAuth();
  const [userName, setUserName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // Initialize userName from user profile
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

  // Fetch real metrics from backend
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
    enabled: !!user,
    retry: 1,
  });

  // Fetch due flashcards for immediate review
  const { data: dueCards = [], isError: dueCardsError } = useQuery<DueCard[]>({
    queryKey: ['/api/dashboard/due-flashcards'],
    enabled: !!user,
    retry: 1,
  });

  // Fetch lowest scoring quiz for retake recommendation
  const { data: lowestQuiz } = useQuery({
    queryKey: ['/api/dashboard/lowest-quiz'],
    enabled: !!user,
    retry: 1,
  });

  // Fetch recent notes
  const { data: recentNotes = [], isError: notesError } = useQuery<Note[]>({
    queryKey: ['/api/dashboard/recent-notes'],
    enabled: !!user,
    retry: 1,
  });

  // Keep the existing queries for deck/quiz counts
  const { data: decks = [], isError: decksError } = useQuery<Deck[]>({
    queryKey: ['/api/decks'],
    enabled: !!user,
    retry: 1,
  });

  const { data: quizzes = [], isError: quizzesError } = useQuery<Quiz[]>({
    queryKey: ['/api/quizzes'],
    enabled: !!user,
    retry: 1,
  });

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['/api/notes'],
    enabled: !!user,
    retry: 1,
  });

  // Still fetch insights for weak areas and strengths
  const { data: insights, isLoading: isLoadingInsights } = useQuery<LearningInsights>({
    queryKey: ['/api/learning-insights'],
    enabled: !!user,
    retry: 1,
  });

  // Calculate total cards across all decks for the feature card
  const totalCardsCount = decks.reduce((sum: number, d: any) => sum + (d.cards || 0), 0);
  const masteredCardsCount = decks.reduce((sum: number, d: any) => sum + (d.mastered || 0), 0);
  const quizBestScore = quizzes.length > 0 
    ? Math.max(...quizzes.map((q: any) => q.bestScore || 0))
    : 0;

  const features = [
    {
      title: "Notes",
      description: notes.length > 0 ? `${notes.length} notes across subjects` : "Start writing notes",
      icon: BookOpen,
      bgGradient: "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600",
      href: "/notes",
      count: notes.length,
      subtitle: notes.length > 0 ? "with rich content & AI tools" : "Organize your study materials",
    },
    {
      title: "Quizzes",
      description: quizzes.length > 0 ? `${quizzes.length} quizzes available` : "Create your first quiz",
      icon: BrainCircuit,
      bgGradient: "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500",
      href: "/quizzes",
      count: quizzes.length,
      subtitle: quizBestScore > 0 ? `Best score: ${quizBestScore}%` : "Test your knowledge",
    },
    {
      title: "Flashcards",
      description: decks.length > 0 ? `${decks.length} decks` : "Create a deck",
      icon: GraduationCap,
      bgGradient: "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600",
      href: "/flashcards",
      count: decks.length,
      urgent: dueCards.length > 0,
      subtitle: dueCards.length > 0 ? `${dueCards.length} cards due now` : "Spaced repetition learning",
    },
    {
      title: "Insight Scout",
      description: "AI-powered research",
      icon: Sparkles,
      bgGradient: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
      href: "/research",
      subtitle: "Ask anything, get explanations",
    },
    {
      title: "Revision",
      description: "Spaced review queue",
      icon: Lightbulb,
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

    // 1. Due flashcards
    if (dueCards.length > 0) {
      actions.push({
        title: `Review ${dueCards.length} Flashcard${dueCards.length > 1 ? 's' : ''}`,
        description: "Cards are due for review today. Reviewing now maintains your memory retention.",
        reason: "Spaced repetition due",
        timeEstimate: `${Math.ceil(dueCards.length * 0.5)} min`,
        priority: dueCards.length > 10 ? 'high' : 'medium',
        icon: GraduationCap,
        href: "/flashcards",
        gradient: "bg-gradient-to-br from-emerald-400 to-teal-500"
      });
    }

    // 2. Retake lowest scoring quiz
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

    // 3. Weak areas from insights
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

    // 4. Additional recommendations
    if (insights?.recommendations) {
      insights.recommendations.slice(0, 1).forEach(rec => {
        const iconMap: Record<string, React.ElementType> = {
          'focus': AlertTriangle,
          'practice': Target,
          'timing': Clock,
          'challenge': Zap,
          'flashcards': GraduationCap,
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
        description: "Ask any study question and get AI-powered explanations and research assistance.",
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

    // Small number of due cards
    if (dueCards.length > 0 && dueCards.length <= 5) {
      wins.push({
        title: `${dueCards.length} quick cards`,
        description: "Quick review to keep your streak alive",
        href: "/flashcards",
        icon: CheckCircle2,
        action: "2 min"
      });
    }

    // Master area reinforcement
    if (insights?.strengths && insights.strengths.length > 0) {
      wins.push({
        title: `Master: ${insights.strengths[0].topic}`,
        description: "Reinforce your strongest subject",
        href: "/flashcards",
        icon: Award,
        action: "5 min"
      });
    }

    // Recent notes review
    if (recentNotes.length > 0) {
      const mostRecent = recentNotes[0];
      wins.push({
        title: `Review: ${mostRecent.title.substring(0, 20)}...`,
        description: "Refresh your latest study material",
        href: `/notes/${mostRecent.id}`,
        icon: BookOpen,
        action: "3 min"
      });
    }

    // Pomodoro session
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

  if (isLoadingInsights || isLoadingMetrics) {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:bg-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="max-w-xs text-2xl font-bold"
                  data-testid="input-edit-name"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSaveName} data-testid="button-save-name">
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelName} data-testid="button-cancel-name">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-white dark:via-white dark:to-white bg-clip-text text-transparent">Welcome back, {userName}!</h1>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingName(true)} data-testid="button-edit-name">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your personal learning command centre. Here's what matters most today.
            </p>
          </div>
          {insights?.overview?.currentStreak && insights.overview.currentStreak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30">
              <Flame className="h-5 w-5" />
              <span className="font-bold">{insights.overview.currentStreak} day streak</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-xl p-3 sm:p-4 text-white shadow-lg shadow-blue-500/25 dark:shadow-none dark:ring-1 dark:ring-white/10">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Calendar className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">Due Today</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" data-testid="stat-due-today">
              {metrics?.dueToday ?? dueCards.length}
            </div>
            <p className="text-xs opacity-80 mt-1">
              {(metrics?.dueToday ?? dueCards.length) > 0 
                ? `flashcards need review` 
                : "all caught up!"}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/25 dark:shadow-none dark:ring-1 dark:ring-white/10">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Target className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">Accuracy</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" data-testid="stat-accuracy">
              {metrics?.accuracy ?? insights?.overview?.overallAccuracy ?? 0}%
            </div>
            <p className="text-xs opacity-80 mt-1">
              {(metrics?.accuracy ?? 0) >= 80 ? "excellent performance" 
                : (metrics?.accuracy ?? 0) >= 60 ? "good, keep improving" 
                : "across all quizzes"}
            </p>
          </div>

          <div className="bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-xl p-4 text-white shadow-lg shadow-pink-500/25 dark:shadow-none dark:ring-1 dark:ring-white/10">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Clock className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">This Week</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" data-testid="stat-week-time">
              {metrics?.weeklyStudyTime ? `${Math.floor(metrics.weeklyStudyTime / 60)}h ${metrics.weeklyStudyTime % 60}m` : "0h"}
            </div>
            <p className="text-xs opacity-80 mt-1">
              {(metrics?.weeklyStudyTime ?? 0) > 120 ? "great dedication!" 
                : (metrics?.weeklyStudyTime ?? 0) > 0 ? "total study time" 
                : "start studying today"}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-xl p-4 text-white shadow-lg shadow-orange-500/25 dark:shadow-none dark:ring-1 dark:ring-white/10">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <BarChart3 className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">Items Reviewed</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" data-testid="stat-items-reviewed">
              {metrics?.itemsReviewedThisWeek ?? 0}
            </div>
            <p className="text-xs opacity-80 mt-1">
              {(metrics?.itemsReviewedThisWeek ?? 0) > 50 ? "impressive volume!" 
                : (metrics?.itemsReviewedThisWeek ?? 0) > 0 ? "questions this week" 
                : "no reviews yet"}
            </p>
          </div>
        </div>

        {/* Your Library at a Glance */}
        <Card className="border border-white/60 shadow-lg shadow-blue-500/5 dark:shadow-none dark:border-slate-800 bg-white/80 backdrop-blur-sm dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{notes.length}</p>
                  <p className="text-xs text-muted-foreground">Notes</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md shadow-emerald-500/30 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{totalCardsCount}</p>
                  <p className="text-xs text-muted-foreground">Flashcards</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-rose-500 shadow-md shadow-pink-500/30 flex items-center justify-center shrink-0">
                  <BrainCircuit className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{quizzes.length}</p>
                  <p className="text-xs text-muted-foreground">Quizzes</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Flashcard Mastery</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{totalCardsCount > 0 ? Math.round((masteredCardsCount / totalCardsCount) * 100) : 0}%</span>
                </div>
                <Progress value={totalCardsCount > 0 ? (masteredCardsCount / totalCardsCount) * 100 : 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{masteredCardsCount} of {totalCardsCount} cards mastered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-white/60 shadow-lg shadow-teal-500/5 dark:shadow-none dark:border-slate-800 bg-white/80 backdrop-blur-sm dark:bg-slate-900">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md shadow-teal-500/30 flex items-center justify-center">
                      <Rocket className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Study Now</CardTitle>
                      <CardDescription>Prioritized tasks for maximum impact</CardDescription>
                    </div>
                  </div>
                  <Link href="/insights">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">
                      View Insights <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {studyActions.length > 0 ? (
                  studyActions.map((action, index) => (
                    <ActionCard
                      key={index}
                      {...action}
                      testId={`action-${index}`}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm">No urgent tasks right now. Great work!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {features.map((feature) => (
                <Link href={feature.href} key={feature.title}>
                  <Card
                    className={`hover-elevate cursor-pointer transition-all relative border-0 ${feature.bgGradient} text-white overflow-hidden h-full shadow-lg shadow-slate-300/50 dark:shadow-none`}
                    data-testid={`card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {feature.urgent && (
                      <Badge variant="destructive" className="absolute top-2 right-2 text-xs bg-white text-red-600 font-bold animate-pulse">
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
          </div>

          <div className="space-y-6">
            {insights?.weakAreas && insights.weakAreas.length > 0 && (
              <Card className="border border-rose-100 shadow-lg shadow-rose-500/5 dark:shadow-none dark:border-slate-800 bg-white/80 backdrop-blur-sm dark:bg-slate-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/30 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Weak Topics</CardTitle>
                      <CardDescription>Areas needing attention</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.weakAreas.slice(0, 3).map((area, index) => (
                    <WeakTopicCard key={index} {...area} />
                  ))}
                </CardContent>
              </Card>
            )}

            {recentNotes.length > 0 && (
              <Card className="border border-blue-100 shadow-lg shadow-blue-500/5 dark:shadow-none dark:border-slate-800 bg-white/80 backdrop-blur-sm dark:bg-slate-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-blue-500/30 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Recent Notes</CardTitle>
                        <CardDescription>Your latest study material</CardDescription>
                      </div>
                    </div>
                    <Link href="/notes">
                      <Button variant="ghost" size="sm" className="text-xs gap-1">
                        All Notes <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentNotes.slice(0, 4).map((note) => (
                    <Link href={`/notes/${note.id}`} key={note.id}>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="w-8 h-8 rounded-md bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{note.title}</p>
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

            <Card className="border border-emerald-100 shadow-lg shadow-emerald-500/5 dark:shadow-none dark:border-slate-800 bg-white/80 backdrop-blur-sm dark:bg-slate-900">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/30 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Quick Wins</CardTitle>
                    <CardDescription>Build momentum fast</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickWins.map((win, index) => (
                  <QuickWinCard key={index} {...win} />
                ))}
              </CardContent>
            </Card>

            {insights?.strengths && insights.strengths.length > 0 && (
              <Card className="border border-violet-200/60 shadow-lg shadow-violet-500/5 dark:shadow-none dark:border-slate-800 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/30 flex items-center justify-center">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Your Strengths</CardTitle>
                      <CardDescription>Topics you've mastered</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {insights.strengths.slice(0, 3).map((strength, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/60 dark:bg-slate-800/70">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-sm font-medium">{strength.topic}</span>
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
