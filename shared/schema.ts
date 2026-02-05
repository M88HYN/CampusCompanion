import { sql } from "drizzle-orm";
import { pgTable, text as pgText, varchar, integer as pgInteger, timestamp, boolean, real, index as pgIndex, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { conversations } from "./models/chat";

// Import and re-export auth models (users, sessions tables and types)
import { users, sessions, type User, type UpsertUser } from "./models/auth";
export { users, sessions, type User, type UpsertUser };

// ==================== NOTES ====================

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  id: pgText("id").primaryKey(),
  userId: pgText("user_id").notNull(),
  title: pgText("title").notNull(),
  subject: pgText("subject"),
  tags: pgText("tags"), // JSON string if needed
  createdAt: pgInteger("created_at").notNull(),
  updatedAt: pgInteger("updated_at").notNull(),
}, (table) => ({
  notesUserIdIdx: index("notes_user_id_idx").on(table.userId),
  notesSubjectIdx: index("notes_subject_idx").on(table.subject),
}));

// Smart note types for learning categorization
export const noteTypeEnum = ["concept", "definition", "process", "example", "exam_tip", "general"] as const;
export type NoteType = typeof noteTypeEnum[number];

export const noteBlocks = pgTable("note_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").notNull(),
  type: pgText("type").notNull(), // "paragraph", "heading", "code", "list", "markdown"
  content: pgText("content").notNull(),
  order: pgInteger("order").notNull(),
  // Smart learning type
  noteType: pgText("note_type").default("general"), // "concept", "definition", "process", "example", "exam_tip", "general"
  // Exam prompt annotations
  isExamContent: boolean("is_exam_content").default(false),
  examPrompt: pgText("exam_prompt"), // "SAQ", "MCQ", "Essay", etc.
  examMarks: pgInteger("exam_marks"), // Number of marks for this content
  // Key terms for recall mode (comma-separated)
  keyTerms: pgText("key_terms"),
}, (table) => [
  pgIndex("note_blocks_note_id_idx").on(table.noteId),
  pgIndex("note_blocks_note_type_idx").on(table.noteType),
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
  title: pgText("title").notNull(),
  subject: pgText("subject"),
  description: pgText("description"),
  tags: pgText("tags").array(),
  difficulty: pgText("difficulty").default("medium"), // "easy", "medium", "hard"
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  pgIndex("decks_user_id_idx").on(table.userId),
  pgIndex("decks_subject_idx").on(table.subject),
]);

export const cards = pgTable("cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deckId: varchar("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
  type: pgText("type").notNull().default("basic"), // "basic", "cloze", "image", "definition"
  front: pgText("front").notNull(),
  back: pgText("back").notNull(),
  imageUrl: pgText("image_url"), // for image-based cards
  clozeText: pgText("cloze_text"), // for cloze deletion cards (text with {{blanks}})
  definition: pgText("definition"), // for definition-example cards
  example: pgText("example"), // for definition-example cards
  tags: pgText("tags").array(),
  // Spaced Repetition fields (SM-2 algorithm)
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: pgInteger("interval").notNull().default(0), // days
  repetitions: pgInteger("repetitions").notNull().default(0),
  dueAt: timestamp("due_at").notNull().defaultNow(),
  status: pgText("status").notNull().default("new"), // "new", "learning", "reviewing", "mastered"
  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Integration fields
  sourceQuestionId: varchar("source_question_id"), // if created from quiz question
  sourceNoteBlockId: varchar("source_note_block_id"), // if created from note
}, (table) => [
  pgIndex("cards_deck_id_idx").on(table.deckId),
  pgIndex("cards_due_at_idx").on(table.dueAt),
  pgIndex("cards_status_idx").on(table.status),
]);

