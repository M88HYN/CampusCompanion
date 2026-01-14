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
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1" data-testid={`${testId}-value`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center`}>
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
    if (acc >= 80) return "bg-emerald-500";
    if (acc >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{topic}</span>
          <Badge variant="outline" className="text-xs">
            {totalQuestions} questions
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{accuracy}%</span>
          {improvement !== 0 && (
            <span className={`flex items-center text-xs ${improvement > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {improvement > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(improvement)}%
            </span>
          )}
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${getColor(accuracy)} rounded-full transition-all`} style={{ width: `${accuracy}%` }} />
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-rose-500 bg-rose-50 dark:bg-rose-950/30';
      case 'medium': return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30';
      case 'low': return 'border-l-sky-500 bg-sky-50 dark:bg-sky-950/30';
      default: return 'border-l-slate-500';
    }
  };

  const Icon = getIcon(recommendation.type);

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex gap-3">
        <Icon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">{recommendation.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{recommendation.description}</p>
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
      <div className="h-full overflow-auto bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950">
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
    <div className="h-full overflow-auto bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Learning Insights
            </h1>
            <p className="text-sm text-muted-foreground">
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
          <Card className="shadow-lg border-0" data-testid="card-accuracy-trends">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
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

          <Card className="shadow-lg border-0" data-testid="card-weekly-progress">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-500" />
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
          <Card className="shadow-lg border-0 lg:col-span-2" data-testid="card-topic-performance">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-500" />
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

          <Card className="shadow-lg border-0" data-testid="card-peak-study-times">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
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
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span className="text-sm font-medium">{timeLabel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{pattern.sessions} sessions</span>
                            <Badge variant={i === 0 ? "default" : "outline"} className="text-xs">
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
          <Card className="shadow-lg border-0" data-testid="card-strengths">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                Your Strengths
              </CardTitle>
              <CardDescription>Topics where you excel</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.strengths && insights.strengths.length > 0 ? (
                <div className="space-y-3">
                  {insights.strengths.map((strength, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{strength.topic}</p>
                          <p className="text-xs text-muted-foreground">
                            {strength.masteredConcepts} concepts mastered
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500 text-white">{strength.accuracy}%</Badge>
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

          <Card className="shadow-lg border-0" data-testid="card-weak-areas">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Areas to Improve
              </CardTitle>
              <CardDescription>Topics that need more attention</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.weakAreas && insights.weakAreas.length > 0 ? (
                <div className="space-y-3">
                  {insights.weakAreas.map((area, i) => (
                    <div key={i} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{area.topic}</p>
                        <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                          {area.accuracy}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{area.suggestion}</p>
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

        <Card className="shadow-lg border-0" data-testid="card-recommendations">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
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
