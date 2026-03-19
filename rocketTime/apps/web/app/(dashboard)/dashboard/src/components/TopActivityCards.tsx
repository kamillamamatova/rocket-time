import { Card, CardContent } from "./ui/card";
import { Flame, Skull } from "lucide-react";

interface TimeEntry {
  id: string;
  activity: string;
  category: string;
  duration: number;
  date: string;
}

interface TopActivityCardsProps {
  timeEntries: TimeEntry[];
  calculateCoins: (duration: number, category: string) => number;
}

export function TopActivityCards({ timeEntries, calculateCoins }: TopActivityCardsProps) {
  // Aggregate coins per activity name
  const byActivity = new Map<string, { coins: number; hours: number; category: string }>();
  for (const entry of timeEntries) {
    const coins = calculateCoins(entry.duration, entry.category);
    const existing = byActivity.get(entry.activity);
    if (existing) {
      existing.coins += coins;
      existing.hours += entry.duration;
    } else {
      byActivity.set(entry.activity, { coins, hours: entry.duration, category: entry.category });
    }
  }

  const activities = Array.from(byActivity.entries()).map(([name, data]) => ({ name, ...data }));

  const topEarner = activities.filter(a => a.coins > 0).sort((a, b) => b.coins - a.coins)[0] ?? null;
  const topWaster = activities.filter(a => a.coins < 0).sort((a, b) => a.coins - b.coins)[0] ?? null;

  if (!topEarner && !topWaster) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* #1 Best Activity */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50" style={{ border: "0.9px solid #22c55e" }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-green-100 p-3">
              <Flame className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">
                #1 Best Activity
              </p>
              {topEarner ? (
                <>
                  <p className="text-lg font-bold text-gray-900 truncate">{topEarner.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {topEarner.hours.toFixed(1)}h logged &nbsp;·&nbsp;
                    <span className="text-green-600 font-semibold">+{Math.round(topEarner.coins)} coins earned</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    This is where your time pays off. Do more of this.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No positive activity yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* #1 Time Waster */}
      <Card className="bg-gradient-to-br from-red-50 to-rose-50" style={{ border: "0.9px solid #ef4444" }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-100 p-3">
              <Skull className="h-6 w-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-1">
                #1 Time Waster
              </p>
              {topWaster ? (
                <>
                  <p className="text-lg font-bold text-gray-900 truncate">{topWaster.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {topWaster.hours.toFixed(1)}h logged &nbsp;·&nbsp;
                    <span className="text-red-500 font-semibold">{Math.round(topWaster.coins)} coins lost</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Every hour here is costing you. Cut it down.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No wasted time logged. Keep it up!</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
