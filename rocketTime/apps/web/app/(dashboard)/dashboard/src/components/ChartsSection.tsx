import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface ChartsSectionProps {
  timeByCategory: Array<{ category: string; hours: number; coins: number }>;
  dailyTrend: Array<{ day: string; hours: number; coins: number }>;
}

const COLORS = {
  productive: "#10b981",
  learning: "#3b82f6",
  exercise: "#f59e0b",
  social: "#8b5cf6",
  entertainment: "#ec4899",
  wasted: "#ef4444",
};

export function ChartsSection({ timeByCategory, dailyTrend }: ChartsSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Time Allocation</CardTitle>
          <CardDescription>
            How your time is distributed across categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={timeByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, hours }) => `${category}: ${hours.toFixed(1)}h`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="hours"
              >
                {timeByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.category as keyof typeof COLORS] || "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coins by Category</CardTitle>
          <CardDescription>
            Coins earned/lost in each category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => `🪙 ${value}`} />
              <Bar dataKey="coins" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Trend
          </CardTitle>
          <CardDescription>
            Your coin earnings over the past 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hours"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Hours"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="coins"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Coins (🪙)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
