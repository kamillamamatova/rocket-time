import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

interface TimeEntry {
  id: string;
  activity: string;
  category: string;
  duration: number;
  date: string;
  goalId?: string;
}

interface Goal {
  id: string;
  name: string;
  category: string;
}

interface DailyAnalysisProps {
  entries: TimeEntry[];
  goals: Goal[];
}

export function DailyAnalysis({ entries, goals }: DailyAnalysisProps) {
  const today = new Date().toDateString();
  const todayEntries = entries.filter(e => new Date(e.date).toDateString() === today);

  if (todayEntries.length === 0) {
    return null;
  }

  // Calculate time by category
  const categoryTotals = todayEntries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + entry.duration;
    return acc;
  }, {} as Record<string, number>);

  // Calculate goal alignment
  const goalLinkedEntries = todayEntries.filter(e => e.goalId);
  const goalProgress = goals.map(goal => {
    const goalEntries = todayEntries.filter(e => e.goalId === goal.id);
    const totalTime = goalEntries.reduce((sum, e) => sum + e.duration, 0);
    return { goal, totalTime };
  }).filter(gp => gp.totalTime > 0);

  const totalProductiveTime = (categoryTotals.productive || 0) + 
                              (categoryTotals.learning || 0) + 
                              (categoryTotals.exercise || 0);
  
  const totalWastedTime = categoryTotals.wasted || 0;
  const totalHobbiesTime = categoryTotals.hobbies || 0;

  const generateInsights = () => {
    const insights = [];

    if (goalLinkedEntries.length === 0) {
      insights.push({
        type: "warning",
        message: "No activities were linked to your goals today. Consider connecting your work to specific goals for better tracking."
      });
    } else {
      insights.push({
        type: "success",
        message: `${goalLinkedEntries.length} activities aligned with your goals today! Great job staying focused.`
      });
    }

    if (totalProductiveTime > 4) {
      insights.push({
        type: "success",
        message: `Strong performance! ${totalProductiveTime.toFixed(1)} hours of productive time logged today.`
      });
    } else if (totalProductiveTime > 0) {
      insights.push({
        type: "neutral",
        message: `${totalProductiveTime.toFixed(1)} hours of productive time today. Aim for 4-6 hours for optimal results.`
      });
    }

    if (totalWastedTime > 2) {
      insights.push({
        type: "warning",
        message: `${totalWastedTime.toFixed(1)} hours wasted today. This time could advance you toward your goals.`
      });
    }

    if (totalHobbiesTime > totalProductiveTime && totalProductiveTime > 0) {
      insights.push({
        type: "neutral",
        message: "More time on hobbies than productive work. Balance is good, but ensure your priorities are met first."
      });
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          AI Daily Analysis
        </CardTitle>
        <CardDescription>
          How today's activities align with your goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goal Progress */}
        {goalProgress.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Goal Progress Today</h4>
            <div className="space-y-2">
              {goalProgress.map(({ goal, totalTime }) => (
                <div key={goal.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">{goal.name}</span>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    +{totalTime.toFixed(1)}h
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">AI Insights</h4>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  insight.type === "success" 
                    ? "bg-green-50 border border-green-200" 
                    : insight.type === "warning"
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                {insight.type === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : insight.type === "warning" ? (
                  <TrendingDown className="h-5 w-5 text-yellow-600 mt-0.5" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                )}
                <p className="text-sm flex-1">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Time Summary */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-green-50 rounded">
              <div className="text-xs text-muted-foreground">Productive</div>
              <div className="font-semibold text-green-700">{totalProductiveTime.toFixed(1)}h</div>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <div className="text-xs text-muted-foreground">Hobbies</div>
              <div className="font-semibold text-blue-700">{totalHobbiesTime.toFixed(1)}h</div>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <div className="text-xs text-muted-foreground">Wasted</div>
              <div className="font-semibold text-red-700">{totalWastedTime.toFixed(1)}h</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
