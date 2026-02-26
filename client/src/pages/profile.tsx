import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { BarChart3, Cog, Mail, Shield, User } from "lucide-react";

export default function Profile() {
  const { user, isDemoReadOnly } = useAuth();

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Student";
  const initials =
    (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            View your account identity and jump to account management tools.
          </p>
        </div>
        {isDemoReadOnly ? <Badge variant="secondary">Demo Read-Only</Badge> : null}
      </div>

      <Card className="border border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Avatar className="h-20 w-20 border border-slate-200 dark:border-slate-700">
              <AvatarFallback className="text-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{fullName}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Mail className="h-4 w-4" />
                <span>{user?.email || "No email available"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <User className="h-4 w-4" />
                <span>User ID: {user?.id || "Unknown"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Account Controls
            </CardTitle>
            <CardDescription>Manage profile details, preferences, and security settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/settings">
                <Cog className="h-4 w-4 mr-2" />
                Open Settings
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/insights">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Learning Insights
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
            <CardDescription>Current account context for this session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Display name</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{fullName}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Email</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{user?.email || "-"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Mode</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {isDemoReadOnly ? "Read-only demo" : "Authenticated"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
