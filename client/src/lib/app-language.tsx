import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "en" | "es" | "fr" | "de" | "zh";

const LANGUAGE_STORAGE_KEY = "app-language";

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    "nav.studyTools": "STUDY TOOLS",
    "nav.analytics": "ANALYTICS",
    "nav.account": "ACCOUNT",
    "nav.dashboard": "Dashboard",
    "nav.notes": "Notes",
    "nav.flashcards": "Flashcards",
    "nav.quizzes": "Quizzes",
    "nav.revision": "Revision Aids",
    "nav.research": "Insight Scout",
    "nav.insights": "Insights",
    "nav.performance": "Performance",
    "nav.profile": "Profile",
    "nav.settings": "Settings",
    "common.logout": "Log out",
  },
  es: {
    "nav.studyTools": "HERRAMIENTAS DE ESTUDIO",
    "nav.analytics": "ANALÍTICAS",
    "nav.account": "CUENTA",
    "nav.dashboard": "Panel",
    "nav.notes": "Notas",
    "nav.flashcards": "Tarjetas",
    "nav.quizzes": "Cuestionarios",
    "nav.revision": "Ayudas de repaso",
    "nav.research": "Insight Scout",
    "nav.insights": "Insights",
    "nav.performance": "Rendimiento",
    "nav.profile": "Perfil",
    "nav.settings": "Configuración",
    "common.logout": "Cerrar sesión",
  },
  fr: {
    "nav.studyTools": "OUTILS D'ÉTUDE",
    "nav.analytics": "ANALYTIQUES",
    "nav.account": "COMPTE",
    "nav.dashboard": "Tableau de bord",
    "nav.notes": "Notes",
    "nav.flashcards": "Cartes mémoire",
    "nav.quizzes": "Quiz",
    "nav.revision": "Aides de révision",
    "nav.research": "Insight Scout",
    "nav.insights": "Insights",
    "nav.performance": "Performance",
    "nav.profile": "Profil",
    "nav.settings": "Paramètres",
    "common.logout": "Se déconnecter",
  },
  de: {
    "nav.studyTools": "LERNWERKZEUGE",
    "nav.analytics": "ANALYTIK",
    "nav.account": "KONTO",
    "nav.dashboard": "Dashboard",
    "nav.notes": "Notizen",
    "nav.flashcards": "Karteikarten",
    "nav.quizzes": "Quizze",
    "nav.revision": "Lernhilfen",
    "nav.research": "Insight Scout",
    "nav.insights": "Insights",
    "nav.performance": "Leistung",
    "nav.profile": "Profil",
    "nav.settings": "Einstellungen",
    "common.logout": "Abmelden",
  },
  zh: {
    "nav.studyTools": "学习工具",
    "nav.analytics": "分析",
    "nav.account": "账户",
    "nav.dashboard": "仪表盘",
    "nav.notes": "笔记",
    "nav.flashcards": "闪卡",
    "nav.quizzes": "测验",
    "nav.revision": "复习辅助",
    "nav.research": "Insight Scout",
    "nav.insights": "洞察",
    "nav.performance": "表现",
    "nav.profile": "个人资料",
    "nav.settings": "设置",
    "common.logout": "退出登录",
  },
};

type AppLanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
};

const AppLanguageContext = createContext<AppLanguageContextValue | undefined>(undefined);

function isAppLanguage(value: string): value is AppLanguage {
  return ["en", "es", "fr", "de", "zh"].includes(value);
}

export function AppLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isAppLanguage(stored)) return stored;
    return "en";
  });

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<AppLanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string, fallback?: string) => TRANSLATIONS[language][key] || fallback || TRANSLATIONS.en[key] || key,
    }),
    [language]
  );

  return <AppLanguageContext.Provider value={value}>{children}</AppLanguageContext.Provider>;
}

export function useAppLanguage() {
  const context = useContext(AppLanguageContext);
  if (!context) {
    throw new Error("useAppLanguage must be used within AppLanguageProvider");
  }
  return context;
}
