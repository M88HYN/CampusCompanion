/*
==========================================================
File: client/src/pages/profile.tsx

Module: Frontend Experience

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Presentation Layer (Frontend UI)

System Interaction:
- Consumes API endpoints via query/mutation utilities and renders user-facing interfaces
- Collaborates with shared types to preserve frontend-backend contract integrity

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

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
import { BarChart3, CheckCircle2, Cog, Loader2, Mail, Shield, User } from "lucide-react";

interface ProfileTweakSettings {
  phone: string;
  bio: string;
  profileVisibility: boolean;
  showStudyActivity: boolean;
}

/*
----------------------------------------------------------
Component: Profile

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- None: Operates using closure/module state only

Process:
1. Initializes local state and framework hooks required for rendering
2. Derives view data from props, query state, and computed conditions
3. Applies conditional rendering to keep the interface robust for empty/loading/error states
4. Binds event handlers and side effects to synchronize UI with backend/application state

Why Validation is Important:
State guards and defensive rendering prevent runtime errors, preserve UX continuity, and improve accessibility during asynchronous updates.

Returns:
A JSX tree representing the component view for the current state.
----------------------------------------------------------
*/
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
  const missingSignals = completenessChecks.length - completedCount;
  const saveDisabled =
    isDemoReadOnly ||
    isLoadingSettings ||
    saveMutation.isPending ||
    !hasChanges;

  return (
    <div className="route-transition mx-auto w-full max-w-6xl space-y-8 px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-9">
      <div className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-[0_16px_32px_-24px_hsl(var(--foreground)/0.9)] backdrop-blur-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Profile</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Keep your profile details current, control privacy preferences, and quickly access key account tools from one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDemoReadOnly ? <Badge variant="secondary">Demo Read-Only</Badge> : <Badge className="bg-emerald-600 text-white">Live Account</Badge>}
            {hasChanges ? <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300">Unsaved changes</Badge> : null}
          </div>
        </div>
      </div>

      <Card className="border border-border/70">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <Avatar className="h-20 w-20 border border-border shadow-sm sm:h-24 sm:w-24">
                <AvatarFallback className="text-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{fullName}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email || "No email available"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>User ID: {user?.id || "Unknown"}</span>
                </div>
              </div>
            </div>

            <div className="grid w-full max-w-md grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Profile health</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{completenessPercent}%</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/35 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{isDemoReadOnly ? "Read-only" : "Editable"}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-border/70 bg-muted/35 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Completion summary</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Completed {completedCount} of {completenessChecks.length} profile signals
                  {missingSignals > 0 ? ` (${missingSignals} remaining)` : ""}.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Account Tools
            </CardTitle>
            <CardDescription>
              Jump to the places you are most likely to use when managing your account and learning preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-between rounded-xl" variant="outline">
              <Link href="/settings">
                <span className="flex items-center">
                  <Cog className="mr-2 h-4 w-4" />
                  Open Settings
                </span>
                <span className="text-xs text-muted-foreground">Manage app preferences</span>
              </Link>
            </Button>
            <Button asChild className="w-full justify-between rounded-xl" variant="outline">
              <Link href="/insights">
                <span className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Learning Insights
                </span>
                <span className="text-xs text-muted-foreground">Track progress trends</span>
              </Link>
            </Button>

            <div className="rounded-xl border border-border/70 bg-muted/35 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Profile completeness</p>
                <Badge variant="secondary">{completenessPercent}%</Badge>
              </div>
              <Progress value={completenessPercent} className="h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                This score reflects profile basics, contact details, and sharing preferences.
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-card/70 p-3.5 text-sm">
              <div className="mb-2 flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="font-medium">Account snapshot</p>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center justify-between gap-4">
                  <span>Display name</span>
                  <span className="font-medium text-foreground text-right">{fullName}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span>Email</span>
                  <span className="font-medium text-foreground text-right break-all">{user?.email || "-"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span>Mode</span>
                  <span className="font-medium text-foreground text-right">
                    {isDemoReadOnly ? "Read-only demo" : "Authenticated"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Tweaks</CardTitle>
            <CardDescription>
              Edit your contact and visibility preferences here. Save when you are ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="rounded-xl border border-border/70 bg-muted/35 px-3.5 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Editing status</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {isLoadingSettings ? "Loading settings..." : hasChanges ? "You have unsaved changes" : "All changes saved"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isDemoReadOnly ? "Demo mode prevents changes from being stored." : "Use Save tweaks to apply updates."}
                </p>
              </div>
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

            <div className="rounded-xl border border-border/70 p-3.5 space-y-3">
              <p className="text-sm font-medium text-foreground">Privacy preferences</p>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">Public profile visibility</p>
                  <p className="text-xs text-muted-foreground">Show your profile to others.</p>
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
                  <p className="font-medium text-foreground">Show study activity</p>
                  <p className="text-xs text-muted-foreground">Allow study progress to appear on profile.</p>
                </div>
                <Switch
                  checked={formData.showStudyActivity}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, showStudyActivity: checked }))}
                  disabled={isDemoReadOnly || isLoadingSettings || saveMutation.isPending}
                  data-testid="switch-study-activity"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Button
                className="flex-1"
                disabled={saveDisabled}
                onClick={() => saveMutation.mutate(formData)}
                data-testid="button-save-profile-tweaks"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

            {isDemoReadOnly ? (
              <p className="text-xs text-muted-foreground">
                You are currently using a demo account, so updates can be previewed but are not persisted.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
