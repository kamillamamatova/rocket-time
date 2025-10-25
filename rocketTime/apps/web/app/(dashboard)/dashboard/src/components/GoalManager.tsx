import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Target, Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner@2.0.3";

export interface Goal {
  id: string;
  name: string;
  targetHours: number;
  currentHours: number;
  category: "productive" | "learning" | "exercise";
  deadline?: string;
}

interface GoalManagerProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, "id" | "currentHours">) => void;
  onDeleteGoal: (id: string) => void;
}

export function GoalManager({ goals, onAddGoal, onDeleteGoal }: GoalManagerProps) {
  const [goalName, setGoalName] = useState("");
  const [targetHours, setTargetHours] = useState("");
  const [category, setCategory] = useState<"productive" | "learning" | "exercise">("productive");
  const [deadline, setDeadline] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!goalName || !targetHours) {
      toast.error("Please fill in all fields");
      return;
    }

    const hours = parseFloat(targetHours);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Please enter a valid target");
      return;
    }

    onAddGoal({
      name: goalName,
      targetHours: hours,
      category: category,
      deadline: deadline || undefined,
    });

    toast.success(`Goal "${goalName}" created!`);
    setGoalName("");
    setTargetHours("");
    setCategory("productive");
    setDeadline("");
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              My Goals
            </CardTitle>
            <CardDescription>
              Set weekly time goals to stay on track
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="goal-name">Goal Name</Label>
              <Input
                id="goal-name"
                placeholder="e.g., Learn React"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-category">Category</Label>
              <Select value={category} onValueChange={(value: "productive" | "learning" | "exercise") => setCategory(value)}>
                <SelectTrigger id="goal-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="productive">✅ Productive</SelectItem>
                  <SelectItem value="learning">📚 Learning</SelectItem>
                  <SelectItem value="exercise">💪 Exercise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-hours">Weekly Target (hours)</Label>
              <Input
                id="target-hours"
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g., 10"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1">
                Create Goal
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No goals yet. Create one to get started!
            </p>
          ) : (
            goals.map((goal) => {
              const progress = (goal.currentHours / goal.targetHours) * 100;
              const isOverdue = goal.deadline && new Date(goal.deadline) < new Date();
              const daysUntilDeadline = goal.deadline 
                ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;
              
              const getCategoryColor = (cat: string) => {
                switch (cat) {
                  case "productive": return "bg-green-100 text-green-800 border-green-300";
                  case "learning": return "bg-blue-100 text-blue-800 border-blue-300";
                  case "exercise": return "bg-orange-100 text-orange-800 border-orange-300";
                  default: return "bg-gray-100 text-gray-800 border-gray-300";
                }
              };
              
              const getCategoryLabel = (cat: string) => {
                switch (cat) {
                  case "productive": return "✅ Productive";
                  case "learning": return "📚 Learning";
                  case "exercise": return "💪 Exercise";
                  default: return cat;
                }
              };

              return (
                <div
                  key={goal.id}
                  className="p-4 border rounded-lg space-y-2 bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4>{goal.name}</h4>
                        <Badge variant="outline" className={getCategoryColor(goal.category)}>
                          {getCategoryLabel(goal.category)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {goal.currentHours.toFixed(1)}h / {goal.targetHours}h
                      </p>
                      {goal.deadline && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                          <Calendar className="h-3 w-3" />
                          {isOverdue 
                            ? `Overdue by ${Math.abs(daysUntilDeadline!)} days`
                            : daysUntilDeadline === 0 
                              ? "Due today"
                              : `${daysUntilDeadline} days left`
                          }
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={progress >= 100 ? "default" : "secondary"}>
                        {progress.toFixed(0)}%
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={Math.min(progress, 100)} />
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
