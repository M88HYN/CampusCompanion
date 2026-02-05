import { db } from "./db";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Seeds completed quiz attempts with realistic responses for analytics display
 * Creates 3 completed quizzes with varying performance levels
 */
export async function seedCompletedQuizzes(userId: string) {
  console.log("[COMPLETED QUIZ SEED] Starting seed for userId:", userId);

  try {
    // Get existing quizzes for this user
    const quizzes = await db.run(sql`
      SELECT id, title, subject FROM quizzes WHERE user_id = ${userId} LIMIT 3
    `);

    if (quizzes.length === 0) {
      console.log("[COMPLETED QUIZ SEED] No quizzes found to complete");
      return;
    }

    // Scenario 1: Strong performance on Data Structures (85% accuracy)
    if (quizzes[0]) {
      await seedQuizAttempt(userId, quizzes[0], 0.85, 45);
    }

    // Scenario 2: Medium performance on Algorithms (65% accuracy)
    if (quizzes[1]) {
      await seedQuizAttempt(userId, quizzes[1], 0.65, 52);
    }

    // Scenario 3: Good performance on OOP (78% accuracy)
    if (quizzes[2]) {
      await seedQuizAttempt(userId, quizzes[2], 0.78, 38);
    }

    console.log("[COMPLETED QUIZ SEED] ✅ Completed quiz seed successful!");
  } catch (error) {
    console.error("[COMPLETED QUIZ SEED] Error:", error);
  }
}

async function seedQuizAttempt(
  userId: string,
  quiz: any,
  targetAccuracy: number,
  timeSpentMinutes: number
) {
  const attemptId = randomUUID();
  const completedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days
  const startedAt = new Date(completedAt.getTime() - timeSpentMinutes * 60 * 1000);

  // Get questions for this quiz
  const questions = await db.run(sql`
    SELECT id, marks, tags, difficulty FROM quiz_questions WHERE quiz_id = ${quiz.id}
  `);

  if (questions.length === 0) return;

  // Calculate how many questions to get correct based on target accuracy
  const numCorrect = Math.round(questions.length * targetAccuracy);
  const numIncorrect = questions.length - numCorrect;

  // Shuffle questions to randomize which ones are correct/incorrect
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const correctQuestions = shuffled.slice(0, numCorrect);
  const incorrectQuestions = shuffled.slice(numCorrect);

  // Calculate score
  const totalMarks = questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
  const earnedMarks = correctQuestions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
  const scorePercent = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;

  // Create quiz attempt
  await db.run(sql`
    INSERT INTO quiz_attempts (
      id, quiz_id, user_id, mode, started_at, completed_at,
      current_question_index, current_difficulty, status,
      score, earned_marks, total_marks, time_spent
    ) VALUES (
      ${attemptId}, ${quiz.id}, ${userId}, 'practice',
      ${startedAt.toISOString()}, ${completedAt.toISOString()},
      ${questions.length}, 3, 'completed',
      ${scorePercent}, ${earnedMarks}, ${totalMarks}, ${timeSpentMinutes * 60}
    )
  `);

  // Create responses for correct answers
  for (const question of correctQuestions) {
    const responseTime = 15 + Math.random() * 45; // 15-60 seconds
    await db.run(sql`
      INSERT INTO quiz_responses (
        id, attempt_id, question_id, is_correct, marks_awarded,
        response_time, answered_at, confidence_level
      ) VALUES (
        ${randomUUID()}, ${attemptId}, ${question.id}, 1, ${question.marks || 1},
        ${Math.round(responseTime)}, ${completedAt.toISOString()},
        ${Math.floor(Math.random() * 3) + 3}
      )
    `);
  }

  // Create responses for incorrect answers
  for (const question of incorrectQuestions) {
    const responseTime = 20 + Math.random() * 70; // 20-90 seconds (longer for incorrect)
    await db.run(sql`
      INSERT INTO quiz_responses (
        id, attempt_id, question_id, is_correct, marks_awarded,
        response_time, answered_at, confidence_level
      ) VALUES (
        ${randomUUID()}, ${attemptId}, ${question.id}, 0, 0,
        ${Math.round(responseTime)}, ${completedAt.toISOString()},
        ${Math.floor(Math.random() * 2) + 1}
      )
    `);
  }

  console.log(`[COMPLETED QUIZ SEED] ✓ Completed "${quiz.title}" - Score: ${scorePercent}%, ${numCorrect}/${questions.length} correct`);
}

