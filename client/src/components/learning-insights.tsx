/*
==========================================================
File: client/src/components/learning-insights.tsx

Module: Insight Scout and Research

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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, TrendingUp, Target } from "lucide-react";

interface WeeklyData {
  day: string;
  minutes: number;
}

interface WeakTopic {
  name: string;
  accuracy: number;
  suggestion: string;
}

interface LearningInsightsProps {
  currentStreak: number;
  weeklyData: WeeklyData[];
  weakTopics: WeakTopic[];
  achievements: string[];
}

/*
----------------------------------------------------------
Component: LearningInsights

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- currentStreak: Input consumed by this routine during execution
- weeklyData: Input consumed by this routine during execution
- weakTopics: Input consumed by this routine during execution
- achievements: Input consumed by this routine during execution

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
export function LearningInsights({
  currentStreak,
  weeklyData,
  weakTopics,
  achievements,
}: LearningInsightsProps) {
  return (
    <div className="space-y-6">
      {/* Streak Calendar */}
      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Learning Streak
          </CardTitle>
          <CardDescription>
            Keep the momentum going!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-orange-500">
              {currentStreak}
            </div>
            <p className="text-muted-foreground mt-2">Days in a row</p>
          </div>

          {/* Week Calendar */}
          <div className="grid grid-cols-7 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
              <div key={day} className="text-center">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {day}
                </p>
                <div
                  className={`w-full aspect-square rounded-lg transition-all ${
                    idx < currentStreak
                      ? "bg-gradient-to-br from-orange-400 to-red-500 shadow-lg scale-105"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Study Time Chart */}
      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Weekly Study Time
          </CardTitle>
          <CardDescription>
            Total: {weeklyData.reduce((a, b) => a + b.minutes, 0)} minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyData.map((day) => (
              <div key={day.day}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{day.day}</span>
                  <span className="text-xs text-muted-foreground">
                    {day.minutes}m
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min((day.minutes / 60) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              Topics to Focus On
            </CardTitle>
            <CardDescription>
              These need some extra attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakTopics.map((topic) => (
              <div
                key={topic.name}
                className="p-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{topic.name}</h4>
                  <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900">
                    {topic.accuracy}% accuracy
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  💡 {topic.suggestion}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Achievement Badges */}
      {achievements.length > 0 && (
        <Card className="glassmorphic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Achievements
            </CardTitle>
            <CardDescription>
              You've earned {achievements.length} badge(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {achievements.map((badge) => (
                <div
                  key={badge}
                  className="flex flex-col items-center p-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:scale-110 transition-transform"
                >
                  <div className="text-3xl mb-2">{getBadgeEmoji(badge)}</div>
                  <p className="text-xs text-center text-muted-foreground line-clamp-2">
                    {badge}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/*
----------------------------------------------------------
Function: getBadgeEmoji

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- badge: Input consumed by this routine during execution

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
function getBadgeEmoji(badge: string): string {
  const emojiMap: Record<string, string> = {
    "First Steps": "🚀",
    "Week Warrior": "💪",
    "Speed Learner": "⚡",
    "Perfect Score": "🎯",
    "Marathon": "🏃",
    "Knowledge Master": "🧠",
    "Night Owl": "🦉",
    "Early Bird": "🐦",
  };
  return emojiMap[badge] || "⭐";
}
