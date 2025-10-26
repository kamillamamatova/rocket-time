import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";

interface AuthPageProps {
  onLogin: (username: string) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginUsername || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    // Check if user exists in localStorage
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    
    if (!users[loginUsername]) {
      toast.error("Username not found. Please sign up first.");
      return;
    }

    if (users[loginUsername] !== loginPassword) {
      toast.error("Incorrect password");
      return;
    }

    toast.success(`Welcome back, ${loginUsername}!`);
    onLogin(loginUsername);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupUsername || !signupPassword || !signupConfirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Check if username already exists
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    
    if (users[signupUsername]) {
      toast.error("Username already exists");
      return;
    }

    // Save new user
    users[signupUsername] = signupPassword;
    localStorage.setItem("users", JSON.stringify(users));

    toast.success(`Account created! Welcome, ${signupUsername}!`);
    onLogin(signupUsername);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-orange-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">🪙 RocketTime Dashboard</h1>
          <p className="text-muted-foreground">
            Track your time, earn coins, achieve your goals!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Login to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      placeholder="Enter your username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      placeholder="Choose a username"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Choose a password (min 6 characters)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Demo app - Data is stored locally in your browser
        </p>
      </div>
    </div>
  );
}
