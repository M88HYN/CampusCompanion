# Code Citations

## License: MIT
https://github.com/SenexCrenshaw/StreamMaster/blob/5a2704bd52d6449ba418c50a8e5e5711ba2cc1d3/streammasterwebui/src/common/colors.tsx

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math
```


## License: MIT
https://github.com/SenexCrenshaw/StreamMaster/blob/5a2704bd52d6449ba418c50a8e5e5711ba2cc1d3/streammasterwebui/src/common/colors.tsx

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math
```


## License: unknown
https://github.com/MoSalah1992/mosque123/blob/0cd260ecc0e5ee60ea471ce3d32a42d89ff091ae/src/app/components/private-files/general/general.component.ts

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pick
```


## License: MIT
https://github.com/SenexCrenshaw/StreamMaster/blob/5a2704bd52d6449ba418c50a8e5e5711ba2cc1d3/streammasterwebui/src/common/colors.tsx

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math
```


## License: unknown
https://github.com/MoSalah1992/mosque123/blob/0cd260ecc0e5ee60ea471ce3d32a42d89ff091ae/src/app/components/private-files/general/general.component.ts

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pick
```


## License: MIT
https://github.com/SenexCrenshaw/StreamMaster/blob/5a2704bd52d6449ba418c50a8e5e5711ba2cc1d3/streammasterwebui/src/common/colors.tsx

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math
```


## License: unknown
https://github.com/MoSalah1992/mosque123/blob/0cd260ecc0e5ee60ea471ce3d32a42d89ff091ae/src/app/components/private-files/general/general.component.ts

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pick
```


## License: MIT
https://github.com/SenexCrenshaw/StreamMaster/blob/5a2704bd52d6449ba418c50a8e5e5711ba2cc1d3/streammasterwebui/src/common/colors.tsx

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math
```


## License: unknown
https://github.com/MoSalah1992/mosque123/blob/0cd260ecc0e5ee60ea471ce3d32a42d89ff091ae/src/app/components/private-files/general/general.component.ts

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pick
```


## License: MIT
https://github.com/SenexCrenshaw/StreamMaster/blob/5a2704bd52d6449ba418c50a8e5e5711ba2cc1d3/streammasterwebui/src/common/colors.tsx

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math
```


## License: unknown
https://github.com/MoSalah1992/mosque123/blob/0cd260ecc0e5ee60ea471ce3d32a42d89ff091ae/src/app/components/private-files/general/general.component.ts

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pick
```


## License: MIT
https://github.com/SenexCrenshaw/StreamMaster/blob/5a2704bd52d6449ba418c50a8e5e5711ba2cc1d3/streammasterwebui/src/common/colors.tsx

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math
```


## License: unknown
https://github.com/MoSalah1992/mosque123/blob/0cd260ecc0e5ee60ea471ce3d32a42d89ff091ae/src/app/components/private-files/general/general.component.ts

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pick
```


## License: MIT
https://github.com/SenexCrenshaw/StreamMaster/blob/5a2704bd52d6449ba418c50a8e5e5711ba2cc1d3/streammasterwebui/src/common/colors.tsx

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math
```


## License: unknown
https://github.com/MoSalah1992/mosque123/blob/0cd260ecc0e5ee60ea471ce3d32a42d89ff091ae/src/app/components/private-files/general/general.component.ts

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pick
```


## License: MIT
https://github.com/SenexCrenshaw/StreamMaster/blob/5a2704bd52d6449ba418c50a8e5e5711ba2cc1d3/streammasterwebui/src/common/colors.tsx

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math
```


## License: unknown
https://github.com/MoSalah1992/mosque123/blob/0cd260ecc0e5ee60ea471ce3d32a42d89ff091ae/src/app/components/private-files/general/general.component.ts

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pick
```


## License: MIT
https://github.com/SenexCrenshaw/StreamMaster/blob/5a2704bd52d6449ba418c50a8e5e5711ba2cc1d3/streammasterwebui/src/common/colors.tsx

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math
```


## License: unknown
https://github.com/MoSalah1992/mosque123/blob/0cd260ecc0e5ee60ea471ce3d32a42d89ff091ae/src/app/components/private-files/general/general.component.ts

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pick
```


## License: unknown
https://github.com/jeffpar/pcjs/blob/27d6f5d5a023f20b19ab5509b6f835bedc2ee155/documents/books/mspl13/msj/msj2/README.md

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pickFromArray<T>(arr: T[], hash: number, index: number = 0): T {
  return arr[(hash + index) % arr.length];
}

// ── Source Generation ──────────────────────────────────────────────────────────

function generateSources(query: string, depth: string
```