export const cardReviews = pgTable("card_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardId: varchar("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quality: pgInteger("quality").notNull(), // 0-5 SM-2 quality rating
  intervalBefore: pgInteger("interval_before").notNull(),
  intervalAfter: pgInteger("interval_after").notNull(),
  easeFactorBefore: real("ease_factor_before").notNull(),
  easeFactorAfter: real("ease_factor_after").notNull(),
  reviewedAt: timestamp("reviewed_at").notNull().defaultNow(),
}, (table) => [
  pgIndex("card_reviews_card_id_idx").on(table.cardId),
  pgIndex("card_reviews_user_id_idx").on(table.userId),
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
  title: pgText("title").notNull(),
  subject: pgText("subject"),
  description: pgText("description"),
  mode: pgText("mode").notNull().default("practice"), // "practice", "exam", "adaptive"
  timeLimit: pgInteger("time_limit"), // minutes, null for practice mode
  passingScore: pgInteger("passing_score"), // percentage
  isPublished: boolean("is_published").notNull().default(false),
  isAdaptive: boolean("is_adaptive").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  pgIndex("quizzes_user_id_idx").on(table.userId),
  pgIndex("quizzes_subject_idx").on(table.subject),
]);

export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  type: pgText("type").notNull(), // "mcq", "saq", "laq"
  question: pgText("question").notNull(),
  difficulty: pgInteger("difficulty").notNull().default(3), // 1-5 stars
  marks: pgInteger("marks").notNull().default(1),
  explanation: pgText("explanation"),
  markScheme: pgText("mark_scheme"),
  order: pgInteger("order").notNull(),
  tags: pgText("tags").array(), // topic tags for categorization
  estimatedTime: pgInteger("estimated_time"), // seconds
  // For SAQ/LAQ
  correctAnswer: pgText("correct_answer"),
  // Integration
  sourceNoteBlockId: varchar("source_note_block_id"),
}, (table) => [
  pgIndex("quiz_questions_quiz_id_idx").on(table.quizId),
  pgIndex("quiz_questions_difficulty_idx").on(table.difficulty),
]);

export const quizOptions = pgTable("quiz_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  text: pgText("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  order: pgInteger("order").notNull(),
}, (table) => [
  pgIndex("quiz_options_question_id_idx").on(table.questionId),
]);

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mode: pgText("mode").notNull(), // "practice", "exam", "adaptive", "spaced"
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  score: pgInteger("score"), // percentage
  totalMarks: pgInteger("total_marks"),
  earnedMarks: pgInteger("earned_marks"),
  timeSpent: pgInteger("time_spent"), // seconds
  currentQuestionIndex: pgInteger("current_question_index").default(0),
  currentDifficulty: pgInteger("current_difficulty").default(3), // for adaptive mode
  difficultyPath: pgText("difficulty_path"), // JSON array of difficulty changes
  status: pgText("status").notNull().default("in_progress"), // "in_progress", "completed", "abandoned"
}, (table) => [
  pgIndex("quiz_attempts_quiz_id_idx").on(table.quizId),
  pgIndex("quiz_attempts_user_id_idx").on(table.userId),
  pgIndex("quiz_attempts_status_idx").on(table.status),
]);

export const quizResponses = pgTable("quiz_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  // For MCQ
  selectedOptionId: varchar("selected_option_id"),
  // For SAQ/LAQ
  textAnswer: pgText("text_answer"),
  isCorrect: boolean("is_correct"),
  marksAwarded: pgInteger("marks_awarded"),
  feedback: pgText("feedback"),
  responseTime: pgInteger("response_time"), // seconds to answer
  confidenceLevel: pgInteger("confidence_level"), // 1-5 user confidence rating
  convertedToFlashcard: boolean("converted_to_flashcard").notNull().default(false),
  flashcardId: varchar("flashcard_id"),
  answeredAt: timestamp("answered_at").notNull().defaultNow(),
}, (table) => [
  pgIndex("quiz_responses_attempt_id_idx").on(table.attemptId),
  pgIndex("quiz_responses_question_id_idx").on(table.questionId),
]);

