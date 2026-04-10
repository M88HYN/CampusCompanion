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

import { useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ActivityCard } from "@/components/analytics-cards";
import { useQuizAnalytics } from "@/hooks/use-quiz-analytics";
import {
  Trophy, Target, Clock, Flame, BarChart3, TrendingUp, TrendingDown,
  Gauge, SlidersHorizontal, CircleHelp, ChevronDown, ChevronsUpDown,
  Maximize2, X, Eye,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey =
  | "weeklyProgress"
  | "accuracyTrends"
  | "dataQuality"
  | "strengthAreas"
  | "improvementAreas"
  | "difficultyBreakdown"
  | "quizRealism"
  | "metricGuide";

interface SectionState {
  visible: boolean;
  expanded: boolean;
}

type SectionsConfig = Record<SectionKey, SectionState>;

const SECTION_LABELS: Record<SectionKey, { title: string; description: string }> = {
  weeklyProgress:      { title: "Weekly Progress",        description: "Momentum block" },
  accuracyTrends:      { title: "Accuracy Trends",        description: "Attempt trend chart" },
  dataQuality:         { title: "Data Quality",           description: "Signal confidence" },
  strengthAreas:       { title: "Strength Areas",         description: "Best-performing topics" },
  improvementAreas:    { title: "Improvement Areas",      description: "Priority focus topics" },
  difficultyBreakdown: { title: "Difficulty Breakdown",   description: "Easy / medium / hard view" },
  quizRealism:         { title: "Quiz Realism View",      description: "Latest vs average" },
  metricGuide:         { title: "Metric Guide",           description: "Definitions panel" },
};

const DEFAULT_SECTIONS: SectionsConfig = {
  weeklyProgress:      { visible: true,  expanded: true },
  accuracyTrends:      { visible: true,  expanded: true },
  dataQuality:         { visible: false, expanded: true },
  strengthAreas:       { visible: true,  expanded: true },
  improvementAreas:    { visible: true,  expanded: true },
  difficultyBreakdown: { visible: true,  expanded: true },
  quizRealism:         { visible: false, expanded: true },
  metricGuide:         { visible: false, expanded: true },
};

// ─── Small helpers ─────────────────────────────────────────────────────────────

function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label="More information" className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <CircleHelp className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed"><p>{text}</p></TooltipContent>
    </Tooltip>
  );
}

// ─── CollapsibleCard ───────────────────────────────────────────────────────────
// Wraps a Card so the header is always visible; content folds with CSS transition.

