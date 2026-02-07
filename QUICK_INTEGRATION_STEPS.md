/**
 * QUICK INTEGRATION STEPS - Live Updating Quiz Analytics
 * Copy-paste ready code
 */

//=============================================================
// STEP 1: Copy this import section
// ADD TO: client/src/pages/quizzes.tsx (around line 16-18)
//=============================================================

import { useQuizAnalytics } from "@/hooks/use-quiz-analytics";
import { AnalyticsStatCard, InsightCard, ActivityCard } from "@/components/analytics-cards";

//=============================================================
// STEP 2: Add the hook call inside the Quizzes component
// ADD AFTER: const { data: spacedReviewItems, ... } query (around line ~244)
//=============================================================

const {
  summary,
  strengths,
  areasToImprove,
  recentActivity,
  isLoading: analyticsFetching,
} = useQuizAnalytics();

//=============================================================
// STEP 3: Update the userAnalytics query staleTime
// CHANGE LINE (~231): FROM staleTime: 30000 TO staleTime: 0
//=============================================================

Before:
const { data: userAnalytics, isLoading: isLoadingAnalytics } = useQuery<UserAnalytics>({
  queryKey: ["/api/user/analytics"],
  enabled: true,
  staleTime: 30000,  // ← CHANGE THIS
  retry: 1,
});

After:
const { data: userAnalytics, isLoading: isLoadingAnalytics } = useQuery<UserAnalytics>({
  queryKey: ["/api/user/analytics"],
  enabled: true,
  staleTime: 0,  // ← CHANGED TO 0 FOR LIVE UPDATES
  retry: 1,
});

//=============================================================
// STEP 4: Fix the use-quiz-analytics.ts hook
// EITHER:
// Option A: Copy use-quiz-analytics-fixed.ts to use-quiz-analytics.ts
// Option B: Edit use-quiz-analytics.ts and remove the invalidateAnalytics function
//           (keep everything else, just remove the function starting at line 119)
//=============================================================

//=============================================================
// STEP 5: Replace the analytics tab content
// FIND: <TabsContent value="analytics">
// REPLACE WITH: Complete implementation below
//=============================================================

