/**
 * Spaced Repetition Utilities
 * 
 * Computes priority scores for quiz questions based on analytics data.
 * Drives the adaptive review queue from real quiz attempt performance.
 * 
 * Uses the SAME quiz_attempts + quiz_responses data as Analytics and My Quizzes.
 */

// ─── Types ────────────────────────────────────────────────────────

export interface QuestionPerformance {
  questionId: string;
  quizId: string;
  quizTitle: string;
  questionText: string;
  topic: string;
  difficulty: number;
  isCorrect: boolean;
  lastAnsweredAt: number; // timestamp ms
  responseTime: number; // seconds
  timesAnswered: number;
  timesCorrect: number;
  tags: string[];
}

export interface SpacedReviewItem {
  questionId: string;
  quizId: string;
  quizTitle: string;
  questionText: string;
  topic: string;
  difficulty: number;
  priorityScore: number;
  label: "Needs Review" | "Weak Topic" | "Due for Review";
  lastAnsweredAt: number;
  accuracy: number; // 0-100 for this question
  timesAnswered: number;
  tags: string[];
  // Full question data for practice
  question?: any;
  options?: any[];
}

export interface TopicAccuracy {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
}

// ─── Priority Score Weights ───────────────────────────────────────

const WEIGHTS = {
  INCORRECT_ANSWER: 50,
  WEAK_TOPIC: 30,       // topic accuracy < 70%
  TIME_DECAY: 20,       // last attempted > 3 days ago
  FAST_GUESS: 10,       // response time < 3 seconds
  FEW_ATTEMPTS: 15,     // answered fewer than 3 times
  LOW_ACCURACY: 25,     // question accuracy < 50%
} as const;

// ─── Core Utilities ───────────────────────────────────────────────

/**
 * Calculate priority score for a single question.
 * Higher score = more urgently needs review.
 */
export function calculatePriorityScore(
  perf: QuestionPerformance,
  topicAccuracyMap: Record<string, number>,
  now: number = Date.now()
): number {
  let score = 0;

  // +50 if last answer was incorrect
  if (!perf.isCorrect) {
    score += WEIGHTS.INCORRECT_ANSWER;
  }

  // +30 if the topic overall accuracy is < 70%
  const topicAcc = topicAccuracyMap[perf.topic];
  if (topicAcc !== undefined && topicAcc < 70) {
    score += WEIGHTS.WEAK_TOPIC;
  }

  // +20 if last attempted > 3 days ago
  const daysSinceAttempt = (now - perf.lastAnsweredAt) / (1000 * 60 * 60 * 24);
  if (daysSinceAttempt > 3) {
    score += WEIGHTS.TIME_DECAY;
  }

  // +10 if response time < 3 seconds (likely guessing)
  if (perf.responseTime > 0 && perf.responseTime < 3) {
    score += WEIGHTS.FAST_GUESS;
  }

  // +15 if answered fewer than 3 times total
  if (perf.timesAnswered < 3) {
    score += WEIGHTS.FEW_ATTEMPTS;
  }

  // +25 if question-level accuracy is below 50%
  const questionAcc = perf.timesAnswered > 0
    ? (perf.timesCorrect / perf.timesAnswered) * 100
    : 0;
  if (questionAcc < 50) {
    score += WEIGHTS.LOW_ACCURACY;
  }

  return score;
}

/**
 * Group question performances by topic and compute per-topic accuracy.
 */
export function groupQuestionsByTopic(
  performances: QuestionPerformance[]
): TopicAccuracy[] {
  const topicMap: Record<string, { correct: number; total: number }> = {};

  for (const perf of performances) {
    const topic = perf.topic || "General";
    if (!topicMap[topic]) {
      topicMap[topic] = { correct: 0, total: 0 };
    }
    topicMap[topic].total += perf.timesAnswered;
    topicMap[topic].correct += perf.timesCorrect;
  }

  return Object.entries(topicMap).map(([topic, stats]) => ({
    topic,
    correct: stats.correct,
    total: stats.total,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));
}

/**
 * Build a topic accuracy lookup map for priority scoring.
 */
export function buildTopicAccuracyMap(
  performances: QuestionPerformance[]
): Record<string, number> {
  const topicAccuracies = groupQuestionsByTopic(performances);
  const map: Record<string, number> = {};
  for (const ta of topicAccuracies) {
    map[ta.topic] = ta.accuracy;
  }
  return map;
}

/**
 * Determine the review label for a question based on its context.
 */
export function getReviewLabel(
  perf: QuestionPerformance,
  topicAccuracy: number | undefined,
  now: number = Date.now()
): "Needs Review" | "Weak Topic" | "Due for Review" {
  // Most recent answer was wrong → "Needs Review"
  if (!perf.isCorrect) {
    return "Needs Review";
  }

  // Topic accuracy is weak → "Weak Topic"
  if (topicAccuracy !== undefined && topicAccuracy < 70) {
    return "Weak Topic";
  }

  // Time-based decay → "Due for Review"
  return "Due for Review";
}

/**
 * Get due spaced review questions sorted by priority score.
 * This is the main entry point for generating the review queue.
 * 
 * @param performances - All question-level performance data from quiz attempts
 * @param limit - Max questions to return (default 20)
 * @returns Sorted array of SpacedReviewItems, highest priority first
 */
export function getDueSpacedQuestions(
  performances: QuestionPerformance[],
  limit: number = 20
): SpacedReviewItem[] {
  if (!performances || performances.length === 0) return [];

  const topicAccuracyMap = buildTopicAccuracyMap(performances);
  const now = Date.now();

  // Deduplicate: keep most recent performance per question
  const latestByQuestion = new Map<string, QuestionPerformance>();
  for (const perf of performances) {
    const existing = latestByQuestion.get(perf.questionId);
    if (!existing || perf.lastAnsweredAt > existing.lastAnsweredAt) {
      latestByQuestion.set(perf.questionId, perf);
    }
  }

  // Score and build review items
  const reviewItems: SpacedReviewItem[] = [];
  for (const perf of latestByQuestion.values()) {
    const priorityScore = calculatePriorityScore(perf, topicAccuracyMap, now);

    // Only include questions that actually need review (score > 0)
    if (priorityScore <= 0) continue;

    const questionAcc = perf.timesAnswered > 0
      ? Math.round((perf.timesCorrect / perf.timesAnswered) * 100)
      : 0;

    reviewItems.push({
      questionId: perf.questionId,
      quizId: perf.quizId,
      quizTitle: perf.quizTitle,
      questionText: perf.questionText,
      topic: perf.topic,
      difficulty: perf.difficulty,
      priorityScore,
      label: getReviewLabel(perf, topicAccuracyMap[perf.topic], now),
      lastAnsweredAt: perf.lastAnsweredAt,
      accuracy: questionAcc,
      timesAnswered: perf.timesAnswered,
      tags: perf.tags,
    });
  }

  // Sort by priority score descending, then by last answered ascending (older first)
  reviewItems.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return a.lastAnsweredAt - b.lastAnsweredAt;
  });

  return reviewItems.slice(0, limit);
}

/**
 * After a spaced review answer, compute the updated priority reduction.
 * Correct answers reduce priority; incorrect answers keep it high.
 */
export function computeUpdatedStats(
  current: { timesAnswered: number; timesCorrect: number; lastAnsweredAt: number },
  wasCorrect: boolean
): { timesAnswered: number; timesCorrect: number; lastAnsweredAt: number } {
  return {
    timesAnswered: current.timesAnswered + 1,
    timesCorrect: current.timesCorrect + (wasCorrect ? 1 : 0),
    lastAnsweredAt: Date.now(),
  };
}