// User question stats for adaptive engine and spaced repetition
export const userQuestionStats = pgTable("user_question_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  timesAnswered: pgInteger("times_answered").notNull().default(0),
  timesCorrect: pgInteger("times_correct").notNull().default(0),
  averageResponseTime: real("average_response_time"), // seconds
  lastAnsweredAt: timestamp("last_answered_at"),
  streak: pgInteger("streak").notNull().default(0), // consecutive correct answers
  // Spaced repetition fields (SM-2 algorithm)
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: pgInteger("interval").notNull().default(0), // days
  repetitions: pgInteger("repetitions").notNull().default(0),
  nextReviewAt: timestamp("next_review_at"),
  status: pgText("status").notNull().default("new"), // "new", "learning", "reviewing", "mastered"
}, (table) => [
  pgIndex("user_question_stats_user_id_idx").on(table.userId),
  pgIndex("user_question_stats_question_id_idx").on(table.questionId),
  pgIndex("user_question_stats_next_review_idx").on(table.nextReviewAt),
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

// ==================== GAMIFICATION: ACHIEVEMENTS & BADGES ====================

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: pgText("name").notNull().unique(),
  description: pgText("description").notNull(),
  icon: pgText("icon").notNull(), // icon name or emoji
  category: pgText("category").notNull(), // "streak", "mastery", "exploration", "social", "milestone"
  requirement: pgText("requirement").notNull(), // JSON describing unlock condition
  points: pgInteger("points").notNull().default(10),
  rarity: pgText("rarity").notNull().default("common"), // "common", "rare", "epic", "legendary"
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  pgIndex("achievements_category_idx").on(table.category),
]);

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  progress: pgInteger("progress").default(0), // for progressive achievements
  isNotified: boolean("is_notified").notNull().default(false),
}, (table) => [
  pgIndex("user_achievements_user_id_idx").on(table.userId),
  pgIndex("user_achievements_achievement_id_idx").on(table.achievementId),
]);

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// ==================== PROGRESS & ANALYTICS ====================

export const studyStreaks = pgTable("study_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStreak: pgInteger("current_streak").notNull().default(0),
  longestStreak: pgInteger("longest_streak").notNull().default(0),
  lastStudyDate: timestamp("last_study_date"),
  totalStudyDays: pgInteger("total_study_days").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  pgIndex("study_streaks_user_id_idx").on(table.userId),
]);

export const studySessions = pgTable("study_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionType: pgText("session_type").notNull(), // "flashcards", "quiz", "notes", "research", "pomodoro"
  resourceId: varchar("resource_id"), // deck_id, quiz_id, note_id, conversation_id
  durationMinutes: pgInteger("duration_minutes").notNull(),
  itemsReviewed: pgInteger("items_reviewed").default(0),
  correctAnswers: pgInteger("correct_answers").default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
}, (table) => [
  pgIndex("study_sessions_user_id_idx").on(table.userId),
  pgIndex("study_sessions_session_type_idx").on(table.sessionType),
  pgIndex("study_sessions_started_at_idx").on(table.startedAt),
]);

export const learningGoals = pgTable("learning_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: pgText("title").notNull(),
  description: pgText("description"),
  targetType: pgText("target_type").notNull(), // "flashcards", "quizzes", "study_time", "streak"
  targetValue: pgInteger("target_value").notNull(),
  currentValue: pgInteger("current_value").notNull().default(0),
  deadline: timestamp("deadline"),
  status: pgText("status").notNull().default("active"), // "active", "completed", "abandoned"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  pgIndex("learning_goals_user_id_idx").on(table.userId),
  pgIndex("learning_goals_status_idx").on(table.status),
]);

export const insertStudyStreakSchema = createInsertSchema(studyStreaks).omit({
  id: true,
  currentStreak: true,
  longestStreak: true,
  totalStudyDays: true,
  updatedAt: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  startedAt: true,
});

export const insertLearningGoalSchema = createInsertSchema(learningGoals).omit({
  id: true,
  currentValue: true,
  status: true,
  createdAt: true,
  completedAt: true,
});

