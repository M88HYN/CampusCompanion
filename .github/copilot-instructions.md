# CampusCompanion - AI Coding Agent Instructions

## Project Overview

**CampusCompanion** is a full-stack web application for student learning assistance featuring notes, flashcards, quizzes, research tools, and AI-powered insights. It's a monorepo with a React + TypeScript frontend, Express backend, and PostgreSQL database.

**Tech Stack:** React 19, Express.js, TypeScript, Drizzle ORM, TanStack Query, Tailwind CSS, Radix UI, Vite

---

## Architecture & Key Patterns

### Monorepo Structure
- **`client/src`** - React frontend (Vite)
- **`server`** - Express backend with route handlers
- **`shared`** - Zod schemas, database models, shared types
- **`.github/`** - GitHub workflows and configuration

### Three-Tier Data Layer
1. **Database Schema** (`shared/schema.ts`) - Drizzle ORM tables (PostgreSQL) with UUID primary keys and auto-cascade deletes
2. **Server Routes** (`server/routes.ts`) - RESTful endpoints with `getUserId()` for auth context
3. **React Queries** (`client/src/lib/queryClient.ts`) - TanStack Query with automatic JWT token injection

**Critical Pattern:** All data fetches use `apiRequest()` which auto-includes `Authorization: Bearer {token}` from localStorage. Server validates token via `authMiddleware` and extracts `req.user.userId` before DB operations.

### Authentication Flow
- **JWT-based:** Token stored in localStorage, 7-day expiry
- **Middleware:** `server/auth-routes.ts` handles registration/login; `server/auth.ts` contains token generation/verification
- **Client Hook:** `client/src/hooks/use-auth.ts` manages auth state with token expiry checking and server verification fallback
- **On 401 Response:** Client auto-clears token and dispatches `auth-update` event for re-auth

### Database & Schema Pattern
- Uses Drizzle ORM with PostgreSQL
- All tables have `userId` foreign key for user isolation
- Types generated via `createInsertSchema` from Drizzle tables for Zod validation
- Auto-generated migrations in `drizzle.config.ts` via `drizzle-kit`
- UUID primary keys with `gen_random_uuid()` defaults

**Key Entities:**
- `notes` + `noteBlocks` - Hierarchical note structure with learning metadata
- `decks` + `cards` - Spaced repetition flashcards with SM2 algorithm (easeFactor, interval)
- `quizzes` + `quizQuestions` + `quizOptions` - MCQ quiz system with tracking
- `users` + `sessions` - Auth tables with session storage in PostgreSQL

---

## Developer Workflows

### Setup & Development
```powershell
npm install              # Install all dependencies
npm run dev             # Start dev server (tsx watches server/index-dev.ts, Vite serves client)
npm run check           # TypeScript type check (tsc)
npm run db:push         # Push schema changes to database via drizzle-kit
```

### Build & Deploy
```powershell
npm run build           # Vite builds client → dist/public, esbuild bundles server → dist/index.js
npm start              # Run production build (NODE_ENV=production node dist/index.js)
```

### Key Files to Know
- `server/index-dev.ts` - Dev entry point with demo data seeding
- `server/index-prod.ts` - Prod entry point
- `server/app.ts` - Express app setup with request logging middleware
- `vite.config.ts` - Alias paths: `@/` → client/src, `@shared/` → shared

---

## Code Patterns & Conventions

### React Components
- **Pages** in `client/src/pages/` use Query + Mutation patterns with error boundaries
- **Queries:** `useQuery(["notes", userId], ...)` - key includes resource name + context
- **Mutations:** `useMutation({mutationFn: (data) => apiRequest("POST", "/api/notes", data)})`
- **UI Components:** `client/src/components/ui/` are unstyled Radix UI primitives from shadcn/ui

