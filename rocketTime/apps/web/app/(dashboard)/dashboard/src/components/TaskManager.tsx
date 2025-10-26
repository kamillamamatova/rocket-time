import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { CheckCircle2, Circle, XCircle, Plus, Calendar, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  status: "complete" | "attempted" | "incomplete" | "pending";
  duration?: number;
  category?: string;
  date: string;
  goalId?: string;
}

interface TaskManagerProps {
  tasks: Task[];
  goals: Array<{ id: string; name: string }>;
  onAddTask: (task: Omit<Task, "id" | "date">) => void;
  onUpdateTaskStatus: (id: string, status: Task["status"], duration?: number, category?: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (id: string, updates: Partial<Task>) => void;
  isGoogleConnected: boolean;
}

export function TaskManager({ 
  tasks, 
  goals, 
  onAddTask, 
  onUpdateTaskStatus, 
  onDeleteTask,
  onEditTask,
  isGoogleConnected 
}: TaskManagerProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [goalId, setGoalId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editGoalId, setEditGoalId] = useState("");
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionDuration, setCompletionDuration] = useState("");
  const [completionCategory, setCompletionCategory] = useState("");

  const today = new Date().toDateString();
  const todayTasks = tasks.filter(t => new Date(t.date).toDateString() === today);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskTitle) {
      toast.error("Please enter a task title");
      return;
    }

    onAddTask({
      title: taskTitle,
      status: "pending",
      goalId: goalId || undefined,
    });

    toast.success(`Task "${taskTitle}" added!`);
    setTaskTitle("");
    setGoalId("");
    setShowForm(false);
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditGoalId(task.goalId || "");
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditGoalId("");
  };

  const saveEdit = (taskId: string) => {
    if (!editTitle) {
      toast.error("Task title cannot be empty");
      return;
    }

    onEditTask(taskId, {
      title: editTitle,
      goalId: editGoalId || undefined,
    });

    toast.success("Task updated!");
    cancelEditing();
  };

  const startCompletion = (taskId: string) => {
    setCompletingTaskId(taskId);
    setCompletionDuration("");
    setCompletionCategory("productive");
  };

  const cancelCompletion = () => {
    setCompletingTaskId(null);
    setCompletionDuration("");
    setCompletionCategory("");
  };

  const completeTask = async (taskId: string) => {
    if (!completionDuration || isNaN(parseFloat(completionDuration)) || parseFloat(completionDuration) <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }
  
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
  
    // Call parent handler to update status, log time entry, and update goal
    try {
      // Call your Log Time API
      const res = await fetch("http://localhost:3001/addLog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          category: completionCategory,
          duration_hr: parseFloat(completionDuration),
          goal_id: task.goalId || null,
          user_id: 1, // replace with dynamic user ID
          date: new Date(),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Failed to log task time:", errText);
        toast.error("Failed to log task time");
        return;
      }
  
       toast.success("Task completed and logged!");
       await onUpdateTaskStatus(taskId, "complete", parseFloat(completionDuration), completionCategory/*, task.goalId*/);

      cancelCompletion();
    } catch (err) {
      console.error("Error logging task time:", err);
      toast.error("Error logging task time");
    }
   
  };

  const handleAttempted = (taskId: string) => {
    onUpdateTaskStatus(taskId, "attempted");
    toast.info("Task marked as attempted");
  };

  const handleIncomplete = (taskId: string) => {
    onUpdateTaskStatus(taskId, "incomplete");
    toast.info("Task marked as incomplete");
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "attempted":
        return <Circle className="h-5 w-5 text-yellow-600" />;
      case "incomplete":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Complete</Badge>;
      case "attempted":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Attempted</Badge>;
      case "incomplete":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Incomplete</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Tasks
            </CardTitle>
            <CardDescription>
              {isGoogleConnected ? "Synced with Google Calendar" : "Plan your day"}
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
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="What do you need to do today?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            {goals.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="task-goal">Link to Goal (Optional)</Label>
                <Select value={goalId} onValueChange={setGoalId}>
                  <SelectTrigger id="task-goal">
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
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1">
                Add Task
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

        <div className="space-y-2">
          {todayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tasks for today. Add one to get started!
            </p>
          ) : (
            todayTasks.map((task) => {
              const linkedGoal = task.goalId ? goals.find((g) => g.id === task.goalId) : null;
              const isEditing = editingTaskId === task.id;
              const isCompleting = completingTaskId === task.id;
              
              return (
                <div
                  key={task.id}
                  className="p-3 border rounded-lg space-y-3 bg-card"
                >
                  {/* Task Header */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Task title"
                          />
                          {goals.length > 0 && (
                            <Select value={editGoalId} onValueChange={setEditGoalId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Link to goal" />
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
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(task.id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={task.status === "complete" ? "line-through text-muted-foreground" : ""}>
                              {task.title}
                            </span>
                            {linkedGoal && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                                {linkedGoal.name}
                              </Badge>
                            )}
                          </div>
                          {getStatusBadge(task.status)}
                        </>
                      )}
                    </div>
                    {!isEditing && task.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(task)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                    {!isEditing && task.status !== "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Completion Form */}
                  {!isEditing && isCompleting && (
                    <div className="ml-8 space-y-3 p-3 border rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Label htmlFor={`duration-${task.id}`}>Duration (hours)</Label>
                        <Input
                          id={`duration-${task.id}`}
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder="e.g., 2.5"
                          value={completionDuration}
                          onChange={(e) => setCompletionDuration(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`category-${task.id}`}>Category</Label>
                        <Select value={completionCategory} onValueChange={setCompletionCategory}>
                          <SelectTrigger id={`category-${task.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="productive">✅ Productive</SelectItem>
                            <SelectItem value="learning">📚 Learning</SelectItem>
                            <SelectItem value="exercise">💪 Exercise</SelectItem>
                            <SelectItem value="hobbies">🎨 Hobbies</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => completeTask(task.id)}
                        >
                          Log & Complete
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={cancelCompletion}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {!isEditing && !isCompleting && task.status === "pending" && (
                    <div className="flex gap-2 ml-8">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => startCompletion(task.id)}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAttempted(task.id)}
                      >
                        Attempted
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleIncomplete(task.id)}
                      >
                        Skip
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
