/*
==========================================================
File: client/src/pages/research.tsx

Module: Insight Scout and Research

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Presentation Layer (Frontend UI)

System Interaction:
- Consumes API endpoints via query/mutation utilities and renders user-facing interfaces
- Collaborates with shared types to preserve frontend-backend contract integrity

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

import { useState, useRef, useEffect } from "react";
import {
  Send, Sparkles, StickyNote, BookOpen, HelpCircle, Copy, Check,
  Loader2, ChevronDown, ChevronRight, GraduationCap, BookMarked,
  Target, Brain, Zap, PenLine, RotateCcw, Search, Settings2,
  ThumbsUp, ThumbsDown, HelpingHand, ClipboardList, ArrowRight,
  FileText, History, Plus, Trash2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Deck, Quiz } from "@shared/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

type StudyIntent = "exam_prep" | "deep_understanding" | "assignment_writing" | "revision_recall" | "quick_clarification";
type SearchDepth = "quick" | "balanced" | "comprehensive";
type ResponseType = "explanation" | "summary" | "comparison" | "analysis" | "examples" | "study_tips" | "mistakes";
type ConfidenceLevel = "yes" | "unsure" | "no" | null;
type ResponseSource = "live_ai" | "local_fallback" | "mock_fallback" | "unknown";

interface InsightCard {
  id: string;
  query: string;
  title: string;
  content: string;
  intent: StudyIntent;
  responseType: ResponseType;
  source: ResponseSource;
  timestamp: Date;
  confidence: ConfidenceLevel;
  sections: {
    keyInsight: string;
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
}

interface ResearchConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

interface ResearchConversationMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
}

interface ResearchConversationDetail {
  conversation: ResearchConversation;
  messages: ResearchConversationMessage[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STUDY_INTENTS: { value: StudyIntent; label: string; icon: React.ElementType; description: string }[] = [
  { value: "exam_prep", label: "Exam Prep", icon: Target, description: "Key points, mark schemes, exam-ready" },
  { value: "deep_understanding", label: "Deep Understanding", icon: Brain, description: "Thorough explanations, build intuition" },
  { value: "assignment_writing", label: "Assignment Writing", icon: PenLine, description: "Academic rigour, structured arguments" },
  { value: "revision_recall", label: "Revision Aids", icon: RotateCcw, description: "Mnemonics, summaries, quick-reference" },
  { value: "quick_clarification", label: "Quick Clarification", icon: Zap, description: "Concise, direct answers" },
];

const PRACTICE_PROMPTS: Array<{
  query: string;
  intent: StudyIntent;
  responseType: ResponseType;
  searchDepth: SearchDepth;
}> = [
  {
    query: "Explain the light-dependent and Calvin cycle stages of photosynthesis with one exam-style trick question.",
    intent: "exam_prep",
    responseType: "explanation",
    searchDepth: "balanced",
  },
  {
    query: "Compare arrays, linked lists, and hash tables for insertion, lookup, and memory tradeoffs.",
    intent: "deep_understanding",
    responseType: "comparison",
    searchDepth: "comprehensive",
  },
  {
    query: "Give me a concise summary of natural selection with two misconceptions students often make.",
    intent: "revision_recall",
    responseType: "summary",
    searchDepth: "balanced",
  },
  {
    query: "How should I structure a 1500-word assignment on machine learning ethics with critical analysis?",
    intent: "assignment_writing",
    responseType: "analysis",
    searchDepth: "comprehensive",
  },
  {
    query: "What are practical examples of supply and demand in housing and labor markets?",
    intent: "deep_understanding",
    responseType: "examples",
    searchDepth: "balanced",
  },
  {
    query: "Give me revision-focused study tips for calculus derivatives and integrals in one page.",
    intent: "revision_recall",
    responseType: "study_tips",
    searchDepth: "quick",
  },
  {
    query: "What common mistakes do students make with binary search and Big-O notation?",
    intent: "exam_prep",
    responseType: "mistakes",
    searchDepth: "balanced",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/*
----------------------------------------------------------
Function: generateTitle

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
function generateTitle(query: string): string {
  const cleaned = query.replace(/^(explain|summarize|compare|analyze|show|how|what|why|when|where|describe|discuss)\s+(this\s+)?(concept|topic)?:?\s*/i, "").trim();
  const title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return title.length > 60 ? title.substring(0, 57) + "..." : title;
}