**Example Pattern** (from `client/src/pages/notes.tsx`):
```typescript
const { data: notes } = useQuery({
  queryKey: ["notes"],
  queryFn: getQueryFn<Note[]>({ on401: "throw" }),
  staleTime: 30000,
});

const createNoteMutation = useMutation({
  mutationFn: (data: InsertNote) => apiRequest("POST", "/api/notes", data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
});
```

### Server Route Pattern
All routes follow this structure:
```typescript
app.post("/api/{resource}", authMiddleware, async (req: any, res) => {
  const userId = getUserId(req);  // Extract authenticated user
  const data = insertSchema.parse(req.body);  // Validate with Zod
  const result = await storage.create(data, userId);  // DB operation
  res.json(result);
});
```

### Error Handling
- Server throws `Error("message")` - Express error middleware catches and responds with 500
- Client checks `res.status === 401` in `client/src/lib/queryClient.ts` to clear auth
- Use `useToast()` hook for user-facing error notifications

### Styling & Design
- **Tailwind CSS** with custom theme from `tailwind.config.ts`
- **Vibrant Feature Colors:** Notes (blue gradient), Quizzes (fuchsia/rose), Flashcards (emerald/teal), see `design_guidelines.md`
- **Component Strategy:** Radix UI primitives + Tailwind utilities (no CSS modules)

### Type Safety
- Zod schemas for runtime validation + TypeScript for compile-time
- Shared types in `shared/models/` imported by both client and server
- Use `type` imports for interfaces to avoid circular deps

---

## Integration Points & External Dependencies

### Local Features
- **Insight Scout** (`server/insight-scout.ts`) - AI-powered content analysis with mock response fallback

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (required for all environments)
- `JWT_SECRET` - For signing tokens (defaults to unsafe value in dev)
- `OPENAI_API_KEY` - Optional, enables real OpenAI responses (falls back to mock responses if missing/invalid)

### Database Migrations
- Use `drizzle-kit push` to sync schema.ts changes to PostgreSQL
- Migration files generated in `migrations/` directory
- Drizzle config points to `shared/schema.ts` as source of truth

---

## Project-Specific Patterns to Preserve

1. **User Isolation:** All queries filter by `userId` - never expose data across users
2. **Token-First Auth:** No session cookies; JWT in Authorization header
3. **Lazy Query Keys:** Include resource type in queryKey for better debugging
4. **Auto-Cascade Deletes:** Foreign keys have `onDelete: "cascade"` - deleting users cleans up all data
5. **Seed Data:** `server/seed-*.ts` files seed demo content for development

---

## Common Tasks

### Adding a New Feature (Notes Example)
1. Define schema in `shared/schema.ts` with Zod types
2. Add route in `server/routes.ts` with `authMiddleware` + `getUserId()`
3. Create page in `client/src/pages/` with Query/Mutation hooks
4. Import shared types from `@shared/schema`
5. Run `npm run db:push` to migrate
6. Test with `npm run dev`

### Debugging Auth Issues
- Check token in browser DevTools → Application → localStorage
- Verify `JWT_SECRET` matches between sign/verify in `server/auth.ts`
- Client logs show token verification details in console
- On 401, check server logs for token verification errors

### Adding UI Components
- Copy pattern from `client/src/components/ui/` (Radix primitives)
- Use Tailwind classes for styling, follow `design_guidelines.md` color scheme
- All page components wrap in `<TooltipProvider>` for Radix tooltips

---

## Files to Reference When...

| Goal | Reference Files |
|------|-----------------|
| Understanding data flow | `shared/schema.ts` → `server/routes.ts` → `client/src/pages/notes.tsx` |
| Adding endpoints | `server/routes.ts` + `server/auth-routes.ts` |
| Styling pages | `design_guidelines.md` + `tailwind.config.ts` |
| Managing state | `client/src/lib/queryClient.ts` + `client/src/hooks/use-auth.ts` |
| Database queries | `server/storage.ts` + `server/db.ts` |
| Type definitions | `shared/schema.ts` + `shared/models/` |
