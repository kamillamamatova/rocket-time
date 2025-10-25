import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { TrendingDown, TrendingUp, Trash2 } from "lucide-react";

interface TimeEntry {
  id: string;
  date: string;
  activity: string;
  duration: number;
  category: "Productive" | "Hobbies" | "Time Wasted" | "Learning" | "Social" | "Exercise";
  goalId?: string;
}

interface Goal {
  id: string;
  name: string;
}

interface RecentTransactionsProps {
  entries: TimeEntry[];
  goals: Goal[];
  calculateCoins: (duration: number, category: string) => number;
  onDeleteEntry: (id: string) => void;
}

const getCategoryBadgeStyle = (category: string) => {
  switch (category) {
    case "Productive":
    case "Learning":
    case "Exercise":
      return "bg-green-100 text-green-800 border-green-300";
    case "Hobbies":
    case "Social":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "Time Wasted":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getCategoryType = (category: string) => {
  switch (category) {
    case "Productive":
    case "Learning":
    case "Exercise":
      return { label: "Investment", style: "bg-green-500 text-white hover:bg-green-600" };
    case "Hobbies":
    case "Social":
      return { label: "Entertainment", style: "bg-blue-500 text-white hover:bg-blue-600" };
    case "Time Wasted":
      return { label: "Time Wasted", style: "bg-red-500 text-white hover:bg-red-600" };
    default:
      return { label: category, style: "bg-gray-500 text-white hover:bg-gray-600" };
  }
};

const formatDuration = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (h === 0) {
    return `${m}m`;
  } else if (m === 0) {
    return `${h}h`;
  } else {
    return `${h}h ${m}m`;
  }
};

export function RecentTransactions({
  entries,
  goals,
  calculateCoins,
  onDeleteEntry,
}: RecentTransactionsProps) {
  const recentEntries = entries.slice(-10).reverse();

  if (recentEntries.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your time activity log</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentEntries.map((entry) => {
            const coins = calculateCoins(entry.duration, entry.category);
            const linkedGoal = entry.goalId ? goals.find((g) => g.id === entry.goalId) : null;
            const categoryType = getCategoryType(entry.category);
            const isPositive = coins >= 0;

            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Trending Icon */}
                <div className="mt-1">
                  {isPositive ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-medium">{entry.activity}</span>
                    <Badge className={categoryType.style}>
                      {categoryType.label}
                    </Badge>
                    {linkedGoal && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                        {linkedGoal.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDuration(entry.duration)}</span>
                    <span>•</span>
                    <span>
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      ,{" "}
                      {new Date(entry.date).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    <span>•</span>
                    <span className={isPositive ? "text-green-600" : "text-red-600"}>
                      {coins >= 0 ? "+" : ""}
                      {coins.toFixed(0)} 🪙
                    </span>
                  </div>
                </div>

                {/* Delete Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteEntry(entry.id)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
