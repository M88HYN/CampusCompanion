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
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white" data-testid={`${testId}-value`}>{value}</p>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopicBar({ topic, accuracy, totalQuestions, improvement }: { 
  topic: string; 
  accuracy: number; 
  totalQuestions: number;
  improvement: number;
}) {
  const getColor = (acc: number) => {
    if (acc >= 80) return "bg-gradient-to-r from-emerald-500 to-teal-500";
    if (acc >= 60) return "bg-gradient-to-r from-amber-500 to-orange-500";
    return "bg-gradient-to-r from-rose-500 to-pink-500";
  };

  const getBadgeColor = (acc: number) => {
    if (acc >= 80) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
    if (acc >= 60) return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-900 dark:text-white">{topic}</span>
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

function RecommendationCard({ recommendation }: { 
  recommendation: { type: string; title: string; description: string; priority: 'high' | 'medium' | 'low' } 
}) {
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
          <p className="font-medium text-sm text-slate-900 dark:text-white">{recommendation.title}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{recommendation.description}</p>
        </div>
      </div>
    </div>
  );
}

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
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Data-driven analysis of your study patterns and performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="insights-stats-grid">
          <StatCard
            title="Overall Accuracy"
            value={`${overview.overallAccuracy}%`}
            subtitle="Across all activities"
            icon={Target}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            testId="stat-overall-accuracy"
          />
          <StatCard
            title="Study Time"
            value={formatStudyTime(overview.totalStudyTime)}
            subtitle={`${overview.totalSessions} sessions`}
            icon={Clock}
            gradient="bg-gradient-to-br from-sky-500 to-blue-600"
            testId="stat-study-time"
          />
          <StatCard
            title="Current Streak"
            value={`${overview.currentStreak} days`}
            subtitle={`Best: ${overview.longestStreak} days`}
            icon={Flame}
            gradient="bg-gradient-to-br from-orange-500 to-red-600"
            testId="stat-current-streak"
          />
          <StatCard
            title="Cards Reviewed"
            value={overview.cardsReviewed}
            subtitle={`${overview.quizzesTaken} quizzes taken`}
            icon={BookOpen}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            testId="stat-cards-reviewed"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur" data-testid="card-accuracy-trends">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                Accuracy Trends
              </CardTitle>
              <CardDescription>Your performance over the last 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.accuracyTrends && insights.accuracyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={insights.accuracyTrends}>
                    <defs>
                      <linearGradient id="quizGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="flashcardGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
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
                      stroke="#8b5cf6" 
                      fill="url(#quizGradient)"
                      strokeWidth={2}
                      name="Quiz"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="flashcardAccuracy" 
                      stroke="#14b8a6" 
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

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur" data-testid="card-weekly-progress">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Weekly Progress
              </CardTitle>
              <CardDescription>Study activity over the past week</CardDescription>
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
                    <Bar dataKey="items" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Items Reviewed" />
                    <Bar dataKey="minutes" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Minutes" />
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
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur lg:col-span-2" data-testid="card-topic-performance">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Topic Performance
              </CardTitle>
              <CardDescription>How you're doing in each subject area</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights?.topicPerformance && insights.topicPerformance.length > 0 ? (
                insights.topicPerformance.slice(0, 6).map((topic, i) => (
                  <TopicBar key={i} {...topic} />
                ))
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Answer quiz questions to see topic performance</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur" data-testid="card-peak-study-times">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                Peak Study Times
              </CardTitle>
              <CardDescription>When you perform best</CardDescription>
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
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{timeLabel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{pattern.sessions} sessions</span>
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
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur" data-testid="card-strengths">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                Your Strengths
              </CardTitle>
              <CardDescription>Topics where you excel</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.strengths && insights.strengths.length > 0 ? (
                <div className="space-y-3">
                  {insights.strengths.map((strength, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-900/30 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-white">{strength.topic}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {strength.masteredConcepts} concepts mastered
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-md">{strength.accuracy}%</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Keep practicing to identify your strengths</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur" data-testid="card-weak-areas">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                Areas to Improve
              </CardTitle>
              <CardDescription>Topics that need more attention</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.weakAreas && insights.weakAreas.length > 0 ? (
                <div className="space-y-3">
                  {insights.weakAreas.map((area, i) => (
                    <div key={i} className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/30 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{area.topic}</p>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-md">
                          {area.accuracy}%
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{area.suggestion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No weak areas identified yet - great job!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur" data-testid="card-recommendations">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              Personalized Recommendations
            </CardTitle>
            <CardDescription>Suggestions to improve your learning</CardDescription>
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
