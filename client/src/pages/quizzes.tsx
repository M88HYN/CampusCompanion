import { useState } from "react";
import { Plus, Play, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type QuizStatus = "not-started" | "in-progress" | "completed";

interface Quiz {
  id: string;
  title: string;
  subject: string;
  questions: number;
  timeLimit: number;
  status: QuizStatus;
  score?: number;
}

export default function Quizzes() {
  const [view, setView] = useState<"list" | "taking">("list");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const quizzes: Quiz[] = [
    {
      id: "1",
      title: "React Fundamentals",
      subject: "Computer Science",
      questions: 10,
      timeLimit: 15,
      status: "completed",
      score: 85,
    },
    {
      id: "2",
      title: "Calculus Chapter 3",
      subject: "Mathematics",
      questions: 15,
      timeLimit: 20,
      status: "in-progress",
    },
    {
      id: "3",
      title: "Physics: Motion",
      subject: "Physics",
      questions: 12,
      timeLimit: 18,
      status: "not-started",
    },
    {
      id: "4",
      title: "Data Structures",
      subject: "Computer Science",
      questions: 20,
      timeLimit: 30,
      status: "not-started",
    },
  ];

  const sampleQuestions = [
    {
      question: "What is the purpose of the useState hook in React?",
      options: [
        "To manage component state",
        "To handle side effects",
        "To fetch data from APIs",
        "To optimize performance",
      ],
      correct: 0,
    },
    {
      question: "Which method is used to update state in a functional component?",
      options: [
        "this.setState()",
        "updateState()",
        "The setter function from useState",
        "state.update()",
      ],
      correct: 2,
    },
  ];

  const getStatusColor = (status: QuizStatus) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in-progress":
        return "text-amber-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: QuizStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return <Play className="h-5 w-5" />;
    }
  };

  if (view === "taking") {
    const question = sampleQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100;

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {sampleQuestions.length}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">12:34</span>
            </div>
          </div>

          <Progress value={progress} className="h-2" />

          <Card>
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
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
              onClick={() => {
                if (currentQuestion < sampleQuestions.length - 1) {
                  setCurrentQuestion(currentQuestion + 1);
                  setSelectedAnswer("");
                } else {
                  setView("list");
                  setCurrentQuestion(0);
                  setSelectedAnswer("");
                  console.log("Quiz completed!");
                }
              }}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quizzes</h1>
            <p className="text-muted-foreground mt-2">Test your knowledge and track your progress</p>
          </div>
          <Button data-testid="button-create-quiz">
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover-elevate" data-testid={`card-quiz-${quiz.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline">{quiz.subject}</Badge>
                  {getStatusIcon(quiz.status)}
                </div>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription className="space-y-1">
                  <div>{quiz.questions} questions</div>
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
                    console.log(`Starting quiz: ${quiz.title}`);
                  }}
                  data-testid={`button-start-quiz-${quiz.id}`}
                >
                  {quiz.status === "completed" ? "Review" : quiz.status === "in-progress" ? "Continue" : "Start Quiz"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
