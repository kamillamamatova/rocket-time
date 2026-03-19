import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

const COLORS: Record<string, string> = {
  productive: "#10b981",
  learning: "#3b82f6",
  exercise: "#f59e0b",
  social: "#8b5cf6",
  hobbies: "#ec4899",
  wasted: "#ef4444",
};

interface ActivityDistributionChartProps {
  timeByCategory: Array<{ category: string; hours: number; coins: number }>;
}

export function ActivityDistributionChart({ timeByCategory }: ActivityDistributionChartProps) {
  const data = timeByCategory.map(cat => ({
    category: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
    hours: cat.hours,
    coins: cat.coins,
  }));

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Activity Time Distribution</CardTitle>
        <CardDescription>Time spent on each category of activity</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value: number, _name: string, props: any) => [
                  `${(value as number).toFixed(1)} hours (${props.payload.coins.toFixed(0)} coins)`,
                  "Time Spent",
                ]}
              />
              <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.category.toLowerCase()] || "#3b82f6"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[340px] flex items-center justify-center text-muted-foreground">
            <p>No data yet. Start logging activities!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
