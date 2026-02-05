import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  lines?: number;
  showImage?: boolean;
}

export function SkeletonCard({ lines = 3, showImage = false }: SkeletonCardProps) {
  return (
    <Card className="animate-pulse">
      {showImage && (
        <div className="h-40 bg-slate-200 dark:bg-slate-700" />
      )}
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array(lines)
          .fill(0)
          .map((_, i) => (
            <Skeleton
              key={i}
              className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
            />
          ))}
      </CardContent>
    </Card>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-900 animate-pulse">
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
