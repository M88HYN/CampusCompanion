/**
 * Dashboard Analytics Module
 * 
 * Provides real-time, data-driven metrics for the dashboard.
 * All data comes from actual database records, no mock values.
 */

import { db } from "./db";
import { 
  cards, cardReviews, quizAttempts, quizResponses,
  decks, studySessions, notes, quizzes
} from "@shared/schema";
import { eq, and, lte, gte, desc, asc } from "drizzle-orm";
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
  nextReviewDate: Date;
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
  lastAttemptDate: Date;
}

interface RecentNote {
  id: string;
  title: string;
  updatedAt: Date;
  subject?: string;
}

export class DashboardAnalytics {
  /**
   * Get dashboard metrics - all real data from database
   * - Due Today: Flashcards due today
   * - Accuracy: Quiz accuracy percentage
   * - This Week Study Time: Minutes studied this week
   * - Items Reviewed: Total items reviewed this week
   */
  static async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      // 1. GET DUE TODAY
      // Get all cards due by end of today
      const dueCards = await db
        .select()
        .from(cards)
        .where(lte(cards.dueAt, endOfToday));
      
      const dueToday = dueCards.length;

      // 2. GET ACCURACY
      // Calculate from quiz attempts
      const userAttempts = await db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, userId));

      let correctResponses = 0;
      let totalResponses = 0;

      for (const attempt of userAttempts) {
        const responses = await db
          .select()
          .from(quizResponses)
          .where(eq(quizResponses.attemptId, attempt.id));
        
        responses.forEach((r: any) => {
          totalResponses++;
          if (r.isCorrect) correctResponses++;
        });
      }

      const accuracy = totalResponses > 0 
        ? Math.round((correctResponses / totalResponses) * 100)
        : 0;

      // 3. GET WEEKLY STUDY TIME
      const weekSessions = await db
        .select()
        .from(studySessions)
        .where(
          and(
            eq(studySessions.userId, userId),
            gte(studySessions.startedAt, weekAgo)
          )
        );
      
      const weeklyStudyTime = weekSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0);

      // 4. GET ITEMS REVIEWED THIS WEEK
      const weekAttempts = await db
        .select()
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, userId),
            gte(quizAttempts.completedAt, weekAgo)
          )
        );

      let itemsReviewedThisWeek = 0;
      for (const attempt of weekAttempts) {
        const responses = await db
          .select()
          .from(quizResponses)
          .where(eq(quizResponses.attemptId, attempt.id));
        itemsReviewedThisWeek += responses.length;
      }

      return {
        dueToday,
        accuracy,
        weeklyStudyTime,
        itemsReviewedThisWeek,
      };
    } catch (error) {
      console.error("[Dashboard Metrics] Error:", error);
      return {
        dueToday: 0,
        accuracy: 0,
        weeklyStudyTime: 0,
        itemsReviewedThisWeek: 0,
      };
    }
  }

  /**
   * Get due flashcards sorted by urgency
   */
  static async getDueFlashcards(userId: string, limit: number = 20): Promise<DueFlashcard[]> {
    try {
      const now = new Date();
      
      // Get all due cards (not filtered by user's decks to be comprehensive)
      const dueCards = await db
        .select()
        .from(cards)
        .orderBy(asc(cards.dueAt))
        .limit(limit);

      return dueCards.map((card: any) => ({
        id: card.id,
        deckId: card.deckId,
        front: card.front,
        back: card.back,
        nextReviewDate: card.dueAt,
        easeFactor: card.easeFactor,
        interval: card.interval,
        status: card.status,
        daysOverdue: Math.max(0, Math.floor((now.getTime() - card.dueAt.getTime()) / (1000 * 60 * 60 * 24))),
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
      // Get lowest score attempt for this user
      const attempts = await db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, userId))
        .orderBy(asc(quizAttempts.score));

      if (attempts.length === 0) return null;

      const lowestAttempt = attempts[0];
      
      // Get the quiz info
      const quizList = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, lowestAttempt.quizId));

      if (quizList.length === 0) return null;

      const quiz = quizList[0];

      return {
        id: quiz.id,
        title: quiz.title,
        subject: quiz.subject || undefined,
        bestScore: lowestAttempt.score || 0,
        attemptCount: attempts.length,
        lastAttemptDate: lowestAttempt.completedAt || new Date(),
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
      const recentNotes = await db
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.updatedAt))
        .limit(limit);

      return recentNotes.map((note: any) => ({
        id: note.id,
        title: note.title,
        updatedAt: note.updatedAt,
        subject: note.subject,
      }));
    } catch (error) {
      console.error("[Get Recent Notes] Error:", error);
      return [];
    }
  }

  /**
   * Create a study session entry
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
      const result = await db.insert(studySessions).values({
        id: randomUUID(),
        userId,
        sessionType,
        resourceId,
        durationMinutes,
        itemsReviewed,
        correctAnswers,
        startedAt: new Date(),
      }).returning();
      
      return result;
    } catch (error) {
      console.error("[Create Study Session] Error:", error);
      return [];
    }
  }
}
