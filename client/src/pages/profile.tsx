import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Cog, Loader2, Mail, Shield, User } from "lucide-react";

interface ProfileTweakSettings {
  phone: string;
  bio: string;
  profileVisibility: boolean;
  showStudyActivity: boolean;
}

export default function Profile() {
  const { user, isDemoReadOnly } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ProfileTweakSettings>({
    phone: "",
    bio: "",
    profileVisibility: true,
    showStudyActivity: true,
  });
  const [initialFormData, setInitialFormData] = useState<ProfileTweakSettings>({
    phone: "",
    bio: "",
    profileVisibility: true,
    showStudyActivity: true,
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      return (await response.json()) as Partial<ProfileTweakSettings>;
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (!settings) return;
    const next: ProfileTweakSettings = {
      phone: settings.phone || "",
      bio: settings.bio || "",
      profileVisibility: settings.profileVisibility ?? true,
      showStudyActivity: settings.showStudyActivity ?? true,
    };
    setFormData(next);
    setInitialFormData(next);
  }, [settings]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData],
  );

  const saveMutation = useMutation({
    mutationFn: async (updates: ProfileTweakSettings) => {
      const response = await apiRequest("PATCH", "/api/settings", updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setInitialFormData(formData);
      toast({
        title: "Profile tweaks saved",
        description: "Your quick profile preferences were updated.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Could not save profile tweaks.",
        variant: "destructive",
      });
    },
  });

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Student";
  const initials =
    (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const completenessChecks = [
    Boolean(user?.firstName || user?.lastName),
    Boolean(user?.email),
    Boolean(formData.phone?.trim()),
    Boolean(formData.bio?.trim()),
    formData.profileVisibility,
    formData.showStudyActivity,
  ];
  const completedCount = completenessChecks.filter(Boolean).length;
  const completenessPercent = Math.round((completedCount / completenessChecks.length) * 100);

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
            <CardTitle>Quick Tweaks</CardTitle>
            <CardDescription>Tune profile visibility and contact details without leaving this page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Profile completeness</p>
                <Badge variant="secondary">{completenessPercent}%</Badge>
              </div>
              <Progress value={completenessPercent} className="h-2" />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Completed {completedCount} of {completenessChecks.length} profile signals.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Optional phone number"
                disabled={isDemoReadOnly || isLoadingSettings || saveMutation.isPending}
                data-testid="input-profile-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                value={formData.bio}
                onChange={(event) => setFormData((prev) => ({ ...prev, bio: event.target.value }))}
                placeholder="Tell us a bit about your learning focus"
                disabled={isDemoReadOnly || isLoadingSettings || saveMutation.isPending}
                data-testid="textarea-profile-bio"
              />
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Public profile visibility</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Show your profile to others.</p>
                </div>
                <Switch
                  checked={formData.profileVisibility}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, profileVisibility: checked }))}
                  disabled={isDemoReadOnly || isLoadingSettings || saveMutation.isPending}
                  data-testid="switch-profile-visibility"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Show study activity</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Allow study progress to appear on profile.</p>
                </div>
                <Switch
                  checked={formData.showStudyActivity}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, showStudyActivity: checked }))}
                  disabled={isDemoReadOnly || isLoadingSettings || saveMutation.isPending}
                  data-testid="switch-study-activity"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={
                  isDemoReadOnly ||
                  isLoadingSettings ||
                  saveMutation.isPending ||
                  !hasChanges
                }
                onClick={() => saveMutation.mutate(formData)}
                data-testid="button-save-profile-tweaks"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save tweaks"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setFormData(initialFormData)}
                disabled={saveMutation.isPending || !hasChanges}
                data-testid="button-reset-profile-tweaks"
              >
                Reset
              </Button>
            </div>

            <Separator />
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
