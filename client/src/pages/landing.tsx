import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Brain,
  BookOpen,
  Rocket,
  Sparkles,
  Target,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";

const features = [
  {
    icon: Brain,
    title: "Smart Flashcards",
    description: "Adaptive spaced repetition to help you remember more in less time.",
    accent: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: Target,
    title: "Adaptive Quizzes",
    description: "Practice with questions that evolve with your performance.",
    accent: "from-fuchsia-500/20 to-rose-500/20",
  },
  {
    icon: Sparkles,
    title: "Insight Scout",
    description: "Get AI-powered explanations and summaries for better clarity.",
    accent: "from-amber-500/20 to-red-500/20",
  },
  {
    icon: BookOpen,
    title: "Organized Notes",
    description: "Capture, structure, and review study material in one place.",
    accent: "from-sky-500/20 to-indigo-500/20",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateWithTransition = (path: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    window.setTimeout(() => {
      setLocation(path);
    }, 220);
  };

  const navigateToSignIn = () => navigateWithTransition("/login");
  const navigateToSignUp = () => navigateWithTransition("/login?mode=signup");

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-brand-background to-secondary/20 public-page-transition ${isNavigating ? "exiting" : ""}`}>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6 md:pt-8">
        <div className="stagger-fade-up flex items-center gap-3">
          <div className="float-soft quirky-hover-icon rounded-full bg-gradient-to-br from-brand-primary to-brand-accent p-2.5 shadow-lg">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">StudyMate</span>
        </div>
        <Button variant="ghost" className="button-priority-transition" onClick={navigateToSignIn}>
          Sign In
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="stagger-fade-up border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
              Built for focused students
            </Badge>

            <div className="stagger-fade-up delay-1 space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                Build unstoppable momentum with your
                <span className="block bg-gradient-to-r from-brand-primary via-primary to-brand-accent bg-clip-text text-transparent">
                  complete study workspace
                </span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                StudyMate helps you turn notes into progress with personalized
                quizzes, revision workflows, and insight-driven study sessions.
              </p>
            </div>

            <div className="stagger-fade-up delay-2 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="button-priority-transition quirky-hover-cta rounded-full bg-gradient-to-r from-brand-primary to-brand-accent text-white hover:opacity-95"
                onClick={navigateToSignUp}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="button-priority-transition quirky-hover-cta rounded-full"
                onClick={navigateToSignIn}
              >
                I already have an account
              </Button>
            </div>

            <div className="stagger-fade-up delay-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="interactive-surface quirky-hover-chip inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <Clock className="h-4 w-4 text-primary" />
                Save study time daily
              </span>
              <span className="interactive-surface quirky-hover-chip inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <Rocket className="h-4 w-4 text-primary" />
                Built for every subject
              </span>
            </div>
          </div>

          <Card className="stagger-fade-up delay-2 rounded-3xl border-border/70 bg-card/90 shadow-xl backdrop-blur">
            <CardHeader className="space-y-4 pb-4">
              <CardTitle className="text-xl">Your study stack in one place</CardTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="interactive-surface quirky-hover-card rounded-2xl border border-border bg-muted/40 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">4</p>
                  <p className="text-xs text-muted-foreground">Core learning tools</p>
                </div>
                <div className="interactive-surface quirky-hover-card rounded-2xl border border-border bg-muted/40 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">Goal-first</p>
                  <p className="text-xs text-muted-foreground">Study plans that keep you on track</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`interactive-surface quirky-hover-card stagger-fade-up flex items-start gap-3 rounded-2xl border border-border/70 bg-gradient-to-r p-3 delay-${Math.min(index + 1, 3)}`}
                >
                  <div className={`rounded-xl bg-gradient-to-br ${feature.accent} p-2`}>
                    <feature.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
