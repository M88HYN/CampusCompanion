import { useState, useEffect } from "react";
import { User, Mail, Lock, Bell, Eye, EyeOff, Save, LogOut, Shield, Globe, Sparkles, Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SettingsTab = "account" | "privacy" | "notifications" | "security" | "insight-scout";

interface UserPreferences {
  id?: string;
  userId?: string;
  phone?: string;
  bio?: string;
  language: string;
  timezone: string;
  profileVisibility: boolean;
  showStudyActivity: boolean;
  shareQuizResults: boolean;
  quizReminders: boolean;
  flashcardReminders: boolean;
  weeklyDigest: boolean;
  newFeatures: boolean;
  marketing: boolean;
  aiModel: string;
  searchDepth: string;
  citationFormat: string;
  responseTone: string;
  includeExamples: boolean;
  includeSources: boolean;
  maxResults: string;
  queryHistory: boolean;
  autoSave: boolean;
  researchSummary: boolean;
  webSearch: boolean;
  academicDatabases: boolean;
  enhancedAnalysis: boolean;
  multiLanguageSupport: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      return (await response.json()) as UserPreferences;
    },
    staleTime: 30000,
  });

  // Local form state
  const [formData, setFormData] = useState({
    phone: "",
    bio: "",
    language: "en",
    timezone: "america/new_york",
  });

  const [notificationsState, setNotificationsState] = useState({
    quizReminders: true,
    flashcardReminders: true,
    weeklyDigest: true,
    newFeatures: false,
    marketing: false,
  });

  const [insightScoutState, setInsightScoutState] = useState({
    aiModel: "gpt-4",
    searchDepth: "comprehensive",
    citationFormat: "apa",
    responseTone: "academic",
    includeExamples: true,
    includeSources: true,
    maxResults: "10",
    queryHistory: true,
    autoSave: true,
    researchSummary: true,
    webSearch: true,
    academicDatabases: true,
    enhancedAnalysis: true,
    multiLanguageSupport: false,
  });

  const [privacyState, setPrivacyState] = useState({
    profileVisibility: true,
    showStudyActivity: true,
    shareQuizResults: true,
  });

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        phone: preferences.phone || "",
        bio: preferences.bio || "",
        language: preferences.language || "en",
        timezone: preferences.timezone || "america/new_york",
      });

      setNotificationsState({
        quizReminders: preferences.quizReminders ?? true,
        flashcardReminders: preferences.flashcardReminders ?? true,
        weeklyDigest: preferences.weeklyDigest ?? true,
        newFeatures: preferences.newFeatures ?? false,
        marketing: preferences.marketing ?? false,
      });

      setInsightScoutState({
        aiModel: preferences.aiModel || "gpt-4",
        searchDepth: preferences.searchDepth || "comprehensive",
        citationFormat: preferences.citationFormat || "apa",
        responseTone: preferences.responseTone || "academic",
        includeExamples: preferences.includeExamples ?? true,
        includeSources: preferences.includeSources ?? true,
        maxResults: preferences.maxResults || "10",
        queryHistory: preferences.queryHistory ?? true,
        autoSave: preferences.autoSave ?? true,
        researchSummary: preferences.researchSummary ?? true,
        webSearch: preferences.webSearch ?? true,
        academicDatabases: preferences.academicDatabases ?? true,
        enhancedAnalysis: preferences.enhancedAnalysis ?? true,
        multiLanguageSupport: preferences.multiLanguageSupport ?? false,
      });

      setPrivacyState({
        profileVisibility: preferences.profileVisibility ?? true,
        showStudyActivity: preferences.showStudyActivity ?? true,
        shareQuizResults: preferences.shareQuizResults ?? true,
      });
    }
  }, [preferences]);

  // Update mutation - connects all buttons to backend
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const response = await apiRequest("PATCH", "/api/settings", updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Settings update error:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (key: keyof typeof notificationsState) => {
    setNotificationsState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInsightScoutChange = (key: keyof typeof insightScoutState, value: any) => {
    setInsightScoutState(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: keyof typeof privacyState) => {
    setPrivacyState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = async () => {
    await updateMutation.mutateAsync(formData);
  };

  const handleSaveNotifications = async () => {
    await updateMutation.mutateAsync(notificationsState);
  };

  const handleSavePrivacy = async () => {
    await updateMutation.mutateAsync(privacyState);
  };

  const handleSaveInsightScout = async () => {
    await updateMutation.mutateAsync(insightScoutState);
  };

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Settings</h1>
          <p className="text-lg opacity-90 max-w-2xl">Customize your StudyMate experience and manage your account</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="border-2 border-purple-200 dark:border-purple-800 sticky top-6">
                <CardContent className="p-0">
                  <nav className="flex flex-col">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-3 px-4 py-3 text-left transition-all border-l-4 ${
                            isActive
                              ? "border-l-purple-500 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold"
                              : "border-l-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                          data-testid={`button-settings-${tab.id}`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Account Settings */}
              {activeTab === "account" && (
                <div className="space-y-6">
                  {/* Profile Picture */}
                  <Card className="border-2 border-purple-200 dark:border-purple-800">
                    <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                      <CardTitle>Profile Picture</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 border-4 border-purple-300 dark:border-purple-700">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white text-2xl font-bold">
                            {formData.bio ? formData.bio.charAt(0).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">JPG, PNG or GIF (max 5MB)</p>
                          <Button className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white">
                            Upload New Picture
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Personal Information */}
                  <Card className="border-2 border-purple-200 dark:border-purple-800">
                    <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your basic information</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="font-semibold">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="border-2 border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500"
                          data-testid="input-phone"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio" className="font-semibold">Bio</Label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          className="w-full p-3 border-2 border-purple-200 dark:border-purple-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          rows={4}
                          placeholder="Tell us about yourself..."
                          data-testid="textarea-bio"
                        />
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white disabled:opacity-50" 
                        data-testid="button-save-profile"
                        onClick={handleSaveProfile}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Preferences */}
                  <Card className="border-2 border-purple-200 dark:border-purple-800">
                    <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                      <CardTitle>Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="language" className="font-semibold">Language</Label>
                        <Select value={formData.language} onValueChange={(value) => handleSelectChange("language", value)}>
                          <SelectTrigger className="border-2 border-purple-200 dark:border-purple-800" data-testid="select-language">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="zh">中文</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="font-semibold">Timezone</Label>
                        <Select value={formData.timezone} onValueChange={(value) => handleSelectChange("timezone", value)}>
                          <SelectTrigger className="border-2 border-purple-200 dark:border-purple-800" data-testid="select-timezone">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="america/new_york">America/New York (EST)</SelectItem>
                            <SelectItem value="america/chicago">America/Chicago (CST)</SelectItem>
                            <SelectItem value="america/denver">America/Denver (MST)</SelectItem>
                            <SelectItem value="america/los_angeles">America/Los Angeles (PST)</SelectItem>
                            <SelectItem value="europe/london">Europe/London (GMT)</SelectItem>
                            <SelectItem value="europe/paris">Europe/Paris (CET)</SelectItem>
                            <SelectItem value="asia/tokyo">Asia/Tokyo (JST)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white disabled:opacity-50" 
                        onClick={handleSaveProfile}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === "privacy" && (
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>Control who can see your information</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                        <div>
                          <p className="font-semibold">Profile Visibility</p>
                          <p className="text-sm text-muted-foreground">Let other students see your profile</p>
                        </div>
                        <Switch 
                          checked={privacyState.profileVisibility}
                          onCheckedChange={() => handlePrivacyChange("profileVisibility")}
                          data-testid="switch-profile-visibility" 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                        <div>
                          <p className="font-semibold">Show Study Activity</p>
                          <p className="text-sm text-muted-foreground">Display your study stats on leaderboards</p>
                        </div>
                        <Switch 
                          checked={privacyState.showStudyActivity}
                          onCheckedChange={() => handlePrivacyChange("showStudyActivity")}
                          data-testid="switch-study-activity" 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                        <div>
                          <p className="font-semibold">Share Quiz Results</p>
                          <p className="text-sm text-muted-foreground">Allow instructors to see your quiz performance</p>
                        </div>
                        <Switch 
                          checked={privacyState.shareQuizResults}
                          onCheckedChange={() => handlePrivacyChange("shareQuizResults")}
                          data-testid="switch-quiz-results" 
                        />
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white disabled:opacity-50 mt-6"
                        onClick={handleSavePrivacy}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {updateMutation.isPending ? "Saving..." : "Save Privacy Settings"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950">
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Quiz Reminders</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Remind me about upcoming quizzes</p>
                      </div>
                      <Switch
                        checked={notificationsState.quizReminders}
                        onCheckedChange={() => handleNotificationChange("quizReminders")}
                        data-testid="switch-quiz-reminders"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950">
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100">Flashcard Reminders</p>
                        <p className="text-sm text-green-700 dark:text-green-300">Daily spaced repetition reminders</p>
                      </div>
                      <Switch
                        checked={notificationsState.flashcardReminders}
                        onCheckedChange={() => handleNotificationChange("flashcardReminders")}
                        data-testid="switch-flashcard-reminders"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-950">
                      <div>
                        <p className="font-semibold text-purple-900 dark:text-purple-100">Weekly Digest</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">Summary of your study progress</p>
                      </div>
                      <Switch
                        checked={notificationsState.weeklyDigest}
                        onCheckedChange={() => handleNotificationChange("weeklyDigest")}
                        data-testid="switch-weekly-digest"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p className="font-semibold">New Features</p>
                        <p className="text-sm text-muted-foreground">Be notified about new features and updates</p>
                      </div>
                      <Switch
                        checked={notificationsState.newFeatures}
                        onCheckedChange={() => handleNotificationChange("newFeatures")}
                        data-testid="switch-new-features"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p className="font-semibold">Marketing Emails</p>
                        <p className="text-sm text-muted-foreground">Promotional content and special offers</p>
                      </div>
                      <Switch
                        checked={notificationsState.marketing}
                        onCheckedChange={() => handleNotificationChange("marketing")}
                        data-testid="switch-marketing"
                      />
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white disabled:opacity-50 mt-6"
                      onClick={handleSaveNotifications}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      {updateMutation.isPending ? "Saving..." : "Save Notification Settings"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Password */}
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password regularly for security</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="font-semibold">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your current password"
                          className="border-2 border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500 pr-10"
                          data-testid="input-current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="font-semibold">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter a new password"
                        className="border-2 border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500"
                        data-testid="input-new-password"
                      />
                      <p className="text-xs text-muted-foreground">At least 8 characters with uppercase, lowercase, and numbers</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="font-semibold">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your new password"
                        className="border-2 border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500"
                        data-testid="input-confirm-password"
                      />
                    </div>

                    <Button className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white" data-testid="button-change-password">
                      <Lock className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  </CardContent>
                </Card>

                {/* Two-Factor Authentication */}
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>Add an extra layer of security to your account</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Status</p>
                        <Badge className="bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-0 mt-2">
                          Not Enabled
                        </Badge>
                      </div>
                      <Button className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white" data-testid="button-enable-2fa">
                        Enable 2FA
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-violet-900">
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Manage your active sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <div className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">Chrome on macOS</p>
                        <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-0">Current</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Last active: Just now</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                  <CardHeader>
                    <CardTitle className="text-red-700 dark:text-red-300">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-500 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                      data-testid="button-delete-account"
                    >
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Insight Scout Settings */}
            {activeTab === "insight-scout" && (
              <div className="space-y-6">
                {/* AI Model Configuration */}
                <Card className="border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      AI Model Configuration
                    </CardTitle>
                    <CardDescription>Choose your AI model and performance settings</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="ai-model" className="font-semibold">AI Model</Label>
                      <Select value={insightScoutState.aiModel} onValueChange={(value) => handleInsightScoutChange("aiModel", value)}>
                        <SelectTrigger className="border-2 border-orange-200 dark:border-orange-800" data-testid="select-ai-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4 (Most Powerful)</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Fast & Powerful)</SelectItem>
                          <SelectItem value="gpt-3.5">GPT-3.5 Turbo (Fast)</SelectItem>
                          <SelectItem value="claude-3">Claude 3 (Alternative)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">GPT-4 provides the most accurate results but uses more credits</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="search-depth" className="font-semibold">Search Depth</Label>
                      <Select value={insightScoutState.searchDepth} onValueChange={(value) => handleInsightScoutChange("searchDepth", value)}>
                        <SelectTrigger className="border-2 border-orange-200 dark:border-orange-800" data-testid="select-search-depth">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quick">Quick (1-2 sources)</SelectItem>
                          <SelectItem value="standard">Standard (3-5 sources)</SelectItem>
                          <SelectItem value="comprehensive">Comprehensive (6-10 sources)</SelectItem>
                          <SelectItem value="exhaustive">Exhaustive (10+ sources)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Deeper searches provide more thorough research but take longer</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-results" className="font-semibold">Maximum Results Per Query</Label>
                      <Select value={insightScoutState.maxResults} onValueChange={(value) => handleInsightScoutChange("maxResults", value)}>
                        <SelectTrigger className="border-2 border-orange-200 dark:border-orange-800" data-testid="select-max-results">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Results</SelectItem>
                          <SelectItem value="10">10 Results</SelectItem>
                          <SelectItem value="20">20 Results</SelectItem>
                          <SelectItem value="50">50 Results</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Research Preferences */}
                <Card className="border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900">
                    <CardTitle>Research Preferences</CardTitle>
                    <CardDescription>Customize how Insight Scout delivers research</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="response-tone" className="font-semibold">Response Tone</Label>
                      <Select value={insightScoutState.responseTone} onValueChange={(value) => handleInsightScoutChange("responseTone", value)}>
                        <SelectTrigger className="border-2 border-orange-200 dark:border-orange-800" data-testid="select-response-tone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="academic">Academic (Formal & Professional)</SelectItem>
                          <SelectItem value="conversational">Conversational (Friendly & Casual)</SelectItem>
                          <SelectItem value="technical">Technical (In-depth & Precise)</SelectItem>
                          <SelectItem value="simplified">Simplified (Easy to Understand)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="citation-format" className="font-semibold">Citation Format</Label>
                      <Select value={insightScoutState.citationFormat} onValueChange={(value) => handleInsightScoutChange("citationFormat", value)}>
                        <SelectTrigger className="border-2 border-orange-200 dark:border-orange-800" data-testid="select-citation-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apa">APA (American Psychological Association)</SelectItem>
                          <SelectItem value="mla">MLA (Modern Language Association)</SelectItem>
                          <SelectItem value="chicago">Chicago/Turabian</SelectItem>
                          <SelectItem value="harvard">Harvard</SelectItem>
                          <SelectItem value="ieee">IEEE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p className="font-semibold">Include Examples</p>
                        <p className="text-sm text-muted-foreground">Add real-world examples to explanations</p>
                      </div>
                      <Switch
                        checked={insightScoutState.includeExamples}
                        onCheckedChange={(value) => handleInsightScoutChange("includeExamples", value)}
                        data-testid="switch-include-examples"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p className="font-semibold">Include Sources</p>
                        <p className="text-sm text-muted-foreground">Display source citations and references</p>
                      </div>
                      <Switch
                        checked={insightScoutState.includeSources}
                        onCheckedChange={(value) => handleInsightScoutChange("includeSources", value)}
                        data-testid="switch-include-sources"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p className="font-semibold">Research Summary</p>
                        <p className="text-sm text-muted-foreground">Auto-generate summary of findings</p>
                      </div>
                      <Switch
                        checked={insightScoutState.researchSummary}
                        onCheckedChange={(value) => handleInsightScoutChange("researchSummary", value)}
                        data-testid="switch-research-summary"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Data Sources */}
                <Card className="border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900">
                    <CardTitle>Data Sources</CardTitle>
                    <CardDescription>Choose which sources to search</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950">
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Web Search</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">General web search results</p>
                      </div>
                      <Switch
                        checked={insightScoutState.webSearch}
                        onCheckedChange={(value) => handleInsightScoutChange("webSearch", value)}
                        data-testid="switch-web-search"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-950">
                      <div>
                        <p className="font-semibold text-purple-900 dark:text-purple-100">Academic Databases</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">Access to academic journals and papers</p>
                      </div>
                      <Switch
                        checked={insightScoutState.academicDatabases}
                        onCheckedChange={(value) => handleInsightScoutChange("academicDatabases", value)}
                        data-testid="switch-academic-databases"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p className="font-semibold">Multi-language Support</p>
                        <p className="text-sm text-muted-foreground">Search across multiple languages</p>
                      </div>
                      <Switch
                        checked={insightScoutState.multiLanguageSupport}
                        onCheckedChange={(value) => handleInsightScoutChange("multiLanguageSupport", value)}
                        data-testid="switch-multi-language"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Features */}
                <Card className="border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900">
                    <CardTitle>Advanced Features</CardTitle>
                    <CardDescription>Enable premium research capabilities</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p className="font-semibold">Enhanced Analysis</p>
                        <p className="text-sm text-muted-foreground">AI-powered analysis and insights</p>
                      </div>
                      <Switch
                        checked={insightScoutState.enhancedAnalysis}
                        onCheckedChange={(value) => handleInsightScoutChange("enhancedAnalysis", value)}
                        data-testid="switch-enhanced-analysis"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p className="font-semibold">Query History</p>
                        <p className="text-sm text-muted-foreground">Save and revisit past searches</p>
                      </div>
                      <Switch
                        checked={insightScoutState.queryHistory}
                        onCheckedChange={(value) => handleInsightScoutChange("queryHistory", value)}
                        data-testid="switch-query-history"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p className="font-semibold">Auto-Save Conversations</p>
                        <p className="text-sm text-muted-foreground">Automatically save all research sessions</p>
                      </div>
                      <Switch
                        checked={insightScoutState.autoSave}
                        onCheckedChange={(value) => handleInsightScoutChange("autoSave", value)}
                        data-testid="switch-auto-save"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Statistics */}
                <Card className="border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900">
                    <CardTitle>Usage Statistics</CardTitle>
                    <CardDescription>Your Insight Scout usage this month</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-muted-foreground font-medium">Queries Used</p>
                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">24 / 100</p>
                        <p className="text-xs text-muted-foreground mt-1">76 queries remaining</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-muted-foreground font-medium">Total Searches</p>
                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">156</p>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-muted-foreground font-medium">Avg. Response Time</p>
                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">2.4s</p>
                        <p className="text-xs text-muted-foreground mt-1">Per query</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Settings */}
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white disabled:opacity-50" 
                  data-testid="button-save-insight-scout"
                  onClick={handleSaveInsightScout}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {updateMutation.isPending ? "Saving..." : "Save Insight Scout Settings"}
                </Button>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const tabs = [
  { id: "account" as SettingsTab, label: "Account", icon: User },
  { id: "privacy" as SettingsTab, label: "Privacy", icon: Shield },
  { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
  { id: "security" as SettingsTab, label: "Security", icon: Lock },
  { id: "insight-scout" as SettingsTab, label: "Insight Scout", icon: Sparkles },
];
