import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface WeeklyTrendChartProps {
  dailyTrend: Array<{ day: string; hours: number; coins: number }>;
}

export function WeeklyTrendChart({ dailyTrend }: WeeklyTrendChartProps) {
  // Calculate how many days to show based on data availability
  const daysToShow = dailyTrend.length;
  const periodLabel = daysToShow <= 7 
    ? `${daysToShow} day${daysToShow !== 1 ? 's' : ''}`
    : daysToShow <= 30 
      ? `${Math.ceil(daysToShow / 7)} weeks`
      : `${Math.ceil(daysToShow / 30)} months`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Activity Trend
        </CardTitle>
        <CardDescription>
          Your coin earnings over the past {periodLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              interval={daysToShow > 30 ? Math.floor(daysToShow / 10) : daysToShow > 14 ? 2 : 0}
            />
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
  );
}
