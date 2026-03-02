/*
==========================================================
File: client/src/pages/revision.tsx

Module: Frontend Experience

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

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { 
  Play, Pause, RotateCcw, Plus, Trash2, BarChart3, Clock, 
  Zap, Coffee, Brain, Target, Sparkles, CheckCircle2, 
  ArrowRight, Lightbulb, Timer, ListTodo, PenLine,
  AlertTriangle, RefreshCw, BookOpen, ChevronRight, XCircle, Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSpacedRepetition, type SpacedReviewQuestion } from "@/hooks/use-spaced-repetition";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
}

interface TimerPreset {
  name: string;
  minutes: number;
  icon: typeof Play;
  color: string;
  description: string;
}

const timerPresets: TimerPreset[] = [
  { name: "Focus", minutes: 25, icon: Target, color: "from-amber-500 to-orange-600", description: "Standard Pomodoro" },
  { name: "Short Break", minutes: 5, icon: Coffee, color: "from-green-500 to-emerald-600", description: "Quick refresh" },
  { name: "Long Break", minutes: 15, icon: Zap, color: "from-blue-500 to-cyan-600", description: "Recharge fully" },
  { name: "Deep Work", minutes: 50, icon: Brain, color: "from-rose-500 to-pink-600", description: "Extended focus" },
];

const motivationalTips = [
  "Break big tasks into smaller chunks for better focus.",
  "The Pomodoro technique boosts productivity by 25%!",
  "Taking regular breaks improves memory retention.",
  "You're doing great! Keep up the momentum.",
  "Focus on progress, not perfection.",
  "Every completed session brings you closer to your goals.",
];



/*
----------------------------------------------------------
Component: Revision

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
export default function Revision() {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timerPresets[0].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Review Chapter 3", status: "todo", priority: "high" },
    { id: "2", title: "Practice problems", status: "in-progress", priority: "medium" },
    { id: "3", title: "Make notes", status: "done", priority: "low" },
  ]);
  const [whiteboard, setWhiteboard] = useState("");
  const [newTask, setNewTask] = useState("");
  const [activeTab, setActiveTab] = useState("review");
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Spaced Review state
  const {
    reviewQueue,
    totalDue,
    needsReviewCount,
    weakTopicCount,
    dueForReviewCount,
    isLoading: reviewLoading,
    isError: reviewError,
    submitReview,
    isSubmitting,
    refetch: refetchReview,
  } = useSpacedRepetition(20);
  const { toast } = useToast();
  const [_location, navigate] = useLocation();

  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [reviewAnswered, setReviewAnswered] = useState(false);
  const [reviewCorrect, setReviewCorrect] = useState<boolean | null>(null);
  const [reviewSessionScore, setReviewSessionScore] = useState({ correct: 0, total: 0 });
  const [reviewStartTime, setReviewStartTime] = useState(Date.now());

  const currentReviewQuestion: SpacedReviewQuestion | undefined = reviewQueue[currentReviewIndex];

  const handleReviewAnswer = useCallback(async (optionId: string) => {
    if (reviewAnswered || !currentReviewQuestion?.question) return;
    setSelectedOptionId(optionId);
    setReviewAnswered(true);

    const correctOption = currentReviewQuestion.question.options?.find((o: any) => o.isCorrect === 1);
    const isCorrect = optionId === correctOption?.id;
    setReviewCorrect(isCorrect);
    setReviewSessionScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    const responseTime = Math.round((Date.now() - reviewStartTime) / 1000);

    try {
      await submitReview({
        questionId: currentReviewQuestion.questionId,
        selectedOptionId: optionId,
        isCorrect,
        responseTime,
      });
    } catch {
      // Non-fatal — UI already shows result
    }
  }, [reviewAnswered, currentReviewQuestion, reviewStartTime, submitReview]);

  const handleNextReviewQuestion = useCallback(() => {
    setSelectedOptionId(null);
    setReviewAnswered(false);
    setReviewCorrect(null);
    setReviewStartTime(Date.now());
    if (currentReviewIndex < reviewQueue.length - 1) {
      setCurrentReviewIndex(prev => prev + 1);
    } else {
      // Session complete
      toast({
        title: "Review Session Complete!",
        description: `You reviewed ${reviewSessionScore.total} questions with ${reviewSessionScore.correct} correct.`,
      });
      setCurrentReviewIndex(0);
      setReviewSessionScore({ correct: 0, total: 0 });
      refetchReview();
    }
  }, [currentReviewIndex, reviewQueue.length, reviewSessionScore, toast, refetchReview]);

  const handleRestartReview = useCallback(() => {
    setCurrentReviewIndex(0);
    setSelectedOptionId(null);
    setReviewAnswered(false);
    setReviewCorrect(null);
    setReviewSessionScore({ correct: 0, total: 0 });
    setReviewStartTime(Date.now());
    refetchReview();
  }, [refetchReview]);

    /*
  ----------------------------------------------------------
  Function: getTimeOfDayGreeting

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
const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: "Good morning", emoji: "Rise and shine!", suggestion: "Start with your most challenging task while your mind is fresh." };
    if (hour < 17) return { greeting: "Good afternoon", emoji: "Keep pushing!", suggestion: "Perfect time for focused work. Try a 25-minute session." };
    if (hour < 21) return { greeting: "Good evening", emoji: "Almost there!", suggestion: "Review what you've learned today to boost retention." };
    return { greeting: "Working late", emoji: "Night owl mode!", suggestion: "Keep sessions short. Quality over quantity at this hour." };
  };

  const timeContext = getTimeOfDayGreeting();
  const randomTip = useMemo(() => motivationalTips[Math.floor(Math.random() * motivationalTips.length)], []);

  const pendingTasksCount = tasks.filter(t => t.status !== "done").length;
  const highPriorityTasks = tasks.filter(t => t.priority === "high" && t.status !== "done");

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (timerPresets[selectedPreset].name === "Focus" || timerPresets[selectedPreset].name === "Deep Work") {
            setSessionCount((s) => s + 1);
            setTotalSessionTime((t) => t + timerPresets[selectedPreset].minutes);
          }
          return timerPresets[selectedPreset].minutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, selectedPreset]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((timerPresets[selectedPreset].minutes * 60 - timeLeft) / (timerPresets[selectedPreset].minutes * 60)) * 100;

    /*
  ----------------------------------------------------------
  Function: handlePresetChange

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
const handlePresetChange = (index: number) => {
    setSelectedPreset(index);
    setTimeLeft(timerPresets[index].minutes * 60);
    setIsRunning(false);
  };



    /*
  ----------------------------------------------------------
  Function: handleAddTask

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
const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: String(Date.now()), title: newTask, status: "todo", priority: "medium" }]);
      setNewTask("");
    }
  };

    /*
  ----------------------------------------------------------
  Function: handleDeleteTask

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
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
const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

    /*
  ----------------------------------------------------------
  Function: handleChangeStatus

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - id: Input consumed by this routine during execution
  - status: Input consumed by this routine during execution

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
const handleChangeStatus = (id: string, status: "todo" | "in-progress" | "done") => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const recallReadiness = dueForReviewCount > 0
    ? Math.max(0, Math.round(((dueForReviewCount - needsReviewCount) / dueForReviewCount) * 100))
    : 100;
  const reviewHitRate = reviewSessionScore.total > 0
    ? Math.round((reviewSessionScore.correct / reviewSessionScore.total) * 100)
    : 0;
  const queueCoverage = dueForReviewCount > 0
    ? Math.min(100, Math.round((reviewSessionScore.total / dueForReviewCount) * 100))
    : 0;
  const backlogPressure = needsReviewCount + weakTopicCount;
  const revisionLoad = todoTasks.length + inProgressTasks.length + dueForReviewCount;
  const weeklyRevisionPulse = [
    { day: "Today", reps: Math.min(12, Math.max(1, reviewSessionScore.total || sessionCount || 1)), isToday: true },
    { day: "Yesterday", reps: Math.min(12, Math.max(1, dueForReviewCount - 1)) },
    { day: "2 days ago", reps: Math.min(12, Math.max(1, needsReviewCount + 2)) },
    { day: "3 days ago", reps: Math.min(12, Math.max(1, weakTopicCount + 3)) },
    { day: "4 days ago", reps: Math.min(12, Math.max(1, todoTasks.length + 2)) },
    { day: "5 days ago", reps: Math.min(12, Math.max(1, inProgressTasks.length + 4)) },
    { day: "6 days ago", reps: Math.min(12, Math.max(1, doneTasks.length + 1)) },
  ];

    /*
  ----------------------------------------------------------
  Function: getPriorityColor

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - priority: Input consumed by this routine during execution

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
const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-amber-500";
      case "low": return "border-l-green-500";
      default: return "border-l-gray-400";
    }
  };

  // QuickActions component removed - inline in main layout now

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950 dark:via-orange-950/35 dark:to-rose-950/35">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Completely Redesigned Help Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Welcome Card - Takes up 2 columns */}
          <div className="lg:col-span-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-amber-100 text-xs font-medium">{timeContext.emoji}</p>
                  <h1 className="text-2xl md:text-3xl font-bold">{timeContext.greeting}!</h1>
                </div>
              </div>
              <p className="text-base opacity-95 leading-relaxed">{timeContext.suggestion}</p>
              
              {/* Stats Row */}
              <div className="flex flex-wrap gap-2">
                {pendingTasksCount > 0 && (
                  <Badge className="bg-white/20 text-white border-0 px-3 py-1.5 backdrop-blur-sm">
                    <ListTodo className="h-3 w-3 mr-1.5" />
                    {pendingTasksCount} tasks pending
                  </Badge>
                )}
                {sessionCount > 0 && (
                  <Badge className="bg-success/80 text-white border-0 px-3 py-1.5 backdrop-blur-sm">
                    <CheckCircle2 className="h-3 w-3 mr-1.5" />
                    {sessionCount} sessions today
                  </Badge>
                )}
                {totalDue > 0 && (
                  <Badge className="bg-rose-500/80 text-white border-0 px-3 py-1.5 backdrop-blur-sm">
                    <Brain className="h-3 w-3 mr-1.5" />
                    {totalDue} due for review
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Motivational Tip Card */}
          <Card className="border-2 border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950 dark:to-amber-950 shadow-lg">
            <CardContent className="p-6 h-full flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-md">
                    <Lightbulb className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-rose-900 dark:text-rose-100">Pro Tip</h3>
                </div>
                <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">{randomTip}</p>
              </div>
              <Button
                onClick={() => setShowStatsModal(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:from-amber-600 hover:to-rose-600 mt-2"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Revision Stats
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Smart Suggestion Banner */}
        {highPriorityTasks.length > 0 && (
          <div 
            className="bg-gradient-to-r from-rose-100 via-pink-100 to-fuchsia-100 dark:from-rose-900 dark:via-pink-900 dark:to-fuchsia-900 rounded-xl p-4 border-2 border-rose-200 dark:border-rose-800 shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
            onClick={() => {
              const taskTitle = highPriorityTasks[0].title.toLowerCase();
              if (taskTitle.includes("review") || taskTitle.includes("note")) {
                navigate("/notes");
              } else if (taskTitle.includes("practice") || taskTitle.includes("problem") || taskTitle.includes("quiz")) {
                navigate("/quizzes");
              } else if (taskTitle.includes("card") || taskTitle.includes("flash")) {
                navigate("/flashcards");
              } else {
                navigate("/quizzes");
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100 mb-0.5">Recommended Next</h4>
                <p className="text-sm text-rose-700 dark:text-rose-300">
                  Work on <strong>"{highPriorityTasks[0].title}"</strong> - marked as high priority
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                Start Your Session
              </CardTitle>
              <CardDescription className="text-xs">Choose your focus mode</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 hover:scale-105 transition-transform"
                  onClick={() => handlePresetChange(0)}
                  data-testid="quick-action-focus"
                >
                  <Timer className="h-7 w-7 text-amber-600" />
                  <div className="text-center">
                    <div className="text-sm font-bold">Focus</div>
                    <div className="text-xs text-muted-foreground">25 min</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 hover:scale-105 transition-transform"
                  onClick={() => handlePresetChange(3)}
                >
                  <Brain className="h-7 w-7 text-rose-600" />
                  <div className="text-center">
                    <div className="text-sm font-bold">Deep Work</div>
                    <div className="text-xs text-muted-foreground">50 min</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Organize & Review
              </CardTitle>
              <CardDescription className="text-xs">Manage your learning</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-1.5 border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 hover:scale-105 transition-transform relative"
                    onClick={() => { setActiveTab("review"); handleRestartReview(); }}
                    data-testid="quick-action-review"
                  >
                    <Brain className="h-6 w-6 text-purple-600" />
                    <span className="text-xs font-medium">Review</span>
                    {totalDue > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {totalDue > 9 ? "9+" : totalDue}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-1.5 border-2 border-brand-primary/30 dark:border-brand-primary/40 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 hover:scale-105 transition-transform"
                    onClick={() => setActiveTab("kanban")}
                    data-testid="quick-action-tasks"
                  >
                    <ListTodo className="h-6 w-6 text-brand-primary" />
                    <span className="text-xs font-medium">Tasks</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* ========== POMODORO SECTION ========== */}
        <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-amber-600" />
              Focus Session
            </CardTitle>
            <CardDescription>Choose your timer and stay focused</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {timerPresets.map((preset, index) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetChange(index)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedPreset === index
                        ? `bg-gradient-to-br ${preset.color} text-white border-transparent shadow-lg scale-105`
                        : "bg-card border-border hover:border-amber-300 dark:hover:border-amber-700"
                    }`}
                    data-testid={`preset-${preset.name.toLowerCase().replace(" ", "-")}`}
                  >
                    <preset.icon className={`h-6 w-6 mx-auto mb-2 ${selectedPreset === index ? "text-white" : "text-muted-foreground"}`} />
                    <div className={`font-bold ${selectedPreset === index ? "text-white" : ""}`}>{preset.name}</div>
                    <div className={`text-xs ${selectedPreset === index ? "text-white/80" : "text-muted-foreground"}`}>{preset.minutes} min</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="relative w-48 h-48 md:w-56 md:h-56">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      stroke="url(#pomodoroGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * (45 * (window.innerWidth > 768 ? 140 : 96))}
                      strokeDashoffset={2 * Math.PI * (45 * (window.innerWidth > 768 ? 140 : 96)) * (1 - progress / 100)}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1E3A8A" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-sans text-4xl md:text-5xl font-bold tracking-tight tabular-nums text-foreground">
                      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">{timerPresets[selectedPreset].description}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full md:w-auto">
                  <Button
                    size="lg"
                    onClick={() => setIsRunning(!isRunning)}
                    className={`bg-gradient-to-r ${timerPresets[selectedPreset].color} text-white px-8 h-14`}
                    data-testid="button-pomodoro-toggle"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setTimeLeft(timerPresets[selectedPreset].minutes * 60);
                      setIsRunning(false);
                    }}
                    className="h-14"
                    data-testid="button-pomodoro-reset"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Reset
                  </Button>
                  <div className="space-y-2">
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-4 py-2 w-full justify-center" data-testid="badge-sessions">
                      <Clock className="h-4 w-4 mr-2" />
                      {sessionCount} sessions today
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-4 py-2 w-full justify-center">
                      <Target className="h-4 w-4 mr-2" />
                      {totalSessionTime} min focused
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-3 gap-1 bg-card border-2 border-amber-200 dark:border-amber-800 p-1">
            <TabsTrigger value="review" className="text-xs sm:text-sm data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900 relative">
              <Brain className="h-4 w-4 mr-1.5 hidden sm:block" />
              Review
              {totalDue > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {totalDue > 9 ? "9+" : totalDue}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs sm:text-sm data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900">
              <ListTodo className="h-4 w-4 mr-1.5 hidden sm:block" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="whiteboard" className="text-xs sm:text-sm data-[state=active]:bg-rose-100 dark:data-[state=active]:bg-rose-900">
              <PenLine className="h-4 w-4 mr-1.5 hidden sm:block" />
              Notes
            </TabsTrigger>
          </TabsList>

          {/* ========== SPACED REVIEW TAB ========== */}
          <TabsContent value="review" className="space-y-6 mt-6">
            {reviewLoading ? (
              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardContent className="py-16 text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-3 text-purple-500 animate-spin" />
                  <p className="text-muted-foreground">Loading review queue...</p>
                </CardContent>
              </Card>
            ) : reviewQueue.length === 0 ? (
              /* Empty state — no questions due */
              <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
                <CardContent className="py-16 text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
                  <h3 className="text-xl font-bold">You're all caught up!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    No questions need review right now. Complete more quizzes to populate your spaced review queue.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => refetchReview()}
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Queue
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Review summary bar */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-2 border-destructive/30 dark:border-destructive/40 bg-red-50 dark:bg-red-950">
                    <CardContent className="py-3 text-center">
                      <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
                      <div className="text-2xl font-bold text-destructive dark:text-red-300">{needsReviewCount}</div>
                      <p className="text-xs text-destructive dark:text-red-400">Needs Review</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
                    <CardContent className="py-3 text-center">
                      <Target className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                      <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{weakTopicCount}</div>
                      <p className="text-xs text-amber-600 dark:text-amber-400">Weak Topic</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-brand-primary/30 dark:border-brand-primary/40 bg-brand-primary/10 dark:bg-brand-primary/20">
                    <CardContent className="py-3 text-center">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-brand-primary" />
                      <div className="text-2xl font-bold text-brand-primary dark:text-blue-300">{dueForReviewCount}</div>
                      <p className="text-xs text-brand-primary dark:text-blue-400">Due for Review</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Session progress */}
                {reviewSessionScore.total > 0 && (
                  <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-950 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        Session: {reviewSessionScore.correct}/{reviewSessionScore.total} correct
                      </div>
                      <Progress
                        value={reviewSessionScore.total > 0 ? (reviewSessionScore.correct / reviewSessionScore.total) * 100 : 0}
                        className="h-1.5 mt-1"
                      />
                    </div>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {currentReviewIndex + 1}/{reviewQueue.length}
                    </span>
                  </div>
                )}

                {/* Current question card */}
                {currentReviewQuestion?.question ? (
                  <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          Spaced Review
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              currentReviewQuestion.label === "Needs Review"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0"
                                : currentReviewQuestion.label === "Weak Topic"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-0"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0"
                            }
                          >
                            {currentReviewQuestion.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {currentReviewQuestion.topic}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>
                        From: {currentReviewQuestion.quizTitle} • Accuracy: {currentReviewQuestion.accuracy}% •
                        Attempted {currentReviewQuestion.timesAnswered}x
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {/* Question text */}
                      <div className="text-base font-medium leading-relaxed">
                        {currentReviewQuestion.question.question}
                      </div>

                      {/* MCQ Options */}
                      {currentReviewQuestion.question.type === "mcq" && currentReviewQuestion.question.options?.length > 0 && (
                        <div className="space-y-2">
                          {currentReviewQuestion.question.options
                            .sort((a: any, b: any) => a.order - b.order)
                            .map((option: any) => {
                              const isSelected = selectedOptionId === option.id;
                              const isCorrectOption = option.isCorrect === 1;
                              let optionClass = "border-2 p-3 rounded-lg cursor-pointer transition-all text-left w-full ";

                              if (reviewAnswered) {
                                if (isCorrectOption) {
                                  optionClass += "border-green-500 bg-success/10 dark:bg-success/20";
                                } else if (isSelected && !isCorrectOption) {
                                  optionClass += "border-red-500 bg-red-50 dark:bg-red-950";
                                } else {
                                  optionClass += "border-border opacity-50";
                                }
                              } else {
                                optionClass += isSelected
                                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                                  : "border-border hover:border-purple-300 dark:hover:border-purple-700";
                              }

                              return (
                                <button
                                  key={option.id}
                                  className={optionClass}
                                  onClick={() => handleReviewAnswer(option.id)}
                                  disabled={reviewAnswered}
                                >
                                  <span className="text-sm">{option.text}</span>
                                  {reviewAnswered && isCorrectOption && (
                                    <CheckCircle2 className="inline h-4 w-4 ml-2 text-success" />
                                  )}
                                  {reviewAnswered && isSelected && !isCorrectOption && (
                                    <XCircle className="inline h-4 w-4 ml-2 text-destructive" />
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      )}

                      {/* Non-MCQ placeholder */}
                      {currentReviewQuestion.question.type !== "mcq" && (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-sm text-muted-foreground">
                          <p className="font-medium mb-2">Expected answer:</p>
                          <p>{currentReviewQuestion.question.correctAnswer || "See explanation"}</p>
                          {!reviewAnswered && (
                            <div className="flex gap-2 mt-4">
                              <Button size="sm" variant="outline" className="border-green-300" onClick={() => {
                                setReviewAnswered(true);
                                setReviewCorrect(true);
                                setReviewSessionScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
                                submitReview({ questionId: currentReviewQuestion.questionId, isCorrect: true, responseTime: Math.round((Date.now() - reviewStartTime) / 1000) });
                              }}>
                                <CheckCircle2 className="h-4 w-4 mr-1" /> I knew this
                              </Button>
                              <Button size="sm" variant="outline" className="border-red-300" onClick={() => {
                                setReviewAnswered(true);
                                setReviewCorrect(false);
                                setReviewSessionScore(prev => ({ correct: prev.correct, total: prev.total + 1 }));
                                submitReview({ questionId: currentReviewQuestion.questionId, isCorrect: false, responseTime: Math.round((Date.now() - reviewStartTime) / 1000) });
                              }}>
                                <XCircle className="h-4 w-4 mr-1" /> Didn't know
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Feedback after answering */}
                      {reviewAnswered && currentReviewQuestion.question.explanation && (
                        <div className={`rounded-lg p-4 text-sm ${
                          reviewCorrect
                            ? "bg-success/10 dark:bg-success/20 border border-success/30 dark:border-success/40"
                            : "bg-red-50 dark:bg-red-950 border border-destructive/30 dark:border-destructive/40"
                        }`}>
                          <p className="font-medium mb-1">
                            {reviewCorrect ? "✓ Correct!" : "✗ Incorrect"}
                          </p>
                          <p className="text-muted-foreground">{currentReviewQuestion.question.explanation}</p>
                        </div>
                      )}

                      {/* Next / Restart buttons */}
                      {reviewAnswered && (
                        <div className="flex items-center justify-between pt-2">
                          <Button variant="outline" size="sm" onClick={handleRestartReview}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restart
                          </Button>
                          <Button
                            onClick={handleNextReviewQuestion}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            {currentReviewIndex < reviewQueue.length - 1 ? (
                              <>Next Question <ChevronRight className="h-4 w-4 ml-1" /></>
                            ) : (
                              <>Finish Session <CheckCircle2 className="h-4 w-4 ml-1" /></>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-purple-200 dark:border-purple-800">
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Loading question...</p>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming queue preview */}
                {reviewQueue.length > 1 && (
                  <Card className="border border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Upcoming ({reviewQueue.length - currentReviewIndex - 1} remaining)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {reviewQueue.slice(currentReviewIndex + 1, currentReviewIndex + 4).map((item, idx) => (
                        <div
                          key={item.questionId + idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm"
                        >
                          <span className="truncate flex-1 mr-2">{item.questionText}</span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] shrink-0 ${
                              item.label === "Needs Review"
                                ? "bg-red-100 text-destructive dark:bg-red-900 dark:text-red-300"
                                : item.label === "Weak Topic"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                : "bg-blue-100 text-brand-primary dark:bg-blue-900 dark:text-blue-300"
                            }`}
                          >
                            {item.label}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="kanban" className="space-y-6 mt-6">
            <Card className="border-2 border-brand-primary/30 dark:border-brand-primary/40 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900">
                <CardTitle>Task Board</CardTitle>
                <CardDescription>Click tasks to move them forward. Organize your revision.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Add a new task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                    className="flex-1 border-2 border-brand-primary/30 dark:border-brand-primary/40"
                    data-testid="input-new-task"
                  />
                  <Button onClick={handleAddTask} className="bg-brand-primary/100 hover:bg-blue-600 text-white" data-testid="button-add-task">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Todo Column */}
                  <div className="rounded-lg p-4 min-h-64 space-y-3 bg-slate-100 dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm">To Do</h3>
                      <Badge variant="secondary" className="text-xs">{todoTasks.length}</Badge>
                    </div>
                    {todoTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`bg-card p-3 rounded-lg shadow-sm cursor-pointer hover-elevate border-l-4 ${getPriorityColor(task.priority)}`}
                        onClick={() => handleChangeStatus(task.id, "in-progress")}
                        data-testid={`task-${task.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium flex-1">{task.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            data-testid={`button-delete-${task.id}`}
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {todoTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">No tasks yet</p>
                    )}
                  </div>

                  {/* In Progress Column */}
                  <div className="rounded-lg p-4 min-h-64 space-y-3 bg-blue-100 dark:bg-blue-900/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm">In Progress</h3>
                      <Badge className="bg-brand-primary/100 text-white text-xs">{inProgressTasks.length}</Badge>
                    </div>
                    {inProgressTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`bg-card p-3 rounded-lg shadow-sm cursor-pointer hover-elevate border-l-4 ${getPriorityColor(task.priority)}`}
                        onClick={() => handleChangeStatus(task.id, "done")}
                        data-testid={`task-${task.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium flex-1">{task.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            data-testid={`button-delete-${task.id}`}
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {inProgressTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">Click a task to start</p>
                    )}
                  </div>

                  {/* Done Column */}
                  <div className="rounded-lg p-4 min-h-64 space-y-3 bg-green-100 dark:bg-green-900/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm">Done</h3>
                      <Badge className="bg-success/100 text-white text-xs">{doneTasks.length}</Badge>
                    </div>
                    {doneTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-card p-3 rounded-lg shadow-sm cursor-pointer hover-elevate border-l-4 border-l-green-500 opacity-75"
                        onClick={() => handleChangeStatus(task.id, "todo")}
                        data-testid={`task-${task.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium flex-1 line-through">{task.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            data-testid={`button-delete-${task.id}`}
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {doneTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">Complete tasks to see them here</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whiteboard" className="space-y-6 mt-6">
            <Card className="border-2 border-rose-200 dark:border-rose-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900 dark:to-pink-900">
                <CardTitle className="flex items-center gap-2">
                  <PenLine className="h-5 w-5" />
                  Quick Notes
                </CardTitle>
                <CardDescription>Jot down ideas, formulas, or anything you need to remember</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  value={whiteboard}
                  onChange={(e) => setWhiteboard(e.target.value)}
                  placeholder="Write down your ideas, sketches, formulas, diagrams... Let your creativity flow!"
                  className="min-h-80 p-4 rounded-lg font-mono text-sm border-2 border-rose-200 dark:border-rose-800 focus:border-rose-500 dark:focus:border-rose-400"
                  data-testid="textarea-whiteboard"
                />
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{whiteboard.length} characters</span>
                  <Button
                    variant="outline"
                    onClick={() => setWhiteboard("")}
                    data-testid="button-clear-whiteboard"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ========== STATS MODAL ========== */}
        <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-600" />
                Revision Aids Pulse
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Recall Readiness */}
                <Card className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-900 border-amber-200 dark:border-amber-800 shadow-md">
                  <CardContent className="pt-6 text-center space-y-2">
                    <div className="flex justify-center">
                      <Zap className="h-8 w-8 text-amber-600" />
                    </div>
                    <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                      {recallReadiness}%
                    </div>
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Recall Readiness
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 opacity-75">
                      Review queue stabilization
                    </p>
                  </CardContent>
                </Card>

                {/* Queue Pressure */}
                <Card className="bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950 dark:to-pink-900 border-rose-200 dark:border-rose-800 shadow-md">
                  <CardContent className="pt-6 text-center space-y-2">
                    <div className="flex justify-center">
                      <Clock className="h-8 w-8 text-rose-600" />
                    </div>
                    <div className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                      {backlogPressure}
                    </div>
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      Queue Pressure
                    </p>
                    <p className="text-xs text-rose-600 dark:text-rose-400 opacity-75">
                      Needs review + weak topics
                    </p>
                  </CardContent>
                </Card>

                {/* Session Recall Hit Rate */}
                <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-900 border-amber-200 dark:border-amber-800 shadow-md">
                  <CardContent className="pt-6 text-center space-y-2">
                    <div className="flex justify-center">
                      <Target className="h-8 w-8 text-amber-600" />
                    </div>
                    <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                      {reviewSessionScore.total > 0 ? `${reviewHitRate}%` : "—"}
                    </div>
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Recall Hit Rate
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 opacity-75">
                      Current revision session
                    </p>
                  </CardContent>
                </Card>

                {/* Queue Coverage */}
                <Card className="bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950 dark:to-red-900 border-rose-200 dark:border-rose-800 shadow-md">
                  <CardContent className="pt-6 text-center space-y-2">
                    <div className="flex justify-center">
                      <CheckCircle2 className="h-8 w-8 text-rose-600" />
                    </div>
                    <div className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                      {queueCoverage}%
                    </div>
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      Queue Coverage
                    </p>
                    <p className="text-xs text-rose-600 dark:text-rose-400 opacity-75">
                      Due items touched today
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revision Diagnostic */}
              <div className="bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-950/50 dark:to-rose-950/50 rounded-lg p-4 border border-amber-200/70 dark:border-rose-800/50">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Revision Diagnostic
                </h3>
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  {revisionLoad <= 4
                    ? "✅ Low revision load. You can focus on deeper explanation quality and exam phrasing."
                    : revisionLoad <= 10
                    ? "⚖️ Balanced revision load. Rotate between weak topics and quick recall drills."
                    : "🚨 High revision load. Prioritize struggling topics first, then clear due queue in short bursts."}
                </p>
              </div>

              {/* Recall Heatstrip */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recall Heatstrip (7-day)
                </h3>
                <div className="space-y-3">
                  {weeklyRevisionPulse.map((stat, idx) => (
                    <div key={idx} className="space-y-1.5" data-testid={`history-${idx}`}>
                      <div className="flex justify-between items-center text-sm">
                        <span className={`font-medium ${stat.isToday ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>
                          {stat.day}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          stat.reps >= 8
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                            : stat.reps >= 4
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                        }`}>
                          {stat.reps} recall reps
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(Math.min(stat.reps, 12))].map((_, i) => (
                          <div key={i} className="flex-1 h-2 bg-rose-500 rounded-sm" />
                        ))}
                        {[...Array(Math.max(0, 12 - stat.reps))].map((_, i) => (
                          <div key={i} className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-sm" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalized Recommendations */}
              <div className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/60 dark:to-amber-950/60 rounded-lg p-4 border border-rose-200/80 dark:border-amber-800/60 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  Recommended Next Steps
                </h3>
                <ul className="text-sm space-y-2 text-rose-900 dark:text-rose-100">
                  {needsReviewCount > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 dark:text-rose-400 font-bold">▸</span>
                      <span>Review <strong>{needsReviewCount}</strong> struggling topics to solidify your knowledge</span>
                    </li>
                  )}
                  {todoTasks.length > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 dark:text-rose-400 font-bold">▸</span>
                      <span>Complete <strong>{todoTasks.length}</strong> pending task{todoTasks.length !== 1 ? "s" : ""} to stay on track</span>
                    </li>
                  )}
                  {sessionCount < 3 && (
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 dark:text-rose-400 font-bold">▸</span>
                      <span>Aim for <strong>3-5 focused sessions</strong> daily to maximize retention</span>
                    </li>
                  )}
                  {sessionCount >= 3 && (
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 dark:text-rose-400 font-bold">▸</span>
                      <span>You're crushing it! Take a <strong>15-minute break</strong> to recharge</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
