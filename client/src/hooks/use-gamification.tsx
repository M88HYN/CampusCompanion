/* Tracks XP, streaks, and level progress for the study widgets. */

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Sparkles, Trophy, Target } from "lucide-react";

interface GamificationState {
  xp: number;
  streak: number;
  totalXp: number;
  level: number;
}

// Loads saved progression and exposes the XP helpers.
export function useGameification() {
  const [gameState, setGameState] = useState<GamificationState>(() => {
    const saved = localStorage.getItem("gamification");
    return saved
      ? JSON.parse(saved)
      : { xp: 0, streak: 0, totalXp: 0, level: 1 };
  });

  useEffect(() => {
    localStorage.setItem("gamification", JSON.stringify(gameState));
  }, [gameState]);

    // Adds XP and nudges the streak forward when appropriate.
    const addXP = (amount: number, continued: boolean = true) => {
    setGameState((prev) => {
      const newXp = prev.xp + amount;
      const xpPerLevel = 100;
      const newLevel = Math.floor(newXp / xpPerLevel) + 1;
      const newStreak = continued ? prev.streak + 1 : 0;

      return {
        xp: newXp % xpPerLevel,
        totalXp: prev.totalXp + amount,
        streak: newStreak,
        level: newLevel,
      };
    });
  };

    // Clears the current streak without touching XP.
    const resetStreak = () => {
    setGameState((prev) => ({ ...prev, streak: 0 }));
  };

    // Maps review quality to a simple XP reward.
    const getXpReward = (quality: number): number => {
    if (quality >= 4) return 50; // Easy
    if (quality === 3) return 30; // Good
    if (quality === 2) return 15; // Hard
    return 5; // Again
  };

  return { gameState, addXP, resetStreak, getXpReward };
}

interface GamificationDisplayProps {
  xp: number;
  streak: number;
  level: number;
  totalXp?: number;
}

/*
----------------------------------------------------------
Component: GamificationDisplay

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- xp: Input consumed by this routine during execution
- streak: Input consumed by this routine during execution
- level: Input consumed by this routine during execution
- totalXp: Input consumed by this routine during execution

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
export function GamificationDisplay({
  xp,
  streak,
  level,
  totalXp = 0,
}: GamificationDisplayProps) {
  const xpPerLevel = 100;

  return (
    <div className="space-y-4">
      {/* Shows the current level first. */}
      <div className="flex items-center gap-3">
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur opacity-75"></div>
          <div className="relative bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {level}
              </div>
              <div className="text-xs text-amber-200">Level</div>
            </div>
          </div>
        </div>

        {/* Tracks progress towards the next level. */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-muted-foreground">
              XP
            </span>
            <span className="text-xs text-muted-foreground">
              {xp}/{xpPerLevel}
            </span>
          </div>
          <Progress value={(xp / xpPerLevel) * 100} className="h-2" />
        </div>
      </div>

      {/* Displays the streak when one is active. */}
      {streak > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
          <span className="font-semibold text-amber-700 dark:text-amber-300">
            {streak} Day Streak! 🔥
          </span>
        </div>
      )}

      {/* Shows the total XP tally. */}
      {totalXp > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 inline mr-1" />
          {totalXp} Total XP Earned
        </div>
      )}
    </div>
  );
}
