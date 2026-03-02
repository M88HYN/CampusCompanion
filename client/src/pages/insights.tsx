/*
==========================================================
File: client/src/pages/insights.tsx

Module: Insight Scout and Research

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

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, TrendingUp, TrendingDown, Clock, Target, Flame, 
  BookOpen, HelpCircle, Lightbulb, AlertTriangle, Award,
  BarChart3, Calendar, Zap
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from "recharts";

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
  accuracyTrends: { date: string; quizAccuracy: number; flashcardAccuracy: number }[];
  topicPerformance: { topic: string; accuracy: number; totalQuestions: number; improvement: number }[];
  studyPatterns: { hour: number; sessions: number; avgAccuracy: number }[];
  weakAreas: { topic: string; accuracy: number; suggestion: string }[];
  strengths: { topic: string; accuracy: number; masteredConcepts: number }[];
  recommendations: { type: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  weeklyProgress: { day: string; minutes: number; items: number }[];
}

/*
----------------------------------------------------------
Component: StatCard

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- title: Input consumed by this routine during execution
- value: Input consumed by this routine during execution
- subtitle: Input consumed by this routine during execution
- Icon: Input consumed by this routine during execution
- gradient: Input consumed by this routine during execution
- testId: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient,
  testId
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ElementType; 
  gradient: string;
  testId: string;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg" data-testid={testId}>
      <div className={`absolute inset-0 ${gradient} opacity-10`} />
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 text-foreground" data-testid={`${testId}-value`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/*
----------------------------------------------------------
Component: TopicBar

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- topic: Input consumed by this routine during execution
- accuracy: Input consumed by this routine during execution
- totalQuestions: Input consumed by this routine during execution
- improvement: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
function TopicBar({ topic, accuracy, totalQuestions, improvement }: { 
  topic: string; 
  accuracy: number; 
  totalQuestions: number;
  improvement: number;
}) {
    /*
  ----------------------------------------------------------
  Function: getColor

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - acc: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const getColor = (acc: number) => {
    if (acc >= 80) return "bg-gradient-to-r from-emerald-500 to-teal-500";
    if (acc >= 60) return "bg-gradient-to-r from-amber-500 to-orange-500";
    return "bg-gradient-to-r from-rose-500 to-pink-500";
  };

    /*
  ----------------------------------------------------------
  Function: getBadgeColor

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - acc: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const getBadgeColor = (acc: number) => {
    if (acc >= 80) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
    if (acc >= 60) return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{topic}</span>
          <Badge variant="outline" className="text-xs">
            {totalQuestions} questions
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs border-0 ${getBadgeColor(accuracy)}`}>{accuracy}%</Badge>
          {improvement !== 0 && (
            <span className={`flex items-center text-xs font-medium ${improvement > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {improvement > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(improvement)}%
            </span>
          )}
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${getColor(accuracy)} rounded-full transition-all shadow-sm`} style={{ width: `${accuracy}%` }} />
      </div>
    </div>
  );
}

/*
----------------------------------------------------------
Component: RecommendationCard

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- recommendation: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
function RecommendationCard({ recommendation }: { 
  recommendation: { type: string; title: string; description: string; priority: 'high' | 'medium' | 'low' } 
}) {
    /*
  ----------------------------------------------------------
  Function: getIcon

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - type: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const getIcon = (type: string) => {
    switch (type) {
      case 'focus': return AlertTriangle;
      case 'practice': return Target;
      case 'timing': return Clock;
      case 'challenge': return Zap;
      case 'flashcards': return BookOpen;
      default: return Lightbulb;
    }
  };

    /*
  ----------------------------------------------------------
  Function: getPriorityStyles

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - priority: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high': return {
        border: 'border-l-4 border-l-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-950/20',
        iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
      };
      case 'medium': return {
        border: 'border-l-4 border-l-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      };
      case 'low': return {
        border: 'border-l-4 border-l-sky-500',
        bg: 'bg-sky-50 dark:bg-sky-950/20',
        iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
      };
      default: return {
        border: 'border-l-4 border-l-slate-500',
        bg: 'bg-slate-50 dark:bg-slate-950/20',
        iconBg: 'bg-gradient-to-br from-slate-500 to-slate-600',
      };
    }
  };

  const Icon = getIcon(recommendation.type);
  const styles = getPriorityStyles(recommendation.priority);

  return (
    <div className={`p-4 rounded-lg ${styles.border} ${styles.bg} border shadow-sm`}>
      <div className="flex gap-3">
        <div className={`w-9 h-9 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0 shadow-md`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-medium text-sm text-foreground">{recommendation.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{recommendation.description}</p>
        </div>
      </div>
    </div>
  );
}

/*
----------------------------------------------------------
Component: Insights

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- None: Operates using closure/module state only

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
export default function Insights() {
  const { data: insights, isLoading } = useQuery<LearningInsights>({
    queryKey: ['/api/learning-insights'],
  });

  if (isLoading) {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-violet-50 via-sky-50 to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  const overview = insights?.overview || {
    totalStudyTime: 0,
    totalSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    cardsReviewed: 0,
    quizzesTaken: 0,
    overallAccuracy: 0
  };

  const avgSessionMinutes = overview.totalSessions > 0
    ? Math.round(overview.totalStudyTime / overview.totalSessions)
    : 0;
  const streakReliability = overview.longestStreak > 0
    ? Math.round((overview.currentStreak / overview.longestStreak) * 100)
    : 0;
  const topicCoverage = insights?.topicPerformance?.filter((topic) => topic.totalQuestions > 0).length || 0;
  const maxTopicQuestions = Math.max(...(insights?.topicPerformance?.map((topic) => topic.totalQuestions) || [1]));
  const cardsPerQuiz = overview.quizzesTaken > 0
    ? (overview.cardsReviewed / overview.quizzesTaken).toFixed(1)
    : "0.0";

    /*
  ----------------------------------------------------------
  Function: formatStudyTime

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - minutes: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-violet-50 via-sky-50 to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Learning Insights
            </h1>
            <p className="text-sm text-muted-foreground">
              Data-driven analysis of your study behavior, rhythm, and engagement quality
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="insights-stats-grid">
          <StatCard
            title="Study Time"
            value={formatStudyTime(overview.totalStudyTime)}
            subtitle={`${overview.totalSessions} sessions logged`}
            icon={Clock}
            gradient="bg-gradient-to-br from-sky-500 to-blue-600"
            testId="stat-study-time"
          />
          <StatCard
            title="Session Depth"
            value={`${avgSessionMinutes}m`}
            subtitle="Average minutes per session"
            icon={Zap}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            testId="stat-session-depth"
          />
          <StatCard
            title="Streak Reliability"
            value={`${streakReliability}%`}
            subtitle={`${overview.currentStreak}/${overview.longestStreak || 0} days`}
            icon={Flame}
            gradient="bg-gradient-to-br from-orange-500 to-red-600"
            testId="stat-streak-reliability"
          />
          <StatCard
            title="Revision Mix"
            value={cardsPerQuiz}
            subtitle="Flashcards reviewed per quiz"
            icon={BookOpen}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            testId="stat-revision-mix"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg bg-card backdrop-blur" data-testid="card-accuracy-trends">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                Accuracy Trends
              </CardTitle>
              <CardDescription>Tracks how quiz and flashcard accuracy evolve together over time.</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.accuracyTrends && insights.accuracyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={insights.accuracyTrends}>
                    <defs>
                      <linearGradient id="quizGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="flashcardGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="quizAccuracy" 
                      stroke="#1E3A8A" 
                      fill="url(#quizGradient)"
                      strokeWidth={2}
                      name="Quiz"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="flashcardAccuracy" 
                      stroke="#06B6D4" 
                      fill="url(#flashcardGradient)"
                      strokeWidth={2}
                      name="Flashcard"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Complete quizzes to see accuracy trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card backdrop-blur" data-testid="card-weekly-progress">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Weekly Progress
              </CardTitle>
              <CardDescription>Compares learning volume (minutes) and throughput (items reviewed) by day.</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.weeklyProgress && insights.weeklyProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={insights.weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="items" fill="#1E3A8A" radius={[4, 4, 0, 0]} name="Items Reviewed" />
                    <Bar dataKey="minutes" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start studying to track your weekly progress</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-card backdrop-blur lg:col-span-2" data-testid="card-topic-engagement">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Topic Engagement Distribution
              </CardTitle>
              <CardDescription>Shows where your question volume is concentrated, independent of accuracy scores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights?.topicPerformance && insights.topicPerformance.length > 0 ? (
                insights.topicPerformance
                  .sort((a, b) => b.totalQuestions - a.totalQuestions)
                  .slice(0, 6)
                  .map((topic, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-foreground">{topic.topic}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{topic.totalQuestions} questions</Badge>
                        <span className="text-xs text-muted-foreground">{topicCoverage} active topics</span>
                      </div>
                    </div>
                    <Progress value={(topic.totalQuestions / maxTopicQuestions) * 100} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Answer quiz questions to see topic engagement distribution</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card backdrop-blur" data-testid="card-peak-study-times">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                Peak Study Times
              </CardTitle>
                <CardDescription>When your study activity is most frequent and productive.</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.studyPatterns && insights.studyPatterns.length > 0 ? (
                <div className="space-y-3">
                  {insights.studyPatterns
                    .filter(p => p.sessions > 0)
                    .sort((a, b) => b.avgAccuracy - a.avgAccuracy)
                    .slice(0, 5)
                    .map((pattern, i) => {
                      const hour = pattern.hour;
                      const timeLabel = hour < 12 
                        ? `${hour === 0 ? 12 : hour}:00 AM` 
                        : hour === 12 
                          ? '12:00 PM' 
                          : `${hour - 12}:00 PM`;
                      
                      return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/30">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/50' : 'bg-slate-400'}`} />
                            <span className="text-sm font-medium text-foreground">{timeLabel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{pattern.sessions} sessions</span>
                            <Badge variant={i === 0 ? "default" : "outline"} className={`text-xs ${i === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-600 border-0' : ''}`}>
                              {pattern.avgAccuracy}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  {insights.studyPatterns.filter(p => p.sessions > 0).length === 0 && (
                    <div className="py-6 text-center text-muted-foreground">
                      <p className="text-sm">Study more to discover your peak times</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No study pattern data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg bg-card backdrop-blur" data-testid="card-learning-signals">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                Learning Signals
              </CardTitle>
              <CardDescription>Behavior-oriented indicators that describe how you are studying.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900/30">
                  <p className="text-sm font-medium text-foreground">Consistency Health</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {streakReliability >= 70
                      ? "Your current streak is close to your best streak, indicating steady routine adherence."
                      : "Your streak is below your historical best; small daily sessions can restore consistency quickly."}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-sky-200 dark:border-sky-900/30">
                  <p className="text-sm font-medium text-foreground">Session Depth</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You currently average {avgSessionMinutes} minutes per study session across {overview.totalSessions} sessions.
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-900/30">
                  <p className="text-sm font-medium text-foreground">Topic Breadth</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You have engaged with {topicCoverage} topic areas so far, which reflects your current revision breadth.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card backdrop-blur" data-testid="card-focus-queue">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                Focus Queue
              </CardTitle>
              <CardDescription>Action-oriented queue generated from your current weak areas.</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.weakAreas && insights.weakAreas.length > 0 ? (
                <div className="space-y-3">
                  {insights.weakAreas.slice(0, 5).map((area, i) => (
                    <div key={i} className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/30 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm text-foreground">{area.topic}</p>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-md">
                          {area.accuracy}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{area.suggestion}</p>
                      <p className="text-[11px] text-foreground/70 mt-1">Suggested cadence: 2 short targeted reviews this week.</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active focus queue right now — your coverage is balanced.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg bg-card backdrop-blur" data-testid="card-recommendations">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              Personalized Recommendations
            </CardTitle>
            <CardDescription>Study-strategy suggestions based on behavior patterns and coverage.</CardDescription>
          </CardHeader>
          <CardContent>
            {insights?.recommendations && insights.recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.recommendations.map((rec, i) => (
                  <RecommendationCard key={i} recommendation={rec} />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Complete more activities to receive personalized recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
