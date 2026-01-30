# CampusCompanion - Test Guide

## Testing the Improved Notes Feature

### Prerequisites
```bash
# Make sure the database is set up
npm run db:push

# Start the development server
npm run dev
```

### Manual Testing Checklist

#### 1. Basic Note Operations
- [ ] Click "New Note" button - should open dialog
- [ ] Create note with title and subject - should save and select new note
- [ ] Edit note title - should show "Unsaved" badge, then auto-save
- [ ] Edit note content - should auto-save after 1.5 seconds
- [ ] Click "Save" button manually - should save immediately
- [ ] Try to save when already saved - button should be disabled

#### 2. Note Management
- [ ] Click note options menu (three dots)
- [ ] Click "Rename" - should open rename dialog
- [ ] Enter new title and confirm - should rename note
- [ ] Click "Delete Note" - should show confirmation prompt
- [ ] Confirm deletion - note should be deleted and next note selected
- [ ] Search for notes - should filter by title and tags

#### 3. Tags
- [ ] Type tag name and press Enter - should add tag
- [ ] Click X on tag - should remove tag
- [ ] Tags should save automatically with note

#### 4. Formatting Tools
- [ ] Click Bold button (or Ctrl+B) - should wrap selection with **
- [ ] Click Italic button (or Ctrl+I) - should wrap selection with *
- [ ] Click Heading1 button - should add # at line start
- [ ] Click Heading2 button - should add ## at line start
- [ ] Click List button - should add - at line start
- [ ] Click Numbered List - should add 1. at line start
- [ ] Click Quote - should add > at line start
- [ ] Click Code Block - should wrap selection with ```
- [ ] Click Link - should insert [text](url) format
- [ ] Toggle Preview - all format buttons should be disabled in preview mode

#### 5. Note Type & Exam Features
- [ ] Change note type dropdown - should update type (visual only for now)
- [ ] Click "Exam Prompt" button - should show exam prompt form
- [ ] Select exam type (SAQ/MCQ/LAQ/Essay) and marks
- [ ] Click "Add" - should insert exam annotation in note content

#### 6. Recall Mode
- [ ] Toggle "Recall Mode" switch - should enable recall mode
- [ ] Enter comma-separated key terms
- [ ] Key terms should be masked with ▓ characters
- [ ] Click "Reveal All Terms" - should disable recall mode

#### 7. Create Flashcard
- [ ] Select some text in the editor
- [ ] Click "Flashcard" button
- [ ] Dialog should open with selected text in front field
- [ ] Select a deck (create one in Flashcards section if needed)
- [ ] Fill in front and back
- [ ] Click "Create Flashcard" - should create and show success toast
- [ ] If no deck selected - should show error
- [ ] If fields empty - button should be disabled

#### 8. Create Quiz Question
- [ ] Select some text in the editor
- [ ] Click "Quiz" button
- [ ] Dialog should open with selected text as question
- [ ] Select a quiz (create one in Quizzes section if needed)
- [ ] Fill in question and 4 options
- [ ] Mark one option as correct
- [ ] Optionally add explanation
- [ ] Click "Add Question" - should create and show success toast
- [ ] If less than 2 options filled - should show error
- [ ] If no quiz selected - button should be disabled

#### 9. Auto-Generate Quiz
- [ ] Select a note with substantial content
- [ ] Click "Generate Quiz" button
- [ ] Dialog should explain what will be generated
- [ ] Click "Generate Quiz" - should show loading state
- [ ] Should create quiz with up to 5 questions
- [ ] Should show success toast with message
- [ ] If note has no content - should show error

#### 10. Auto-Generate Flashcards
- [ ] Select a note with substantial content
- [ ] Click "Generate Cards" button
- [ ] Dialog should prompt for deck selection
- [ ] Select a target deck
- [ ] Click "Generate Flashcards" - should show loading state
- [ ] Should create flashcards from note blocks
- [ ] Should show success toast with count
- [ ] If no deck selected - should show error

#### 11. Ask AI
- [ ] Select some text in the editor
- [ ] Click "Ask AI" button
- [ ] Should navigate to Research page with query

#### 12. Error Scenarios
- [ ] Try to create flashcard with no deck selected - should show error toast
- [ ] Try to create quiz question with empty fields - button should be disabled
- [ ] Try to auto-generate with no note selected - should show error
- [ ] Delete a note - should show confirmation dialog
- [ ] Network error during save - should show error toast

#### 13. Loading States
- [ ] All operations should show loading spinner when pending
- [ ] Buttons should be disabled during operations
- [ ] Badge should show "Saving..." during auto-save

#### 14. Subject Organization
- [ ] Notes should be grouped by subject in sidebar
- [ ] Click subject name to expand/collapse
- [ ] "Uncategorized" subject for notes without subject

## API Endpoint Tests

### Test with curl or REST client:

```bash
# Get all notes (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/notes

# Create a note
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test Note","subject":"Testing","blocks":[{"type":"markdown","content":"Test content"}]}' \
  http://localhost:5000/api/notes

# Create card in specific deck
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"front":"Question?","back":"Answer!","type":"basic"}' \
  http://localhost:5000/api/decks/DECK_ID/cards

# Auto-generate quiz from note
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"questionCount":5}' \
  http://localhost:5000/api/notes/NOTE_ID/generate-quiz

# Auto-generate flashcards from note
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"deckId":"DECK_ID"}' \
  http://localhost:5000/api/notes/NOTE_ID/generate-flashcards
```

## Expected Behavior

### Success States
- ✅ Green "Saved" badge when content is saved
- ✅ Success toasts with descriptive messages
- ✅ Smooth transitions between states
- ✅ Data appears immediately after creation

### Error States
- ❌ Red destructive toasts for errors
- ❌ Descriptive error messages
- ❌ Console logs for debugging
- ❌ Buttons disabled to prevent invalid actions

### Loading States
- ⏳ Spinners on buttons during operations
- ⏳ "Saving..." badge during auto-save
- ⏳ "Generating..." text on generate buttons
- ⏳ Disabled buttons prevent multiple submissions

## Common Issues & Solutions

### Issue: "No decks available" when creating flashcard
**Solution**: Go to Flashcards section and create a deck first

### Issue: "No quizzes available" when creating quiz question
**Solution**: Go to Quizzes section and create a quiz first

### Issue: Auto-save not working
**Solution**: Check browser console for errors, ensure note is selected

### Issue: Buttons not responding
**Solution**: Check if button is disabled (grayed out), ensure required data is provided

### Issue: 401 Unauthorized errors
**Solution**: Log out and log back in to refresh authentication token

## Performance Notes

- Auto-save debounces at 1.5 seconds to avoid excessive API calls
- Query invalidation ensures data is always fresh
- Loading states prevent double-submissions
- Local state updates for immediate UI feedback

## Browser Console

Check console for:
- Request/response logs
- Error stack traces
- Mutation status updates
- Query cache updates

All operations log their status for easy debugging.