/*
----------------------------------------------------------
Function: parseInsightSections

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- content: Input consumed by this routine during execution

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
function parseInsightSections(content: string) {
  const sections = {
    keyInsight: "",
    explanation: "",
    examples: "",
    commonMistakes: "",
    examRelevance: "",
  };

  const headingAliases = {
    keyInsight: ["Key Insight", "Exam Snapshot", "Thesis Snapshot", "Memory Hook", "One-Line Answer"],
    explanation: ["Explanation", "Concept Breakdown", "Mark Scheme Points", "Argument Framework", "Direct Answer", "Recall Sheet"],
    examples: ["Examples", "Worked Example", "Quick Example", "Evidence & Sources", "Flash Recall Prompts"],
    commonMistakes: ["Common Mistakes", "Common Errors", "Common Mix-ups", "Pitfall", "Counterpoints"],
    examRelevance: ["Exam Relevance", "Assignment Use", "Next Step"],
  } as const;

  const allHeadings = Object.values(headingAliases).flat();

    /*
  ----------------------------------------------------------
  Function: escapeRegex

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
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    /*
  ----------------------------------------------------------
  Function: extractSection

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - aliases: Input consumed by this routine during execution

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
const extractSection = (aliases: readonly string[]) => {
    const aliasPattern = aliases.map(escapeRegex).join("|");
    const stopPattern = allHeadings.map(escapeRegex).join("|");
    const regex = new RegExp(
      `\\*\\*(?:${aliasPattern})\\*\\*[:\\s—\\-]*([\\s\\S]*?)(?=\\n##|\\n\\*\\*(?:${stopPattern})\\*\\*|$)`,
      "i",
    );
    return content.match(regex)?.[1]?.trim() || "";
  };

  sections.keyInsight = extractSection(headingAliases.keyInsight);
  sections.explanation = extractSection(headingAliases.explanation);
  sections.examples = extractSection(headingAliases.examples);
  sections.commonMistakes = extractSection(headingAliases.commonMistakes);
  sections.examRelevance = extractSection(headingAliases.examRelevance);

  // If no structured sections found, put everything in explanation
  if (!sections.keyInsight && !sections.explanation) {
    const firstLine = content.split("\n").find(l => l.trim().length > 0) || "";
    sections.keyInsight = firstLine.replace(/^#+\s*/, "").replace(/\*\*/g, "").substring(0, 200);
    sections.explanation = content;
  }

  return sections;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/*
----------------------------------------------------------
Component: ExpandableSection

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- title: Input consumed by this routine during execution
- Icon: Input consumed by this routine during execution
- content: Input consumed by this routine during execution
- defaultOpen: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
function ExpandableSection({ title, icon: Icon, content, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  content: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!content || content.trim().length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg hover:bg-amber-50/60 dark:hover:bg-amber-900/20 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-semibold text-muted-foreground group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
            {title}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 pl-10">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-slate-600 prose-p:dark:text-slate-400 prose-strong:text-foreground prose-code:bg-slate-100 prose-code:dark:bg-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-amber-700 prose-code:dark:text-amber-400 prose-pre:bg-slate-50 prose-pre:dark:bg-slate-800 prose-li:text-slate-600 prose-li:dark:text-slate-400 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/*
----------------------------------------------------------
Component: ConfidenceCheck

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- confidence: Input consumed by this routine during execution
- onSelect: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
function ConfidenceCheck({ confidence, onSelect }: {
  confidence: ConfidenceLevel;
  onSelect: (level: ConfidenceLevel) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-b-xl border-t border-slate-100 dark:border-slate-700/50">
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        Confident with this?
      </span>
      <div className="flex gap-1.5">
        {([
          { value: "yes" as const, icon: ThumbsUp, label: "Yes", activeClass: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-700" },
          { value: "unsure" as const, icon: HelpingHand, label: "Unsure", activeClass: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700" },
          { value: "no" as const, icon: ThumbsDown, label: "No", activeClass: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-700" },
        ]).map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(confidence === opt.value ? null : opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              confidence === opt.value
                ? opt.activeClass
                : "border-slate-200 dark:border-slate-600 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            aria-pressed={confidence === opt.value}
            aria-label={`Mark confidence as ${opt.label}`}
          >
            <opt.icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/*
----------------------------------------------------------
Component: InsightCardComponent

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- card: Input consumed by this routine during execution
- onSaveToNotes: Input consumed by this routine during execution
- onCreateFlashcard: Input consumed by this routine during execution
- onCreateQuiz: Input consumed by this routine during execution
- onConfidenceChange: Input consumed by this routine during execution
- onCopy: Input consumed by this routine during execution
- copiedId: Input consumed by this routine during execution
- isStreaming: Input consumed by this routine during execution

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
function InsightCardComponent({
  card,
  onSaveToNotes,
  onCreateFlashcard,
  onCreateQuiz,
  onConfidenceChange,
  onCopy,
  copiedId,
  isStreaming = false,
}: {
  card: InsightCard;
  onSaveToNotes: (content: string) => void;
  onCreateFlashcard: (content: string) => void;
  onCreateQuiz: (content: string) => void;
  onConfidenceChange: (id: string, level: ConfidenceLevel) => void;
  onCopy: (content: string, id: string) => void;
  copiedId: string | null;
  isStreaming?: boolean;
}) {
  const intentConfig = STUDY_INTENTS.find(i => i.value === card.intent);
  const IntentIcon = intentConfig?.icon || Brain;
  const sourceLabel =
    card.source === "live_ai"
      ? "Live AI"
      : card.source === "local_fallback"
      ? "Local Fallback"
      : card.source === "mock_fallback"
      ? "Mock Fallback"
      : "Source Pending";
  const sourceClassName =
    card.source === "live_ai"
      ? "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950"
      : card.source === "local_fallback"
      ? "border-blue-300 dark:border-blue-700 text-brand-primary dark:text-blue-400 bg-brand-primary/10 dark:bg-brand-primary/20"
      : card.source === "mock_fallback"
      ? "border-slate-300 dark:border-slate-600 text-muted-foreground bg-slate-50 dark:bg-slate-800"
      : "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950";

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Card Header */}
      <div className="px-5 pt-5 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200 truncate">
                {card.title}
                {isStreaming && <span className="inline-block w-1.5 h-4 bg-amber-500 animate-pulse ml-1.5 align-middle rounded-sm" />}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950">
                  <IntentIcon className="h-2.5 w-2.5 mr-1" />
                  {intentConfig?.label}
                </Badge>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-medium ${sourceClassName}`}>
                  {sourceLabel}
                </Badge>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {card.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insight - Always visible */}
        {card.sections.keyInsight && (
          <div className="mt-3 px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200/60 dark:border-amber-800/40">
            <div className="flex gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                {card.sections.keyInsight}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Sections */}
      <div className="px-2 pb-1 space-y-0.5">
        <ExpandableSection title="Explanation" icon={BookMarked} content={card.sections.explanation} defaultOpen={true} />
        <ExpandableSection title="Examples" icon={FileText} content={card.sections.examples} />
        <ExpandableSection title="Common Mistakes" icon={HelpCircle} content={card.sections.commonMistakes} />
        <ExpandableSection title="Exam Relevance" icon={Target} content={card.sections.examRelevance} />
      </div>

      {/* Action Buttons */}
      {!isStreaming && (
        <div className="px-4 py-3 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-700/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-border hover:bg-amber-50 dark:hover:bg-amber-950 hover:border-amber-300 dark:hover:border-amber-700 transition-colors" onClick={() => onSaveToNotes(card.content)}>
                <StickyNote className="h-3 w-3" /> Save to Notes
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save this insight as a note</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-border hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors" onClick={() => onCreateFlashcard(card.content)}>
                <BookOpen className="h-3 w-3" /> Generate Flashcards
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create flashcards from this insight</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-border hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-colors" onClick={() => onCreateQuiz(card.content)}>
                <HelpCircle className="h-3 w-3" /> Generate Quiz
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a quiz question from this insight</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-border hover:bg-sky-50 dark:hover:bg-sky-950 hover:border-sky-300 dark:hover:border-sky-700 transition-colors" onClick={() => onCopy(card.content, card.id)}>
                {copiedId === card.id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                {copiedId === card.id ? "Copied" : "Copy"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy full content</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Confidence Check */}
      {!isStreaming && (
        <ConfidenceCheck
          confidence={card.confidence}
          onSelect={(level) => onConfidenceChange(card.id, level)}
        />
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/*
----------------------------------------------------------
Component: Research

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- None: Operates using closure/module state only

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
export default function Research() {
  const [input, setInput] = useState("");
  const [studyIntent, setStudyIntent] = useState<StudyIntent>("deep_understanding");
  const [searchDepth, setSearchDepth] = useState<SearchDepth>("balanced");
  const [responseType, setResponseType] = useState<ResponseType>("explanation");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingQuery, setStreamingQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFlashcardDialog, setShowFlashcardDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState("");
  const [flashcardFront, setFlashcardFront] = useState("");
  const [flashcardBack, setFlashcardBack] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: decks = [] } = useQuery<Deck[]>({ queryKey: ["/api/decks"] });
  const { data: quizzes = [] } = useQuery<Quiz[]>({ queryKey: ["/api/quizzes"] });
  const { data: conversations = [] } = useQuery<ResearchConversation[]>({
    queryKey: ["/api/research/conversations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/research/conversations");
      return (await res.json()) as ResearchConversation[];
    },
    staleTime: 10000,
  });

  const { data: conversationDetail } = useQuery<ResearchConversationDetail>({
    queryKey: ["/api/research/conversations", currentConversationId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/research/conversations/${currentConversationId}`);
      return (await res.json()) as ResearchConversationDetail;
    },
    enabled: Boolean(currentConversationId),
    staleTime: 10000,
  });

  // ── Mutations ────────────────────────────────────────────────────────

  const saveToNotesMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/notes", {
        title: data.title,
        blocks: [{ type: "markdown", content: data.content }],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ title: "Saved to Notes", description: "Insight Scout result has been saved as a new note." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save to notes", variant: "destructive" });
    },
  });

  const createFlashcardMutation = useMutation({
    mutationFn: async (data: { deckId: string; front: string; back: string }) => {
      const res = await apiRequest("POST", `/api/decks/${data.deckId}/cards`, {
        front: data.front,
        back: data.back,
        type: "basic",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setShowFlashcardDialog(false);
      setFlashcardFront("");
      setFlashcardBack("");
      setSelectedDeckId("");
      toast({ title: "Flashcard Created", description: "Your flashcard has been added to the deck." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create flashcard", variant: "destructive" });
    },
  });

  const createQuizQuestionMutation = useMutation({
    mutationFn: async (data: { quizId: string; question: string; answer: string }) => {
      const res = await apiRequest("POST", `/api/quizzes/${data.quizId}/questions`, {
        question: data.question,
        type: "mcq",
        difficulty: 3,
        marks: 1,
        explanation: "Generated from Insight Scout research.",
        options: [
          { text: data.answer, isCorrect: true },
          { text: "Option B (edit this)", isCorrect: false },
        ],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setShowQuizDialog(false);
      setQuizQuestion("");
      setQuizAnswer("");
      setSelectedQuizId("");
      toast({ title: "Quiz Question Created", description: "Your question has been added to the quiz." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create quiz question", variant: "destructive" });
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/research/conversations", { title });
      return (await res.json()) as ResearchConversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research/conversations"] });
    },
  });

  const addMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; role: "user" | "assistant" | "system"; content: string }) => {
      const res = await apiRequest("POST", `/api/research/conversations/${data.conversationId}/messages`, {
        role: data.role,
        content: data.content,
      });
      return await res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/research/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/research/conversations", variables.conversationId] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/research/conversations/${conversationId}`);
    },
    onSuccess: (_data, conversationId) => {
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setInsightCards([]);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/research/conversations"] });
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!conversationDetail || !currentConversationId) return;

    const loadedCards: InsightCard[] = [];
    const messages = conversationDetail.messages;

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role !== "assistant") continue;

      const userQuery = [...messages.slice(0, index)].reverse().find((m) => m.role === "user")?.content || "Previous query";

      loadedCards.push({
        id: `history-${message.id}`,
        query: userQuery,
        title: generateTitle(userQuery),
        content: message.content,
        intent: "deep_understanding",
        responseType: "explanation",
        source: "unknown",
        timestamp: new Date(message.createdAt),
        confidence: null,
        sections: parseInsightSections(message.content),
      });
    }

    setInsightCards(loadedCards);
  }, [conversationDetail, currentConversationId]);

    /*
  ----------------------------------------------------------
  Function: getConversationTitle

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
const getConversationTitle = (query: string) =>
    query.replace(/\s+/g, " ").trim().slice(0, 72) || "New Conversation";

    /*
  ----------------------------------------------------------
  Function: handleCopy

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - content: Input consumed by this routine during execution
  - id: Input consumed by this routine during execution

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
const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: "Copied!", description: "Content copied to clipboard." });
    } catch {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
    }
  };

    /*
  ----------------------------------------------------------
  Function: handleSaveToNotes

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - content: Input consumed by this routine during execution

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
const handleSaveToNotes = (content: string) => {
    const title = content.split("\n")[0]?.substring(0, 50) || "Insight Scout Result";
    saveToNotesMutation.mutate({ title: title.replace(/[#*]/g, "").trim(), content });
  };

    /*
  ----------------------------------------------------------
  Function: openFlashcardDialog

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - content: Input consumed by this routine during execution

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
const openFlashcardDialog = (content: string) => {
    const lines = content.split("\n").filter(l => l.trim());
    setFlashcardFront(lines[0]?.substring(0, 200).replace(/[#*]/g, "").trim() || "Key Concept");
    setFlashcardBack(lines.slice(1).join("\n").substring(0, 500) || content.substring(0, 500));
    setSelectedContent(content);
    setShowFlashcardDialog(true);
  };

    /*
  ----------------------------------------------------------
  Function: openQuizDialog

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - content: Input consumed by this routine during execution

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
const openQuizDialog = (content: string) => {
    const lines = content.split("\n").filter(l => l.trim());
    setQuizQuestion(lines[0]?.substring(0, 200).replace(/[#*]/g, "").trim() || content.substring(0, 200));
    setQuizAnswer(lines.slice(1, 3).join(" ").substring(0, 150) || "Correct answer");
    setSelectedContent(content);
    setShowQuizDialog(true);
  };

    /*
  ----------------------------------------------------------
  Function: handleConfidenceChange

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - cardId: Input consumed by this routine during execution
  - level: Input consumed by this routine during execution

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
const handleConfidenceChange = (cardId: string, level: ConfidenceLevel) => {
    setInsightCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, confidence: level } : c
    ));
    if (level) {
      toast({
        title: level === "yes" ? "Great!" : level === "unsure" ? "Noted" : "Let's revisit",
        description: level === "yes"
          ? "Topic marked as confident."
          : level === "unsure"
          ? "We'll suggest this topic for revision."
          : "Consider reviewing this topic again.",
      });
    }
  };

    /*
  ----------------------------------------------------------
  Function: handleSend

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
const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const query = input.trim();
    const cardId = `insight-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    let activeConversationId = currentConversationId;

    if (!activeConversationId) {
      try {
        const created = await createConversationMutation.mutateAsync(getConversationTitle(query));
        activeConversationId = created.id;
        setCurrentConversationId(created.id);
      } catch {
        toast({ title: "Error", description: "Failed to create chat history entry", variant: "destructive" });
        return;
      }
    }

    if (!activeConversationId) {
      return;
    }

    setInput("");
    setStreamingContent("");
    setStreamingQuery(query);
    setIsStreaming(true);

    let fullContent = "";
    let finalSource: ResponseSource = "unknown";

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("/api/research/query", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          searchDepth,
          responseType,
          studyIntent,
          conversationId: activeConversationId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send query");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }
                if (data.done && typeof data.source === "string") {
                  if (data.source === "live_ai" || data.source === "local_fallback" || data.source === "mock_fallback") {
                    finalSource = data.source;
                  }
                }
                if (data.error) {
                  toast({ title: "Error", description: data.error, variant: "destructive" });
                }
              } catch {
                // ignore incomplete JSON
              }
            }
          }
        }
      }

      // Stream done — build the card
      const sections = parseInsightSections(fullContent);
      const newCard: InsightCard = {
        id: cardId,
        query,
        title: generateTitle(query),
        content: fullContent,
        intent: studyIntent,
        responseType,
        source: finalSource,
        timestamp: new Date(),
        confidence: null,
        sections,
      };

      setInsightCards(prev => [newCard, ...prev]);

      await addMessageMutation.mutateAsync({
        conversationId: activeConversationId,
        role: "user",
        content: query,
      });

      await addMessageMutation.mutateAsync({
        conversationId: activeConversationId,
        role: "assistant",
        content: fullContent,
      });
    } catch {
      toast({ title: "Error", description: "Failed to process your research query", variant: "destructive" });
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      setStreamingQuery("");
    }
  };

  // Auto-scroll to top when new card appears
  useEffect(() => {
    if (scrollRef.current && insightCards.length > 0) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [insightCards.length]);

  // Build streaming card for preview
  const streamingCard: InsightCard | null = isStreaming && streamingContent ? {
    id: "streaming",
    query: streamingQuery,
    title: generateTitle(streamingQuery),
    content: streamingContent,
    intent: studyIntent,
    responseType,
    source: "unknown",
    timestamp: new Date(),
    confidence: null,
    sections: parseInsightSections(streamingContent),
  } : null;

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-indigo-50 dark:from-slate-950 dark:via-sky-950/30 dark:to-indigo-950/30 relative">
      {/* Subtle paper grid texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.02]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(180,160,120,0.3) 24px),
                          repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(180,160,120,0.3) 24px)`,
        backgroundSize: "24px 24px",
      }} />

      {/* ─── LEFT PANEL: Question & Controls ─── */}
      <div className="w-full md:w-[380px] md:min-w-[340px] md:max-w-[420px] border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col relative z-10 max-h-[50vh] md:max-h-none">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">Insight Scout</h1>
              <p className="text-[11px] text-muted-foreground font-medium">Insight Canvas</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {/* Study Intent Selector */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="h-3 w-3" />
                Study Intent
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {STUDY_INTENTS.map((intent) => {
                  const Icon = intent.icon;
                  const isActive = studyIntent === intent.value;
                  return (
                    <button
                      key={intent.value}
                      onClick={() => setStudyIntent(intent.value)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        isActive
                          ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/60 border border-amber-300 dark:border-amber-700 shadow-sm"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                      }`}
                      aria-pressed={isActive}
                    >
                      <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                      }`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${isActive ? "text-amber-800 dark:text-amber-300" : "text-muted-foreground"}`}>
                          {intent.label}
                        </p>
                        <p className={`text-[10px] leading-tight ${isActive ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>
                          {intent.description}
                        </p>
                      </div>
                      {isActive && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Input */}
            <div className="px-5 py-4 space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Search className="h-3 w-3" />
                Your Question
              </label>
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="What would you like to understand?"
                disabled={isStreaming}
                className="min-h-[100px] resize-none border-2 border-border focus-visible:ring-amber-500 focus-visible:border-amber-400 rounded-lg text-sm bg-card"
                data-testid="input-research-question"
              />

              <Button
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 font-semibold h-10 rounded-lg"
                data-testid="button-send-message"
              >
                {isStreaming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Ask Insight Scout
                  </>
                )}
              </Button>

              {/* Advanced Options - collapsible */}
              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded">
                    <Settings2 className="h-3 w-3" />
                    Advanced Options
                    {advancedOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-3 p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Search Depth</label>
                      <Select value={searchDepth} onValueChange={(v) => setSearchDepth(v as SearchDepth)}>
                        <SelectTrigger className="h-8 text-xs" data-testid="select-search-depth">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quick">Quick — Brief & focused</SelectItem>
                          <SelectItem value="balanced">Balanced — Well-structured</SelectItem>
                          <SelectItem value="comprehensive">Comprehensive — In-depth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Response Type</label>
                      <Select value={responseType} onValueChange={(v) => setResponseType(v as ResponseType)}>
                        <SelectTrigger className="h-8 text-xs" data-testid="select-response-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="explanation">Explanation</SelectItem>
                          <SelectItem value="summary">Summary</SelectItem>
                          <SelectItem value="comparison">Comparison</SelectItem>
                          <SelectItem value="analysis">Analysis</SelectItem>
                          <SelectItem value="examples">Real-World Examples</SelectItem>
                          <SelectItem value="study_tips">Study Tips</SelectItem>
                          <SelectItem value="mistakes">Common Mistakes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="h-3 w-3" />
                    Chat History
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentConversationId(null);
                      setInsightCards([]);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  >
                    <Plus className="h-3 w-3" />
                    New Chat
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-card">
                  {conversations.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No previous chats yet.</p>
                  ) : (
                    <div className="p-1.5 space-y-1">
                      {conversations.map((conversation) => {
                        const isActiveConversation = currentConversationId === conversation.id;
                        return (
                          <div
                            key={conversation.id}
                            className={`flex items-center gap-1 rounded-md border ${
                              isActiveConversation
                                ? "border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/30"
                                : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentConversationId(conversation.id);
                                setInsightCards([]);
                              }}
                              className="flex-1 text-left px-2 py-1.5 text-xs text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                              data-testid={`button-conversation-${conversation.id}`}
                            >
                              <p className="truncate font-medium">{conversation.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(conversation.updatedAt).toLocaleString()}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!deleteConversationMutation.isPending) {
                                  deleteConversationMutation.mutate(conversation.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                              aria-label="Delete conversation"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3">
                <p className="text-[10px] text-center text-slate-400 dark:text-slate-600">
                  Powered by AI. Verify responses for academic work.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ─── RIGHT PANEL: Insight Canvas ─── */}
      <div className="flex-1 flex flex-col relative z-10 min-h-0">
        {/* Canvas Header */}
        <div className="px-3 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-bold text-muted-foreground">Insight Canvas</h2>
              {insightCards.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                  {insightCards.length} insight{insightCards.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {insightCards.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Clear all insights from this session?")) {
                    setInsightCards([]);
                  }
                }}
                className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-2 py-1"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Insight Cards */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-6 space-y-5 max-w-3xl mx-auto">
            {/* Empty State */}
            {!isStreaming && insightCards.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 sm:py-20 px-4 sm:px-8 text-center">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center mb-6 shadow-inner">
                  <GraduationCap className="h-10 w-10 text-amber-500 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Your Insight Canvas
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
                  Ask a question on the left to generate structured insight cards.
                  Each response is broken down into expandable sections for focused study.
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xl">
                  {PRACTICE_PROMPTS.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setStudyIntent(suggestion.intent);
                        setResponseType(suggestion.responseType);
                        setSearchDepth(suggestion.searchDepth);
                        setInput(suggestion.query);
                        inputRef.current?.focus();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground bg-white dark:bg-slate-800 border border-border hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <ArrowRight className="h-3 w-3 text-amber-500 shrink-0" />
                      {suggestion.query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Streaming Card (at top since cards are newest-first) */}
            {streamingCard && (
              <InsightCardComponent
                card={streamingCard}
                onSaveToNotes={handleSaveToNotes}
                onCreateFlashcard={openFlashcardDialog}
                onCreateQuiz={openQuizDialog}
                onConfidenceChange={handleConfidenceChange}
                onCopy={handleCopy}
                copiedId={copiedId}
                isStreaming={true}
              />
            )}

            {/* Completed Insight Cards */}
            {insightCards.map((card) => (
              <InsightCardComponent
                key={card.id}
                card={card}
                onSaveToNotes={handleSaveToNotes}
                onCreateFlashcard={openFlashcardDialog}
                onCreateQuiz={openQuizDialog}
                onConfidenceChange={handleConfidenceChange}
                onCopy={handleCopy}
                copiedId={copiedId}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ─── Dialogs ─── */}
      <Dialog open={showFlashcardDialog} onOpenChange={setShowFlashcardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Flashcard from Insight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Deck</Label>
              <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                <SelectTrigger data-testid="select-flashcard-deck">
                  <SelectValue placeholder="Choose a deck" />
                </SelectTrigger>
                <SelectContent>
                  {decks.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>{deck.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Front (Question/Term)</Label>
              <Textarea
                value={flashcardFront}
                onChange={(e) => setFlashcardFront(e.target.value)}
                placeholder="Enter the question or term..."
                className="min-h-[80px]"
                data-testid="input-flashcard-front"
              />
            </div>
            <div className="space-y-2">
              <Label>Back (Answer/Definition)</Label>
              <Textarea
                value={flashcardBack}
                onChange={(e) => setFlashcardBack(e.target.value)}
                placeholder="Enter the answer or definition..."
                className="min-h-[120px]"
                data-testid="input-flashcard-back"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlashcardDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createFlashcardMutation.mutate({
                deckId: selectedDeckId,
                front: flashcardFront,
                back: flashcardBack,
              })}
              disabled={!selectedDeckId || !flashcardFront.trim() || !flashcardBack.trim() || createFlashcardMutation.isPending}
              data-testid="button-save-flashcard"
            >
              {createFlashcardMutation.isPending ? "Creating..." : "Create Flashcard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quiz Question from Insight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Quiz</Label>
              <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                <SelectTrigger data-testid="select-quiz">
                  <SelectValue placeholder="Choose a quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
                placeholder="Enter the question..."
                className="min-h-[80px]"
                data-testid="input-quiz-question"
              />
            </div>
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Textarea
                value={quizAnswer}
                onChange={(e) => setQuizAnswer(e.target.value)}
                placeholder="Enter the correct answer..."
                className="min-h-[60px]"
                data-testid="input-quiz-answer"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Creates a multiple choice question. Add more options in the Quizzes section.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuizDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createQuizQuestionMutation.mutate({
                quizId: selectedQuizId,
                question: quizQuestion,
                answer: quizAnswer,
              })}
              disabled={!selectedQuizId || !quizQuestion.trim() || !quizAnswer.trim() || createQuizQuestionMutation.isPending}
              data-testid="button-save-quiz-question"
            >
              {createQuizQuestionMutation.isPending ? "Creating..." : "Create Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
