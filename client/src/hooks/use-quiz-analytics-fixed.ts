/**
 * useQuizAnalytics Hook - CORRECTED
 * Manages fetching and computing quiz analytics with proper caching
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  calculateAnalyticsSummary,
  calculateTopicPerformance,
  formatRecentActivity,
  getStrengths,
  getAreasToImprove,
  type QuizAttempt,
  type AnalyticsSummary,
  type TopicPerformance,
  type RecentActivity,
} from "@/lib/analytics-utils";

export interface UseQuizAnalyticsResult {
  // Computed data
  summary: AnalyticsSummary;
  topicPerformance: TopicPerformance[];
  strengths: TopicPerformance[];
  areasToImprove: TopicPerformance[];
  recentActivity: RecentActivity[];
  
  // Raw attempts
  attempts: QuizAttempt[];
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  
  // Utilities
  refetch: () => Promise<any>;
}

export function useQuizAnalytics(): UseQuizAnalyticsResult {
  // Fetch raw analytics from server
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
    staleTime: 0, // Always fresh to catch updates
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // Compute analytics from raw data
  const computedAnalytics = (() => {
    if (!rawAnalytics || isLoading) {
      return {
        summary: {
          totalQuizzesTaken: 0,
          totalQuestionsAnswered: 0,
          overallAccuracy: 0,
          avgTimePerQuestion: 0,
        },
        topicPerformance: [],
        strengths: [],
        areasToImprove: [],
        recentActivity: [],
        attempts: [],
      };
    }

    // Convert API response to QuizAttempt format
    const attempts: QuizAttempt[] = (rawAnalytics.recentActivity || []).map(
      (activity: any) => ({
        id: activity.attemptId || "",
        quizId: activity.quizId || "",
        quizTitle: activity.quizTitle || "",
        score: activity.accuracy || 0,
        totalMarks: activity.maxScore || 0,
        earnedMarks: activity.score || 0,
        timeSpent: activity.timeSpent || 0,
        completedAt: activity.completedAt || activity.date,
        topic: activity.topic,
      })
    );

    // Calculate all computations
    const summary = calculateAnalyticsSummary(attempts);
    const topicPerformance = calculateTopicPerformance(attempts);
    const strengths = getStrengths(topicPerformance);
    const areasToImprove = getAreasToImprove(topicPerformance);
    const recentActivity = formatRecentActivity(attempts, 10);

    return {
      summary,
      topicPerformance,
      strengths,
      areasToImprove,
      recentActivity,
      attempts,
    };
  })();

  return {
    summary: computedAnalytics.summary,
    topicPerformance: computedAnalytics.topicPerformance,
    strengths: computedAnalytics.strengths,
    areasToImprove: computedAnalytics.areasToImprove,
    recentActivity: computedAnalytics.recentActivity,
    attempts: computedAnalytics.attempts,
    isLoading,
    isError,
    refetch,
  };
}
