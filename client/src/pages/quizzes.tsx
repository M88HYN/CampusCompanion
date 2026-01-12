import { useState, useEffect } from "react";
import { Plus, Play, Clock, CheckCircle2, AlertCircle, Star, BookMarked, Zap, Trophy, Target, RotateCw, Loader, Trash2, X } from "lucide-react";
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
import { queryClient } from "@/lib/queryClient";
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

type QuizStatus = "not-started" | "in-progress" | "completed";
type QuestionType = "mcq" | "saq" | "laq";
type QuizMode = "practice" | "exam";
type Difficulty = 1 | 2 | 3 | 4 | 5;

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
  const [view, setView] = useState<"list" | "taking" | "results" | "create">("list");
  const [quizMode, setQuizMode] = useState<QuizMode>("practice");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState("");
  const [userAnswers, setUserAnswers] = useState<Array<{questionId: string, answer: string, correct: boolean}>>([]);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

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
  });

  const { data: selectedQuizData, isLoading: isLoadingQuiz } = useQuery<{
    id: string;
    title: string;
    subject?: string;
    timeLimit?: number;
    questions: Question[];
  }>({
    queryKey: ["/api/quizzes", selectedQuizId],
    enabled: !!selectedQuizId && view === "taking",
  });

  useEffect(() => {
    if (selectedQuizData?.questions) {
      setActiveQuestions(selectedQuizData.questions);
      if (selectedQuizData.timeLimit) {
        setTimeLeft(selectedQuizData.timeLimit * 60);
      }
    }
  }, [selectedQuizData]);

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

      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to create quiz");
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
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete quiz");
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

  const getDifficultyColor = (difficulty: number) => {
    const colors: Record<number, string> = { 1: "text-green-600", 2: "text-blue-600", 3: "text-yellow-600", 4: "text-orange-600", 5: "text-red-600" };
    return colors[difficulty] || "text-slate-600";
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels: Record<number, string> = { 1: "Very Easy", 2: "Easy", 3: "Medium", 4: "Hard", 5: "Very Hard" };
    return labels[difficulty] || "Unknown";
  };

  const startQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedAnswer("");
    setTextAnswer("");
    setShowFeedback(false);
    setView("taking");
  };

  // Results View
  if (view === "results") {
    const totalQuestions = activeQuestions.length || 1;
    const correctAnswers = userAnswers.filter(a => a.correct).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    let scoreColor = "from-red-500 to-red-600";
    let scoreLabel = "Keep Trying!";
    if (score >= 90) {
      scoreColor = "from-purple-500 to-violet-600";
      scoreLabel = "Perfect!";
    } else if (score >= 75) {
      scoreColor = "from-blue-500 to-cyan-600";
      scoreLabel = "Great Job!";
    } else if (score >= 50) {
      scoreColor = "from-yellow-500 to-orange-600";
      scoreLabel = "Good Effort!";
    }

    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className={`bg-gradient-to-r ${scoreColor} rounded-2xl p-8 text-white text-center shadow-lg`}>
            <div className="mb-4 flex justify-center gap-2 animate-bounce">
              <Trophy className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-lg opacity-90">You scored {correctAnswers} out of {totalQuestions} questions correctly</p>
          </div>

          <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
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

          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900 rounded-t-lg">
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
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm border-l-4 border-blue-500">
                            <div className="font-medium mb-1 text-blue-700 dark:text-blue-400">Explanation:</div>
                            <p>{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-2"
              onClick={() => {
                setView("list");
                setSelectedQuizId(null);
              }}
              data-testid="button-back-to-quizzes"
            >
              Back to Quizzes
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
              onClick={() => startQuiz(selectedQuizId!)}
              data-testid="button-retake-quiz"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Taking Quiz View
  if (view === "taking") {
    if (isLoadingQuiz || activeQuestions.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
          <div className="text-center">
            <Loader className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-lg font-medium">Loading quiz...</p>
          </div>
        </div>
      );
    }

    const question = activeQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / activeQuestions.length) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const handleNext = () => {
      const answer = question.type === "mcq" ? selectedAnswer : textAnswer;
      let isCorrect = false;
      
      if (question.type === "mcq" && question.options) {
        const correctOption = question.options.find(o => o.isCorrect);
        isCorrect = selectedAnswer === correctOption?.id;
      } else {
        isCorrect = textAnswer.toLowerCase().includes((question.correctAnswer || "").toLowerCase().slice(0, 20));
      }

      setFeedbackCorrect(isCorrect);
      setShowFeedback(true);

      setTimeout(() => {
        setUserAnswers([...userAnswers, { questionId: question.id, answer, correct: isCorrect }]);

        if (currentQuestion < activeQuestions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
          setSelectedAnswer("");
          setTextAnswer("");
          setShowFeedback(false);
        } else {
          setView("results");
        }
      }, 1500);
    };

    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
        <div className="border-b-2 border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white gap-1 border-0 px-3 py-1">
                <Target className="h-3 w-3" />
                {quizMode === "exam" ? "Exam Mode" : "Practice Mode"}
              </Badge>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium">Question</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {currentQuestion + 1}/{activeQuestions.length}
                </p>
              </div>
            </div>

            <div className="flex-1 mx-8">
              <Progress value={progress} className="h-3 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className={`text-center px-4 py-2 rounded-lg font-mono font-bold text-lg ${
              timeLeft < 60 
                ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' 
                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
            }`}>
              <Clock className="h-4 w-4 inline mr-1" />
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div className="w-full max-w-4xl">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 mb-6 border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="outline" className="text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
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
                            ? 'border-purple-500 bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-100 shadow-lg'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900'
                        }`}
                        data-testid={`option-${index}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                          showFeedback && isCorrectOption
                            ? 'bg-green-500 text-white'
                            : showFeedback && isSelected && !isCorrectOption
                            ? 'bg-red-500 text-white'
                            : isSelected && !showFeedback
                            ? 'bg-purple-500 text-white'
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
                  className={`min-h-40 p-4 rounded-lg font-base border-2 ${question.type === "laq" ? "min-h-56" : ""}`}
                  data-testid="textarea-answer"
                />
              )}
            </div>

            {showFeedback && (
              <div className={`p-6 rounded-xl mb-6 text-center text-lg font-bold text-white ${
                feedbackCorrect 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' 
                  : 'bg-gradient-to-r from-red-500 to-pink-600 shadow-lg'
              }`}>
                {feedbackCorrect ? 'Correct!' : 'Incorrect, but keep learning!'}
              </div>
            )}

            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setView("list");
                  setSelectedQuizId(null);
                }}
                className="border-2"
                data-testid="button-exit-quiz"
              >
                Exit Quiz
              </Button>
              <Button
                size="lg"
                onClick={handleNext}
                disabled={showFeedback || (question.type === "mcq" ? !selectedAnswer : !textAnswer.trim())}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-8"
                data-testid="button-next"
              >
                {currentQuestion === activeQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create Quiz View
  if (view === "create") {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
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
              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
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

              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                  <div className="flex items-center justify-between">
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
                        <div className="flex items-center justify-between">
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
                    className="w-full border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
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
                  className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
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

  // List View (default)
  return (
    <div className="flex-1 overflow-auto bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Quizzes</h1>
              <p className="text-lg opacity-90 max-w-2xl">Test your knowledge with interactive quizzes</p>
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

        {isLoadingQuizzes ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : quizzes.length === 0 ? (
          <Card className="border-2 border-dashed border-purple-300 dark:border-purple-700">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                <BookMarked className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Quizzes Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first quiz to get started</p>
              <Button
                onClick={() => setView("create")}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
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
                className="border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow"
                data-testid={`card-quiz-${quiz.id}`}
              >
                <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900 rounded-t-lg pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription className="text-xs">{quiz.subject || "General"}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                      {quiz.mode}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{quiz.questionCount}</p>
                      <p className="text-xs text-muted-foreground">Questions</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{quiz.attemptCount}</p>
                      <p className="text-xs text-muted-foreground">Attempts</p>
                    </div>
                  </div>
                  {quiz.bestScore !== null && quiz.bestScore !== undefined && (
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span className="text-sm font-medium">Best Score</span>
                      <Badge className="bg-green-500">{quiz.bestScore}%</Badge>
                    </div>
                  )}
                  {quiz.timeLimit && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.timeLimit} minutes</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
                      onClick={() => startQuiz(quiz.id)}
                      disabled={quiz.questionCount === 0}
                      data-testid={`button-start-quiz-${quiz.id}`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {quiz.questionCount === 0 ? "No Questions" : "Start Quiz"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteQuizMutation.mutate(quiz.id)}
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
      </div>
    </div>
  );
}
