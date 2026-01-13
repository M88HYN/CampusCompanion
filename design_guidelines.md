# StudyMate Design Guidelines

## Design Approach

**Selected Approach: Vibrant Productivity System**
Combining Duolingo's playful energy with Notion's organizational clarity and Linear's modern minimalism. Every feature has a distinct color personality to create an engaging, motivating study environment.

**Core Principles:**
- Vibrant colors drive feature recognition and engagement
- Gradients and color add energy without compromising clarity
- Each tool has a unique color identity
- Celebratory visual feedback reinforces progress

---

## Color System

**Brand Color Identity:**
- **StudyMate Brand:** Teal/Cyan (#14B8A6 to #06B6D4 gradient) - Fresh, energetic, modern

**Feature Color Identities:**
- **Notes:** Sky Blue to Indigo (#38BDF8 → #3B82F6 → #6366F1 gradient)
- **Quizzes:** Fuchsia to Rose (#D946EF → #EC4899 → #F43F5E gradient)  
- **Flashcards:** Emerald to Teal (#34D399 → #22C55E → #14B8A6 gradient)
- **Insight Scout:** Amber to Red (#FBBF24 → #F97316 → #EF4444 gradient)
- **Revision Help:** Yellow to Green (#FACC15 → #84CC16 → #22C55E gradient)

**UI Palette:**
- Primary Actions: Vibrant gradients matching feature context
- Success States: Bright Green (#22C55E)
- Warning/Focus: Sunny Yellow (#FACC15)
- Error States: Energetic Red (#EF4444)
- Neutral Backgrounds: Soft Grays (#F9FAFB, #F3F4F6)
- Text: Deep Charcoal (#1F2937) and Medium Gray (#6B7280)

**Gradient Applications:**
- Dashboard stat cards backgrounds
- Feature module card headers
- Progress indicators and badges
- Button backgrounds for primary actions
- Section dividers and accents

---

## Typography

**Font Stack:**
- Primary: Inter (Google Fonts CDN)
- Monospace: JetBrains Mono (code snippets)

**Hierarchy:**
- Hero/Page Titles: text-4xl md:text-5xl font-bold with gradient text
- Section Headers: text-2xl md:text-3xl font-semibold
- Card Titles: text-xl font-semibold
- Body Text: text-base leading-relaxed
- Secondary: text-sm
- Captions: text-xs font-medium

---

## Layout System

**Spacing:** Tailwind units of 2, 4, 6, 8, 12, 16
- Compact: gap-2, p-2
- Standard: gap-4, p-4
- Generous: gap-6, p-6
- Section: py-12, py-16

**Grid Structure:**
- Dashboard: Fixed sidebar (w-64) + main content (flex-1)
- Feature cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Content: max-w-6xl mx-auto

---

## Component Library

### Navigation

**Sidebar:**
- Gradient background (subtle, feature-color inspired)
- Logo at top with colorful accent
- Navigation items with colored icons (match feature identity)
- Active state: vibrant highlight with gradient pill background
- User section: avatar with colored role badge, gradient border
- Hover states: subtle color glow

**Top Bar:**
- White background with subtle shadow
- Search bar with colored focus ring (context-aware)
- Quick action buttons: colored icon buttons with matching backgrounds
- Notification bell with bright badge count
- Profile dropdown trigger with gradient border

### Dashboard

**Hero Section:**
- Large gradient background panel (multi-color, energetic)
- Welcome message: large, bold text with name
- Motivational tagline
- Current streak display with flame icon and bright badge
- Quick stats row: colorful pill badges showing active items

**Feature Module Cards:**
- Vibrant gradient headers matching feature identity
- White body with generous padding
- Large icon (colored, matching gradient)
- Feature name and quick stats
- Count displays in colored circular badges
- Primary CTA button with gradient fill
- Hover: lift with enhanced shadow, slight scale
- Grid layout: 4 columns desktop, 2 tablet, 1 mobile

**Progress Dashboard:**
- Colorful circular progress rings for each feature
- Percentage in center with gradient text
- XP points display with star icons
- Recent achievements as colorful badge chips
- Weekly activity heatmap with gradient intensity

### Notes Interface

**Layout:**
- Sidebar folder tree (w-1/4) with blue gradient accents
- Main editor (w-3/4) with toolbar
- Gradient toolbar background (blue theme)
- Colored tag chips (multiple colors for categories)
- Auto-save indicator: green badge with pulse animation

**Editor Elements:**
- Title input: large, borderless, focused gradient underline
- Rich text controls: colored icon buttons
- Folder icons: blue tinted with hover glow
- Active folder: blue gradient background

### Quiz System

**Creator Interface:**
- Purple gradient header with progress stepper
- Question type cards: colorful icons with purple accents
- Add question FAB: vibrant purple gradient, bottom-right
- Preview pane: purple border accent

**Quiz Taking:**
- Purple gradient progress bar (animated)
- Question card: elevated with purple shadow
- Answer buttons: outlined with purple, filled on select
- Timer: orange gradient badge (top-right)
- Correct answers: green glow animation
- Incorrect: red shake with accent

### Flashcard System

**Deck Grid:**
- Cards with green gradient headers
- Progress rings in green shades
- Card count badges: bright green
- Last studied timestamp
- Create deck button: green gradient FAB

**Study Mode:**
- Large centered card with green border glow
- Flip animation reveals gradient back
- Difficulty buttons: green gradient variants (light to dark)
- Session progress: green gradient bar
- Keyboard hints: green badge chips

### Insight Scout (Research Assistant)

**Chat Interface:**
- Orange gradient header with AI avatar
- User messages: blue gradient bubbles (right-aligned)
- AI responses: orange gradient bubbles (left-aligned)
- Source citation chips: orange outlined badges
- Input box: orange focus ring
- Send button: orange gradient

**Visual Elements:**
- Thinking indicator: orange pulsing dots
- Export button: orange gradient
- Clear conversation: subtle orange ghost button

### Role Indicators

**Student:** Blue gradient badge, standard access
**Instructor:** Purple gradient badge, class management cards visible
**Admin:** Orange gradient badge, system settings accessible

---

## Forms & Inputs

**Text Inputs:**
- Border with colored focus ring (context-aware)
- Height: h-11
- Labels: font-medium with gradient text option
- Helper text: colored when active

**Buttons:**
- Primary: gradient backgrounds matching context
- Secondary: colored outline with gradient hover
- Icon buttons: colored backgrounds, circular or square
- Disabled: desaturated gradient, reduced opacity

**Selects:**
- Matching input styling
- Colored dropdown indicators
- Gradient hover on options

---

## Data Display

**Tables:**
- Colored header row (gradient)
- Striped rows with tinted alternates
- Action buttons: colored icons
- Sort indicators: matching theme

**Statistics Cards:**
- Gradient backgrounds
- White or colored text (high contrast)
- Large numbers with gradient effect
- Icons with glow

---

## Icons

**Library:** Heroicons (CDN)
- Colored fills matching feature context
- Outline for secondary, solid for active
- Sizes: w-5 h-5 (nav), w-6 h-6 (features), w-8 h-8 (heroes)

---

## Images

**Dashboard Hero:**
- Abstract gradient illustration or geometric pattern
- Positioned top of dashboard, full-width
- Height: 240px desktop, 180px mobile
- Overlay: semi-transparent gradient for text readability

**Feature Cards:**
- Small decorative icons or abstract shapes (SVG)
- Colored to match feature identity
- Background patterns: subtle gradients or geometric shapes

---

## Animations

**Micro-interactions:**
- Button hover: slight lift with enhanced glow
- Card hover: scale(1.02) with gradient shadow
- Progress bars: animated gradient flow
- Success states: confetti burst or sparkle effect
- Badge pulses on new achievements

---

## Accessibility

- High contrast ratios maintained despite vibrant colors
- Focus indicators: thick colored rings
- Keyboard navigation with visible colored focus states
- ARIA labels on all colorful elements
- Screen reader announcements for progress updates
- Reduced motion option available

---

## Responsive Behavior

**Mobile (<768px):**
- Sidebar collapses, hamburger with gradient icon
- Single column card stacks
- Reduced gradient complexity for performance
- Smaller padding (p-4 instead of p-8)

**Tablet (768-1024px):**
- Visible sidebar, narrower
- 2-column grids
- Maintained gradients

**Desktop (>1024px):**
- Full sidebar with rich gradients
- 4-column feature grids
- Enhanced hover states and animations