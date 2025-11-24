import { useState, useEffect } from "react";
import { Plus, Play, Clock, CheckCircle2, AlertCircle, Star, BookMarked, Zap, Trophy, Target, RotateCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QuizStatus = "not-started" | "in-progress" | "completed";
type QuestionType = "MCQ" | "SAQ" | "LAQ";
type QuizMode = "practice" | "exam";
type Difficulty = 1 | 2 | 3 | 4 | 5;

interface Quiz {
  id: string;
  title: string;
  subject: string;
  questions: number;
  timeLimit: number;
  status: QuizStatus;
  score?: number;
  difficulty?: Difficulty;
  questionTypes: QuestionType[];
}

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct: number | string;
  explanation: string;
  markScheme?: string;
  difficulty: Difficulty;
}

export default function Quizzes() {
  const [view, setView] = useState<"list" | "taking" | "results">("list");
  const [quizMode, setQuizMode] = useState<QuizMode>("practice");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState("");
  const [userAnswers, setUserAnswers] = useState<Array<{questionId: string, answer: string, correct: boolean}>>([]);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);

  const quizzes: Quiz[] = [
    {
      id: "1",
      title: "React Fundamentals",
      subject: "Computer Science",
      questions: 10,
      timeLimit: 15,
      status: "completed",
      score: 85,
      difficulty: 3,
      questionTypes: ["MCQ", "SAQ"],
    },
    {
      id: "2",
      title: "Calculus Chapter 3",
      subject: "Mathematics",
      questions: 15,
      timeLimit: 20,
      status: "in-progress",
      difficulty: 4,
      questionTypes: ["MCQ", "LAQ"],
    },
    {
      id: "3",
      title: "Physics: Motion",
      subject: "Physics",
      questions: 12,
      timeLimit: 18,
      status: "not-started",
      difficulty: 2,
      questionTypes: ["MCQ", "SAQ", "LAQ"],
    },
  ];

  const sampleQuestions: Question[] = [
    {
      id: "q1",
      type: "MCQ",
      question: "What is the purpose of the useState hook in React?",
      options: [
        "To manage component state",
        "To handle side effects",
        "To fetch data from APIs",
        "To optimize performance",
      ],
      correct: 0,
      explanation: "useState is a React Hook that lets you add state to functional components. It returns an array with the current state value and a function to update it.",
      markScheme: "1 mark for correct answer. Common mistake: confusing with useEffect for side effects.",
      difficulty: 2,
    },
    {
      id: "q2",
      type: "SAQ",
      question: "Explain what props are in React and how they differ from state.",
      correct: "Props are read-only data passed from parent to child components, while state is mutable data managed within a component.",
      explanation: "Props (short for properties) are how data flows down the component tree, from parent to child. They're immutable from the child's perspective. State, on the other hand, is local to a component and can be changed, triggering re-renders.",
      markScheme: "2 marks: 1 for props definition, 1 for state difference. Accept variations mentioning immutability and data flow.",
      difficulty: 3,
    },
    {
      id: "q3",
      type: "LAQ",
      question: "Describe the component lifecycle in React class components and compare it with how useEffect works in functional components.",
      correct: "Class components have lifecycle methods like componentDidMount, componentDidUpdate, and componentWillUnmount. useEffect in functional components can replicate all these by using dependency arrays.",
      explanation: "In class components, lifecycle is split into mounting, updating, and unmounting phases. useEffect consolidates this: an empty dependency array mimics componentDidMount, dependencies trigger on updates (like componentDidUpdate), and the cleanup function acts like componentWillUnmount.",
      markScheme: "4 marks total: 1 for each lifecycle phase mentioned, 1 for useEffect dependency array explanation. Maximum 4 marks.",
      difficulty: 5,
    },
  ];

  const getDifficultyColor = (difficulty: Difficulty) => {
    const colors = {
      1: "text-green-600",
      2: "text-blue-600",
      3: "text-yellow-600",
      4: "text-orange-600",
      5: "text-red-600",
    };
    return colors[difficulty];
  };

  const getDifficultyLabel = (difficulty: Difficulty) => {
    const labels = { 1: "Very Easy", 2: "Easy", 3: "Medium", 4: "Hard", 5: "Very Hard" };
    return labels[difficulty];
  };

  if (view === "results") {
    const totalQuestions = sampleQuestions.length;
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
          {/* Celebratory Header */}
          <div className={`bg-gradient-to-r ${scoreColor} rounded-2xl p-8 text-white text-center shadow-lg`}>
            <div className="mb-4 flex justify-center gap-2 animate-bounce">
              <Trophy className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-lg opacity-90">You scored {correctAnswers} out of {totalQuestions} questions correctly</p>
          </div>

          {/* Score Display */}
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">{correctAnswers}</div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Correct Answers</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-700 dark:text-red-300">{totalQuestions - correctAnswers}</div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Incorrect Answers</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6 text-center">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{score >= 75 ? "+" : ""}{correctAnswers * 10}</div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">XP Earned</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900 rounded-t-lg">
              <CardTitle className="text-2xl">Review Your Answers</CardTitle>
              <CardDescription>Learn from your mistakes and improve</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {sampleQuestions.map((question, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer?.correct;

                return (
                  <div key={question.id} className={`border-2 rounded-xl p-4 space-y-3 transition-all ${isCorrect ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30' : 'border-red-400 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {isCorrect ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">Question {index + 1}</span>
                            <Badge variant="outline">{question.type}</Badge>
                          </div>
                          <p className="text-sm mb-3">{question.question}</p>

                          {question.type === "MCQ" && question.options && (
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Your answer:</span>
                                <span className={isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                  {question.options[parseInt(userAnswer?.answer || "0")]}
                                </span>
                              </div>
                              {!isCorrect && (
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Correct answer:</span>
                                  <span className="text-green-600 font-medium">
                                    {question.options[question.correct as number]}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg text-sm border-l-4 border-blue-500">
                            <div className="font-medium mb-1 text-blue-700 dark:text-blue-400">Explanation:</div>
                            <p className="text-foreground">{question.explanation}</p>
                          </div>

                          {question.markScheme && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span className="font-medium">Mark Scheme:</span> {question.markScheme}
                            </div>
                          )}
                        </div>
                      </div>
                      {!isCorrect && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                          onClick={() => console.log(`Create flashcard from Q${index + 1}`)}
                          data-testid={`button-create-flashcard-${index}`}
                        >
                          <BookMarked className="h-4 w-4 mr-2" />
                          Create Flashcard
                        </Button>
                      )}
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
                setCurrentQuestion(0);
                setUserAnswers([]);
              }}
              data-testid="button-back-to-quizzes"
            >
              Back to Quizzes
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
              onClick={() => {
                setView("taking");
                setCurrentQuestion(0);
                setUserAnswers([]);
                setTimeLeft(15 * 60);
              }}
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

  if (view === "taking") {
    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    const question = sampleQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const handleNext = () => {
      const answer = question.type === "MCQ" ? selectedAnswer : textAnswer;
      const isCorrect = question.type === "MCQ" 
        ? parseInt(answer) === question.correct
        : true;

      setFeedbackCorrect(isCorrect);
      setShowFeedback(true);

      setTimeout(() => {
        setUserAnswers([...userAnswers, { questionId: question.id, answer, correct: isCorrect }]);

        if (currentQuestion < sampleQuestions.length - 1) {
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
        {/* Header */}
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
                  {currentQuestion + 1}/{sampleQuestions.length}
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

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div className="w-full max-w-4xl">
            {/* Question Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 mb-6 border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="outline" className="text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                  {question.type}
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

              {question.type === "MCQ" && question.options ? (
                <div className="space-y-4">
                  {question.options.map((option, index) => {
                    const isSelected = selectedAnswer === String(index);
                    const isCorrectOption = index === question.correct;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => !showFeedback && setSelectedAnswer(String(index))}
                        disabled={showFeedback}
                        className={`w-full p-5 rounded-xl font-semibold text-lg transition-all duration-300 cursor-pointer text-left border-2 flex items-center gap-3 ${
                          showFeedback && isCorrectOption
                            ? 'border-green-500 bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100 scale-105 shadow-lg'
                            : showFeedback && isSelected && !isCorrectOption
                            ? 'border-red-500 bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100 scale-95 shadow-lg'
                            : isSelected && !showFeedback
                            ? 'border-purple-500 bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-100 shadow-lg'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 hover:scale-102'
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
                        <span className="flex-1">{option}</span>
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
                    question.type === "SAQ"
                      ? "Write your short answer here (2-3 sentences)..."
                      : "Write your detailed answer here..."
                  }
                  className={`min-h-40 p-4 rounded-lg font-base border-2 ${question.type === "LAQ" ? "min-h-56" : ""}`}
                  data-testid="textarea-answer"
                />
              )}
            </div>

            {/* Feedback Display */}
            {showFeedback && (
              <div className={`p-6 rounded-xl mb-6 text-center text-lg font-bold text-white animate-bounce ${
                feedbackCorrect 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' 
                  : 'bg-gradient-to-r from-red-500 to-pink-600 shadow-lg'
              }`}>
                {feedbackCorrect ? '🎉 Correct!' : '❌ Incorrect, but you\'ll learn!'}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                size="lg"
                disabled={currentQuestion === 0 || showFeedback}
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                className="border-2"
                data-testid="button-previous"
              >
                Previous
              </Button>
              <Button
                size="lg"
                onClick={handleNext}
                disabled={showFeedback || (question.type === "MCQ" ? !selectedAnswer : !textAnswer.trim())}
                className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white text-lg font-bold"
                data-testid="button-next"
              >
                {showFeedback ? (
                  <>
                    <Zap className="h-5 w-5 mr-2 animate-spin" />
                    Next Question...
                  </>
                ) : currentQuestion < sampleQuestions.length - 1 ? (
                  "Next Question"
                ) : (
                  "Submit Quiz"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Quizzes</h1>
              <p className="text-lg opacity-90 max-w-2xl">Challenge yourself with engaging quizzes. Test your knowledge with MCQ, SAQ, and LAQ question formats.</p>
            </div>
            <Trophy className="h-12 w-12 opacity-50" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Select defaultValue="all">
            <SelectTrigger className="w-48 bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-800" data-testid="select-filter-difficulty">
              <SelectValue placeholder="Filter by Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="1">Very Easy</SelectItem>
              <SelectItem value="2">Easy</SelectItem>
              <SelectItem value="3">Medium</SelectItem>
              <SelectItem value="4">Hard</SelectItem>
              <SelectItem value="5">Very Hard</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-6 py-2 h-11" data-testid="button-create-quiz">
            <Plus className="h-5 w-5 mr-2" />
            Create Quiz
          </Button>
        </div>

        {/* Quiz Tabs */}
        <Tabs defaultValue="practice" onValueChange={(v) => setQuizMode(v as QuizMode)}>
          <TabsList className="bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-800 p-1">
            <TabsTrigger value="practice" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white" data-testid="tab-practice">
              <Play className="h-4 w-4 mr-2" />
              Practice Mode
            </TabsTrigger>
            <TabsTrigger value="exam" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white" data-testid="tab-exam">
              <Target className="h-4 w-4 mr-2" />
              Exam Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="practice" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => {
                const statusColors = {
                  "not-started": "from-blue-500 to-cyan-600",
                  "in-progress": "from-yellow-500 to-orange-600",
                  "completed": "from-green-500 to-emerald-600",
                };
                const gradient = statusColors[quiz.status];

                return (
                  <Card 
                    key={quiz.id} 
                    className="hover-elevate border-2 border-purple-200 dark:border-purple-800 overflow-hidden transition-all hover:shadow-2xl cursor-pointer" 
                    data-testid={`card-quiz-${quiz.id}`}
                  >
                    {/* Gradient Header */}
                    <div className={`h-24 bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                      <Play className="h-10 w-10 text-white opacity-50" />
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-0">
                          {quiz.subject}
                        </Badge>
                        <div className="flex gap-1">
                          {quiz.questionTypes.map((type) => (
                            <Badge key={type} className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 text-xs border-0">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <CardTitle className="text-xl line-clamp-2">{quiz.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-center">
                          <p className="text-muted-foreground text-xs font-medium">Questions</p>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{quiz.questions}</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-center">
                          <p className="text-muted-foreground text-xs font-medium">Time</p>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{quiz.timeLimit}m</p>
                        </div>
                      </div>

                      {/* Score if completed */}
                      {quiz.status === "completed" && quiz.score && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-3 rounded-lg">
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Previous Score</p>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{quiz.score}%</div>
                            <Progress value={quiz.score} className="h-2 flex-1" />
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        className={`w-full font-bold text-base py-2 h-11 ${
                          quiz.status === "completed"
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            : "bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
                        }`}
                        onClick={() => {
                          setView("taking");
                          setQuizMode("practice");
                          setTimeLeft(quiz.timeLimit * 60);
                          setCurrentQuestion(0);
                          setUserAnswers([]);
                          console.log(`Starting quiz: ${quiz.title}`);
                        }}
                        data-testid={`button-start-quiz-${quiz.id}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {quiz.status === "completed" ? "Review" : quiz.status === "in-progress" ? "Continue" : "Start Quiz"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="exam" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <Card 
                  key={quiz.id} 
                  className="hover-elevate border-2 border-amber-200 dark:border-amber-800 overflow-hidden transition-all hover:shadow-2xl cursor-pointer" 
                  data-testid={`card-quiz-exam-${quiz.id}`}
                >
                  {/* Gradient Header for Exam */}
                  <div className="h-24 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <Target className="h-10 w-10 text-white m-auto" />
                    </div>
                    <Target className="h-10 w-10 text-white opacity-50 relative z-10" />
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-0">
                        {quiz.subject}
                      </Badge>
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                        EXAM
                      </Badge>
                    </div>
                    <CardTitle className="text-xl line-clamp-2">{quiz.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">{quiz.questions} Questions</span>
                        <Badge variant="outline" className="border-amber-300 dark:border-amber-700">Hard Limit</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950 p-2 rounded-lg">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>Timed: {quiz.timeLimit} minutes</span>
                      </div>
                    </div>

                    <Button
                      className="w-full font-bold text-base py-2 h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                      onClick={() => {
                        setView("taking");
                        setQuizMode("exam");
                        setTimeLeft(quiz.timeLimit * 60);
                        setCurrentQuestion(0);
                        setUserAnswers([]);
                        console.log(`Starting exam: ${quiz.title}`);
                      }}
                      data-testid={`button-start-exam-${quiz.id}`}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Start Exam
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
