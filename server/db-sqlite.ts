import "dotenv/config";
import Database, { type Database as DatabaseType } from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";

let db: BetterSQLite3Database<typeof schema>;
let sqlite: DatabaseType;

export function initializeDatabase(): BetterSQLite3Database<typeof schema> {
  // Use in-memory database by default or file-based if specified
  const dbPath = process.env.DATABASE_URL === "sqlite:memory" || !process.env.DATABASE_URL 
    ? ":memory:" 
    : process.env.DATABASE_URL.replace("sqlite:", "");

  console.log(`Initializing SQLite database at: ${dbPath}`);

  sqlite = new (Database as any)(dbPath);
  
  // Enable foreign keys
  sqlite.pragma("foreign_keys = ON");

  db = drizzle({
    client: sqlite,
    schema,
  });

  // Create tables
  createTables();

  return db;
}

function createTables() {
  // Create users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY,
      email TEXT UNIQUE,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create notes table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id VARCHAR PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      subject TEXT,
      tags TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create note_blocks table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS note_blocks (
      id VARCHAR PRIMARY KEY,
      note_id VARCHAR NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      note_type TEXT DEFAULT 'general',
      is_exam_content BOOLEAN DEFAULT false,
      exam_prompt TEXT,
      exam_marks INTEGER,
      key_terms TEXT
    )
  `);

  // Create decks table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id VARCHAR PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      subject TEXT,
      description TEXT,
      tags TEXT,
      difficulty TEXT DEFAULT 'medium',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create cards table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id VARCHAR PRIMARY KEY,
      deck_id VARCHAR NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'basic',
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      image_url TEXT,
      cloze_text TEXT,
      definition TEXT,
      example TEXT,
      tags TEXT,
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      due_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'new',
      last_reviewed_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      source_question_id VARCHAR,
      source_note_block_id VARCHAR
    )
  `);

  // Create card_reviews table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS card_reviews (
      id VARCHAR PRIMARY KEY,
      card_id VARCHAR NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      quality INTEGER NOT NULL,
      review_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create quizzes table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id VARCHAR PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      subject TEXT,
      description TEXT,
      mode TEXT NOT NULL DEFAULT 'practice',
      time_limit INTEGER,
      passing_score INTEGER,
      is_published BOOLEAN NOT NULL DEFAULT 0,
      is_adaptive BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create quiz_questions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id VARCHAR PRIMARY KEY,
      quiz_id VARCHAR NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'mcq',
      difficulty INTEGER DEFAULT 1,
      marks INTEGER DEFAULT 1,
      explanation TEXT
    )
  `);

  // Create quiz_options table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS quiz_options (
      id VARCHAR PRIMARY KEY,
      question_id VARCHAR NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      is_correct BOOLEAN DEFAULT false
    )
  `);

  // Create quiz_attempts table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id VARCHAR PRIMARY KEY,
      quiz_id VARCHAR NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mode TEXT NOT NULL,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      score INTEGER,
      total_marks INTEGER,
      earned_marks INTEGER,
      time_spent INTEGER,
      current_question_index INTEGER DEFAULT 0,
      current_difficulty INTEGER DEFAULT 3,
      difficulty_path TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress'
    )
  `);

  // Create quiz_responses table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS quiz_responses (
      id VARCHAR PRIMARY KEY,
      attempt_id VARCHAR NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id VARCHAR NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      selected_option_id VARCHAR,
      is_correct BOOLEAN
    )
  `);

  // Create user_question_stats table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_question_stats (
      id VARCHAR PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id VARCHAR NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      attempts INTEGER DEFAULT 0,
      correct INTEGER DEFAULT 0
    )
  `);

  // Create conversations table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'New Conversation',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create messages table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR PRIMARY KEY,
      conversation_id VARCHAR NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database tables created successfully");
}

export function getDatabase(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return db;
}

export function closeDatabase() {
  if (sqlite) {
    sqlite.close();
    console.log("Database closed");
  }
}
