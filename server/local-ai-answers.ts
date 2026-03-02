/*
==========================================================
File: server/local-ai-answers.ts

Module: Core Platform

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
API Routing and Service Layer

System Interaction:
- Receives HTTP requests and coordinates validation, authorization, and business workflows
- Interacts with storage/database adapters and shared schemas for consistent persistence

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

import fs from "node:fs";
import path from "node:path";

export interface LocalAnswerEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: "study-skills" | "computer-science" | "math" | "science" | "writing" | "productivity";
}

export type LocalAnswerCategory = LocalAnswerEntry["category"];

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "i", "in", "is", "it", "of", "on", "or", "that", "the", "to", "what", "when", "where", "which", "who", "why", "with", "you", "your"
]);

const LOCAL_ANSWER_CATEGORIES: LocalAnswerCategory[] = [
  "study-skills",
  "computer-science",
  "math",
  "science",
  "writing",
  "productivity",
];

const LOCAL_ANSWERS_FILE = process.env.LOCAL_AI_ANSWERS_PATH
  ? path.resolve(process.env.LOCAL_AI_ANSWERS_PATH)
  : path.resolve(process.cwd(), "server", "data", "local-ai-answers.json");

const BASE_LOCAL_AI_ANSWERS: LocalAnswerEntry[] = [
  {
    id: "pomodoro-technique",
    category: "productivity",
    question: "How do I use the Pomodoro technique effectively?",
    keywords: ["pomodoro", "focus", "timer", "productivity", "study session"],
    answer: "Use a 25/5 cycle to start: 25 minutes deep work, 5 minutes break, repeated four times, then take a 20–30 minute break. Before each session, define one concrete outcome (e.g., \"finish 15 flashcards\"). During focus blocks, remove phone/notifications and keep one task only. Track completed cycles daily and adjust to 50/10 if your attention span supports longer sessions.",
  },
  {
    id: "active-recall",
    category: "study-skills",
    question: "What is active recall and why does it work?",
    keywords: ["active recall", "memory", "revision", "recall", "forgetting curve"],
    answer: "Active recall is testing yourself from memory instead of rereading notes. It works because retrieval strengthens neural pathways and reveals weak spots. Practical method: read a section once, close notes, write everything you remember, compare against source, and immediately correct gaps. Repeat across days using spaced intervals.",
  },
  {
    id: "spaced-repetition",
    category: "study-skills",
    question: "How should I do spaced repetition for exams?",
    keywords: ["spaced repetition", "schedule", "exam", "flashcards", "sm2"],
    answer: "Review new material on Day 0, then Day 1, Day 3, Day 7, Day 14, and Day 30. If you fail recall, reset to shorter intervals. Keep cards atomic (one fact per card), avoid huge paragraphs, and prioritize difficult cards daily. In final 2 weeks before exams, compress intervals and increase mixed-topic practice.",
  },
  {
    id: "exam-planning",
    category: "study-skills",
    question: "How do I build a good exam revision plan?",
    keywords: ["exam plan", "revision timetable", "study plan", "prioritization"],
    answer: "Start with topic audit: green (strong), amber (partial), red (weak). Allocate 50% time to red, 35% amber, 15% green. Use weekly cycles: concept review, practice questions, error analysis, then recap. Reserve one rest block daily and one lighter day weekly to prevent burnout.",
  },
  {
    id: "procrastination",
    category: "productivity",
    question: "How can I stop procrastinating while studying?",
    keywords: ["procrastination", "motivation", "discipline", "focus"],
    answer: "Shrink the start: commit to 5 minutes only, then continue once momentum starts. Use implementation intentions: \"At 7:00 PM, I will study Chapter 3 at my desk.\" Remove friction by preparing materials beforehand and using website blockers during study windows. Measure consistency, not mood.",
  },
  {
    id: "binary-search",
    category: "computer-science",
    question: "What is binary search and its time complexity?",
    keywords: ["binary search", "time complexity", "sorted array", "algorithm"],
    answer: "Binary search finds a target in a sorted list by repeatedly halving the search range. Compare target with middle element, then continue left or right half accordingly. Time complexity is O(log n), space is O(1) iterative or O(log n) recursive due to call stack.",
  },
  {
    id: "big-o",
    category: "computer-science",
    question: "How do I understand Big-O notation quickly?",
    keywords: ["big o", "complexity", "algorithm analysis", "runtime"],
    answer: "Big-O describes growth rate of runtime/space as input size n increases. Common order: O(1) < O(log n) < O(n) < O(n log n) < O(n^2) < O(2^n). For exam answers, identify dominant term and drop constants/lower-order terms.",
  },
  {
    id: "stack-vs-queue",
    category: "computer-science",
    question: "What is the difference between stack and queue?",
    keywords: ["stack", "queue", "lifo", "fifo", "data structure"],
    answer: "Stack uses LIFO (last in, first out): push/pop from top. Queue uses FIFO (first in, first out): enqueue at rear, dequeue at front. Typical uses: stack for recursion/undo, queue for scheduling/BFS traversal.",
  },
  {
    id: "sql-joins",
    category: "computer-science",
    question: "Explain SQL joins in simple terms",
    keywords: ["sql", "join", "inner join", "left join", "database"],
    answer: "INNER JOIN returns rows with matches in both tables. LEFT JOIN returns all rows from left table plus matched rows from right (or NULL if no match). RIGHT JOIN is the opposite, and FULL OUTER JOIN returns all rows from both with NULLs where unmatched.",
  },
  {
    id: "normalization",
    category: "computer-science",
    question: "What is database normalization?",
    keywords: ["normalization", "database design", "1nf", "2nf", "3nf"],
    answer: "Normalization organizes tables to reduce redundancy and update anomalies. 1NF: atomic values and unique rows. 2NF: no partial dependency on composite keys. 3NF: no transitive dependency on non-key attributes. Trade-off: cleaner data vs potentially more joins.",
  },
  {
    id: "api-rest",
    category: "computer-science",
    question: "What is a REST API?",
    keywords: ["rest api", "http", "endpoint", "json", "crud"],
    answer: "A REST API exposes resources via HTTP endpoints and standard verbs: GET (read), POST (create), PUT/PATCH (update), DELETE (remove). Resources are usually represented as JSON. Good REST APIs use clear routes, status codes, and stateless authentication.",
  },
  {
    id: "jwt-auth",
    category: "computer-science",
    question: "How does JWT authentication work?",
    keywords: ["jwt", "authentication", "token", "bearer", "authorization"],
    answer: "JWT auth issues a signed token after login. Client stores token and sends it as `Authorization: Bearer <token>` on requests. Server verifies signature, expiry, and claims, then authorizes user actions. Keep secrets secure and use short expiries with refresh strategy when needed.",
  },
  {
    id: "git-basics",
    category: "computer-science",
    question: "What is the basic Git workflow?",
    keywords: ["git", "commit", "branch", "merge", "workflow"],
    answer: "Create feature branch, make small commits with clear messages, pull/rebase frequently, open PR, then merge after review. Typical loop: `git checkout -b feature/x`, edit, `git add .`, `git commit -m \"...\"`, `git push`, PR, merge.",
  },
  {
    id: "calculus-derivative",
    category: "math",
    question: "What is a derivative?",
    keywords: ["derivative", "calculus", "rate of change", "slope"],
    answer: "A derivative measures instantaneous rate of change of a function and equals the slope of the tangent line at a point. If position is s(t), then s'(t) is velocity. Core rules: power, product, quotient, and chain rule.",
  },
  {
    id: "integration-intuition",
    category: "math",
    question: "What does integration represent?",
    keywords: ["integration", "integral", "area under curve", "antiderivative"],
    answer: "Integration accumulates quantities. Definite integral gives signed area under a curve over an interval; indefinite integral gives antiderivative family. Fundamental theorem links derivatives and integrals.",
  },
  {
    id: "probability-basics",
    category: "math",
    question: "How do I solve basic probability questions?",
    keywords: ["probability", "events", "independent", "conditional"],
    answer: "Use clear event definitions first. For independent events: P(A and B) = P(A)P(B). For conditional: P(A|B) = P(A and B)/P(B). For at least one success in n trials with success p: 1 - (1-p)^n.",
  },
  {
    id: "linear-regression",
    category: "math",
    question: "What is linear regression?",
    keywords: ["linear regression", "statistics", "best fit", "prediction"],
    answer: "Linear regression models relationship between variables using a line y = b0 + b1x (+ ...). Coefficients minimize squared error between predicted and observed values. Evaluate with R², residual patterns, and validation on unseen data.",
  },
  {
    id: "newtons-laws",
    category: "science",
    question: "Summarize Newton's laws of motion",
    keywords: ["newton", "force", "motion", "physics"],
    answer: "1) Inertia: object remains at rest or uniform motion unless net force acts. 2) F = ma: acceleration is proportional to net force and inversely proportional to mass. 3) Action-reaction: every force has equal and opposite counterpart.",
  },
  {
    id: "photosynthesis-quick",
    category: "science",
    question: "Explain photosynthesis quickly",
    keywords: ["photosynthesis", "chloroplast", "calvin cycle", "light dependent"],
    answer: "Photosynthesis converts light energy into chemical energy. Light-dependent reactions in thylakoids produce ATP/NADPH and release oxygen; Calvin cycle in stroma uses ATP/NADPH to fix CO2 into sugars. Equation: 6CO2 + 6H2O + light -> C6H12O6 + 6O2.",
  },
  {
    id: "cell-respiration",
    category: "science",
    question: "What is cellular respiration?",
    keywords: ["cellular respiration", "atp", "glycolysis", "krebs", "electron transport"],
    answer: "Cellular respiration breaks down glucose to produce ATP. Main stages: glycolysis (cytoplasm), Krebs cycle (mitochondrial matrix), and electron transport chain (inner membrane). Oxygen is final electron acceptor in aerobic respiration.",
  },
  {
    id: "dna-rna",
    category: "science",
    question: "Difference between DNA and RNA",
    keywords: ["dna", "rna", "genetics", "nucleotide"],
    answer: "DNA is double-stranded, uses deoxyribose sugar and thymine, and stores long-term genetic information. RNA is usually single-stranded, uses ribose sugar and uracil, and helps express genes (mRNA, tRNA, rRNA).",
  },
  {
    id: "essay-structure",
    category: "writing",
    question: "How should I structure an academic essay?",
    keywords: ["essay", "structure", "introduction", "body paragraph", "conclusion"],
    answer: "Use a clear structure: introduction (thesis + roadmap), body paragraphs (one claim each with evidence and analysis), conclusion (synthesize, don't repeat). Each paragraph should follow claim -> evidence -> interpretation -> link back to thesis.",
  },
  {
    id: "critical-analysis",
    category: "writing",
    question: "What does critical analysis mean in assignments?",
    keywords: ["critical analysis", "evaluation", "argument", "evidence"],
    answer: "Critical analysis means evaluating ideas, not just describing them. Compare perspectives, examine assumptions, judge evidence quality, and explain implications. Strong critical writing balances strengths, limitations, and justified conclusions.",
  },
  {
    id: "citation-style",
    category: "writing",
    question: "How do I avoid plagiarism in assignments?",
    keywords: ["plagiarism", "citation", "paraphrase", "reference", "academic integrity"],
    answer: "Cite every non-original idea, data point, or quotation using required style (APA/Harvard/MLA). Paraphrase in your own structure and wording, then cite source. Keep a running source log while researching to avoid missing references later.",
  },
  {
    id: "presentation-skills",
    category: "writing",
    question: "How do I prepare for a class presentation?",
    keywords: ["presentation", "public speaking", "slides", "delivery"],
    answer: "Design slides with one message each, minimal text, and strong visuals. Script your opening and closing, then rehearse aloud with timer. Anticipate 5 likely questions and prepare short evidence-based responses.",
  },
  {
    id: "time-management",
    category: "productivity",
    question: "How can I manage study time with many deadlines?",
    keywords: ["time management", "deadline", "planning", "priorities"],
    answer: "Use urgency-impact prioritization weekly, then time-block your calendar daily. Break assignments into milestones (research, outline, draft, edit) with mini-deadlines. Keep a 20% buffer for unexpected tasks and avoid overbooking every hour.",
  },
  {
    id: "note-taking-method",
    category: "study-skills",
    question: "What is the best note-taking method for university?",
    keywords: ["note taking", "cornell", "lecture notes", "revision notes"],
    answer: "Use a two-pass method: capture quickly in class, then condense within 24 hours. Cornell format works well: notes, cue questions, summary. Prioritize key definitions, mechanisms, and examples over full transcript-style writing.",
  },
  {
    id: "memory-techniques",
    category: "study-skills",
    question: "How do mnemonics help memory?",
    keywords: ["mnemonic", "memory palace", "chunking", "revision"],
    answer: "Mnemonics compress information into memorable cues. Use acronyms for lists, chunking for grouped facts, and memory palace for ordered sequences. They work best when combined with active recall and spaced repetition, not as a standalone method.",
  },
  {
    id: "burnout-signs",
    category: "productivity",
    question: "How do I avoid study burnout?",
    keywords: ["burnout", "stress", "rest", "study balance"],
    answer: "Schedule recovery as seriously as study blocks: sleep, breaks, movement, and social time. Watch for warning signs like low concentration, irritability, and reduced performance despite longer hours. Reduce load temporarily and return with a sustainable plan.",
  },
  {
    id: "group-study",
    category: "study-skills",
    question: "Is group study effective?",
    keywords: ["group study", "collaboration", "peer learning"],
    answer: "Group study works when sessions are structured: define agenda, assign roles, and end with a mini-quiz. Use it for explanation and accountability, not first-time learning. Keep sessions short (45-90 min) and avoid large groups.",
  },
  {
    id: "interview-prep",
    category: "productivity",
    question: "How do I prepare for technical interviews?",
    keywords: ["technical interview", "coding interview", "behavioral", "prep"],
    answer: "Split prep into coding fundamentals, system thinking, and behavioral stories. Practice timed questions, explain your reasoning aloud, and review mistakes in a log. For behavioral rounds, prepare STAR examples for teamwork, conflict, and impact.",
  },
  {
    id: "default-study-advice",
    category: "study-skills",
    question: "General study improvement advice",
    keywords: ["study", "improve", "learning", "advice"],
    answer: "Use a cycle of learn -> recall -> apply -> review. After learning a concept, test yourself without notes, solve a question, and log mistakes. Weekly, revisit weak topics first and track progress with objective metrics (scores, completion, recall rate).",
  },
];

export let LOCAL_AI_ANSWERS: LocalAnswerEntry[] = BASE_LOCAL_AI_ANSWERS.map((entry) => ({
  ...entry,
  keywords: [...entry.keywords],
}));

/*
----------------------------------------------------------
Function: isValidLocalAnswerEntry

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- value: Input consumed by this routine during execution

Process:
1. Accepts and normalizes inputs before core processing
2. Applies relevant guards/validation to prevent invalid transitions
3. Executes primary logic path and handles expected edge conditions
4. Returns a deterministic output for the caller layer

Why Validation is Important:
Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

Returns:
A value/promise representing the outcome of the executed logic path.
----------------------------------------------------------
*/
function isValidLocalAnswerEntry(value: unknown): value is LocalAnswerEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LocalAnswerEntry>;
  return (
    typeof item.id === "string" &&
    typeof item.question === "string" &&
    typeof item.answer === "string" &&
    Array.isArray(item.keywords) &&
    item.keywords.every((keyword) => typeof keyword === "string") &&
    typeof item.category === "string" &&
    LOCAL_ANSWER_CATEGORIES.includes(item.category as LocalAnswerCategory)
  );
}