<TabsContent value="analytics">
  {analyticsFetching ? (
    <div className="flex items-center justify-center py-12">
      <Loader className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  ) : summary.totalQuizzesTaken > 0 ? (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsStatCard
          icon={<Trophy className="h-8 w-8" />}
          title="Quizzes Taken"
          value={summary.totalQuizzesTaken}
          subtitle={`${summary.totalQuestionsAnswered} questions answered`}
          iconBgColor="bg-teal-100 dark:bg-teal-900"
          iconColor="text-teal-600 dark:text-teal-400"
          textColor="text-teal-700 dark:text-teal-300"
          borderColor="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border"
        />
        <AnalyticsStatCard
          icon={<Target className="h-8 w-8" />}
          title="Overall Accuracy"
          value={`${summary.overallAccuracy}%`}
          subtitle={`Based on ${summary.totalQuestionsAnswered} questions`}
          iconBgColor="bg-green-100 dark:bg-green-900"
          iconColor="text-green-600 dark:text-green-400"
          textColor="text-green-700 dark:text-green-300"
          borderColor="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border"
        />
        <AnalyticsStatCard
          icon={<Clock className="h-8 w-8" />}
          title="Avg Time / Question"
          value={`${summary.avgTimePerQuestion}s`}
          subtitle="Across all attempts"
          iconBgColor="bg-blue-100 dark:bg-blue-900"
          iconColor="text-blue-600 dark:text-blue-400"
          textColor="text-blue-700 dark:text-blue-300"
          borderColor="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border"
        />
        <AnalyticsStatCard
          icon={<Star className="h-8 w-8" />}
          title="Questions Answered"
          value={summary.totalQuestionsAnswered}
          subtitle="Total across all quizzes"
          iconBgColor="bg-orange-100 dark:bg-orange-900"
          iconColor="text-orange-600 dark:text-orange-400"
          textColor="text-orange-700 dark:text-orange-300"
          borderColor="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border"
        />
      </div>

      {/* Strengths & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard
          title="Your Strengths"
          subtitle="Topics where you excel (≥70% accuracy)"
          icon={<TrendingUp className="h-5 w-5" />}
          items={strengths}
          borderColor="border-2 border-green-200 dark:border-green-800"
          accentColor="text-green-700 dark:text-green-300"
          itemBgColor="bg-green-50 dark:bg-green-950"
          titleColor="text-green-700 dark:text-green-300"
          badgeColor="bg-green-600"
          emptyMessage="Complete more quizzes to see your strengths"
        />
        <InsightCard
          title="Areas to Improve"
          subtitle="Topics that need more practice (<70% accuracy)"
          icon={<TrendingDown className="h-5 w-5" />}
          items={areasToImprove}
          borderColor="border-2 border-red-200 dark:border-red-800"
          accentColor="text-red-700 dark:text-red-300"
          itemBgColor="bg-red-50 dark:bg-red-950"
          titleColor="text-red-700 dark:text-red-300"
          badgeColor="bg-red-600"
          emptyMessage="Great job! Keep practicing to develop more topics."
        />
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <ActivityCard activities={recentActivity} />
      )}
    </div>
  ) : (
    // Keep the existing empty state - it's already perfect
    <Card className="border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/50 via-white to-blue-50/30 dark:from-teal-950/30 dark:via-slate-900 dark:to-blue-950/20 overflow-hidden">
      <CardContent className="py-16 px-6 text-center relative">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100/20 to-transparent dark:from-teal-900/10 pointer-events-none" />
        
        <div className="relative z-10 max-w-md mx-auto space-y-6">
          {/* Icon with subtle animation */}
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 shadow-lg shadow-teal-500/20 dark:shadow-teal-500/10">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>
          
          {/* Title */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Your Analytics Await
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Complete quizzes to unlock powerful insights about your learning journey
            </p>
          </div>
          
          {/* Value proposition */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-teal-200/50 dark:border-teal-800/30">
              <Target className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Track Accuracy</p>
            </div>
            <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-blue-200/50 dark:border-blue-800/30">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">View Progress</p>
            </div>
            <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-green-200/50 dark:border-green-800/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Find Strengths</p>
            </div>
            <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-orange-200/50 dark:border-orange-800/30">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Spot Gaps</p>
            </div>
          </div>
          
          {/* Call to action */}
          <div className="pt-4">
            <Button
              onClick={() => {
                console.log("[ANALYTICS] Start First Quiz clicked - switching to My Quizzes tab");
                setView("list");
                setActiveTab("list");
              }}
              className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg shadow-teal-500/30 dark:shadow-teal-500/20 transition-all hover:scale-105"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Your First Quiz
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
              Complete 5+ questions to unlock analytics
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )}
</TabsContent>

//=============================================================
// STEP 6: Test the integration
//=============================================================

1. npm run check  (Should show no TypeScript errors)
2. npm run dev    (Should compile and run without errors)
3. Navigate to Quizzes → My Quizzes tab
4. Start a quiz and complete it
5. Observe:
   - Quiz card updates (attempts increase, best score shows)
   - Switch to Analytics tab
   - See all stats populate correctly
   - Stats update automatically when completing another quiz

//=============================================================
// WHAT YOU GET
//=============================================================

✅ Live-updating quiz statistics
✅ Automatic math for accuracy, time per question
✅ Topic-based performance tracking
✅ Strengths (≥70% accuracy) highlighted
✅ Areas to improve (<70% accuracy) identified
✅ Recent activity feed (last 10 quizzes)
✅ Responsive design (works on mobile)
✅ Dark mode support
✅ Zero hardcoded values - all real data
✅ Updates within 1 second of quiz completion

//=============================================================
// FILES ALREADY CREATED FOR YOU
//=============================================================

✅ client/src/lib/analytics-utils.ts
   - All calculation logic
   
✅ client/src/hooks/use-quiz-analytics.ts (or use the -fixed version)
   - React hook for analytics
   
✅ client/src/components/analytics-cards.tsx
   - Reusable card components
   
✅ client/src/lib/tag-utils.ts
   - Bonus: fixes tag normalization issues

Total: 4 new files created
Modifications: 1 file (quizzes.tsx) - just add imports + hook + replace one section
