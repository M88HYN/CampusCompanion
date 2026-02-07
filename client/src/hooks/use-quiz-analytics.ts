/**
 * useQuizAnalytics Hook
 * Manages fetching and computing quiz analytics with proper caching
 * Uses server-computed analytics for accuracy and performance
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  safeNumberFallback,
  type AnalyticsSummary,
  type TopicPerformance,
  type RecentActivity,
} from "@/lib/analytics-utils";

export interface QuizPerformance {
  quizId: string;
  quizTitle: string;
  topic: string;
  attempts: number;
  averageAccuracy: number;
  bestAccuracy: number;
  latestAccuracy: number;
}

export interface DifficultyPerformance {
  level: string;
  accuracy: number;
  questionsAnswered: number;
}

export interface SmartInsight {
  type: "strength" | "weakness" | "info" | "tip";
  text: string;
}

export interface StudyOverview {
  noteCount: number;
  flashcardCount: number;
  deckCount: number;
  masteredCardCount: number;
  reviewQueueSize: number;
  totalStudyTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface UseQuizAnalyticsResult {
  // Computed data from server
  summary: AnalyticsSummary;
  strengths: TopicPerformance[];
  areasToImprove: TopicPerformance[];
  recentActivity: RecentActivity[];
  quizPerformance: QuizPerformance[];
  performanceByDifficulty: DifficultyPerformance[];
  smartInsights: SmartInsight[];
  studyOverview: StudyOverview;
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  
  // Utilities
  refetch: () => Promise<any>;
}

export function useQuizAnalytics(): UseQuizAnalyticsResult {
  const queryClient = useQueryClient();
  
  // Fetch analytics from server - server computes all stats from quiz_attempts table
  const {
    data: rawAnalytics,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["/api/user/analytics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/analytics");
      return await res.json();
    },
    staleTime: 0, // Always fresh to catch completed quiz updates
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // Extract computed analytics directly from server response
  // Server already handles all calculations accurately
  const computedAnalytics = (() => {
    if (!rawAnalytics || isLoading) {
      return {
        summary: {
          totalQuizzesTaken: 0,
          totalQuestionsAnswered: 0,
          overallAccuracy: 0,
          avgTimePerQuestion: 0,
        },
        strengths: [],
        areasToImprove: [],
        recentActivity: [],
        quizPerformance: [],
        performanceByDifficulty: [],
        smartInsights: [],
        studyOverview: {
          noteCount: 0,
          flashcardCount: 0,
          deckCount: 0,
          masteredCardCount: 0,
          reviewQueueSize: 0,
          totalStudyTimeMinutes: 0,
          currentStreak: 0,
          longestStreak: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
        },
      };
    }

    // Build summary from server data
    const summary: AnalyticsSummary = {
      totalQuizzesTaken: safeNumberFallback(rawAnalytics.totalQuizzesTaken, 0),
      totalQuestionsAnswered: safeNumberFallback(rawAnalytics.totalQuestionsAnswered, 0),
      overallAccuracy: safeNumberFallback(rawAnalytics.accuracy, 0),
      avgTimePerQuestion: safeNumberFallback(rawAnalytics.avgTimePerQuestion, 0),
    };

    // Extract strengths from server (topics with ≥70% accuracy)
    const strengths: TopicPerformance[] = (rawAnalytics.strengths || []).map((item: any) => ({
      topic: item.topic || "",
      accuracy: safeNumberFallback(item.accuracy, 0),
      questionsAnswered: safeNumberFallback(item.questionsAnswered, 0),
      avgTimeSeconds: safeNumberFallback(item.avgTimeSeconds, 0),
      quizzesTaken: safeNumberFallback(item.quizzesTaken, 0),
    }));

    // Extract weaknesses as areas to improve (topics with <70% accuracy)
    const areasToImprove: TopicPerformance[] = (rawAnalytics.weaknesses || []).map((item: any) => ({
      topic: item.topic || "",
      accuracy: safeNumberFallback(item.accuracy, 0),
      questionsAnswered: safeNumberFallback(item.questionsAnswered, 0),
      avgTimeSeconds: safeNumberFallback(item.avgTimeSeconds, 0),
      quizzesTaken: safeNumberFallback(item.quizzesTaken, 0),
    }));

    // Extract recent activity (last 10 attempts)
    const recentActivity: RecentActivity[] = (rawAnalytics.recentActivity || []).map((item: any) => ({
      quizTitle: item.quizTitle || "Untitled Quiz",
      topic: item.topic || "General",
      date: item.date || new Date().toLocaleDateString(),
      score: safeNumberFallback(item.score, 0),
      maxScore: safeNumberFallback(item.maxScore, 1),
      accuracy: safeNumberFallback(item.accuracy, 0),
      timeSpent: 0,
      completedAt: item.completedAt || new Date().toISOString(),
    }));

    // Per-quiz aggregated performance
    const quizPerformance: QuizPerformance[] = (rawAnalytics.quizPerformance || []).map((q: any) => ({
      quizId: q.quizId || "",
      quizTitle: q.quizTitle || "Untitled Quiz",
      topic: q.topic || "General",
      attempts: safeNumberFallback(q.attempts, 1),
      averageAccuracy: safeNumberFallback(q.averageAccuracy, 0),
      bestAccuracy: safeNumberFallback(q.bestAccuracy, 0),
      latestAccuracy: safeNumberFallback(q.latestAccuracy, 0),
    }));

    // Performance by difficulty
    const performanceByDifficulty: DifficultyPerformance[] = (rawAnalytics.performanceByDifficulty || []).map((d: any) => ({
      level: d.level || "medium",
      accuracy: safeNumberFallback(d.accuracy, 0),
      questionsAnswered: safeNumberFallback(d.questionsAnswered, 0),
    }));

    // Generate smart insights from all available data
    const smartInsights: SmartInsight[] = [];

    // Quiz-level insights (always available when user has taken quizzes)
    const sortedByAccuracy = [...quizPerformance].sort((a, b) => b.averageAccuracy - a.averageAccuracy);
    const bestQuizzes = sortedByAccuracy.filter(q => q.averageAccuracy >= 75);
    const weakQuizzes = sortedByAccuracy.filter(q => q.averageAccuracy < 60);
    const improvingQuizzes = quizPerformance.filter(q => q.attempts > 1 && q.latestAccuracy > q.averageAccuracy);

    if (bestQuizzes.length > 0) {
      const best = bestQuizzes[0];
      smartInsights.push({
        type: "strength",
        text: `Strong performance on "${best.quizTitle}" with ${best.averageAccuracy}% accuracy`,
      });
    }

    if (weakQuizzes.length > 0) {
      const weakest = weakQuizzes[weakQuizzes.length - 1];
      smartInsights.push({
        type: "weakness",
        text: `"${weakest.quizTitle}" needs more practice — ${weakest.averageAccuracy}% accuracy`,
      });
    }

    if (improvingQuizzes.length > 0) {
      const imp = improvingQuizzes[0];
      smartInsights.push({
        type: "tip",
        text: `You're improving on "${imp.quizTitle}" — latest attempt beat your average`,
      });
    }

    // Difficulty insights (easy vs hard gap)
    const easyPerf = performanceByDifficulty.find(d => d.level === "easy");
    const medPerf = performanceByDifficulty.find(d => d.level === "medium");
    const hardPerf = performanceByDifficulty.find(d => d.level === "hard");
    
    if (easyPerf && easyPerf.questionsAnswered > 0 && medPerf && medPerf.questionsAnswered > 0) {
      const gap = easyPerf.accuracy - medPerf.accuracy;
      if (gap > 20) {
        smartInsights.push({
          type: "tip",
          text: `${gap}% accuracy gap between easy (${easyPerf.accuracy}%) and medium (${medPerf.accuracy}%) questions — focus on medium difficulty`,
        });
      }
    }

    if (hardPerf && hardPerf.questionsAnswered > 0) {
      if (hardPerf.accuracy >= 70) {
        smartInsights.push({
          type: "strength",
          text: `Excellent on hard questions — ${hardPerf.accuracy}% accuracy across ${hardPerf.questionsAnswered} questions`,
        });
      } else if (hardPerf.accuracy < 50) {
        smartInsights.push({
          type: "weakness",
          text: `Struggling with hard questions — ${hardPerf.accuracy}% accuracy. Try reviewing fundamentals first`,
        });
      }
    }

    // Overall accuracy insight
    if (summary.overallAccuracy >= 80) {
      smartInsights.push({
        type: "strength",
        text: `Overall ${summary.overallAccuracy}% accuracy across ${summary.totalQuestionsAnswered} questions — keep it up!`,
      });
    } else if (summary.overallAccuracy < 60 && summary.totalQuestionsAnswered > 5) {
      smartInsights.push({
        type: "weakness",
        text: `${summary.overallAccuracy}% overall accuracy — consistent review sessions can boost this significantly`,
      });
    }

    // Topic-level fallback insights (from tag-based strengths/weaknesses)
    for (const s of strengths.slice(0, 2)) {
      smartInsights.push({
        type: "strength",
        text: `Strong in "${s.topic}" — ${s.accuracy}% across ${s.questionsAnswered} questions`,
      });
    }
    for (const w of areasToImprove.slice(0, 2)) {
      smartInsights.push({
        type: "weakness",
        text: `"${w.topic}" needs attention — ${w.accuracy}% accuracy`,
      });
    }

    // Study overview from server
    const studyOverview: StudyOverview = {
      noteCount: safeNumberFallback(rawAnalytics.noteCount, 0),
      flashcardCount: safeNumberFallback(rawAnalytics.flashcardCount, 0),
      deckCount: safeNumberFallback(rawAnalytics.deckCount, 0),
      masteredCardCount: safeNumberFallback(rawAnalytics.masteredCardCount, 0),
      reviewQueueSize: safeNumberFallback(rawAnalytics.reviewQueueSize, 0),
      totalStudyTimeMinutes: safeNumberFallback(rawAnalytics.totalStudyTimeMinutes, 0),
      currentStreak: safeNumberFallback(rawAnalytics.currentStreak, 0),
      longestStreak: safeNumberFallback(rawAnalytics.longestStreak, 0),
      correctAnswers: safeNumberFallback(rawAnalytics.correctAnswers, 0),
      incorrectAnswers: safeNumberFallback(rawAnalytics.incorrectAnswers, 0),
    };

    return {
      summary,
      strengths,
      areasToImprove,
      recentActivity,
      quizPerformance,
      performanceByDifficulty,
      smartInsights,
      studyOverview,
    };
  })();

  return {
    summary: computedAnalytics.summary,
    strengths: computedAnalytics.strengths,
    areasToImprove: computedAnalytics.areasToImprove,
    recentActivity: computedAnalytics.recentActivity,
    quizPerformance: computedAnalytics.quizPerformance,
    performanceByDifficulty: computedAnalytics.performanceByDifficulty,
    smartInsights: computedAnalytics.smartInsights,
    studyOverview: computedAnalytics.studyOverview,
    isLoading,
    isError,
    refetch,
  };
}
