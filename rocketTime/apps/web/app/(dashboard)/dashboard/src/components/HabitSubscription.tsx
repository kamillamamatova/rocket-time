import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertTriangle, TrendingDown, TrendingUp, Target } from "lucide-react";

interface TimeEntry {
  id: string;
  date: string;
  activity: string;
  duration: number;
  category: "Productive" | "Entertainment" | "Wasted";
  goalId?: string;
}

interface Goal {
  id: string;
  name: string;
  targetHours: number;
  currentHours: number;
  category: "productive" | "learning" | "exercise";
  deadline?: string;
}

interface HabitSubscriptionProps {
  timeEntries: TimeEntry[];
  goals: Goal[];
}

interface BadHabit {
  type: string;
  description: string;
  impact: string;
  severity: "high" | "medium" | "low";
}

interface GoalStatus {
  goal: Goal;
  status: "on-track" | "behind" | "overdue" | "completed";
  progressPercentage: number;
}

export function HabitSubscription({ timeEntries, goals }: HabitSubscriptionProps) {
  // Analyze goal progress
  const analyzeGoalProgress = (): GoalStatus[] => {
    const now = new Date();
    
    return goals.map(goal => {
      const progressPercentage = (goal.currentHours / goal.targetHours) * 100;
      
      let status: GoalStatus['status'];
      
      if (progressPercentage >= 100) {
        status = "completed";
      } else if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        if (deadline < now) {
          status = "overdue";
        } else {
          // Calculate expected progress based on time elapsed
          const totalTimeToDeadline = deadline.getTime() - now.getTime();
          const daysUntilDeadline = totalTimeToDeadline / (1000 * 60 * 60 * 24);
          
          // If more than 50% behind schedule, mark as behind
          if (daysUntilDeadline < 7 && progressPercentage < 70) {
            status = "behind";
          } else {
            status = "on-track";
          }
        }
      } else {
        // No deadline, just check if making progress
        status = progressPercentage > 0 ? "on-track" : "behind";
      }
      
      return {
        goal,
        status,
        progressPercentage,
      };
    });
  };
  
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
  const goalStatuses = analyzeGoalProgress();
  
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
  
  const getStatusColor = (status: GoalStatus['status']) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "on-track":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "behind":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  
  const getStatusIcon = (status: GoalStatus['status']) => {
    switch (status) {
      case "completed":
        return <TrendingUp className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />;
      case "on-track":
        return <Target className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />;
      case "behind":
        return <TrendingDown className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />;
      case "overdue":
        return <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />;
      default:
        return <Target className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />;
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
          AI-detected patterns and goal progress tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goal Progress Section */}
        {goalStatuses.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Goal Progress</h4>
            <div className="space-y-2">
              {goalStatuses.map((goalStatus, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(goalStatus.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium">{goalStatus.goal.name}</span>
                        <Badge
                          variant="outline"
                          className={getStatusColor(goalStatus.status)}
                        >
                          {goalStatus.status === "on-track" ? "On Track" : 
                           goalStatus.status === "behind" ? "Behind" :
                           goalStatus.status === "overdue" ? "Overdue" : "Completed"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {goalStatus.goal.currentHours.toFixed(1)}h / {goalStatus.goal.targetHours}h 
                        ({goalStatus.progressPercentage.toFixed(0)}%)
                      </p>
                      {goalStatus.goal.deadline && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Deadline: {new Date(goalStatus.goal.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Bad Habits Section */}
        {badHabits.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Detected Patterns</h4>
            <div className="space-y-2">
              {badHabits.map((habit, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <TrendingDown className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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
          </div>
        )}
        
        {/* Empty State */}
        {badHabits.length === 0 && goalStatuses.length === 0 && (
          <div className="text-center py-8">
            <div className="mb-3 text-4xl">🎯</div>
            <p className="text-sm text-muted-foreground">
              No goals or patterns to track yet.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Create some goals to get started!
            </p>
          </div>
        )}
        
        {badHabits.length === 0 && goalStatuses.length > 0 && (
          <div className="text-center py-4 border-t">
            <p className="text-sm text-muted-foreground">
              ✨ No concerning habits detected this week!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