export type StudyStreak = typeof studyStreaks.$inferSelect;
export type InsertStudyStreak = z.infer<typeof insertStudyStreakSchema>;
export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type LearningGoal = typeof learningGoals.$inferSelect;
export type InsertLearningGoal = z.infer<typeof insertLearningGoalSchema>;

// ==================== INSIGHT SCOUT: SAVED RESOURCES ====================

export const savedResources = pgTable("saved_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  conversationId: pgInteger("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  title: pgText("title").notNull(),
  url: pgText("url"),
  content: pgText("content"),
  resourceType: pgText("resource_type").notNull(), // "article", "video", "paper", "website", "note"
  tags: pgText("tags").array(),
  isFavorite: boolean("is_favorite").notNull().default(false),
  linkedDeckId: varchar("linked_deck_id").references(() => decks.id, { onDelete: "set null" }),
  linkedQuizId: varchar("linked_quiz_id").references(() => quizzes.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  pgIndex("saved_resources_user_id_idx").on(table.userId),
  pgIndex("saved_resources_conversation_id_idx").on(table.conversationId),
  pgIndex("saved_resources_resource_type_idx").on(table.resourceType),
]);

export const searchHistory = pgTable("search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  query: pgText("query").notNull(),
  searchType: pgText("search_type").notNull(), // "research", "notes", "flashcards", "quizzes"
  resultCount: pgInteger("result_count"),
  searchedAt: timestamp("searched_at").notNull().defaultNow(),
}, (table) => [
  pgIndex("search_history_user_id_idx").on(table.userId),
  pgIndex("search_history_searched_at_idx").on(table.searchedAt),
]);

export const insertSavedResourceSchema = createInsertSchema(savedResources).omit({
  id: true,
  createdAt: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  searchedAt: true,
});

export type SavedResource = typeof savedResources.$inferSelect;
export type InsertSavedResource = z.infer<typeof insertSavedResourceSchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;

// ==================== USER PREFERENCES ====================

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  // Account settings
  phone: varchar("phone"),
  bio: pgText("bio"),
  language: varchar("language").notNull().default("en"),
  timezone: varchar("timezone").notNull().default("america/new_york"),
  // Privacy settings
  profileVisibility: boolean("profile_visibility").notNull().default(true),
  showStudyActivity: boolean("show_study_activity").notNull().default(true),
  shareQuizResults: boolean("share_quiz_results").notNull().default(true),
  // Notification settings
  quizReminders: boolean("quiz_reminders").notNull().default(true),
  flashcardReminders: boolean("flashcard_reminders").notNull().default(true),
  weeklyDigest: boolean("weekly_digest").notNull().default(true),
  newFeatures: boolean("new_features").notNull().default(false),
  marketing: boolean("marketing").notNull().default(false),
  // Insight Scout settings
  aiModel: varchar("ai_model").notNull().default("gpt-4"),
  searchDepth: varchar("search_depth").notNull().default("comprehensive"),
  citationFormat: varchar("citation_format").notNull().default("apa"),
  responseTone: varchar("response_tone").notNull().default("academic"),
  includeExamples: boolean("include_examples").notNull().default(true),
  includeSources: boolean("include_sources").notNull().default(true),
  maxResults: varchar("max_results").notNull().default("10"),
  queryHistory: boolean("query_history").notNull().default(true),
  autoSave: boolean("auto_save").notNull().default(true),
  researchSummary: boolean("research_summary").notNull().default(true),
  webSearch: boolean("web_search").notNull().default(true),
  academicDatabases: boolean("academic_databases").notNull().default(true),
  enhancedAnalysis: boolean("enhanced_analysis").notNull().default(true),
  multiLanguageSupport: boolean("multi_language_support").notNull().default(false),
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  pgIndex("user_preferences_user_id_idx").on(table.userId),
]);

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// Re-export chat models
export * from "./models/chat";
