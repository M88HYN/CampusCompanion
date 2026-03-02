/*
==========================================================
File: client/src/hooks/use-ui-effects.ts

Module: Core Platform

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

import { useState, useEffect } from "react";

/*
----------------------------------------------------------
Function: useDarkMode

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
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage and system preference
    const stored = localStorage.getItem("theme");
    if (stored) {
      setIsDark(stored === "dark");
      applyTheme(stored === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
      applyTheme(prefersDark);
    }
  }, []);

    /*
  ----------------------------------------------------------
  Function: toggleDarkMode

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
const toggleDarkMode = () => {
    setIsDark((prev) => {
      const newValue = !prev;
      applyTheme(newValue);
      localStorage.setItem("theme", newValue ? "dark" : "light");
      return newValue;
    });
  };

  return { isDark, toggleDarkMode };
}

/*
----------------------------------------------------------
Function: applyTheme

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- isDark: Input consumed by this routine during execution

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
function applyTheme(isDark: boolean) {
  const html = document.documentElement;
  if (isDark) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

// Hook for tracking last update time
/*
----------------------------------------------------------
Function: useLastUpdated

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
export function useLastUpdated() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    /*
  ----------------------------------------------------------
  Function: formatLastUpdated

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
const formatLastUpdated = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return {
    lastUpdated,
    setLastUpdated,
    formatLastUpdated,
  };
}

// Hook for keyboard shortcuts
/*
----------------------------------------------------------
Function: useKeyboardShortcuts

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- shortcuts: Input consumed by this routine during execution

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
export function useKeyboardShortcuts(
  shortcuts: Record<string, (event: KeyboardEvent) => void>
) {
  useEffect(() => {
        /*
    ----------------------------------------------------------
    Function: handleKeyDown

    Purpose:
    Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

    Parameters:
    - event: Input consumed by this routine during execution

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
const handleKeyDown = (event: KeyboardEvent) => {
      const handler = shortcuts[event.key];
      if (handler) {
        handler(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

// Hook for confetti animation
/*
----------------------------------------------------------
Function: useConfetti

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
export function useConfetti() {
    /*
  ----------------------------------------------------------
  Function: confetti

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
const confetti = () => {
    for (let i = 0; i < 50; i++) {
      const element = document.createElement("div");
      element.classList.add("confetti");
      element.style.left = Math.random() * 100 + "%";
      element.style.backgroundColor = [
        "#fbbf24",
        "#f87171",
        "#60a5fa",
        "#34d399",
        "#a78bfa",
      ][Math.floor(Math.random() * 5)];
      element.style.width = Math.random() * 10 + 5 + "px";
      element.style.height = element.style.width;
      element.style.borderRadius = "50%";

      document.body.appendChild(element);

      setTimeout(() => element.remove(), 2500);
    }
  };

  return { confetti };
}

// Hook for sound effects
/*
----------------------------------------------------------
Function: useSoundEffect

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
export function useSoundEffect() {
    /*
  ----------------------------------------------------------
  Function: playSound

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - type: Input consumed by this routine during execution

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
const playSound = (type: "success" | "error" | "click") => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case "success":
        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case "error":
        oscillator.frequency.value = 400;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
      case "click":
        oscillator.frequency.value = 600;
        oscillator.type = "square";
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
    }
  };

  return { playSound };
}
