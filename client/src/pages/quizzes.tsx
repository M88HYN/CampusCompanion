import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Play, Clock, CheckCircle2, AlertCircle, Star, BookMarked, Zap, Trophy, Target, RotateCw, Loader, Trash2, X, Brain, TrendingUp, TrendingDown, BarChart3, RefreshCw, ChevronRight, Lightbulb, FileText, Layers, GraduationCap, Flame, CalendarCheck } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
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

export default function Quizzes() {
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
  
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<Question | null>(null);
  const [adaptiveQuestionNumber, setAdaptiveQuestionNumber] = useState(1);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(3);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<Array<{correct: boolean, difficulty: number}>>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

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

  const { data: quizzes = [], isLoading: isLoadingQuizzes, refetch: refetchQuizzes } = useQuery<Quiz[]>({
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
      
      // VALIDATION: Check count constraints
      if (uniqueQuizzes.length > 12) {
        console.warn(`[QUIZZES] ⚠️  WARNING: ${uniqueQuizzes.length} quizzes found (max 12 expected)`);
      } else if (uniqueQuizzes.length < 10 && uniqueQuizzes.length > 0) {
        console.warn(`[QUIZZES] ⚠️  WARNING: Only ${uniqueQuizzes.length} quizzes found (10-12 expected)`);
      }
      
      console.log(`[QUIZZES] ✅ Loaded ${uniqueQuizzes.length} unique quizzes`);
      return uniqueQuizzes;
    },
    staleTime: 0, // Always refetch to ensure fresh data when navigating back
    refetchOnMount: true,
    retry: 1,
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

  const onSubmit = (values: QuizFormValues) => {
    createQuizMutation.mutate(values);
  };

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

  const removeQuestionField = (index: number) => {
    if (questionFields.length > 1) {
      removeQuestion(index);
    }
  };

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
      scoreColor = "from-teal-500 to-cyan-600";
      scoreLabel = "Perfect!";
    } else if (score >= 75) {
      scoreColor = "from-blue-500 to-cyan-600";
      scoreLabel = "Great Job!";
    } else if (score >= 50) {
      scoreColor = "from-yellow-500 to-orange-600";
      scoreLabel = "Good Effort!";
    }

    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className={`bg-gradient-to-r ${scoreColor} rounded-2xl p-8 text-white text-center shadow-lg`}>
            <div className="mb-4 flex justify-center gap-2 animate-bounce">
              <Trophy className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-lg opacity-90">You scored {correctAnswers} out of {totalQuestions} questions correctly</p>
          </div>

          <Card className="border-2 border-teal-200 dark:border-teal-800 shadow-lg">
            <CardContent className="pt-8 text-center">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">Your Score</p>
                  <div className={`text-7xl font-bold bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent mb-4`}>
                    {score}%
                  </div>
                  <p className={`text-2xl font-bold bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}>
                    {scoreLabel}
                  </p>
                </div>
                <Progress value={score} className="h-4 bg-slate-200 dark:bg-slate-800" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">{correctAnswers}</div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Correct</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-700 dark:text-red-300">{totalQuestions - correctAnswers}</div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Incorrect</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6 text-center">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">+{correctAnswers * 10}</div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">XP Earned</p>
              </CardContent>
            </Card>
          </div>

          {userAnswers.length > 0 && activeQuestions.length > 0 && (
            <Card className="border-2 border-teal-200 dark:border-teal-800">
              <CardHeader className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900 dark:to-cyan-900 rounded-t-lg">
                <CardTitle className="text-2xl">Review Your Answers</CardTitle>
                <CardDescription>Learn from your mistakes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {activeQuestions.map((question, index) => {
                  const userAnswer = userAnswers[index];
                  const isCorrect = userAnswer?.correct;

                  return (
                    <div key={question.id} className={`border-2 rounded-xl p-4 space-y-3 ${isCorrect ? 'border-green-400 bg-green-50 dark:bg-green-950/30' : 'border-red-400 bg-red-50 dark:bg-red-950/30'}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">Question {index + 1}</span>
                            <Badge variant="outline">{question.type.toUpperCase()}</Badge>
                          </div>
                          <p className="text-sm mb-3">{question.question}</p>
                          {userAnswer?.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm border-l-4 border-blue-500">
                              <div className="font-medium mb-1 text-blue-700 dark:text-blue-400">Explanation:</div>
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
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
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
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
          <div className="text-center">
            <Loader className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
            <p className="text-lg font-medium">Loading adaptive quiz...</p>
          </div>
        </div>
      );
    }

    const question = adaptiveQuestion;
    const progress = (adaptiveQuestionNumber / 10) * 100;

    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
        <div className="border-b-2 border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white gap-1 border-0 px-3 py-1">
                <Brain className="h-3 w-3" />
                Adaptive Mode
              </Badge>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium">Question</p>
                <p className="text-lg font-bold text-teal-700 dark:text-teal-300">
                  {adaptiveQuestionNumber}/10
                </p>
              </div>
            </div>

            <div className="flex-1 mx-4">
              <Progress value={progress} className="h-3 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Difficulty:</span>
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

        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div className="w-full max-w-4xl">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 mb-6 border-2 border-teal-200 dark:border-teal-800">
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

              <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-relaxed mb-8">
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
                        className={`w-full p-5 rounded-xl font-semibold text-lg transition-all duration-300 cursor-pointer text-left border-2 flex items-center gap-3 ${
                          showFeedback && isCorrectOption
                            ? 'border-green-500 bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100 scale-105 shadow-lg'
                            : showFeedback && isSelected && !isCorrectOption
                            ? 'border-red-500 bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100 scale-95 shadow-lg'
                            : isSelected && !showFeedback
                            ? 'border-orange-500 bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-100 shadow-lg'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900'
                        }`}
                        data-testid={`adaptive-option-${index}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                          showFeedback && isCorrectOption
                            ? 'bg-green-500 text-white'
                            : showFeedback && isSelected && !isCorrectOption
                            ? 'bg-red-500 text-white'
                            : isSelected && !showFeedback
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{option.text}</span>
                        {showFeedback && isCorrectOption && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                        {showFeedback && isSelected && !isCorrectOption && <AlertCircle className="h-6 w-6 text-red-600" />}
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
                onClick={handleAdaptiveAnswer}
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
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
          <div className="text-center">
            <Loader className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
            <p className="text-lg font-medium">Loading quiz...</p>
          </div>
        </div>
      );
    }

    const question = activeQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / activeQuestions.length) * 100;

    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
        <div className="border-b-2 border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white gap-1 border-0 px-3 py-1">
                <Target className="h-3 w-3" />
                Practice Mode
              </Badge>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium">Question</p>
                <p className="text-lg font-bold text-teal-700 dark:text-teal-300">
                  {currentQuestion + 1}/{activeQuestions.length}
                </p>
              </div>
            </div>

            <div className="flex-1 mx-4">
              <Progress value={progress} className="h-3 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className={`text-center px-4 py-2 rounded-lg font-mono font-bold text-lg ${
              timeLeft < 60 
                ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' 
                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
            }`}>
              <Clock className="h-4 w-4 inline mr-1" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div className="w-full max-w-4xl">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 mb-6 border-2 border-teal-200 dark:border-teal-800">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="outline" className="text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700">
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

              <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-relaxed mb-8">
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
                        className={`w-full p-5 rounded-xl font-semibold text-lg transition-all duration-300 cursor-pointer text-left border-2 flex items-center gap-3 ${
                          showFeedback && isCorrectOption
                            ? 'border-green-500 bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100 scale-105 shadow-lg'
                            : showFeedback && isSelected && !isCorrectOption
                            ? 'border-red-500 bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100 scale-95 shadow-lg'
                            : isSelected && !showFeedback
                            ? 'border-teal-500 bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-100 shadow-lg'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900'
                        }`}
                        data-testid={`option-${index}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                          showFeedback && isCorrectOption
                            ? 'bg-green-500 text-white'
                            : showFeedback && isSelected && !isCorrectOption
                            ? 'bg-red-500 text-white'
                            : isSelected && !showFeedback
                            ? 'bg-teal-500 text-white'
                            : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{option.text}</span>
                        {showFeedback && isCorrectOption && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                        {showFeedback && isSelected && !isCorrectOption && <AlertCircle className="h-6 w-6 text-red-600" />}
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
                  onClick={handleAnswerSubmit}
                  disabled={isSubmitting || (question.type === "mcq" ? !selectedAnswer : !textAnswer.trim())}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-8"
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
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-8"
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
      <div className="flex-1 overflow-auto bg-gradient-to-b from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 rounded-2xl p-8 text-white shadow-xl">
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
              <Card className="border-2 border-teal-200 dark:border-teal-800">
                <CardHeader className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900 dark:to-cyan-900">
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

              <Card className="border-2 border-teal-200 dark:border-teal-800">
                <CardHeader className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900 dark:to-cyan-900">
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
                      <div key={field.id} className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
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
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
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
                                    ? 'bg-green-500 text-white'
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
                                  className={correctOptionIndex === oIndex ? "bg-green-500 hover:bg-green-600" : ""}
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
                    className="w-full border-2 border-dashed border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
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
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
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
    <div className="flex-1 overflow-auto bg-gradient-to-b from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Quizzes</h1>
              <p className="text-lg opacity-90 max-w-2xl">Test your knowledge with interactive quizzes, adaptive learning, and spaced repetition</p>
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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="quizzes" className="gap-2" data-testid="tab-quizzes">
              <BookMarked className="h-4 w-4" />
              My Quizzes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-2" data-testid="tab-review">
              <RefreshCw className="h-4 w-4" />
              Spaced Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quizzes">
            {isLoadingQuizzes ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : quizzes.length === 0 ? (
              <Card className="border-2 border-dashed border-teal-300 dark:border-teal-700">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center mb-4">
                    <BookMarked className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Quizzes Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first quiz to get started</p>
                  <Button
                    onClick={() => setView("create")}
                    className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                    data-testid="button-create-first-quiz"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Quiz
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
                    className="border-2 border-teal-200 dark:border-teal-800 hover:shadow-lg transition-shadow"
                    data-testid={`card-quiz-${quiz.id}`}
                  >
                    <CardHeader className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900 dark:to-cyan-900 rounded-t-lg pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-lg truncate">{quiz.title}</CardTitle>
                          <CardDescription className="text-xs">{quiz.subject || "General"}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700 shrink-0">
                          {quiz.mode}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">{quiz.questionCount}</div>
                          <div className="text-muted-foreground text-xs">Questions</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{quiz.attemptCount}</div>
                          <div className="text-muted-foreground text-xs">Attempts</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {quiz.bestScore !== null ? `${quiz.bestScore}%` : "-"}
                          </div>
                          <div className="text-muted-foreground text-xs">Best</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => startQuiz(quiz.id)}
                          className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
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
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
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
                <Loader className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : summary.totalQuizzesTaken > 0 ? (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AnalyticsStatCard
                    icon={<Trophy className="h-8 w-8" />}
                    title="Quizzes Taken"
                    value={summary.totalQuizzesTaken}
                    subtitle={`${summary.totalQuestionsAnswered} questions answered`}
                    iconBgColor="bg-teal-100 dark:bg-teal-900"
                    iconColor="text-teal-600 dark:text-teal-400"
                    textColor="text-teal-700 dark:text-teal-300"
                    borderColor="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border"
                  />
                  <AnalyticsStatCard
                    icon={<Target className="h-8 w-8" />}
                    title="Overall Accuracy"
                    value={`${summary.overallAccuracy}%`}
                    subtitle={`Based on ${summary.totalQuestionsAnswered} questions`}
                    iconBgColor="bg-green-100 dark:bg-green-900"
                    iconColor="text-green-600 dark:text-green-400"
                    textColor="text-green-700 dark:text-green-300"
                    borderColor="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border"
                  />
                  <AnalyticsStatCard
                    icon={<Clock className="h-8 w-8" />}
                    title="Avg Time / Question"
                    value={`${summary.avgTimePerQuestion}s`}
                    subtitle="Across all attempts"
                    iconBgColor="bg-blue-100 dark:bg-blue-900"
                    iconColor="text-blue-600 dark:text-blue-400"
                    textColor="text-blue-700 dark:text-blue-300"
                    borderColor="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border"
                  />
                  <AnalyticsStatCard
                    icon={<Star className="h-8 w-8" />}
                    title="Questions Answered"
                    value={summary.totalQuestionsAnswered}
                    subtitle="Total across all quizzes"
                    iconBgColor="bg-orange-100 dark:bg-orange-900"
                    iconColor="text-orange-600 dark:text-orange-400"
                    textColor="text-orange-700 dark:text-orange-300"
                    borderColor="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border"
                  />
                </div>

                {/* Study Overview — Cross-feature Stats */}
                <Card className="border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/30 dark:to-purple-950/20">
                  <CardHeader>
                    <CardTitle className="text-violet-700 dark:text-violet-300 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Study Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-1" />
                        <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{studyOverview.noteCount}</span>
                        <span className="text-xs text-blue-600/80 dark:text-blue-400/80">Notes</span>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                        <Layers className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-1" />
                        <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{studyOverview.deckCount}</span>
                        <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Decks</span>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800">
                        <BookMarked className="h-6 w-6 text-teal-600 dark:text-teal-400 mb-1" />
                        <span className="text-2xl font-bold text-teal-700 dark:text-teal-300">{studyOverview.flashcardCount}</span>
                        <span className="text-xs text-teal-600/80 dark:text-teal-400/80">Flashcards</span>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                        <Star className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-1" />
                        <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{studyOverview.masteredCardCount}</span>
                        <span className="text-xs text-amber-600/80 dark:text-amber-400/80">Mastered</span>
                      </div>
                      <div className="flex flex-col items-center p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800">
                        <CalendarCheck className="h-6 w-6 text-rose-600 dark:text-rose-400 mb-1" />
                        <span className="text-2xl font-bold text-rose-700 dark:text-rose-300">{studyOverview.reviewQueueSize}</span>
                        <span className="text-xs text-rose-600/80 dark:text-rose-400/80">Due for Review</span>
                      </div>
                    </div>

                    {/* Accuracy Breakdown */}
                    {(studyOverview.correctAnswers > 0 || studyOverview.incorrectAnswers > 0) && (
                      <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-800">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-violet-600 dark:text-violet-400 font-medium">Answer Accuracy</span>
                          <span className="text-violet-500 dark:text-violet-400">
                            {studyOverview.correctAnswers + studyOverview.incorrectAnswers > 0
                              ? Math.round((studyOverview.correctAnswers / (studyOverview.correctAnswers + studyOverview.incorrectAnswers)) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                          <div
                            className="bg-green-500 dark:bg-green-400 transition-all"
                            style={{ width: `${studyOverview.correctAnswers + studyOverview.incorrectAnswers > 0 ? (studyOverview.correctAnswers / (studyOverview.correctAnswers + studyOverview.incorrectAnswers)) * 100 : 0}%` }}
                          />
                          <div
                            className="bg-red-400 dark:bg-red-500 transition-all"
                            style={{ width: `${studyOverview.correctAnswers + studyOverview.incorrectAnswers > 0 ? (studyOverview.incorrectAnswers / (studyOverview.correctAnswers + studyOverview.incorrectAnswers)) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-green-600 dark:text-green-400">{studyOverview.correctAnswers} correct</span>
                          <span className="text-red-500 dark:text-red-400">{studyOverview.incorrectAnswers} incorrect</span>
                        </div>
                      </div>
                    )}

                    {/* Streak */}
                    {studyOverview.currentStreak > 0 && (
                      <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-800 flex items-center gap-3">
                        <Flame className="h-6 w-6 text-orange-500" />
                        <div>
                          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{studyOverview.currentStreak}-day streak</span>
                          {studyOverview.longestStreak > studyOverview.currentStreak && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Best: {studyOverview.longestStreak} days)</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Insights — Smart Analysis */}
                {smartInsights.length > 0 && (
                  <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-violet-50/30 dark:from-indigo-950/30 dark:to-violet-950/20">
                    <CardHeader>
                      <CardTitle className="text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Performance Insights
                      </CardTitle>
                      <CardDescription>AI-detected patterns in your quiz performance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {smartInsights.map((insight, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            insight.type === "strength"
                              ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800"
                              : insight.type === "weakness"
                              ? "bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800"
                              : insight.type === "tip"
                              ? "bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800"
                              : "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          <div className={`flex-shrink-0 mt-0.5 ${
                            insight.type === "strength" ? "text-emerald-600 dark:text-emerald-400"
                              : insight.type === "weakness" ? "text-rose-600 dark:text-rose-400"
                              : insight.type === "tip" ? "text-amber-600 dark:text-amber-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}>
                            {insight.type === "strength" ? <TrendingUp className="h-4 w-4" />
                              : insight.type === "weakness" ? <TrendingDown className="h-4 w-4" />
                              : insight.type === "tip" ? <Lightbulb className="h-4 w-4" />
                              : <BarChart3 className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${
                              insight.type === "strength" ? "text-emerald-700 dark:text-emerald-300"
                                : insight.type === "weakness" ? "text-rose-700 dark:text-rose-300"
                                : insight.type === "tip" ? "text-amber-700 dark:text-amber-300"
                                : "text-blue-700 dark:text-blue-300"
                            }`}>
                              {insight.type === "strength" ? "Doing Well" : insight.type === "weakness" ? "Needs Work" : insight.type === "tip" ? "Tip" : "Info"}
                            </span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{insight.text}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Per-Quiz Performance Breakdown */}
                {quizPerformance.length > 0 && (
                  <Card className="border border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        Quiz Performance Breakdown
                      </CardTitle>
                      <CardDescription>Your accuracy across different quizzes</CardDescription>
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
                  <Card className="border border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Performance by Difficulty
                      </CardTitle>
                      <CardDescription>How you perform across easy, medium, and hard questions</CardDescription>
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

                {/* Strengths & Weaknesses (from topic tags) */}
                {(strengths.length > 0 || areasToImprove.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {strengths && strengths.length > 0 ? (
                      <InsightCard
                        title="Your Strengths"
                        subtitle="Topics with ≥70% accuracy"
                        items={strengths}
                        badgeColor="bg-emerald-600"
                        icon={<Zap className="h-5 w-5" />}
                        borderColor="border-2 border-emerald-200 dark:border-emerald-800"
                        accentColor="text-emerald-700 dark:text-emerald-300"
                        itemBgColor="bg-emerald-50 dark:bg-emerald-950"
                        titleColor="text-emerald-700 dark:text-emerald-300"
                      />
                    ) : null}
                    {areasToImprove && areasToImprove.length > 0 ? (
                      <InsightCard
                        title="Areas to Improve"
                        subtitle="Topics with <70% accuracy"
                        items={areasToImprove}
                        badgeColor="bg-rose-600"
                        icon={<Target className="h-5 w-5" />}
                        borderColor="border-2 border-rose-200 dark:border-rose-800"
                        accentColor="text-rose-700 dark:text-rose-300"
                        itemBgColor="bg-rose-50 dark:bg-rose-950"
                        titleColor="text-rose-700 dark:text-rose-300"
                      />
                    ) : null}
                  </div>
                )}

                {/* Recent Activity */}
                {recentActivity && recentActivity.length > 0 ? (
                  <ActivityCard activities={recentActivity} />
                ) : null}
              </div>
            ) : (
              <Card className="border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/50 via-white to-blue-50/30 dark:from-teal-950/30 dark:via-slate-900 dark:to-blue-950/20 overflow-hidden">
                <CardContent className="py-16 px-6 text-center relative">
                  {/* Decorative background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-100/20 to-transparent dark:from-teal-900/10 pointer-events-none" />
                  
                  <div className="relative z-10 max-w-md mx-auto space-y-6">
                    {/* Icon with subtle animation */}
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 shadow-lg shadow-teal-500/20 dark:shadow-teal-500/10">
                      <BarChart3 className="h-10 w-10 text-white" />
                    </div>
                    
                    {/* Title */}
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                        Your Analytics Await
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        Complete quizzes to unlock powerful insights about your learning journey
                      </p>
                    </div>
                    
                    {/* Value proposition */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-teal-200/50 dark:border-teal-800/30">
                        <Target className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Track Accuracy</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-blue-200/50 dark:border-blue-800/30">
                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">View Progress</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-green-200/50 dark:border-green-800/30">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Find Strengths</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-orange-200/50 dark:border-orange-800/30">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Spot Gaps</p>
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
                        className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg shadow-teal-500/30 dark:shadow-teal-500/20 transition-all hover:scale-105"
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
                <Loader className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : spacedReviewItems.length === 0 ? (
              <Card className="border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-purple-50/50 via-white to-teal-50/30 dark:from-purple-950/30 dark:via-slate-900 dark:to-teal-950/20 overflow-hidden">
                <CardContent className="py-16 px-6 text-center relative">
                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.05),transparent_50%)] pointer-events-none" />
                  
                  <div className="relative z-10 max-w-lg mx-auto space-y-6">
                    {/* Icon with rotation animation hint */}
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-teal-500 shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10">
                      <RefreshCw className="h-10 w-10 text-white" />
                    </div>
                    
                    {/* Title and description */}
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                        Spaced Repetition Ready
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        Your personalized review queue is empty right now. Great work staying on top of your studies!
                      </p>
                    </div>
                    
                    {/* How it works */}
                    <div className="bg-white/60 dark:bg-slate-800/40 border border-purple-200/50 dark:border-purple-800/30 rounded-xl p-6 space-y-4 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">How Spaced Review Works</h4>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 dark:bg-teal-500/30 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs">1</div>
                          <p className="text-slate-600 dark:text-slate-400 pt-0.5">
                            Answer quiz questions and track which ones you find challenging
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 dark:bg-teal-500/30 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs">2</div>
                          <p className="text-slate-600 dark:text-slate-400 pt-0.5">
                            Questions you struggle with will automatically appear here at optimal intervals
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 dark:bg-teal-500/30 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs">3</div>
                          <p className="text-slate-600 dark:text-slate-400 pt-0.5">
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
                        className="border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all hover:scale-105"
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
                  <Badge variant="outline" className="text-teal-700 dark:text-teal-300">
                    {spacedReviewItems.length} questions
                  </Badge>
                </div>
                {spacedReviewItems.map((item) => (
                  <Card key={item.id} className="border-2 border-teal-200 dark:border-teal-800">
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
                                      ? 'border-green-400 bg-green-50 dark:bg-green-950/30' 
                                      : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                                  {option.text}
                                  {option.isCorrect && <CheckCircle2 className="h-4 w-4 inline ml-2 text-green-600" />}
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
                            className="text-red-600 border-red-200 hover:bg-red-50"
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
                            className="text-green-600 border-green-200 hover:bg-green-50"
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
