import { BookOpen, BrainCircuit, GraduationCap, Sparkles, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      href: "/notes",
    },
    {
      title: "Quizzes",
      description: "5 active quizzes",
      icon: BrainCircuit,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      href: "/quizzes",
    },
    {
      title: "Flashcards",
      description: "8 decks",
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      href: "/flashcards",
    },
    {
      title: "Research",
      description: "AI Assistant",
      icon: Sparkles,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      href: "/research",
    },
  ];

  const recentActivity = [
    { action: "Studied", item: "Biology Flashcards", time: "2 hours ago" },
    { action: "Completed", item: "Math Quiz Chapter 3", time: "5 hours ago" },
    { action: "Created", item: "Physics Notes", time: "Yesterday" },
    { action: "Researched", item: "Quantum Mechanics", time: "2 days ago" },
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
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="hover-elevate cursor-pointer transition-all"
              data-testid={`card-${feature.title.toLowerCase()}`}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-md ${feature.bgColor} flex items-center justify-center mb-3`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  data-testid={`button-open-${feature.title.toLowerCase()}`}
                  onClick={() => console.log(`Navigate to ${feature.href}`)}
                >
                  Open
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
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
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {activity.action} <span className="text-muted-foreground">{activity.item}</span>
                      </p>
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
                Study Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <Badge variant="secondary">12h 30m</Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-3/4" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Quizzes Completed</span>
                  <Badge variant="secondary">8/10</Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 w-4/5" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Cards Reviewed</span>
                  <Badge variant="secondary">124</Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