function CollapsibleCard({
  title,
  description,
  hint,
  expanded,
  onToggle,
  onHide,
  children,
  className = "",
  titleClassName = "",
  headerRight,
}: {
  title: React.ReactNode;
  description?: string;
  hint?: string;
  expanded: boolean;
  onToggle: () => void;
  onHide?: () => void;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader
        className="cursor-pointer select-none group/header"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-2">
          <CardTitle className={`flex items-center gap-2 ${titleClassName}`}>
            {title}
            {hint && <InfoHint text={hint} />}
          </CardTitle>
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {headerRight}
            {onHide && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover/header:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                onClick={onHide}
                title="Hide section"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-0" : "-rotate-90"}`}
            />
          </div>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <CardContent className="pt-0">{children}</CardContent>
      </div>
    </Card>
  );
}

// ─── PremiumKpiCard ────────────────────────────────────────────────────────────

function PremiumKpiCard({
  title, value, subtitle, trend, icon, tone,
}: {
  title: string; value: string | number; subtitle?: string; trend?: string;
  icon: React.ReactNode; tone: "teal" | "emerald" | "blue" | "amber";
}) {
  const toneClasses = {
    teal: {
      shell: "from-teal-50/95 to-cyan-50/85 border-teal-200/80 dark:from-teal-950/35 dark:to-cyan-950/25 dark:border-teal-900/60",
      badge: "bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-900/70 dark:text-teal-200 dark:ring-teal-800/80",
      value: "text-teal-800 dark:text-teal-100",
    },
    emerald: {
      shell: "from-emerald-50/95 to-lime-50/85 border-emerald-200/80 dark:from-emerald-950/35 dark:to-lime-950/25 dark:border-emerald-900/60",
      badge: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/70 dark:text-emerald-200 dark:ring-emerald-800/80",
      value: "text-emerald-800 dark:text-emerald-100",
    },
    blue: {
      shell: "from-blue-50/95 to-sky-50/85 border-blue-200/80 dark:from-blue-950/35 dark:to-sky-950/25 dark:border-blue-900/60",
      badge: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/70 dark:text-blue-200 dark:ring-blue-800/80",
      value: "text-blue-800 dark:text-blue-100",
    },
    amber: {
      shell: "from-amber-50/95 to-orange-50/85 border-amber-200/80 dark:from-amber-950/35 dark:to-orange-950/25 dark:border-amber-900/60",
      badge: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/70 dark:text-amber-200 dark:ring-amber-800/80",
      value: "text-amber-800 dark:text-amber-100",
    },
  }[tone];

  return (
    <Card className={`group h-full rounded-[22px] border bg-gradient-to-br shadow-[0_10px_30px_-14px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-16px_rgba(15,23,42,0.32)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.75)] dark:hover:shadow-[0_18px_34px_-14px_rgba(0,0,0,0.78)] ${toneClasses.shell}`}>
      <CardContent className="flex h-full flex-col justify-between p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
            <p className={`mt-3 text-4xl font-bold leading-none md:text-[2.65rem] ${toneClasses.value}`}>{value}</p>
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${toneClasses.badge}`}>
            <span className="h-5 w-5">{icon}</span>
          </div>
        </div>
        <div className="mt-5 space-y-1.5">
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {trend && <p className="text-xs font-medium text-foreground/80">{trend}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Performance() {
  const [sections, setSections] = useState<SectionsConfig>(DEFAULT_SECTIONS);
  const [focusMode, setFocusMode] = useState(false);

  const toggleVisible = useCallback((key: SectionKey) =>
    setSections(s => ({ ...s, [key]: { ...s[key], visible: !s[key].visible } })), []);

  const toggleExpanded = useCallback((key: SectionKey) =>
    setSections(s => ({ ...s, [key]: { ...s[key], expanded: !s[key].expanded } })), []);

  const showSection = useCallback((key: SectionKey) =>
    setSections(s => ({ ...s, [key]: { ...s[key], visible: true, expanded: true } })), []);

  const expandAll = useCallback(() =>
    setSections(s => Object.fromEntries(
      Object.entries(s).map(([k, v]) => [k, { ...v, expanded: true }])
    ) as SectionsConfig), []);

  const collapseAll = useCallback(() =>
    setSections(s => Object.fromEntries(
      Object.entries(s).map(([k, v]) => [k, { ...v, expanded: false }])
    ) as SectionsConfig), []);

  const restoreAll = useCallback(() =>
    setSections(Object.fromEntries(
      Object.entries(DEFAULT_SECTIONS).map(([k, v]) => [k, { ...v, visible: true }])
    ) as SectionsConfig), []);

  const {
    summary, strengths, areasToImprove, recentActivity,
    quizPerformance, performanceByDifficulty, smartInsights, studyOverview, isLoading,
  } = useQuizAnalytics();

  const hasPerformanceData = summary.totalQuizzesTaken > 0;

  const sortedRecent = useMemo(
    () => [...recentActivity].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [recentActivity],
  );

  const latestWindow  = sortedRecent.slice(-3);
  const previousWindow = sortedRecent.slice(-6, -3);
  const latestSeven   = sortedRecent.slice(-7);
  const priorSeven    = sortedRecent.slice(-14, -7);

  if (isLoading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-cyan-50/70 to-blue-100/55 p-6 md:p-8 xl:p-10 dark:from-slate-950 dark:via-cyan-950/20 dark:to-blue-950/15">
        <div className="mx-auto max-w-[1400px] space-y-8 md:space-y-10">
          <div className="h-9 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-[22px] bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const avg = (values: number[]) =>
    values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;

  const latestAvg   = avg(latestWindow.map(i => i.accuracy));
  const previousAvg = avg(previousWindow.map(i => i.accuracy));
  const momentumDelta = latestAvg - previousAvg;
  const recentWeekAvg = avg(latestSeven.map(i => i.accuracy));
  const priorWeekAvg  = avg(priorSeven.map(i => i.accuracy));
  const weeklyDelta   = recentWeekAvg - priorWeekAvg;

  const consistencyScore = (() => {
    if (sortedRecent.length < 2) return 0;
    const vals = sortedRecent.map(i => i.accuracy);
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const stdev = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
    return Math.max(0, Math.min(100, Math.round(100 - stdev * 2.1)));
  })();

  const confidenceLabel =
    summary.totalQuestionsAnswered >= 80 ? "High confidence" :
    summary.totalQuestionsAnswered >= 30 ? "Moderate confidence" : "Early signal";

  const getTopicConfidence = (qa: number, qt: number) => {
    const s = qa + qt * 3;
    return s >= 40 ? "High" : s >= 18 ? "Medium" : "Low";
  };

  const getPacingBand = (sec: number) =>
    sec <= 35 ? "Fast" : sec <= 65 ? "Balanced" : "Deliberate";

  const rankedStrengths   = [...strengths].sort((a, b) => b.accuracy * Math.log2(b.questionsAnswered + 1) - a.accuracy * Math.log2(a.questionsAnswered + 1)).slice(0, 5);
  const rankedImprovements = [...areasToImprove].sort((a, b) => a.accuracy * Math.log2(a.questionsAnswered + 1) - b.accuracy * Math.log2(b.questionsAnswered + 1)).slice(0, 5);

  const momentumDirection  = momentumDelta >= 0 ? "Improving" : "Slipping";
  const consistencyBand    = consistencyScore >= 80 ? "Very stable" : consistencyScore >= 60 ? "Moderately stable" : "Volatile";
  const strongestDifficulty = performanceByDifficulty.length > 0 ? [...performanceByDifficulty].sort((a, b) => b.accuracy - a.accuracy)[0] : null;
  const weakestDifficulty   = performanceByDifficulty.length > 0 ? [...performanceByDifficulty].sort((a, b) => a.accuracy - b.accuracy)[0] : null;

  const hiddenSections = (Object.entries(sections) as [SectionKey, SectionState][])
    .filter(([, v]) => !v.visible)
    .map(([k]) => k);

  const collapsedCount = (Object.values(sections) as SectionState[]).filter(v => v.visible && !v.expanded).length;

  const sectionCard =
    "rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.24)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/65 dark:shadow-[0_12px_30px_-14px_rgba(0,0,0,0.75)]";

  const miniCard =
    "rounded-2xl border border-slate-200/75 bg-white/85 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/65";

  // In focus mode only KPI cards + signals are shown
  const visible = (key: SectionKey) => !focusMode && sections[key].visible;
  const expanded = (key: SectionKey) => sections[key].expanded;

  return (
    <TooltipProvider delayDuration={120}>
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-cyan-50/70 to-blue-100/55 px-5 py-7 md:px-8 md:py-9 xl:px-10 xl:py-10 dark:from-slate-950 dark:via-cyan-950/20 dark:to-blue-950/15">
        <div className="mx-auto max-w-[1400px] space-y-6 md:space-y-8">

          {/* ── Page header ──────────────────────────────────────────── */}
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-slate-200/75 bg-white/70 p-5 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.22)] backdrop-blur-sm md:p-6 dark:border-slate-800/70 dark:bg-slate-950/55">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Performance</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground md:text-base">
                Quiz results, accuracy trends, and actionable performance insights.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Expand / Collapse all */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={expandAll}
                className="h-9 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                title="Expand all sections"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Expand all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                className="h-9 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                title="Collapse all sections"
              >
                <ChevronsUpDown className="h-3.5 w-3.5" />
                Collapse all
                {collapsedCount > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {collapsedCount}
                  </span>
                )}
              </Button>

              {/* Focus mode */}
              <Button
                type="button"
                variant={focusMode ? "default" : "outline"}
                size="sm"
                onClick={() => setFocusMode(f => !f)}
                className={`h-9 gap-1.5 rounded-full px-3 text-xs ${focusMode ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border-slate-300/80 bg-white/90 hover:bg-white dark:border-slate-700/80 dark:bg-slate-900/80"}`}
                title="Show only KPIs and signals"
              >
                <Eye className="h-3.5 w-3.5" />
                {focusMode ? "Exit focus" : "Focus mode"}
              </Button>

              {/* Customize sections */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 rounded-full border-slate-300/80 bg-white/90 px-4 hover:bg-white dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:bg-slate-900"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Customize Sections
                    {hiddenSections.length > 0 && (
                      <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-100 px-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                        {hiddenSections.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 space-y-2 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-muted-foreground">Show / hide sections</p>
                    {hiddenSections.length > 0 && (
                      <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={restoreAll}>
                        Restore all
                      </Button>
                    )}
                  </div>
                  {(Object.keys(sections) as SectionKey[]).map(key => (
                    <div key={key} className="flex items-center justify-between rounded-md border border-border p-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">{SECTION_LABELS[key].title}</p>
                        <p className="text-xs text-muted-foreground">{SECTION_LABELS[key].description}</p>
                      </div>
                      <Switch
                        checked={sections[key].visible}
                        onCheckedChange={() => toggleVisible(key)}
                      />
                    </div>
                  ))}
                </PopoverContent>
              </Popover>

              <Badge className="rounded-full bg-teal-600 px-3 py-1 text-white shadow-sm hover:bg-teal-700">
                Analytics
              </Badge>
            </div>
          </div>

          {hasPerformanceData ? (
            <>
              {/* ── KPI tiles (always visible) ────────────────────────── */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 md:gap-6">
                <PremiumKpiCard icon={<Trophy className="h-5 w-5" />} title="Quizzes Taken" value={summary.totalQuizzesTaken}
                  subtitle={`${summary.totalQuestionsAnswered} questions`} trend={`Momentum: ${momentumDelta >= 0 ? "+" : ""}${momentumDelta}%`} tone="teal" />
                <PremiumKpiCard icon={<Target className="h-5 w-5" />} title="Overall Accuracy" value={`${summary.overallAccuracy}%`}
                  subtitle={`${confidenceLabel} • ${summary.totalQuestionsAnswered} answers`} trend={`Consistency: ${consistencyScore}/100`} tone="emerald" />
                <PremiumKpiCard icon={<Clock className="h-5 w-5" />} title="Avg Time / Question" value={`${summary.avgTimePerQuestion}s`}
                  subtitle={summary.avgTimePerQuestion <= 45 ? "Healthy pacing" : "Consider speed drills"} trend={`Pace: ${getPacingBand(summary.avgTimePerQuestion)}`} tone="blue" />
                <PremiumKpiCard icon={<Flame className="h-5 w-5" />} title="Current Streak" value={`${studyOverview.currentStreak} days`}
                  subtitle={`Best ${studyOverview.longestStreak} days`} trend={studyOverview.currentStreak >= studyOverview.longestStreak ? "At your record" : "Keep momentum alive"} tone="amber" />
              </div>

              {/* ── Performance Signals (always visible, collapsible) ─── */}
              {smartInsights.length > 0 && (
                <CollapsibleCard
                  className={sectionCard}
                  title={<><Gauge className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Performance Signals</>}
                  description="Automatically detected trends from your quiz attempts."
                  hint="These signals are generated from your recent quiz history to highlight meaningful strengths, weak spots, and trend shifts."
                  expanded={sections.accuracyTrends.expanded}
                  onToggle={() => toggleExpanded("accuracyTrends")}
                >
                  <div className="space-y-3 pt-2">
                    {smartInsights.slice(0, 6).map((insight, index) => (
                      <div key={`${insight.type}-${index}`} className={`rounded-2xl border p-4 shadow-sm ${
                        insight.type === "strength"  ? "border-emerald-200/85 bg-emerald-50/80 dark:border-emerald-800/80 dark:bg-emerald-950/35" :
                        insight.type === "weakness"  ? "border-rose-200/85 bg-rose-50/80 dark:border-rose-800/80 dark:bg-rose-950/35" :
                                                       "border-brand-primary/35 bg-brand-primary/10 dark:border-brand-primary/40 dark:bg-brand-primary/20"
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${
                            insight.type === "strength" ? "bg-emerald-100 text-emerald-600 ring-emerald-200 dark:bg-emerald-900/70 dark:text-emerald-300 dark:ring-emerald-800/80" :
                            insight.type === "weakness" ? "bg-rose-100 text-rose-600 ring-rose-200 dark:bg-rose-900/70 dark:text-rose-300 dark:ring-rose-800/80" :
                                                          "bg-blue-100 text-blue-600 ring-blue-200 dark:bg-blue-900/70 dark:text-blue-300 dark:ring-blue-800/80"
                          }`}>
                            {insight.type === "strength" ? <TrendingUp className="h-4 w-4" /> :
                             insight.type === "weakness" ? <TrendingDown className="h-4 w-4" /> :
                                                           <BarChart3 className="h-4 w-4" />}
                          </div>
                          <p className="pt-0.5 text-sm leading-relaxed text-foreground/85">{insight.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleCard>
              )}

              {/* ── Restore strip — hidden sections ───────────────────── */}
              {hiddenSections.length > 0 && !focusMode && (
                <div className={`${sectionCard} flex flex-wrap items-center gap-2 px-4 py-3`}>
                  <p className="text-xs font-semibold text-muted-foreground mr-1">Hidden:</p>
                  {hiddenSections.map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => showSection(key)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      {SECTION_LABELS[key].title}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={restoreAll}
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    Restore all
                  </button>
                </div>
              )}

              {/* ── Metric Guide ──────────────────────────────────────── */}
              {visible("metricGuide") && (
                <CollapsibleCard
                  className={sectionCard}
                  title="Metric Guide"
                  description="Quick definitions to make performance analytics easier to interpret."
                  expanded={expanded("metricGuide")}
                  onToggle={() => toggleExpanded("metricGuide")}
                  onHide={() => toggleVisible("metricGuide")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {[
                      { term: "Momentum", def: "Change in average accuracy between your latest attempt window and the previous window." },
                      { term: "Consistency score", def: "A stability indicator based on variance in recent scores; higher means more predictable performance." },
                      { term: "Confidence label", def: "How representative analytics are given your current sample size of answered questions." },
                      { term: "Realism view", def: "Compares latest score to long-term average per quiz to reduce overreaction to one-off attempts." },
                    ].map(({ term, def }) => (
                      <div key={term} className={miniCard}>
                        <p className="font-medium text-foreground">{term}</p>
                        <p className="text-sm text-muted-foreground mt-1">{def}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleCard>
              )}

              {/* ── At a Glance ───────────────────────────────────────── */}
              <CollapsibleCard
                className={sectionCard}
                title={<>At a Glance Interpretation</>}
                description="High-level reading of your current analytics profile."
                hint="A concise summary of your current learning posture using momentum, stability, and difficulty performance signals."
                expanded={sections.weeklyProgress.expanded}
                onToggle={() => toggleExpanded("weeklyProgress")}
              >
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
                  <div className={miniCard}>
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Momentum</p>
                      <InfoHint text="Latest 3-attempt average minus the previous 3-attempt average." />
                    </div>
                    <p className={`text-xl font-semibold ${momentumDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{momentumDirection}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{momentumDelta >= 0 ? "+" : ""}{momentumDelta}% change</p>
                  </div>
                  <div className={miniCard}>
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Stability</p>
                      <InfoHint text="Higher stability means more consistent results across attempts." />
                    </div>
                    <p className="text-xl font-semibold text-foreground">{consistencyBand}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Score: {consistencyScore}/100</p>
                  </div>
                  <div className={miniCard}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Best difficulty</p>
                    <p className="text-xl font-semibold text-foreground capitalize">{strongestDifficulty?.level ?? "N/A"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{strongestDifficulty?.accuracy ?? 0}% accuracy</p>
                  </div>
                  <div className={miniCard}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Needs support</p>
                    <p className="text-xl font-semibold text-foreground capitalize">{weakestDifficulty?.level ?? "N/A"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{weakestDifficulty?.accuracy ?? 0}% accuracy</p>
                  </div>
                </div>
              </CollapsibleCard>

              {/* ── Momentum & Stability + Data Quality ──────────────── */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <CollapsibleCard
                  className={`${sectionCard} xl:col-span-2`}
                  title={<>Momentum &amp; Stability</>}
                  description="Recent trend quality based on your latest attempts."
                  hint="Tracks short-term trajectory and consistency to help you judge whether progress is reliable or noisy."
                  expanded={sections.difficultyBreakdown.expanded}
                  onToggle={() => toggleExpanded("difficultyBreakdown")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className={miniCard}>
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent momentum</p>
                        <InfoHint text="Latest 3-attempt average minus the previous 3-attempt average." />
                      </div>
                      <p className="text-2xl font-semibold text-foreground">{momentumDelta >= 0 ? "+" : ""}{momentumDelta}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Last 3 avg {latestAvg}% vs prior {previousAvg}%</p>
                    </div>
                    <div className={miniCard}>
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Consistency</p>
                        <InfoHint text="Lower variance in results yields a higher score." />
                      </div>
                      <p className="text-2xl font-semibold text-foreground">{consistencyScore}/100</p>
                      <Progress value={consistencyScore} className="h-2 mt-2" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Focus on sustained weekly movement over single attempts.
                  </p>
                </CollapsibleCard>

                {visible("dataQuality") && (
                  <CollapsibleCard
                    className={sectionCard}
                    title="Data Quality"
                    description="How representative your current metrics are."
                    hint="Shows how reliable analytics are based on sample size and attempts."
                    expanded={expanded("dataQuality")}
                    onToggle={() => toggleExpanded("dataQuality")}
                    onHide={() => toggleVisible("dataQuality")}
                  >
                    <div className="space-y-3 pt-2">
                      {[
                        { label: "Attempts logged",     value: summary.totalQuizzesTaken },
                        { label: "Questions sampled",   value: summary.totalQuestionsAnswered },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/70">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="font-semibold text-foreground">{value}</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/70">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <Badge variant="secondary">{confidenceLabel}</Badge>
                      </div>
                    </div>
                  </CollapsibleCard>
                )}
              </div>

              {/* ── Weekly Progress ───────────────────────────────────── */}
              {visible("weeklyProgress") && (
                <CollapsibleCard
                  className={sectionCard}
                  title={<>Weekly Progress</>}
                  description="Compares your last 7 attempts against the prior 7."
                  hint="Compares your latest 7 attempts against the prior 7 to show medium-term direction."
                  expanded={expanded("weeklyProgress")}
                  onToggle={() => toggleExpanded("weeklyProgress")}
                  onHide={() => toggleVisible("weeklyProgress")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className={miniCard}>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent week avg</p>
                      <p className="text-2xl font-semibold text-foreground mt-1">{recentWeekAvg}%</p>
                    </div>
                    <div className={miniCard}>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Prior week avg</p>
                      <p className="text-2xl font-semibold text-foreground mt-1">{priorWeekAvg}%</p>
                    </div>
                    <div className={miniCard}>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Weekly delta</p>
                      <p className={`text-2xl font-semibold mt-1 ${weeklyDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {weeklyDelta >= 0 ? "+" : ""}{weeklyDelta}%
                      </p>
                    </div>
                  </div>
                </CollapsibleCard>
              )}

              {/* ── Strengths + Improvement Areas ────────────────────── */}
              {(visible("strengthAreas") || visible("improvementAreas")) && (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {visible("strengthAreas") && rankedStrengths.length > 0 && (
                    <CollapsibleCard
                      className={`${sectionCard} border-emerald-200/85 dark:border-emerald-800/80`}
                      title={<><TrendingUp className="h-5 w-5" /> Strength Areas</>}
                      titleClassName="text-emerald-700 dark:text-emerald-300"
                      description="Weighted by accuracy and sample size."
                      hint="Topics ranked by performance quality and sample strength, not just a single high score."
                      expanded={expanded("strengthAreas")}
                      onToggle={() => toggleExpanded("strengthAreas")}
                      onHide={() => toggleVisible("strengthAreas")}
                    >
                      <div className="space-y-3 pt-2">
                        {rankedStrengths.map(item => (
                          <div key={item.topic} className="rounded-2xl border border-emerald-200/85 bg-emerald-50/75 p-4 shadow-sm dark:border-emerald-800/80 dark:bg-emerald-950/35">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">{item.topic}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.questionsAnswered} questions · {item.quizzesTaken} quizzes · {getPacingBand(item.avgTimeSeconds)} pace
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <Badge className="bg-emerald-600 text-white">{item.accuracy}%</Badge>
                                <p className="text-[11px] text-muted-foreground mt-1">{getTopicConfidence(item.questionsAnswered, item.quizzesTaken)} confidence</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleCard>
                  )}

                  {visible("improvementAreas") && rankedImprovements.length > 0 && (
                    <CollapsibleCard
                      className={`${sectionCard} border-rose-200/85 dark:border-rose-800/80`}
                      title={<><Target className="h-5 w-5" /> Improvement Areas</>}
                      titleClassName="text-rose-700 dark:text-rose-300"
                      description="Prioritized by consistently lower accuracy with enough attempts."
                      hint="Topics combine lower accuracy with sufficient data to avoid overreacting to outliers."
                      expanded={expanded("improvementAreas")}
                      onToggle={() => toggleExpanded("improvementAreas")}
                      onHide={() => toggleVisible("improvementAreas")}
                    >
                      <div className="space-y-3 pt-2">
                        {rankedImprovements.map(item => {
                          const priority = item.accuracy < 45 ? "High" : item.accuracy < 60 ? "Medium" : "Low";
                          return (
                            <div key={item.topic} className="rounded-2xl border border-rose-200/85 bg-rose-50/75 p-4 shadow-sm dark:border-rose-800/80 dark:bg-rose-950/35">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground">{item.topic}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.questionsAnswered} questions · {item.quizzesTaken} quizzes · {getPacingBand(item.avgTimeSeconds)} pace
                                  </p>
                                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                                    {item.accuracy < 50 ? "Rebuild fundamentals with shorter daily drills." : "Target mixed practice and review common mistakes."}
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">Priority: {priority}</Badge>
                                    <Badge variant="outline">2 targeted sessions this week</Badge>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <Badge className="bg-rose-600 text-white">{item.accuracy}%</Badge>
                                  <p className="text-[11px] text-muted-foreground mt-1">{getTopicConfidence(item.questionsAnswered, item.quizzesTaken)} confidence</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleCard>
                  )}
                </div>
              )}

              {/* ── Difficulty Breakdown + Activity ──────────────────── */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {visible("difficultyBreakdown") && (
                  <CollapsibleCard
                    className={sectionCard}
                    title="Difficulty Breakdown"
                    description="Accuracy by question difficulty level."
                    hint="Highlights whether performance drops as question complexity increases."
                    expanded={expanded("difficultyBreakdown")}
                    onToggle={() => toggleExpanded("difficultyBreakdown")}
                    onHide={() => toggleVisible("difficultyBreakdown")}
                  >
                    <div className="space-y-3 pt-2">
                      {performanceByDifficulty.map(item => (
                        <div key={item.level} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/70">
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="capitalize font-medium text-foreground">{item.level}</p>
                            <Progress value={item.accuracy} className="h-1.5 mt-2" />
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-foreground">{item.accuracy}%</p>
                            <p className="text-xs text-muted-foreground">{item.questionsAnswered} questions</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleCard>
                )}
                <ActivityCard activities={recentActivity} />
              </div>

              {/* ── Quiz Realism View ─────────────────────────────────── */}
              {visible("quizRealism") && quizPerformance.length > 0 && (
                <CollapsibleCard
                  className={sectionCard}
                  title="Quiz Realism View"
                  description="Compare latest vs average performance by quiz topic."
                  hint="Compares your latest attempt to your historical average per quiz."
                  expanded={expanded("quizRealism")}
                  onToggle={() => toggleExpanded("quizRealism")}
                  onHide={() => toggleVisible("quizRealism")}
                >
                  <div className="space-y-3 pt-2">
                    {quizPerformance.slice(0, 6).map(quiz => {
                      const delta = quiz.latestAccuracy - quiz.averageAccuracy;
                      return (
                        <div key={quiz.quizId} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{quiz.quizTitle}</p>
                              <p className="text-xs text-muted-foreground">{quiz.attempts} attempts · best {quiz.bestAccuracy}%</p>
                            </div>
                            <Badge variant="secondary" className={delta >= 0 ? "text-emerald-700" : "text-rose-700"}>
                              {delta >= 0 ? "+" : ""}{delta}% vs avg
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleCard>
              )}

              {/* ── Accuracy Trends ───────────────────────────────────── */}
              {visible("accuracyTrends") && (
                <CollapsibleCard
                  className={sectionCard}
                  title="Accuracy Trends"
                  description="Recent attempt-level accuracy movement."
                  hint="Shows recent attempt-by-attempt changes so you can identify short-term drift or recovery."
                  expanded={expanded("accuracyTrends")}
                  onToggle={() => toggleExpanded("accuracyTrends")}
                  onHide={() => toggleVisible("accuracyTrends")}
                >
                  <div className="space-y-3 pt-2">
                    {sortedRecent.slice(-8).map((attempt, index) => (
                      <div key={`${attempt.quizTitle}-${index}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <p className="truncate text-muted-foreground">{attempt.quizTitle}</p>
                          <p className="font-medium text-foreground">{attempt.accuracy}%</p>
                        </div>
                        <Progress value={attempt.accuracy} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </CollapsibleCard>
              )}
            </>
          ) : (
            <Card className={sectionCard}>
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
      </div>
    </TooltipProvider>
  );
}
