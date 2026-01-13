# StudyMate (EduHub)

## Overview

StudyMate is an all-in-one educational platform designed for university students. It provides a unified interface combining notes management, quizzes, flashcards with spaced repetition, AI-powered research assistance (Insight Scout), and revision tools with Pomodoro timer. The platform follows a vibrant, Duolingo-inspired design system where each feature has a distinct color identity to create an engaging study environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React useState for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Build Tool**: Vite with hot module replacement

The frontend uses a sidebar-based layout with distinct pages for each feature module (Dashboard, Notes, Quizzes, Flashcards, Research, Revision, Settings). Theme switching between light and dark modes is supported via ThemeProvider context.

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Style**: RESTful JSON API
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon PostgreSQL (serverless)
- **Session Management**: connect-pg-simple for PostgreSQL-backed sessions

The backend follows a clean separation with routes defined in `server/routes.ts`, database operations abstracted through a storage interface in `server/storage.ts`, and schema definitions shared between client and server in `shared/schema.ts`.

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Design**: Centralised relational database with 22 tables supporting all platform features
- **Data Integrity**: All entities linked using primary and foreign keys with CASCADE deletes
- **Normalization**: Reduces redundancy and improves scalability
- **Spaced Repetition**: SM-2 algorithm fields (interval, easeFactor, repetitions, dueAt) on cards and quiz questions

### Complete Database Schema

**User Management (3 tables):**
- `users`: id, username, password, role (student/instructor/admin), displayName, createdAt
- `user_preferences`: email, avatarUrl, theme, notifications, dailyGoalMinutes, preferredStudyTime
- `sessions`: PostgreSQL-backed session storage for authentication

**Notes System (2 tables):**
- `notes`: id, userId, title, subject, tags[], createdAt, updatedAt
- `note_blocks`: id, noteId, type (paragraph/heading/code/list), content, order

**Flashcard System (3 tables):**
- `decks`: id, userId, title, subject, description, tags[], difficulty, createdAt
- `cards`: id, deckId, type, front, back, imageUrl, clozeText, tags[], SM-2 fields (easeFactor, interval, repetitions, dueAt, status), sourceQuestionId, sourceNoteBlockId
- `card_reviews`: id, cardId, userId, quality (0-5), intervalBefore/After, easeFactorBefore/After, reviewedAt

**Quiz System (6 tables):**
- `quizzes`: id, userId, title, subject, description, mode, timeLimit, passingScore, isPublished, isAdaptive
- `quiz_questions`: id, quizId, type (mcq/saq/laq), question, difficulty (1-5), marks, explanation, markScheme, tags[]
- `quiz_options`: id, questionId, text, isCorrect, order
- `quiz_attempts`: id, quizId, userId, mode, startedAt, completedAt, score, totalMarks, earnedMarks, timeSpent, currentDifficulty, status
- `quiz_responses`: id, attemptId, questionId, selectedOptionId, textAnswer, isCorrect, marksAwarded, feedback, responseTime, confidenceLevel, convertedToFlashcard
- `user_question_stats`: id, userId, questionId, timesAnswered, timesCorrect, avgResponseTime, streak, SM-2 fields, nextReviewAt

**Insight Scout / Research (4 tables):**
- `conversations`: id, title, createdAt
- `messages`: id, conversationId, role (user/assistant), content, createdAt
- `saved_resources`: id, userId, conversationId, title, url, content, resourceType, tags[], isFavorite, linkedDeckId, linkedQuizId
- `search_history`: id, userId, query, searchType, resultCount, searchedAt

**Gamification & Progress (4 tables):**
- `achievements`: id, name, description, icon, category, requirement (JSON), points, rarity (common/rare/epic/legendary)
- `user_achievements`: id, userId, achievementId, unlockedAt, progress, isNotified
- `study_streaks`: id, userId, currentStreak, longestStreak, lastStudyDate, totalStudyDays
- `study_sessions`: id, userId, sessionType, resourceId, durationMinutes, itemsReviewed, correctAnswers, startedAt, endedAt
- `learning_goals`: id, userId, title, description, targetType, targetValue, currentValue, deadline, status

### Key Design Patterns
- **Shared Types**: Schema types are generated from Drizzle schemas and shared between frontend and backend via `@shared/*` path alias
- **Form Validation**: Zod schemas derived from Drizzle schemas using drizzle-zod
- **API Request Pattern**: Centralized `apiRequest` function with React Query integration
- **Component Architecture**: Feature pages in `pages/`, reusable UI components in `components/ui/`, with example wrappers in `components/examples/`

## Quiz System Features (Updated Jan 2026)

### Core Quiz Features
1. **Adaptive Quiz Engine**: Adjusts difficulty in real-time based on performance (±1 level per question)
2. **Quiz Analytics Dashboard**: Tracks scores, accuracy, attempts, and time statistics
3. **Instant Feedback**: Shows correct/incorrect immediately after each answer with explanations
4. **Spaced Repetition Review**: Resurfaces incorrectly answered questions using SM-2 algorithm
5. **Multiple Quiz Modes**: Practice mode (with feedback) and Exam mode (no feedback until end)

### Adaptive Quiz Implementation
- Starts at difficulty level 3 (medium)
- Increases difficulty by 1 for correct answers (max 5)
- Decreases difficulty by 1 for incorrect answers (min 1)
- Completes after 10 questions
- Only filters questions answered in current attempt (allows retakes)
- Backend returns questions with options included for efficiency

