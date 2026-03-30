import { motion } from "framer-motion";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export interface AccuracyTrendPoint {
  date: string;
  quizAccuracy: number;
  flashcardAccuracy: number;
}

export const sampleAccuracyTrendsData: AccuracyTrendPoint[] = [
  { date: "Mar 17", quizAccuracy: 65, flashcardAccuracy: 70 },
  { date: "Mar 18", quizAccuracy: 68, flashcardAccuracy: 72 },
  { date: "Mar 19", quizAccuracy: 72, flashcardAccuracy: 75 },
  { date: "Mar 20", quizAccuracy: 70, flashcardAccuracy: 78 },
  { date: "Mar 21", quizAccuracy: 75, flashcardAccuracy: 80 },
  { date: "Mar 22", quizAccuracy: 78, flashcardAccuracy: 82 },
  { date: "Mar 23", quizAccuracy: 80, flashcardAccuracy: 85 },
];

const accuracyChartConfig: ChartConfig = {
  quizAccuracy: {
    label: "Quiz Accuracy",
    color: "hsl(210 90% 56%)",
  },
  flashcardAccuracy: {
    label: "Flashcard Accuracy",
    color: "hsl(150 68% 40%)",
  },
};

interface AccuracyTrendsChartProps {
  data?: AccuracyTrendPoint[];
  className?: string;
}

export function AccuracyTrendsChart({
  data = sampleAccuracyTrendsData,
  className,
}: AccuracyTrendsChartProps) {
  return (
    <motion.div
      className={cn("section-reveal", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="rounded-2xl border border-border/70 shadow-[0_14px_28px_-22px_hsl(var(--foreground)/0.85)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Accuracy Trends</CardTitle>
          <CardDescription>
            Quiz and flashcard accuracy progression across recent days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={accuracyChartConfig} className="h-[290px] w-full">
            <LineChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.35)" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--border) / 0.45)", strokeWidth: 1 }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                type="monotone"
                dataKey="quizAccuracy"
                stroke="var(--color-quizAccuracy)"
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 0, fill: "var(--color-quizAccuracy)" }}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationDuration={320}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="flashcardAccuracy"
                stroke="var(--color-flashcardAccuracy)"
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 0, fill: "var(--color-flashcardAccuracy)" }}
                activeDot={{ r: 5 }}
                isAnimationActive
                animationDuration={320}
                animationEasing="ease-out"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
