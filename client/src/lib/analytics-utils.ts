/*
==========================================================
File: client/src/lib/analytics-utils.ts

Module: Analytics and Learning Intelligence

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Application Layer (Business and Interaction Logic)

System Interaction:
- Consumes API endpoints via query/mutation utilities and renders user-facing interfaces
- Collaborates with shared types to preserve frontend-backend contract integrity

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

/**
 * Analytics Utility Functions
 * Centralized calculations for quiz analytics
 */

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalMarks: number;
  earnedMarks: number;
  timeSpent: number;
  completedAt: string | null;
  topic?: string | null;
}

export interface AnalyticsSummary {
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  overallAccuracy: number;
  avgTimePerQuestion: number;
}

export interface TopicPerformance {
  topic: string;
  accuracy: number;
  questionsAnswered: number;
  quizzesTaken: number;
  avgTimeSeconds: number;
}

export interface RecentActivity {
  date: string;
  quizTitle: string;
  topic: string;
  score: number;
  maxScore: number;
  accuracy: number;
}

/**
 * Safely calculate accuracy
 */
/*
----------------------------------------------------------
Function: calculateAccuracy

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- correct: Input consumed by this routine during execution
- total: Input consumed by this routine during execution

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
export function calculateAccuracy(correct: number, total: number): number {
  if (!total || total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Safely calculate weighted average accuracy
 */
/*
----------------------------------------------------------
Function: calculateWeightedAverage

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
export function calculateWeightedAverage(
  values: Array<{ value: number; weight: number }>
): number {
  if (values.length === 0) return 0;
  
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = values.reduce((sum, item) => sum + item.value * item.weight, 0);
  return Math.round(weightedSum / totalWeight);
}

/**
 * Group attempts by topic
 */
/*
----------------------------------------------------------
Function: groupAttemptsByTopic

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- attempts: Input consumed by this routine during execution

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
export function groupAttemptsByTopic(
  attempts: QuizAttempt[]
): Record<string, QuizAttempt[]> {
  return attempts.reduce((acc, attempt) => {
    const topic = attempt.topic || "General";
    if (!acc[topic]) {
      acc[topic] = [];
    }
    acc[topic].push(attempt);
    return acc;
  }, {} as Record<string, QuizAttempt[]>);
}

/**
 * Calculate topic performance
 */
/*
----------------------------------------------------------
Function: calculateTopicPerformance

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- attempts: Input consumed by this routine during execution

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
export function calculateTopicPerformance(
  attempts: QuizAttempt[]
): TopicPerformance[] {
  const grouped = groupAttemptsByTopic(attempts);
  
  return Object.entries(grouped)
    .map(([topic, topicAttempts]) => {
      const completedAttempts = topicAttempts.filter(a => a.completedAt);
      if (completedAttempts.length === 0) {
        return null;
      }
      
      const totalEarned = completedAttempts.reduce((sum, a) => sum + (a.earnedMarks || 0), 0);
      const totalMarks = completedAttempts.reduce((sum, a) => sum + (a.totalMarks || 0), 0);
      const totalTime = completedAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
      const totalQuestions = completedAttempts.reduce((sum, a) => sum + (a.totalMarks || 0), 0);
      const accuracy = calculateAccuracy(totalEarned, totalMarks);
      
      return {
        topic,
        accuracy,
        questionsAnswered: totalQuestions,
        quizzesTaken: completedAttempts.length,
        avgTimeSeconds: totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
      };
    })
    .filter((item): item is TopicPerformance => item !== null)
    .sort((a, b) => b.accuracy - a.accuracy);
}

/**
 * Get strengths (topics with >= 70% accuracy)
 */
/*
----------------------------------------------------------
Function: getStrengths

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- performance: Input consumed by this routine during execution

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
export function getStrengths(performance: TopicPerformance[]): TopicPerformance[] {
  return performance.filter(item => item.accuracy >= 70);
}

/**
 * Get areas to improve (topics with < 70% accuracy)
 */
/*
----------------------------------------------------------
Function: getAreasToImprove

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- performance: Input consumed by this routine during execution

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
export function getAreasToImprove(performance: TopicPerformance[]): TopicPerformance[] {
  return performance.filter(item => item.accuracy < 70);
}

/**
 * Format recent activity from attempts
 */
/*
----------------------------------------------------------
Function: formatRecentActivity

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- attempts: Input consumed by this routine during execution
- limit: Input consumed by this routine during execution

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
export function formatRecentActivity(
  attempts: QuizAttempt[],
  limit: number = 10
): RecentActivity[] {
  return attempts
    .filter(a => a.completedAt)
    .sort((a, b) => {
      const dateA = new Date(a.completedAt || 0).getTime();
      const dateB = new Date(b.completedAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, limit)
    .map(attempt => ({
      date: formatDate(attempt.completedAt || new Date().toISOString()),
      quizTitle: attempt.quizTitle || "Unknown Quiz",
      topic: attempt.topic || "General",
      score: attempt.earnedMarks || 0,
      maxScore: attempt.totalMarks || 0,
      accuracy: calculateAccuracy(attempt.earnedMarks || 0, attempt.totalMarks || 0),
    }));
}

/**
 * Calculate analytics summary
 */
/*
----------------------------------------------------------
Function: calculateAnalyticsSummary

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- attempts: Input consumed by this routine during execution

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
export function calculateAnalyticsSummary(
  attempts: QuizAttempt[]
): AnalyticsSummary {
  const completedAttempts = attempts.filter(a => a.completedAt);
  
  if (completedAttempts.length === 0) {
    return {
      totalQuizzesTaken: 0,
      totalQuestionsAnswered: 0,
      overallAccuracy: 0,
      avgTimePerQuestion: 0,
    };
  }
  
  const uniqueQuizzes = new Set(completedAttempts.map(a => a.quizId)).size;
  const totalEarned = completedAttempts.reduce((sum, a) => sum + (a.earnedMarks || 0), 0);
  const totalMarks = completedAttempts.reduce((sum, a) => sum + (a.totalMarks || 0), 0);
  const totalTime = completedAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
  const overallAccuracy = calculateAccuracy(totalEarned, totalMarks);
  const avgTimePerQuestion = totalMarks > 0 ? Math.round(totalTime / totalMarks) : 0;
  
  return {
    totalQuizzesTaken: uniqueQuizzes,
    totalQuestionsAnswered: totalMarks,
    overallAccuracy,
    avgTimePerQuestion,
  };
}

/**
 * Safe number fallback
 */
/*
----------------------------------------------------------
Function: safeNumberFallback

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- value: Input consumed by this routine during execution
- defaultValue: Input consumed by this routine during execution

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
export function safeNumberFallback(value: unknown, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) || num === null || num === undefined ? defaultValue : num;
}

/**
 * Format date for display
 */
/*
----------------------------------------------------------
Function: formatDate

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- dateString: Input consumed by this routine during execution

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
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  } catch {
    return "Unknown date";
  }
}
