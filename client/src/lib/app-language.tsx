/* Language helper for translating UI text and saved labels. */

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

const GLOBAL_PHRASE_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {},
  es: {
    "Learning Insights": "Información de Aprendizaje",
    "Performance": "Rendimiento",
    "Insights": "Información",
    "Dashboard": "Panel",
    "Notes": "Notas",
    "Flashcards": "Tarjetas",
    "Quizzes": "Cuestionarios",
    "Revision Aids": "Ayudas de repaso",
    "Profile": "Perfil",
    "Settings": "Configuración",
    "Log out": "Cerrar sesión",
    "No performance data yet": "Aún no hay datos de rendimiento",
    "Complete a few quizzes to unlock your dedicated performance analytics.": "Completa algunos cuestionarios para desbloquear tus análisis de rendimiento.",
    "Accuracy Trends": "Tendencias de precisión",
    "Weekly Progress": "Progreso semanal",
    "Topic Engagement Distribution": "Distribución de participación por tema",
    "Peak Study Times": "Horas pico de estudio",
    "Personalized Recommendations": "Recomendaciones personalizadas",
  },
  fr: {
    "Learning Insights": "Aperçus d'apprentissage",
    "Performance": "Performance",
    "Insights": "Aperçus",
    "Dashboard": "Tableau de bord",
    "Notes": "Notes",
    "Flashcards": "Cartes mémoire",
    "Quizzes": "Quiz",
    "Revision Aids": "Aides de révision",
    "Profile": "Profil",
    "Settings": "Paramètres",
    "Log out": "Se déconnecter",
    "No performance data yet": "Aucune donnée de performance pour le moment",
    "Complete a few quizzes to unlock your dedicated performance analytics.": "Complétez quelques quiz pour débloquer vos analyses de performance.",
    "Accuracy Trends": "Tendances de précision",
    "Weekly Progress": "Progrès hebdomadaire",
    "Topic Engagement Distribution": "Répartition de l'engagement par sujet",
    "Peak Study Times": "Heures d'étude optimales",
    "Personalized Recommendations": "Recommandations personnalisées",
  },
  de: {
    "Learning Insights": "Lern-Einblicke",
    "Performance": "Leistung",
    "Insights": "Einblicke",
    "Dashboard": "Dashboard",
    "Notes": "Notizen",
    "Flashcards": "Karteikarten",
    "Quizzes": "Quizze",
    "Revision Aids": "Lernhilfen",
    "Profile": "Profil",
    "Settings": "Einstellungen",
    "Log out": "Abmelden",
    "No performance data yet": "Noch keine Leistungsdaten verfügbar",
    "Complete a few quizzes to unlock your dedicated performance analytics.": "Absolvieren Sie ein paar Quizze, um Ihre Leistungsanalyse freizuschalten.",
    "Accuracy Trends": "Genauigkeitstrends",
    "Weekly Progress": "Wöchentlicher Fortschritt",
    "Topic Engagement Distribution": "Verteilung der Themenbeteiligung",
    "Peak Study Times": "Beste Lernzeiten",
    "Personalized Recommendations": "Personalisierte Empfehlungen",
  },
  zh: {
    "Learning Insights": "学习洞察",
    "Performance": "表现",
    "Insights": "洞察",
    "Dashboard": "仪表盘",
    "Notes": "笔记",
    "Flashcards": "闪卡",
    "Quizzes": "测验",
    "Revision Aids": "复习辅助",
    "Profile": "个人资料",
    "Settings": "设置",
    "Log out": "退出登录",
    "No performance data yet": "暂无表现数据",
    "Complete a few quizzes to unlock your dedicated performance analytics.": "完成一些测验即可解锁你的表现分析。",
    "Accuracy Trends": "准确率趋势",
    "Weekly Progress": "每周进度",
    "Topic Engagement Distribution": "主题参与分布",
    "Peak Study Times": "最佳学习时段",
    "Personalized Recommendations": "个性化建议",
  },
};