/*
----------------------------------------------------------
Function: persistLocalAnswers

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- None: Operates using closure/module state only

Process:
1. Accepts and normalizes inputs before core processing
2. Applies relevant guards/validation to prevent invalid transitions
3. Executes primary logic path and handles expected edge conditions
4. Returns a deterministic output for the caller layer

Why Validation is Important:
Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

Returns:
A value/promise representing the outcome of the executed logic path.
----------------------------------------------------------
*/
function persistLocalAnswers(): void {
  const dir = path.dirname(LOCAL_ANSWERS_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_ANSWERS_FILE, JSON.stringify(LOCAL_AI_ANSWERS, null, 2), "utf-8");
}

/*
----------------------------------------------------------
Function: initializeLocalAnswersStore

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- None: Operates using closure/module state only

Process:
1. Accepts and normalizes inputs before core processing
2. Applies relevant guards/validation to prevent invalid transitions
3. Executes primary logic path and handles expected edge conditions
4. Returns a deterministic output for the caller layer

Why Validation is Important:
Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

Returns:
A value/promise representing the outcome of the executed logic path.
----------------------------------------------------------
*/
function initializeLocalAnswersStore(): void {
  try {
    if (!fs.existsSync(LOCAL_ANSWERS_FILE)) {
      persistLocalAnswers();
      return;
    }

    const raw = fs.readFileSync(LOCAL_ANSWERS_FILE, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Local answers file does not contain an array");
    }

    const validEntries = parsed.filter(isValidLocalAnswerEntry);
    if (validEntries.length === 0) {
      throw new Error("Local answers file did not contain valid entries");
    }

    LOCAL_AI_ANSWERS = validEntries.map((entry) => ({
      ...entry,
      keywords: [...entry.keywords],
    }));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[Local AI Answers] Failed to load persisted answers (${reason}). Using defaults.`);
    LOCAL_AI_ANSWERS = BASE_LOCAL_AI_ANSWERS.map((entry) => ({
      ...entry,
      keywords: [...entry.keywords],
    }));
    try {
      persistLocalAnswers();
    } catch (persistError) {
      const persistReason = persistError instanceof Error ? persistError.message : String(persistError);
      console.warn(`[Local AI Answers] Failed to persist fallback defaults (${persistReason}).`);
    }
  }
}

initializeLocalAnswersStore();

/*
----------------------------------------------------------
Function: listLocalAnswers

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- search: Input consumed by this routine during execution

Process:
1. Accepts and normalizes inputs before core processing
2. Applies relevant guards/validation to prevent invalid transitions
3. Executes primary logic path and handles expected edge conditions
4. Returns a deterministic output for the caller layer

Why Validation is Important:
Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

Returns:
A value/promise representing the outcome of the executed logic path.
----------------------------------------------------------
*/
export function listLocalAnswers(search = ""): LocalAnswerEntry[] {
  const q = search.trim().toLowerCase();
  if (!q) {
    return [...LOCAL_AI_ANSWERS].sort((a, b) => a.question.localeCompare(b.question));
  }

  return LOCAL_AI_ANSWERS
    .filter((entry) => {
      const haystack = `${entry.question} ${entry.answer} ${entry.keywords.join(" ")} ${entry.category}`.toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => a.question.localeCompare(b.question));
}

/*
----------------------------------------------------------
Function: updateLocalAnswer

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- id: Input consumed by this routine during execution
- updates: Input consumed by this routine during execution

Process:
1. Accepts and normalizes inputs before core processing
2. Applies relevant guards/validation to prevent invalid transitions
3. Executes primary logic path and handles expected edge conditions
4. Returns a deterministic output for the caller layer

Why Validation is Important:
Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

Returns:
A value/promise representing the outcome of the executed logic path.
----------------------------------------------------------
*/
export function updateLocalAnswer(
  id: string,
  updates: Partial<Pick<LocalAnswerEntry, "question" | "answer" | "keywords" | "category">>,
): LocalAnswerEntry | null {
  const target = LOCAL_AI_ANSWERS.find((entry) => entry.id === id);
  if (!target) return null;

  if (typeof updates.question === "string" && updates.question.trim()) {
    target.question = updates.question.trim();
  }
  if (typeof updates.answer === "string" && updates.answer.trim()) {
    target.answer = updates.answer.trim();
  }
  if (Array.isArray(updates.keywords)) {
    target.keywords = updates.keywords
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }
  if (updates.category) {
    target.category = updates.category;
  }

  persistLocalAnswers();

  return { ...target };
}

/*
----------------------------------------------------------
Function: normalize

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- text: Input consumed by this routine during execution

Process:
1. Accepts and normalizes inputs before core processing
2. Applies relevant guards/validation to prevent invalid transitions
3. Executes primary logic path and handles expected edge conditions
4. Returns a deterministic output for the caller layer

Why Validation is Important:
Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

Returns:
A value/promise representing the outcome of the executed logic path.
----------------------------------------------------------
*/
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/*
----------------------------------------------------------
Function: findBestLocalAnswer

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- query: Input consumed by this routine during execution

Process:
1. Accepts and normalizes inputs before core processing
2. Applies relevant guards/validation to prevent invalid transitions
3. Executes primary logic path and handles expected edge conditions
4. Returns a deterministic output for the caller layer

Why Validation is Important:
Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

Returns:
A value/promise representing the outcome of the executed logic path.
----------------------------------------------------------
*/
export function findBestLocalAnswer(query: string): LocalAnswerEntry | null {
  const queryTokens = normalize(query);
  if (queryTokens.length === 0) return null;

  let best: { entry: LocalAnswerEntry; score: number } | null = null;

  for (const entry of LOCAL_AI_ANSWERS) {
    const targetTokens = new Set([
      ...normalize(entry.question),
      ...entry.keywords.flatMap((keyword) => normalize(keyword)),
    ]);

    const overlap = queryTokens.reduce((acc, token) => acc + (targetTokens.has(token) ? 1 : 0), 0);
    const coverage = overlap / Math.max(1, queryTokens.length);
    const score = overlap * 2 + coverage;

    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  return best && best.score >= 2.5 ? best.entry : null;
}
