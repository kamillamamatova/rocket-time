import { useState, useEffect } from "react";
import { AuthPage } from "./components/AuthPage";
import { DashboardOverview } from "./components/DashboardOverview";
import { TimeLogger } from "./components/TimeLogger";
import { GoalManager, Goal } from "./components/GoalManager";
import { TaskManager, Task } from "./components/TaskManager";
import { DailyAnalysis } from "./components/DailyAnalysis";
import { ChartsSection } from "./components/ChartsSection";
import { AICoach } from "./components/AICoach";
import { StreakTracker } from "./components/StreakTracker";
import { WeeklyTrendChart } from "./components/WeeklyTrendChart";
import { HabitSubscription } from "./components/HabitSubscription";
import { CoinSettings } from "./components/CoinSettings";
import { RecentTransactions } from "./components/RecentTransactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./components/ui/alert-dialog";
import { LayoutDashboard, Clock, Target, TrendingUp, Lightbulb, Settings, LogOut } from "lucide-react";
import { Toaster } from "./components/ui/sonner";

interface TimeEntry {
  id: string;
  activity: string;
  category: "Productive" | "Hobbies" | "Time Wasted" | "Learning" | "Social" | "Exercise";
  duration: number;
  date: string;
  goalId?: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [coinRates, setCoinRates] = useState<Record<string, number>>({
    productive: 50,
    learning: 50,
    exercise: 50,
    social: 30,
    hobbies: 20,
    wasted: -30,
  });

  const calculateCoins = (duration: number, category: string): number => {
    const normalized = category.trim().toLowerCase();
    const rate =
      normalized === "time wasted"
        ? coinRates["wasted"]
        : coinRates[normalized] || 0;

    return duration * rate;
  };

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  // Load user-specific data when user logs in
  useEffect(() => {
    if (!currentUser) return;

    const loadUserData = async () => {
      try {
        const res = await fetch(`http://localhost:3001/getLog/1`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Failed to fetch time logs");

        const data = await res.json().catch(() => ({}));

        if (data.timelogs && Array.isArray(data.timelogs)) {
          const formatted = data.timelogs.map((log: any) => ({
            id: log.id.toString(),
            activity: log.title,
            category: log.category,
            duration: log.duration_hr,
            date: log.date,
            goalId: log.goal_id || undefined,
          }));

          // Replace instead of append
          setTimeEntries(formatted);
        } else {
          console.log(data.message || "No logs found for this user.");
          setTimeEntries([]); // Clear entries if none found
        }

      } catch (err) {
        console.error("Error loading user time logs:", err);
      }
    };

    // Load localStorage data first
    const userKey = `user_${currentUser}`;
    const savedGoals = localStorage.getItem(`${userKey}_goals`);
    const savedTasks = localStorage.getItem(`${userKey}_tasks`);
    const savedRates = localStorage.getItem(`${userKey}_coinRates`);
    const savedGoogleConnect = localStorage.getItem(`${userKey}_isGoogleConnected`);
    const savedEntries = localStorage.getItem(`${userKey}_timeEntries`);

    if (savedEntries) {
      setTimeEntries(JSON.parse(savedEntries));
    }

    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedRates) setCoinRates(JSON.parse(savedRates));
    if (savedGoogleConnect) setIsGoogleConnected(JSON.parse(savedGoogleConnect));

    // Then refresh from backend
    loadUserData();
  }, [currentUser]);


  // Save to localStorage whenever data changes (user-specific)
  useEffect(() => {
    if (!currentUser) return;
    const userKey = `user_${currentUser}`;
    localStorage.setItem(`${userKey}_timeEntries`, JSON.stringify(timeEntries));
  }, [timeEntries, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const userKey = `user_${currentUser}`;
    localStorage.setItem(`${userKey}_goals`, JSON.stringify(goals));
  }, [goals, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const userKey = `user_${currentUser}`;
    localStorage.setItem(`${userKey}_tasks`, JSON.stringify(tasks));
  }, [tasks, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const userKey = `user_${currentUser}`;
    localStorage.setItem(`${userKey}_coinRates`, JSON.stringify(coinRates));
  }, [coinRates, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const userKey = `user_${currentUser}`;
    localStorage.setItem(`${userKey}_isGoogleConnected`, JSON.stringify(isGoogleConnected));
  }, [isGoogleConnected, currentUser]);

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

