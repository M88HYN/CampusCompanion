import {
  type User, type InsertUser,
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
  users, notes, noteBlocks, decks, cards, cardReviews,
  quizzes, quizQuestions, quizOptions, quizAttempts, quizResponses, userQuestionStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, sql, or, lte, asc, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export class DatabaseStorage implements IStorage {
  // ==================== USERS ====================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
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
    const [created] = await db.insert(notes).values(note).returning();
    return created;
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const [updated] = await db
      .update(notes)
      .set({ ...note, updatedAt: new Date() })
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
    return await db.insert(noteBlocks).values(blocks).returning();
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
    const [created] = await db.insert(decks).values(deck).returning();
    return created;
  }

  async updateDeck(id: string, deck: Partial<InsertDeck>): Promise<Deck | undefined> {
    const [updated] = await db
      .update(decks)
      .set(deck)
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
    const [created] = await db.insert(cards).values(card).returning();
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
        lastReviewedAt: new Date(),
      })
      .where(eq(cards.id, cardId))
      .returning();

    // Record review history
    await db.insert(cardReviews).values({
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
    return await db.select().from(quizzes).where(eq(quizzes.userId, userId)).orderBy(desc(quizzes.createdAt));
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [created] = await db.insert(quizzes).values(quiz).returning();
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
    const [created] = await db.insert(quizQuestions).values(question).returning();
    return created;
  }

  async getQuizOptions(questionId: string): Promise<QuizOption[]> {
    return await db.select().from(quizOptions).where(eq(quizOptions.questionId, questionId)).orderBy(quizOptions.order);
  }

  async createQuizOption(option: InsertQuizOption): Promise<QuizOption> {
    const [created] = await db.insert(quizOptions).values(option).returning();
    return created;
  }

  // ==================== QUIZ ATTEMPTS ====================

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [created] = await db.insert(quizAttempts).values(attempt).returning();
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
        completedAt: new Date(),
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
    const [created] = await db.insert(quizResponses).values(response).returning();
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
    const averageScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts;
    const averageTimeSpent = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / totalAttempts;

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
      
      const [updated] = await db
        .update(userQuestionStats)
        .set({
          timesAnswered: newTimesAnswered,
          timesCorrect: newTimesCorrect,
          streak: newStreak,
          averageResponseTime: newAvgTime,
          lastAnsweredAt: new Date(),
        })
        .where(eq(userQuestionStats.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userQuestionStats)
        .values({
          userId,
          questionId,
          timesAnswered: 1,
          timesCorrect: isCorrect ? 1 : 0,
          averageResponseTime: responseTime,
          lastAnsweredAt: new Date(),
          streak: isCorrect ? 1 : 0,
          nextReviewAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  async getDueQuestionsForReview(userId: string, limit: number = 20): Promise<UserQuestionStats[]> {
    return await db
      .select()
      .from(userQuestionStats)
      .where(
        and(
          eq(userQuestionStats.userId, userId),
          or(
            lte(userQuestionStats.nextReviewAt, new Date()),
            sql`${userQuestionStats.nextReviewAt} IS NULL`
          )
        )
      )
      .orderBy(asc(userQuestionStats.nextReviewAt))
      .limit(limit);
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
    
    return questions.filter(q => !excludeIds.includes(q.id));
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

  async getUserAnalytics(userId: string): Promise<{
    totalQuizzesTaken: number;
    totalQuestionsAnswered: number;
    overallAccuracy: number;
    averageTimePerQuestion: number;
    strengthsByTopic: Record<string, number>;
    weaknessesByTopic: Record<string, number>;
    recentActivity: { date: string; score: number }[];
  }> {
    // Get all user's quiz attempts
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), sql`${quizAttempts.completedAt} IS NOT NULL`))
      .orderBy(desc(quizAttempts.completedAt));

    if (attempts.length === 0) {
      return {
        totalQuizzesTaken: 0,
        totalQuestionsAnswered: 0,
        overallAccuracy: 0,
        averageTimePerQuestion: 0,
        strengthsByTopic: {},
        weaknessesByTopic: {},
        recentActivity: [],
      };
    }

    // Get all responses for these attempts
    let totalCorrect = 0;
    let totalQuestions = 0;
    let totalTime = 0;
    const topicAccuracy: Record<string, { correct: number; total: number }> = {};

    for (const attempt of attempts) {
      const responses = await this.getQuizResponses(attempt.id);
      
      for (const response of responses) {
        totalQuestions++;
        if (response.isCorrect) totalCorrect++;
        totalTime += response.responseTime || 0;

        // Get question for topic analysis
        const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, response.questionId));
        if (question?.tags) {
          for (const tag of question.tags) {
            if (!topicAccuracy[tag]) {
              topicAccuracy[tag] = { correct: 0, total: 0 };
            }
            topicAccuracy[tag].total++;
            if (response.isCorrect) topicAccuracy[tag].correct++;
          }
        }
      }
    }

    // Calculate strengths and weaknesses
    const strengthsByTopic: Record<string, number> = {};
    const weaknessesByTopic: Record<string, number> = {};

    for (const [topic, stats] of Object.entries(topicAccuracy)) {
      const accuracy = Math.round((stats.correct / stats.total) * 100);
      if (accuracy >= 70) {
        strengthsByTopic[topic] = accuracy;
      } else {
        weaknessesByTopic[topic] = accuracy;
      }
    }

    // Recent activity (last 10 attempts)
    const recentActivity = attempts.slice(0, 10).map(a => ({
      date: a.completedAt?.toISOString().split('T')[0] || '',
      score: a.score || 0,
    }));

    return {
      totalQuizzesTaken: attempts.length,
      totalQuestionsAnswered: totalQuestions,
      overallAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      averageTimePerQuestion: totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
      strengthsByTopic,
      weaknessesByTopic,
      recentActivity,
    };
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
    let cardsWithReviews = 0;

    for (const deck of userDecks) {
      const deckCards = await this.getCards(deck.id);
      for (const card of deckCards) {
        totalCards++;
        if (card.status === 'mastered') masteredCards++;
        if (card.repetitions && card.repetitions > 0) cardsWithReviews++;
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
      
      const completedDate = attempt.completedAt;
      if (completedDate) {
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
      const isRecent = attempt.completedAt && (new Date().getTime() - attempt.completedAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
      
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

    // Calculate streak from actual study dates
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

    // Generate accuracy trends from actual daily response data
    const accuracyTrends: { date: string; quizAccuracy: number; flashcardAccuracy: number }[] = [];
    const flashcardMasteryRate = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const stats = dailyQuizAccuracy[dateKey];
      accuracyTrends.push({
        date: dateKey,
        quizAccuracy: stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        flashcardAccuracy: flashcardMasteryRate // Use mastery rate as proxy (accurate from card status)
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

    if (cardsWithReviews < 20 && totalCards > 0) {
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
        cardsReviewed: cardsWithReviews,
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
  }
}

export const storage = new DatabaseStorage();
