import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Flame, Coins } from "lucide-react";
import { Separator } from "./ui/separator";

interface StreakTrackerProps {
  streak: number;
  dailyActivity: Array<{ date: string; hasActivity: boolean }>;
  weekCoins: number;
  totalCoins: number;
}

export function StreakTracker({ streak, dailyActivity, weekCoins, totalCoins }: StreakTrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Activity Streak
        </CardTitle>
        <CardDescription>
          Current streak: {streak} {streak === 1 ? "day" : "days"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {dailyActivity.map((day, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center transition-colors ${
                  day.hasActivity
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {day.hasActivity ? "✓" : "·"}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}
              </span>
            </div>
          ))}
        </div>

        <div className={`mt-6 p-4 rounded-lg text-center ${
          streak > 0 && streak < 7 
            ? "bg-gradient-to-r from-orange-100 to-red-100" 
            : "bg-gradient-to-r from-orange-100 to-red-100"
        }`}>
          <p className="text-sm">
            {streak === 0 && "Start your streak today! Log your first activity."}
            {streak > 0 && streak < 7 && "Keep going! Build that momentum! 🚀"}
            {streak >= 7 && streak < 30 && "Amazing! You're building a strong habit! 🔥"}
            {streak >= 30 && "Incredible! You're a time management champion! 🏆"}
          </p>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-100">
            <span className="text-sm font-medium text-yellow-900">Week's Coins</span>
            <span className={`flex items-center gap-1 font-bold ${weekCoins >= 0 ? 'text-yellow-700' : 'text-red-600'}`}>
              <Coins className="h-4 w-4" />
              {weekCoins >= 0 ? '+' : ''}{weekCoins.toFixed(0)}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-purple-100">
            <span className="text-sm font-medium text-purple-900">Total Coins</span>
            <span className={`flex items-center gap-1 font-bold ${totalCoins >= 0 ? 'text-purple-700' : 'text-red-600'}`}>
              <Coins className="h-4 w-4" />
              {totalCoins.toFixed(0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
