# Testing Guide for UI/UX Enhancements

## Quick Test Checklist

### 🎴 Flashcard Study (Most Complete)
- [ ] Navigate to Flashcards > Create a test deck
- [ ] Add a few test cards
- [ ] Click "Smart Study" or "Study Deck"
- [ ] **Test 3D Flip**: Click card or press Space
- [ ] **Test Sound**: Rate cards (1-4) - should hear sound feedback
- [ ] **Test Keyboard**:
  - [ ] Space: Flip card
  - [ ] 1: Rate "Again"
  - [ ] 2: Rate "Hard"
  - [ ] 3: Rate "Good"
  - [ ] 4: Rate "Easy"
  - [ ] Esc: Exit session
- [ ] **Test Confetti**: Complete session with good ratings (avg ≥ 3) - should see confetti
- [ ] **Test Progress**: Should see current/total cards displayed
- [ ] **Test Difficulty Badge**: Back of card should show badge (New/Learning/Struggling/Mastered)

### 🌙 Dark Mode
- [ ] Look for Moon icon in navbar (top right)
- [ ] Click to toggle dark mode
- [ ] Refresh page - theme should persist
- [ ] All pages should adapt colors
- [ ] Check sidebar turns dark
- [ ] Check cards have dark variants

### 📱 Navigation
- [ ] Sidebar should have icons and labels
- [ ] Click sidebar toggle (< or >) to collapse
- [ ] When collapsed, only icons show
- [ ] Hover collapsed items - tooltip should appear
- [ ] Active page highlighted in emerald/green

### 📊 Notifications
- [ ] Trigger error toast: Try invalid action
- [ ] Should show error toast in bottom-right
- [ ] Toast should auto-dismiss after ~4s
- [ ] Should have icon, title, optional description

### 🎮 Gamification (When Integrated)
- [ ] Complete quiz with good score
- [ ] Should show grade (A+, A, B, C, D, F)
- [ ] Should show emoji matching performance
- [ ] Should show XP earned
- [ ] Should show personalized feedback
- [ ] Check localStorage: `gameState` object

### 📝 Note Editor (When Integrated)
- [ ] Create new note
- [ ] Type some text
- [ ] Click Bold button - text should wrap in **
- [ ] Click Italic - text should wrap in _
- [ ] Add tags (comma-separated)
- [ ] Wait 1s - should see "Saved just now"
- [ ] Refresh - note should persist

### 💬 Chat Interface (When Integrated)
- [ ] Send a message
- [ ] Should appear right-aligned, green
- [ ] Response should appear left-aligned, gray
- [ ] Should see typing animation (bouncing dots)
- [ ] Can click to copy response
- [ ] Can save response to notes

## Detailed Test Scenarios

### Test 1: Flashcard 3D Flip
1. Start flashcard study
2. See question on front
3. Click card once - **should rotate smoothly 180°**
4. See answer and difficulty badge on back
5. Press Space - **should flip back smoothly**
6. Verify smooth motion (not instant)

### Test 2: Keyboard Shortcuts
1. During study session:
   - Press Space - card flips
   - Press 1 - rates as "Again", moves to next card
   - Press 2 - rates as "Hard", moves to next card
   - Press 3 - rates as "Good", moves to next card
   - Press 4 - rates as "Easy", moves to next card
   - Press Esc - ends session immediately

### Test 3: Sound Feedback
1. Turn on browser audio (not muted)
2. During study:
   - Press 1 (Again) - hear short click sound
   - Press 4 (Easy) - hear higher success sound
   - Different sounds for each rating

### Test 4: Confetti Animation
1. Complete short session (3-4 cards)
2. Rate all as "Good" or "Easy" (quality ≥ 3)
3. When session ends - **colorful confetti should fall from top**
4. Animation should last ~2.5 seconds
5. Particles should rotate while falling

### Test 5: Dark Mode Persistence
1. Toggle dark mode (Moon icon in navbar)
2. Page should immediately switch to dark colors
3. Refresh page - **should stay in dark mode**
4. Close browser, reopen - **should still be dark**
5. Toggle back to light - should persist light mode too

### Test 6: Sidebar Collapse
1. Look for collapse toggle (< or > icon) in sidebar
2. Click toggle - sidebar should collapse smoothly (300ms)
3. Only icons visible when collapsed
4. Labels hidden
5. Hover icon - tooltip should appear
6. Click toggle again - expands with labels

