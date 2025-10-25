import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertTriangle, TrendingDown } from "lucide-react";

interface TimeEntry {
  id: string;
  date: string;
  activity: string;
  duration: number;
  category: "Productive" | "Entertainment" | "Wasted";
  goalId?: string;
}

interface HabitSubscriptionProps {
  timeEntries: TimeEntry[];
}

interface BadHabit {
  type: string;
  description: string;
  impact: string;
  severity: "high" | "medium" | "low";
}

export function HabitSubscription({ timeEntries }: HabitSubscriptionProps) {
  // Analyze bad habits from time entries
  const detectBadHabits = (): BadHabit[] => {
    const habits: BadHabit[] = [];
    
    // Calculate total wasted time in the last 7 days
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEntries = timeEntries.filter((e) => new Date(e.date) >= weekStart);
    
    const wastedEntries = weekEntries.filter((e) => e.category === "Wasted");
    const totalWastedHours = wastedEntries.reduce((sum, e) => sum + e.duration, 0);
    
    if (totalWastedHours > 10) {
      habits.push({
        type: "Excessive Wasted Time",
        description: `${totalWastedHours.toFixed(1)} hours wasted this week`,
        impact: "Losing opportunities for productive work and personal growth",
        severity: "high",
      });
    } else if (totalWastedHours > 5) {
      habits.push({
        type: "Moderate Wasted Time",
        description: `${totalWastedHours.toFixed(1)} hours wasted this week`,
        impact: "Could be redirected to more valuable activities",
        severity: "medium",
      });
    }
    
    // Check for unlinked productive activities
    const unlinkedProductiveEntries = weekEntries.filter(
      (e) => e.category === "Productive" && !e.goalId
    );
    if (unlinkedProductiveEntries.length > 3) {
      habits.push({
        type: "Lack of Goal Alignment",
        description: `${unlinkedProductiveEntries.length} productive activities not linked to goals`,
        impact: "Working without clear direction or measurable progress",
        severity: "medium",
      });
    }
    
    // Check for excessive entertainment
    const entertainmentEntries = weekEntries.filter((e) => e.category === "Entertainment");
    const totalEntertainmentHours = entertainmentEntries.reduce((sum, e) => sum + e.duration, 0);
    
    if (totalEntertainmentHours > 20) {
      habits.push({
        type: "Excessive Entertainment",
        description: `${totalEntertainmentHours.toFixed(1)} hours on entertainment this week`,
        impact: "Consider balancing leisure with productive activities",
        severity: "low",
      });
    }
    
    // Check for irregular activity patterns (no entries for multiple days)
    const uniqueDays = new Set(weekEntries.map((e) => new Date(e.date).toDateString())).size;
    if (uniqueDays < 4) {
      habits.push({
        type: "Inconsistent Tracking",
        description: `Only ${uniqueDays} days of activity logged this week`,
        impact: "Irregular patterns make it harder to build lasting habits",
        severity: "medium",
      });
    }
    
    return habits;
  };

  const badHabits = detectBadHabits();
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "low":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Habit Subscription
        </CardTitle>
        <CardDescription>
          AI-detected patterns that may need your attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {badHabits.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-3 text-4xl">🎉</div>
            <p className="text-sm text-muted-foreground">
              Great job! No concerning habits detected this week.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Keep up the excellent time management!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {badHabits.map((habit, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-medium">{habit.type}</span>
                      <Badge
                        variant="outline"
                        className={getSeverityColor(habit.severity)}
                      >
                        {habit.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {habit.description}
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      💡 {habit.impact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
