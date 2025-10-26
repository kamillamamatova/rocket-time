import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Clock, Plus } from "lucide-react";
import { toast } from "sonner";

interface TimeEntry {
  id: string;
  activity: string;
  category: "Productive" | "Hobbies" | "Time Wasted" | "Learning" | "Social" | "Exercise";
  duration: number;
  date: string;
  goalId?: string;
}

interface Goal {
  id: string;
  name: string;
}

interface TimeLoggerProps {
  onAddEntry: (entry: Omit<TimeEntry, "id" | "date">) => void;
  goals: Goal[];
}

export function TimeLogger({ onAddEntry, goals }: TimeLoggerProps) {
  const [activity, setActivity] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [goalId, setGoalId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activity || !category || !duration) {
      toast.error("Please fill in all fields");
      return;
    }

    const durationNum = parseFloat(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }

    onAddEntry({
      activity,
      category: category as TimeEntry["category"],
      duration: durationNum,
      goalId: goalId || undefined,
    });

    const formatDateForMySQL = (date: Date | string): string => {
      const d = new Date(date);
      const pad = (n: number): string => (n < 10 ? "0" + n : n.toString());
      return (
        d.getFullYear() +
        "-" +
        pad(d.getMonth() + 1) +
        "-" +
        pad(d.getDate()) +
        " " +
        pad(d.getHours()) +
        ":" +
        pad(d.getMinutes()) +
        ":" +
        pad(d.getSeconds())
      );
    };

    const newLog = {
      user_id: "1", // HARD CODED FOR RN-----------------------------------------------------
      goal_id: goalId || null,
      date: formatDateForMySQL(new Date()),
      duration_hr: parseFloat(duration),
      category: category,
      title: activity
    };

    try {
      const response = await fetch("http://localhost:3001/addLog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${activity} logged successfully!`);
        console.log("Log saved:", data);
      } else {
        toast.error("Failed to save log");
        console.error("Error:", data);
      }
    } catch (err) {
      console.error("Error saving log:", err);
      toast.error("Server error while saving log");
    }

    toast.success(`Logged ${durationNum}h for ${activity}`);
    setActivity("");
    setCategory("");
    setDuration("");
    setGoalId("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Log Time Entry
        </CardTitle>
        <CardDescription>
          Track how you spend your time. Earn coins for productive activities!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity">Activity</Label>
            <Input
              id="activity"
              placeholder="What did you work on?"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="productive">✅ Productive</SelectItem>
                <SelectItem value="learning">📚 Learning</SelectItem>
                <SelectItem value="exercise">💪 Exercise</SelectItem>
                <SelectItem value="social">👥 Social</SelectItem>
                <SelectItem value="hobbies">🎨 Hobbies</SelectItem>
                <SelectItem value="wasted">⏰ Time Wasted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g., 2.5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {goals.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="goal">Link to Goal (Optional)</Label>
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger id="goal">
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