### Quiz API Endpoints
- `POST /api/quizzes/:quizId/adaptive-attempt` - Start adaptive quiz session
- `POST /api/attempts/:attemptId/adaptive-answer` - Submit adaptive answer with feedback
- `POST /api/attempts/:attemptId/answer` - Submit answer with instant feedback
- `POST /api/attempts/:attemptId/submit` - Finalize quiz attempt
- `GET /api/user/analytics` - Get user's quiz performance analytics
- `GET /api/spaced-review/due` - Get questions due for spaced review

### Sample Quizzes (University-Level CS)
5 comprehensive quizzes with 10 questions each (difficulty levels 1-5):
1. **Programming Fundamentals**: Variables, data types, control flow, functions, error handling
2. **Object-Oriented Programming**: Encapsulation, inheritance, polymorphism, SOLID, UML
3. **Data Structures & Algorithms**: Arrays, linked lists, trees, sorting, Big-O notation
4. **Computer Networks**: OSI/TCP-IP models, protocols (TCP, UDP, HTTP), routing, NAT
5. **Software Engineering**: SDLC, Agile, design patterns, testing, version control

## Flashcard System - Updated Jan 2026

### Core Features
1. **Custom Decks**: Create, edit, and delete flashcard decks with title, subject, description, and tags
2. **Multiple Card Types**: Basic cards with front/back content
3. **SM-2 Spaced Repetition**: Cards include interval, ease factor, and nextReviewDate for optimal learning
4. **Study Mode**: Focus mode with flip animation and confidence rating

### Study Session Features
- **Card Flip Animation**: Click or use keyboard to reveal answer
- **Confidence Rating**: 4-level rating system (Again, Hard, Good, Easy) mapping to SM-2 quality scores
- **Progress Tracking**: Visual progress bar showing session advancement
- **Session Completion**: Summary screen with "Start Again" or "Back to Decks" options

### Usability Features
- **Search/Filter**: Filter decks by title, subject, or tags
- **Shuffle Mode**: Randomize card order for study sessions (Fisher-Yates algorithm)
- **Keyboard Shortcuts**:
  - Space/Enter: Flip card
  - 1-4: Rate card (Again, Hard, Good, Easy)
  - Escape: Exit study mode

### Flashcard API Endpoints
- `GET /api/flashcard-decks` - List all decks with cards
- `POST /api/flashcard-decks` - Create new deck
- `PATCH /api/flashcard-decks/:id` - Update deck
- `DELETE /api/flashcard-decks/:id` - Delete deck
- `POST /api/flashcard-decks/:deckId/cards` - Add card to deck
- `PATCH /api/cards/:cardId` - Update card
- `DELETE /api/cards/:cardId` - Delete card
- `POST /api/cards/:cardId/review` - Submit review with SM-2 update

### Database Tables (Flashcards)
- `flashcard_decks`: id, userId, title, subject, description, tags, createdAt, cardCount
- `cards`: id, deckId, type, front, back, interval, easeFactor, nextReviewDate, createdAt, updatedAt

## Insight Scout (AI Research Assistant) - Added Jan 2026

### Overview
Insight Scout is an intelligent education-focused research feature powered by Replit AI Integrations (OpenAI gpt-5.1). It provides real-time academic explanations, definitions, and summaries for computer science and other educational topics.

### Features
- **Streaming Responses**: Real-time SSE streaming for immediate feedback
- **Conversation History**: Persistent chat sessions stored in PostgreSQL
- **Response Types**: Explanation, Summary, Comparison, Analysis modes
- **Search Depths**: Quick (brief), Balanced (moderate), Comprehensive (detailed)
- **Quick Prompts**: Pre-built prompts for common research tasks
- **Integration Ready**: Can convert research to flashcards or quiz questions

### Insight Scout API Endpoints
- `GET /api/research/conversations` - List all research conversations
- `GET /api/research/conversations/:id` - Get conversation with messages
- `POST /api/research/conversations` - Create new conversation
- `DELETE /api/research/conversations/:id` - Delete conversation
- `POST /api/research/query` - Send research query (SSE streaming response)
- `POST /api/research/create-flashcard` - Convert research to flashcard
- `POST /api/research/create-quiz-question` - Convert research to quiz question

### Database Tables (Insight Scout)
- `conversations`: id, title, createdAt
- `messages`: id, conversationId, role, content, createdAt

### Implementation Notes
- Uses Replit AI Integrations (no API key required, billed to credits)
- Environment variables: AI_INTEGRATIONS_OPENAI_BASE_URL, AI_INTEGRATIONS_OPENAI_API_KEY
- Server routes in `server/insight-scout.ts`
- Integration utilities in `server/replit_integrations/`

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database accessed via `@neondatabase/serverless` with WebSocket support
- **Connection**: Requires `DATABASE_URL` environment variable

### UI Framework Dependencies
- **Radix UI**: Full suite of accessible, unstyled primitives (dialog, dropdown, tabs, accordion, etc.)
- **shadcn/ui**: Pre-styled component library configured via `components.json`
- **Lucide React**: Icon library

### Key NPM Packages
- **drizzle-orm** / **drizzle-kit**: Database ORM and migration tooling
- **@tanstack/react-query**: Server state management
- **react-hook-form** with **@hookform/resolvers**: Form handling with Zod validation
- **class-variance-authority** / **clsx** / **tailwind-merge**: Utility-first styling helpers
- **date-fns**: Date manipulation utilities
- **wouter**: Lightweight client-side routing

### Development Tools
- **Vite**: Build tool and dev server
- **esbuild**: Production server bundling
- **TypeScript**: Type checking across client, server, and shared code