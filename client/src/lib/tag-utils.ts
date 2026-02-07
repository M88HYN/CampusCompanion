/**
 * Safely normalizes tags from any input format to a string[]
 * Handles various backend response formats without throwing errors
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
