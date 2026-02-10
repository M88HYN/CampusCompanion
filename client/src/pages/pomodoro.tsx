import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Coffee,
  Zap,
  Check,
  Calendar,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface PomodoroStats {
  sessionsCompleted: number;
  breaksTaken: number;
  totalFocusTime: number; // in minutes
  currentStreak: number;
}

const SOUND_URL =
  "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj==";

export default function Pomodoro() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timer settings
  const [workDuration, setWorkDuration] = useState<number>(25); // minutes
  const [breakDuration, setBreakDuration] = useState<number>(5); // minutes
  const [isWorkSession, setIsWorkSession] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(25 * 60); // in seconds
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Stats
  const [stats, setStats] = useState<PomodoroStats>({
    sessionsCompleted: 0,
    breaksTaken: 0,
    totalFocusTime: 0,
    currentStreak: 0,
  });

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer completed
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    playSound();

    if (isWorkSession) {
      // Work session completed
      setStats((prev) => ({
        ...prev,
        sessionsCompleted: prev.sessionsCompleted + 1,
        totalFocusTime: prev.totalFocusTime + workDuration,
        currentStreak: prev.currentStreak + 1,
      }));
      toast({
        title: "Great work! 🎉",
        description: "Time for a break. You earned it!",
      });
      // Switch to break
      setIsWorkSession(false);
      setTimeRemaining(breakDuration * 60);
    } else {
      // Break completed
      setStats((prev) => ({
        ...prev,
        breaksTaken: prev.breaksTaken + 1,
      }));
      toast({
        title: "Break over! 💪",
        description: "Ready for another focus session?",
      });
      // Switch to work
      setIsWorkSession(true);
      setTimeRemaining(workDuration * 60);
    }
  };

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Browser prevented autoplay, ignore
      });
    }
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(isWorkSession ? workDuration * 60 : breakDuration * 60);
  };

  const handleApplySettings = (newWork: number, newBreak: number) => {
    setWorkDuration(newWork);
    setBreakDuration(newBreak);
    setIsRunning(false);
    setIsWorkSession(true);
    setTimeRemaining(newWork * 60);
    setShowSettings(false);
    toast({
      title: "Settings updated ✅",
      description: `Work: ${newWork}min | Break: ${newBreak}min`,
    });
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const displayTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Calculate progress (0-1)
  const totalSeconds = isWorkSession
    ? workDuration * 60
    : breakDuration * 60;
  const progress = (totalSeconds - timeRemaining) / totalSeconds;

  // Determine colors based on session type and progress
  const getGradient = () => {
    if (isWorkSession) {
      // Work session: blue to purple gradient
      return "from-blue-400 to-purple-500";
    } else {
      // Break session: green to teal gradient
      return "from-emerald-400 to-teal-500";
    }
  };

  const getBackgroundGradient = () => {
    if (isWorkSession) {
      return "from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950";
    } else {
      return "from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950";
    }
  };

  const getAccentColor = () => {
    if (isWorkSession) {
      return {
        text: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        icon: "text-blue-500",
      };
    } else {
      return {
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        icon: "text-emerald-500",
      };
    }
  };

  const accent = getAccentColor();

  return (
    <div
      className={`flex-1 overflow-auto bg-gradient-to-br ${getBackgroundGradient()}`}
    >
      <audio ref={audioRef} src={SOUND_URL} />

      <div className="max-w-2xl mx-auto p-3 sm:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Focus Sessions
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {isWorkSession ? "🎯 Stay focused and productive" : "☕ Recharge your mind"}
          </p>
        </div>

        {/* Main Timer Circle */}
        <div className="flex justify-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={`text-slate-200 dark:text-slate-700 transition-colors ${
                  isRunning ? `text-opacity-50` : ``
                }`}
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="4"
                strokeDasharray={`${progress * 282.7} 282.7`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient
                  id="gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={isWorkSession ? "#60a5fa" : "#34d399"}
                  />
                  <stop
                    offset="100%"
                    stopColor={isWorkSession ? "#a855f7" : "#14b8a6"}
                  />
                </linearGradient>
              </defs>
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
              <div className={`text-5xl sm:text-7xl font-bold font-mono ${accent.text}`}>
                {displayTime}
              </div>
              <div className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400">
                {isWorkSession ? "Focus Time" : "Break Time"}
              </div>
              <Badge
                variant="secondary"
                className={`${accent.bg} border-0 ${accent.text}`}
              >
                {isWorkSession ? "Work Session" : "Break"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 flex-wrap">
          <Button
            size="lg"
            onClick={handlePlayPause}
            className={`bg-gradient-to-r ${getGradient()} hover:shadow-lg text-white px-8`}
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
            size="lg"
            variant="outline"
            onClick={handleReset}
            className="border-2"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Reset
          </Button>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="border-2">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Timer Settings</DialogTitle>
                <DialogDescription>
                  Customize your focus and break durations
                </DialogDescription>
              </DialogHeader>
              <SettingsDialog
                workDuration={workDuration}
                breakDuration={breakDuration}
                onApply={handleApplySettings}
              />
            </DialogContent>
          </Dialog>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="border-2"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-5 w-5 mr-2" />
                Sound On
              </>
            ) : (
              <>
                <VolumeX className="h-5 w-5 mr-2" />
                Sound Off
              </>
            )}
          </Button>
        </div>

        {/* Session Type Toggle */}
        <div className="flex justify-center gap-2">
          <Button
            variant={isWorkSession ? "default" : "outline"}
            onClick={() => {
              if (!isRunning) {
                setIsWorkSession(true);
                setTimeRemaining(workDuration * 60);
              }
            }}
            disabled={isRunning}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Focus ({workDuration}m)
          </Button>
          <Button
            variant={!isWorkSession ? "default" : "outline"}
            onClick={() => {
              if (!isRunning) {
                setIsWorkSession(false);
                setTimeRemaining(breakDuration * 60);
              }
            }}
            disabled={isRunning}
            className="gap-2"
          >
            <Coffee className="h-4 w-4" />
            Break ({breakDuration}m)
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-2 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {stats.sessionsCompleted}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Sessions Done
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {stats.breaksTaken}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Breaks Taken
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                {stats.totalFocusTime}m
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Focus Time
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                {stats.currentStreak}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Current Streak
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Motivational Quote */}
        <Card className="border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 italic">
                {isWorkSession
                  ? "You've got this! Every minute brings you closer to your goals. 💪"
                  : "Take a deep breath. You've earned this moment of rest. 🌿"}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {stats.sessionsCompleted > 0
                  ? `You're on a streak of ${stats.currentStreak} sessions! 🔥`
                  : "Start your first focus session to build momentum!"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border-2 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Focus Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p>✨ Silence notifications during focus sessions</p>
            <p>💧 Take a sip of water during your break</p>
            <p>🌍 A short walk can refresh your mind</p>
            <p>📱 Keep your phone away from your desk</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsDialog({
  workDuration,
  breakDuration,
  onApply,
}: {
  workDuration: number;
  breakDuration: number;
  onApply: (work: number, breakDur: number) => void;
}) {
  const [newWork, setNewWork] = useState<number>(workDuration);
  const [newBreak, setNewBreak] = useState<number>(breakDuration);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <Label htmlFor="work-duration" className="font-semibold">
            Focus Duration (minutes)
          </Label>
          <Input
            id="work-duration"
            type="number"
            min="1"
            max="60"
            value={newWork}
            onChange={(e) => setNewWork(Math.max(1, parseInt(e.target.value) || 1))}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="break-duration" className="font-semibold">
            Break Duration (minutes)
          </Label>
          <Input
            id="break-duration"
            type="number"
            min="1"
            max="30"
            value={newBreak}
            onChange={(e) => setNewBreak(Math.max(1, parseInt(e.target.value) || 1))}
            className="mt-2"
          />
        </div>
      </div>

      <Button
        onClick={() => onApply(newWork, newBreak)}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
      >
        <Check className="h-4 w-4 mr-2" />
        Apply Settings
      </Button>
    </div>
  );
}

// Add Badge component
function Badge({
  variant = "default",
  children,
  className = "",
}: {
  variant?: "default" | "secondary";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className} ${
        variant === "default"
          ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {children}
    </span>
  );
}
