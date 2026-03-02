/*
==========================================================
File: client/src/pages/settings.tsx

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

import { useState, useEffect, useMemo } from "react";
import { User, Mail, Lock, Bell, Eye, EyeOff, Save, LogOut, Shield, Globe, Sparkles, Zap, Loader2, RotateCcw } from "lucide-react";
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
import { useLocation } from "wouter";
import { useAppLanguage } from "@/lib/app-language";

type SettingsTab = "account" | "privacy" | "notifications" | "security" | "insight-scout";
type LocaleCode = "en" | "es" | "fr" | "de" | "zh";

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

interface LocalAnswerEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: "study-skills" | "computer-science" | "math" | "science" | "writing" | "productivity";
}

const SETTINGS_COPY: Record<LocaleCode, Record<string, string>> = {
  en: {
    settings: "Settings",
    settingsSubtitle: "Customize your StudyMate experience and manage your account",
    unsaved: "Unsaved changes",
    allSaved: "All changes saved",
    saveAll: "Save All",
    tabAccount: "Account",
    tabPrivacy: "Privacy",
    tabNotifications: "Notifications",
    tabSecurity: "Security",
    tabInsightScout: "Insight Scout",
    profilePicture: "Profile Picture",
    uploadPicture: "Upload New Picture",
    imageHint: "JPG, PNG or GIF (max 5MB)",
    preferences: "Preferences",
    language: "Language",
    timezone: "Timezone",
    reset: "Reset",
    saveChanges: "Save Changes",
    privacySettings: "Privacy Settings",
    privacyDescription: "Control who can see your information",
    profileVisibility: "Profile Visibility",
    profileVisibilityHint: "Let other students see your profile",
    showStudyActivity: "Show Study Activity",
    showStudyActivityHint: "Display your study stats on leaderboards",
    shareQuizResults: "Share Quiz Results",
    shareQuizResultsHint: "Allow instructors to see your quiz performance",
    savePrivacy: "Save Privacy Settings",
    notificationPrefs: "Notification Preferences",
    notificationDescription: "Choose what notifications you want to receive",
    quizReminders: "Quiz Reminders",
    quizRemindersHint: "Remind me about upcoming quizzes",
    flashcardReminders: "Flashcard Reminders",
    flashcardRemindersHint: "Daily spaced repetition reminders",
    weeklyDigest: "Weekly Digest",
    weeklyDigestHint: "Summary of your study progress",
    newFeatures: "New Features",
    newFeaturesHint: "Be notified about new features and updates",
    marketingEmails: "Marketing Emails",
    marketingEmailsHint: "Promotional content and special offers",
    saveNotifications: "Save Notification Settings",
  },
  es: {
    settings: "Configuración",
    settingsSubtitle: "Personaliza tu experiencia de StudyMate y administra tu cuenta",
    unsaved: "Cambios sin guardar",
    allSaved: "Todos los cambios guardados",
    saveAll: "Guardar todo",
    tabAccount: "Cuenta",
    tabPrivacy: "Privacidad",
    tabNotifications: "Notificaciones",
    tabSecurity: "Seguridad",
    tabInsightScout: "Insight Scout",
    profilePicture: "Foto de perfil",
    uploadPicture: "Subir nueva foto",
    imageHint: "JPG, PNG o GIF (máx. 5MB)",
    preferences: "Preferencias",
    language: "Idioma",
    timezone: "Zona horaria",
    reset: "Restablecer",
    saveChanges: "Guardar cambios",
    privacySettings: "Configuración de privacidad",
    privacyDescription: "Controla quién puede ver tu información",
    profileVisibility: "Visibilidad del perfil",
    profileVisibilityHint: "Permitir que otros estudiantes vean tu perfil",
    showStudyActivity: "Mostrar actividad de estudio",
    showStudyActivityHint: "Muestra tus estadísticas en clasificaciones",
    shareQuizResults: "Compartir resultados de cuestionarios",
    shareQuizResultsHint: "Permite que los instructores vean tu rendimiento",
    savePrivacy: "Guardar privacidad",
    notificationPrefs: "Preferencias de notificación",
    notificationDescription: "Elige qué notificaciones quieres recibir",
    quizReminders: "Recordatorios de cuestionarios",
    quizRemindersHint: "Recuérdame los próximos cuestionarios",
    flashcardReminders: "Recordatorios de tarjetas",
    flashcardRemindersHint: "Recordatorios diarios de repetición espaciada",
    weeklyDigest: "Resumen semanal",
    weeklyDigestHint: "Resumen de tu progreso de estudio",
    newFeatures: "Nuevas funciones",
    newFeaturesHint: "Recibe avisos de nuevas funciones y actualizaciones",
    marketingEmails: "Correos de marketing",
    marketingEmailsHint: "Contenido promocional y ofertas especiales",
    saveNotifications: "Guardar notificaciones",
  },
  fr: {
    settings: "Paramètres",
    settingsSubtitle: "Personnalisez votre expérience StudyMate et gérez votre compte",
    unsaved: "Modifications non enregistrées",
    allSaved: "Toutes les modifications sont enregistrées",
    saveAll: "Tout enregistrer",
    tabAccount: "Compte",
    tabPrivacy: "Confidentialité",
    tabNotifications: "Notifications",
    tabSecurity: "Sécurité",
    tabInsightScout: "Insight Scout",
    profilePicture: "Photo de profil",
    uploadPicture: "Téléverser une nouvelle photo",
    imageHint: "JPG, PNG ou GIF (max 5 Mo)",
    preferences: "Préférences",
    language: "Langue",
    timezone: "Fuseau horaire",
    reset: "Réinitialiser",
    saveChanges: "Enregistrer les modifications",
    privacySettings: "Paramètres de confidentialité",
    privacyDescription: "Contrôlez qui peut voir vos informations",
    profileVisibility: "Visibilité du profil",
    profileVisibilityHint: "Autoriser les autres étudiants à voir votre profil",
    showStudyActivity: "Afficher l'activité d'étude",
    showStudyActivityHint: "Affichez vos statistiques dans les classements",
    shareQuizResults: "Partager les résultats des quiz",
    shareQuizResultsHint: "Permettre aux enseignants de voir vos résultats",
    savePrivacy: "Enregistrer la confidentialité",
    notificationPrefs: "Préférences de notification",
    notificationDescription: "Choisissez les notifications à recevoir",
    quizReminders: "Rappels de quiz",
    quizRemindersHint: "Me rappeler les quiz à venir",
    flashcardReminders: "Rappels de cartes mémoire",
    flashcardRemindersHint: "Rappels quotidiens de répétition espacée",
    weeklyDigest: "Résumé hebdomadaire",
    weeklyDigestHint: "Résumé de votre progression",
    newFeatures: "Nouvelles fonctionnalités",
    newFeaturesHint: "Recevez les nouveautés et mises à jour",
    marketingEmails: "E-mails marketing",
    marketingEmailsHint: "Contenu promotionnel et offres spéciales",
    saveNotifications: "Enregistrer les notifications",
  },
  de: {
    settings: "Einstellungen",
    settingsSubtitle: "Passe dein StudyMate-Erlebnis an und verwalte dein Konto",
    unsaved: "Ungespeicherte Änderungen",
    allSaved: "Alle Änderungen gespeichert",
    saveAll: "Alles speichern",
    tabAccount: "Konto",
    tabPrivacy: "Datenschutz",
    tabNotifications: "Benachrichtigungen",
    tabSecurity: "Sicherheit",
    tabInsightScout: "Insight Scout",
    profilePicture: "Profilbild",
    uploadPicture: "Neues Bild hochladen",
    imageHint: "JPG, PNG oder GIF (max. 5 MB)",
    preferences: "Präferenzen",
    language: "Sprache",
    timezone: "Zeitzone",
    reset: "Zurücksetzen",
    saveChanges: "Änderungen speichern",
    privacySettings: "Datenschutzeinstellungen",
    privacyDescription: "Steuere, wer deine Informationen sehen kann",
    profileVisibility: "Profil-Sichtbarkeit",
    profileVisibilityHint: "Anderen Studierenden dein Profil zeigen",
    showStudyActivity: "Lernaktivität anzeigen",
    showStudyActivityHint: "Deine Statistik in Ranglisten anzeigen",
    shareQuizResults: "Quiz-Ergebnisse teilen",
    shareQuizResultsHint: "Lehrenden deine Leistung anzeigen",
    savePrivacy: "Datenschutz speichern",
    notificationPrefs: "Benachrichtigungseinstellungen",
    notificationDescription: "Wähle, welche Benachrichtigungen du erhalten möchtest",
    quizReminders: "Quiz-Erinnerungen",
    quizRemindersHint: "Erinnere mich an kommende Quizze",
    flashcardReminders: "Karteikarten-Erinnerungen",
    flashcardRemindersHint: "Tägliche Erinnerungen zur verteilten Wiederholung",
    weeklyDigest: "Wöchentliche Zusammenfassung",
    weeklyDigestHint: "Zusammenfassung deines Lernfortschritts",
    newFeatures: "Neue Funktionen",
    newFeaturesHint: "Updates und neue Funktionen erhalten",
    marketingEmails: "Marketing-E-Mails",
    marketingEmailsHint: "Werbeinhalte und Sonderangebote",
    saveNotifications: "Benachrichtigungen speichern",
  },
  zh: {
    settings: "设置",
    settingsSubtitle: "自定义你的 StudyMate 体验并管理你的账户",
    unsaved: "有未保存的更改",
    allSaved: "所有更改已保存",
    saveAll: "全部保存",
    tabAccount: "账户",
    tabPrivacy: "隐私",
    tabNotifications: "通知",
    tabSecurity: "安全",
    tabInsightScout: "Insight Scout",
    profilePicture: "头像",
    uploadPicture: "上传新头像",
    imageHint: "JPG、PNG 或 GIF（最大 5MB）",
    preferences: "偏好设置",
    language: "语言",
    timezone: "时区",
    reset: "重置",
    saveChanges: "保存更改",
    privacySettings: "隐私设置",
    privacyDescription: "控制谁可以查看你的信息",
    profileVisibility: "资料可见性",
    profileVisibilityHint: "允许其他学生查看你的资料",
    showStudyActivity: "显示学习活动",
    showStudyActivityHint: "在排行榜中展示你的学习数据",
    shareQuizResults: "分享测验成绩",
    shareQuizResultsHint: "允许导师查看你的测验表现",
    savePrivacy: "保存隐私设置",
    notificationPrefs: "通知偏好",
    notificationDescription: "选择你希望接收的通知",
    quizReminders: "测验提醒",
    quizRemindersHint: "提醒我即将开始的测验",
    flashcardReminders: "闪卡提醒",
    flashcardRemindersHint: "每日间隔重复提醒",
    weeklyDigest: "每周摘要",
    weeklyDigestHint: "你的学习进度摘要",
    newFeatures: "新功能",
    newFeaturesHint: "接收新功能和更新通知",
    marketingEmails: "营销邮件",
    marketingEmailsHint: "促销内容和特别优惠",
    saveNotifications: "保存通知设置",
  },
};

const TAB_DEFS = [
  { id: "account" as SettingsTab, key: "tabAccount", icon: User },
  { id: "privacy" as SettingsTab, key: "tabPrivacy", icon: Shield },
  { id: "notifications" as SettingsTab, key: "tabNotifications", icon: Bell },
  { id: "security" as SettingsTab, key: "tabSecurity", icon: Lock },
  { id: "insight-scout" as SettingsTab, key: "tabInsightScout", icon: Sparkles },
];

const DEFAULT_FORM_DATA = {
  phone: "",
  bio: "",
  language: "en",
  timezone: "america/new_york",
};

const DEFAULT_NOTIFICATIONS = {
  quizReminders: true,
  flashcardReminders: true,
  weeklyDigest: true,
  newFeatures: false,
  marketing: false,
};

const DEFAULT_PRIVACY = {
  profileVisibility: true,
  showStudyActivity: true,
  shareQuizResults: true,
};

const DEFAULT_INSIGHT_SCOUT = {
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
};

/*
----------------------------------------------------------
Component: Settings

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
export default function Settings() {
  const { setLanguage: setAppLanguage } = useAppLanguage();
  const [location, setLocation] = useLocation();
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
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [notificationsState, setNotificationsState] = useState(DEFAULT_NOTIFICATIONS);

  const [insightScoutState, setInsightScoutState] = useState(DEFAULT_INSIGHT_SCOUT);

  const [privacyState, setPrivacyState] = useState(DEFAULT_PRIVACY);
  const [hasHydratedFromPreferences, setHasHydratedFromPreferences] = useState(false);

  const [localAnswerSearch, setLocalAnswerSearch] = useState("");
  const [selectedLocalAnswerId, setSelectedLocalAnswerId] = useState<string>("");
  const [localAnswerDraft, setLocalAnswerDraft] = useState({
    question: "",
    answer: "",
    keywords: "",
    category: "study-skills" as LocalAnswerEntry["category"],
  });

  const activeLocale: LocaleCode = (["en", "es", "fr", "de", "zh"].includes(formData.language)
    ? formData.language
    : "en") as LocaleCode;

    /*
  ----------------------------------------------------------
  Function: t

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - key: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const t = (key: string) => SETTINGS_COPY[activeLocale]?.[key] || SETTINGS_COPY.en[key] || key;

  const tabs = useMemo(
    () => TAB_DEFS.map((tab) => ({ ...tab, label: t(tab.key) })),
    [activeLocale]
  );

  const { data: localAnswersData, isLoading: isLocalAnswersLoading } = useQuery({
    queryKey: ["local-ai-answers", localAnswerSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (localAnswerSearch.trim()) params.set("search", localAnswerSearch.trim());
      const response = await apiRequest("GET", `/api/research/local-answers${params.toString() ? `?${params.toString()}` : ""}`);
      return (await response.json()) as { items: LocalAnswerEntry[]; count: number };
    },
    enabled: activeTab === "insight-scout",
    staleTime: 10000,
  });

  const updateLocalAnswerMutation = useMutation({
    mutationFn: async (payload: { id: string; question: string; answer: string; keywords: string[]; category: LocalAnswerEntry["category"] }) => {
      const response = await apiRequest("PATCH", `/api/research/local-answers/${payload.id}`, {
        question: payload.question,
        answer: payload.answer,
        keywords: payload.keywords,
        category: payload.category,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-ai-answers"] });
      toast({
        title: "Local answer updated",
        description: "The local AI answer was saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not save the local AI answer.",
        variant: "destructive",
      });
    },
  });

  const localAnswers = localAnswersData?.items ?? [];

  useEffect(() => {
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab");
    const validTabs: SettingsTab[] = ["account", "privacy", "notifications", "security", "insight-scout"];
    if (tab && validTabs.includes(tab as SettingsTab)) {
      setActiveTab(tab as SettingsTab);
    }
  }, [location]);

  // Update local state when preferences load
  useEffect(() => {
    if (preferences && !hasHydratedFromPreferences) {
      const incomingLanguage = (["en", "es", "fr", "de", "zh"].includes(preferences.language)
        ? preferences.language
        : "en") as LocaleCode;
      setAppLanguage(incomingLanguage);

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

      setHasHydratedFromPreferences(true);
    }
  }, [preferences, hasHydratedFromPreferences, setAppLanguage]);

  const preferenceSnapshots = useMemo(() => {
    const profile = {
      phone: preferences?.phone || "",
      bio: preferences?.bio || "",
      language: preferences?.language || "en",
      timezone: preferences?.timezone || "america/new_york",
    };

    const notifications = {
      quizReminders: preferences?.quizReminders ?? true,
      flashcardReminders: preferences?.flashcardReminders ?? true,
      weeklyDigest: preferences?.weeklyDigest ?? true,
      newFeatures: preferences?.newFeatures ?? false,
      marketing: preferences?.marketing ?? false,
    };

    const privacy = {
      profileVisibility: preferences?.profileVisibility ?? true,
      showStudyActivity: preferences?.showStudyActivity ?? true,
      shareQuizResults: preferences?.shareQuizResults ?? true,
    };

    const insight = {
      aiModel: preferences?.aiModel || "gpt-4",
      searchDepth: preferences?.searchDepth || "comprehensive",
      citationFormat: preferences?.citationFormat || "apa",
      responseTone: preferences?.responseTone || "academic",
      includeExamples: preferences?.includeExamples ?? true,
      includeSources: preferences?.includeSources ?? true,
      maxResults: preferences?.maxResults || "10",
      queryHistory: preferences?.queryHistory ?? true,
      autoSave: preferences?.autoSave ?? true,
      researchSummary: preferences?.researchSummary ?? true,
      webSearch: preferences?.webSearch ?? true,
      academicDatabases: preferences?.academicDatabases ?? true,
      enhancedAnalysis: preferences?.enhancedAnalysis ?? true,
      multiLanguageSupport: preferences?.multiLanguageSupport ?? false,
    };

    return { profile, notifications, privacy, insight };
  }, [preferences]);

  const isProfileDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(preferenceSnapshots.profile),
    [formData, preferenceSnapshots.profile]
  );

  const isNotificationsDirty = useMemo(
    () => JSON.stringify(notificationsState) !== JSON.stringify(preferenceSnapshots.notifications),
    [notificationsState, preferenceSnapshots.notifications]
  );

  const isPrivacyDirty = useMemo(
    () => JSON.stringify(privacyState) !== JSON.stringify(preferenceSnapshots.privacy),
    [privacyState, preferenceSnapshots.privacy]
  );

  const isInsightScoutDirty = useMemo(
    () => JSON.stringify(insightScoutState) !== JSON.stringify(preferenceSnapshots.insight),
    [insightScoutState, preferenceSnapshots.insight]
  );

  const hasAnyUnsavedChanges = isProfileDirty || isNotificationsDirty || isPrivacyDirty || isInsightScoutDirty;

  // Update mutation - connects all buttons to backend
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const response = await apiRequest("PATCH", "/api/settings", updates);
      return await response.json();
    },
    onSuccess: (saved: UserPreferences) => {
      queryClient.setQueryData(["settings"], saved);
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

    /*
  ----------------------------------------------------------
  Function: handleInputChange

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - e: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

    /*
  ----------------------------------------------------------
  Function: handleSelectChange

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - name: Input consumed by this routine during execution
  - value: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleSelectChange = (name: string, value: string) => {
    if (name === "language") {
      const safeLanguage = (["en", "es", "fr", "de", "zh"].includes(value)
        ? value
        : "en") as LocaleCode;
      setAppLanguage(safeLanguage);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

    /*
  ----------------------------------------------------------
  Function: handleNotificationChange

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - key: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleNotificationChange = (key: keyof typeof notificationsState) => {
    setNotificationsState(prev => ({ ...prev, [key]: !prev[key] }));
  };

    /*
  ----------------------------------------------------------
  Function: handleInsightScoutChange

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - key: Input consumed by this routine during execution
  - value: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleInsightScoutChange = (key: keyof typeof insightScoutState, value: any) => {
    setInsightScoutState(prev => ({ ...prev, [key]: value }));
  };

    /*
  ----------------------------------------------------------
  Function: handlePrivacyChange

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - key: Input consumed by this routine during execution

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handlePrivacyChange = (key: keyof typeof privacyState) => {
    setPrivacyState(prev => ({ ...prev, [key]: !prev[key] }));
  };

    /*
  ----------------------------------------------------------
  Function: handleSaveProfile

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleSaveProfile = async () => {
    const saved = await updateMutation.mutateAsync(formData);
    const savedLanguage = (["en", "es", "fr", "de", "zh"].includes(saved?.language)
      ? saved.language
      : formData.language) as LocaleCode;
    setFormData(prev => ({ ...prev, language: savedLanguage }));
    setAppLanguage(savedLanguage);
  };

    /*
  ----------------------------------------------------------
  Function: handleSaveNotifications

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleSaveNotifications = async () => {
    await updateMutation.mutateAsync(notificationsState);
  };

    /*
  ----------------------------------------------------------
  Function: handleSavePrivacy

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleSavePrivacy = async () => {
    await updateMutation.mutateAsync(privacyState);
  };

    /*
  ----------------------------------------------------------
  Function: handleSaveInsightScout

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleSaveInsightScout = async () => {
    await updateMutation.mutateAsync(insightScoutState);
  };

    /*
  ----------------------------------------------------------
  Function: handleSaveAllSettings

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleSaveAllSettings = async () => {
    const saved = await updateMutation.mutateAsync({
      ...formData,
      ...privacyState,
      ...notificationsState,
      ...insightScoutState,
    });
    const savedLanguage = (["en", "es", "fr", "de", "zh"].includes(saved?.language)
      ? saved.language
      : formData.language) as LocaleCode;
    setFormData(prev => ({ ...prev, language: savedLanguage }));
    setAppLanguage(savedLanguage);
  };

    /*
  ----------------------------------------------------------
  Function: handleResetProfile

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleResetProfile = () => setFormData(DEFAULT_FORM_DATA);
    /*
  ----------------------------------------------------------
  Function: handleResetNotifications

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleResetNotifications = () => setNotificationsState(DEFAULT_NOTIFICATIONS);
    /*
  ----------------------------------------------------------
  Function: handleResetPrivacy

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleResetPrivacy = () => setPrivacyState(DEFAULT_PRIVACY);
    /*
  ----------------------------------------------------------
  Function: handleResetInsightScout

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleResetInsightScout = () => setInsightScoutState(DEFAULT_INSIGHT_SCOUT);

  useEffect(() => {
    if (!localAnswers.length) {
      setSelectedLocalAnswerId("");
      setLocalAnswerDraft({
        question: "",
        answer: "",
        keywords: "",
        category: "study-skills",
      });
      return;
    }

    const selected = localAnswers.find((entry) => entry.id === selectedLocalAnswerId) || localAnswers[0];
    if (selected.id !== selectedLocalAnswerId) {
      setSelectedLocalAnswerId(selected.id);
    }

    setLocalAnswerDraft({
      question: selected.question,
      answer: selected.answer,
      keywords: selected.keywords.join(", "),
      category: selected.category,
    });
  }, [localAnswers, selectedLocalAnswerId]);

    /*
  ----------------------------------------------------------
  Function: handleSaveLocalAnswer

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - None: Operates using closure/module state only

  Process:
  1. Accepts and normalizes inputs before core processing
  2. Applies relevant guards/validation to prevent invalid transitions
  3. Executes primary logic path and handles expected edge conditions
  4. Returns a deterministic output for the caller layer

  Why Validation is Important:
  Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

  Returns:
  A value/promise representing the outcome of the executed logic path.
  ----------------------------------------------------------
  */
