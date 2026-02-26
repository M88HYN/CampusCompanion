import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import and re-export auth models (users, sessions tables and types)
import { users, sessions, type User, type UpsertUser } from "./models/auth";
export { users, sessions, type User, type UpsertUser };

// ==================== NOTES ====================

import { sqliteTable, text, integer, index, real } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject"),
  tags: text("tags"), // JSON string if needed
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => ({
  userIdIdx: index("notes_user_id_idx").on(table.userId),
  subjectIdx: index("notes_subject_idx").on(table.subject),
}));

// Smart note types for learning categorization
export const noteTypeEnum = ["concept", "definition", "process", "example", "exam_tip", "general"] as const;
export type NoteType = typeof noteTypeEnum[number];

export const noteBlocks = sqliteTable("note_blocks", {
  id: text("id").primaryKey(),
  noteId: text("note_id").notNull(),
  type: text("type").notNull(), // "paragraph", "heading", "code", "list", "markdown"
  content: text("content").notNull(),
  order: integer("order").notNull(),
  // Smart learning type
  noteType: text("note_type").default("general"), // "concept", "definition", "process", "example", "exam_tip", "general"
  // Exam prompt annotations
  isExamContent: integer("is_exam_content", { mode: "boolean" }).default(false),
  examPrompt: text("exam_prompt"), // "SAQ", "MCQ", "Essay", etc.
  examMarks: integer("exam_marks"), // Number of marks for this content
  // Key terms for recall mode (comma-separated)
  keyTerms: text("key_terms"),
}, (table) => ({
  noteIdIdx: index("note_blocks_note_id_idx").on(table.noteId),
  noteTypeIdx: index("note_blocks_note_type_idx").on(table.noteType),
}));

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

// ==================== INSIGHT SCOUT: CONVERSATIONS ====================

export const researchConversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("New Conversation"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => ({
  userIdIdx: index("research_conversations_user_id_idx").on(table.userId),
  updatedAtIdx: index("research_conversations_updated_at_idx").on(table.updatedAt),
}));

export const researchMessages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => ({
  conversationIdIdx: index("research_messages_conversation_id_idx").on(table.conversationId),
  createdAtIdx: index("research_messages_created_at_idx").on(table.createdAt),
}));

export const insertResearchConversationSchema = createInsertSchema(researchConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResearchMessageSchema = createInsertSchema(researchMessages).omit({
  id: true,
  createdAt: true,
});

export type ResearchConversation = typeof researchConversations.$inferSelect;
export type InsertResearchConversation = z.infer<typeof insertResearchConversationSchema>;
export type ResearchMessage = typeof researchMessages.$inferSelect;
export type InsertResearchMessage = z.infer<typeof insertResearchMessageSchema>;

// ==================== FLASHCARDS ====================

export const decks = sqliteTable("decks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject"),
  description: text("description"),
  tags: text("tags"), // JSON string array
  difficulty: text("difficulty").default("medium"), // "easy", "medium", "hard"
  createdAt: integer("created_at").notNull(),
}, (table) => ({
  userIdIdx: index("decks_user_id_idx").on(table.userId),
  subjectIdx: index("decks_subject_idx").on(table.subject),
}));

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  deckId: text("deck_id").notNull(),
  type: text("type").notNull().default("basic"), // "basic", "cloze", "image", "definition"
  front: text("front").notNull(),
  back: text("back").notNull(),
  imageUrl: text("image_url"),
  clozeText: text("cloze_text"),
  definition: text("definition"),
  example: text("example"),
  tags: text("tags"), // JSON string array
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0),
  repetitions: integer("repetitions").notNull().default(0),
  dueAt: integer("due_at").notNull(),
  status: text("status").notNull().default("new"),
  lastReviewedAt: integer("last_reviewed_at"),
  createdAt: integer("created_at").notNull(),
  sourceQuestionId: text("source_question_id"),
  sourceNoteBlockId: text("source_note_block_id"),
}, (table) => ({
  deckIdIdx: index("cards_deck_id_idx").on(table.deckId),
  dueAtIdx: index("cards_due_at_idx").on(table.dueAt),
  statusIdx: index("cards_status_idx").on(table.status),
}));

