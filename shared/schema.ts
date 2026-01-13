import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real, index } from "drizzle-orm/pg-core";
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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("notes_user_id_idx").on(table.userId),
  index("notes_subject_idx").on(table.subject),
]);

export const noteBlocks = pgTable("note_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "paragraph", "heading", "code", "list"
  content: text("content").notNull(),
  order: integer("order").notNull(),
}, (table) => [
  index("note_blocks_note_id_idx").on(table.noteId),
]);

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
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject"),
  description: text("description"),
  tags: text("tags").array(),
  difficulty: text("difficulty").default("medium"), // "easy", "medium", "hard"
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("decks_user_id_idx").on(table.userId),
  index("decks_subject_idx").on(table.subject),
]);

export const cards = pgTable("cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deckId: varchar("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("basic"), // "basic", "cloze", "image", "definition"
  front: text("front").notNull(),
  back: text("back").notNull(),
  imageUrl: text("image_url"), // for image-based cards
  clozeText: text("cloze_text"), // for cloze deletion cards (text with {{blanks}})
  definition: text("definition"), // for definition-example cards
  example: text("example"), // for definition-example cards
  tags: text("tags").array(),
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
}, (table) => [
  index("cards_deck_id_idx").on(table.deckId),
  index("cards_due_at_idx").on(table.dueAt),
  index("cards_status_idx").on(table.status),
]);

export const cardReviews = pgTable("card_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardId: varchar("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quality: integer("quality").notNull(), // 0-5 SM-2 quality rating
  intervalBefore: integer("interval_before").notNull(),
  intervalAfter: integer("interval_after").notNull(),
  easeFactorBefore: real("ease_factor_before").notNull(),
  easeFactorAfter: real("ease_factor_after").notNull(),
  reviewedAt: timestamp("reviewed_at").notNull().defaultNow(),
}, (table) => [
  index("card_reviews_card_id_idx").on(table.cardId),
  index("card_reviews_user_id_idx").on(table.userId),
]);

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
  lastReviewedAt: true,
});

export const insertCardReviewSchema = createInsertSchema(cardReviews).omit({
  id: true,
  reviewedAt: true,
});

export type Deck = typeof decks.$inferSelect;
export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type CardReview = typeof cardReviews.$inferSelect;
export type InsertCardReview = z.infer<typeof insertCardReviewSchema>;

// ==================== QUIZZES ====================

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject"),
  description: text("description"),
  mode: text("mode").notNull().default("practice"), // "practice", "exam", "adaptive"
  timeLimit: integer("time_limit"), // minutes, null for practice mode
  passingScore: integer("passing_score"), // percentage
  isPublished: boolean("is_published").notNull().default(false),
  isAdaptive: boolean("is_adaptive").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("quizzes_user_id_idx").on(table.userId),
  index("quizzes_subject_idx").on(table.subject),
]);

export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
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
}, (table) => [
  index("quiz_questions_quiz_id_idx").on(table.quizId),
  index("quiz_questions_difficulty_idx").on(table.difficulty),
]);

export const quizOptions = pgTable("quiz_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  order: integer("order").notNull(),
}, (table) => [
  index("quiz_options_question_id_idx").on(table.questionId),
]);

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
}, (table) => [
  index("quiz_attempts_quiz_id_idx").on(table.quizId),
  index("quiz_attempts_user_id_idx").on(table.userId),
  index("quiz_attempts_status_idx").on(table.status),
]);

export const quizResponses = pgTable("quiz_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
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
}, (table) => [
  index("quiz_responses_attempt_id_idx").on(table.attemptId),
  index("quiz_responses_question_id_idx").on(table.questionId),
]);

// User question stats for adaptive engine and spaced repetition
export const userQuestionStats = pgTable("user_question_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
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
}, (table) => [
  index("user_question_stats_user_id_idx").on(table.userId),
  index("user_question_stats_question_id_idx").on(table.questionId),
  index("user_question_stats_next_review_idx").on(table.nextReviewAt),
]);

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

// Re-export chat models
export * from "./models/chat";
