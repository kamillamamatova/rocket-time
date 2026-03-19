import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { BarChart2 } from "lucide-react";

interface TimeEntry {
  id: string;
  activity: string;
  category: string;
  duration: number;
  date: string;
}

interface DailyComparisonChartProps {
  timeEntries: TimeEntry[];
  calculateCoins: (duration: number, category: string) => number;
}

const PRODUCTIVE_CATEGORIES = new Set(["productive", "learning", "exercise"]);
const WASTED_CATEGORIES = new Set(["wasted", "time wasted"]);

const DAYS_TO_SHOW = 14;

export function DailyComparisonChart({ timeEntries, calculateCoins }: DailyComparisonChartProps) {
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Build last N days
  const days = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (DAYS_TO_SHOW - 1 - i));
    return d;
  });

  const data = days.map((day) => {
    const key = toLocalDateStr(day);
    const dayEntries = timeEntries.filter((e) => toLocalDateStr(new Date(e.date)) === key);

    const productiveCoins = dayEntries
      .filter((e) => PRODUCTIVE_CATEGORIES.has(e.category.trim().toLowerCase()))
      .reduce((sum, e) => sum + calculateCoins(e.duration, e.category), 0);

    const wastedCoins = Math.abs(
      dayEntries
        .filter((e) => WASTED_CATEGORIES.has(e.category.trim().toLowerCase()))
        .reduce((sum, e) => sum + calculateCoins(e.duration, e.category), 0)
    );

    return {
      day: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Productive: Math.round(productiveCoins),
      Wasted: Math.round(wastedCoins),
    };
  });

  const hasData = data.some((d) => d.Productive > 0 || d.Wasted > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const productive = payload.find((p: any) => p.dataKey === "Productive")?.value ?? 0;
    const wasted = payload.find((p: any) => p.dataKey === "Wasted")?.value ?? 0;
    const net = productive - wasted;
    return (
      <div style={{
        background: "#1e1e2e", color: "#fff", borderRadius: 8,
        padding: "10px 14px", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
      }}>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}</p>
        <p style={{ color: "#86efac" }}>+{productive} productive coins</p>
        <p style={{ color: "#fca5a5" }}>−{wasted} wasted coins</p>
        <p style={{
          borderTop: "1px solid #333", marginTop: 6, paddingTop: 6,
          color: net >= 0 ? "#86efac" : "#fca5a5", fontWeight: 600
        }}>
          Net: {net >= 0 ? "+" : ""}{net} coins
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-purple-500" />
          Daily Productive vs Wasted
        </CardTitle>
        <CardDescription>
          Last {DAYS_TO_SHOW} days, green bars earn coins, red bars cost coins. Days where green beats red count toward your streak.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} barCategoryGap="25%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: "Coins", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>} />
              <ReferenceLine y={0} stroke="#d1d5db" />
              <Bar dataKey="Productive" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Wasted" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-muted-foreground">
            <p>No data yet. Start logging time to see your daily comparison.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
