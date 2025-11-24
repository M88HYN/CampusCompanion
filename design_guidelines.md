# Educational App Design Guidelines

## Design Approach

**Selected Approach: Productivity System Hybrid**
Drawing inspiration from Notion's organizational clarity and Linear's modern minimalism, combined with education-specific patterns from platforms like Quizlet and Google Classroom.

**Core Principles:**
- Information clarity over visual decoration
- Efficient navigation between features
- Distraction-free learning environment
- Clear role-based visual hierarchy

---

## Typography

**Font Stack:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for code snippets in notes)

**Hierarchy:**
- Page Titles: text-3xl md:text-4xl font-bold
- Section Headers: text-2xl font-semibold
- Card Titles: text-xl font-semibold
- Body Text: text-base leading-relaxed
- Secondary Text: text-sm text-gray-600
- Captions/Meta: text-xs

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, and 16
- Tight spacing: gap-2, p-2
- Standard spacing: gap-4, p-4, m-4
- Section spacing: py-8, py-12
- Large gaps: gap-8, mb-12

**Grid Structure:**
- Dashboard: 12-column grid with sidebar (w-64) + main content area
- Feature cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Content areas: max-w-5xl mx-auto for optimal reading

---

## Component Library

### Navigation
**Sidebar Navigation (Primary):**
- Fixed left sidebar (w-64) with app logo at top
- Icon + label navigation items with active state indicators
- Grouped sections: Learning Tools (Notes, Quizzes, Flashcards, Research), Settings, Profile
- Role badge displayed below user avatar
- Collapsible on mobile (hamburger menu)

**Top Bar:**
- Search bar (w-full max-w-md) with icon - prominent placement
- Quick actions: Create Note, New Quiz, Add Flashcard buttons (icon buttons)
- User profile dropdown (right-aligned) with role indicator
- Notification bell icon

### Dashboard Cards
**Feature Module Cards:**
- Elevated cards (shadow-md) with hover lift effect (shadow-lg)
- Icon header (top-left) with feature name
- Quick stats display (e.g., "12 notes", "5 active quizzes")
- Primary action button (bottom)
- 4-column grid on desktop, stack on mobile

**Recent Activity Feed:**
- Timeline-style list with activity icons
- Timestamp on right
- Clickable items with hover state
- Maximum 10 items with "View All" link

### Notes Interface
**Editor Layout:**
- Two-pane layout: Folder tree (w-1/4) + Editor (w-3/4)
- Rich text toolbar (sticky top position)
- Document title input (text-2xl font-bold, borderless)
- Auto-save indicator (top-right)
- Tag chips below title (rounded-full badges)

**Folder Tree:**
- Nested indentation (pl-4 per level)
- Folder icons with expand/collapse arrows
- Drag-and-drop visual indicators
- Search/filter input at top

### Quiz System
**Quiz Creator:**
- Multi-step form with progress indicator at top
- Question type selector (card-based selection)
- Add Question button (prominent, bottom-right floating)
- Preview pane on right side (desktop only)

**Quiz Taking Interface:**
- Clean, centered layout (max-w-3xl)
- Large question text (text-xl)
- Answer options as full-width buttons with selection states
- Progress bar at top showing question number
- Timer display (if timed quiz) in top-right
- Navigation: Previous/Next buttons bottom corners

### Flashcard System
**Card Deck View:**
- Grid of deck cards (grid-cols-2 lg:grid-cols-3)
- Each deck shows: title, card count, progress ring, last studied date
- Create Deck button (prominent, top-right)

**Study Mode:**
- Large centered card (perspective flip animation on click)
- Front/back clearly labeled
- Difficulty rating buttons below card (Easy, Medium, Hard)
- Session progress indicator at top
- Keyboard shortcuts hint (bottom)

### Research Assistant
**Chat Interface:**
- Full-height layout with message thread
- User messages: right-aligned, distinct styling
- AI responses: left-aligned with avatar
- Input box: bottom-fixed with send button
- Source citations as expandable chips below AI responses
- Export conversation button (top-right)

### Role-Based Visual Indicators
**Student View:**
- Standard access to all learning tools
- "Student" badge in subtle styling

**Instructor View:**
- Additional "Create Quiz for Class" and "View Student Progress" cards on dashboard
- "Instructor" badge with accent styling
- Access to analytics panels

**Admin View:**
- Full user management card on dashboard
- "Admin" badge with distinct styling
- System settings access

---

## Forms & Inputs
**Text Inputs:**
- Border style with focus ring
- Consistent height (h-10)
- Label above input (font-medium, text-sm)
- Helper text below (text-xs)

**Buttons:**
- Primary: solid fill, font-medium, px-6 py-2.5, rounded-lg
- Secondary: outline style with hover fill
- Icon buttons: square (w-10 h-10), rounded-lg
- Disabled state: reduced opacity

**Select Dropdowns:**
- Match text input styling
- Chevron icon indicator
- Max height with scroll for long lists

---

## Data Display
**Tables (Analytics/Admin):**
- Striped rows for readability
- Sortable column headers with sort indicators
- Action buttons in right column
- Sticky header on scroll
- Pagination controls at bottom

**Statistics Cards:**
- Large number display (text-3xl font-bold)
- Label below (text-sm)
- Optional icon or trend indicator
- Minimal padding for density

---

## Icons
**Library:** Heroicons (via CDN)
- Outline style for navigation and general use
- Solid style for active states and emphasis
- Consistent sizing: w-5 h-5 for nav, w-6 h-6 for features

---

## Images
No hero images required for this productivity-focused application. Focus remains on functional interface elements and efficient layouts.

---

## Accessibility
- Keyboard navigation support across all features
- ARIA labels on all interactive elements
- Focus indicators with sufficient contrast
- Screen reader announcements for state changes
- Skip navigation links
- Consistent tab order throughout application

---

## Responsive Behavior
**Mobile (< 768px):**
- Sidebar collapses to hamburger menu
- Dashboard cards stack single-column
- Two-pane layouts become tabbed views
- Reduced padding/spacing (halve desktop values)

**Tablet (768px - 1024px):**
- Sidebar visible but narrower
- 2-column card grids
- Maintained two-pane layouts

**Desktop (> 1024px):**
- Full sidebar navigation
- 4-column feature grids
- Optimal spacing and multi-column layouts