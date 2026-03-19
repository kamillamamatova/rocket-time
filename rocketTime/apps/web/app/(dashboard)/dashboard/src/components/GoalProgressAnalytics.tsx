import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Target } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  targetHours: number;
  currentHours: number;
  category: string;
  deadline?: string;
}

interface TimeEntry {
  id: string;
  activity: string;
  category: string;
  duration: number;
  date: string;
  goalId?: string;
}

interface GoalProgressAnalyticsProps {
  goals: Goal[];
  timeEntries: TimeEntry[];
}

export function GoalProgressAnalytics({ goals, timeEntries }: GoalProgressAnalyticsProps) {
  if (goals.length === 0) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Goal Progress
          </CardTitle>
          <CardDescription>Hours logged vs target, with estimated completion</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            No goals yet. Add goals in the Goals/Tasks tab to track progress here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();

  // For each goal, compute pace-based estimated completion
  const goalStats = goals.map((goal) => {
    const linked = timeEntries.filter((e) => String(e.goalId) === String(goal.id));
    const hoursRemaining = Math.max(0, goal.targetHours - goal.currentHours);
    const pct = goal.targetHours > 0 ? Math.min(100, (goal.currentHours / goal.targetHours) * 100) : 0;

    // Compute daily pace from linked entries (hours per day since first entry)
    let estCompletion: string | null = null;
    if (linked.length > 0 && hoursRemaining > 0) {
      const dates = linked.map((e) => new Date(e.date).getTime());
      const firstDate = new Date(Math.min(...dates));
      const daysSinceFirst = Math.max(1, (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyPace = goal.currentHours / daysSinceFirst;
      if (dailyPace > 0) {
        const daysLeft = hoursRemaining / dailyPace;
        const estDate = new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000);
        estCompletion = estDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
    }

    // Deadline status
    let deadlineStatus: "overdue" | "at-risk" | "on-track" | null = null;
    if (goal.deadline && hoursRemaining > 0) {
      const deadline = new Date(goal.deadline);
      if (deadline < now) {
        deadlineStatus = "overdue";
      } else if (estCompletion) {
        const estDate = new Date(estCompletion);
        deadlineStatus = estDate > deadline ? "at-risk" : "on-track";
      }
    }

    return { goal, pct, hoursRemaining, estCompletion, deadlineStatus };
  });

  const barColor = (pct: number, status: typeof goalStats[0]["deadlineStatus"]) => {
    if (pct >= 100) return "#22c55e";
    if (status === "overdue") return "#ef4444";
    if (status === "at-risk") return "#f97316";
    return "#a855f7";
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-500" />
          Goal Progress
        </CardTitle>
        <CardDescription>Hours logged vs target, with estimated completion</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-8">
        {goalStats.map(({ goal, pct, deadlineStatus }, idx) => (
          <div key={goal.id} className={`space-y-1.5 ${idx !== 0 ? "pt-4 border-t border-gray-100" : ""}`}>
            {/* Goal name + status badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{goal.name}</span>
              <span className="text-xs shrink-0">
                {pct >= 100 ? (
                  <span className="text-green-600 font-semibold">Complete ✓</span>
                ) : deadlineStatus === "overdue" ? (
                  <span className="text-red-500 font-semibold">Overdue</span>
                ) : deadlineStatus === "at-risk" ? (
                  <span className="text-orange-500 font-semibold">At risk</span>
                ) : deadlineStatus === "on-track" ? (
                  <span className="text-green-600 font-semibold">On track</span>
                ) : null}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: barColor(pct, deadlineStatus) }}
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{goal.currentHours.toFixed(1)}h</span>
                {" / "}
                {goal.targetHours}h &nbsp;·&nbsp; {pct.toFixed(0)}%
              </span>
              {goal.deadline && (
                <span>
                  Deadline: <span className="font-medium text-foreground">
                    {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
