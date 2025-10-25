import { useState, useEffect } from "react";
import { DashboardOverview } from "./components/DashboardOverview";
import { TimeLogger } from "./components/TimeLogger";
import { GoalManager, Goal } from "./components/GoalManager";
import { ChartsSection } from "./components/ChartsSection";
import { AICoach } from "./components/AICoach";
import { StreakTracker } from "./components/StreakTracker";
import { WeeklyTrendChart } from "./components/WeeklyTrendChart";
import { HabitSubscription } from "./components/HabitSubscription";
import { CoinSettings } from "./components/CoinSettings";
import { RecentTransactions } from "./components/RecentTransactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { LayoutDashboard, Clock, Target, TrendingUp, Lightbulb, Settings, LogOut } from "lucide-react";
import { Toaster } from "./components/ui/sonner";

interface TimeEntry {
  id: string;
  activity: string;
  category: string;
  duration: number;
  date: string;
  goalId?: string;
}

export default function App() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [coinRates, setCoinRates] = useState<Record<string, number>>({
    productive: 50,
    learning: 50,
    exercise: 50,
    social: 50,
    entertainment: 20,
    wasted: -30,
  });

  const calculateCoins = (duration: number, category: string): number => {
    const rate = coinRates[category] || 0;
    return duration * rate;
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem("timeEntries");
    const savedGoals = localStorage.getItem("goals");
    const savedRates = localStorage.getItem("coinRates");

    if (savedEntries) {
      setTimeEntries(JSON.parse(savedEntries));
    }
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
    if (savedRates) {
      setCoinRates(JSON.parse(savedRates));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("timeEntries", JSON.stringify(timeEntries));
  }, [timeEntries]);

  useEffect(() => {
    localStorage.setItem("goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("coinRates", JSON.stringify(coinRates));
  }, [coinRates]);

  const handleAddEntry = (entry: Omit<TimeEntry, "id" | "date">) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };

    setTimeEntries((prev) => [...prev, newEntry]);

    // Update goal progress if linked to a goal
    if (entry.goalId) {
      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === entry.goalId
            ? { ...goal, currentHours: goal.currentHours + entry.duration }
            : goal
        )
      );
    }
  };

  const handleAddGoal = (goal: Omit<Goal, "id" | "currentHours">) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      currentHours: 0,
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleDeleteEntry = (id: string) => {
    const entryToDelete = timeEntries.find((e) => e.id === id);
    if (!entryToDelete) return;

    // Update goal progress if entry was linked to a goal
    if (entryToDelete.goalId) {
      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === entryToDelete.goalId
            ? { ...goal, currentHours: Math.max(0, goal.currentHours - entryToDelete.duration) }
            : goal
        )
      );
    }

    // Remove the entry
    setTimeEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Calculate metrics
  const today = new Date().toDateString();
  const todayEntries = timeEntries.filter(
    (e) => new Date(e.date).toDateString() === today
  );
  const totalCoinsToday = todayEntries.reduce(
    (sum, e) => sum + calculateCoins(e.duration, e.category),
    0
  );

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEntries = timeEntries.filter(
    (e) => new Date(e.date) >= weekStart
  );
  const totalCoinsWeek = weekEntries.reduce(
    (sum, e) => sum + calculateCoins(e.duration, e.category),
    0
  );

  const totalCoinsAllTime = timeEntries.reduce(
    (sum, e) => sum + calculateCoins(e.duration, e.category),
    0
  );

  const productiveHours = weekEntries
    .filter((e) => e.category === "productive" || e.category === "learning")
    .reduce((sum, e) => sum + e.duration, 0);

  const wastedHours = weekEntries
    .filter((e) => e.category === "wasted")
    .reduce((sum, e) => sum + e.duration, 0);

  const targetHours = goals.reduce((sum, g) => sum + g.targetHours, 0);
  const currentHours = goals.reduce((sum, g) => sum + g.currentHours, 0);
  const coinBalance = currentHours * 50 - targetHours * 50;

  // Calculate streak (only count days with goal-linked entries)
  const goalLinkedEntries = timeEntries.filter((e) => e.goalId);
  const sortedDates = Array.from(
    new Set(goalLinkedEntries.map((e) => new Date(e.date).toDateString()))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  const today_str = new Date().toDateString();
  if (sortedDates.includes(today_str)) {
    streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      if (sortedDates[i] === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Daily activity for last 7 days (only goal-linked entries)
  const dailyActivity = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toDateString();
    return {
      date: date.toISOString(),
      hasActivity: sortedDates.includes(dateStr),
    };
  });

  // Time by category
  const categoryMap = new Map<string, number>();
  weekEntries.forEach((e) => {
    categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.duration);
  });
  const timeByCategory = Array.from(categoryMap.entries()).map(([category, hours]) => ({
    category,
    hours,
    coins: calculateCoins(hours, category),
  }));

  // Daily trend - expands over time based on available data
  const getAllUniqueDays = () => {
    if (timeEntries.length === 0) return [];
    
    const allDates = timeEntries.map(e => new Date(e.date).toDateString());
    const uniqueDates = Array.from(new Set(allDates)).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    
    // If we have data, create a continuous range from first entry to today
    if (uniqueDates.length > 0) {
      const firstDate = new Date(uniqueDates[0]);
      const today = new Date();
      const daysDiff = Math.ceil((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Limit to reasonable number of days for chart readability
      const daysToShow = Math.min(daysDiff + 1, 90); // Max 90 days
      
      return Array.from({ length: daysToShow }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (daysToShow - 1 - i));
        return date;
      });
    }
    
    // Default to last 7 days if no entries
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });
  };

  const dailyTrend = getAllUniqueDays().map(date => {
    const dateStr = date.toDateString();
    const dayEntries = timeEntries.filter(
      (e) => new Date(e.date).toDateString() === dateStr
    );
    const hours = dayEntries.reduce((sum, e) => sum + e.duration, 0);
    const coins = dayEntries.reduce((sum, e) => sum + calculateCoins(e.duration, e.category), 0);
    
    // Format day label based on range
    const totalDays = getAllUniqueDays().length;
    const dayLabel = totalDays <= 7 
      ? date.toLocaleDateString("en-US", { weekday: "short" })
      : totalDays <= 30
        ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    return {
      day: dayLabel,
      hours,
      coins,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      <div className="border-b bg-gradient-to-r from-purple-100 via-orange-50 to-yellow-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2">
                🪙 CoinTime Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your time, earn coins, achieve your goals!
              </p>
            </div>
            <Button 
              variant="destructive" 
              className="shadow-lg hover:shadow-xl transition-all hover:scale-105"
              size="lg"
              onClick={() => {
                if (confirm("Are you sure you want to log out? Your data is saved locally.")) {
                  window.location.reload();
                }
              }}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="log">
              <Clock className="h-4 w-4 mr-2" />
              Log Time
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target className="h-4 w-4 mr-2" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="coach">
              <Lightbulb className="h-4 w-4 mr-2" />
              AI Coach
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview
              totalCoinsToday={totalCoinsToday}
              coinBalance={coinBalance}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <StreakTracker 
                streak={streak} 
                dailyActivity={dailyActivity}
                weekCoins={totalCoinsWeek}
                totalCoins={totalCoinsAllTime}
              />
              <HabitSubscription timeEntries={timeEntries} />
            </div>
          </TabsContent>

          <TabsContent value="log" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <TimeLogger onAddEntry={handleAddEntry} goals={goals} />
              <StreakTracker 
                streak={streak} 
                dailyActivity={dailyActivity}
                weekCoins={totalCoinsWeek}
                totalCoins={totalCoinsAllTime}
              />
            </div>

            <RecentTransactions
              entries={weekEntries}
              goals={goals}
              calculateCoins={calculateCoins}
            />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <GoalManager
              goals={goals}
              onAddGoal={handleAddGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {timeByCategory.length > 0 ? (
              <>
                <WeeklyTrendChart dailyTrend={dailyTrend} />
                <ChartsSection
                  timeByCategory={timeByCategory}
                  dailyTrend={dailyTrend}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No data yet. Start logging your time to see analytics!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="coach" className="space-y-6">
            <AICoach
              wastedHours={wastedHours}
              goals={goals}
              timeByCategory={timeByCategory}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <CoinSettings
              coinRates={coinRates}
              onUpdateRates={setCoinRates}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