export const cardReviews = sqliteTable("card_reviews", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull(),
  userId: text("user_id").notNull(),
  quality: integer("quality").notNull(),
  intervalBefore: integer("interval_before").notNull(),
  intervalAfter: integer("interval_after").notNull(),
  easeFactorBefore: real("ease_factor_before").notNull(),
  easeFactorAfter: real("ease_factor_after").notNull(),
  reviewedAt: integer("reviewed_at").notNull(),
}, (table) => ({
  cardIdIdx: index("card_reviews_card_id_idx").on(table.cardId),
  userIdIdx: index("card_reviews_user_id_idx").on(table.userId),
}));

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

export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject"),
  description: text("description"),
  mode: text("mode").notNull().default("practice"), // "practice", "exam", "adaptive"
  timeLimit: integer("time_limit"), // minutes, null for practice mode
  passingScore: integer("passing_score"), // percentage
  isPublished: integer("is_published").notNull().default(0), // 0=false, 1=true
  isAdaptive: integer("is_adaptive").notNull().default(0), // 0=false, 1=true
  createdAt: integer("created_at").notNull(),
}, (table) => ({
  userIdIdx: index("quizzes_user_id_idx").on(table.userId),
  subjectIdx: index("quizzes_subject_idx").on(table.subject),
}));

export const quizQuestions = sqliteTable("quiz_questions", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull(),
  type: text("type").notNull(), // "mcq", "saq", "laq"
  question: text("question").notNull(),
  difficulty: integer("difficulty").notNull().default(3), // 1-5 stars
  marks: integer("marks").notNull().default(1),
  explanation: text("explanation"),
  markScheme: text("mark_scheme"),
  order: integer("order").notNull(),
  tags: text("tags"), // JSON string array
  estimatedTime: integer("estimated_time"), // seconds
  // For SAQ/LAQ
  correctAnswer: text("correct_answer"),
  // Integration
  sourceNoteBlockId: text("source_note_block_id"),
}, (table) => ({
  quizIdIdx: index("quiz_questions_quiz_id_idx").on(table.quizId),
  difficultyIdx: index("quiz_questions_difficulty_idx").on(table.difficulty),
}));

export const quizOptions = sqliteTable("quiz_options", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull(),
  text: text("text").notNull(),
  isCorrect: integer("is_correct").notNull().default(0), // 0=false, 1=true
  order: integer("order").notNull(),
}, (table) => ({
  questionIdIdx: index("quiz_options_question_id_idx").on(table.questionId),
}));

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id").notNull(),
  userId: text("user_id").notNull(),
  mode: text("mode").notNull(), // "practice", "exam", "adaptive", "spaced"
  startedAt: integer("started_at").notNull(),
  completedAt: integer("completed_at"),
  score: integer("score"), // percentage
  totalMarks: integer("total_marks"),
  earnedMarks: integer("earned_marks"),
  timeSpent: integer("time_spent"), // seconds
  currentQuestionIndex: integer("current_question_index").default(0),
  currentDifficulty: integer("current_difficulty").default(3), // for adaptive mode
  difficultyPath: text("difficulty_path"), // JSON array of difficulty changes
  status: text("status").notNull().default("in_progress"), // "in_progress", "completed", "abandoned"
}, (table) => ({
  quizIdIdx: index("quiz_attempts_quiz_id_idx").on(table.quizId),
  userIdIdx: index("quiz_attempts_user_id_idx").on(table.userId),
  statusIdx: index("quiz_attempts_status_idx").on(table.status),
}));

