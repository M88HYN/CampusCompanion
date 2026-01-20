# StudyMate (EduHub)

## Overview

StudyMate is an all-in-one educational platform for university students, offering notes management, quizzes, flashcards with spaced repetition, AI-powered research assistance (Insight Scout), and revision tools with a Pomodoro timer. The platform aims to create an engaging study environment with a vibrant, Duolingo-inspired design and distinct color identities for each feature. It integrates advanced features like adaptive quizzing, real-time analytics, and AI for enhanced learning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query for server state, React useState for local state
- **UI Components**: shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Build Tool**: Vite
- **UI/UX**: Sidebar layout, distinct pages per module, Duolingo-inspired vibrant design, light/dark mode theming.

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Style**: RESTful JSON API
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon PostgreSQL (serverless)
- **Session Management**: `connect-pg-simple`

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless.
- **Schema Design**: Centralized relational database with 22 tables supporting all features, ensuring data integrity with primary/foreign keys and normalization.
- **Spaced Repetition**: SM-2 algorithm fields integrated into cards and quiz questions.

### Key Design Patterns
- **Shared Types**: Schema types generated from Drizzle and shared via `@shared/*` alias.
- **Form Validation**: Zod schemas derived from Drizzle schemas using `drizzle-zod`.
- **API Request Pattern**: Centralized `apiRequest` function with React Query integration.
- **Component Architecture**: Feature pages in `pages/`, reusable UI in `components/ui/`.

### Feature Specifications

#### Dashboard (Learning Command Centre)
- **Personal Learning Hub**: Analyzes notes, quizzes, flashcards, and revision history to show exactly what to study next.
- **Study Now Section**: Prioritized actionable tasks with time estimates and reasons why each matters.
- **Weak Topics Highlight**: Areas needing attention with accuracy percentages and improvement suggestions.
- **Quick Wins**: Momentum-building easy tasks for efficient study sessions.
- **Strengths Display**: Topics you've mastered for confidence building.
- **Real-Time Stats**: Due cards, overall accuracy, weekly study time, items reviewed - all from live data.
- **Data Sources**: Fetches from /api/learning-insights, /api/cards/due, /api/decks, /api/quizzes, /api/notes.

#### Quiz System
- **Adaptive Quiz Engine**: Adjusts difficulty (1-5) based on real-time performance, increasing for correct answers and decreasing for incorrect ones.
- **Analytics Dashboard**: Tracks scores, accuracy, attempts, and time.
- **Instant Feedback**: Provides immediate correctness feedback with explanations.
- **Spaced Repetition Review**: Resurfaces incorrectly answered questions using SM-2.
- **Multiple Modes**: Practice (with feedback) and Exam (feedback at end).
- **Sample Quizzes**: 5 comprehensive university-level CS quizzes provided.

#### Flashcard System (Intelligent Learning Engine)
- **Smart Card Prioritization**: AI-driven queue that prioritizes cards based on spaced repetition urgency, ease factor, and learning status.
- **Priority Scoring**: Overdue cards (+50 max), new cards (+20), low ease factor (+30 max), learning status (+25).
- **Study Modes**: Smart Mix (AI-optimized), Due Cards Only, New Cards Only, Struggling Cards.
- **Active Recall Prompt**: "Think First" reminder before revealing question to encourage deeper learning.
- **SM-2 Spaced Repetition**: Cards track `interval`, `easeFactor`, `dueAt`, and `status` (new, learning, reviewing, mastered).
- **4-Level Confidence Rating**: Again (1), Hard (2), Good (3), Easy (5) - maps to SM-2 quality ratings.
- **Keyboard-First Design**: Space/Enter to flip, 1-4 to rate, Esc to exit session.
- **Post-Session Analytics**: Accuracy percentage, weak concepts identification, strong concepts celebration, personalized next action recommendations.
- **Session Configuration**: Configurable session size (10, 20, 30, 50 cards), active recall prompt toggle.
- **API Endpoints**: `/api/cards/smart-queue`, `/api/cards/session-summary`, `/api/cards/from-note`.
- **Urgency Levels**: Critical (>40 priority), High (>25), Medium (>15), Low (<15).

#### Insight Scout (AI Research Assistant)
- **AI Integration**: Powered by Replit AI Integrations (OpenAI gpt-5.1).
- **Features**: Streaming responses, persistent conversation history, various response types (Explanation, Summary, Comparison, Analysis, Real-World Examples, Study Tips, Common Mistakes), configurable search depths (Quick, Balanced, Comprehensive), quick prompts.
- **Integration Ready**: Can convert research into flashcards or quiz questions.
- **Quick Prompts**: 7 pre-configured prompts that auto-set response type (Explain Concept, Summarize, Compare & Contrast, Analyze, Real-world Examples, Study Tips, Common Mistakes).
- **Integration Buttons**: Copy to clipboard, Save to Notes, Create Flashcard (with deck selection), Create Quiz Question (MCQ with answer), Bookmark.
- **API Schema**: conversationId is nullable/optional for new conversations.

#### Notes System
- **Markdown Editor**: Rich-text formatting with markdown storage (type: "markdown" blocks).
- **Formatting Toolbar**: Bold, Italic, Headings (H1-H3), Code blocks, Quotes, Lists, Links.
- **Keyboard Shortcuts**: Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+S (Save).
- **Autosave**: 1.5s debounce with proper change tracking (tracks saved content to prevent losing edits during save operations).
- **Learning Integrations**: 
  - Convert selected text to Flashcard (with deck selection)
  - Convert to Quiz Question (with full client + server validation)
  - Ask Insight Scout (navigate to AI research with query)
- **Organization**: Subject-based categories, tags, search/filter.
- **API Validation**: Quiz questions validated for question text, ≥2 options, correct answer, numeric difficulty (1-5), positive marks.

#### Learning Insights Panel
- **Analytics Dashboard**: Provides data-driven insights into study behavior and performance.
- **Metrics**: Total study time, streaks, cards reviewed, quizzes taken, overall accuracy.
- **Visualizations**: 14-day accuracy trends, weekly activity bar chart, topic performance progress bars.
- **Personalized Feedback**: Identifies peak study times, strengths, weaknesses, and offers personalized recommendations.
- **Data Accuracy**: All metrics calculated from actual user activity data.

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database.

### UI Framework Dependencies
- **Radix UI**: Accessible, unstyled primitives.
- **shadcn/ui**: Pre-styled component library.
- **Lucide React**: Icon library.

### Key NPM Packages
- **drizzle-orm** / **drizzle-kit**: ORM and migration.
- **@tanstack/react-query**: Server state management.
- **react-hook-form** with **@hookform/resolvers**: Form handling and validation.
- **class-variance-authority** / **clsx** / **tailwind-merge**: Styling utilities.
- **date-fns**: Date manipulation.
- **wouter**: Client-side routing.

### Development Tools
- **Vite**: Build tool and dev server.
- **esbuild**: Production server bundling.
- **TypeScript**: Type checking.