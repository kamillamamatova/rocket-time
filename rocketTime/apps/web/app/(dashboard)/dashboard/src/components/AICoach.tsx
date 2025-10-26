import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Lightbulb, Send, User, Bot } from "lucide-react";

const API_URL = 'http://localhost:3001';

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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userInput = input;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Add loading message
    const loadingMessage: Message = {
      id: "loading",
      role: "assistant",
      content: "Thinking...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Call backend API
      const response = await fetch(`${API_URL}/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: userInput }),
      });

      // Remove loading message
      setMessages((prev) => prev.filter(msg => msg.id !== "loading"));

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Add AI response from backend
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "I'm here to help you manage your time and tasks! How can I assist you today?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove loading message
      setMessages((prev) => prev.filter(msg => msg.id !== "loading"));

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I couldn't connect to the AI service. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
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
