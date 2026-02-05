import React from "react";

interface ProgressRingProps {
  accuracy: number; // 0-100
  radius?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  accuracy,
  radius = 45,
  strokeWidth = 4,
}: ProgressRingProps) {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracy / 100) * circumference;

  const getColor = (value: number) => {
    if (value >= 80) return "#10b981"; // green
    if (value >= 60) return "#3b82f6"; // blue
    if (value >= 40) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={radius * 2 + strokeWidth}
          height={radius * 2 + strokeWidth}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-slate-200 dark:text-slate-700"
          />

          {/* Progress circle */}
          <circle
            cx={radius + strokeWidth / 2}
            cy={radius + strokeWidth / 2}
            r={radius}
            stroke={getColor(accuracy)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="progress-ring-circle"
          />
        </svg>

        {/* Center text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {Math.round(accuracy)}%
          </span>
          <span className="text-xs text-muted-foreground">Accuracy</span>
        </div>
      </div>
    </div>
  );
}
