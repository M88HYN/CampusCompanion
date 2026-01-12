import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // "student", "instructor"
  displayName: text("display_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  displayName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ==================== NOTES ====================

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const noteBlocks = pgTable("note_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").notNull(),
  type: text("type").notNull(), // "paragraph", "heading", "code", "list"
  content: text("content").notNull(),
  order: integer("order").notNull(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteBlockSchema = createInsertSchema(noteBlocks).omit({
  id: true,
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type NoteBlock = typeof noteBlocks.$inferSelect;
export type InsertNoteBlock = z.infer<typeof insertNoteBlockSchema>;

// ==================== FLASHCARDS ====================

export const decks = pgTable("decks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cards = pgTable("cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deckId: varchar("deck_id").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  // Spaced Repetition fields (SM-2 algorithm)
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0), // days
  repetitions: integer("repetitions").notNull().default(0),
  dueAt: timestamp("due_at").notNull().defaultNow(),
  status: text("status").notNull().default("new"), // "new", "learning", "reviewing", "mastered"
  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Integration fields
  sourceQuestionId: varchar("source_question_id"), // if created from quiz question
  sourceNoteBlockId: varchar("source_note_block_id"), // if created from note
});

export const insertDeckSchema = createInsertSchema(decks).omit({
  id: true,
  createdAt: true,
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true,
  easeFactor: true,
  interval: true,
  repetitions: true,
  dueAt: true,
  status: true,
});

export type Deck = typeof decks.$inferSelect;
export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;

// ==================== QUIZZES ====================

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject"),
  description: text("description"),
  mode: text("mode").notNull().default("practice"), // "practice", "exam", "adaptive"
  timeLimit: integer("time_limit"), // minutes, null for practice mode
  passingScore: integer("passing_score"), // percentage
  isPublished: boolean("is_published").notNull().default(false),
  isAdaptive: boolean("is_adaptive").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull(),
  type: text("type").notNull(), // "mcq", "saq", "laq"
  question: text("question").notNull(),
  difficulty: integer("difficulty").notNull().default(3), // 1-5 stars
  marks: integer("marks").notNull().default(1),
  explanation: text("explanation"),
  markScheme: text("mark_scheme"),
  order: integer("order").notNull(),
  tags: text("tags").array(), // topic tags for categorization
  estimatedTime: integer("estimated_time"), // seconds
  // For SAQ/LAQ
  correctAnswer: text("correct_answer"),
  // Integration
  sourceNoteBlockId: varchar("source_note_block_id"),
});

export const quizOptions = pgTable("quiz_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  order: integer("order").notNull(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull(),
  userId: varchar("user_id").notNull(),
  mode: text("mode").notNull(), // "practice", "exam", "adaptive", "spaced"
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  score: integer("score"), // percentage
  totalMarks: integer("total_marks"),
  earnedMarks: integer("earned_marks"),
  timeSpent: integer("time_spent"), // seconds
  currentQuestionIndex: integer("current_question_index").default(0),
  currentDifficulty: integer("current_difficulty").default(3), // for adaptive mode
  difficultyPath: text("difficulty_path"), // JSON array of difficulty changes
  status: text("status").notNull().default("in_progress"), // "in_progress", "completed", "abandoned"
});

export const quizResponses = pgTable("quiz_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull(),
  questionId: varchar("question_id").notNull(),
  // For MCQ
  selectedOptionId: varchar("selected_option_id"),
  // For SAQ/LAQ
  textAnswer: text("text_answer"),
  isCorrect: boolean("is_correct"),
  marksAwarded: integer("marks_awarded"),
  feedback: text("feedback"),
  responseTime: integer("response_time"), // seconds to answer
  confidenceLevel: integer("confidence_level"), // 1-5 user confidence rating
  convertedToFlashcard: boolean("converted_to_flashcard").notNull().default(false),
  flashcardId: varchar("flashcard_id"),
  answeredAt: timestamp("answered_at").notNull().defaultNow(),
});

// User question stats for adaptive engine and spaced repetition
export const userQuestionStats = pgTable("user_question_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  questionId: varchar("question_id").notNull(),
  timesAnswered: integer("times_answered").notNull().default(0),
  timesCorrect: integer("times_correct").notNull().default(0),
  averageResponseTime: real("average_response_time"), // seconds
  lastAnsweredAt: timestamp("last_answered_at"),
  streak: integer("streak").notNull().default(0), // consecutive correct answers
  // Spaced repetition fields (SM-2 algorithm)
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0), // days
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewAt: timestamp("next_review_at"),
  status: text("status").notNull().default("new"), // "new", "learning", "reviewing", "mastered"
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

export const insertQuizOptionSchema = createInsertSchema(quizOptions).omit({
  id: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  startedAt: true,
});

export const insertQuizResponseSchema = createInsertSchema(quizResponses).omit({
  id: true,
  answeredAt: true,
  convertedToFlashcard: true,
});

export const insertUserQuestionStatsSchema = createInsertSchema(userQuestionStats).omit({
  id: true,
  timesAnswered: true,
  timesCorrect: true,
  streak: true,
  easeFactor: true,
  interval: true,
  repetitions: true,
  status: true,
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizOption = typeof quizOptions.$inferSelect;
export type InsertQuizOption = z.infer<typeof insertQuizOptionSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = z.infer<typeof insertQuizResponseSchema>;
export type UserQuestionStats = typeof userQuestionStats.$inferSelect;
export type InsertUserQuestionStats = z.infer<typeof insertUserQuestionStatsSchema>;
