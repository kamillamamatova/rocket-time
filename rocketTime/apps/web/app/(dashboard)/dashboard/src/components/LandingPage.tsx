import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Award, Clock, Coins, Lightbulb, Target, TrendingUp, Zap } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: Coins,
      title: "Coin-Based Rewards",
      description:
        "Earn coins for productive activities, track your time value, and see your efforts rewarded with a gamified currency system.",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description:
        "Set meaningful goals, link your time entries directly to them, and watch your progress grow as you invest hours wisely.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description:
        "Visualize your time investment with beautiful charts, track weekly trends, and understand where your hours really go.",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Lightbulb,
      title: "AI Coach",
      description:
        "Get personalized recommendations about time being wasted and discover better ways to fulfill your goals with AI-powered insights.",
      gradient: "from-blue-500 to-purple-500",
    },
    {
      icon: Clock,
      title: "Time Logging",
      description:
        "Easily log activities with customizable categories. Every hour tracked contributes to your coin balance and goal progress.",
      gradient: "from-green-500 to-teal-500",
    },
    {
      icon: Award,
      title: "Streaks & Habits",
      description:
        "Build consistency with daily streaks, maintain momentum with visual tracking, and celebrate your productive habits.",
      gradient: "from-pink-500 to-rose-500",
    },
  ];

  const stats = [
    { value: "+50", label: "Coins/Hour", description: "Productive Time" },
    { value: "+20", label: "Coins/Hour", description: "Entertainment" },
    { value: "-30", label: "Coins/Hour", description: "Wasted Time" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-orange-50 to-yellow-100">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🪙</span>
              <h2 className="text-xl">Rocket Time</h2>
            </div>
            <Button onClick={onGetStarted} size="lg">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-orange-500 px-4 py-2 text-white">
            <Zap className="h-4 w-4" />
            <span className="text-sm">Treat Time as Money</span>
          </div>

          <h1 className="text-5xl leading-tight md:text-6xl">
            Turn Your Time Into{" "}
            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent">
              Valuable Coins
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            A gamified goal-setting and time management dashboard that rewards productive activities,
            tracks your progress, and helps you achieve your dreams with an AI-powered coach.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6 text-lg hover:from-orange-600 hover:to-red-600"
              onClick={onGetStarted}
            >
              Start Earning Coins
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-12 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/90 backdrop-blur">
                <CardContent className="pt-6 text-center">
                  <div className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm font-medium">{stat.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{stat.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl">Powerful Features to Maximize Your Time</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to track, analyze, and optimize how you spend your most valuable
              resource.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="bg-white/90 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardHeader>
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient}`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl">How It Works</h2>
            <p className="text-xl text-muted-foreground">Get started in three simple steps</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl text-white">
                1
              </div>
              <h3 className="text-xl">Set Your Goals</h3>
              <p className="text-muted-foreground">
                Define what you want to achieve and set target hours for each goal.
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-2xl text-white">
                2
              </div>
              <h3 className="text-xl">Log Your Time</h3>
              <p className="text-muted-foreground">
                Track activities as you complete them, link them to goals, and earn coins.
              </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 text-2xl text-white">
                3
              </div>
              <h3 className="text-xl">Track & Optimize</h3>
              <p className="text-muted-foreground">
                Review analytics, get AI recommendations, and optimize your time investment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <Card className="mx-auto max-w-4xl border-0 bg-gradient-to-br from-purple-600 via-orange-500 to-red-500 text-white">
          <CardContent className="space-y-6 p-12 text-center">
            <h2 className="text-4xl">Ready to Value Your Time?</h2>
            <p className="mx-auto max-w-2xl text-xl opacity-90">
              Join Rocket Time today and start turning your hours into achievements. Track your
              progress, earn rewards, and achieve your goals with our gamified time management
              system.
            </p>
            <Button
              size="lg"
              className="bg-white px-8 py-6 text-lg text-purple-600 hover:bg-gray-100"
              onClick={onGetStarted}
            >
              <Coins className="mr-2 h-5 w-5" />
              Start Your Journey
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <span>Rocket Time Dashboard</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Rocket Time. Treat your time like money.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