## License: unknown
https://github.com/jeffpar/pcjs/blob/27d6f5d5a023f20b19ab5509b6f835bedc2ee155/documents/books/mspl13/msj/msj2/README.md

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pickFromArray<T>(arr: T[], hash: number, index: number = 0): T {
  return arr[(hash + index) % arr.length];
}

// ── Source Generation ──────────────────────────────────────────────────────────

function generateSources(query: string, depth: string
```


## License: unknown
https://github.com/jeffpar/pcjs/blob/27d6f5d5a023f20b19ab5509b6f835bedc2ee155/documents/books/mspl13/msj/msj2/README.md

```


Let me check the current state of the insight-scout files to see what's happening:

Let me see the full file:

Let me see the rest:

Let me see the rest of the mock response generator:

Now let me check the client-side parsing:

Let me see the full client component:

Let me see more of the component, especially the parsing and rendering:

Let me see the rendering part:

Let me see the card rendering:

Now let me check what the streaming endpoint returns vs what the client expects:

Let me see the streaming route:

Now I understand the full flow. Let me check the actual issue - the streaming response vs what the client parses:

The issue is clear. The client's `parseInsightSections` uses regex to split content by `**Key Insight**`, `**Explanation**`, etc. But the mock response generator might not be formatting these headers exactly as the regex expects. Let me verify:

Now let me see the regex parsing:

I can see the problem now. Let me trace through the full flow:

1. Server streams word-by-word via SSE
2. Client accumulates `streamedContent` string
3. When done, client calls `parseInsightSections(streamedContent)` 
4. Parser uses regex like `/\*\*Key Insight:?\*\*/i` to split sections

The issue is that `generateMockResponse` builds content with headers like `**Key Insight:**` but the accumulated stream might have formatting issues, OR the sections aren't being parsed correctly because the regex doesn't match the actual output.

Let me look at what `generateMockResponse` actually returns for different intents and queries:

Let me check the actual mock content more carefully - specifically what gets returned for each intent:

Now let me see the full generateMockResponse with all the intent-specific generators:

Let me see the exam prep generator:

Let me see ALL the generator functions:

Let me see the rest:

Let me look at all generator functions to understand the full picture:

Now I have the complete picture. The problem is:

1. **Every query gets the SAME response** for a given intent because the generators use hardcoded text without incorporating the actual query topic
2. **The content is generic** - it doesn't reference the user's actual question
3. **The fallback `generateFallbackContent`** adds some variation via hash but it's still very generic

Let me also check the knowledge base and topic matching:

Now I see it all. Let me check one more thing - the streaming handler:

I now have the complete picture of all issues:

1. **Knowledge base topics** return good content but only for 7 hardcoded topics
2. **Fallback content** is generic and doesn't reference the user's query
3. **Intent-specific generators** (`generateExamPrepResponse`, etc.) use the `topic` variable but the content is still largely templated
4. **The section headers** need to exactly match what the client parser expects

Let me rewrite the entire `insight-scout.ts` to fix all these issues:

````typescript
// filepath: c:\Users\mahin\Downloads\CampusCompanion\server\insight-scout.ts
/**
 * Insight Scout - Academic Research Assistant
 * Generates structured, intent-aware responses for student queries
 * Falls back to mock responses when OpenAI API key is unavailable
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface InsightResult {
  id: string;
  title: string;
  query: string;
  keyInsight: string;
  sections: {
    explanation: string;
    examples: string;
    commonMistakes: string;
    examRelevance: string;
  };
  sources: SearchResult[];
  processingTime: number;
  searchDepth: string;
  responseType: string;
  studyIntent: string;
  timestamp: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
}

function generateTitle(query: string): string {
  const cleaned = query.replace(/[?!.]+$/, "").trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 57) + "...";
}

function extractTopic(query: string): string {
  // Remove question words and clean up to get the core topic
  return query
    .replace(/^(what|how|why|when|where|who|which|explain|describe|define|discuss|analyze|compare|contrast|evaluate|assess|examine|illustrate|outline|summarize|is|are|was|were|do|does|did|can|could|would|should|tell me about|give me|i need|i want|help me with|help me understand)\s+/i, "")
    .replace(/[?!.]+$/, "")
    .replace(/^(the|a|an)\s+/i, "")
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function pickFromArray<T>(arr: T[], hash: number, index: number = 0): T {
  return arr[(hash + index) % arr.length];
}

// ── Source Generation ──────────────────────────────────────────────────────────

function generateSources(query: string, depth: string
```

