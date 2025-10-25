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
        content: "Hello! I'm your AI Time Strategist 🎯. Think of me as your personal time investment advisor. I'll help you plan your time allocation, suggest optimal strategies for reaching your goals, and advise on making the best ROI from your hours. How can I help you strategize today?",
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
      return "Hello! I'm here to help you strategically plan and optimize your time investments. What would you like to focus on today?";
    }

    // Planning and strategy queries
    if (msg.includes("plan") || msg.includes("strategy") || msg.includes("schedule")) {
      const productive = timeByCategory.find((c) => c.category === "productive")?.hours || 0;
      const learning = timeByCategory.find((c) => c.category === "learning")?.hours || 0;
      
      return `Let me help you develop a strategic time allocation plan:\n\n**Current Portfolio:**\n• Productive work: ${productive.toFixed(1)}h\n• Learning: ${learning.toFixed(1)}h\n\n**Recommended Strategy:**\n1. Allocate 4-6 hours daily to high-ROI productive work\n2. Invest 1-2 hours in learning (compounding returns)\n3. Reserve 3-4 hours weekly for physical capital (exercise)\n4. Budget entertainment time as "dividends" (earned after hitting targets)\n\nWould you like me to create a custom allocation plan based on your specific goals?`;
    }

    // Wasted time analysis
    if (msg.includes("wasted") || msg.includes("waste") || msg.includes("loss")) {
      if (wastedHours > 5) {
        return `**Time Capital Analysis:**\n\nYou've incurred a loss of ${wastedHours.toFixed(1)} hours (${(wastedHours * 30).toFixed(0)} coins) in wasted activities this week.\n\n**Recovery Strategy:**\n1. Audit your time drains - what are the top 3 wasters?\n2. Implement time boundaries (e.g., 30-min caps on low-value activities)\n3. Reallocate those hours to your highest-ROI goals\n\n**Potential Gains:** Recovering just 50% of wasted time = ${((wastedHours * 0.5) * 50).toFixed(0)} additional coins!\n\nShould I help you create a reallocation plan?`;
      } else if (wastedHours > 0) {
        return `Minimal time losses detected (${wastedHours.toFixed(1)}h). Your capital preservation strategy is working well. Maintain this discipline!`;
      } else {
        return "Excellent capital preservation! Zero time losses this week. You're maximizing your time ROI. 📈";
      }
    }

    // Goal-related queries
    if (msg.includes("goal") || msg.includes("target") || msg.includes("progress")) {
      if (goals.length === 0) {
        return "**Portfolio Alert:** You haven't established any time investment goals yet.\n\n**Recommendation:** Set 2-3 strategic goals across different categories (productive, learning, exercise) to diversify your time portfolio. Each goal should have:\n\n• Specific target (hours/week)\n• Clear ROI (what you'll gain)\n• Deadline for accountability\n\nHead to the Goals tab to build your investment portfolio!";
      }
      
      let response = "**Investment Portfolio Status:**\n\n";
      goals.forEach((goal) => {
        const progress = (goal.currentHours / goal.targetHours) * 100;
        const remaining = goal.targetHours - goal.currentHours;
        const onTrack = progress >= 70;
        
        response += `📊 **${goal.name}**\n`;
        response += `   Progress: ${progress.toFixed(0)}% ${onTrack ? '✅' : '⚠️'}\n`;
        if (progress >= 100) {
          response += `   Status: TARGET ACHIEVED! 🎯\n`;
        } else if (remaining > 0) {
          response += `   Needed: ${remaining.toFixed(1)} hours\n`;
          response += `   Recommendation: ${onTrack ? 'Maintain pace' : 'Increase allocation'}\n`;
        }
        response += "\n";
      });

      return response;
    }

    // Productivity tips and optimization
    if (msg.includes("tip") || msg.includes("advice") || msg.includes("suggest") || msg.includes("improve") || msg.includes("optimize")) {
      const recommendations = [];
      
      const hobbies = timeByCategory.find((c) => c.category === "hobbies")?.hours || 0;
      const productive = timeByCategory.find((c) => c.category === "productive")?.hours || 0;
      const learning = timeByCategory.find((c) => c.category === "learning")?.hours || 0;
      const exercise = timeByCategory.find((c) => c.category === "exercise")?.hours || 0;

      recommendations.push("**Strategic Optimization Plan:**\n");

      if (hobbies > productive && productive > 0) {
        recommendations.push(`⚖️ **Portfolio Rebalancing Needed**\nHobbies: ${hobbies.toFixed(1)}h vs Productive: ${productive.toFixed(1)}h\nRecommendation: Shift to 75/25 ratio (productive/hobbies) for optimal returns.`);
      }

      if (learning < 7) {
        recommendations.push(`📚 **Learning Investment Opportunity**\nCurrent: ${learning.toFixed(1)}h/week\nTarget: 7-10h/week (1-1.5h daily)\nExpected ROI: Compounding skill growth, higher earning potential`);
      }

      if (exercise < 3) {
        recommendations.push(`💪 **Physical Capital Deficiency**\nCurrent: ${exercise.toFixed(1)}h/week\nMinimum: 3-4h/week\nWhy: Health is your foundation asset - poor health = reduced productive capacity`);
      }

      if (wastedHours > 2) {
        recommendations.push(`🚨 **Capital Preservation Alert**\nLosses: ${wastedHours.toFixed(1)}h (${(wastedHours * 30).toFixed(0)} coins)\nAction: Reduce by 50% and reinvest in top-priority goals\nPotential gain: +${((wastedHours * 0.5) * 50).toFixed(0)} coins`);
      }

      if (recommendations.length === 1) {
        recommendations.push("✅ **Portfolio Status: Optimized**\nYour time allocation is well-balanced!");
        recommendations.push("💡 **Advanced Strategy:** Implement time-blocking to protect high-value hours from interruptions.");
      }

      return recommendations.join("\n\n");
    }

    // Hobbies/recreation balance
    if (msg.includes("hobbies") || msg.includes("fun") || msg.includes("relax") || msg.includes("recreation")) {
      const hobbies = timeByCategory.find((c) => c.category === "hobbies")?.hours || 0;
      if (hobbies > 10) {
        return `**Recreation Analysis:**\n\nCurrent allocation: ${hobbies.toFixed(1)}h/week\n\nWhile downtime is essential for sustainability, consider this reallocation strategy:\n\n• Keep: ${(hobbies * 0.7).toFixed(1)}h for recovery\n• Redirect: ${(hobbies * 0.3).toFixed(1)}h to skill development\n\nResult: Maintain work-life balance while increasing long-term returns.`;
      } else if (hobbies > 0) {
        return `Recreation time: ${hobbies.toFixed(1)}h - Well balanced! You're maintaining sustainable productivity. This is your "dividend" for investing in your goals.`;
      } else {
        return "⚠️ **Sustainability Alert:** No recovery time logged. Burnout risk detected. Schedule 3-5h/week of hobbies to maintain long-term productivity capacity.";
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
      return "**Strategic Services Available:**\n\n• 📊 Portfolio Analysis (goal progress & ROI)\n• 🎯 Investment Strategy Planning\n• ⚖️ Time Allocation Optimization\n• 💰 Capital Preservation (reducing losses)\n• 📈 Growth Recommendations\n\nWhat would you like me to help you strategize?";
    }

    // Fallback
    return "I'm your Time Investment Strategist. Think of your time as capital that needs strategic allocation for maximum ROI.\n\n**I can help you:**\n• Develop investment strategies for your goals\n• Analyze your time portfolio\n• Identify optimization opportunities\n• Create reallocation plans\n• Maximize your time ROI\n\nWhat strategic guidance can I provide today?";
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
          AI Time Strategist
        </CardTitle>
        <CardDescription>
          Your personal time investment advisor for strategic planning and optimization
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
            placeholder="Ask me about strategy, planning, or optimization..."
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
            onClick={() => setInput("Analyze my investment portfolio")}
          >
            Portfolio Analysis
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Create an optimization strategy")}
          >
            Optimize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Help me plan my time allocation")}
          >
            Strategic Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
