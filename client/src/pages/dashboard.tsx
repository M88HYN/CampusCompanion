import { useState, useEffect } from "react";
import { 
  BookOpen, BrainCircuit, GraduationCap, Sparkles, Clock, TrendingUp, 
  Flame, Target, Calendar, Edit2, Save, X, Lightbulb, AlertTriangle,
  Zap, ChevronRight, Play, CheckCircle2, ArrowRight, Award, BarChart3,
  Timer, Brain, Rocket
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

interface DueCard {
  id: number;
  deckId: number;
  front: string;
  back: string;
}

interface Deck {
  id: number;
  name: string;
  subject?: string;
  cardCount?: number;
}

interface Quiz {
  id: number;
  title: string;
  subject?: string;
  questionCount?: number;
  bestScore?: number;
  attemptCount?: number;
}

interface Note {
  id: number;
  title: string;
  subject?: string;
  updatedAt: string;
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
      <Card className="hover-elevate cursor-pointer transition-all border-0 shadow-md overflow-hidden h-full" data-testid={testId}>
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

  const { data: insights, isLoading: isLoadingInsights } = useQuery<LearningInsights>({
    queryKey: ['/api/learning-insights'],
  });

  const { data: dueCards = [] } = useQuery<DueCard[]>({
    queryKey: ['/api/cards/due'],
  });

  const { data: decks = [] } = useQuery<Deck[]>({
    queryKey: ['/api/decks'],
  });

  const { data: quizzes = [] } = useQuery<Quiz[]>({
    queryKey: ['/api/quizzes'],
  });

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['/api/notes'],
  });

  const features = [
    {
      title: "Notes",
      description: "Organize materials",
      icon: BookOpen,
      bgGradient: "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600",
      href: "/notes",
      count: notes.length,
    },
    {
      title: "Quizzes",
      description: "Test knowledge",
      icon: BrainCircuit,
      bgGradient: "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500",
      href: "/quizzes",
      count: quizzes.length,
    },
    {
      title: "Flashcards",
      description: "Spaced repetition",
      icon: GraduationCap,
      bgGradient: "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600",
      href: "/flashcards",
      count: decks.length,
      urgent: dueCards.length > 0,
    },
    {
      title: "Insight Scout",
      description: "AI research",
      icon: Sparkles,
      bgGradient: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
      href: "/research",
    },
    {
      title: "Revision Help",
      description: "Focus tools",
      icon: Lightbulb,
      bgGradient: "bg-gradient-to-br from-yellow-400 via-lime-500 to-green-500",
      href: "/revision",
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

    const lowScoreQuizzes = quizzes.filter(q => q.bestScore !== undefined && q.bestScore < 70);
    if (lowScoreQuizzes.length > 0) {
      const quiz = lowScoreQuizzes[0];
      actions.push({
        title: `Retake: ${quiz.title}`,
        description: `Your last score was ${quiz.bestScore}%. A focused review can improve your understanding.`,
        reason: "Below target score",
        timeEstimate: `${Math.ceil((quiz.questionCount || 10) * 1.5)} min`,
        priority: (quiz.bestScore || 0) < 50 ? 'high' : 'medium',
        icon: BrainCircuit,
        href: "/quizzes",
        gradient: "bg-gradient-to-br from-fuchsia-400 to-rose-500"
      });
    }

    if (insights?.recommendations) {
      insights.recommendations.slice(0, 2).forEach(rec => {
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

    if (dueCards.length > 0 && dueCards.length <= 5) {
      wins.push({
        title: `${dueCards.length} easy cards`,
        description: "Quick review to keep your streak",
        href: "/flashcards",
        icon: CheckCircle2,
        action: "2 min"
      });
    }

    if (insights?.strengths && insights.strengths.length > 0) {
      wins.push({
        title: `Review ${insights.strengths[0].topic}`,
        description: "Reinforce your strongest subject",
        href: "/flashcards",
        icon: Award,
        action: "5 min"
      });
    }

    if (notes.length > 0) {
      wins.push({
        title: "Review recent notes",
        description: "Refresh your latest study material",
        href: "/notes",
        icon: BookOpen,
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

  const weekTotal = insights?.weeklyProgress?.reduce((sum, day) => sum + day.minutes, 0) || 0;
  const weekItems = insights?.weeklyProgress?.reduce((sum, day) => sum + day.items, 0) || 0;

  if (isLoadingInsights) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
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
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
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
                <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {userName}!</h1>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingName(true)} data-testid="button-edit-name">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground text-sm">
              Your personal learning command centre. Here's what matters most today.
            </p>
          </div>
          {insights?.overview?.currentStreak && insights.overview.currentStreak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
              <Flame className="h-5 w-5" />
              <span className="font-bold">{insights.overview.currentStreak} day streak</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">Due Today</span>
            </div>
            <div className="text-3xl font-bold" data-testid="stat-due-today">{dueCards.length}</div>
            <p className="text-xs opacity-80 mt-1">cards to review</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">Accuracy</span>
            </div>
            <div className="text-3xl font-bold" data-testid="stat-accuracy">{insights?.overview?.overallAccuracy || 0}%</div>
            <p className="text-xs opacity-80 mt-1">overall</p>
          </div>

          <div className="bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">This Week</span>
            </div>
            <div className="text-3xl font-bold" data-testid="stat-week-time">{Math.round(weekTotal / 60)}h</div>
            <p className="text-xs opacity-80 mt-1">study time</p>
          </div>

          <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 opacity-80" />
              <span className="text-xs font-semibold opacity-90">Items Reviewed</span>
            </div>
            <div className="text-3xl font-bold" data-testid="stat-items-reviewed">{weekItems}</div>
            <p className="text-xs opacity-80 mt-1">this week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
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

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {features.map((feature) => (
                <Link href={feature.href} key={feature.title}>
                  <Card
                    className={`hover-elevate cursor-pointer transition-all relative border-0 ${feature.bgGradient} text-white overflow-hidden h-full shadow-md`}
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
                      <p className="text-xs text-white/80">{feature.description}</p>
                      {feature.count !== undefined && (
                        <p className="text-xs text-white/60 mt-1">{feature.count} items</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {insights?.weakAreas && insights.weakAreas.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
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

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
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
              <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
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
                    <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
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
