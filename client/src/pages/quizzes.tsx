import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Play, Clock, CheckCircle2, AlertCircle, Star, BookMarked, Zap, Trophy, Target, RotateCw, Loader, Trash2, X, Brain, TrendingUp, BarChart3, RefreshCw, ChevronRight } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  overallAccuracy: number;
  averageTimePerQuestion: number;
  strengthsByTopic: Record<string, number>;
  weaknessesByTopic: Record<string, number>;
  recentActivity: { date: string; score: number }[];
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

  const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
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
  });

  const { data: userAnalytics, isLoading: isLoadingAnalytics } = useQuery<UserAnalytics>({
    queryKey: ["/api/user/analytics"],
    enabled: activeTab === "analytics",
  });

  const { data: spacedReviewItems = [], isLoading: isLoadingReview, refetch: refetchReview } = useQuery<SpacedReviewItem[]>({
    queryKey: ["/api/spaced-review/due"],
    enabled: activeTab === "review",
  });

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
        
        await fetch(`/api/attempts/${currentAttempt.id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      const response = await apiRequest("POST", "/api/quizzes", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      setView("list");
      form.reset();
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      // Use apiRequest to include auth token
      await apiRequest("DELETE", `/api/quizzes/${quizId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
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
    startTimeRef.current = Date.now();
    
    try {
      const response = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    startTimeRef.current = Date.now();
    
    try {
      const response = await fetch(`/api/quizzes/${quizId}/adaptive-attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const handleAnswerSubmit = async () => {
    if (isSubmitting || !currentAttempt) return;
    setIsSubmitting(true);
    
    const question = activeQuestions[currentQuestion];
    const responseTime = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    try {
      const response = await fetch(`/api/attempts/${currentAttempt.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedOptionId: question.type === "mcq" ? selectedAnswer : null,
          textAnswer: question.type !== "mcq" ? textAnswer : null,
          responseTime,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedbackCorrect(data.isCorrect);
        setFeedbackExplanation(data.explanation || "");
        setShowFeedback(true);
        
        setUserAnswers([...userAnswers, {
          questionId: question.id,
          answer: question.type === "mcq" ? selectedAnswer : textAnswer,
          correct: data.isCorrect,
          explanation: data.explanation,
        }]);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
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
    if (!currentAttempt) return;
    
    try {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      await fetch(`/api/attempts/${currentAttempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: [],
          timeSpent,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spaced-review/due"] });
    } catch (error) {
      console.error("Failed to finalize attempt:", error);
    }
  };

  const handleAdaptiveAnswer = async () => {
    if (isSubmitting || !currentAttempt || !adaptiveQuestion) return;
    setIsSubmitting(true);
    
    const responseTime = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    try {
      const response = await fetch(`/api/attempts/${currentAttempt.id}/adaptive-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: adaptiveQuestion.id,
          selectedOptionId: adaptiveQuestion.type === "mcq" ? selectedAnswer : null,
          textAnswer: adaptiveQuestion.type !== "mcq" ? textAnswer : null,
          responseTime,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedbackCorrect(data.isCorrect);
        setFeedbackExplanation(data.explanation || "");
        setShowFeedback(true);
        
        setAdaptiveAnswers([...adaptiveAnswers, {
          correct: data.isCorrect,
          difficulty: adaptiveDifficulty,
        }]);
        
        if (data.completed) {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/analytics"] });
            queryClient.invalidateQueries({ queryKey: ["/api/spaced-review/due"] });
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
      }
    } catch (error) {
      console.error("Failed to submit adaptive answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpacedReview = async (statsId: string, quality: number) => {
    try {
      await fetch(`/api/spaced-review/${statsId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
      refetchReview();
    } catch (error) {
      console.error("Failed to update review:", error);
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
                        onClick={() => !showFeedback && setSelectedAnswer(option.id)}
                        disabled={showFeedback}
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
                        onClick={() => !showFeedback && setSelectedAnswer(option.id)}
                        disabled={showFeedback}
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
                {quizzes.map((quiz) => (
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
            {isLoadingAnalytics ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : userAnalytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800">
                    <CardContent className="pt-6 text-center">
                      <Trophy className="h-8 w-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-teal-700 dark:text-teal-300">{userAnalytics.totalQuizzesTaken}</div>
                      <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">Quizzes Taken</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6 text-center">
                      <Target className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{userAnalytics.totalQuestionsAnswered}</div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Questions Answered</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                    <CardContent className="pt-6 text-center">
                      <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-green-700 dark:text-green-300">{userAnalytics.overallAccuracy}%</div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">Overall Accuracy</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                    <CardContent className="pt-6 text-center">
                      <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{userAnalytics.averageTimePerQuestion}s</div>
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Avg Time/Question</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-2 border-green-200 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Strengths
                      </CardTitle>
                      <CardDescription>Topics you excel at (70%+ accuracy)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.entries(userAnalytics.strengthsByTopic).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(userAnalytics.strengthsByTopic).map(([topic, accuracy]) => (
                            <div key={topic} className="flex items-center justify-between">
                              <span className="font-medium">{topic}</span>
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                {accuracy}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Complete more quizzes to see your strengths</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Areas to Improve
                      </CardTitle>
                      <CardDescription>Topics that need more practice (below 70%)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.entries(userAnalytics.weaknessesByTopic).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(userAnalytics.weaknessesByTopic).map(([topic, accuracy]) => (
                            <div key={topic} className="flex items-center justify-between">
                              <span className="font-medium">{topic}</span>
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                {accuracy}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Great job! No weak areas identified yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {userAnalytics.recentActivity.length > 0 && (
                  <Card className="border-2 border-teal-200 dark:border-teal-800">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Your last 10 quiz attempts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2 h-32">
                        {userAnalytics.recentActivity.map((activity, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1">
                            <div 
                              className={`w-full rounded-t transition-all ${
                                activity.score >= 70 
                                  ? 'bg-green-500' 
                                  : activity.score >= 50 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                              }`}
                              style={{ height: `${activity.score}%` }}
                            />
                            <span className="text-xs text-muted-foreground">{activity.score}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-teal-300 dark:border-teal-700">
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Analytics Yet</h3>
                  <p className="text-muted-foreground">Complete some quizzes to see your performance analytics</p>
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
              <Card className="border-2 border-dashed border-teal-300 dark:border-teal-700">
                <CardContent className="py-12 text-center">
                  <RefreshCw className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Questions Due for Review</h3>
                  <p className="text-muted-foreground">Complete some quizzes and check back later. Questions you struggle with will appear here for review.</p>
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