### Test 7: Difficulty Badges
1. During study, flip to see answer
2. Should see a colored badge showing status:
   - **New**: Blue badge with book icon
   - **Learning**: Orange badge with zap icon
   - **Struggling**: Red badge with alert icon
   - **Mastered**: Green badge with trophy icon
3. Hover badge - tooltip explains the status

### Test 8: Multiple Toasts
1. Trigger multiple errors quickly
2. Toasts should stack (not overlap)
3. Each should have dismiss button (X)
4. Each should auto-dismiss after 4s
5. Position should be bottom-right

## Browser DevTools Checks

### Network Tab
- Should see no API calls for auto-save (localStorage)
- API calls only for flashcard reviews

### Console
- No JavaScript errors
- Look for keyboard event logs if enabled

### Styles
- Check `dark` class on html element when dark mode active
- Check `.fade-in` animations applied to new cards

### Storage
- Check `theme` key in localStorage (value: "dark" or "light")
- Check `gameState` object (when integrated)

## Performance Tests

### Animation Smoothness
- Open DevTools Performance tab
- Record during card flip
- Should maintain 60 FPS
- Animation duration ~600ms for flip

### Confetti Performance
- Record confetti animation
- Should maintain >30 FPS
- Check memory cleanup after animation

### Loading
- Note editor auto-save should not block UI
- Toast appear should be instant

## Accessibility Tests

### Keyboard Navigation
- Tab through all interactive elements
- All buttons should be reachable via Tab
- Enter/Space should activate buttons

### Screen Reader (NVDA/JAWS)
- Should read button labels
- Should read toast notifications
- Should announce card flip state

### Color Contrast
- Use WebAIM contrast checker
- Dark mode badges should have sufficient contrast
- Light mode text should be readable

## Mobile Testing

- [ ] Test on iPhone Safari
- [ ] Test on Chrome Mobile
- [ ] Sidebar should collapse on small screens
- [ ] Cards should be readable on mobile
- [ ] Buttons should be touch-friendly (min 44x44px)
- [ ] No horizontal scroll

## Common Issues & Solutions

### Confetti Not Showing
**Problem**: No particles on session completion
**Solution**: 
- Check console for errors
- Verify `useConfetti()` is imported
- Check z-index (should be 40+)
- Ensure DOM is available

### Sound Not Playing
**Problem**: No audio feedback
**Solution**:
- Check browser audio settings (not muted)
- Refresh page
- Try in different browser
- Check speaker volume

### Dark Mode Not Persisting
**Problem**: Reverts to light mode on refresh
**Solution**:
- Check localStorage enabled
- Clear localStorage: `localStorage.clear()`
- Verify ThemeProvider wraps app
- Check browser privacy settings

### Animations Choppy
**Problem**: Animations not smooth (60 FPS)
**Solution**:
- Check GPU acceleration enabled
- Disable browser extensions
- Try in incognito mode
- Check for CPU-heavy operations

## Integration Testing

After integrating components into your pages:

1. **Test with Real Data**
   - Load actual notes with auto-save
   - Run real quizzes with gamification
   - View real chat history

2. **Test Edge Cases**
   - Very long note (1000+ words)
   - Many tags (20+)
   - Fast keyboard mashing
   - Rapid toast triggers

3. **Test Cross-Component**
   - Save quiz result to notes
   - Reference chat answer in notes
   - Check all dark mode variants

## Performance Benchmarks

Target metrics:
- Page load: < 2s
- Card flip: 600ms
- Toast appearance: < 100ms
- Dark mode toggle: < 300ms
- Auto-save: < 500ms
- FPS during animations: 60

## Test Data

Use these for testing:

**Test Flashcard Deck**:
- Front: "What is 2+2?"
- Back: "4"

**Test Note**:
- Title: "Test Note"
- Content: "This is a **test** note with _formatting_"
- Tags: "test, example"

**Test Chat**:
- User: "Explain photosynthesis"
- Assistant: "Photosynthesis is the process..."

## Sign-off Checklist

- [ ] All keyboard shortcuts work
- [ ] All animations are smooth
- [ ] Dark mode persists
- [ ] All toasts appear correctly
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Accessible (keyboard + screen reader)
- [ ] Performance meets targets
- [ ] Cross-browser compatible
- [ ] Ready for production

## Questions?

Refer to:
- `UI_ENHANCEMENTS.md` - Feature documentation
- `IMPLEMENTATION_GUIDE.md` - Integration steps
- Component JSDoc comments - Usage examples
