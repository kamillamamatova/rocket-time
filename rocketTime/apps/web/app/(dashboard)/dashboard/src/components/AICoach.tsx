import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Lightbulb, Send, User, Bot } from "lucide-react";

interface AICoachProps {
  wastedHours: number;
  goals: Array<{ name: string; targetHours: number; currentHours: number }>;
  timeByCategory: Array<{ category: string; hours: number }>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AICoach({ wastedHours, goals, timeByCategory }: AICoachProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Send initial greeting
    if (messages.length === 0) {
      const greeting: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Hi! I'm your AI Time Coach 🤖. I'm here to help you optimize your time and reach your goals. Ask me anything about your time usage, goals, or productivity tips!",
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    // Check for greetings
    if (msg.match(/\b(hi|hello|hey|greetings)\b/)) {
      return "Hello! How can I help you with your time management today?";
    }

    // Wasted time analysis
    if (msg.includes("wasted") || msg.includes("waste")) {
      if (wastedHours > 5) {
        return `You've spent ${wastedHours.toFixed(1)} hours on wasted activities this week. That's a loss of ${(wastedHours * 30).toFixed(0)} coins! I recommend:\n\n1. Identify your biggest time wasters\n2. Set boundaries (e.g., limit social media to 30 min/day)\n3. Redirect that time to your goals\n\nEven reducing wasted time by just 2 hours could earn you 100+ extra coins!`;
      } else if (wastedHours > 0) {
        return `You have ${wastedHours.toFixed(1)} hours of wasted time this week. That's pretty good! Keep being mindful of how you spend your time.`;
      } else {
        return "Great job! You haven't logged any wasted time this week. Keep up the excellent time management! 🌟";
      }
    }

    // Goal-related queries
    if (msg.includes("goal") || msg.includes("target")) {
      if (goals.length === 0) {
        return "You haven't set any goals yet. I recommend starting with 1-2 SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound). Head to the Goals tab to create one!";
      }
      
      let response = "Here's your goal progress:\n\n";
      goals.forEach((goal) => {
        const progress = (goal.currentHours / goal.targetHours) * 100;
        const remaining = goal.targetHours - goal.currentHours;
        response += `📌 **${goal.name}**: ${progress.toFixed(0)}% complete\n`;
        if (progress >= 100) {
          response += `   ✅ Completed! Great job!\n`;
        } else if (remaining > 0) {
          response += `   ⏰ ${remaining.toFixed(1)} hours remaining\n`;
        }
        response += "\n";
      });

      return response;
    }

    // Productivity tips
    if (msg.includes("tip") || msg.includes("advice") || msg.includes("suggest") || msg.includes("improve")) {
      const tips = [];
      
      const entertainment = timeByCategory.find((c) => c.category === "entertainment")?.hours || 0;
      const productive = timeByCategory.find((c) => c.category === "productive")?.hours || 0;
      const learning = timeByCategory.find((c) => c.category === "learning")?.hours || 0;
      const exercise = timeByCategory.find((c) => c.category === "exercise")?.hours || 0;

      if (entertainment > productive && productive > 0) {
        tips.push(`🎮 You're spending more time on entertainment (${entertainment.toFixed(1)}h) than productive work (${productive.toFixed(1)}h). Try the 80/20 rule: 80% productive, 20% fun.`);
      }

      if (learning < 5) {
        tips.push("📚 Invest at least 1 hour daily in learning. This compounds over time and pays massive dividends!");
      }

      if (exercise < 3) {
        tips.push("💪 Aim for 3-4 hours of exercise weekly. Better health = better productivity = more valuable time!");
      }

      if (wastedHours > 2) {
        tips.push(`⚠️ Reduce wasted time by ${Math.min(wastedHours, 2).toFixed(1)} hours and allocate it to your top priority goal.`);
      }

      if (tips.length === 0) {
        tips.push("🌟 Your time allocation looks balanced! Keep up the great work!");
        tips.push("💡 Pro tip: Try time-blocking your calendar to protect your most productive hours.");
      }

      return tips.join("\n\n");
    }

    // Entertainment balance
    if (msg.includes("entertainment") || msg.includes("fun") || msg.includes("relax")) {
      const entertainment = timeByCategory.find((c) => c.category === "entertainment")?.hours || 0;
      if (entertainment > 10) {
        return `You've logged ${entertainment.toFixed(1)} hours of entertainment this week. While rest is important, consider if 30% of this time (${(entertainment * 0.3).toFixed(1)}h) could be invested in skill development for higher long-term returns.`;
      } else if (entertainment > 0) {
        return `Your entertainment time (${entertainment.toFixed(1)}h) looks reasonable. Balance is key! Make sure you're also making progress on your goals.`;
      } else {
        return "You haven't logged any entertainment time. Don't forget to rest and recharge! All work and no play isn't sustainable.";
      }
    }

    // Time breakdown
    if (msg.includes("breakdown") || msg.includes("summary") || msg.includes("how") && msg.includes("time")) {
      if (timeByCategory.length === 0) {
        return "You haven't logged any time entries yet. Start tracking to see your time breakdown!";
      }

      let response = "Here's your time breakdown:\n\n";
      const total = timeByCategory.reduce((sum, c) => sum + c.hours, 0);
      
      timeByCategory.forEach((cat) => {
        const percentage = (cat.hours / total) * 100;
        response += `${cat.category}: ${cat.hours.toFixed(1)}h (${percentage.toFixed(0)}%)\n`;
      });

      return response;
    }

    // Default responses for common questions
    if (msg.includes("how") || msg.includes("what") || msg.includes("why")) {
      return "I can help you with:\n\n• Analyzing your wasted time\n• Tracking goal progress\n• Getting productivity tips\n• Understanding your time breakdown\n• Optimizing your schedule\n\nWhat would you like to know?";
    }

    // Fallback
    return "I'm here to help you optimize your time! You can ask me about:\n\n• Your goals and progress\n• Wasted time analysis\n• Productivity tips\n• Time breakdown by category\n• Ways to improve your schedule\n\nWhat would you like to explore?";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Generate AI response
    setTimeout(() => {
      const response = generateResponse(input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 500);

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Time Coach
        </CardTitle>
        <CardDescription>
          Chat with your personal AI coach for time management insights
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about your time management..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("How are my goals progressing?")}
          >
            Goal Progress
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Give me productivity tips")}
          >
            Get Tips
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Analyze my wasted time")}
          >
            Wasted Time
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