  const handleDeleteEntry = async (id: string) => {
    try {
      // Delete on the server
      const res = await fetch(`http://localhost:3001/deleteLog/1`, { //-----------------------------
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Server failed to delete entry:", errText);
        throw new Error("Failed to delete entry on server");
      }

      const data = await res.json();
      console.log("Delete response:", data);

      // Update frontend state
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

      // Remove entry from local state
      setTimeEntries((prev) => prev.filter((e) => e.id !== id));

      console.log("Entry deleted successfully");

    } catch (err) {
      console.error("Error deleting time entry:", err);
    }

  };

  const handleAddTask = (task: Omit<Task, "id" | "date">) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleUpdateTaskStatus = (
    id: string,
    status: Task["status"],
    duration?: number,
    category?: string
  ) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // Update task status
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, duration, category }
          : t
      )
    );

    // If completed, auto-log as time entry
    if (status === "complete" && duration && category) {
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        activity: task.title,
        category: category as TimeEntry["category"],
        duration: duration,
        date: new Date().toISOString(),
        goalId: task.goalId,
      };
      setTimeEntries((prev) => [...prev, newEntry]);

      // Update goal progress
      if (task.goalId) {
        setGoals((prev) =>
          prev.map((goal) =>
            goal.id === task.goalId
              ? { ...goal, currentHours: goal.currentHours + duration }
              : goal
          )
        );
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEditTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      )
    );
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
    .filter((e) => e.category === "Productive" || e.category === "Learning")
    .reduce((sum, e) => sum + e.duration, 0);

  const wastedHours = weekEntries
    .filter((e) => e.category === "Time Wasted")
    .reduce((sum, e) => sum + e.duration, 0);

  // Calculate total coins deficit from overdue goals only
  const now = new Date();
  const overdueDeficit = goals.reduce((deficit, goal) => {
    if (goal.deadline && new Date(goal.deadline) < now) {
      const hoursShort = Math.max(0, goal.targetHours - goal.currentHours);
      return deficit - (hoursShort * 50); // Penalty for overdue incomplete goals
    }
    return deficit;
  }, 0);
  
  const coinBalance = totalCoinsAllTime + overdueDeficit;

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

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem("currentUser", username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    // Clear state
    setTimeEntries([]);
    setGoals([]);
    setTasks([]);
    setCoinRates({
      productive: 50,
      learning: 50,
      exercise: 50,
      social: 50,
      hobbies: 20,
      wasted: -30,
    });
    setIsGoogleConnected(false);
    setShowLogoutDialog(false);
  };

  // Show auth page if not logged in
  if (!currentUser) {
    return (
      <>
        <Toaster />
        <AuthPage onLogin={handleLogin} />
      </>
    );
  }

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
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <p className="font-medium">{currentUser}</p>
              </div>
              <Button 
                variant="destructive" 
                className="shadow-lg hover:shadow-xl transition-all hover:scale-105"
                size="lg"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Log Out
              </Button>
              
              <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll need to log back in to access your dashboard. All your data is safely saved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
              Goals/Tasks
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
                showTotalCoins={false}
              />
              <HabitSubscription timeEntries={timeEntries} goals={goals} />
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
              entries={timeEntries}
              goals={goals}
              calculateCoins={calculateCoins}
              onDeleteEntry={handleDeleteEntry}
            />

            <DailyAnalysis
              entries={timeEntries}
              goals={goals}
            />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <GoalManager
                goals={goals}
                onAddGoal={handleAddGoal}
                onDeleteGoal={handleDeleteGoal}
              />
              <TaskManager
                tasks={tasks}
                goals={goals}
                onAddTask={handleAddTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
                isGoogleConnected={isGoogleConnected}
              />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {timeByCategory.length > 0 ? (
              <>
                <ChartsSection
                  timeByCategory={timeByCategory}
                />
                <WeeklyTrendChart dailyTrend={dailyTrend} />
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
              isGoogleConnected={isGoogleConnected}
              onToggleGoogleCalendar={() => setIsGoogleConnected(!isGoogleConnected)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