const GLOBAL_WORD_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {},
  es: {
    "learning": "aprendizaje",
    "study": "estudio",
    "insights": "información",
    "performance": "rendimiento",
    "accuracy": "precisión",
    "progress": "progreso",
    "weekly": "semanal",
    "topic": "tema",
    "topics": "temas",
    "engagement": "participación",
    "distribution": "distribución",
    "recommendations": "recomendaciones",
    "settings": "configuración",
    "profile": "perfil",
    "logout": "cerrar sesión",
    "log": "cerrar",
    "out": "sesión",
    "cards": "tarjetas",
    "quiz": "cuestionario",
    "quizzes": "cuestionarios",
    "notes": "notas",
    "dashboard": "panel",
    "data": "datos",
    "quality": "calidad",
    "controls": "controles",
    "guide": "guía",
    "strength": "fortaleza",
    "strengths": "fortalezas",
    "improvement": "mejora",
    "areas": "áreas",
    "difficulty": "dificultad",
    "trends": "tendencias",
    "time": "tiempo",
    "minutes": "minutos",
    "sessions": "sesiones",
    "streak": "racha",
    "current": "actual",
    "best": "mejor",
    "search": "buscar",
    "notifications": "notificaciones",
  },
  fr: {
    "learning": "apprentissage",
    "study": "étude",
    "insights": "aperçus",
    "performance": "performance",
    "accuracy": "précision",
    "progress": "progrès",
    "weekly": "hebdomadaire",
    "topic": "sujet",
    "topics": "sujets",
    "engagement": "engagement",
    "distribution": "répartition",
    "recommendations": "recommandations",
    "settings": "paramètres",
    "profile": "profil",
    "logout": "déconnexion",
    "cards": "cartes",
    "quiz": "quiz",
    "quizzes": "quiz",
    "notes": "notes",
    "dashboard": "tableau",
    "data": "données",
    "quality": "qualité",
    "controls": "contrôles",
    "guide": "guide",
    "strength": "force",
    "strengths": "forces",
    "improvement": "amélioration",
    "areas": "zones",
    "difficulty": "difficulté",
    "trends": "tendances",
    "time": "temps",
    "minutes": "minutes",
    "sessions": "sessions",
    "streak": "série",
    "current": "actuel",
    "best": "meilleur",
    "search": "rechercher",
    "notifications": "notifications",
  },
  de: {
    "learning": "lernen",
    "study": "studium",
    "insights": "einblicke",
    "performance": "leistung",
    "accuracy": "genauigkeit",
    "progress": "fortschritt",
    "weekly": "wöchentlich",
    "topic": "thema",
    "topics": "themen",
    "engagement": "engagement",
    "distribution": "verteilung",
    "recommendations": "empfehlungen",
    "settings": "einstellungen",
    "profile": "profil",
    "logout": "abmelden",
    "cards": "karten",
    "quiz": "quiz",
    "quizzes": "quizze",
    "notes": "notizen",
    "dashboard": "dashboard",
    "data": "daten",
    "quality": "qualität",
    "controls": "steuerungen",
    "guide": "leitfaden",
    "strength": "stärke",
    "strengths": "stärken",
    "improvement": "verbesserung",
    "areas": "bereiche",
    "difficulty": "schwierigkeit",
    "trends": "trends",
    "time": "zeit",
    "minutes": "minuten",
    "sessions": "sitzungen",
    "streak": "serie",
    "current": "aktuell",
    "best": "beste",
    "search": "suche",
    "notifications": "benachrichtigungen",
  },
  zh: {
    "learning": "学习",
    "study": "学习",
    "insights": "洞察",
    "performance": "表现",
    "accuracy": "准确率",
    "progress": "进度",
    "weekly": "每周",
    "topic": "主题",
    "topics": "主题",
    "engagement": "参与",
    "distribution": "分布",
    "recommendations": "建议",
    "settings": "设置",
    "profile": "个人资料",
    "logout": "退出登录",
    "cards": "卡片",
    "quiz": "测验",
    "quizzes": "测验",
    "notes": "笔记",
    "dashboard": "仪表盘",
    "data": "数据",
    "quality": "质量",
    "controls": "控制",
    "guide": "指南",
    "strength": "优势",
    "strengths": "优势",
    "improvement": "提升",
    "areas": "领域",
    "difficulty": "难度",
    "trends": "趋势",
    "time": "时间",
    "minutes": "分钟",
    "sessions": "会话",
    "streak": "连续",
    "current": "当前",
    "best": "最佳",
    "search": "搜索",
    "notifications": "通知",
  },
};

