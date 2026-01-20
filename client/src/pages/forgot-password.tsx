import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  GraduationCap,
  Mail,
  KeyRound
} from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const resetMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", {
        email: data.email,
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Password reset service is currently unavailable. Please try again later.");
      }
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Password reset failed");
      }
      return result;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Reset link sent!",
        description: "Check your email for password reset instructions.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    resetMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bS0yIDBjMCAxLjEwNS0uODk1IDItMiAycy0yLS44OTUtMi0yIC44OTUtMiAyLTIgMiAuODk1IDIgMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6" data-testid="brand-logo">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold">StudyMate</span>
            </div>
            <h1 className="text-4xl font-bold mb-4" data-testid="text-hero-title">
              Reset your<br />password
            </h1>
            <p className="text-lg text-white/80 max-w-md" data-testid="text-hero-description">
              Don't worry, it happens to the best of us. Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <div className="space-y-6 mt-8">
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl" data-testid="info-step-1">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Step 1: Enter your email</h3>
                <p className="text-sm text-white/70">We'll send you a secure reset link</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl" data-testid="info-step-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Step 2: Create new password</h3>
                <p className="text-sm text-white/70">Choose a strong, unique password</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl" data-testid="info-step-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Step 3: Get back to learning</h3>
                <p className="text-sm text-white/70">Sign in and continue your journey</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-900 dark:to-teal-950/30">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                StudyMate
              </span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white" data-testid="text-page-title">
              {isSuccess ? "Check your email" : "Forgot password?"}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400" data-testid="text-page-description">
              {isSuccess 
                ? "We've sent you a password reset link" 
                : "Enter your email to receive a reset link"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4" data-testid="success-icon">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6" data-testid="text-success-message">
                  If an account exists with that email, you'll receive password reset instructions shortly.
                </p>
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold transition-colors"
                  data-testid="link-back-to-login"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </a>
              </div>
            ) : (
              <>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300">
                            Email address
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="you@university.edu"
                              className="h-11 border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-teal-500"
                              data-testid="input-email"
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-teal-500/25 transition-all"
                      disabled={resetMutation.isPending}
                      data-testid="button-reset-password"
                    >
                      {resetMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending reset link...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send reset link
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                  Remember your password?{" "}
                  <a
                    href="/login"
                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold transition-colors inline-flex items-center gap-1"
                    data-testid="link-login"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Sign in
                  </a>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
