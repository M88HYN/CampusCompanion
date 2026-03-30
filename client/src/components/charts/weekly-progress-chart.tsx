import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export interface WeeklyProgressPoint {
  day: string;
  minutes: number;
  items: number;
}

export const sampleWeeklyProgressData: WeeklyProgressPoint[] = [
  { day: "Tue", minutes: 45, items: 20 },
  { day: "Wed", minutes: 60, items: 30 },
  { day: "Thu", minutes: 50, items: 25 },
  { day: "Fri", minutes: 70, items: 35 },
  { day: "Sat", minutes: 30, items: 15 },
  { day: "Sun", minutes: 20, items: 10 },
  { day: "Mon", minutes: 80, items: 40 },
];

const weeklyProgressChartConfig: ChartConfig = {
  minutes: {
    label: "Minutes Studied",
    color: "hsl(210 90% 56%)",
  },
  items: {
    label: "Items Reviewed",
    color: "hsl(154 64% 42%)",
  },
};

interface WeeklyProgressChartProps {
  data?: WeeklyProgressPoint[];
  className?: string;
}

export function WeeklyProgressChart({
  data = sampleWeeklyProgressData,
  className,
}: WeeklyProgressChartProps) {
  return (
    <motion.div
      className={cn("section-reveal", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
    >
      <Card className="rounded-2xl border border-border/70 shadow-[0_14px_28px_-22px_hsl(var(--foreground)/0.85)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Weekly Progress</CardTitle>
          <CardDescription>
            Daily learning volume and reviewed item throughput.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={weeklyProgressChartConfig} className="h-[290px] w-full">
            <BarChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.35)" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar
                yAxisId="left"
                dataKey="minutes"
                fill="var(--color-minutes)"
                radius={[6, 6, 0, 0]}
                maxBarSize={24}
                isAnimationActive
                animationDuration={320}
                animationEasing="ease-out"
              />
              <Bar
                yAxisId="right"
                dataKey="items"
                fill="var(--color-items)"
                radius={[6, 6, 0, 0]}
                maxBarSize={24}
                isAnimationActive
                animationDuration={320}
                animationEasing="ease-out"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
