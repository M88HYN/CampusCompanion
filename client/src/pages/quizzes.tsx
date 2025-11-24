import { useState } from "react";
import { Plus, Play, Clock, CheckCircle2, AlertCircle, Star, BookMarked } from "lucide-react";
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

    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Card className="border-primary/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
              <CardDescription className="text-lg">
                You scored {correctAnswers} out of {totalQuestions} questions correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">{score}%</div>
                  <Progress value={score} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Feedback</CardTitle>
              <CardDescription>Review your answers and learn from mistakes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sampleQuestions.map((question, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer?.correct;

                return (
                  <div key={question.id} className="border rounded-md p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
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

                          <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm">
                            <div className="font-medium mb-1">Explanation:</div>
                            <p className="text-muted-foreground">{question.explanation}</p>
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
                          variant="outline"
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
              className="flex-1"
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
              className="flex-1"
              onClick={() => {
                setView("taking");
                setCurrentQuestion(0);
                setUserAnswers([]);
              }}
              data-testid="button-retake-quiz"
            >
              Retake Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "taking") {
    const question = sampleQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100;

    const handleNext = () => {
      const answer = question.type === "MCQ" ? selectedAnswer : textAnswer;
      const isCorrect = question.type === "MCQ" 
        ? parseInt(answer) === question.correct
        : true; // For SAQ/LAQ, would need proper grading

      setUserAnswers([...userAnswers, { questionId: question.id, answer, correct: isCorrect }]);

      if (currentQuestion < sampleQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer("");
        setTextAnswer("");
      } else {
        setView("results");
      }
    };

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={quizMode === "exam" ? "default" : "secondary"}>
                {quizMode === "exam" ? "Exam Mode" : "Practice Mode"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {sampleQuestions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">12:34</span>
            </div>
          </div>

          <Progress value={progress} className="h-2" />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{question.type}</Badge>
                <div className="flex items-center gap-1">
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
                  <span className={`text-sm ml-2 ${getDifficultyColor(question.difficulty)}`}>
                    {getDifficultyLabel(question.difficulty)}
                  </span>
                </div>
              </div>
              <CardTitle className="text-xl leading-relaxed">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              {question.type === "MCQ" && question.options ? (
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 border rounded-md p-4 hover-elevate cursor-pointer"
                        data-testid={`option-${index}`}
                      >
                        <RadioGroupItem value={String(index)} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <Textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder={
                    question.type === "SAQ"
                      ? "Write your short answer here (2-3 sentences)..."
                      : "Write your detailed answer here..."
                  }
                  className={question.type === "LAQ" ? "min-h-48" : "min-h-32"}
                  data-testid="textarea-answer"
                />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              data-testid="button-previous"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={question.type === "MCQ" ? !selectedAnswer : !textAnswer.trim()}
              data-testid="button-next"
            >
              {currentQuestion < sampleQuestions.length - 1 ? "Next" : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quizzes</h1>
            <p className="text-muted-foreground mt-2">Test your knowledge with MCQ, SAQ, and LAQ</p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-40" data-testid="select-filter-difficulty">
                <SelectValue placeholder="Difficulty" />
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
            <Button data-testid="button-create-quiz">
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </div>
        </div>

        <Tabs defaultValue="practice" onValueChange={(v) => setQuizMode(v as QuizMode)}>
          <TabsList>
            <TabsTrigger value="practice" data-testid="tab-practice">Practice Mode</TabsTrigger>
            <TabsTrigger value="exam" data-testid="tab-exam">Exam Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="practice" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="hover-elevate" data-testid={`card-quiz-${quiz.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{quiz.subject}</Badge>
                      <div className="flex gap-1">
                        {quiz.questionTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{quiz.questions} questions</span>
                        {quiz.difficulty && (
                          <span className={`text-xs ${getDifficultyColor(quiz.difficulty)}`}>
                            {getDifficultyLabel(quiz.difficulty)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {quiz.timeLimit} minutes
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quiz.status === "completed" && quiz.score && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Score</span>
                          <span className="font-medium">{quiz.score}%</span>
                        </div>
                        <Progress value={quiz.score} className="h-2" />
                      </div>
                    )}
                    <Button
                      variant={quiz.status === "completed" ? "outline" : "default"}
                      className="w-full"
                      onClick={() => {
                        setView("taking");
                        setQuizMode("practice");
                        console.log(`Starting quiz: ${quiz.title}`);
                      }}
                      data-testid={`button-start-quiz-${quiz.id}`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {quiz.status === "completed" ? "Review" : quiz.status === "in-progress" ? "Continue" : "Start Quiz"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="exam" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="hover-elevate" data-testid={`card-quiz-exam-${quiz.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{quiz.subject}</Badge>
                      <Badge variant="default">Exam</Badge>
                    </div>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription className="space-y-1">
                      <div>{quiz.questions} questions</div>
                      <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3 w-3" />
                        Timed: {quiz.timeLimit} minutes
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setView("taking");
                        setQuizMode("exam");
                        console.log(`Starting exam: ${quiz.title}`);
                      }}
                      data-testid={`button-start-exam-${quiz.id}`}
                    >
                      <Play className="h-4 w-4 mr-2" />
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
