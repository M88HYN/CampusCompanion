/*
==========================================================
File: client/src/pages/performance.tsx

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

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AnalyticsStatCard, ActivityCard } from "@/components/analytics-cards";
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
  SlidersHorizontal,
  ChevronDown,
  CircleHelp,
} from "lucide-react";

interface InfoHintProps {
  text: string;
}

function InfoHint({ text }: InfoHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/*
----------------------------------------------------------
Component: Performance

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
export default function Performance() {
  const [showInsightControls, setShowInsightControls] = useState(false);
  const [showWeeklyProgress, setShowWeeklyProgress] = useState(true);
  const [showAccuracyTrends, setShowAccuracyTrends] = useState(true);
  const [showDataQuality, setShowDataQuality] = useState(false);
  const [showTopicInsights, setShowTopicInsights] = useState(true);
  const [showDifficultyBreakdown, setShowDifficultyBreakdown] = useState(true);
  const [showQuizRealism, setShowQuizRealism] = useState(false);
  const [showMetricGuide, setShowMetricGuide] = useState(false);

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

  const hasPerformanceData = summary.totalQuizzesTaken > 0;

  const sortedRecent = useMemo(
    () =>
      [...recentActivity].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [recentActivity],
  );
  const latestWindow = sortedRecent.slice(-3);
  const previousWindow = sortedRecent.slice(-6, -3);
  const latestSeven = sortedRecent.slice(-7);
  const priorSeven = sortedRecent.slice(-14, -7);

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

    /*
  ----------------------------------------------------------
  Function: avg

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - values: Input consumed by this routine during execution

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
const avg = (values: number[]) =>
    values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

  const latestAvg = avg(latestWindow.map((item) => item.accuracy));
  const previousAvg = avg(previousWindow.map((item) => item.accuracy));
  const momentumDelta = latestAvg - previousAvg;
  const recentWeekAvg = avg(latestSeven.map((item) => item.accuracy));
  const priorWeekAvg = avg(priorSeven.map((item) => item.accuracy));
  const weeklyDelta = recentWeekAvg - priorWeekAvg;

  const consistencyScore = (() => {
    if (sortedRecent.length < 2) return 0;
    const values = sortedRecent.map((item) => item.accuracy);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    const stdev = Math.sqrt(variance);
    return Math.max(0, Math.min(100, Math.round(100 - stdev * 2.1)));
  })();

  const confidenceLabel =
    summary.totalQuestionsAnswered >= 80
      ? "High confidence"
      : summary.totalQuestionsAnswered >= 30
      ? "Moderate confidence"
      : "Early signal";

    /*
  ----------------------------------------------------------
  Function: getTopicConfidence

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - questionsAnswered: Input consumed by this routine during execution
  - quizzesTaken: Input consumed by this routine during execution

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
const getTopicConfidence = (questionsAnswered: number, quizzesTaken: number) => {
    const signal = questionsAnswered + quizzesTaken * 3;
    if (signal >= 40) return "High";
    if (signal >= 18) return "Medium";
    return "Low";
  };

    /*
  ----------------------------------------------------------
  Function: getPacingBand

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - avgTimeSeconds: Input consumed by this routine during execution

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
const getPacingBand = (avgTimeSeconds: number) => {
    if (avgTimeSeconds <= 35) return "Fast";
    if (avgTimeSeconds <= 65) return "Balanced";
    return "Deliberate";
  };

  const rankedStrengths = [...strengths]
    .sort(
      (a, b) =>
        b.accuracy * Math.log2(b.questionsAnswered + 1) -
        a.accuracy * Math.log2(a.questionsAnswered + 1),
    )
    .slice(0, 5);

  const rankedImprovements = [...areasToImprove]
    .sort(
      (a, b) =>
        a.accuracy * Math.log2(a.questionsAnswered + 1) -
        b.accuracy * Math.log2(b.questionsAnswered + 1),
    )
    .slice(0, 5);

  const momentumDirection = momentumDelta >= 0 ? "Improving" : "Slipping";
  const consistencyBand = consistencyScore >= 80 ? "Very stable" : consistencyScore >= 60 ? "Moderately stable" : "Volatile";
  const strongestDifficulty =
    performanceByDifficulty.length > 0
      ? [...performanceByDifficulty].sort((a, b) => b.accuracy - a.accuracy)[0]
      : null;
  const weakestDifficulty =
    performanceByDifficulty.length > 0
      ? [...performanceByDifficulty].sort((a, b) => a.accuracy - b.accuracy)[0]
      : null;

  return (
    <TooltipProvider delayDuration={120}>
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
              subtitle={`${confidenceLabel} • ${summary.totalQuestionsAnswered} answers`}
              iconBgColor="bg-emerald-100 dark:bg-emerald-900"
              iconColor="text-emerald-600 dark:text-emerald-400"
              textColor="text-emerald-700 dark:text-emerald-300"
              borderColor="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border"
            />
            <AnalyticsStatCard
              icon={<Clock className="h-8 w-8" />}
              title="Avg Time / Question"
              value={`${summary.avgTimePerQuestion}s`}
              subtitle={summary.avgTimePerQuestion <= 45 ? "Healthy pacing" : "Consider speed drills"}
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
                  <InfoHint text="These signals are generated from your recent quiz history to highlight meaningful strengths, weak spots, and trend shifts." />
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

          <Card className="border border-border">
            <Collapsible open={showInsightControls} onOpenChange={setShowInsightControls}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-brand-primary" />
                      Insight Controls
                      <InfoHint text="Use these toggles to simplify or expand the dashboard based on whether you want a quick snapshot or a deeper analysis session." />
                    </CardTitle>
                    <CardDescription>
                      Keep this panel collapsed for a focused view, or open it to show and hide analytics blocks.
                    </CardDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {showInsightControls ? "Hide controls" : "Customize view"}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${showInsightControls ? "rotate-180" : "rotate-0"}`}
                      />
                    </button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">Weekly progress</p>
                      <p className="text-xs text-muted-foreground">Show recent vs prior week momentum block</p>
                    </div>
                    <Switch
                      checked={showWeeklyProgress}
                      onCheckedChange={setShowWeeklyProgress}
                      data-testid="switch-weekly-progress"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">Accuracy trends</p>
                      <p className="text-xs text-muted-foreground">Show attempt-by-attempt trend snapshot</p>
                    </div>
                    <Switch
                      checked={showAccuracyTrends}
                      onCheckedChange={setShowAccuracyTrends}
                      data-testid="switch-accuracy-trends"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">Data quality panel</p>
                      <p className="text-xs text-muted-foreground">Show confidence and sample representativeness panel</p>
                    </div>
                    <Switch
                      checked={showDataQuality}
                      onCheckedChange={setShowDataQuality}
                      data-testid="switch-data-quality"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">Topic insights</p>
                      <p className="text-xs text-muted-foreground">Show strengths and improvement areas by topic</p>
                    </div>
                    <Switch
                      checked={showTopicInsights}
                      onCheckedChange={setShowTopicInsights}
                      data-testid="switch-topic-insights"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">Difficulty breakdown</p>
                      <p className="text-xs text-muted-foreground">Show easy/medium/hard accuracy distribution</p>
                    </div>
                    <Switch
                      checked={showDifficultyBreakdown}
                      onCheckedChange={setShowDifficultyBreakdown}
                      data-testid="switch-difficulty-breakdown"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">Quiz realism view</p>
                      <p className="text-xs text-muted-foreground">Show latest-vs-average quiz-level comparison</p>
                    </div>
                    <Switch
                      checked={showQuizRealism}
                      onCheckedChange={setShowQuizRealism}
                      data-testid="switch-quiz-realism"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">Metric guide</p>
                      <p className="text-xs text-muted-foreground">Show plain-language explanations for key analytics terms</p>
                    </div>
                    <Switch
                      checked={showMetricGuide}
                      onCheckedChange={setShowMetricGuide}
                      data-testid="switch-metric-guide"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {showMetricGuide ? (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Metric Guide</CardTitle>
                <CardDescription>Quick definitions to make performance analytics easier to interpret.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground">Momentum</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Change in average accuracy between your latest attempts and the previous attempt window.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground">Consistency score</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A stability indicator based on variation in recent scores; higher means more predictable performance.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground">Confidence label</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reflects how representative the analytics are given your current sample size of answered questions.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground">Realism view</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Compares your latest score to long-term average per quiz to reduce overreaction to one-off attempts.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                At a Glance Interpretation
                <InfoHint text="A concise summary of your current learning posture using momentum, stability, and difficulty performance signals." />
              </CardTitle>
              <CardDescription>High-level reading of your current analytics profile.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Momentum status</p>
                  <InfoHint text="Direction of change between your latest attempt window and the one immediately before it." />
                </div>
                <p className={`text-lg font-semibold mt-1 ${momentumDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {momentumDirection}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{momentumDelta >= 0 ? "+" : ""}{momentumDelta}% change</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Stability band</p>
                  <InfoHint text="Derived from score variance: higher stability means your results are more consistent across attempts." />
                </div>
                <p className="text-lg font-semibold text-foreground mt-1">{consistencyBand}</p>
                <p className="text-xs text-muted-foreground mt-1">Score: {consistencyScore}/100</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Best difficulty</p>
                <p className="text-lg font-semibold text-foreground mt-1 capitalize">{strongestDifficulty?.level ?? "N/A"}</p>
                <p className="text-xs text-muted-foreground mt-1">{strongestDifficulty?.accuracy ?? 0}% accuracy</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Needs support</p>
                <p className="text-lg font-semibold text-foreground mt-1 capitalize">{weakestDifficulty?.level ?? "N/A"}</p>
                <p className="text-xs text-muted-foreground mt-1">{weakestDifficulty?.accuracy ?? 0}% accuracy</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="border border-border xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Momentum & Stability
                  <InfoHint text="Tracks short-term trajectory and consistency to help you judge whether progress is reliable or noisy." />
                </CardTitle>
                <CardDescription>Recent trend quality based on your latest attempts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent momentum</p>
                      <InfoHint text="Calculated as: latest 3-attempt average minus the previous 3-attempt average." />
                    </div>
                    <p className="text-2xl font-semibold text-foreground mt-1">
                      {momentumDelta >= 0 ? "+" : ""}{momentumDelta}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Last 3 attempts avg {latestAvg}% vs prior window {previousAvg}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Consistency score</p>
                      <InfoHint text="A transformed variance score from recent attempts; lower spread in results yields a higher consistency score." />
                    </div>
                    <p className="text-2xl font-semibold text-foreground mt-1">{consistencyScore}/100</p>
                    <div className="mt-2">
                      <Progress value={consistencyScore} className="h-2" />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Interpretation: scores can fluctuate naturally; focus on sustained weekly movement over single attempts.
                </p>
              </CardContent>
            </Card>

            {showDataQuality ? (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Data quality
                  <InfoHint text="Shows how reliable current analytics are based on sample size and number of recorded attempts." />
                </CardTitle>
                <CardDescription>How representative your current metrics are.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <p className="text-sm text-muted-foreground">Attempts logged</p>
                  <p className="font-semibold text-foreground">{summary.totalQuizzesTaken}</p>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <p className="text-sm text-muted-foreground">Questions sampled</p>
                  <p className="font-semibold text-foreground">{summary.totalQuestionsAnswered}</p>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <Badge variant="secondary">{confidenceLabel}</Badge>
                </div>
              </CardContent>
            </Card>
            ) : null}
          </div>

          {showWeeklyProgress ? (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Weekly Progress
                  <InfoHint text="Compares your latest 7 attempts against the prior 7 to show medium-term direction." />
                </CardTitle>
                <CardDescription>Compares your last 7 attempts against the prior 7 attempts.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent week avg</p>
                  <p className="text-2xl font-semibold text-foreground mt-1">{recentWeekAvg}%</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Prior week avg</p>
                  <p className="text-2xl font-semibold text-foreground mt-1">{priorWeekAvg}%</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Weekly delta</p>
                  <p className={`text-2xl font-semibold mt-1 ${weeklyDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {weeklyDelta >= 0 ? "+" : ""}{weeklyDelta}%
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {showTopicInsights && (rankedStrengths.length > 0 || rankedImprovements.length > 0) ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="border border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <CardTitle className="text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Strength Areas
                    <InfoHint text="Topics are ranked by performance quality and sample strength, not just a single high score." />
                  </CardTitle>
                  <CardDescription>Weighted by accuracy and sample size to avoid noisy one-off scores.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rankedStrengths.length > 0 ? (
                    rankedStrengths.map((item) => {
                      const confidence = getTopicConfidence(item.questionsAnswered, item.quizzesTaken);
                      return (
                        <div key={item.topic} className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{item.topic}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.questionsAnswered} questions • {item.quizzesTaken} quizzes • {getPacingBand(item.avgTimeSeconds)} pace
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge className="bg-emerald-600 text-white">{item.accuracy}%</Badge>
                              <p className="text-[11px] text-muted-foreground mt-1">{confidence} confidence</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Complete more quizzes to surface stable strengths.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-rose-200 dark:border-rose-800">
                <CardHeader>
                  <CardTitle className="text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Improvement Areas
                    <InfoHint text="Prioritized topics combine lower accuracy with sufficient data to avoid overreacting to outliers." />
                  </CardTitle>
                  <CardDescription>Prioritized by consistently lower accuracy with enough attempts to be meaningful.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rankedImprovements.length > 0 ? (
                    rankedImprovements.map((item) => {
                      const confidence = getTopicConfidence(item.questionsAnswered, item.quizzesTaken);
                      const recommendation =
                        item.accuracy < 50
                          ? "Rebuild fundamentals with shorter daily drills."
                          : "Target mixed practice and review common mistakes.";
                      const priority = item.accuracy < 45 ? "High" : item.accuracy < 60 ? "Medium" : "Low";
                      return (
                        <div key={item.topic} className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{item.topic}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.questionsAnswered} questions • {item.quizzesTaken} quizzes • {getPacingBand(item.avgTimeSeconds)} pace
                              </p>
                              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{recommendation}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">Priority: {priority}</Badge>
                                <Badge variant="outline">Focus this week: 2 targeted sessions</Badge>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge className="bg-rose-600 text-white">{item.accuracy}%</Badge>
                              <p className="text-[11px] text-muted-foreground mt-1">{confidence} confidence</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Great balance so far — no persistent weak topics detected.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {showDifficultyBreakdown ? (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Difficulty Breakdown
                  <InfoHint text="Highlights whether performance drops as question complexity increases." />
                </CardTitle>
                <CardDescription>Accuracy by question difficulty level.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {performanceByDifficulty.map((item) => (
                  <div key={item.level} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="capitalize font-medium text-foreground">{item.level}</p>
                      <div className="mt-2">
                        <Progress value={item.accuracy} className="h-1.5" />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground">{item.accuracy}%</p>
                      <p className="text-xs text-muted-foreground">{item.questionsAnswered} questions</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            ) : null}

            <ActivityCard activities={recentActivity} />
          </div>

          {showQuizRealism && quizPerformance.length > 0 ? (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Quiz-level realism view
                  <InfoHint text="Compares your latest attempt to your historical average for each quiz to provide a reality check." />
                </CardTitle>
                <CardDescription>Compare latest vs average performance by quiz topic.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quizPerformance.slice(0, 6).map((quiz) => {
                  const delta = quiz.latestAccuracy - quiz.averageAccuracy;
                  return (
                    <div key={quiz.quizId} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{quiz.quizTitle}</p>
                          <p className="text-xs text-muted-foreground">{quiz.attempts} attempts • best {quiz.bestAccuracy}%</p>
                        </div>
                        <Badge variant="secondary" className={delta >= 0 ? "text-emerald-700" : "text-rose-700"}>
                          {delta >= 0 ? "+" : ""}{delta}% vs avg
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}

          {showAccuracyTrends ? (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Accuracy Trends
                  <InfoHint text="Shows recent attempt-by-attempt changes so you can identify short-term drift or recovery." />
                </CardTitle>
                <CardDescription>Recent attempt-level accuracy movement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedRecent.slice(-8).map((attempt, index) => (
                  <div key={`${attempt.quizTitle}-${index}`} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <p className="truncate text-muted-foreground">{attempt.quizTitle}</p>
                      <p className="font-medium text-foreground">{attempt.accuracy}%</p>
                    </div>
                    <Progress value={attempt.accuracy} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
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
    </TooltipProvider>
  );
}
