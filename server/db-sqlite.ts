import "dotenv/config";
import Database, { type Database as DatabaseType } from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

// No schema import needed - tables are created manually via SQL
type EmptySchema = Record<string, never>;

let db: BetterSQLite3Database<EmptySchema>;
let sqlite: DatabaseType;

export function initializeDatabase(): BetterSQLite3Database<EmptySchema> {
  // Use in-memory database by default or file-based if specified
  const dbPath = process.env.DATABASE_URL === "sqlite:memory" || !process.env.DATABASE_URL 
    ? ":memory:" 
    : process.env.DATABASE_URL.replace("sqlite:", "");

  console.log(`Initializing SQLite database at: ${dbPath}`);

  sqlite = new (Database as any)(dbPath);
  
  // Enable foreign keys
  sqlite.pragma("foreign_keys = ON");

  // Initialize drizzle without schema since we create tables manually
  db = drizzle({
    client: sqlite,
  });

  // Drop and recreate tables (fresh reset on every startup)
  dropTables();
  createTables();

  return db;
}

function dropTables() {
  // Drop all tables in reverse order of dependencies
  const tables = [
    'card_reviews', 'cards', 'decks',
    'quiz_responses', 'quiz_attempts', 'quiz_options', 'quiz_questions', 'quizzes',
    'user_question_stats', 'user_achievements', 'user_preferences',
    'study_sessions', 'note_blocks', 'notes',
    'research_conversations', 'sessions', 'users'
  ];
  
  sqlite.exec('PRAGMA foreign_keys = OFF');
  for (const table of tables) {
    try {
      sqlite.exec(`DROP TABLE IF EXISTS ${table}`);
    } catch (e) {
      // Ignore errors for non-existent tables
    }
  }
  sqlite.exec('PRAGMA foreign_keys = ON');
  console.log('Database tables dropped and reset');
}

function createTables() {
  // Create users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

// Create notes table - Drizzle-compatible
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
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
      type TEXT NOT NULL DEFAULT 'mcq',
      question TEXT NOT NULL,
      difficulty INTEGER DEFAULT 3,
      marks INTEGER DEFAULT 1,
      explanation TEXT,
      mark_scheme TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      tags TEXT,
      estimated_time INTEGER,
      correct_answer TEXT,
      source_note_block_id VARCHAR
    )
  `);

  // Create quiz_options table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS quiz_options (
      id VARCHAR PRIMARY KEY,
      question_id VARCHAR NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      is_correct BOOLEAN DEFAULT false,
      "order" INTEGER NOT NULL DEFAULT 0
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
      text_answer TEXT,
      is_correct BOOLEAN,
      marks_awarded INTEGER,
      feedback TEXT,
      response_time INTEGER,
      confidence_level INTEGER,
      converted_to_flashcard BOOLEAN NOT NULL DEFAULT 0,
      flashcard_id VARCHAR,
      answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create user_question_stats table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_question_stats (
      id VARCHAR PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id VARCHAR NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      times_answered INTEGER NOT NULL DEFAULT 0,
      times_correct INTEGER NOT NULL DEFAULT 0,
      average_response_time REAL,
      last_attempted_at DATETIME,
      next_review_date DATETIME,
      review_interval INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      consecutive_correct INTEGER DEFAULT 0,
      needs_review BOOLEAN DEFAULT 1
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

  // Create study_sessions table for dashboard metrics
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id VARCHAR PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_type TEXT NOT NULL,
      resource_id VARCHAR,
      duration_minutes INTEGER NOT NULL,
      items_reviewed INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      started_at INTEGER NOT NULL,
      ended_at INTEGER
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

export function getDatabase(): BetterSQLite3Database<EmptySchema> {
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
