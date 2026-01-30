import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Brain, 
  Sparkles, 
  Target,
  GraduationCap,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  console.log("[login.tsx] Login page rendering");
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if we have auth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const err = params.get("error");

    if (err) {
      setError(`OAuth error: ${err}`);
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
      window.dispatchEvent(new CustomEvent("auth-update"));
      // Clear URL and redirect
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    }
  }, [setLocation]);

  const features = [
    { icon: Brain, label: "Smart Flashcards", desc: "AI-powered spaced repetition" },
    { icon: Target, label: "Adaptive Quizzes", desc: "Adjusts to your level" },
    { icon: Sparkles, label: "Insight Scout", desc: "AI research assistant" },
    { icon: BookOpen, label: "Study Materials", desc: "Auto-generated notes" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { emailOrUsername: email, password }
        : { username, email, password, firstName, lastName };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Authentication failed");
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem("token", data.token);
      
      // Trigger auth update event
      window.dispatchEvent(new CustomEvent("auth-update"));
      
      // Redirect to dashboard
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = "/api/auth/google";
  };

  const handleGithubLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = "/api/auth/github";
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bS0yIDBjMCAxLjEwNS0uODk1IDItMiAycy0yLS44OTUtMi0yIC44OTUtMiAyLTIgMiAuODk1IDIgMzoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold">StudyMate</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Your intelligent study companion</h1>
            <p className="text-lg text-white/80 max-w-md">Join thousands of students achieving their academic goals with personalized learning powered by AI.</p>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.label}</h3>
                  <p className="text-sm text-white/70">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-900 dark:to-teal-950/30">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">StudyMate</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-base">{isLogin ? "Sign in to your account" : "Sign up to get started"}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" required />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11" required />
                    <Input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11" required />
                  </div>
                </>
              )}
              <Input type={isLogin ? "text" : "email"} placeholder={isLogin ? "Email or Username" : "Email address"} value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
              <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold">
                {loading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-slate-900/80 text-slate-500">Or continue with</span></div>
            </div>

            <div className="space-y-3">
              <Button 
                type="button" 
                onClick={handleGoogleLogin}
                disabled={loading}
                variant="outline" 
                className="w-full h-11"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "Loading..." : "Google"}
              </Button>
              <Button 
                type="button" 
                onClick={handleGithubLogin}
                disabled={loading}
                variant="outline" 
                className="w-full h-11"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                {loading ? "Loading..." : "GitHub"}
              </Button>
            </div>

            <div className="text-center text-sm text-slate-600 dark:text-slate-400">
              {isLogin ? (
                <>Don't have an account? <button type="button" onClick={() => setIsLogin(false)} className="text-teal-600 hover:text-teal-700 font-semibold">Sign up</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => setIsLogin(true)} className="text-teal-600 hover:text-teal-700 font-semibold">Sign in</button></>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
