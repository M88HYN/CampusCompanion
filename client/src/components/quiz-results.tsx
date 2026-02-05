import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, RotateCw, ChevronRight } from "lucide-react";

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  timeSpent: number;
  xpEarned: number;
  onRetry: () => void;
  onContinue: () => void;
}

export function QuizResults({
  score,
  totalQuestions,
  timeSpent,
  xpEarned,
  onRetry,
  onContinue,
}: QuizResultsProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  const getEmoji = (percentage: number): string => {
    if (percentage >= 90) return "🎉";
    if (percentage >= 80) return "👏";
    if (percentage >= 70) return "😊";
    if (percentage >= 60) return "🤔";
    if (percentage >= 50) return "💪";
    return "📚";
  };

  const getColor = (
    percentage: number
  ): "bg-green-100" | "bg-blue-100" | "bg-amber-100" | "bg-red-100" => {
    if (percentage >= 80) return "bg-green-100";
    if (percentage >= 60) return "bg-blue-100";
    if (percentage >= 40) return "bg-amber-100";
    return "bg-red-100";
  };

  const grade = getGrade(percentage);
  const emoji = getEmoji(percentage);

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Main Score Card */}
      <Card className={`${getColor(percentage)} border-2 overflow-hidden`}>
        <CardContent className="p-8 text-center">
          <div className="text-6xl font-bold mb-2">{emoji}</div>
          <h2 className="text-4xl font-bold mb-2">
            {percentage}%
          </h2>
          <p className="text-xl text-muted-foreground mb-4">
            You scored {score} out of {totalQuestions}
          </p>
          
          <div className="flex justify-center gap-4 mb-6">
            <Badge variant="default" className="text-lg px-4 py-2">
              Grade: <span className="ml-2 font-bold">{grade}</span>
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <span className="font-bold text-amber-500">+{xpEarned} XP</span>
            </Badge>
          </div>

          <Progress value={percentage} className="h-3 mb-4" />

          <div className="text-sm text-muted-foreground">
            Time spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {percentage >= 90 &&
              "Outstanding performance! You've completely mastered this material. Keep it up!"}
            {percentage >= 80 &&
              percentage < 90 &&
              "Great job! You have a strong understanding of the material. A bit more practice on weak areas would help."}
            {percentage >= 70 &&
              percentage < 80 &&
              "Good effort! You're on the right track. Review the concepts you missed and try again."}
            {percentage >= 60 &&
              percentage < 70 &&
              "You're making progress! Focus on understanding the core concepts you struggled with."}
            {percentage >= 50 &&
              percentage < 60 &&
              "Keep practicing! Review the material and try again to improve your score."}
            {percentage < 50 &&
              "Don't give up! Learning takes time. Review the material carefully and try again."}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex-1 border-2"
        >
          <RotateCw className="h-4 w-4 mr-2" />
          Retry with Shuffled Questions
        </Button>
        <Button
          onClick={onContinue}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
        >
          Continue Learning
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export function TimerMode({
  timeLeft,
  onTimeEnd,
}: {
  timeLeft: number;
  onTimeEnd: () => void;
}) {
  const getTimerColor = (seconds: number) => {
    if (seconds <= 10) return "text-red-600";
    if (seconds <= 30) return "text-amber-600";
    return "text-emerald-600";
  };

  return (
    <div className={`text-center p-4 rounded-lg border-2 ${getTimerColor(timeLeft)}`}>
      <div className="text-3xl font-bold">{timeLeft}s</div>
      <p className="text-sm text-muted-foreground">Time remaining</p>
    </div>
  );
}
