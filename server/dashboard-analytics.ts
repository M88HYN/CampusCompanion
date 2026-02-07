/**
 * Dashboard Analytics Module
 * 
 * Provides real-time, data-driven metrics for the dashboard.
 * All data comes from actual database records, no mock values.
 * Uses raw SQL for SQLite compatibility (integer timestamps).
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

interface DashboardMetrics {
  dueToday: number;
  accuracy: number;
  weeklyStudyTime: number;
  itemsReviewedThisWeek: number;
}

interface DueFlashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  nextReviewDate: number;
  easeFactor: number;
  interval: number;
  status: string;
  daysOverdue: number;
}

interface LowestScoringQuiz {
  id: string;
  title: string;
  subject?: string;
  bestScore: number;
  attemptCount: number;
  lastAttemptDate: number;
}

interface RecentNote {
  id: string;
  title: string;
  updatedAt: number;
  subject?: string;
}

export class DashboardAnalytics {
  /**
   * Get dashboard metrics - all real data from database
   */
  static async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    try {
      const now = Date.now();
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const endOfTodayTs = endOfToday.getTime();
      const weekAgoTs = now - 7 * 24 * 60 * 60 * 1000;

      // 1. Due today - cards belonging to user's decks, due by end of today
      const dueResult: any[] = db.all(sql`
        SELECT COUNT(*) as count FROM cards c
        INNER JOIN decks d ON c.deck_id = d.id
        WHERE d.user_id = ${userId} AND c.due_at <= ${endOfTodayTs}
      `);
      const dueToday = dueResult[0]?.count || 0;

      // 2. Quiz accuracy from all responses
      const accuracyResult: any[] = db.all(sql`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN qr.is_correct = 1 THEN 1 ELSE 0 END) as correct
        FROM quiz_responses qr
        INNER JOIN quiz_attempts qa ON qr.attempt_id = qa.id
        WHERE qa.user_id = ${userId}
      `);
      const total = accuracyResult[0]?.total || 0;
      const correct = accuracyResult[0]?.correct || 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      // 3. Weekly study time from study_sessions
      const studyTimeResult: any[] = db.all(sql`
        SELECT COALESCE(SUM(duration_minutes), 0) as totalMinutes
        FROM study_sessions
        WHERE user_id = ${userId} AND started_at >= ${weekAgoTs}
      `);
      const weeklyStudyTime = studyTimeResult[0]?.totalMinutes || 0;

      // 4. Items reviewed this week (quiz responses + card reviews)
      const weekResponsesResult: any[] = db.all(sql`
        SELECT COUNT(*) as count
        FROM quiz_responses qr
        INNER JOIN quiz_attempts qa ON qr.attempt_id = qa.id
        WHERE qa.user_id = ${userId} AND qa.completed_at >= ${weekAgoTs}
      `);
      const itemsReviewedThisWeek = weekResponsesResult[0]?.count || 0;

      return { dueToday, accuracy, weeklyStudyTime, itemsReviewedThisWeek };
    } catch (error) {
      console.error("[Dashboard Metrics] Error:", error);
      return { dueToday: 0, accuracy: 0, weeklyStudyTime: 0, itemsReviewedThisWeek: 0 };
    }
  }

  /**
   * Get due flashcards sorted by urgency, filtered by userId
   */
  static async getDueFlashcards(userId: string, limit: number = 20): Promise<DueFlashcard[]> {
    try {
      const now = Date.now();
      const dueCards: any[] = db.all(sql`
        SELECT c.id, c.deck_id, c.front, c.back, c.due_at, c.ease_factor, c.interval, c.status
        FROM cards c
        INNER JOIN decks d ON c.deck_id = d.id
        WHERE d.user_id = ${userId} AND c.due_at <= ${now}
        ORDER BY c.due_at ASC
        LIMIT ${limit}
      `);

      return dueCards.map((card: any) => ({
        id: card.id,
        deckId: card.deck_id,
        front: card.front,
        back: card.back,
        nextReviewDate: card.due_at,
        easeFactor: card.ease_factor || 2.5,
        interval: card.interval || 0,
        status: card.status || "new",
        daysOverdue: Math.max(0, Math.floor((now - card.due_at) / (1000 * 60 * 60 * 24))),
      }));
    } catch (error) {
      console.error("[Get Due Flashcards] Error:", error);
      return [];
    }
  }

  /**
   * Get lowest scoring quiz for retake recommendation
   */
  static async getLowestScoringQuiz(userId: string): Promise<LowestScoringQuiz | null> {
    try {
      const results: any[] = db.all(sql`
        SELECT qa.score, qa.completed_at, q.id, q.title, q.subject
        FROM quiz_attempts qa
        INNER JOIN quizzes q ON qa.quiz_id = q.id
        WHERE qa.user_id = ${userId} AND qa.completed_at IS NOT NULL
        ORDER BY qa.score ASC
        LIMIT 1
      `);

      if (results.length === 0) return null;
      const r = results[0];

      // Count total attempts
      const countResult: any[] = db.all(sql`
        SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ${userId}
      `);

      return {
        id: r.id,
        title: r.title,
        subject: r.subject || undefined,
        bestScore: r.score || 0,
        attemptCount: countResult[0]?.count || 1,
        lastAttemptDate: r.completed_at || Date.now(),
      };
    } catch (error) {
      console.error("[Get Lowest Quiz] Error:", error);
      return null;
    }
  }

  /**
   * Get most recently edited notes
   */
  static async getRecentNotes(userId: string, limit: number = 5): Promise<RecentNote[]> {
    try {
      const recentNotes: any[] = db.all(sql`
        SELECT id, title, updated_at, subject
        FROM notes
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `);

      return recentNotes.map((note: any) => ({
        id: note.id,
        title: note.title,
        updatedAt: note.updated_at,
        subject: note.subject,
      }));
    } catch (error) {
      console.error("[Get Recent Notes] Error:", error);
      return [];
    }
  }

  /**
   * Create a study session entry (SQLite-compatible — no .returning())
   */
  static async createStudySession(
    userId: string,
    sessionType: string,
    durationMinutes: number,
    resourceId?: string,
    itemsReviewed?: number,
    correctAnswers?: number
  ) {
    try {
      const id = randomUUID();
      const startedAt = Date.now();

      db.run(sql`
        INSERT INTO study_sessions (id, user_id, session_type, resource_id, duration_minutes, items_reviewed, correct_answers, started_at)
        VALUES (${id}, ${userId}, ${sessionType}, ${resourceId || null}, ${durationMinutes}, ${itemsReviewed || 0}, ${correctAnswers || 0}, ${startedAt})
      `);

      const result: any[] = db.all(sql`SELECT * FROM study_sessions WHERE id = ${id}`);
      return result;
    } catch (error) {
      console.error("[Create Study Session] Error:", error);
      return [];
    }
  }
}
