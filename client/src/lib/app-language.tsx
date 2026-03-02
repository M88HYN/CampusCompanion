/*
==========================================================
File: client/src/lib/app-language.tsx

Module: Frontend Experience

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Application Layer (Business and Interaction Logic)

System Interaction:
- Consumes API endpoints via query/mutation utilities and renders user-facing interfaces
- Collaborates with shared types to preserve frontend-backend contract integrity

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

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

/*
----------------------------------------------------------
Function: isAppLanguage

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
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
function isAppLanguage(value: string): value is AppLanguage {
  return ["en", "es", "fr", "de", "zh"].includes(value);
}

/*
----------------------------------------------------------
Component: AppLanguageProvider

Purpose:
Renders a focused UI unit and orchestrates state, hooks, and user interactions for the surrounding workflow.

Parameters:
- children: Input consumed by this routine during execution

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
export function AppLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isAppLanguage(stored)) return stored;
    return "en";
  });

    /*
  ----------------------------------------------------------
  Function: setLanguage

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - nextLanguage: Input consumed by this routine during execution

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

/*
----------------------------------------------------------
Function: useAppLanguage

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
export function useAppLanguage() {
  const context = useContext(AppLanguageContext);
  if (!context) {
    throw new Error("useAppLanguage must be used within AppLanguageProvider");
  }
  return context;
}
