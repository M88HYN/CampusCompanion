/*
==========================================================
File: client/src/components/analytics-cards.tsx

Module: Flashcards and Spaced Repetition

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

/**
 * Analytics Card Components
 * Reusable UI components for analytics display
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopicPerformance, RecentActivity, AnalyticsSummary } from "@/lib/analytics-utils";
import { Trophy, Target, Clock, Star, TrendingUp, TrendingDown } from "lucide-react";

/**
 * Analytics Summary Card
 */
interface AnalyticsStatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  iconBgColor: string;
  iconColor: string;
  textColor: string;
  borderColor: string;
}

/*
----------------------------------------------------------
Component: AnalyticsStatCard

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- icon: Input consumed by this routine during execution
- title: Input consumed by this routine during execution
- value: Input consumed by this routine during execution
- subtitle: Input consumed by this routine during execution
- iconBgColor: Input consumed by this routine during execution
- iconColor: Input consumed by this routine during execution
- textColor: Input consumed by this routine during execution
- borderColor: Input consumed by this routine during execution

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
export function AnalyticsStatCard({
  icon,
  title,
  value,
  subtitle,
  iconBgColor,
  iconColor,
  textColor,
  borderColor,
}: AnalyticsStatCardProps) {
  return (
    <Card className={`${borderColor} bg-gradient-to-br from-opacity-50 dark:from-opacity-30`}>
      <CardContent className="pt-6 text-center">
        <div className={`${iconColor} mx-auto mb-2 h-8 w-8`}>{icon}</div>
        <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
        {subtitle && (
          <p className={`text-xs font-medium mt-1 ${textColor}`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Performance Insight Card (Strengths / Areas to Improve)
 */
interface InsightCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: TopicPerformance[];
  borderColor: string;
  accentColor: string;
  itemBgColor: string;
  titleColor: string;
  badgeColor?: string;
  emptyMessage?: string;
}

/*
----------------------------------------------------------
Component: InsightCard

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- title: Input consumed by this routine during execution
- subtitle: Input consumed by this routine during execution
- icon: Input consumed by this routine during execution
- items: Input consumed by this routine during execution
- borderColor: Input consumed by this routine during execution
- accentColor: Input consumed by this routine during execution
- itemBgColor: Input consumed by this routine during execution
- titleColor: Input consumed by this routine during execution
- badgeColor: Input consumed by this routine during execution
- emptyMessage: Input consumed by this routine during execution

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
export function InsightCard({
  title,
  subtitle,
  icon,
  items,
  borderColor,
  accentColor,
  itemBgColor,
  titleColor,
  badgeColor = "bg-green-600",
  emptyMessage = "Complete more quizzes to see insights",
}: InsightCardProps) {
  return (
    <Card className={borderColor}>
      <CardHeader>
        <CardTitle className={`${titleColor} flex items-center gap-2`}>
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <div className="space-y-3">
            {items.slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 ${itemBgColor} rounded-lg`}
              >
                <div className="flex-1">
                  <p className="font-medium">{item.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.questionsAnswered} questions · ~{item.avgTimeSeconds}s avg
                  </p>
                </div>
                <Badge className={badgeColor} style={{ whiteSpace: 'nowrap' }}>
                  {item.accuracy}%
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Recent Activity Card
 */
interface ActivityCardProps {
  activities: RecentActivity[];
}

/*
----------------------------------------------------------
Component: ActivityCard

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- activities: Input consumed by this routine during execution

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
export function ActivityCard({ activities }: ActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your last {activities.length} completed quizzes</CardDescription>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{activity.quizTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.topic}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {activity.date}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{activity.score}/{activity.maxScore}</p>
                  <Badge
                    variant={activity.accuracy >= 70 ? "default" : "destructive"}
                    className={
                      activity.accuracy >= 70 ? "bg-green-600 text-xs" : "text-xs"
                    }
                  >
                    {activity.accuracy}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No quiz attempts yet. Complete a quiz to see it here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
