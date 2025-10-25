import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Tooltip, Legend, XAxis, YAxis, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";

interface ChartsSectionProps {
  timeByCategory: Array<{ category: string; hours: number; coins: number }>;
}

const COLORS = {
  productive: "#10b981",
  learning: "#3b82f6",
  exercise: "#f59e0b",
  social: "#8b5cf6",
  hobbies: "#ec4899",
  wasted: "#ef4444",
};

const ROI_COLORS = {
  high: "#10b981",
  medium: "#f59e0b",
  low: "#ef4444",
};

export function ChartsSection({ timeByCategory }: ChartsSectionProps) {
  // Calculate ROI breakdown by levels (high/medium/low based on coin rates)
  const calculateROILevel = (category: string): "high" | "medium" | "low" => {
    // High ROI: productive, learning, exercise (50 coins/hr)
    if (["productive", "learning", "exercise"].includes(category)) return "high";
    // Medium ROI: social, hobbies (20-50 coins/hr)
    if (["social", "hobbies"].includes(category)) return "medium";
    // Low ROI: wasted (negative coins)
    return "low";
  };

  const roiBreakdown = timeByCategory.reduce((acc, cat) => {
    const level = calculateROILevel(cat.category);
    const existing = acc.find(item => item.name === level);
    
    if (existing) {
      existing.value += cat.coins > 0 ? cat.coins : 0;
      existing.hours += cat.hours;
    } else {
      acc.push({
        name: level,
        value: cat.coins > 0 ? cat.coins : 0,
        hours: cat.hours,
      });
    }
    
    return acc;
  }, [] as Array<{ name: string; value: number; hours: number }>);

  const totalROI = roiBreakdown.reduce((sum, item) => sum + item.value, 0);

  // Category time distribution
  const categoryData = timeByCategory.map(cat => ({
    name: cat.category,
    hours: cat.hours,
    coins: cat.coins,
  }));

  // Category time distribution for bar chart
  const categoryTimeData = timeByCategory.map(cat => ({
    category: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
    hours: cat.hours,
    coins: cat.coins,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* ROI Level Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              ROI Breakdown
            </CardTitle>
            <CardDescription>
              Time investment returns by value level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roiBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roiBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => 
                        `${name.toUpperCase()}: ${value.toFixed(0)} 🪙 (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roiBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={ROI_COLORS[entry.name as keyof typeof ROI_COLORS]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(0)} coins (${props.payload.hours.toFixed(1)}h)`,
                        name.toUpperCase()
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-4 space-y-2">
                  <div className="text-center pb-2 border-b">
                    <p className="text-sm text-muted-foreground">Total Positive Returns</p>
                    <p className="text-2xl font-semibold text-green-600">
                      +{totalROI.toFixed(0)} 🪙
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-medium text-green-700">HIGH ROI</div>
                      <div className="text-xs text-muted-foreground">50 coins/hr</div>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <div className="font-medium text-orange-700">MEDIUM ROI</div>
                      <div className="text-xs text-muted-foreground">20 coins/hr</div>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <div className="font-medium text-red-700">LOW ROI</div>
                      <div className="text-xs text-muted-foreground">-30 coins/hr</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>No data yet. Start logging activities!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Time by Category
            </CardTitle>
            <CardDescription>
              How your time is distributed across activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, hours }) => `${name}: ${hours.toFixed(1)}h`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="hours"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.name as keyof typeof COLORS] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toFixed(1)} hours (${props.payload.coins.toFixed(0)} coins)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>No data yet. Start logging activities!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Time Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Time Distribution</CardTitle>
          <CardDescription>
            Time spent on each category of activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis 
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(1)} hours (${props.payload.coins.toFixed(0)} coins)`,
                    'Time Spent'
                  ]}
                />
                <Bar 
                  dataKey="hours" 
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                >
                  {categoryTimeData.map((entry, index) => {
                    const categoryKey = entry.category.toLowerCase();
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[categoryKey as keyof typeof COLORS] || "#3b82f6"} 
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>No data yet. Start logging activities!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
