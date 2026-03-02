/*
==========================================================
File: client/src/pages/quizzes.tsx

Module: Quiz and Assessment

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

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Play, Clock, CheckCircle2, AlertCircle, Star, BookMarked, Zap, Trophy, Target, RotateCw, Loader, Trash2, X, Brain, TrendingUp, TrendingDown, BarChart3, RefreshCw, ChevronRight, Lightbulb, FileText, Layers, GraduationCap, Flame, CalendarCheck, Rocket, Medal, Crown, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useQuizAnalytics } from "@/hooks/use-quiz-analytics";
import { safeNumberFallback } from "@/lib/analytics-utils";
import { AnalyticsStatCard, InsightCard, ActivityCard } from "@/components/analytics-cards";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QuizMode = "practice" | "exam" | "adaptive";
type ViewType = "list" | "taking" | "results" | "create" | "analytics" | "adaptive" | "review";

interface Quiz {
  id: string;
  title: string;
  subject?: string | null;
  description?: string | null;
  mode: string;
  timeLimit?: number | null;
  passingScore?: number | null;
  questionCount: number;
  attemptCount: number;
  bestScore?: number | null;
}

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface Question {
  id: string;
  quizId: string;
  type: string;
  question: string;
  difficulty: number;
  marks: number;
  explanation?: string | null;
  markScheme?: string | null;
  correctAnswer?: string | null;
  options?: QuizOption[];
  order: number;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  mode: string;
  score?: number | null;
  status?: string | null;
  currentDifficulty?: number | null;
  completedAt?: string | null;
}

interface UserAnalytics {
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  avgTimePerQuestion: number;
  totalStudyTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  strengths: { topic: string; accuracy: number; questionsAnswered: number; avgTimeSeconds: number; quizzesTaken: number }[];
  weaknesses: { topic: string; accuracy: number; questionsAnswered: number; avgTimeSeconds: number; quizzesTaken: number }[];
  performanceByDifficulty: { level: string; accuracy: number; questionsAnswered: number }[];
  topicBreakdown: { topic: string; accuracy: number; questionsAnswered: number; quizzesTaken: number; avgTimeSeconds: number }[];
  recentActivity: { date: string; quizTitle: string; topic: string; score: number; maxScore: number; accuracy: number }[];
}

interface SpacedReviewItem {
  id: string;
  questionId: string;
  question: Question;
  quizTitle: string;
  nextReviewAt: string;
  status: string;
  streak: number;
}

const questionFormSchema = z.object({
  type: z.enum(["mcq", "saq", "laq"]),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).default(["", "", "", ""]),
  correctOptionIndex: z.number().default(0),
  explanation: z.string().default(""),
  difficulty: z.number().min(1).max(5).default(3),
  correctAnswer: z.string().default(""),
});

const quizFormSchema = z.object({
  userId: z.string().default("anonymous"),
  title: z.string().min(1, "Title is required"),
  subject: z.string().default(""),
  description: z.string().default(""),
  mode: z.enum(["practice", "exam"]).default("practice"),
  timeLimit: z.union([z.number().min(1).max(180), z.literal("")]).default(15),
  passingScore: z.union([z.number().min(0).max(100), z.literal("")]).default(50),
  questions: z.array(questionFormSchema).min(1, "At least one question is required"),
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

/*
----------------------------------------------------------
Component: Quizzes

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
export default function Quizzes() {
  const [location] = useLocation();
  const [view, setView] = useState<ViewType>("list");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState("");
  const [userAnswers, setUserAnswers] = useState<Array<{questionId: string, answer: string, correct: boolean, explanation?: string}>>([]);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [feedbackExplanation, setFeedbackExplanation] = useState<string>("");
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("quizzes");
  
  // Filtering state
  const [selectedSubject, setSelectedSubject] = useState<string>("All Subjects");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<Question | null>(null);
  const [adaptiveQuestionNumber, setAdaptiveQuestionNumber] = useState(1);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(3);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<Array<{correct: boolean, difficulty: number}>>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const tab = new URL(window.location.href).searchParams.get("tab");
    const validTabs = ["quizzes", "analytics", "review"];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      userId: "anonymous",
      title: "",
      subject: "",
      description: "",
      mode: "practice",
      timeLimit: 15,
      passingScore: 50,
      questions: [{
        type: "mcq",
        question: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        explanation: "",
        difficulty: 3,
        correctAnswer: ""
      }],
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const { data: allQuizzes = [], isLoading: isLoadingQuizzes, refetch: refetchQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/quizzes");
      const data = await res.json();
      
      // DEFENSIVE: Deduplicate by ID
      const seenIds = new Set<string>();
      const uniqueQuizzes = data.filter((quiz: Quiz) => {
        if (seenIds.has(quiz.id)) {
          console.warn(`[QUIZZES] ⚠️  Duplicate quiz detected: ${quiz.title} (${quiz.id})`);
          return false;
        }
        seenIds.add(quiz.id);
        return true;
      });
      
      // VALIDATION: Check count constraints (increased to 20 for multi-subject support)
      if (uniqueQuizzes.length > 20) {
        console.warn(`[QUIZZES] ⚠️  WARNING: ${uniqueQuizzes.length} quizzes found (max 20 expected)`);
      } else if (uniqueQuizzes.length < 15 && uniqueQuizzes.length > 0) {
        console.warn(`[QUIZZES] ⚠️  WARNING: Only ${uniqueQuizzes.length} quizzes found (15-20 expected for multi-subject)`);
      }
      
      console.log(`[QUIZZES] ✅ Loaded ${uniqueQuizzes.length} unique quizzes`);
      return uniqueQuizzes;
    },
    staleTime: 0, // Always refetch to ensure fresh data when navigating back
    refetchOnMount: true,
    retry: 1,
  });
  
  // Extract unique subjects from quizzes
  const availableSubjects = ["All Subjects", ...Array.from(new Set(allQuizzes.map(q => q.subject || "General").filter(Boolean)))].sort();
  
  // Filter quizzes based on selected subject and search query
  const quizzes = allQuizzes.filter(quiz => {
    const matchesSubject = selectedSubject === "All Subjects" || quiz.subject === selectedSubject || (!quiz.subject && selectedSubject === "General");
    const matchesSearch = !searchQuery || 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (quiz.subject && quiz.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  const { data: selectedQuizData, isLoading: isLoadingQuiz } = useQuery<{
    id: string;
    title: string;
    subject?: string;
    timeLimit?: number;
    questions: Question[];
  }>({
    queryKey: ["/api/quizzes", selectedQuizId],
    enabled: !!selectedQuizId && (view === "taking" || view === "adaptive"),
    retry: 1,
  });

  // Single source of truth for analytics — useQuizAnalytics hook
  // fetches from /api/user/analytics with staleTime: 0 for live updates
  const {
    summary,
    strengths,
    areasToImprove,
    recentActivity,
    quizPerformance,
    performanceByDifficulty,
    smartInsights,
    studyOverview,
    isLoading: analyticsFetching,
  } = useQuizAnalytics();

  const { data: spacedReviewItems = [], isLoading: isLoadingReview, refetch: refetchReview } = useQuery<SpacedReviewItem[]>({
    queryKey: ["/api/spaced-review/due"],
    enabled: activeTab === "review",
    retry: 1,
  });

  const quizXp = summary.totalQuizzesTaken * 25 + summary.totalQuestionsAnswered + Math.round(summary.overallAccuracy * 1.8) + studyOverview.currentStreak * 12;
  const learnerLevel = Math.max(1, Math.floor(quizXp / 140) + 1);
  const levelFloorXp = (learnerLevel - 1) * 140;
  const levelCeilXp = learnerLevel * 140;
  const levelProgress = Math.min(100, Math.round(((quizXp - levelFloorXp) / Math.max(levelCeilXp - levelFloorXp, 1)) * 100));

  const quizGoalProgress = Math.min(100, Math.round((summary.totalQuizzesTaken / 20) * 100));
  const questionGoalProgress = Math.min(100, Math.round((summary.totalQuestionsAnswered / 250) * 100));
  const streakGoalProgress = Math.min(100, Math.round((studyOverview.currentStreak / 14) * 100));
  const accuracyGoalProgress = Math.min(100, Math.round((summary.overallAccuracy / 85) * 100));

  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        summary.overallAccuracy * 0.45 +
          Math.min(summary.totalQuizzesTaken, 20) * 2.0 +
          Math.min(studyOverview.currentStreak, 14) * 1.5
      )
    )
  );

  // Remove duplicate refetch - query already fetches on mount
  // useEffect(() => {
  //   refetchQuizzes();
  // }, []);

  useEffect(() => {
    if (selectedQuizData?.questions && view === "taking") {
      setActiveQuestions(selectedQuizData.questions);
      if (selectedQuizData.timeLimit) {
        setTimeLeft(selectedQuizData.timeLimit * 60);
      }
    }
  }, [selectedQuizData, view]);

  useEffect(() => {
    if (view === "taking" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleQuizComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [view]);

  const handleQuizComplete = useCallback(async () => {
    if (currentAttempt && !currentAttempt.completedAt) {
      try {
        const responses = userAnswers.map(a => ({
          questionId: a.questionId,
          selectedOptionId: a.answer,
          textAnswer: a.answer,
          isCorrect: a.correct,
        }));
        
        // Include auth token for API request
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        await fetch(`/api/attempts/${currentAttempt.id}/submit`, {
          method: "POST",
          headers,
          body: JSON.stringify({ responses, timeSpent: Math.round((Date.now() - startTimeRef.current) / 1000) }),
        });
      } catch (error) {
        console.error("Failed to submit quiz:", error);
      }
    }
    setView("results");
  }, [currentAttempt, userAnswers]);

  const createQuizMutation = useMutation({
    mutationFn: async (data: QuizFormValues) => {
      console.log("[QUIZZES] Create Quiz mutation started");
      console.log("[QUIZZES] Handler entered - quiz data:", data.title);
      const token = localStorage.getItem("token");
      console.log("[QUIZZES] Auth check - token exists:", !!token);
      
      const formattedQuestions = data.questions.filter(q => q.question.trim()).map((q, index) => {
        if (q.type === "mcq") {
          return {
            type: q.type,
            question: q.question,
            difficulty: q.difficulty,
            marks: 1,
            explanation: q.explanation || "",
            order: index,
            options: q.options.filter(o => o.trim()).map((text, i) => ({
              text,
              isCorrect: i === q.correctOptionIndex,
            }))
          };
        } else {
          return {
            type: q.type,
            question: q.question,
            difficulty: q.difficulty,
            marks: q.type === "saq" ? 2 : 4,
            explanation: q.explanation || "",
            correctAnswer: q.correctAnswer || "",
            order: index,
          };
        }
      });

      const payload = {
        userId: data.userId,
        title: data.title,
        subject: data.subject || null,
        description: data.description || null,
        mode: data.mode,
        timeLimit: data.timeLimit === "" ? null : data.timeLimit,
        passingScore: data.passingScore === "" ? null : data.passingScore,
        questions: formattedQuestions,
      };

      // Use apiRequest to include auth token
      console.log("[QUIZZES API] Sending POST /api/quizzes", payload);
      const response = await apiRequest("POST", "/api/quizzes", payload);
      console.log("[QUIZZES API] Response status:", response.status);
      const result = await response.json();
      console.log("[QUIZZES API] Response data:", result);
      return result;
    },
    onSuccess: () => {
      console.log("[QUIZZES] Create quiz SUCCESS");
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setView("list");
      form.reset();
    },
    onError: (error) => {
      console.error("[QUIZZES] Create quiz ERROR:", error);
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      console.log("[QUIZZES] Delete Quiz mutation started - quizId:", quizId);
      const token = localStorage.getItem("token");
      console.log("[QUIZZES] Auth check - token exists:", !!token);
      console.log("[QUIZZES API] Sending DELETE /api/quizzes/:id");
      // Use apiRequest to include auth token
      await apiRequest("DELETE", `/api/quizzes/${quizId}`);
      console.log("[QUIZZES API] Delete SUCCESS");
    },
    onSuccess: () => {
      console.log("[QUIZZES] Delete quiz SUCCESS");
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
    },
    onError: (error) => {
      console.error("[QUIZZES] Delete quiz ERROR:", error);
    }
  });

    /*
  ----------------------------------------------------------
  Function: onSubmit

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - values: Input consumed by this routine during execution

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
const onSubmit = (values: QuizFormValues) => {
    createQuizMutation.mutate(values);
  };

    /*
  ----------------------------------------------------------
  Function: addQuestionField

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
const addQuestionField = () => {
    appendQuestion({
      type: "mcq",
      question: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      explanation: "",
      difficulty: 3,
      correctAnswer: ""
    });
  };

    /*
  ----------------------------------------------------------
  Function: removeQuestionField

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - index: Input consumed by this routine during execution

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
const removeQuestionField = (index: number) => {
    if (questionFields.length > 1) {
      removeQuestion(index);
    }
  };

    /*
  ----------------------------------------------------------
  Function: startQuiz

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - quizId: Input consumed by this routine during execution
  - mode: Input consumed by this routine during execution

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
const startQuiz = async (quizId: string, mode: QuizMode = "practice") => {
    setSelectedQuizId(quizId);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedAnswer("");
    setTextAnswer("");
    setShowFeedback(false);
    setAnswerError(null);
    startTimeRef.current = Date.now();
    
    try {
      // Include auth token for API request
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const response = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ mode }),
      });
      if (response.ok) {
        const attempt = await response.json();
        setCurrentAttempt(attempt);
      }
    } catch (error) {
      console.error("Failed to create attempt:", error);
    }
    
    setView("taking");
  };

    /*
  ----------------------------------------------------------
  Function: startAdaptiveQuiz

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - quizId: Input consumed by this routine during execution

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
const startAdaptiveQuiz = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setAdaptiveAnswers([]);
    setAdaptiveQuestionNumber(1);
    setAdaptiveDifficulty(3);
    setSelectedAnswer("");
    setTextAnswer("");
    setShowFeedback(false);
    setAnswerError(null);
    startTimeRef.current = Date.now();
    
    try {
      // Include auth token for API request
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const response = await fetch(`/api/quizzes/${quizId}/adaptive-attempt`, {
        method: "POST",
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentAttempt(data.attempt);
        setAdaptiveQuestionNumber(data.questionNumber);
        
        if (data.currentQuestion) {
          setAdaptiveQuestion(data.currentQuestion);
        }
      }
    } catch (error) {
      console.error("Failed to start adaptive quiz:", error);
    }
    
    setView("adaptive");
  };

    /*
  ----------------------------------------------------------
  Function: handleAnswerSubmit

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - answerOptionId: Input consumed by this routine during execution

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
const handleAnswerSubmit = async (answerOptionId?: string) => {
    console.log("[QUIZZES] Answer Submit button clicked");
    
    // Use passed answer or fall back to state
    const effectiveAnswer = answerOptionId ?? selectedAnswer;
    
    if (isSubmitting || !currentAttempt) {
      console.log("[QUIZZES] Submit blocked - isSubmitting:", isSubmitting, "hasAttempt:", !!currentAttempt);
      return;
    }
    
    if (!effectiveAnswer && activeQuestions[currentQuestion]?.type === "mcq") {
      console.log("[QUIZZES] No answer selected");
      setAnswerError("Please select an answer before submitting.");
      return;
    }
    
    console.log("[QUIZZES] Handler entered - submitting answer");
    
    setIsSubmitting(true);
    setAnswerError(null);
    
    const question = activeQuestions[currentQuestion];
    const responseTime = Math.round((Date.now() - startTimeRef.current) / 1000);
    const token = localStorage.getItem("token");
    console.log("[QUIZZES] Auth check - token exists:", !!token);
    
    try {
      // Include auth token for API request
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      console.log("[QUIZZES API] Sending POST /api/attempts/:id/answer", { questionId: question.id, selectedAnswer: effectiveAnswer });
      const response = await fetch(`/api/attempts/${currentAttempt.id}/answer`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          questionId: question.id,
          selectedOptionId: question.type === "mcq" ? effectiveAnswer : null,
          textAnswer: question.type !== "mcq" ? textAnswer : null,
          responseTime,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setAnswerError(errorText || "Failed to submit answer. Please try again.");
        return;
      }

      const data = await response.json();
      const isCorrect = !!data.isCorrect;
      setFeedbackCorrect(isCorrect);
      setFeedbackExplanation(data.explanation || "");
      setShowFeedback(true);
      setAnswerError(null);
      
      // Update selected answer state to match what was submitted
      if (answerOptionId) {
        setSelectedAnswer(answerOptionId);
      }
      
      setUserAnswers([...userAnswers, {
        questionId: question.id,
        answer: question.type === "mcq" ? effectiveAnswer : textAnswer,
        correct: isCorrect,
        explanation: data.explanation,
      }]);
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setAnswerError("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

    /*
  ----------------------------------------------------------
  Function: handleNextQuestion

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
const handleNextQuestion = async () => {
    if (currentQuestion < activeQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
      setTextAnswer("");
      setShowFeedback(false);
      setAnswerError(null);
      startTimeRef.current = Date.now();
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      await finalizeQuizAttempt();
      setView("results");
    }
  };

    /*
  ----------------------------------------------------------
  Function: finalizeQuizAttempt

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
const finalizeQuizAttempt = async () => {
    console.log("[QUIZZES] Finalize Quiz Attempt called");
    if (!currentAttempt) {
      console.log("[QUIZZES] Finalize blocked - no attempt");
      return;
    }
    console.log("[QUIZZES] Handler entered - attemptId:", currentAttempt.id);
    
    const token = localStorage.getItem("token");
    console.log("[QUIZZES] Auth check - token exists:", !!token);
    
    try {
      // Include auth token for API request
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      console.log("[QUIZZES API] Sending POST /api/attempts/:id/submit", { timeSpent });
      const response = await fetch(`/api/attempts/${currentAttempt.id}/submit`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          responses: [],
          timeSpent,
        }),
      });
      console.log("[QUIZZES API] Response status:", response.status);
      console.log("[QUIZZES] Finalize SUCCESS - Quiz completed, invalidating analytics");
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spaced-review/due"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spaced-review/queue"] });
      console.log("[ANALYTICS] Queries invalidated, analytics should refetch");
    } catch (error) {
      console.error("[QUIZZES] Finalize ERROR:", error);
    }
  };

    /*
  ----------------------------------------------------------
  Function: handleAdaptiveAnswer

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - answerOptionId: Input consumed by this routine during execution

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
const handleAdaptiveAnswer = async (answerOptionId?: string) => {
    console.log("[QUIZZES] Adaptive Answer button clicked");
    
    // Use passed answer or fall back to state
    const effectiveAnswer = answerOptionId ?? selectedAnswer;
    
    if (isSubmitting || !currentAttempt || !adaptiveQuestion) {
      console.log("[QUIZZES] Adaptive submit blocked - isSubmitting:", isSubmitting, "hasAttempt:", !!currentAttempt, "hasQuestion:", !!adaptiveQuestion);
      return;
    }
    
    if (!effectiveAnswer && adaptiveQuestion.type === "mcq") {
      console.log("[QUIZZES] No answer selected");
      return;
    }
    
    console.log("[QUIZZES] Handler entered - submitting adaptive answer");
    setIsSubmitting(true);
    
    const token = localStorage.getItem("token");
    console.log("[QUIZZES] Auth check - token exists:", !!token);
    
    const responseTime = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    try {
      // Include auth token for API request
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      console.log("[QUIZZES API] Sending POST /api/attempts/:id/adaptive-answer", { questionId: adaptiveQuestion.id, selectedAnswer: effectiveAnswer });
      const response = await fetch(`/api/attempts/${currentAttempt.id}/adaptive-answer`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          questionId: adaptiveQuestion.id,
          selectedOptionId: adaptiveQuestion.type === "mcq" ? effectiveAnswer : null,
          textAnswer: adaptiveQuestion.type !== "mcq" ? textAnswer : null,
          responseTime,
        }),
      });
      console.log("[QUIZZES API] Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("[QUIZZES] Adaptive answer SUCCESS - isCorrect:", data.isCorrect, "completed:", data.completed);
        setFeedbackCorrect(data.isCorrect);
        setFeedbackExplanation(data.explanation || "");
        setShowFeedback(true);
        
        // Update selected answer state to match what was submitted
        if (answerOptionId) {
          setSelectedAnswer(answerOptionId);
        }
        
        setAdaptiveAnswers([...adaptiveAnswers, {
          correct: data.isCorrect,
          difficulty: adaptiveDifficulty,
        }]);
        
        if (data.completed) {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/analytics"] });
            queryClient.invalidateQueries({ queryKey: ["/api/spaced-review/due"] });
            queryClient.invalidateQueries({ queryKey: ["/api/spaced-review/queue"] });
            setUserAnswers(adaptiveAnswers.map((a, i) => ({
              questionId: `adaptive-${i}`,
              answer: "",
              correct: a.correct,
            })));
            setView("results");
          }, 2000);
        } else {
          setTimeout(() => {
            if (data.nextQuestion) {
              setAdaptiveQuestion(data.nextQuestion);
            }
            setAdaptiveQuestionNumber(data.questionNumber);
            setAdaptiveDifficulty(data.currentDifficulty);
            setSelectedAnswer("");
            setTextAnswer("");
            setShowFeedback(false);
            startTimeRef.current = Date.now();
          }, 2000);
        }
      } else {
        console.error("[QUIZZES] Adaptive answer ERROR - response not ok");
      }
    } catch (error) {
      console.error("[QUIZZES] Adaptive answer ERROR:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

    /*
  ----------------------------------------------------------
  Function: handleSpacedReview

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - statsId: Input consumed by this routine during execution
  - quality: Input consumed by this routine during execution

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
const handleSpacedReview = async (statsId: string, quality: number) => {
    console.log("[QUIZZES] Spaced Review button clicked - statsId:", statsId, "quality:", quality);
    console.log("[QUIZZES] Handler entered - submitting review");
    const token = localStorage.getItem("token");
    console.log("[QUIZZES] Auth check - token exists:", !!token);
    
    try {
      // Include auth token for API request
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      console.log("[QUIZZES API] Sending POST /api/spaced-review/:id/review", { quality });
      const response = await fetch(`/api/spaced-review/${statsId}/review`, {
        method: "POST",
        headers,
        body: JSON.stringify({ quality }),
      });
      console.log("[QUIZZES API] Response status:", response.status);
      console.log("[QUIZZES] Spaced review SUCCESS");
      refetchReview();
    } catch (error) {
      console.error("[QUIZZES] Spaced review ERROR:", error);
    }
  };

    /*
  ----------------------------------------------------------
  Function: formatTime

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - seconds: Input consumed by this routine during execution

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
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (view === "results") {
    const isAdaptiveResult = adaptiveAnswers.length > 0;
    const totalQuestions = isAdaptiveResult ? adaptiveAnswers.length : (activeQuestions.length || 1);
    const correctAnswers = isAdaptiveResult 
      ? adaptiveAnswers.filter(a => a.correct).length 
      : userAnswers.filter(a => a.correct).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    let scoreColor = "from-red-500 to-red-600";
    let scoreLabel = "Keep Trying!";
    if (score >= 90) {
      scoreColor = "from-brand-primary to-brand-accent";
      scoreLabel = "Perfect!";
    } else if (score >= 75) {
      scoreColor = "from-brand-primary to-brand-accent";
      scoreLabel = "Great Job!";
    } else if (score >= 50) {
      scoreColor = "from-yellow-500 to-orange-600";
      scoreLabel = "Good Effort!";
    }

    return (
      <div className="flex-1 overflow-auto bg-gradient-to-br from-fuchsia-50 via-rose-50 to-purple-50 dark:from-slate-950 dark:via-fuchsia-950/35 dark:to-slate-900">
        <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          <div className={`bg-gradient-to-r ${scoreColor} rounded-2xl p-4 sm:p-8 text-white text-center shadow-lg`}>
            <div className="mb-4 flex justify-center gap-2 animate-bounce">
              <Trophy className="h-8 w-8" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-sm sm:text-lg opacity-90">You scored {correctAnswers} out of {totalQuestions} questions correctly</p>
          </div>

          <Card className="border-2 border-brand-primary/30 dark:border-brand-primary/40 shadow-lg">
            <CardContent className="pt-6 sm:pt-8 text-center">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">Your Score</p>
                  <div className={`text-5xl sm:text-7xl font-bold bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent mb-4`}>
                    {score}%
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}>
                    {scoreLabel}
                  </p>
                </div>
                <Progress value={score} className="h-4 bg-slate-200 dark:bg-slate-800" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-success/30 dark:border-success/40">
              <CardContent className="pt-4 sm:pt-6 text-center">
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-success dark:text-green-400 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-success dark:text-green-300">{correctAnswers}</div>
                <p className="text-xs sm:text-sm text-success dark:text-green-400 font-medium">Correct</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-destructive/30 dark:border-destructive/40">
              <CardContent className="pt-4 sm:pt-6 text-center">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive dark:text-red-400 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-destructive dark:text-red-300">{totalQuestions - correctAnswers}</div>
                <p className="text-xs sm:text-sm text-destructive dark:text-red-400 font-medium">Incorrect</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-brand-primary/30 dark:border-brand-primary/40">
              <CardContent className="pt-4 sm:pt-6 text-center">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-brand-primary dark:text-blue-400 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-brand-primary dark:text-blue-300">+{correctAnswers * 10}</div>
                <p className="text-xs sm:text-sm text-brand-primary dark:text-blue-400 font-medium">XP Earned</p>
              </CardContent>
            </Card>
          </div>

          {userAnswers.length > 0 && activeQuestions.length > 0 && (
            <Card className="border-2 border-brand-primary/30 dark:border-brand-primary/40">
              <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-brand-primary/20 dark:to-brand-accent/20 rounded-t-lg">
                <CardTitle className="text-2xl">Review Your Answers</CardTitle>
                <CardDescription>Learn from your mistakes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {activeQuestions.map((question, index) => {
                  const userAnswer = userAnswers[index];
                  const isCorrect = userAnswer?.correct;

                  return (
                    <div key={question.id} className={`border-2 rounded-xl p-4 space-y-3 ${isCorrect ? 'border-green-400 bg-success/10 dark:bg-success/20' : 'border-red-400 bg-red-50 dark:bg-red-950/30'}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="h-6 w-6 text-success shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">Question {index + 1}</span>
                            <Badge variant="outline">{question.type.toUpperCase()}</Badge>
                          </div>
                          <p className="text-sm mb-3">{question.question}</p>
                          {userAnswer?.explanation && (
                            <div className="mt-3 p-3 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg text-sm border-l-4 border-blue-500">
                              <div className="font-medium mb-1 text-brand-primary dark:text-blue-400">Explanation:</div>
                              <p>{userAnswer.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-2"
              onClick={() => {
                setView("list");
                setSelectedQuizId(null);
                setCurrentAttempt(null);
                setActiveQuestions([]);
                setUserAnswers([]);
                setAdaptiveAnswers([]);
              }}
              data-testid="button-back-to-quizzes"
            >
              Back to Quizzes
            </Button>
            {selectedQuizId && (
              <Button
                className="flex-1 bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white"
                onClick={() => startQuiz(selectedQuizId)}
                data-testid="button-retake-quiz"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "adaptive") {
    if (!adaptiveQuestion) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-rose-50 to-purple-50 dark:from-slate-950 dark:via-fuchsia-950/35 dark:to-slate-900">
          <div className="text-center">
            <Loader className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Loading adaptive quiz...</p>
          </div>
        </div>
      );
    }

    const question = adaptiveQuestion;
    const progress = (adaptiveQuestionNumber / 10) * 100;

    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-fuchsia-50 via-rose-50 to-purple-50 dark:from-slate-950 dark:via-fuchsia-950/35 dark:to-slate-900">
        <div className="border-b-2 border-brand-primary/30 dark:border-brand-primary/40 bg-card shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white gap-1 border-0 px-2 sm:px-3 py-1 text-xs">
                <Brain className="h-3 w-3" />
                <span className="hidden sm:inline">Adaptive Mode</span>
                <span className="sm:hidden">Adaptive</span>
              </Badge>
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Question</p>
                <p className="text-sm sm:text-lg font-bold text-brand-primary dark:text-brand-accent">
                  {adaptiveQuestionNumber}/10
                </p>
              </div>
            </div>

            <div className="flex-1 mx-2 sm:mx-4">
              <Progress value={progress} className="h-2 sm:h-3 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium">Difficulty:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Star
                    key={level}
                    className={`h-4 w-4 ${
                      level <= adaptiveDifficulty
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-3 sm:p-8 overflow-auto">
          <div className="w-full max-w-4xl">
            <div className="bg-card rounded-2xl shadow-xl p-4 sm:p-8 mb-6 border-2 border-brand-primary/30 dark:border-brand-primary/40">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="outline" className="text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700">
                  {question.type.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < question.difficulty
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <h2 className="text-xl sm:text-3xl font-bold text-foreground leading-relaxed mb-6 sm:mb-8">
                {question.question}
              </h2>

              {question.type === "mcq" && question.options ? (
                <div className="space-y-4">
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === option.id;
                    const isCorrectOption = option.isCorrect;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => !showFeedback && handleAdaptiveAnswer(option.id)}
                        disabled={showFeedback || isSubmitting}
                        className={`w-full p-3 sm:p-5 rounded-xl font-semibold text-sm sm:text-lg transition-all duration-300 cursor-pointer text-left border-2 flex items-center gap-3 ${
                          showFeedback && isCorrectOption
                            ? 'border-green-500 bg-green-100 dark:bg-success/20 text-green-900 dark:text-green-100 scale-105 shadow-lg'
                            : showFeedback && isSelected && !isCorrectOption
                            ? 'border-red-500 bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100 scale-95 shadow-lg'
                            : isSelected && !showFeedback
                            ? 'border-orange-500 bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-100 shadow-lg'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900'
                        }`}
                        data-testid={`adaptive-option-${index}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                          showFeedback && isCorrectOption
                            ? 'bg-success/100 text-white'
                            : showFeedback && isSelected && !isCorrectOption
                            ? 'bg-red-500 text-white'
                            : isSelected && !showFeedback
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-300 dark:bg-slate-600 text-muted-foreground'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{option.text}</span>
                        {showFeedback && isCorrectOption && <CheckCircle2 className="h-6 w-6 text-success" />}
                        {showFeedback && isSelected && !isCorrectOption && <AlertCircle className="h-6 w-6 text-destructive" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={showFeedback}
                  placeholder="Write your answer here..."
                  className="min-h-40 p-4 rounded-lg border-2"
                  data-testid="adaptive-textarea-answer"
                />
              )}
            </div>

            {showFeedback && (
              <div className={`p-6 rounded-xl mb-6 text-center text-lg font-bold text-white ${
                feedbackCorrect 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' 
                  : 'bg-gradient-to-r from-red-500 to-pink-600 shadow-lg'
              }`}>
                <div className="mb-2">{feedbackCorrect ? 'Correct!' : 'Incorrect'}</div>
                {feedbackExplanation && (
                  <div className="text-sm font-normal opacity-90">{feedbackExplanation}</div>
                )}
                <div className="text-sm font-normal mt-2 opacity-75">
                  {feedbackCorrect 
                    ? `Difficulty increasing to ${Math.min(5, adaptiveDifficulty + 1)}` 
                    : `Difficulty decreasing to ${Math.max(1, adaptiveDifficulty - 1)}`}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setView("list");
                  setSelectedQuizId(null);
                  setAdaptiveQuestion(null);
                }}
                className="border-2"
                data-testid="button-exit-adaptive"
              >
                Exit Quiz
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  void handleAdaptiveAnswer();
                }}
                disabled={showFeedback || isSubmitting || (question.type === "mcq" ? !selectedAnswer : !textAnswer.trim())}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-8"
                data-testid="button-submit-adaptive"
              >
                {isSubmitting ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit Answer"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "taking") {
    if (isLoadingQuiz || activeQuestions.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-rose-50 to-purple-50 dark:from-slate-950 dark:via-fuchsia-950/35 dark:to-slate-900">
          <div className="text-center">
            <Loader className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Loading quiz...</p>
          </div>
        </div>
      );
    }

    const question = activeQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / activeQuestions.length) * 100;

    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-fuchsia-50 via-rose-50 to-purple-50 dark:from-slate-950 dark:via-fuchsia-950/35 dark:to-slate-900">
        <div className="border-b-2 border-brand-primary/30 dark:border-brand-primary/40 bg-card shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge className="bg-gradient-to-r from-brand-primary to-brand-accent text-white gap-1 border-0 px-2 sm:px-3 py-1 text-xs">
                <Target className="h-3 w-3" />
                <span className="hidden sm:inline">Practice Mode</span>
                <span className="sm:hidden">Practice</span>
              </Badge>
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Question</p>
                <p className="text-sm sm:text-lg font-bold text-brand-primary dark:text-brand-accent">
                  {currentQuestion + 1}/{activeQuestions.length}
                </p>
              </div>
            </div>

            <div className="flex-1 mx-2 sm:mx-4">
              <Progress value={progress} className="h-2 sm:h-3 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className={`text-center px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-mono font-bold text-sm sm:text-lg ${
              timeLeft < 60 
                ? 'bg-red-100 dark:bg-red-950 text-destructive dark:text-red-300' 
                : 'bg-blue-100 dark:bg-brand-primary/20 text-brand-primary dark:text-blue-300'
            }`}>
              <Clock className="h-4 w-4 inline mr-1" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-3 sm:p-8 overflow-auto">
          <div className="w-full max-w-4xl">
            <div className="bg-card rounded-2xl shadow-xl p-4 sm:p-8 mb-6 border-2 border-brand-primary/30 dark:border-brand-primary/40">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="outline" className="text-brand-primary dark:text-brand-accent border-brand-primary/40 dark:border-brand-primary/50">
                  {question.type.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < question.difficulty
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <h2 className="text-xl sm:text-3xl font-bold text-foreground leading-relaxed mb-6 sm:mb-8">
                {question.question}
              </h2>

              {question.type === "mcq" && question.options ? (
                <div className="space-y-4">
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === option.id;
                    const isCorrectOption = option.isCorrect;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => !showFeedback && handleAnswerSubmit(option.id)}
                        disabled={showFeedback || isSubmitting}
                        className={`w-full p-3 sm:p-5 rounded-xl font-semibold text-sm sm:text-lg transition-all duration-300 cursor-pointer text-left border-2 flex items-center gap-3 ${
                          showFeedback && isCorrectOption
                            ? 'border-green-500 bg-green-100 dark:bg-success/20 text-green-900 dark:text-green-100 scale-105 shadow-lg'
                            : showFeedback && isSelected && !isCorrectOption
                            ? 'border-red-500 bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100 scale-95 shadow-lg'
                            : isSelected && !showFeedback
                            ? 'border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-accent shadow-lg'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-foreground hover:border-brand-accent hover:bg-brand-accent/10 dark:hover:bg-brand-accent/20'
                        }`}
                        data-testid={`option-${index}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                          showFeedback && isCorrectOption
                            ? 'bg-success/100 text-white'
                            : showFeedback && isSelected && !isCorrectOption
                            ? 'bg-red-500 text-white'
                            : isSelected && !showFeedback
                            ? 'bg-brand-primary text-white'
                            : 'bg-slate-300 dark:bg-slate-600 text-muted-foreground'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{option.text}</span>
                        {showFeedback && isCorrectOption && <CheckCircle2 className="h-6 w-6 text-success" />}
                        {showFeedback && isSelected && !isCorrectOption && <AlertCircle className="h-6 w-6 text-destructive" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={showFeedback}
                  placeholder={
                    question.type === "saq"
                      ? "Write your short answer here (2-3 sentences)..."
                      : "Write your detailed answer here..."
                  }
                  className={`min-h-40 p-4 rounded-lg border-2 ${question.type === "laq" ? "min-h-56" : ""}`}
                  data-testid="textarea-answer"
                />
              )}
            </div>

            {showFeedback && (
              <div className={`p-6 rounded-xl mb-6 text-white ${
                feedbackCorrect 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' 
                  : 'bg-gradient-to-r from-red-500 to-pink-600 shadow-lg'
              }`}>
                <div className="text-center text-lg font-bold mb-2">
                  {feedbackCorrect ? 'Correct!' : 'Incorrect'}
                </div>
                {feedbackExplanation && (
                  <div className="text-sm font-normal text-center opacity-90">{feedbackExplanation}</div>
                )}
              </div>
            )}

            {answerError && (
              <div className="p-4 rounded-lg mb-6 border-2 border-red-300 bg-red-50 text-red-800 text-sm font-medium">
                {answerError}
              </div>
            )}

            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setView("list");
                  setSelectedQuizId(null);
                }}
                className="border-2"
                data-testid="button-exit-quiz"
              >
                Exit Quiz
              </Button>
              
              {!showFeedback ? (
                <Button
                  size="lg"
                  onClick={() => {
                    void handleAnswerSubmit();
                  }}
                  disabled={isSubmitting || (question.type === "mcq" ? !selectedAnswer : !textAnswer.trim())}
                  className="bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white px-8"
                  data-testid="button-submit-answer"
                >
                  {isSubmitting ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    "Submit Answer"
                  )}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleNextQuestion}
                  className="bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white px-8"
                  data-testid="button-next"
                >
                  {currentQuestion === activeQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "create") {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-br from-fuchsia-50 via-rose-50 to-purple-50 dark:from-slate-950 dark:via-fuchsia-950/35 dark:to-slate-900">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="bg-gradient-to-r from-brand-primary via-brand-primary to-brand-accent rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Create New Quiz</h1>
                <p className="text-lg opacity-90">Build your own custom quiz</p>
              </div>
              <Button
                variant="outline"
                onClick={() => { setView("list"); form.reset(); }}
                className="border-white/30 text-white hover:bg-white/20"
                data-testid="button-cancel-create"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="border-2 border-brand-primary/30 dark:border-brand-primary/40">
                <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-brand-primary/20 dark:to-brand-accent/20">
                  <CardTitle>Quiz Details</CardTitle>
                  <CardDescription>Set up the basic information for your quiz</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter quiz title" {...field} data-testid="input-quiz-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Mathematics, Science" {...field} data-testid="input-quiz-subject" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe what this quiz covers..." {...field} data-testid="input-quiz-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Mode</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-quiz-mode">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="practice">Practice</SelectItem>
                              <SelectItem value="exam">Exam</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Limit (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={180}
                              value={field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === "" ? "" : Number(val));
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              data-testid="input-time-limit" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passingScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passing Score (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              max={100}
                              value={field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val === "" ? "" : Number(val));
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              data-testid="input-passing-score" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-brand-primary/30 dark:border-brand-primary/40">
                <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-brand-primary/20 dark:to-brand-accent/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>Questions</CardTitle>
                      <CardDescription>Add your quiz questions</CardDescription>
                    </div>
                    <Badge variant="outline">{questionFields.length} question(s)</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {questionFields.map((field, qIndex) => {
                    const questionType = form.watch(`questions.${qIndex}.type`);
                    const correctOptionIndex = form.watch(`questions.${qIndex}.correctOptionIndex`);
                    
                    return (
                      <div key={field.id} className="border-2 border-border rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="font-bold text-lg">Question {qIndex + 1}</h3>
                          <div className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`questions.${qIndex}.type`}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger className="w-32" data-testid={`select-question-type-${qIndex}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mcq">MCQ</SelectItem>
                                    <SelectItem value="saq">Short Answer</SelectItem>
                                    <SelectItem value="laq">Long Answer</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                            {questionFields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeQuestionField(qIndex)}
                                className="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                                data-testid={`button-remove-question-${qIndex}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name={`questions.${qIndex}.question`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Text *</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter your question..." {...field} data-testid={`input-question-text-${qIndex}`} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {questionType === "mcq" && (
                          <div className="space-y-3">
                            <FormLabel>Answer Options</FormLabel>
                            {[0, 1, 2, 3].map((oIndex) => (
                              <div key={oIndex} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                                  correctOptionIndex === oIndex
                                    ? 'bg-success/100 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                }`}>
                                  {String.fromCharCode(65 + oIndex)}
                                </div>
                                <FormField
                                  control={form.control}
                                  name={`questions.${qIndex}.options.${oIndex}`}
                                  render={({ field }) => (
                                    <FormControl>
                                      <Input 
                                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`} 
                                        {...field} 
                                        data-testid={`input-option-${qIndex}-${oIndex}`} 
                                      />
                                    </FormControl>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant={correctOptionIndex === oIndex ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => form.setValue(`questions.${qIndex}.correctOptionIndex`, oIndex)}
                                  className={correctOptionIndex === oIndex ? "bg-success/100 hover:bg-green-600" : ""}
                                  data-testid={`button-correct-${qIndex}-${oIndex}`}
                                >
                                  {correctOptionIndex === oIndex ? "Correct" : "Set Correct"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {(questionType === "saq" || questionType === "laq") && (
                          <FormField
                            control={form.control}
                            name={`questions.${qIndex}.correctAnswer`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Correct Answer / Key Points</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter the correct answer or key points for grading..." 
                                    {...field}
                                    data-testid={`input-correct-answer-${qIndex}`} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`questions.${qIndex}.difficulty`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Difficulty</FormLabel>
                                <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-difficulty-${qIndex}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="1">Very Easy</SelectItem>
                                    <SelectItem value="2">Easy</SelectItem>
                                    <SelectItem value="3">Medium</SelectItem>
                                    <SelectItem value="4">Hard</SelectItem>
                                    <SelectItem value="5">Very Hard</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`questions.${qIndex}.explanation`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Explanation (shown after answering)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Explain the correct answer..." 
                                    {...field}
                                    data-testid={`input-explanation-${qIndex}`} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestionField}
                    className="w-full border-2 border-dashed border-brand-primary/40 dark:border-brand-primary/50 text-brand-primary dark:text-brand-accent hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20"
                    data-testid="button-add-question"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Question
                  </Button>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-2"
                  onClick={() => { setView("list"); form.reset(); }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white"
                  disabled={createQuizMutation.isPending}
                  data-testid="button-create-quiz"
                >
                  {createQuizMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Create Quiz
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-fuchsia-50 via-rose-50 to-purple-50 dark:from-slate-950 dark:via-fuchsia-950/35 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
        <div className="bg-gradient-to-r from-brand-primary via-brand-primary to-brand-accent rounded-2xl p-4 sm:p-8 text-white shadow-xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2">Quizzes</h1>
              <p className="text-sm sm:text-lg opacity-90 max-w-2xl">Test your knowledge with interactive quizzes, adaptive learning, and spaced repetition</p>
            </div>
            <Button
              onClick={() => setView("create")}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              data-testid="button-create-quiz-hero"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
            <TabsTrigger value="quizzes" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-quizzes">
              <BookMarked className="h-4 w-4 hidden sm:block" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-review">
              <RefreshCw className="h-4 w-4 hidden sm:block" />
              Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes">
            {/* Filter Bar */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search quizzes by title or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border-2 border-brand-primary/30 dark:border-brand-primary/40 focus:border-brand-primary dark:focus:border-brand-accent"
                  />
                </div>
                
                {/* Subject Filter */}
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full sm:w-48 border-2 border-brand-primary/30 dark:border-brand-primary/40">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Active Filters Display */}
              {(selectedSubject !== "All Subjects" || searchQuery) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {selectedSubject !== "All Subjects" && (
                    <Badge 
                      variant="secondary" 
                      className="bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent cursor-pointer hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30"
                      onClick={() => setSelectedSubject("All Subjects")}
                    >
                      {selectedSubject}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge 
                      variant="secondary" 
                      className="bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent cursor-pointer hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30"
                      onClick={() => setSearchQuery("")}
                    >
                      Search: "{searchQuery}"
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSubject("All Subjects");
                      setSearchQuery("");
                    }}
                    className="text-xs h-7"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
            
            {isLoadingQuizzes ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-brand-primary" />
              </div>
            ) : quizzes.length === 0 && allQuizzes.length === 0 ? (
              <Card className="border-2 border-dashed border-brand-primary/40 dark:border-brand-primary/50">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center mb-4">
                    <BookMarked className="h-8 w-8 text-brand-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Quizzes Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first quiz to get started</p>
                  <Button
                    onClick={() => setView("create")}
                    className="bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white"
                    data-testid="button-create-first-quiz"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Quiz
                  </Button>
                </CardContent>
              </Card>
            ) : quizzes.length === 0 ? (
              <Card className="border-2 border-brand-primary/30 dark:border-brand-primary/40">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-brand-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Quizzes Match Your Filter</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your filters or search query</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSubject("All Subjects");
                      setSearchQuery("");
                    }}
                    className="border-brand-primary/40 dark:border-brand-primary/50"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* DEFENSIVE: Ensure unique keys and prevent duplicate rendering */}
                {quizzes
                  .filter((quiz, index, self) => 
                    index === self.findIndex((q) => q.id === quiz.id)
                  )
                  .map((quiz) => (
                  <Card
                    key={quiz.id}
                    className="border-2 border-brand-primary/30 dark:border-brand-primary/40 hover:shadow-lg transition-shadow"
                    data-testid={`card-quiz-${quiz.id}`}
                  >
                    <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-brand-primary/20 dark:to-brand-accent/20 rounded-t-lg pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-lg truncate">{quiz.title}</CardTitle>
                          <CardDescription className="text-xs">{quiz.subject || "General"}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-brand-primary dark:text-brand-accent border-brand-primary/40 dark:border-brand-primary/50 shrink-0">
                          {quiz.mode}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <div className="text-2xl font-bold text-brand-primary dark:text-brand-accent">{quiz.questionCount}</div>
                          <div className="text-muted-foreground text-xs">Questions</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-brand-primary dark:text-blue-300">{quiz.attemptCount}</div>
                          <div className="text-muted-foreground text-xs">Attempts</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-success dark:text-green-300">
                            {quiz.bestScore !== null ? `${quiz.bestScore}%` : "-"}
                          </div>
                          <div className="text-muted-foreground text-xs">Best</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => startQuiz(quiz.id)}
                          className="flex-1 bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white"
                          data-testid={`button-start-quiz-${quiz.id}`}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Practice
                        </Button>
                        <Button
                          onClick={() => startAdaptiveQuiz(quiz.id)}
                          variant="outline"
                          className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
                          data-testid={`button-adaptive-${quiz.id}`}
                        >
                          <Brain className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteQuizMutation.mutate(quiz.id)}
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                          data-testid={`button-delete-quiz-${quiz.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {analyticsFetching ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-brand-primary" />
              </div>
            ) : summary.totalQuizzesTaken > 0 ? (
              <div className="space-y-6">
                <Card className="border-2 border-brand-primary/30 dark:border-brand-primary/40 bg-gradient-to-br from-brand-primary/10 via-white to-brand-accent/15 dark:from-brand-primary/20 dark:via-slate-900 dark:to-brand-accent/20">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3 text-brand-primary dark:text-brand-accent">
                      <span className="flex items-center gap-2">
                        <Rocket className="h-5 w-5" />
                        Quiz Mission Control
                      </span>
                      <Badge className="bg-gradient-to-r from-brand-primary to-brand-accent text-white border-0">Level {learnerLevel}</Badge>
                    </CardTitle>
                    <CardDescription>Progression-first analytics designed to keep your quiz practice consistent and rewarding.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-lg border border-brand-primary/30 bg-brand-primary/10 p-3">
                        <p className="text-xs text-muted-foreground">Quiz XP</p>
                        <p className="text-2xl font-bold text-brand-primary dark:text-brand-accent">{quizXp}</p>
                      </div>
                      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3">
                        <p className="text-xs text-muted-foreground">Readiness Score</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{readinessScore}%</p>
                      </div>
                      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3">
                        <p className="text-xs text-muted-foreground">Current Streak</p>
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{studyOverview.currentStreak}d</p>
                      </div>
                      <div className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 p-3">
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">{summary.overallAccuracy}%</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">Level Progress</span>
                        <span className="text-muted-foreground">{quizXp - levelFloorXp}/{Math.max(levelCeilXp - levelFloorXp, 1)} XP</span>
                      </div>
                      <Progress value={levelProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <Card className="border border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">20 Quiz Milestone</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-brand-primary dark:text-brand-accent">{summary.totalQuizzesTaken}/20</p>
                      <Progress value={quizGoalProgress} className="mt-2 h-2" />
                    </CardContent>
                  </Card>
                  <Card className="border border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">250 Questions Goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-brand-primary dark:text-brand-accent">{summary.totalQuestionsAnswered}/250</p>
                      <Progress value={questionGoalProgress} className="mt-2 h-2" />
                    </CardContent>
                  </Card>
                  <Card className="border border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">14-Day Consistency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{studyOverview.currentStreak}/14</p>
                      <Progress value={streakGoalProgress} className="mt-2 h-2" />
                    </CardContent>
                  </Card>
                  <Card className="border border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">85% Mastery Target</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.overallAccuracy}%</p>
                      <Progress value={accuracyGoalProgress} className="mt-2 h-2" />
                    </CardContent>
                  </Card>
                </div>

                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Medal className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
                      Reward Track
                    </CardTitle>
                    <CardDescription>Unlock badges by building consistency and quiz volume.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`rounded-lg border p-4 ${summary.totalQuizzesTaken >= 5 ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40" : "border-border bg-muted/30"}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Bronze Learner</p>
                        <Star className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Complete 5 quizzes</p>
                    </div>
                    <div className={`rounded-lg border p-4 ${summary.totalQuizzesTaken >= 12 ? "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40" : "border-border bg-muted/30"}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Silver Strategist</p>
                        <Sparkles className="h-4 w-4 text-slate-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Complete 12 quizzes</p>
                    </div>
                    <div className={`rounded-lg border p-4 ${summary.totalQuizzesTaken >= 20 && summary.overallAccuracy >= 80 ? "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/40" : "border-border bg-muted/30"}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Gold Champion</p>
                        <Crown className="h-4 w-4 text-yellow-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">20 quizzes + 80% accuracy</p>
                    </div>
                  </CardContent>
                </Card>

                {quizPerformance.length > 0 && (
                  <Card className="border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
                        Quiz Mastery Ladder
                      </CardTitle>
                      <CardDescription>Ranked quiz topics by sustained average performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {quizPerformance
                          .sort((a, b) => b.averageAccuracy - a.averageAccuracy)
                          .map((quiz) => {
                            const isStrong = quiz.averageAccuracy >= 75;
                            const isWeak = quiz.averageAccuracy < 60;
                            return (
                              <div key={quiz.quizId} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{quiz.quizTitle}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {quiz.attempts} attempt{quiz.attempts !== 1 ? "s" : ""} · {quiz.topic}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    {quiz.attempts > 1 && (
                                      <span className="text-xs text-muted-foreground">
                                        Best: {quiz.bestAccuracy}%
                                      </span>
                                    )}
                                    <Badge className={`${
                                      isStrong ? "bg-emerald-600 hover:bg-emerald-700"
                                        : isWeak ? "bg-rose-600 hover:bg-rose-700"
                                        : "bg-amber-600 hover:bg-amber-700"
                                    } text-white`}>
                                      {quiz.averageAccuracy}%
                                    </Badge>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      isStrong ? "bg-emerald-500"
                                        : isWeak ? "bg-rose-500"
                                        : "bg-amber-500"
                                    }`}
                                    style={{ width: `${Math.min(quiz.averageAccuracy, 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Difficulty Performance */}
                {performanceByDifficulty.some(d => d.questionsAnswered > 0) && (
                  <Card className="border border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-brand-primary dark:text-blue-400" />
                        Difficulty Adaptation Matrix
                      </CardTitle>
                      <CardDescription>Tracks how well you adapt as question complexity increases.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {performanceByDifficulty.filter(d => d.questionsAnswered > 0).map((diff) => {
                          const label = diff.level.charAt(0).toUpperCase() + diff.level.slice(1);
                          const cardStyle = diff.level === "easy"
                            ? "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                            : diff.level === "medium"
                            ? "from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800"
                            : "from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 border-rose-200 dark:border-rose-800";
                          const valueColor = diff.level === "easy"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : diff.level === "medium"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400";
                          return (
                            <div
                              key={diff.level}
                              className={`text-center p-4 rounded-xl border bg-gradient-to-br ${cardStyle}`}
                            >
                              <p className={`text-3xl font-bold ${valueColor}`}>{diff.accuracy}%</p>
                              <p className="text-sm font-medium mt-1">{label}</p>
                              <p className="text-xs text-muted-foreground">{diff.questionsAnswered} questions</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <Card className="border border-rose-200 dark:border-rose-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                        <Target className="h-5 w-5" />
                        Tactical Focus Queue
                      </CardTitle>
                      <CardDescription>Your next highest-impact quiz topics to improve this week.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {areasToImprove.slice(0, 4).map((item) => (
                        <div key={item.topic} className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground">{item.topic}</p>
                            <Badge className="bg-rose-600 text-white">{item.accuracy}%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{item.questionsAnswered} questions answered • Target 2 focused sessions</p>
                        </div>
                      ))}
                      {areasToImprove.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No critical weak topics right now. Keep momentum by maintaining your routine.</p>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card className="border border-emerald-200 dark:border-emerald-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <Zap className="h-5 w-5" />
                        Momentum Feed
                      </CardTitle>
                      <CardDescription>Recent quiz wins and movement over your latest attempts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentActivity.slice(-4).reverse().map((attempt, idx) => (
                        <div key={`${attempt.quizTitle}-${idx}`} className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground truncate">{attempt.quizTitle}</p>
                            <Badge className="bg-emerald-600 text-white">{attempt.accuracy}%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{attempt.topic} • Score {attempt.score}/{attempt.maxScore}</p>
                        </div>
                      ))}
                      {recentActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Complete more quizzes to populate your momentum feed.</p>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                {smartInsights.length > 0 ? (
                  <Card className="border border-indigo-200 dark:border-indigo-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                        <Lightbulb className="h-5 w-5" />
                        Coach Notes
                      </CardTitle>
                      <CardDescription>Concise coaching prompts generated from your latest data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {smartInsights.slice(0, 4).map((insight, idx) => (
                        <div key={`coach-${idx}`} className="rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-3">
                          <p className="text-sm text-muted-foreground">{insight.text}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : (
              <Card className="border border-brand-primary/30 dark:border-brand-primary/40 bg-gradient-to-br from-brand-primary/10 via-white to-brand-accent/10 dark:from-brand-primary/20 dark:via-slate-900 dark:to-brand-accent/20 overflow-hidden">
                <CardContent className="py-16 px-6 text-center relative">
                  {/* Decorative background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent dark:from-brand-primary/30 pointer-events-none" />
                  
                  <div className="relative z-10 max-w-md mx-auto space-y-6">
                    {/* Icon with subtle animation */}
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent shadow-lg shadow-brand-primary/20 dark:shadow-brand-primary/10">
                      <BarChart3 className="h-10 w-10 text-white" />
                    </div>
                    
                    {/* Title */}
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        Your Analytics Await
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Complete quizzes to unlock powerful insights about your learning journey
                      </p>
                    </div>
                    
                    {/* Value proposition */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-brand-primary/30 dark:border-brand-primary/40">
                        <Target className="h-5 w-5 text-brand-primary dark:text-brand-accent mx-auto mb-1" />
                        <p className="text-xs font-medium text-muted-foreground">Track Accuracy</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-brand-primary/30 dark:border-brand-primary/40">
                        <TrendingUp className="h-5 w-5 text-brand-primary dark:text-blue-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-muted-foreground">View Progress</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-success/30 dark:border-success/40">
                        <CheckCircle2 className="h-5 w-5 text-success dark:text-green-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-muted-foreground">Find Strengths</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-orange-200/50 dark:border-orange-800/30">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-muted-foreground">Spot Gaps</p>
                      </div>
                    </div>
                    
                    {/* Call to action */}
                    <div className="pt-4">
                      <Button
                        onClick={() => {
                          console.log("[ANALYTICS] Start First Quiz clicked - switching to My Quizzes tab");
                          setView("list");
                          setActiveTab("list");
                        }}
                        className="bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white shadow-lg shadow-brand-primary/30 dark:shadow-brand-primary/20 transition-all hover:scale-105"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Your First Quiz
                      </Button>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                        Complete 5+ questions to unlock analytics
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="review">
            {isLoadingReview ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-brand-primary" />
              </div>
            ) : spacedReviewItems.length === 0 ? (
              <Card className="border border-brand-primary/30 dark:border-brand-primary/40 bg-gradient-to-br from-purple-50/50 via-white to-brand-accent/10 dark:from-purple-950/30 dark:via-slate-900 dark:to-brand-accent/20 overflow-hidden">
                <CardContent className="py-16 px-6 text-center relative">
                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.05),transparent_50%)] pointer-events-none" />
                  
                  <div className="relative z-10 max-w-lg mx-auto space-y-6">
                    {/* Icon with rotation animation hint */}
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-brand-accent shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10">
                      <RefreshCw className="h-10 w-10 text-white" />
                    </div>
                    
                    {/* Title and description */}
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        Spaced Repetition Ready
                      </h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Your personalized review queue is empty right now. Great work staying on top of your studies!
                      </p>
                    </div>
                    
                    {/* How it works */}
                    <div className="bg-white/60 dark:bg-slate-800/40 border border-purple-200/50 dark:border-purple-800/30 rounded-xl p-6 space-y-4 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h4 className="font-semibold text-foreground">How Spaced Review Works</h4>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/20 dark:bg-brand-primary/30 flex items-center justify-center text-brand-primary dark:text-brand-accent font-bold text-xs">1</div>
                          <p className="text-muted-foreground pt-0.5">
                            Answer quiz questions and track which ones you find challenging
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/20 dark:bg-brand-primary/30 flex items-center justify-center text-brand-primary dark:text-brand-accent font-bold text-xs">2</div>
                          <p className="text-muted-foreground pt-0.5">
                            Questions you struggle with will automatically appear here at optimal intervals
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/20 dark:bg-brand-primary/30 flex items-center justify-center text-brand-primary dark:text-brand-accent font-bold text-xs">3</div>
                          <p className="text-muted-foreground pt-0.5">
                            Regular review strengthens memory and boosts long-term retention
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Call to action */}
                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          console.log("[SPACED REVIEW] Browse Quizzes clicked - switching to My Quizzes tab");
                          setView("list");
                          setActiveTab("list");
                        }}
                        variant="outline"
                        className="border-brand-primary/40 dark:border-brand-primary/50 text-brand-primary dark:text-brand-accent hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20/30 transition-all hover:scale-105"
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Browse Available Quizzes
                      </Button>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                        Check back after completing more quizzes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Questions Due for Review</h2>
                  <Badge variant="outline" className="text-brand-primary dark:text-brand-accent">
                    {spacedReviewItems.length} questions
                  </Badge>
                </div>
                {spacedReviewItems.map((item) => (
                  <Card key={item.id} className="border-2 border-brand-primary/30 dark:border-brand-primary/40">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{item.question?.type?.toUpperCase() || "MCQ"}</Badge>
                            <span className="text-sm text-muted-foreground">from {item.quizTitle}</span>
                          </div>
                          <p className="font-medium mb-4">{item.question?.question}</p>
                          
                          {item.question?.type === "mcq" && item.question?.options && (
                            <div className="space-y-2 mb-4">
                              {item.question.options.map((option, index) => (
                                <div 
                                  key={option.id} 
                                  className={`p-2 rounded-lg border ${
                                    option.isCorrect 
                                      ? 'border-green-400 bg-success/10 dark:bg-success/20' 
                                      : 'border-border'
                                  }`}
                                >
                                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                                  {option.text}
                                  {option.isCorrect && <CheckCircle2 className="h-4 w-4 inline ml-2 text-success" />}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Streak: {item.streak}</span>
                            <span>Status: {item.status}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSpacedReview(item.id, 1)}
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            data-testid={`button-review-again-${item.id}`}
                          >
                            Again
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSpacedReview(item.id, 3)}
                            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                            data-testid={`button-review-good-${item.id}`}
                          >
                            Good
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSpacedReview(item.id, 5)}
                            className="text-success border-success/30 hover:bg-success/10"
                            data-testid={`button-review-easy-${item.id}`}
                          >
                            Easy
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
