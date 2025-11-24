import { BookOpen, BrainCircuit, GraduationCap, Sparkles, Clock, TrendingUp, Flame, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type UserRole = "student" | "instructor" | "admin";

interface DashboardProps {
  userRole?: UserRole;
}

export default function Dashboard({ userRole = "student" }: DashboardProps) {
  const features = [
    {
      title: "Notes",
      description: "12 notebooks",
      icon: BookOpen,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      href: "/notes",
    },
    {
      title: "Quizzes",
      description: "5 active quizzes",
      icon: BrainCircuit,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      href: "/quizzes",
    },
    {
      title: "Flashcards",
      description: "8 decks • 23 due today",
      icon: GraduationCap,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-green-500 to-green-600",
      href: "/flashcards",
      urgent: true,
    },
    {
      title: "Insight Scout",
      description: "Research & Sources",
      icon: Sparkles,
      color: "text-white",
      bgGradient: "bg-gradient-to-br from-orange-500 to-orange-600",
      href: "/research",
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

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Welcome back, John!</h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your studies today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  <CardTitle className="text-lg text-white">Study Streak</CardTitle>
                </div>
                <div className="text-3xl font-bold">7</div>
              </div>
              <CardDescription className="text-white/80">days in a row</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <CardTitle className="text-lg text-white">Due Today</CardTitle>
                </div>
                <div className="text-3xl font-bold">23</div>
              </div>
              <CardDescription className="text-white/80">flashcards to review</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <CardTitle className="text-lg text-white">Accuracy</CardTitle>
                </div>
                <div className="text-3xl font-bold">87%</div>
              </div>
              <CardDescription className="text-white/80">this week average</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <CardTitle className="text-lg text-white">Study Time</CardTitle>
                </div>
                <div className="text-3xl font-bold">12h</div>
              </div>
              <CardDescription className="text-white/80">30m this week</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className={`hover-elevate cursor-pointer transition-all relative border-0 ${feature.bgGradient} text-white overflow-hidden`}
              data-testid={`card-${feature.title.toLowerCase()}`}
            >
              {feature.urgent && (
                <Badge variant="destructive" className="absolute top-3 right-3 text-xs bg-red-600">
                  Due
                </Badge>
              )}
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                <CardDescription className="text-white/80">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  data-testid={`button-open-${feature.title.toLowerCase().replace(/\s/g, "-")}`}
                  onClick={() => console.log(`Navigate to ${feature.href}`)}
                >
                  Open
                </Button>
              </CardContent>
            </Card>
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