export const quizResponses = sqliteTable("quiz_responses", {
  id: text("id").primaryKey(),
  attemptId: text("attempt_id").notNull(),
  questionId: text("question_id").notNull(),
  // For MCQ
  selectedOptionId: text("selected_option_id"),
  // For SAQ/LAQ
  textAnswer: text("text_answer"),
  isCorrect: integer("is_correct"), // 0=false, 1=true, null=not graded
  marksAwarded: integer("marks_awarded"),
  feedback: text("feedback"),
  responseTime: integer("response_time"), // seconds to answer
  confidenceLevel: integer("confidence_level"), // 1-5 user confidence rating
  convertedToFlashcard: integer("converted_to_flashcard").notNull().default(0), // 0=false, 1=true
  flashcardId: text("flashcard_id"),
  answeredAt: integer("answered_at").notNull(),
}, (table) => ({
  attemptIdIdx: index("quiz_responses_attempt_id_idx").on(table.attemptId),
  questionIdIdx: index("quiz_responses_question_id_idx").on(table.questionId),
}));

// User question stats for adaptive engine and spaced repetition
export const userQuestionStats = sqliteTable("user_question_stats", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  timesAnswered: integer("times_answered").notNull().default(0),
  timesCorrect: integer("times_correct").notNull().default(0),
  averageResponseTime: real("average_response_time"), // seconds
  lastAnsweredAt: integer("last_answered_at"),
  streak: integer("streak").notNull().default(0), // consecutive correct answers
  // Spaced repetition fields (SM-2 algorithm)
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(0), // days
  repetitions: integer("repetitions").notNull().default(0),
  nextReviewAt: integer("next_review_at"),
  status: text("status").notNull().default("new"), // "new", "learning", "reviewing", "mastered"
}, (table) => ({
  userIdIdx: index("user_question_stats_user_id_idx").on(table.userId),
  questionIdIdx: index("user_question_stats_question_id_idx").on(table.questionId),
  nextReviewIdx: index("user_question_stats_next_review_idx").on(table.nextReviewAt),
}));

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

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // icon name or emoji
  category: text("category").notNull(), // "streak", "mastery", "exploration", "social", "milestone"
  requirement: text("requirement").notNull(), // JSON describing unlock condition
  points: integer("points").notNull().default(10),
  rarity: text("rarity").notNull().default("common"), // "common", "rare", "epic", "legendary"
  createdAt: integer("created_at").notNull(),
}, (table) => ({
  categoryIdx: index("achievements_category_idx").on(table.category),
}));

export const userAchievements = sqliteTable("user_achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: integer("unlocked_at").notNull(),
  progress: integer("progress").default(0), // for progressive achievements
  isNotified: integer("is_notified", { mode: "boolean" }).notNull().default(false),
}, (table) => ({
  userIdIdx: index("user_achievements_user_id_idx").on(table.userId),
  achievementIdIdx: index("user_achievements_achievement_id_idx").on(table.achievementId),
}));

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

export const studyStreaks = sqliteTable("study_streaks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: integer("last_study_date"),
  totalStudyDays: integer("total_study_days").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
}, (table) => ({
  userIdIdx: index("study_streaks_user_id_idx").on(table.userId),
}));

export const studySessions = sqliteTable("study_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(), // "flashcards", "quiz", "notes", "research", "pomodoro"
  resourceId: text("resource_id"), // deck_id, quiz_id, note_id, conversation_id
  durationMinutes: integer("duration_minutes").notNull(),
  itemsReviewed: integer("items_reviewed").default(0),
  correctAnswers: integer("correct_answers").default(0),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
}, (table) => ({
  userIdIdx: index("study_sessions_user_id_idx").on(table.userId),
  sessionTypeIdx: index("study_sessions_session_type_idx").on(table.sessionType),
  startedAtIdx: index("study_sessions_started_at_idx").on(table.startedAt),
}));

