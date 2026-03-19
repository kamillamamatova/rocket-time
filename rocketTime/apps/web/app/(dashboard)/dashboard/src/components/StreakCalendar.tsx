import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { CalendarDays } from "lucide-react";

interface TimeEntry {
  id: string;
  activity: string;
  category: string;
  duration: number;
  date: string;
}

interface StreakCalendarProps {
  timeEntries: TimeEntry[];
  calculateCoins: (duration: number, category: string) => number;
}

const WEEKS_TO_SHOW = 26; // ~6 months

export function StreakCalendar({ timeEntries, calculateCoins }: StreakCalendarProps) {
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  // Build a map of dateKey -> net coins
  const coinsByDay = new Map<string, number>();
  for (const entry of timeEntries) {
    const key = toLocalDateStr(new Date(entry.date));
    coinsByDay.set(key, (coinsByDay.get(key) ?? 0) + calculateCoins(entry.duration, entry.category));
  }

  // Build grid: WEEKS_TO_SHOW columns, 7 rows (Sun–Sat)
  // Start from the Sunday WEEKS_TO_SHOW weeks ago
  const today = new Date();
  const todayDow = today.getDay(); // 0=Sun
  const gridEnd = new Date(today);
  // align end to the last day of this week (Saturday)
  gridEnd.setDate(today.getDate() + (6 - todayDow));

  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridEnd.getDate() - WEEKS_TO_SHOW * 7 + 1);

  // Build array of all days
  const days: Array<{ date: Date; key: string; netCoins: number | null }> = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const key = toLocalDateStr(cursor);
    const netCoins = coinsByDay.has(key) ? coinsByDay.get(key)! : null;
    days.push({ date: new Date(cursor), key, netCoins });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Group into weeks (columns of 7)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getColor = (netCoins: number | null, isFuture: boolean) => {
    if (isFuture) return "#f3f4f6";
    if (netCoins === null) return "#e5e7eb"; // gray – no activity
    if (netCoins > 0) return "#22c55e";      // green – streak day
    return "#ef4444";                         // red – negative day
  };

  const todayKey = toLocalDateStr(today);
  const DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  // Month labels: find first day of each month in the grid
  const monthLabels: Array<{ label: string; col: number }> = [];
  weeks.forEach((week, col) => {
    const firstOfMonth = week.find((d) => d.date.getDate() === 1);
    if (firstOfMonth) {
      monthLabels.push({
        label: firstOfMonth.date.toLocaleDateString("en-US", { month: "short" }),
        col,
      });
    }
  });

  const totalDays = days.filter((d) => d.netCoins !== null).length;
  const streakDays = days.filter((d) => d.netCoins !== null && d.netCoins > 0).length;
  const negativeDays = days.filter((d) => d.netCoins !== null && d.netCoins <= 0).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-purple-500" />
          Streak History
        </CardTitle>
        <CardDescription>
          Daily coin balance over the last {WEEKS_TO_SHOW / 4} months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div style={{ minWidth: WEEKS_TO_SHOW * 16 + 32 }}>
            {/* Month labels */}
            <div className="flex ml-8 mb-1">
              {weeks.map((_, col) => {
                const label = monthLabels.find((m) => m.col === col);
                return (
                  <div key={col} style={{ width: 14, marginRight: 2, flexShrink: 0 }}>
                    {label && (
                      <span className="text-xs text-muted-foreground" style={{ fontSize: 10 }}>
                        {label.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex gap-0">
              {/* Day-of-week labels */}
              <div className="flex flex-col mr-2" style={{ gap: 2 }}>
                {DOW_LABELS.map((d, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground flex items-center justify-end"
                    style={{ height: 14, width: 14, fontSize: 10 }}
                  >
                    {i % 2 === 1 ? d : ""}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              {weeks.map((week, col) => (
                <div key={col} className="flex flex-col" style={{ gap: 2, marginRight: 2 }}>
                  {week.map((day, row) => {
                    const isFuture = day.date > today;
                    const isToday = day.key === todayKey;
                    const color = getColor(day.netCoins, isFuture);
                    const label = day.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const coinLabel =
                      day.netCoins === null
                        ? "No activity"
                        : `${day.netCoins > 0 ? "+" : ""}${Math.round(day.netCoins)} coins`;

                    return (
                      <div
                        key={row}
                        title={`${label}: ${coinLabel}`}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          backgroundColor: color,
                          outline: isToday ? "2px solid #7c3aed" : undefined,
                          outlineOffset: isToday ? 1 : undefined,
                          flexShrink: 0,
                          cursor: "default",
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend + stats */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#22c55e", display: "inline-block" }} />
              Streak day
            </span>
            <span className="flex items-center gap-1">
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#ef4444", display: "inline-block" }} />
              Negative day
            </span>
            <span className="flex items-center gap-1">
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#e5e7eb", display: "inline-block" }} />
              No activity
            </span>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-green-600 font-medium">{streakDays} streak days</span>
            <span className="text-red-500 font-medium">{negativeDays} negative days</span>
            <span className="text-muted-foreground">{totalDays} total active days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
