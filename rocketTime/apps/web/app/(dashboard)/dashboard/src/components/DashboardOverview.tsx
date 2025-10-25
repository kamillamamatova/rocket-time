import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, TrendingDown, Coins, Target } from "lucide-react";
import { Badge } from "./ui/badge";

interface OverviewProps {
  totalCoinsToday: number;
  coinBalance: number;
}

export function DashboardOverview({
  totalCoinsToday,
  coinBalance,
}: OverviewProps) {

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-orange-900">Today's Coins</CardTitle>
          <Coins className="h-5 w-5 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${totalCoinsToday >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
              🪙 {totalCoinsToday.toFixed(0)}
            </span>
          </div>
          <p className="text-xs mt-1">
            {totalCoinsToday > 0 ? (
              <span className="flex items-center gap-1 text-green-700 font-medium">
                <TrendingUp className="h-3 w-3" />
                Earning coins!
              </span>
            ) : totalCoinsToday < 0 ? (
              <span className="flex items-center gap-1 text-red-700 font-medium">
                <TrendingDown className="h-3 w-3" />
                Losing coins
              </span>
            ) : (
              <span className="text-orange-700">No time logged today</span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-purple-900">Total Coins</CardTitle>
          <Target className="h-5 w-5 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${coinBalance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              🪙 {coinBalance.toFixed(0)}
            </span>
            {coinBalance >= 0 ? (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                {coinBalance > 0 ? 'Positive' : 'Neutral'}
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 border-red-300">
                Overdue Penalty
              </Badge>
            )}
          </div>
          <p className="text-xs mt-1">
            {coinBalance >= 0 ? (
              <span className="flex items-center gap-1 text-green-700 font-medium">
                <TrendingUp className="h-3 w-3" />
                {coinBalance > 0 ? 'Keep earning!' : 'Start logging time'}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-700 font-medium">
                <TrendingDown className="h-3 w-3" />
                Overdue goals penalty
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
