import { db } from "./db";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Seeds completed quiz attempts with realistic responses for analytics display.
 * Also seeds user_question_stats rows so spaced review works immediately.
 * Idempotent — skips if user already has completed attempts.
 */
export async function seedCompletedQuizzes(userId: string) {
  console.log("[COMPLETED QUIZ SEED] Starting seed for userId:", userId);

  try {
    // Idempotency check: skip if user already has completed attempts
    const existingAttempts: any[] = db.all(sql`
      SELECT id FROM quiz_attempts WHERE user_id = ${userId} AND completed_at IS NOT NULL LIMIT 1
    `);
    if (existingAttempts.length > 0) {
      console.log("[COMPLETED QUIZ SEED] ⏭️  Skipping - user already has completed attempts");
      return;
    }

    // Get existing quizzes for this user
    // CRITICAL: db.all() for SELECT — db.run() only returns metadata, not rows
    const quizzes: any[] = db.all(sql`
      SELECT id, title, subject FROM quizzes WHERE user_id = ${userId}
    `);

    if (quizzes.length === 0) {
      console.log("[COMPLETED QUIZ SEED] No quizzes found to complete");
      return;
    }

    // Track all responses so we can seed user_question_stats at the end
    const allResponses: Array<{ questionId: string; isCorrect: boolean; responseTime: number }> = [];

    // Create multiple quiz attempts with diverse performance across different topics
    const attemptScenarios = [
      // Strong performance scenarios (strengths)
      { accuracy: 0.92, timeSpentMinutes: 35 }, // Excellent
      { accuracy: 0.88, timeSpentMinutes: 42 }, // Excellent
      { accuracy: 0.85, timeSpentMinutes: 45 }, // Strong
      { accuracy: 0.82, timeSpentMinutes: 38 }, // Strong
      { accuracy: 0.80, timeSpentMinutes: 50 }, // Strong
      
      // Medium performance scenarios
      { accuracy: 0.75, timeSpentMinutes: 55 }, // Good
      { accuracy: 0.70, timeSpentMinutes: 48 }, // Decent
      { accuracy: 0.65, timeSpentMinutes: 52 }, // Moderate
      
      // Weak performance scenarios (areas to improve)
      { accuracy: 0.58, timeSpentMinutes: 60 }, // Struggling
      { accuracy: 0.52, timeSpentMinutes: 65 }, // Struggling
      { accuracy: 0.45, timeSpentMinutes: 70 }, // Weak
      { accuracy: 0.38, timeSpentMinutes: 75 }, // Very weak
    ];

    // Seed attempts across available quizzes with varied performance
    const numAttempts = Math.min(attemptScenarios.length, quizzes.length * 3); // Up to 3 attempts per quiz
    
    for (let i = 0; i < numAttempts; i++) {
      const quiz = quizzes[i % quizzes.length]; // Cycle through quizzes
      const scenario = attemptScenarios[i % attemptScenarios.length];
      
      const responses = await seedQuizAttempt(userId, quiz, scenario.accuracy, scenario.timeSpentMinutes, i);
      allResponses.push(...responses);
    }

    // Seed user_question_stats from all responses so spaced review has data
    await seedQuestionStats(userId, allResponses);

    console.log(`[COMPLETED QUIZ SEED] ✅ Seeded ${numAttempts} quiz attempts with varied performance`);
  } catch (error) {
    console.error("[COMPLETED QUIZ SEED] Error:", error);
  }
}

