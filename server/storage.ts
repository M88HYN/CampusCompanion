import {
  type User, type UpsertUser,
  type Note, type InsertNote,
  type NoteBlock, type InsertNoteBlock,
  type Deck, type InsertDeck,
  type Card, type InsertCard,
  type CardReview, type InsertCardReview,
  type Quiz, type InsertQuiz,
  type QuizQuestion, type InsertQuizQuestion,
  type QuizOption, type InsertQuizOption,
  type QuizAttempt, type InsertQuizAttempt,
  type QuizResponse, type InsertQuizResponse,
  type UserQuestionStats, type InsertUserQuestionStats,
  type UserPreferences, type InsertUserPreferences,
  users, notes, noteBlocks, decks, cards, cardReviews,
  quizzes, quizQuestions, quizOptions, quizAttempts, quizResponses, userQuestionStats, userPreferences
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, sql, or, lte, asc, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;

  // Notes
  getNotes(userId: string): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<void>;
  getNoteBlocks(noteId: string): Promise<NoteBlock[]>;
  createNoteBlocks(blocks: InsertNoteBlock[]): Promise<NoteBlock[]>;
  deleteNoteBlocks(noteId: string): Promise<void>;

  // Flashcards
  getDecks(userId: string): Promise<Deck[]>;
  getDeck(id: string): Promise<Deck | undefined>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: string, deck: Partial<InsertDeck>): Promise<Deck | undefined>;
  deleteDeck(id: string): Promise<void>;
  getCards(deckId: string): Promise<Card[]>;
  getCard(id: string): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: string, card: Partial<Card>): Promise<Card | undefined>;
  deleteCard(id: string): Promise<void>;
  getDueCards(userId: string): Promise<Card[]>;
  reviewCard(cardId: string, quality: number, userId: string): Promise<Card>;
  getCardReviews(cardId: string): Promise<CardReview[]>;
  getDeckStats(deckId: string): Promise<{ total: number; mastered: number; learning: number; new: number; dueToday: number }>;

  // Quizzes
  getQuizzes(userId: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  getQuizOptions(questionId: string): Promise<QuizOption[]>;
  createQuizOption(option: InsertQuizOption): Promise<QuizOption>;

  // Quiz Attempts
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  completeQuizAttempt(id: string, score: number, earnedMarks: number, totalMarks: number, timeSpent: number): Promise<QuizAttempt | undefined>;
  getQuizAttempts(quizId: string, userId: string): Promise<QuizAttempt[]>;

  // Quiz Responses
  createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse>;
  getQuizResponses(attemptId: string): Promise<QuizResponse[]>;
  convertResponseToFlashcard(responseId: string, deckId: string): Promise<{ response: QuizResponse; card: Card }>;

  // Integration helpers
  createQuizFromNotes(noteIds: string[], userId: string, quizData: Omit<InsertQuiz, 'userId'>): Promise<Quiz>;
  getQuizAnalytics(quizId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    averageTimeSpent: number;
    accuracyByDifficulty: Record<number, number>;
  }>;

  // User Question Stats (for adaptive engine and spaced repetition)
  getUserQuestionStats(userId: string, questionId: string): Promise<UserQuestionStats | undefined>;
  upsertUserQuestionStats(userId: string, questionId: string, isCorrect: boolean, responseTime: number): Promise<UserQuestionStats>;
  getDueQuestionsForReview(userId: string, limit?: number): Promise<UserQuestionStats[]>;
  updateSpacedRepetition(statsId: string, quality: number): Promise<UserQuestionStats>;
  
  // Adaptive Engine
  getNextAdaptiveQuestion(quizId: string, userId: string, currentDifficulty: number, currentAttemptId?: string): Promise<QuizQuestion | undefined>;
  getQuestionsByDifficulty(quizId: string, difficulty: number, excludeIds?: string[]): Promise<QuizQuestion[]>;
  
  // Quiz Attempt Updates
  updateQuizAttempt(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt | undefined>;
  getAllQuizzes(): Promise<Quiz[]>;
  
  // Analytics
  getUserAnalytics(userId: string): Promise<{
    totalQuizzesTaken: number;
    totalQuestionsAnswered: number;
    overallAccuracy: number;
    averageTimePerQuestion: number;
    strengthsByTopic: Record<string, number>;
    weaknessesByTopic: Record<string, number>;
    recentActivity: { date: string; score: number }[];
  }>;
  
  // Learning Insights
  getLearningInsights(userId: string): Promise<{
    overview: {
      totalStudyTime: number;
      totalSessions: number;
      currentStreak: number;
      longestStreak: number;
      cardsReviewed: number;
      quizzesTaken: number;
      overallAccuracy: number;
    };
    accuracyTrends: { date: string; quizAccuracy: number; flashcardAccuracy: number }[];
    topicPerformance: { topic: string; accuracy: number; totalQuestions: number; improvement: number }[];
    studyPatterns: { hour: number; sessions: number; avgAccuracy: number }[];
    weakAreas: { topic: string; accuracy: number; suggestion: string }[];
    strengths: { topic: string; accuracy: number; masteredConcepts: number }[];
    recommendations: { type: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
    weeklyProgress: { day: string; minutes: number; items: number }[];
  }>;

  // User Preferences/Settings
  getUserPreferences(userId: string): Promise<any>;
  updateUserPreferences(userId: string, preferences: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // ==================== USERS ====================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Users table doesn't have username field - return undefined or use email
    return undefined;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ 
        id: randomUUID(), 
        ...insertUser,
        createdAt: sql`CURRENT_TIMESTAMP` as any,
        updatedAt: sql`CURRENT_TIMESTAMP` as any
      })
      .returning();
    return user;
  }

  // ==================== NOTES ====================

  async getNotes(userId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.updatedAt));
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note || undefined;
  }

  async createNote(note: InsertNote): Promise<Note> {
  if (!note.userId || !note.title) {
    throw new Error("userId and title are required");
  }

  const id = randomUUID();

  // INSERT (SQLite-safe)
  await db.insert(notes).values({
    id,
    userId: note.userId,
    title: note.title,
    subject: note.subject ?? null,
    tags: note.tags ? JSON.stringify(note.tags) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 🔥 RE-SELECT (THIS IS THE KEY FIX)
  const [created] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, id));

  if (!created) {
    throw new Error("Failed to create note");
  }

  return created;
}

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const updateData: any = { 
      ...note,
      updatedAt: sql`CURRENT_TIMESTAMP` as any
    };
    if (note.tags !== undefined) {
      updateData.tags = note.tags ? JSON.stringify(note.tags) : null;
    }
    const [updated] = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(noteBlocks).where(eq(noteBlocks.noteId, id));
    await db.delete(notes).where(eq(notes.id, id));
  }

  async getNoteBlocks(noteId: string): Promise<NoteBlock[]> {
    return await db.select().from(noteBlocks).where(eq(noteBlocks.noteId, noteId)).orderBy(noteBlocks.order);
  }

  async createNoteBlocks(blocks: InsertNoteBlock[]): Promise<NoteBlock[]> {
    if (blocks.length === 0) return [];
    try {
      const createdIds: string[] = [];
      
      // Insert blocks one by one to handle type conversion properly
      for (const block of blocks) {
        const id = randomUUID();
        await db.insert(noteBlocks).values({
          id,
          noteId: block.noteId,
          type: String(block.type),
          content: String(block.content),
          order: Number(block.order),
          noteType: String(block.noteType || 'general'),
          isExamContent: Boolean(block.isExamContent),
          examPrompt: block.examPrompt ? String(block.examPrompt) : null,
          examMarks: block.examMarks ? Number(block.examMarks) : null,
          keyTerms: block.keyTerms ? String(block.keyTerms) : null,
        });
        createdIds.push(id);
      }
      
      // Return the created blocks
      return await db.select().from(noteBlocks).where(
        inArray(noteBlocks.id, createdIds)
      );
    } catch (error) {
      console.error('Error in createNoteBlocks:', error);
      throw error;
    }
  }

  async deleteNoteBlocks(noteId: string): Promise<void> {
    await db.delete(noteBlocks).where(eq(noteBlocks.noteId, noteId));
  }

  // ==================== FLASHCARDS ====================

  async getDecks(userId: string): Promise<Deck[]> {
    return await db.select().from(decks).where(eq(decks.userId, userId)).orderBy(desc(decks.createdAt));
  }

  async getDeck(id: string): Promise<Deck | undefined> {
    const [deck] = await db.select().from(decks).where(eq(decks.id, id));
    return deck || undefined;
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    const [created] = await db.insert(decks).values({ 
      id: randomUUID(), 
      ...deck, 
      tags: deck.tags ? JSON.stringify(deck.tags) : null,
      createdAt: sql`CURRENT_TIMESTAMP` as any
    }).returning();
    return created;
  }

  async updateDeck(id: string, deck: Partial<InsertDeck>): Promise<Deck | undefined> {
    const updateData: any = { ...deck };
    if (deck.tags !== undefined) {
      updateData.tags = deck.tags ? JSON.stringify(deck.tags) : null;
    }
    const [updated] = await db
      .update(decks)
      .set(updateData)
      .where(eq(decks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDeck(id: string): Promise<void> {
    await db.delete(cards).where(eq(cards.deckId, id));
    await db.delete(decks).where(eq(decks.id, id));
  }

  async getCards(deckId: string): Promise<Card[]> {
    return await db.select().from(cards).where(eq(cards.deckId, deckId));
  }

  async getCard(id: string): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || undefined;
  }

  async createCard(card: InsertCard): Promise<Card> {
    const [created] = await db.insert(cards).values({ 
      id: randomUUID(), 
      ...card, 
      createdAt: sql`CURRENT_TIMESTAMP` as any,
      dueAt: sql`CURRENT_TIMESTAMP` as any
    }).returning();
    return created;
  }

  async updateCard(id: string, card: Partial<Card>): Promise<Card | undefined> {
    const [updated] = await db
      .update(cards)
      .set(card)
      .where(eq(cards.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCard(id: string): Promise<void> {
    await db.delete(cards).where(eq(cards.id, id));
  }

  async getDueCards(userId: string): Promise<Card[]> {
    const userDecks = await this.getDecks(userId);
    const deckIds = userDecks.map(d => d.id);
    
    if (deckIds.length === 0) return [];
    
    const { inArray } = await import("drizzle-orm");
    
    return await db
      .select()
      .from(cards)
      .where(
        and(
          inArray(cards.deckId, deckIds),
          lt(cards.dueAt, new Date())
        )
      )
      .orderBy(cards.dueAt);
  }

  async reviewCard(cardId: string, quality: number, userId: string): Promise<Card> {
    // SM-2 Algorithm implementation
    const card = await this.getCard(cardId);
    if (!card) throw new Error("Card not found");

    const oldEaseFactor = card.easeFactor;
    const oldInterval = card.interval;
    let { easeFactor, interval, repetitions } = card;
    
    if (quality >= 3) {
      // Correct response
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
      // Incorrect response
      repetitions = 0;
      interval = 1;
    }

    easeFactor = Math.max(1.3, easeFactor);
    
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + interval);

    const status = 
      repetitions === 0 ? "learning" :
      repetitions < 3 ? "reviewing" :
      "mastered";

    const [updated] = await db
      .update(cards)
      .set({
        easeFactor,
        interval,
        repetitions,
        dueAt,
        status,
        lastReviewedAt: sql`CURRENT_TIMESTAMP` as any,
      })
      .where(eq(cards.id, cardId))
      .returning();

    // Record review history
    await db.insert(cardReviews).values({
      id: randomUUID(),
      cardId,
      userId,
      quality,
      intervalBefore: oldInterval,
      intervalAfter: interval,
      easeFactorBefore: oldEaseFactor,
      easeFactorAfter: easeFactor,
    });

    return updated;
  }

  async getCardReviews(cardId: string): Promise<CardReview[]> {
    return await db
      .select()
      .from(cardReviews)
      .where(eq(cardReviews.cardId, cardId))
      .orderBy(desc(cardReviews.reviewedAt));
  }

  async getDeckStats(deckId: string): Promise<{ total: number; mastered: number; learning: number; new: number; dueToday: number }> {
    const deckCards = await this.getCards(deckId);
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    return {
      total: deckCards.length,
      mastered: deckCards.filter(c => c.status === "mastered").length,
      learning: deckCards.filter(c => c.status === "learning" || c.status === "reviewing").length,
      new: deckCards.filter(c => c.status === "new").length,
      dueToday: deckCards.filter(c => c.dueAt <= endOfDay).length,
    };
  }

  // ==================== QUIZZES ====================

  async getQuizzes(userId: string): Promise<Quiz[]> {
    try {
      return await db.select().from(quizzes).where(eq(quizzes.userId, userId)).orderBy(desc(quizzes.createdAt));
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      return [];
    }
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [created] = await db.insert(quizzes).values({ id: randomUUID(), ...quiz }).returning();
    return created;
  }

  async deleteQuiz(id: string): Promise<void> {
    const questions = await this.getQuizQuestions(id);
    for (const question of questions) {
      await db.delete(quizOptions).where(eq(quizOptions.questionId, question.id));
    }
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId)).orderBy(quizQuestions.order);
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [created] = await db.insert(quizQuestions).values({ id: randomUUID(), ...question }).returning();
    return created;
  }

  async getQuizOptions(questionId: string): Promise<QuizOption[]> {
    return await db.select().from(quizOptions).where(eq(quizOptions.questionId, questionId)).orderBy(quizOptions.order);
  }

  async createQuizOption(option: InsertQuizOption): Promise<QuizOption> {
    const [created] = await db.insert(quizOptions).values({ id: randomUUID(), ...option }).returning();
    return created;
  }

  // ==================== QUIZ ATTEMPTS ====================

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = randomUUID();
    
    // Use raw SQL to bypass Drizzle's type checking for SQLite
    await db.run(sql`
      INSERT INTO quiz_attempts (
        id, quiz_id, user_id, mode, started_at, current_question_index,
        current_difficulty, status
      ) VALUES (
        ${id}, 
        ${attempt.quizId}, 
        ${attempt.userId}, 
        ${attempt.mode}, 
        CURRENT_TIMESTAMP,
        ${attempt.currentQuestionIndex ?? 0},
        ${attempt.currentDifficulty ?? 3},
        ${attempt.status ?? 'in_progress'}
      )
    `);
    
    // Fetch the created record
    const [created] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return created;
  }

  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return attempt || undefined;
  }

  async completeQuizAttempt(
    id: string,
    score: number,
    earnedMarks: number,
    totalMarks: number,
    timeSpent: number
  ): Promise<QuizAttempt | undefined> {
    const [updated] = await db
      .update(quizAttempts)
      .set({
        completedAt: sql`CURRENT_TIMESTAMP` as any,
        score,
        earnedMarks,
        totalMarks,
        timeSpent,
      })
      .where(eq(quizAttempts.id, id))
      .returning();
    return updated || undefined;
  }

  async getQuizAttempts(quizId: string, userId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.userId, userId)))
      .orderBy(desc(quizAttempts.startedAt));
  }

  // ==================== QUIZ RESPONSES ====================

  async createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse> {
    const id = randomUUID();
    const isCorrectValue = typeof response.isCorrect === "boolean" ? (response.isCorrect ? 1 : 0) : null;
    
    // Use raw SQL to bypass Drizzle's type checking for SQLite
    await db.run(sql`
      INSERT INTO quiz_responses (
        id, attempt_id, question_id, selected_option_id, text_answer,
        is_correct, marks_awarded, feedback, response_time, 
        confidence_level, flashcard_id, answered_at, converted_to_flashcard
      ) VALUES (
        ${id}, 
        ${response.attemptId}, 
        ${response.questionId}, 
        ${response.selectedOptionId ?? null}, 
        ${response.textAnswer ?? null},
        ${isCorrectValue}, 
        ${response.marksAwarded ?? 0}, 
        ${response.feedback ?? null}, 
        ${response.responseTime ?? null},
        ${response.confidenceLevel ?? null}, 
        ${response.flashcardId ?? null}, 
        CURRENT_TIMESTAMP,
        0
      )
    `);
    
    // Fetch the created record
    const [created] = await db.select().from(quizResponses).where(eq(quizResponses.id, id));
    return created;
  }

  async getQuizResponses(attemptId: string): Promise<QuizResponse[]> {
    return await db.select().from(quizResponses).where(eq(quizResponses.attemptId, attemptId));
  }

  async convertResponseToFlashcard(responseId: string, deckId: string): Promise<{ response: QuizResponse; card: Card }> {
    const [response] = await db.select().from(quizResponses).where(eq(quizResponses.id, responseId));
    if (!response) throw new Error("Response not found");

    const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, response.questionId));
    if (!question) throw new Error("Question not found");

    // Create flashcard from question
    const [card] = await db.insert(cards).values({
      deckId,
      front: question.question,
      back: question.explanation || question.correctAnswer || "No explanation available",
      sourceQuestionId: question.id,
    }).returning();

    // Mark response as converted
    const [updatedResponse] = await db
      .update(quizResponses)
      .set({
        convertedToFlashcard: true,
        flashcardId: card.id,
      })
      .where(eq(quizResponses.id, responseId))
      .returning();

    return { response: updatedResponse, card };
  }

  // ==================== INTEGRATION HELPERS ====================

  async createQuizFromNotes(noteIds: string[], userId: string, quizData: Omit<InsertQuiz, 'userId'>): Promise<Quiz> {
    // Create the quiz
    const quiz = await this.createQuiz({ ...quizData, userId });
    
    // For now, return the empty quiz - AI question generation would happen in the route handler
    return quiz;
  }

  async getQuizAnalytics(quizId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    averageTimeSpent: number;
    accuracyByDifficulty: Record<number, number>;
  }> {
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quizId), sql`${quizAttempts.completedAt} IS NOT NULL`));

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        averageTimeSpent: 0,
        accuracyByDifficulty: {},
      };
    }

    const totalAttempts = attempts.length;
    const averageScore = attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / totalAttempts;
    const averageTimeSpent = attempts.reduce((sum: number, a: any) => sum + (a.timeSpent || 0), 0) / totalAttempts;

    // Calculate accuracy by difficulty
    const questions = await this.getQuizQuestions(quizId);
    const accuracyByDifficulty: Record<number, number> = {};

    for (const difficulty of [1, 2, 3, 4, 5]) {
      const diffQuestions = questions.filter(q => q.difficulty === difficulty);
      if (diffQuestions.length === 0) continue;

      let correctCount = 0;
      let totalCount = 0;

      for (const attempt of attempts) {
        const responses = await this.getQuizResponses(attempt.id);
        for (const question of diffQuestions) {
          const response = responses.find(r => r.questionId === question.id);
          if (response) {
            totalCount++;
            if (response.isCorrect) correctCount++;
          }
        }
      }

      // Prevent NaN by ensuring totalCount > 0
      if (totalCount > 0) {
        accuracyByDifficulty[difficulty] = Math.round((correctCount / totalCount) * 100);
      }
    }

    return {
      totalAttempts,
      averageScore: Math.round(averageScore),
      averageTimeSpent: Math.round(averageTimeSpent),
      accuracyByDifficulty,
    };
  }

  // ==================== USER QUESTION STATS ====================

  async getUserQuestionStats(userId: string, questionId: string): Promise<UserQuestionStats | undefined> {
    const [stats] = await db
      .select()
      .from(userQuestionStats)
      .where(and(eq(userQuestionStats.userId, userId), eq(userQuestionStats.questionId, questionId)));
    return stats || undefined;
  }

  async upsertUserQuestionStats(userId: string, questionId: string, isCorrect: boolean, responseTime: number): Promise<UserQuestionStats> {
    const existing = await this.getUserQuestionStats(userId, questionId);
    
    if (existing) {
      const newTimesAnswered = existing.timesAnswered + 1;
      const newTimesCorrect = existing.timesCorrect + (isCorrect ? 1 : 0);
      const newStreak = isCorrect ? existing.streak + 1 : 0;
      const newAvgTime = ((existing.averageResponseTime || 0) * existing.timesAnswered + responseTime) / newTimesAnswered;
      
      // Use raw SQL to avoid column name mismatch (lastAnsweredAt vs last_attempted_at)
      await db.run(sql`
        UPDATE user_question_stats
        SET times_answered = ${newTimesAnswered},
            times_correct = ${newTimesCorrect},
            streak = ${newStreak},
            average_response_time = ${newAvgTime},
            last_attempted_at = ${new Date().toISOString()}
        WHERE id = ${existing.id}
      `);
      
      return {
        ...existing,
        timesAnswered: newTimesAnswered,
        timesCorrect: newTimesCorrect,
        streak: newStreak,
        averageResponseTime: newAvgTime,
        lastAnsweredAt: new Date(),
      };
    } else {
      const newId = randomUUID();
      const now = new Date().toISOString();
      
      // Use raw SQL to avoid column name mismatch
      await db.run(sql`
        INSERT INTO user_question_stats (
          id, user_id, question_id, times_answered, times_correct,
          average_response_time, last_attempted_at, streak, next_review_date
        ) VALUES (
          ${newId}, ${userId}, ${questionId}, 1, ${isCorrect ? 1 : 0},
          ${responseTime}, ${now}, ${isCorrect ? 1 : 0}, ${now}
        )
      `);
      
      return {
        id: newId,
        userId,
        questionId,
        timesAnswered: 1,
        timesCorrect: isCorrect ? 1 : 0,
        averageResponseTime: responseTime,
        lastAnsweredAt: new Date(),
        streak: isCorrect ? 1 : 0,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewAt: new Date(),
        status: 'new',
      };
    }
  }

  async getDueQuestionsForReview(userId: string, limit: number = 20): Promise<UserQuestionStats[]> {
    // ALTERNATIVE: Get questions from incorrect quiz responses instead of userQuestionStats
    try {
      // Get all completed quiz attempts for this user
      const attempts = await db
        .select()
        .from(quizAttempts)
        .where(and(
          eq(quizAttempts.userId, userId),
          sql`${quizAttempts.completedAt} IS NOT NULL`
        ));

      if (attempts.length === 0) return [];

      // Get all incorrect responses
      const incorrectResponses = await db
        .select()
        .from(quizResponses)
        .where(and(
          inArray(quizResponses.attemptId, attempts.map((a: typeof attempts[0]) => a.id)),
          eq(quizResponses.isCorrect, false)
        ))
        .limit(limit);

      // Convert to UserQuestionStats format for compatibility
      return incorrectResponses.map((response: typeof incorrectResponses[0]) => ({
        id: response.id,
        userId,
        questionId: response.questionId,
        timesAnswered: 1,
        timesCorrect: 0,
        averageResponseTime: response.responseTime || null,
        lastAnsweredAt: response.answeredAt,
        nextReviewAt: response.answeredAt, // Due immediately
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        streak: 0,
        status: 'new',
      } as UserQuestionStats));
    } catch (error) {
      console.error("[Spaced Review] Error fetching due questions:", error);
      return [];
    }
  }

  async updateSpacedRepetition(statsId: string, quality: number): Promise<UserQuestionStats> {
    const [stats] = await db.select().from(userQuestionStats).where(eq(userQuestionStats.id, statsId));
    if (!stats) throw new Error("Stats not found");

    let { easeFactor, interval, repetitions } = stats;
    
    // SM-2 Algorithm
    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = Math.max(1.3, easeFactor);
    
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);

    const status = 
      repetitions === 0 ? "learning" :
      repetitions < 3 ? "reviewing" :
      "mastered";

    const [updated] = await db
      .update(userQuestionStats)
      .set({
        easeFactor,
        interval,
        repetitions,
        nextReviewAt,
        status,
      })
      .where(eq(userQuestionStats.id, statsId))
      .returning();

    return updated;
  }

  // ==================== ADAPTIVE ENGINE ====================

  async getNextAdaptiveQuestion(quizId: string, userId: string, currentDifficulty: number, currentAttemptId?: string): Promise<QuizQuestion | undefined> {
    // Get all questions for this quiz
    const allQuestions = await this.getQuizQuestions(quizId);
    if (allQuestions.length === 0) return undefined;

    // Get answered questions for the current attempt only (not all historical attempts)
    const answeredQuestionIds = new Set<string>();
    if (currentAttemptId) {
      const responses = await this.getQuizResponses(currentAttemptId);
      responses.forEach(r => answeredQuestionIds.add(r.questionId));
    }

    // Filter to unanswered questions at current difficulty (or nearby)
    const targetDifficulties = [currentDifficulty, currentDifficulty - 1, currentDifficulty + 1]
      .filter(d => d >= 1 && d <= 5);
    
    for (const difficulty of targetDifficulties) {
      const candidates = allQuestions.filter(
        q => q.difficulty === difficulty && !answeredQuestionIds.has(q.id)
      );
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    // If no matching difficulty, return any unanswered question
    const remaining = allQuestions.filter(q => !answeredQuestionIds.has(q.id));
    if (remaining.length > 0) {
      return remaining[Math.floor(Math.random() * remaining.length)];
    }

    return undefined;
  }

  async getQuestionsByDifficulty(quizId: string, difficulty: number, excludeIds: string[] = []): Promise<QuizQuestion[]> {
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(and(eq(quizQuestions.quizId, quizId), eq(quizQuestions.difficulty, difficulty)));
    
    return questions.filter((q: any) => !excludeIds.includes(q.id));
  }

  // ==================== QUIZ ATTEMPT UPDATES ====================

  async updateQuizAttempt(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt | undefined> {
    const [updated] = await db
      .update(quizAttempts)
      .set(updates)
      .where(eq(quizAttempts.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
  }

  // ==================== USER ANALYTICS ====================

  async getUserAnalytics(userId: string): Promise<any> {
    // Analytics are derived from quiz_attempts and quiz_responses tables
    // No separate user_analytics table - data is calculated on-demand
    // This ensures analytics are always in sync with actual quiz activity
    
    try {
      // Get all completed quiz attempts with quiz details
      const attemptsResult = await db.run(sql`
        SELECT 
          qa.id,
          qa.quiz_id,
          qa.score,
          qa.earned_marks,
          qa.total_marks,
          qa.time_spent,
          qa.completed_at,
          q.title as quiz_title,
          q.subject as topic
        FROM quiz_attempts qa
        LEFT JOIN quizzes q ON qa.quiz_id = q.id
        WHERE qa.user_id = ${userId} AND qa.completed_at IS NOT NULL
        ORDER BY qa.completed_at DESC
      `);

      // Ensure attemptsResult is an array
      const attempts = Array.isArray(attemptsResult) ? attemptsResult : [];

      // Safe default for users with no quiz history
      if (!attempts || attempts.length === 0) {
        return {
          totalQuizzesTaken: 0,
          totalQuestionsAnswered: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          accuracy: 0,
          avgTimePerQuestion: 0,
          totalStudyTimeMinutes: 0,
          currentStreak: 0,
          longestStreak: 0,
          strengths: [],
          weaknesses: [],
          performanceByDifficulty: [],
          topicBreakdown: [],
          recentActivity: [],
        };
      }

      // Get all responses for these attempts using raw SQL
      let totalCorrect = 0;
      let totalQuestions = 0;
      let totalTime = 0;
      const topicAccuracy: Record<string, { correct: number; total: number; timeSum: number; quizIds: Set<string> }> = {};
      const difficultyStats: Record<string, { correct: number; total: number }> = {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 },
      };

      for (const attempt of attempts) {
        try {
          const responsesResult = await db.run(sql`
            SELECT qr.*, qq.tags, qq.difficulty as question_difficulty
            FROM quiz_responses qr
            LEFT JOIN quiz_questions qq ON qr.question_id = qq.id
            WHERE qr.attempt_id = ${attempt.id}
          `);
          
          const responses = Array.isArray(responsesResult) ? responsesResult : [];
          
          // Safely handle empty or null responses
          if (!responses || responses.length === 0) continue;
          
          for (const response of responses) {
            totalQuestions++;
            // SQLite stores boolean as 0/1
            const isCorrect = response.is_correct === 1;
            if (isCorrect) totalCorrect++;
            totalTime += response.response_time || 0;

            // Track difficulty performance (use question difficulty if available)
            const questionDifficulty = response.question_difficulty ?? 3;
            const difficulty = questionDifficulty <= 2 ? "easy" : questionDifficulty <= 4 ? "medium" : "hard";
            if (difficultyStats[difficulty]) {
              difficultyStats[difficulty].total++;
              if (isCorrect) difficultyStats[difficulty].correct++;
            }

            // Process tags for topic analysis (defensive parsing)
            if (response.tags) {
              let tags: string[];
              try {
                tags = typeof response.tags === 'string' ? JSON.parse(response.tags) : response.tags;
              } catch {
                tags = [];
              }
              
              for (const tag of tags) {
                if (!tag || typeof tag !== 'string') continue; // Skip invalid tags
                if (!topicAccuracy[tag]) {
                  topicAccuracy[tag] = { correct: 0, total: 0, timeSum: 0, quizIds: new Set() };
                }
                topicAccuracy[tag].total++;
                topicAccuracy[tag].timeSum += response.response_time || 0;
                topicAccuracy[tag].quizIds.add(attempt.quiz_id);
                if (isCorrect) topicAccuracy[tag].correct++;
              }
            }
          }
        } catch (responseError) {
          // Log but don't crash - skip this attempt if responses fail to load
          console.warn(`[Analytics] Failed to load responses for attempt ${attempt.id}:`, responseError);
          continue;
        }
      }

      const incorrectAnswers = totalQuestions - totalCorrect;

      // Calculate strengths (≥70% accuracy, ≥3 questions)
      const strengths = Object.entries(topicAccuracy)
        .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) >= 0.7)
        .map(([topic, stats]) => ({
          topic,
          accuracy: Math.round((stats.correct / stats.total) * 100),
          questionsAnswered: stats.total,
          avgTimeSeconds: Math.round(stats.timeSum / stats.total),
          quizzesTaken: stats.quizIds.size,
        }))
        .sort((a, b) => b.accuracy - a.accuracy);

      // Calculate weaknesses (<70% accuracy, ≥3 questions)
      const weaknesses = Object.entries(topicAccuracy)
        .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) < 0.7)
        .map(([topic, stats]) => ({
          topic,
          accuracy: Math.round((stats.correct / stats.total) * 100),
          questionsAnswered: stats.total,
          avgTimeSeconds: Math.round(stats.timeSum / stats.total),
          quizzesTaken: stats.quizIds.size,
        }))
        .sort((a, b) => a.accuracy - b.accuracy);

      // Performance by difficulty
      const performanceByDifficulty = Object.entries(difficultyStats).map(([level, stats]) => ({
        level,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        questionsAnswered: stats.total,
      }));

      // Topic breakdown
      const topicBreakdown = Object.entries(topicAccuracy).map(([topic, stats]) => ({
        topic,
        accuracy: Math.round((stats.correct / stats.total) * 100),
        questionsAnswered: stats.total,
        quizzesTaken: stats.quizIds.size,
        avgTimeSeconds: Math.round(stats.timeSum / stats.total),
      }));

      // Study streak calculation
      const studyDates = [...new Set(
        attempts
          .map((a: any) => a.completed_at?.split('T')[0])
          .filter(Boolean)
      )].sort().reverse();

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      let lastDate = today;

      for (const date of studyDates) {
        const daysDiff = Math.floor(
          (new Date(lastDate).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= 1) {
          tempStreak++;
          if (lastDate === today || daysDiff === 1) {
            currentStreak = tempStreak;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
        lastDate = date;
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

      // Recent activity (last 10 attempts)
      const recentActivity = attempts.slice(0, 10).map((a: any) => {
        let date = '';
        try {
          if (a.completed_at) {
            date = a.completed_at.split('T')[0].split(' ')[0];
          }
        } catch {
          date = '';
        }
        const totalMarks = typeof a.total_marks === 'number' ? a.total_marks : 0;
        const earnedMarks = typeof a.earned_marks === 'number' ? a.earned_marks : 0;
        return {
          quizId: a.quiz_id,
          quizTitle: a.quiz_title || 'Untitled Quiz',
          topic: a.topic || 'General',
          score: earnedMarks,
          maxScore: totalMarks,
          accuracy: totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0,
          completedAt: a.completed_at,
          date,
        };
      });

      // Total study time in minutes
      const totalStudyTimeMinutes = Math.round(totalTime / 60);

      return {
        totalQuizzesTaken: attemptsResult.length,
        totalQuestionsAnswered: totalQuestions,
        correctAnswers: totalCorrect,
        incorrectAnswers,
        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        avgTimePerQuestion: totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
        totalStudyTimeMinutes,
        currentStreak,
        longestStreak,
        strengths,
        weaknesses,
        performanceByDifficulty,
        topicBreakdown,
        recentActivity,
      };
    } catch (error) {
      // If any error occurs, return safe defaults instead of crashing
      console.error('[Analytics] Error calculating user analytics:', error);
      return {
        totalQuizzesTaken: 0,
        totalQuestionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        accuracy: 0,
        avgTimePerQuestion: 0,
        totalStudyTimeMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        strengths: [],
        weaknesses: [],
        performanceByDifficulty: [],
        topicBreakdown: [],
        recentActivity: [],
      };
    }
  }

  // ==================== LEARNING INSIGHTS ====================

  async getLearningInsights(userId: string): Promise<{
    overview: {
      totalStudyTime: number;
      totalSessions: number;
      currentStreak: number;
      longestStreak: number;
      cardsReviewed: number;
      quizzesTaken: number;
      overallAccuracy: number;
    };
    accuracyTrends: { date: string; quizAccuracy: number; flashcardAccuracy: number }[];
    topicPerformance: { topic: string; accuracy: number; totalQuestions: number; improvement: number }[];
    studyPatterns: { hour: number; sessions: number; avgAccuracy: number }[];
    weakAreas: { topic: string; accuracy: number; suggestion: string }[];
    strengths: { topic: string; accuracy: number; masteredConcepts: number }[];
    recommendations: { type: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
    weeklyProgress: { day: string; minutes: number; items: number }[];
  }> {
    try {
    // Get quiz attempts for the user
    const allAttempts = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), sql`${quizAttempts.completedAt} IS NOT NULL`))
      .orderBy(desc(quizAttempts.completedAt));

    // Get flashcard decks and cards - count mastered vs total for accurate metrics
    const userDecks = await this.getDecks(userId);
    let totalCards = 0;
    let masteredCards = 0;
    let totalCardReviews = 0;
    const flashcardStudyDates: Set<string> = new Set();

    for (const deck of userDecks) {
      const deckCards = await this.getCards(deck.id);
      for (const card of deckCards) {
        totalCards++;
        if (card.status === 'mastered') masteredCards++;
        // Count actual reviews from cardReviews table
        const reviews = await db.run(sql`
          SELECT review_date, quality FROM card_reviews WHERE card_id = ${card.id}
        `);
        totalCardReviews += reviews.length;
        // Track flashcard study dates for streak calculation
        for (const review of reviews) {
          const reviewDate = review.review_date ? new Date(review.review_date) : null;
          if (reviewDate && !isNaN(reviewDate.getTime())) {
            flashcardStudyDates.add(reviewDate.toISOString().split('T')[0]);
          }
        }
      }
    }

    // Calculate quiz stats from actual quiz responses (accurate data)
    let quizCorrect = 0;
    let quizTotal = 0;
    let totalStudyTime = 0;
    const topicStats: Record<string, { correct: number; total: number; recentCorrect: number; recentTotal: number }> = {};
    const hourlyStats: Record<number, { sessions: number; correct: number; total: number }> = {};
    const dailyProgress: Record<string, { minutes: number; items: number }> = {};
    const studyDates: Set<string> = new Set();

    // Initialize last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      dailyProgress[dayKey] = { minutes: 0, items: 0 };
    }

    // Daily quiz accuracy for trends (using actual response correctness)
    const dailyQuizAccuracy: Record<string, { correct: number; total: number }> = {};

    // Process quiz attempts
    for (const attempt of allAttempts) {
      totalStudyTime += attempt.timeSpent || 0;
      
      const completedDate = attempt.completedAt ? new Date(attempt.completedAt as any) : null;
      if (completedDate && !isNaN(completedDate.getTime())) {
        const dateKey = completedDate.toISOString().split('T')[0];
        studyDates.add(dateKey);
        const hour = completedDate.getHours();
        
        // Track hourly patterns
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { sessions: 0, correct: 0, total: 0 };
        }
        hourlyStats[hour].sessions++;
        
        // Track daily progress
        if (dailyProgress[dateKey]) {
          dailyProgress[dateKey].minutes += Math.round((attempt.timeSpent || 0) / 60);
        }

        // Initialize daily accuracy tracking
        if (!dailyQuizAccuracy[dateKey]) {
          dailyQuizAccuracy[dateKey] = { correct: 0, total: 0 };
        }
      }

      const responses = await this.getQuizResponses(attempt.id);
      const isRecent = completedDate ? (new Date().getTime() - completedDate.getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
      
      for (const response of responses) {
        quizTotal++;
        if (response.isCorrect) quizCorrect++;
        
        if (completedDate) {
          const hour = completedDate.getHours();
          const dateKey = completedDate.toISOString().split('T')[0];
          
          hourlyStats[hour].total++;
          if (response.isCorrect) hourlyStats[hour].correct++;
          
          // Track daily accuracy from actual responses
          dailyQuizAccuracy[dateKey].total++;
          if (response.isCorrect) dailyQuizAccuracy[dateKey].correct++;
          
          if (dailyProgress[dateKey]) {
            dailyProgress[dateKey].items++;
          }
        }

        // Get question for topic analysis
        const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, response.questionId));
        if (question?.tags) {
          for (const tag of question.tags) {
            if (!topicStats[tag]) {
              topicStats[tag] = { correct: 0, total: 0, recentCorrect: 0, recentTotal: 0 };
            }
            topicStats[tag].total++;
            if (response.isCorrect) topicStats[tag].correct++;
            
            if (isRecent) {
              topicStats[tag].recentTotal++;
              if (response.isCorrect) topicStats[tag].recentCorrect++;
            }
          }
        }
      }
    }

    // Calculate overall quiz accuracy (only from quiz data - accurate)
    const overallAccuracy = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0;

    // Merge quiz and flashcard study dates for streak calculation
    Array.from(flashcardStudyDates).forEach(date => {
      studyDates.add(date);
    });

    // Calculate streak from actual study dates (quizzes + flashcard reviews)
    const sortedDates = Array.from(studyDates).sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    if (sortedDates.length > 0) {
      // Check if studied today or yesterday for current streak
      const lastStudyDate = sortedDates[0];
      const daysDiff = Math.floor((new Date(today).getTime() - new Date(lastStudyDate).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      
      // Calculate longest streak
      tempStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    }

    // Build topic performance
    const topicPerformance = Object.entries(topicStats).map(([topic, stats]) => {
      const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      const recentAccuracy = stats.recentTotal > 0 ? Math.round((stats.recentCorrect / stats.recentTotal) * 100) : accuracy;
      const improvement = stats.recentTotal >= 2 ? recentAccuracy - accuracy : 0;
      return { topic, accuracy, totalQuestions: stats.total, improvement };
    }).sort((a, b) => b.totalQuestions - a.totalQuestions);

    // Identify weak areas and strengths
    const weakAreas = topicPerformance
      .filter(t => t.accuracy < 60 && t.totalQuestions >= 3)
      .map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
        suggestion: t.accuracy < 40 
          ? `Review foundational concepts in ${t.topic}` 
          : `Practice more ${t.topic} questions to improve`
      }))
      .slice(0, 5);

    const strengths = topicPerformance
      .filter(t => t.accuracy >= 80 && t.totalQuestions >= 3)
      .map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
        masteredConcepts: Math.round(t.totalQuestions * (t.accuracy / 100))
      }))
      .slice(0, 5);

    // Build study patterns
    const studyPatterns = Object.entries(hourlyStats)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        sessions: stats.sessions,
        avgAccuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
      }))
      .sort((a, b) => a.hour - b.hour);

    // Generate accuracy trends from actual daily response data (quiz only - no daily flashcard tracking)
    const accuracyTrends: { date: string; quizAccuracy: number; flashcardAccuracy: number }[] = [];
    const flashcardMasteryRate = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
    
    // Get card review data for daily flashcard accuracy (if available)
    const cardReviewsByDay: Record<string, { correct: number; total: number }> = {};
    for (const deck of userDecks) {
      const deckCards = await this.getCards(deck.id);
      for (const card of deckCards) {
        // Get actual reviews for this card
        const reviews = await db.run(sql`
          SELECT review_date, quality FROM card_reviews WHERE card_id = ${card.id}
        `);
        for (const review of reviews) {
          const reviewDate = review.review_date ? new Date(review.review_date) : null;
          if (!reviewDate || isNaN(reviewDate.getTime())) continue;
          const dateKey = reviewDate.toISOString().split('T')[0];
          if (!cardReviewsByDay[dateKey]) {
            cardReviewsByDay[dateKey] = { correct: 0, total: 0 };
          }
          cardReviewsByDay[dateKey].total++;
          // Quality >= 3 is considered correct in SM-2
          if (review.quality >= 3) cardReviewsByDay[dateKey].correct++;
        }
      }
    }
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const quizStats = dailyQuizAccuracy[dateKey];
      const flashcardStats = cardReviewsByDay[dateKey];
      accuracyTrends.push({
        date: dateKey,
        quizAccuracy: quizStats && quizStats.total > 0 ? Math.round((quizStats.correct / quizStats.total) * 100) : 0,
        flashcardAccuracy: flashcardStats && flashcardStats.total > 0 
          ? Math.round((flashcardStats.correct / flashcardStats.total) * 100) 
          : 0
      });
    }

    // Weekly progress
    const weeklyProgress = Object.entries(dailyProgress)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        const dayOfWeek = days[new Date(date).getDay()];
        return { day: dayOfWeek, ...data };
      });

    // Generate personalized recommendations
    const recommendations: { type: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }[] = [];

    if (weakAreas.length > 0) {
      recommendations.push({
        type: 'focus',
        title: `Focus on ${weakAreas[0].topic}`,
        description: `Your accuracy is ${weakAreas[0].accuracy}% in this area. Consider reviewing related flashcards or taking practice quizzes.`,
        priority: 'high'
      });
    }

    if (allAttempts.length < 5) {
      recommendations.push({
        type: 'practice',
        title: 'Take more quizzes',
        description: 'Complete at least 5 quizzes to get more accurate insights about your learning patterns.',
        priority: 'medium'
      });
    }

    const peakHour = studyPatterns.length > 0 
      ? studyPatterns.reduce((best, curr) => curr.avgAccuracy > best.avgAccuracy ? curr : best)
      : null;
    
    if (peakHour && peakHour.avgAccuracy > 70) {
      const timeLabel = peakHour.hour < 12 ? `${peakHour.hour === 0 ? 12 : peakHour.hour}am` : peakHour.hour === 12 ? '12pm' : `${peakHour.hour - 12}pm`;
      recommendations.push({
        type: 'timing',
        title: `Your peak study time is around ${timeLabel}`,
        description: `You perform ${peakHour.avgAccuracy}% accurately during this time. Try to schedule important study sessions then.`,
        priority: 'low'
      });
    }

    if (strengths.length > 0) {
      recommendations.push({
        type: 'challenge',
        title: `Challenge yourself in ${strengths[0].topic}`,
        description: `You're doing great at ${strengths[0].accuracy}%! Try harder questions to push your limits.`,
        priority: 'low'
      });
    }

    if (totalCardReviews < 20 && totalCards > 0) {
      recommendations.push({
        type: 'flashcards',
        title: 'Review more flashcards',
        description: `You have ${totalCards} flashcards. Regular spaced repetition helps cement knowledge.`,
        priority: 'medium'
      });
    }

    return {
      overview: {
        totalStudyTime: Math.round(totalStudyTime / 60), // in minutes
        totalSessions: allAttempts.length,
        currentStreak,
        longestStreak,
        cardsReviewed: totalCardReviews,
        quizzesTaken: allAttempts.length,
        overallAccuracy
      },
      accuracyTrends,
      topicPerformance: topicPerformance.slice(0, 10),
      studyPatterns,
      weakAreas,
      strengths,
      recommendations,
      weeklyProgress
    };
    } catch (error) {
      console.error('[Learning Insights] Error calculating insights:', error);
      return {
        overview: {
          totalStudyTime: 0,
          totalSessions: 0,
          currentStreak: 0,
          longestStreak: 0,
          cardsReviewed: 0,
          quizzesTaken: 0,
          overallAccuracy: 0
        },
        accuracyTrends: [],
        topicPerformance: [],
        studyPatterns: [],
        weakAreas: [],
        strengths: [],
        recommendations: [],
        weeklyProgress: []
      };
    }
  }

  // ==================== USER PREFERENCES ====================

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async updateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const [updated] = await db
      .update(userPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    
    if (updated) {
      return updated;
    }

    // If preferences don't exist yet, create them with defaults
    const [created] = await db
      .insert(userPreferences)
      .values({
        userId,
        ...preferences
      })
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
