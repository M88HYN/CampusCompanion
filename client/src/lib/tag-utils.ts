/*
==========================================================
File: client/src/lib/tag-utils.ts

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

/**
 * Safely normalizes tags from any input format to a string[]
 * Handles various backend response formats without throwing errors
 */
/*
----------------------------------------------------------
Function: normalizeTags

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- input: Input consumed by this routine during execution

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
export function normalizeTags(input: unknown): string[] {
  // Already an array
  if (Array.isArray(input)) {
    return input
      .map(item => String(item).trim())
      .filter(item => item.length > 0);
  }

  // null or undefined
  if (input === null || input === undefined) {
    return [];
  }

  // String input (try parsing as JSON first, then comma-separated)
  if (typeof input === "string") {
    const trimmed = input.trim();
    
    if (trimmed.length === 0) {
      return [];
    }

    // Try parsing as JSON array
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map(item => String(item).trim())
            .filter(item => item.length > 0);
        }
      } catch {
        // Not valid JSON, fall through to comma-separated
      }
    }

    // Treat as comma-separated string
    return trimmed
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  // Object or other type - try to extract values
  if (typeof input === "object") {
    try {
      const values = Object.values(input)
        .map(val => String(val).trim())
        .filter(val => val.length > 0);
      return values;
    } catch {
      // Silently return empty array if extraction fails
      return [];
    }
  }

  // Fallback: empty array
  return [];
}
