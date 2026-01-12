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