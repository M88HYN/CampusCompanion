import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsStatCard, ActivityCard, InsightCard } from "@/components/analytics-cards";
import { useQuizAnalytics } from "@/hooks/use-quiz-analytics";
import {
  Trophy,
  Target,
  Clock,
  Flame,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Gauge,
} from "lucide-react";

export default function Performance() {
  const {
    summary,
    strengths,
    areasToImprove,
    recentActivity,
    quizPerformance,
    performanceByDifficulty,
    smartInsights,
    studyOverview,
    isLoading,
  } = useQuizAnalytics();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 bg-gradient-to-br from-cyan-50 via-teal-50 to-indigo-50 dark:from-slate-950 dark:via-cyan-950/30 dark:to-indigo-950/30 min-h-full">
        <div className="h-9 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  const hasPerformanceData = summary.totalQuizzesTaken > 0;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gradient-to-br from-cyan-50 via-teal-50 to-indigo-50 dark:from-slate-950 dark:via-cyan-950/30 dark:to-indigo-950/30 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quiz results, accuracy trends, and actionable performance insights.
          </p>
        </div>
        <Badge className="bg-teal-600 text-white hover:bg-teal-700">Analytics</Badge>
      </div>

      {hasPerformanceData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <AnalyticsStatCard
              icon={<Trophy className="h-8 w-8" />}
              title="Quizzes Taken"
              value={summary.totalQuizzesTaken}
              subtitle={`${summary.totalQuestionsAnswered} questions`}
              iconBgColor="bg-teal-100 dark:bg-teal-900"
              iconColor="text-teal-600 dark:text-teal-400"
              textColor="text-teal-700 dark:text-teal-300"
              borderColor="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border"
            />
            <AnalyticsStatCard
              icon={<Target className="h-8 w-8" />}
              title="Overall Accuracy"
              value={`${summary.overallAccuracy}%`}
              subtitle="Across all attempts"
              iconBgColor="bg-emerald-100 dark:bg-emerald-900"
              iconColor="text-emerald-600 dark:text-emerald-400"
              textColor="text-emerald-700 dark:text-emerald-300"
              borderColor="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border"
            />
            <AnalyticsStatCard
              icon={<Clock className="h-8 w-8" />}
              title="Avg Time / Question"
              value={`${summary.avgTimePerQuestion}s`}
              subtitle="Speed and pacing"
              iconBgColor="bg-blue-100 dark:bg-blue-900"
              iconColor="text-brand-primary dark:text-blue-400"
              textColor="text-brand-primary dark:text-blue-300"
              borderColor="border-brand-primary/30 dark:border-brand-primary/40 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border"
            />
            <AnalyticsStatCard
              icon={<Flame className="h-8 w-8" />}
              title="Current Streak"
              value={`${studyOverview.currentStreak} days`}
              subtitle={`Best ${studyOverview.longestStreak} days`}
              iconBgColor="bg-amber-100 dark:bg-amber-900"
              iconColor="text-amber-600 dark:text-amber-400"
              textColor="text-amber-700 dark:text-amber-300"
              borderColor="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border"
            />
          </div>

          {smartInsights.length > 0 ? (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Performance Signals
                </CardTitle>
                <CardDescription>Automatically detected trends from your quiz attempts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {smartInsights.slice(0, 6).map((insight, index) => (
                  <div
                    key={`${insight.type}-${index}`}
                    className={`rounded-lg border p-3 ${
                      insight.type === "strength"
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                        : insight.type === "weakness"
                        ? "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40"
                        : "border-brand-primary/30 bg-brand-primary/10 dark:border-brand-primary/40 dark:bg-brand-primary/20"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {insight.type === "strength" ? (
                        <TrendingUp className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                      ) : insight.type === "weakness" ? (
                        <TrendingDown className="h-4 w-4 mt-0.5 text-rose-600 dark:text-rose-400" />
                      ) : (
                        <BarChart3 className="h-4 w-4 mt-0.5 text-brand-primary dark:text-blue-400" />
                      )}
                      <p className="text-sm text-muted-foreground">{insight.text}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {(strengths.length > 0 || areasToImprove.length > 0) ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <InsightCard
                title="Strength Areas"
                subtitle="Topics where you're consistently strong"
                items={strengths}
                badgeColor="bg-emerald-600"
                icon={<TrendingUp className="h-5 w-5" />}
                borderColor="border border-emerald-200 dark:border-emerald-800"
                accentColor="text-emerald-700 dark:text-emerald-300"
                itemBgColor="bg-emerald-50 dark:bg-emerald-950"
                titleColor="text-emerald-700 dark:text-emerald-300"
              />
              <InsightCard
                title="Improvement Areas"
                subtitle="Topics that need more practice"
                items={areasToImprove}
                badgeColor="bg-rose-600"
                icon={<Target className="h-5 w-5" />}
                borderColor="border border-rose-200 dark:border-rose-800"
                accentColor="text-rose-700 dark:text-rose-300"
                itemBgColor="bg-rose-50 dark:bg-rose-950"
                titleColor="text-rose-700 dark:text-rose-300"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Difficulty Breakdown</CardTitle>
                <CardDescription>Accuracy by question difficulty level.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {performanceByDifficulty.map((item) => (
                  <div key={item.level} className="flex items-center justify-between rounded-md border border-border p-3">
                    <p className="capitalize font-medium text-foreground">{item.level}</p>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{item.accuracy}%</p>
                      <p className="text-xs text-muted-foreground">{item.questionsAnswered} questions</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <ActivityCard activities={recentActivity} />
          </div>
        </>
      ) : (
        <Card className="border border-border">
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-10 w-10 mx-auto text-slate-400 mb-3" />
            <h2 className="text-xl font-semibold text-foreground">No performance data yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete a few quizzes to unlock your dedicated performance analytics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
