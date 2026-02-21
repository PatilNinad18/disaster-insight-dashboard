import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { login } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: "Enter username or phone and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      if (user) {
        setUser(user);
        toast({ title: `Welcome, ${user.name}` });
        if (user.role === "admin") {
          navigate("/alerts", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        toast({ title: "Invalid username, phone or password", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Shield className="h-12 w-12 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">SentinelX</CardTitle>
          <CardDescription>Disaster Early Warning &amp; Alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username or phone number</Label>
              <Input
                id="username"
                placeholder="admin, user, or +91 9876500001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-orange-600 font-medium hover:underline">
              Register
            </Link>
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Demo: admin / admin · user / user
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
