import {
  type User, type InsertUser,
  type Note, type InsertNote,
  type NoteBlock, type InsertNoteBlock,
  type Deck, type InsertDeck,
  type Card, type InsertCard,
  type Quiz, type InsertQuiz,
  type QuizQuestion, type InsertQuizQuestion,
  type QuizOption, type InsertQuizOption,
  type QuizAttempt, type InsertQuizAttempt,
  type QuizResponse, type InsertQuizResponse,
  users, notes, noteBlocks, decks, cards,
  quizzes, quizQuestions, quizOptions, quizAttempts, quizResponses
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, sql } from "drizzle-orm";

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

  // Flashcards
  getDecks(userId: string): Promise<Deck[]>;
  getDeck(id: string): Promise<Deck | undefined>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  deleteDeck(id: string): Promise<void>;
  getCards(deckId: string): Promise<Card[]>;
  getCard(id: string): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: string, card: Partial<Card>): Promise<Card | undefined>;
  deleteCard(id: string): Promise<void>;
  getDueCards(userId: string): Promise<Card[]>;
  reviewCard(cardId: string, quality: number): Promise<Card>;

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

  async reviewCard(cardId: string, quality: number): Promise<Card> {
    // SM-2 Algorithm implementation
    const card = await this.getCard(cardId);
    if (!card) throw new Error("Card not found");

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

    return updated;
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
}

export const storage = new DatabaseStorage();
