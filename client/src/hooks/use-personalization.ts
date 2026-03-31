import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export type PreferredTheme = "light" | "dark";

export interface PersonalizationPreferences {
  preferredTheme: PreferredTheme;
  dailyStudyGoalMinutes: number;
  preferredSubjects: string[];
  remindersEnabled: boolean;
  studyPromptsEnabled: boolean;
  focusStyle: "balanced" | "quiz-first" | "flashcard-first";
  bookmarkedNoteIds: string[];
}

const DEFAULT_PERSONALIZATION: PersonalizationPreferences = {
  preferredTheme: "light",
  dailyStudyGoalMinutes: 60,
  preferredSubjects: [],
  remindersEnabled: true,
  studyPromptsEnabled: true,
  focusStyle: "balanced",
  bookmarkedNoteIds: [],
};

function safeParsePreferences(raw: string | null): PersonalizationPreferences {
  if (!raw) return DEFAULT_PERSONALIZATION;
  try {
    const parsed = JSON.parse(raw) as Partial<PersonalizationPreferences>;
    return {
      preferredTheme: parsed.preferredTheme === "dark" ? "dark" : "light",
      dailyStudyGoalMinutes:
        typeof parsed.dailyStudyGoalMinutes === "number" && parsed.dailyStudyGoalMinutes > 0
          ? Math.min(600, Math.max(15, Math.round(parsed.dailyStudyGoalMinutes)))
          : DEFAULT_PERSONALIZATION.dailyStudyGoalMinutes,
      preferredSubjects: Array.isArray(parsed.preferredSubjects)
        ? parsed.preferredSubjects.filter((item): item is string => typeof item === "string")
        : [],
      remindersEnabled:
        typeof parsed.remindersEnabled === "boolean"
          ? parsed.remindersEnabled
          : DEFAULT_PERSONALIZATION.remindersEnabled,
      studyPromptsEnabled:
        typeof parsed.studyPromptsEnabled === "boolean"
          ? parsed.studyPromptsEnabled
          : DEFAULT_PERSONALIZATION.studyPromptsEnabled,
      focusStyle:
        parsed.focusStyle === "quiz-first" || parsed.focusStyle === "flashcard-first"
          ? parsed.focusStyle
          : "balanced",
      bookmarkedNoteIds: Array.isArray(parsed.bookmarkedNoteIds)
        ? parsed.bookmarkedNoteIds.filter((item): item is string => typeof item === "string")
        : [],
    };
  } catch {
    return DEFAULT_PERSONALIZATION;
  }
}

export function usePersonalization() {
  const { user } = useAuth();
  const storageKey = useMemo(() => {
    const id = user?.id || user?.email || "guest";
    return `personalization:${id}`;
  }, [user?.id, user?.email]);

  const [preferences, setPreferences] = useState<PersonalizationPreferences>(() =>
    safeParsePreferences(localStorage.getItem(storageKey))
  );

  useEffect(() => {
    setPreferences(safeParsePreferences(localStorage.getItem(storageKey)));
  }, [storageKey]);

  const persistPreferences = (next: PersonalizationPreferences) => {
    setPreferences(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const updatePreferences = (updates: Partial<PersonalizationPreferences>) => {
    persistPreferences({ ...preferences, ...updates });
  };

  const togglePreferredSubject = (subject: string) => {
    const alreadyPreferred = preferences.preferredSubjects.includes(subject);
    const preferredSubjects = alreadyPreferred
      ? preferences.preferredSubjects.filter((item) => item !== subject)
      : [...preferences.preferredSubjects, subject];
    updatePreferences({ preferredSubjects });
  };

  const toggleBookmarkedNote = (noteId: string) => {
    const exists = preferences.bookmarkedNoteIds.includes(noteId);
    const bookmarkedNoteIds = exists
      ? preferences.bookmarkedNoteIds.filter((item) => item !== noteId)
      : [...preferences.bookmarkedNoteIds, noteId];
    updatePreferences({ bookmarkedNoteIds });
  };

  return {
    preferences,
    updatePreferences,
    togglePreferredSubject,
    toggleBookmarkedNote,
  };
}
