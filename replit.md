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

#### Quiz System
- **Adaptive Quiz Engine**: Adjusts difficulty (1-5) based on real-time performance, increasing for correct answers and decreasing for incorrect ones.
- **Analytics Dashboard**: Tracks scores, accuracy, attempts, and time.
- **Instant Feedback**: Provides immediate correctness feedback with explanations.
- **Spaced Repetition Review**: Resurfaces incorrectly answered questions using SM-2.
- **Multiple Modes**: Practice (with feedback) and Exam (feedback at end).
- **Sample Quizzes**: 5 comprehensive university-level CS quizzes provided.

#### Flashcard System
- **Custom Decks**: Create and manage decks with various attributes.
- **Multiple Card Types**: Basic cards with front/back.
- **SM-2 Spaced Repetition**: Cards track `interval`, `easeFactor`, and `nextReviewDate`.
- **Study Mode**: Features card flip animations, 4-level confidence rating (Again, Hard, Good, Easy), progress tracking, and session summaries.
- **Usability**: Search/filter decks, shuffle mode, keyboard shortcuts for interaction.

#### Insight Scout (AI Research Assistant)
- **AI Integration**: Powered by Replit AI Integrations (OpenAI gpt-5.1).
- **Features**: Streaming responses, persistent conversation history, various response types (Explanation, Summary, Comparison, Analysis), configurable search depths (Quick, Balanced, Comprehensive), quick prompts.
- **Integration Ready**: Can convert research into flashcards or quiz questions.

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