export const learningGoals = sqliteTable("learning_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  targetType: text("target_type").notNull(), // "flashcards", "quizzes", "study_time", "streak"
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").notNull().default(0),
  deadline: integer("deadline"),
  status: text("status").notNull().default("active"), // "active", "completed", "abandoned"
  createdAt: integer("created_at").notNull(),
  completedAt: integer("completed_at"),
}, (table) => ({
  userIdIdx: index("learning_goals_user_id_idx").on(table.userId),
  statusIdx: index("learning_goals_status_idx").on(table.status),
}));

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

export const savedResources = sqliteTable("saved_resources", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  conversationId: text("conversation_id").references(() => researchConversations.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  url: text("url"),
  content: text("content"),
  resourceType: text("resource_type").notNull(), // "article", "video", "paper", "website", "note"
  tags: text("tags"),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
  linkedDeckId: text("linked_deck_id").references(() => decks.id, { onDelete: "set null" }),
  linkedQuizId: text("linked_quiz_id").references(() => quizzes.id, { onDelete: "set null" }),
  createdAt: integer("created_at").notNull(),
}, (table) => ({
  userIdIdx: index("saved_resources_user_id_idx").on(table.userId),
  conversationIdIdx: index("saved_resources_conversation_id_idx").on(table.conversationId),
  resourceTypeIdx: index("saved_resources_resource_type_idx").on(table.resourceType),
}));

export const searchHistory = sqliteTable("search_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  searchType: text("search_type").notNull(), // "research", "notes", "flashcards", "quizzes"
  resultCount: integer("result_count"),
  searchedAt: integer("searched_at").notNull(),
}, (table) => ({
  userIdIdx: index("search_history_user_id_idx").on(table.userId),
  searchedAtIdx: index("search_history_searched_at_idx").on(table.searchedAt),
}));

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

export const userPreferences = sqliteTable("user_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  // Account settings
  phone: text("phone"),
  bio: text("bio"),
  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("america/new_york"),
  // Privacy settings
  profileVisibility: integer("profile_visibility", { mode: "boolean" }).notNull().default(true),
  showStudyActivity: integer("show_study_activity", { mode: "boolean" }).notNull().default(true),
  shareQuizResults: integer("share_quiz_results", { mode: "boolean" }).notNull().default(true),
  // Notification settings
  quizReminders: integer("quiz_reminders", { mode: "boolean" }).notNull().default(true),
  flashcardReminders: integer("flashcard_reminders", { mode: "boolean" }).notNull().default(true),
  weeklyDigest: integer("weekly_digest", { mode: "boolean" }).notNull().default(true),
  newFeatures: integer("new_features", { mode: "boolean" }).notNull().default(false),
  marketing: integer("marketing", { mode: "boolean" }).notNull().default(false),
  // Insight Scout settings
  aiModel: text("ai_model").notNull().default("gpt-4"),
  searchDepth: text("search_depth").notNull().default("comprehensive"),
  citationFormat: text("citation_format").notNull().default("apa"),
  responseTone: text("response_tone").notNull().default("academic"),
  includeExamples: integer("include_examples", { mode: "boolean" }).notNull().default(true),
  includeSources: integer("include_sources", { mode: "boolean" }).notNull().default(true),
  maxResults: text("max_results").notNull().default("10"),
  queryHistory: integer("query_history", { mode: "boolean" }).notNull().default(true),
  autoSave: integer("auto_save", { mode: "boolean" }).notNull().default(true),
  researchSummary: integer("research_summary", { mode: "boolean" }).notNull().default(true),
  webSearch: integer("web_search", { mode: "boolean" }).notNull().default(true),
  academicDatabases: integer("academic_databases", { mode: "boolean" }).notNull().default(true),
  enhancedAnalysis: integer("enhanced_analysis", { mode: "boolean" }).notNull().default(true),
  multiLanguageSupport: integer("multi_language_support", { mode: "boolean" }).notNull().default(false),
  // Timestamps
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => ({
  userIdIdx: index("user_preferences_user_id_idx").on(table.userId),
}));

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// Re-export chat models
export * from "./models/chat";
