# Startup Test Checklist

## Critical Fixes Applied

### 1. Data Pipeline: Backend → API → Frontend → UI
- ✅ Fixed queryClient configuration (refetchOnMount: true, staleTime: 30s, retry: 1)
- ✅ Added `enabled: !!user` to all dashboard queries
- ✅ Fixed query patterns across Notes, Flashcards, Quizzes pages
- ✅ Added comprehensive logging to apiRequest and getQueryFn
- ✅ Added dashboard data debugging with useEffect logging

### 2. Sample Data Visibility
- ✅ Login now checks if user has data and seeds sample data if empty
- ✅ Registration already seeds sample data for new users
- ✅ authMiddleware ensures users exist in database before API calls
- ✅ Sample data seeding uses logged-in user's userId (not hardcoded "demo-user")

### 3. Query & State Management
- ✅ All queries use proper retry: 1
- ✅ Queries refetch on mount to get fresh data
- ✅ Queries have proper error states captured
- ✅ Dashboard logs all query results and errors to console

### 4. Authentication Flow
- ✅ App routing properly redirects root "/" to "/dashboard"
- ✅ Unknown routes redirect to dashboard (not login) when authenticated
- ✅ Login redirects to dashboard
- ✅ Token verification with server fallback to JWT decoding
- ✅ Auth middleware creates missing users in database

### 5. API Request Logging
- ✅ All API requests log: method, URL, status, success/failure
- ✅ Query responses log data type and count
- ✅ Mutations already have component-specific logging
- ✅ Auth token presence/absence logged for every request

## Testing Steps

### 1. Start the Application
```powershell
npm run dev
```

Expected output:
```
✅ Backend API server ready at http://127.0.0.1:5000
📱 Frontend will be available at http://127.0.0.1:5173
```

### 2. Open Browser
Navigate to: http://127.0.0.1:5173

Expected behavior:
- Should redirect to login page

### 3. Register New User
1. Click "Sign Up" or go to registration
2. Enter email: test@example.com
3. Enter password: password123
4. Submit

Expected console logs:
```
[apiRequest] POST /api/auth/register
[apiRequest] POST /api/auth/register - Status: 200 ✓
```

Expected behavior:
- Redirects to dashboard
- Sample data seeds in background
- Dashboard shows loading state then sample content

### 4. Dashboard Data Check
After login, check browser console for:
```
[DASHBOARD] Data loaded: {
  notes: 3,
  decks: 4,
  quizzes: 2,
  dueCards: X,
  hasInsights: true/false,
  user: "test@example.com"
}
```

### 5. Navigate to Notes
Click "Notes" in sidebar

Expected console logs:
```
[getQueryFn] GET /api/notes
[getQueryFn] GET /api/notes - Status: 200 ✓
[getQueryFn] GET /api/notes - Data received: 3 items
```

Expected UI:
- 3 sample notes appear:
  - "Data Structures – Linked Lists"
  - "Operating Systems – Scheduling"
  - "Database Normalisation (1NF–3NF)"

### 6. Navigate to Flashcards
Click "Flashcards" in sidebar

Expected console logs:
```
[getQueryFn] GET /api/decks
[getQueryFn] GET /api/decks - Status: 200 ✓
[getQueryFn] GET /api/decks - Data received: 4 items
```

Expected UI:
- 4 sample decks appear
- Each deck shows card counts

### 7. Navigate to Quizzes
Click "Quizzes" in sidebar

Expected console logs:
```
[getQueryFn] GET /api/quizzes
[getQueryFn] GET /api/quizzes - Status: 200 ✓
[getQueryFn] GET /api/quizzes - Data received: 2 items
```

Expected UI:
- 2 sample quizzes appear
- Can start quiz and see questions

### 8. Test Refresh
Press F5 to refresh page

Expected behavior:
- No white screen
- Stays on same page
- Data reloads from API
- User remains logged in

### 9. Test Button Interactions

#### Notes
- Click "New Note" → Dialog opens
- Create note → Saves and appears in list
- Click note → Content loads in editor
- Type in editor → Auto-saves after 1.5s

#### Flashcards
- Click "New Deck" → Dialog opens
- Create deck → Saves and appears in list
- Click "Add Cards" → Card creation dialog
- Click "Start Study" → Study session begins

#### Quizzes
- Click "Create Quiz" → Quiz builder opens
- Add questions → Questions saved
- Click "Start Quiz" → Quiz begins
- Submit answers → Results shown

## Expected Console Output Pattern

### Successful Data Flow
```
[getQueryFn] GET /api/notes
[getQueryFn] GET /api/notes - Status: 200 ✓
[getQueryFn] GET /api/notes - Data received: 3 items
[DASHBOARD] Data loaded: { notes: 3, ... }
```

### Failed Data Flow (troubleshooting)
```
[getQueryFn] GET /api/notes
[getQueryFn] GET /api/notes - Status: 401 ✗
[Auth] 401 on query - clearing token
```

## Common Issues & Solutions

### Issue: No data appears on dashboard
**Check:**
1. Browser console for `[DASHBOARD] Data loaded` - shows counts
2. Network tab - verify API calls return 200
3. Check userId matches between login and sample data

**Solution:**
- Logout and login again (triggers sample data seeding)
- Check server logs for "seeded successfully"

### Issue: 401 Unauthorized errors
**Check:**
1. localStorage has "token"
2. Token isn't expired
3. JWT_SECRET matches between server instances

**Solution:**
- Clear localStorage
- Login again

### Issue: White screen on refresh
**Check:**
1. App.tsx routing
2. Auth state loading properly

**Solution:**
- Should now redirect to dashboard when authenticated

### Issue: Buttons do nothing
**Check:**
1. Browser console for component-specific logs like `[NOTES] Button clicked`
2. Console for API request logs
3. Network tab for failed requests

**Solution:**
- All buttons now have diagnostic logging
- Follow log trail to find failure point

## Success Criteria

✅ App starts without errors
✅ Registration works and seeds sample data
✅ Login works and redirects to dashboard
✅ Dashboard shows sample data counts
✅ Notes page shows 3 sample notes
✅ Flashcards page shows 4 sample decks
✅ Quizzes page shows 2 sample quizzes
✅ Refresh doesn't break the app
✅ All buttons trigger actions
✅ Data saves persist across refreshes
✅ Console shows comprehensive logging for debugging
