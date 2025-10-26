import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Settings, Save, Calendar, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface CoinRate {
  category: string;
  label: string;
  rate: number;
  description: string;
}

interface CoinSettingsProps {
  coinRates: Record<string, number>;
  onUpdateRates: (newRates: Record<string, number>) => void;
  isGoogleConnected: boolean;
  onToggleGoogleCalendar: () => void;
}

export function CoinSettings({ 
  coinRates, 
  onUpdateRates,
  isGoogleConnected,
  onToggleGoogleCalendar 
}: CoinSettingsProps) {
  const [rates, setRates] = useState(coinRates);

  const categoryConfig: CoinRate[] = [
    { category: "productive", label: "Productive", rate: rates.productive, description: "Work, studying, focused tasks" },
    { category: "learning", label: "Learning", rate: rates.learning, description: "Reading, courses, skill development" },
    { category: "exercise", label: "Exercise", rate: rates.exercise, description: "Physical activity and health" },
    { category: "social", label: "Social", rate: rates.social, description: "Meaningful connections and relationships" },
    { category: "hobbies", label: "Hobbies", rate: rates.hobbies || 20, description: "Creative activities, relaxation" },
    { category: "wasted", label: "Wasted Time", rate: rates.wasted, description: "Unproductive activities" },
  ];

  const handleRateChange = (category: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setRates(prev => ({ ...prev, [category]: numValue }));
    }
  };

  const handleSave = () => {
    onUpdateRates(rates);
    toast.success("Coin rates updated successfully!");
  };

  const handleReset = () => {
    const defaultRates = {
      productive: 50,
      learning: 50,
      exercise: 50,
      social: 30,
      hobbies: 20,
      wasted: -30,
    };
    setRates(defaultRates);
    onUpdateRates(defaultRates);
    toast.success("Coin rates reset to defaults!");
  };

  const handleGoogleConnect = () => {
    if (isGoogleConnected) {
      onToggleGoogleCalendar();
      toast.success("Disconnected from Google Calendar");
    } else {
      // Simulate OAuth flow
      toast.info("Redirecting to Google OAuth...");
      setTimeout(() => {
        onToggleGoogleCalendar();
        toast.success("Connected to Google Calendar!");
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Calendar Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to sync tasks automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isGoogleConnected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  {isGoogleConnected ? "Connected" : "Not Connected"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isGoogleConnected 
                    ? "Your tasks are synced with Google Calendar" 
                    : "Connect to sync your daily tasks"}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleGoogleConnect}
              variant={isGoogleConnected ? "outline" : "default"}
            >
              {isGoogleConnected ? "Disconnect" : "Connect Google"}
            </Button>
          </div>
          {isGoogleConnected && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Your tasks will automatically appear in the Tasks section and can be logged as completed activities.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coin Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Coin Value Settings
          </CardTitle>
          <CardDescription>
            Customize how many coins you earn or lose per hour for each activity category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {categoryConfig.map((config) => (
            <div key={config.category} className="space-y-2">
              <Label htmlFor={config.category}>{config.label}</Label>
              <p className="text-xs text-muted-foreground">{config.description}</p>
              <div className="flex items-center gap-2">
                <Input
                  id={config.category}
                  type="number"
                  value={rates[config.category]}
                  onChange={(e) => handleRateChange(config.category, e.target.value)}
                  className="max-w-[120px]"
                />
                <span className="text-sm text-muted-foreground">coins/hour</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset to Defaults
          </Button>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