const handleSaveLocalAnswer = async () => {
    if (!selectedLocalAnswerId) return;
    await updateLocalAnswerMutation.mutateAsync({
      id: selectedLocalAnswerId,
      question: localAnswerDraft.question,
      answer: localAnswerDraft.answer,
      keywords: localAnswerDraft.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      category: localAnswerDraft.category,
    });
  };

  useEffect(() => {
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/70 to-cyan-50/60 dark:from-purple-950 dark:via-slate-950 dark:to-indigo-950">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-brand-primary via-[#253f95] to-brand-accent rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{t("settings")}</h1>
              <p className="text-lg opacity-90 max-w-2xl">{t("settingsSubtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              {hasAnyUnsavedChanges ? (
                <Badge className="bg-white/20 text-white border border-white/30">{t("unsaved")}</Badge>
              ) : (
                <Badge className="bg-emerald-500/80 text-white border-0">{t("allSaved")}</Badge>
              )}
              <Button
                variant="outline"
                className="border-white/40 text-white hover:bg-white/20"
                onClick={handleSaveAllSettings}
                disabled={updateMutation.isPending}
                data-testid="button-save-all-settings"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {t("saveAll")}
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="border border-border sticky top-6 bg-card/95 backdrop-blur-sm shadow-md">
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
                              ? "border-l-brand-primary bg-brand-primary/10 dark:bg-purple-950 text-brand-primary dark:text-purple-300 font-semibold"
                              : "border-l-transparent text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800"
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
                  <Card className="border border-border shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-purple-900 dark:to-violet-900">
                      <CardTitle>{t("profilePicture")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 border-4 border-brand-primary/30 dark:border-purple-700">
                          <AvatarFallback className="bg-gradient-to-br from-brand-primary to-brand-accent text-white text-2xl font-bold">
                            {formData.bio ? formData.bio.charAt(0).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">{t("imageHint")}</p>
                          <Button className="bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white">
                            {t("uploadPicture")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preferences */}
                  <Card className="border border-border shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-purple-900 dark:to-violet-900">
                      <CardTitle>{t("preferences")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="language" className="font-semibold">{t("language")}</Label>
                        <Select value={formData.language} onValueChange={(value) => handleSelectChange("language", value)}>
                          <SelectTrigger className="border-2 border-brand-primary/30 dark:border-purple-800" data-testid="select-language">
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
                        <Label htmlFor="timezone" className="font-semibold">{t("timezone")}</Label>
                        <Select value={formData.timezone} onValueChange={(value) => handleSelectChange("timezone", value)}>
                          <SelectTrigger className="border-2 border-brand-primary/30 dark:border-purple-800" data-testid="select-timezone">
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

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleResetProfile}
                          disabled={updateMutation.isPending}
                          data-testid="button-reset-preferences"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {t("reset")}
                        </Button>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white disabled:opacity-50" 
                          onClick={handleSaveProfile}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          {updateMutation.isPending ? "Saving..." : t("saveChanges")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === "privacy" && (
                <Card className="border border-border shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-purple-900 dark:to-violet-900">
                    <CardTitle>{t("privacySettings")}</CardTitle>
                    <CardDescription>{t("privacyDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                        <div>
                          <p className="font-semibold">{t("profileVisibility")}</p>
                          <p className="text-sm text-muted-foreground">{t("profileVisibilityHint")}</p>
                        </div>
                        <Switch 
                          checked={privacyState.profileVisibility}
                          onCheckedChange={() => handlePrivacyChange("profileVisibility")}
                          data-testid="switch-profile-visibility" 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                        <div>
                          <p className="font-semibold">{t("showStudyActivity")}</p>
                          <p className="text-sm text-muted-foreground">{t("showStudyActivityHint")}</p>
                        </div>
                        <Switch 
                          checked={privacyState.showStudyActivity}
                          onCheckedChange={() => handlePrivacyChange("showStudyActivity")}
                          data-testid="switch-study-activity" 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                        <div>
                          <p className="font-semibold">{t("shareQuizResults")}</p>
                          <p className="text-sm text-muted-foreground">{t("shareQuizResultsHint")}</p>
                        </div>
                        <Switch 
                          checked={privacyState.shareQuizResults}
                          onCheckedChange={() => handlePrivacyChange("shareQuizResults")}
                          data-testid="switch-quiz-results" 
                        />
                      </div>

                      <div className="flex gap-2 mt-6">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleResetPrivacy}
                          disabled={updateMutation.isPending}
                          data-testid="button-reset-privacy"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {t("reset")}
                        </Button>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white disabled:opacity-50"
                          onClick={handleSavePrivacy}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          {updateMutation.isPending ? "Saving..." : t("savePrivacy")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <Card className="border border-border shadow-sm">
                <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-purple-900 dark:to-violet-900">
                  <CardTitle>{t("notificationPrefs")}</CardTitle>
                  <CardDescription>{t("notificationDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border-2 border-brand-primary/30 dark:border-brand-primary/40 rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20">
                      <div>
                        <p className="font-semibold text-foreground">{t("quizReminders")}</p>
                        <p className="text-sm text-muted-foreground">{t("quizRemindersHint")}</p>
                      </div>
                      <Switch
                        checked={notificationsState.quizReminders}
                        onCheckedChange={() => handleNotificationChange("quizReminders")}
                        data-testid="switch-quiz-reminders"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-success/30 dark:border-success/40 rounded-lg bg-success/10 dark:bg-success/20">
                      <div>
                        <p className="font-semibold text-foreground">{t("flashcardReminders")}</p>
                        <p className="text-sm text-muted-foreground">{t("flashcardRemindersHint")}</p>
                      </div>
                      <Switch
                        checked={notificationsState.flashcardReminders}
                        onCheckedChange={() => handleNotificationChange("flashcardReminders")}
                        data-testid="switch-flashcard-reminders"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-brand-primary/30 dark:border-purple-800 rounded-lg bg-brand-primary/10 dark:bg-purple-950">
                      <div>
                        <p className="font-semibold text-foreground">{t("weeklyDigest")}</p>
                        <p className="text-sm text-muted-foreground">{t("weeklyDigestHint")}</p>
                      </div>
                      <Switch
                        checked={notificationsState.weeklyDigest}
                        onCheckedChange={() => handleNotificationChange("weeklyDigest")}
                        data-testid="switch-weekly-digest"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                      <div>
                        <p className="font-semibold">{t("newFeatures")}</p>
                        <p className="text-sm text-muted-foreground">{t("newFeaturesHint")}</p>
                      </div>
                      <Switch
                        checked={notificationsState.newFeatures}
                        onCheckedChange={() => handleNotificationChange("newFeatures")}
                        data-testid="switch-new-features"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                      <div>
                        <p className="font-semibold">{t("marketingEmails")}</p>
                        <p className="text-sm text-muted-foreground">{t("marketingEmailsHint")}</p>
                      </div>
                      <Switch
                        checked={notificationsState.marketing}
                        onCheckedChange={() => handleNotificationChange("marketing")}
                        data-testid="switch-marketing"
                      />
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleResetNotifications}
                        disabled={updateMutation.isPending}
                        data-testid="button-reset-notifications"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t("reset")}
                      </Button>
                      <Button 
                        className="flex-1 bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white disabled:opacity-50"
                        onClick={handleSaveNotifications}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {updateMutation.isPending ? "Saving..." : t("saveNotifications")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Password */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-purple-900 dark:to-violet-900">
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
                          className="border-2 border-brand-primary/30 dark:border-purple-800 focus-visible:ring-brand-primary pr-10"
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
                        className="border-2 border-brand-primary/30 dark:border-purple-800 focus-visible:ring-brand-primary"
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
                        className="border-2 border-brand-primary/30 dark:border-purple-800 focus-visible:ring-brand-primary"
                        data-testid="input-confirm-password"
                      />
                    </div>

                    <Button className="w-full bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white" data-testid="button-change-password">
                      <Lock className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  </CardContent>
                </Card>

                {/* Two-Factor Authentication */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-purple-900 dark:to-violet-900">
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
                      <Button className="bg-gradient-to-r from-brand-primary to-brand-accent hover:from-[#1A3175] hover:to-[#0891B2] text-white" data-testid="button-enable-2fa">
                        Enable 2FA
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card className="border border-border shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 dark:from-purple-900 dark:to-violet-900">
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Manage your active sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-3">
                    <div className="p-4 border-2 border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">Chrome on macOS</p>
                        <Badge className="bg-green-100 dark:bg-success/20 text-success dark:text-green-300 border-0">Current</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Last active: Just now</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-2 border-destructive/30 dark:border-destructive/40 bg-red-50 dark:bg-red-950">
                  <CardHeader>
                    <CardTitle className="text-destructive dark:text-red-300">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full border-red-300 dark:border-red-700 text-destructive dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-500 dark:border-red-600 text-destructive dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
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

                {/* Research Preferences (Concise) */}
                <Card className="border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900">
                    <CardTitle>Research Preferences</CardTitle>
                    <CardDescription>Focused controls for response style and quick behavior toggles</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="response-tone" className="font-semibold">Response Tone</Label>
                        <Select value={insightScoutState.responseTone} onValueChange={(value) => handleInsightScoutChange("responseTone", value)}>
                          <SelectTrigger className="border-2 border-orange-200 dark:border-orange-800" data-testid="select-response-tone">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="academic">Academic</SelectItem>
                            <SelectItem value="conversational">Conversational</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="simplified">Simplified</SelectItem>
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
                            <SelectItem value="apa">APA</SelectItem>
                            <SelectItem value="mla">MLA</SelectItem>
                            <SelectItem value="chicago">Chicago</SelectItem>
                            <SelectItem value="harvard">Harvard</SelectItem>
                            <SelectItem value="ieee">IEEE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Quick Toggles</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 border-2 border-border rounded-lg">
                          <div>
                            <p className="font-medium">Include Examples</p>
                            <p className="text-xs text-muted-foreground">Show practical examples</p>
                          </div>
                          <Switch
                            checked={insightScoutState.includeExamples}
                            onCheckedChange={(value) => handleInsightScoutChange("includeExamples", value)}
                            data-testid="switch-include-examples"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border-2 border-border rounded-lg">
                          <div>
                            <p className="font-medium">Include Sources</p>
                            <p className="text-xs text-muted-foreground">Attach citations</p>
                          </div>
                          <Switch
                            checked={insightScoutState.includeSources}
                            onCheckedChange={(value) => handleInsightScoutChange("includeSources", value)}
                            data-testid="switch-include-sources"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border-2 border-border rounded-lg">
                          <div>
                            <p className="font-medium">Research Summary</p>
                            <p className="text-xs text-muted-foreground">Summarize key points</p>
                          </div>
                          <Switch
                            checked={insightScoutState.researchSummary}
                            onCheckedChange={(value) => handleInsightScoutChange("researchSummary", value)}
                            data-testid="switch-research-summary"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border-2 border-border rounded-lg">
                          <div>
                            <p className="font-medium">Academic Databases</p>
                            <p className="text-xs text-muted-foreground">Prioritize academic sources</p>
                          </div>
                          <Switch
                            checked={insightScoutState.academicDatabases}
                            onCheckedChange={(value) => handleInsightScoutChange("academicDatabases", value)}
                            data-testid="switch-academic-databases"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border-2 border-border rounded-lg">
                          <div>
                            <p className="font-medium">Web Search</p>
                            <p className="text-xs text-muted-foreground">Allow web retrieval for broader context</p>
                          </div>
                          <Switch
                            checked={insightScoutState.webSearch}
                            onCheckedChange={(value) => handleInsightScoutChange("webSearch", value)}
                            data-testid="switch-web-search"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border-2 border-border rounded-lg">
                          <div>
                            <p className="font-medium">Query History</p>
                            <p className="text-xs text-muted-foreground">Store previous queries for faster revisits</p>
                          </div>
                          <Switch
                            checked={insightScoutState.queryHistory}
                            onCheckedChange={(value) => handleInsightScoutChange("queryHistory", value)}
                            data-testid="switch-query-history"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border-2 border-border rounded-lg">
                          <div>
                            <p className="font-medium">Auto Save</p>
                            <p className="text-xs text-muted-foreground">Automatically save generated research sessions</p>
                          </div>
                          <Switch
                            checked={insightScoutState.autoSave}
                            onCheckedChange={(value) => handleInsightScoutChange("autoSave", value)}
                            data-testid="switch-auto-save"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border-2 border-border rounded-lg">
                          <div>
                            <p className="font-medium">Enhanced Analysis</p>
                            <p className="text-xs text-muted-foreground">Run deeper reasoning for nuanced responses</p>
                          </div>
                          <Switch
                            checked={insightScoutState.enhancedAnalysis}
                            onCheckedChange={(value) => handleInsightScoutChange("enhancedAnalysis", value)}
                            data-testid="switch-enhanced-analysis"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border-2 border-border rounded-lg">
                          <div>
                            <p className="font-medium">Multi-language Support</p>
                            <p className="text-xs text-muted-foreground">Enable multilingual understanding and output</p>
                          </div>
                          <Switch
                            checked={insightScoutState.multiLanguageSupport}
                            onCheckedChange={(value) => handleInsightScoutChange("multiLanguageSupport", value)}
                            data-testid="switch-multi-language-support"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Study Intent */}
                <Card className="border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900">
                    <CardTitle>Study Intent</CardTitle>
                    <CardDescription>
                      Keep intent-specific behavior in Insight Scout. Configure your intent directly in the Research page before searching.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full border-orange-300 dark:border-orange-700"
                      onClick={() => setLocation("/research")}
                      data-testid="button-open-research-intent"
                    >
                      Open Insight Scout (Research)
                    </Button>
                  </CardContent>
                </Card>

                {/* Save Settings */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-300 dark:border-orange-700"
                    onClick={handleResetInsightScout}
                    disabled={updateMutation.isPending}
                    data-testid="button-reset-insight-scout"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to defaults
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white disabled:opacity-50" 
                    data-testid="button-save-insight-scout"
                    onClick={handleSaveInsightScout}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {updateMutation.isPending ? "Saving..." : "Save Insight Scout Settings"}
                  </Button>
                </div>

                <Card className="border-2 border-orange-200 dark:border-orange-800">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900">
                    <CardTitle>Local AI Answer Bank</CardTitle>
                    <CardDescription>Search and edit built-in fallback answers used when live AI is unavailable.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="local-ai-search" className="font-semibold">Search answers</Label>
                      <Input
                        id="local-ai-search"
                        value={localAnswerSearch}
                        onChange={(event) => setLocalAnswerSearch(event.target.value)}
                        placeholder="Search by topic, keyword, or category"
                        className="border-2 border-orange-200 dark:border-orange-800"
                        data-testid="input-local-ai-search"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="border-2 border-border rounded-lg p-2 max-h-80 overflow-auto space-y-2">
                        {isLocalAnswersLoading ? (
                          <p className="text-sm text-muted-foreground px-2 py-1">Loading local answers...</p>
                        ) : localAnswers.length === 0 ? (
                          <p className="text-sm text-muted-foreground px-2 py-1">No local answers match this search.</p>
                        ) : (
                          localAnswers.map((entry) => (
                            <button
                              key={entry.id}
                              onClick={() => setSelectedLocalAnswerId(entry.id)}
                              className={`w-full text-left p-2 rounded-md border transition-colors ${
                                entry.id === selectedLocalAnswerId
                                  ? "border-orange-400 bg-orange-50 dark:bg-orange-950"
                                  : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                              }`}
                              data-testid={`button-local-answer-${entry.id}`}
                            >
                              <p className="text-sm font-semibold line-clamp-1">{entry.question}</p>
                              <p className="text-xs text-muted-foreground mt-1">{entry.category}</p>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="local-ai-question" className="font-semibold">Question</Label>
                          <Input
                            id="local-ai-question"
                            value={localAnswerDraft.question}
                            onChange={(event) => setLocalAnswerDraft((prev) => ({ ...prev, question: event.target.value }))}
                            className="border-2 border-orange-200 dark:border-orange-800"
                            data-testid="input-local-ai-question"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="local-ai-category" className="font-semibold">Category</Label>
                          <Select
                            value={localAnswerDraft.category}
                            onValueChange={(value) => setLocalAnswerDraft((prev) => ({ ...prev, category: value as LocalAnswerEntry["category"] }))}
                          >
                            <SelectTrigger className="border-2 border-orange-200 dark:border-orange-800" data-testid="select-local-ai-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="study-skills">Study Skills</SelectItem>
                              <SelectItem value="computer-science">Computer Science</SelectItem>
                              <SelectItem value="math">Math</SelectItem>
                              <SelectItem value="science">Science</SelectItem>
                              <SelectItem value="writing">Writing</SelectItem>
                              <SelectItem value="productivity">Productivity</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="local-ai-keywords" className="font-semibold">Keywords (comma-separated)</Label>
                          <Input
                            id="local-ai-keywords"
                            value={localAnswerDraft.keywords}
                            onChange={(event) => setLocalAnswerDraft((prev) => ({ ...prev, keywords: event.target.value }))}
                            className="border-2 border-orange-200 dark:border-orange-800"
                            data-testid="input-local-ai-keywords"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="local-ai-answer" className="font-semibold">Answer</Label>
                          <textarea
                            id="local-ai-answer"
                            value={localAnswerDraft.answer}
                            onChange={(event) => setLocalAnswerDraft((prev) => ({ ...prev, answer: event.target.value }))}
                            className="w-full min-h-[180px] p-3 border-2 border-orange-200 dark:border-orange-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 bg-card text-foreground"
                            data-testid="textarea-local-ai-answer"
                          />
                        </div>

                        <Button
                          onClick={handleSaveLocalAnswer}
                          disabled={!selectedLocalAnswerId || updateLocalAnswerMutation.isPending}
                          className="w-full bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white disabled:opacity-50"
                          data-testid="button-save-local-ai-answer"
                        >
                          {updateLocalAnswerMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          {updateLocalAnswerMutation.isPending ? "Saving local answer..." : "Save Local Answer"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