const originalTextMap = new WeakMap<Text, string>();
const originalAttrMap = new WeakMap<Element, Record<string, string>>();

const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label", "aria-placeholder"];

function preserveWordCase(source: string, translated: string): string {
  if (source.toUpperCase() === source) {
    return translated.toUpperCase();
  }
  if (source[0] && source[0] === source[0].toUpperCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  return translated;
}

function translateString(input: string, language: AppLanguage): string {
  if (!input || language === "en") {
    return input;
  }

  const phraseTranslations = GLOBAL_PHRASE_TRANSLATIONS[language] || {};
  const wordTranslations = GLOBAL_WORD_TRANSLATIONS[language] || {};

  const exact = phraseTranslations[input];
  if (exact) {
    return exact;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return input;
  }

  const directTrimmed = phraseTranslations[trimmed];
  if (directTrimmed) {
    return input.replace(trimmed, directTrimmed);
  }

  return input.replace(/\b[\p{L}'][\p{L}'-]*\b/gu, (word) => {
    const replacement = wordTranslations[word.toLowerCase()];
    if (!replacement) {
      return word;
    }
    return preserveWordCase(word, replacement);
  });
}

function shouldSkipNode(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) {
    return true;
  }

  const tag = parent.tagName;
  if (["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"].includes(tag)) {
    return true;
  }

  if (parent.closest("[data-no-translate='true']")) {
    return true;
  }

  return false;
}

function applyTextTranslation(node: Text, language: AppLanguage) {
  if (shouldSkipNode(node)) {
    return;
  }

  if (!originalTextMap.has(node)) {
    originalTextMap.set(node, node.nodeValue || "");
  }

  const original = originalTextMap.get(node) || "";
  const translated = translateString(original, language);
  if (node.nodeValue !== translated) {
    node.nodeValue = translated;
  }
}

function applyAttributeTranslation(element: Element, language: AppLanguage) {
  if (["INPUT", "TEXTAREA"].includes(element.tagName) && (element as HTMLInputElement).type === "password") {
    return;
  }

  let originalAttrs = originalAttrMap.get(element);
  if (!originalAttrs) {
    originalAttrs = {};
    TRANSLATABLE_ATTRS.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (value) {
        originalAttrs![attr] = value;
      }
    });
    originalAttrMap.set(element, originalAttrs);
  }

  Object.entries(originalAttrs).forEach(([attr, value]) => {
    const translated = translateString(value, language);
    if (element.getAttribute(attr) !== translated) {
      element.setAttribute(attr, translated);
    }
  });
}

function translateSubtree(root: Node, language: AppLanguage) {
  if (root.nodeType === Node.TEXT_NODE) {
    applyTextTranslation(root as Text, language);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  applyAttributeTranslation(root as Element, language);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  while (currentNode) {
    applyTextTranslation(currentNode as Text, language);
    currentNode = walker.nextNode();
  }

  const allElements = (root as Element).querySelectorAll("*");
  allElements.forEach((element) => applyAttributeTranslation(element, language));
}

type AppLanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
};

const AppLanguageContext = createContext<AppLanguageContextValue | undefined>(undefined);

// Checks whether a stored language code is supported.
function isAppLanguage(value: string): value is AppLanguage {
  return ["en", "es", "fr", "de", "zh"].includes(value);
}

// Provides the active language and keeps translations in sync.
export function AppLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isAppLanguage(stored)) return stored;
    return "en";
  });

    // Updates the active language.
    const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) {
      return;
    }

    translateSubtree(root, language);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((addedNode) => {
          translateSubtree(addedNode, language);
        });
      });
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
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

// Returns the active language helper.
export function useAppLanguage() {
  const context = useContext(AppLanguageContext);
  if (!context) {
    throw new Error("useAppLanguage must be used within AppLanguageProvider");
  }
  return context;
}
