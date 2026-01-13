import { useState } from "react";
import { BookOpen, BrainCircuit, GraduationCap, Sparkles, Clock, TrendingUp, Flame, Target, Calendar, Edit2, Save, X, Lightbulb } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

type UserRole = "student" | "instructor" | "admin";

interface DashboardProps {
  userRole?: UserRole;
}

export default function Dashboard({ userRole = "student" }: DashboardProps) {
  const [userName, setUserName] = useState("John");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [studyGoal, setStudyGoal] = useState("");
  const [todayStudyTime, setTodayStudyTime] = useState(0);
  const features = [
    {
      title: "Notes",
      description: "Organize your study materials",
      subtitle: "12 notebooks",
      icon: BookOpen,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600",
      href: "/notes",
    },
    {
      title: "Quizzes",
      description: "Test your knowledge",
      subtitle: "5 active quizzes",
      icon: BrainCircuit,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500",
      href: "/quizzes",
    },
    {
      title: "Flashcards",
      description: "Master with spaced repetition",
      subtitle: "23 cards due today",
      icon: GraduationCap,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600",
      href: "/flashcards",
      urgent: true,
    },
    {
      title: "Insight Scout",
      description: "AI-powered research assistant",
      subtitle: "Ask anything",
      icon: Sparkles,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500",
      href: "/research",
    },
    {
      title: "Revision Help",
      description: "Focus tools & timers",
      subtitle: "Pomodoro ready",
      icon: Lightbulb,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-yellow-400 via-lime-500 to-green-500",
      href: "/revision",
    },
  ];

  const recentActivity = [
    { action: "Studied", item: "Biology Flashcards", time: "2 hours ago", accuracy: 87 },
    { action: "Completed", item: "Math Quiz Chapter 3", time: "5 hours ago", accuracy: 92 },
    { action: "Created", item: "Physics Notes", time: "Yesterday" },
    { action: "Researched", item: "Quantum Mechanics", time: "2 days ago" },
  ];

  const topicProgress = [
    { topic: "React Hooks", accuracy: 92, cards: 24, due: 5 },
    { topic: "Calculus", accuracy: 78, cards: 35, due: 12 },
    { topic: "Physics", accuracy: 85, cards: 28, due: 6 },
  ];

  const handleSaveName = () => {
    setUserName(tempName);
    setIsEditingName(false);
  };

  const handleCancelName = () => {
    setTempName(userName);
    setIsEditingName(false);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-3 mb-4">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="max-w-xs text-2xl font-bold h-10"
                  data-testid="input-edit-name"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveName}
                  data-testid="button-save-name"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelName}
                  data-testid="button-cancel-name"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold">Welcome back, {userName}!</h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingName(true)}
                  data-testid="button-edit-name"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Input
            type="number"
            placeholder="What's your study goal today? (minutes)"
            value={studyGoal}
            onChange={(e) => setStudyGoal(e.target.value)}
            className="max-w-xs"
            data-testid="input-study-goal"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Today's study time:</span>
            <Input
              type="number"
              placeholder="0"
              value={todayStudyTime}
              onChange={(e) => setTodayStudyTime(Number(e.target.value))}
              className="max-w-20"
              data-testid="input-today-study-time"
            />
            <span className="text-sm text-muted-foreground">min</span>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your studies today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-400 via-red-500 to-rose-600 rounded-xl p-5 text-white shadow-lg shadow-orange-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Flame className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Study Streak</span>
            </div>
            <div className="text-5xl font-bold">7</div>
            <p className="text-sm opacity-80 mt-1 font-medium">days in a row</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Due Today</span>
            </div>
            <div className="text-5xl font-bold">23</div>
            <p className="text-sm opacity-80 mt-1 font-medium">cards to review</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-xl p-5 text-white shadow-lg shadow-green-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Target className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Accuracy</span>
            </div>
            <div className="text-5xl font-bold">87%</div>
            <p className="text-sm opacity-80 mt-1 font-medium">this week</p>
          </div>

          <div className="bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 rounded-xl p-5 text-white shadow-lg shadow-purple-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Study Time</span>
            </div>
            <div className="text-5xl font-bold">12h</div>
            <p className="text-sm opacity-80 mt-1 font-medium">this week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map((feature) => (
            <Link href={feature.href} key={feature.title}>
              <Card
                className={`hover-elevate cursor-pointer transition-all relative border-0 ${feature.bgGradient} text-white overflow-hidden h-full shadow-lg`}
                data-testid={`card-${feature.title.toLowerCase()}`}
              >
                {feature.urgent && (
                  <Badge variant="destructive" className="absolute top-3 right-3 text-xs bg-white text-red-600 font-bold animate-pulse">
                    Due Now
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <div className="w-14 h-14 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center mb-3 shadow-inner">
                    <feature.icon className={`h-7 w-7 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl text-white font-bold">{feature.title}</CardTitle>
                  <CardDescription className="text-white/90 font-medium">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">{feature.subtitle}</span>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white text-lg">→</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                    data-testid={`activity-${index}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">
                          {activity.action} <span className="text-muted-foreground">{activity.item}</span>
                        </p>
                        {activity.accuracy && (
                          <Badge variant="secondary" className="shrink-0">{activity.accuracy}%</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Topic Coverage
              </CardTitle>
              <CardDescription>Your progress by subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topicProgress.map((topic, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{topic.topic}</span>
                    <div className="flex items-center gap-3">
                      {topic.due > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {topic.due} due
                        </Badge>
                      )}
                      <span className="text-muted-foreground">{topic.accuracy}%</span>
                    </div>
                  </div>
                  <Progress value={topic.accuracy} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