async function seedQuizAttempt(
  userId: string,
  quiz: any,
  targetAccuracy: number,
  timeSpentMinutes: number,
  attemptIndex: number = 0
): Promise<Array<{ questionId: string; isCorrect: boolean; responseTime: number }>> {
  const attemptId = randomUUID();
  
  // Distribute attempts across the last 14 days for insights trends
  const daysAgo = attemptIndex % 14;
  const completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const startedAt = new Date(completedAt.getTime() - timeSpentMinutes * 60 * 1000);

  // Get questions for this quiz
  const questions: any[] = db.all(sql`
    SELECT id, marks, tags, difficulty FROM quiz_questions WHERE quiz_id = ${quiz.id}
  `);

  if (questions.length === 0) return [];

  // Calculate how many questions to get correct based on target accuracy
  const numCorrect = Math.round(questions.length * targetAccuracy);

  // Shuffle questions to randomize which ones are correct/incorrect
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const correctQuestions = shuffled.slice(0, numCorrect);
  const incorrectQuestions = shuffled.slice(numCorrect);

  // Calculate score
  const totalMarks = questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
  const earnedMarks = correctQuestions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
  const scorePercent = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;

  // Create quiz attempt with integer timestamps (schema expects integers, not ISO strings)
  await db.run(sql`
    INSERT INTO quiz_attempts (
      id, quiz_id, user_id, mode, started_at, completed_at,
      current_question_index, current_difficulty, status,
      score, earned_marks, total_marks, time_spent
    ) VALUES (
      ${attemptId}, ${quiz.id}, ${userId}, 'practice',
      ${startedAt.getTime()}, ${completedAt.getTime()},
      ${questions.length}, 3, 'completed',
      ${scorePercent}, ${earnedMarks}, ${totalMarks}, ${timeSpentMinutes * 60}
    )
  `);

  const responseData: Array<{ questionId: string; isCorrect: boolean; responseTime: number }> = [];

  // Create responses for correct answers
  for (const question of correctQuestions) {
    const responseTime = 15 + Math.random() * 45; // 15-60 seconds
    const roundedTime = Math.round(responseTime);
    await db.run(sql`
      INSERT INTO quiz_responses (
        id, attempt_id, question_id, is_correct, marks_awarded,
        response_time, answered_at, confidence_level
      ) VALUES (
        ${randomUUID()}, ${attemptId}, ${question.id}, 1, ${question.marks || 1},
        ${roundedTime}, ${completedAt.getTime()},
        ${Math.floor(Math.random() * 3) + 3}
      )
    `);
    responseData.push({ questionId: question.id, isCorrect: true, responseTime: roundedTime });
  }

  // Create responses for incorrect answers
  for (const question of incorrectQuestions) {
    const responseTime = 20 + Math.random() * 70; // 20-90 seconds (longer for incorrect)
    const roundedTime = Math.round(responseTime);
    await db.run(sql`
      INSERT INTO quiz_responses (
        id, attempt_id, question_id, is_correct, marks_awarded,
        response_time, answered_at, confidence_level
      ) VALUES (
        ${randomUUID()}, ${attemptId}, ${question.id}, 0, 0,
        ${roundedTime}, ${completedAt.getTime()},
        ${Math.floor(Math.random() * 2) + 1}
      )
    `);
    responseData.push({ questionId: question.id, isCorrect: false, responseTime: roundedTime });
  }

  console.log(`[COMPLETED QUIZ SEED] ✓ Completed "${quiz.title}" - Score: ${scorePercent}%, ${numCorrect}/${questions.length} correct`);
  return responseData;
}

/**
 * Seed user_question_stats from quiz responses so spaced repetition
 * has initial data and the submit endpoint can update existing rows.
 */
async function seedQuestionStats(
  userId: string,
  responses: Array<{ questionId: string; isCorrect: boolean; responseTime: number }>
) {
  // Aggregate by question (a question could appear in multiple attempts)
  const statsMap = new Map<string, {
    timesAnswered: number;
    timesCorrect: number;
    totalTime: number;
    lastCorrect: boolean;
  }>();

  for (const r of responses) {
    const existing = statsMap.get(r.questionId);
    if (existing) {
      existing.timesAnswered++;
      if (r.isCorrect) existing.timesCorrect++;
      existing.totalTime += r.responseTime;
      existing.lastCorrect = r.isCorrect;
    } else {
      statsMap.set(r.questionId, {
        timesAnswered: 1,
        timesCorrect: r.isCorrect ? 1 : 0,
        totalTime: r.responseTime,
        lastCorrect: r.isCorrect,
      });
    }
  }

  let seeded = 0;
  const now = Date.now();
  for (const [questionId, stats] of statsMap) {
    const avgTime = Math.round(stats.totalTime / stats.timesAnswered);
    const consecutiveCorrect = stats.lastCorrect ? 1 : 0;
    const needsReview = stats.lastCorrect ? 0 : 1;
    // Set next_review_date in the past so items appear in queue
    const nextReview = now - (1000 * 60 * 60 * 24); // 1 day ago

    try {
      await db.run(sql`
        INSERT INTO user_question_stats (
          id, user_id, question_id, times_answered, times_correct,
          average_response_time, last_attempted_at, consecutive_correct,
          ease_factor, review_interval, next_review_date, needs_review
        ) VALUES (
          ${randomUUID()}, ${userId}, ${questionId}, ${stats.timesAnswered},
          ${stats.timesCorrect}, ${avgTime}, ${now}, ${consecutiveCorrect},
          ${2.5}, ${1}, ${nextReview}, ${needsReview}
        )
      `);
      seeded++;
    } catch (e) {
      // Skip duplicates silently
    }
  }

  console.log(`[COMPLETED QUIZ SEED] ✓ Seeded ${seeded} user_question_stats rows`);
}

