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
- **Schema Design**: Drizzle ORM schema with tables for users, notes, note blocks, flashcard decks, cards (with spaced repetition fields), quizzes, quiz questions, quiz options, quiz attempts, and quiz responses
- **Spaced Repetition**: Cards include interval, ease factor, and next review date fields for SM-2 algorithm implementation

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