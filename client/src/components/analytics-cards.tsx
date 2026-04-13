/* Shared analytics cards for the dashboard and quiz views. */

/** Analytics card helpers used across the app. */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopicPerformance, RecentActivity, AnalyticsSummary } from "@/lib/analytics-utils";
import { Trophy, Target, Clock, Star, TrendingUp, TrendingDown } from "lucide-react";

/** Compact summary card for the main analytics figures. */
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

// Renders one headline metric with a small amount of context.
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

/** Shows the strongest and weakest topics at a glance. */
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

// Lists the strongest or weakest topics without much fuss.
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

/** Recent quiz activity in a tidy list. */
interface ActivityCardProps {
  activities: RecentActivity[];
}

// Shows the latest quiz attempts in a compact feed.
export function ActivityCard({ activities }: ActivityCardProps) {
  return (
    <Card className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.24)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/65 dark:shadow-[0_12px_30px_-14px_rgba(0,0,0,0.75)]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Your last {activities.length} completed quizzes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <div
                key={idx}
                className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/70"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{activity.quizTitle}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.topic}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {activity.date}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{activity.score}/{activity.maxScore}</p>
                  <Badge
                    variant={activity.accuracy >= 70 ? "default" : "destructive"}
                    className={
                      activity.accuracy >= 70 ? "bg-emerald-600 text-xs text-white" : "text-xs"
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
