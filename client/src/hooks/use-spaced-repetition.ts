/**
 * useSpacedRepetition Hook
 * 
 * Single hook for the spaced review system.
 * Fetches the analytics-driven review queue from the server,
 * provides practice actions, and feeds results back.
 * 
 * Uses the SAME quiz_attempts + quiz_responses data as Analytics and My Quizzes.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SpacedReviewItem } from "@/lib/spaced-repetition-utils";

export interface SpacedReviewQuestion extends SpacedReviewItem {
  question: {
    id: string;
    quizId: string;
    type: string;
    question: string;
    difficulty: number;
    marks: number;
    explanation: string | null;
    correctAnswer: string | null;
    tags: string | null;
    options: Array<{
      id: string;
      text: string;
      isCorrect: number;
      order: number;
    }>;
  };
}

export interface SpacedReviewResult {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  isCorrect: boolean;
  responseTime: number; // seconds
}

export function useSpacedRepetition(limit: number = 20) {
  const queryClient = useQueryClient();

  // Fetch the review queue from server (computed from quiz_attempts + quiz_responses)
  const {
    data: reviewQueue = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SpacedReviewQuestion[]>({
    queryKey: ["/api/spaced-review/queue", limit],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/spaced-review/queue?limit=${limit}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to fetch review queue" }));
        throw new Error(err.error || "Failed to fetch review queue");
      }
      return await res.json();
    },
    staleTime: 30000, // 30s — refetches after quiz completion via invalidation
    refetchOnMount: true,
    retry: 2,
  });

  // Submit a review answer — updates user_question_stats and triggers re-fetch
  const submitReviewMutation = useMutation({
    mutationFn: async (result: SpacedReviewResult) => {
      const res = await apiRequest("POST", "/api/spaced-review/submit", result);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to submit review" }));
        throw new Error(err.error || "Failed to submit review");
      }
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate review queue AND analytics so both stay in sync
      queryClient.invalidateQueries({ queryKey: ["/api/spaced-review/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/analytics"] });
    },
  });

  // Derived stats
  const totalDue = reviewQueue.length;
  const needsReviewCount = reviewQueue.filter(q => q.label === "Needs Review").length;
  const weakTopicCount = reviewQueue.filter(q => q.label === "Weak Topic").length;
  const dueForReviewCount = reviewQueue.filter(q => q.label === "Due for Review").length;

  return {
    // Data
    reviewQueue,
    totalDue,
    needsReviewCount,
    weakTopicCount,
    dueForReviewCount,

    // Loading states
    isLoading,
    isError,
    error,

    // Actions
    submitReview: submitReviewMutation.mutateAsync,
    isSubmitting: submitReviewMutation.isPending,
    refetch,
  };
}
