const prompts = [
  {
    query: "Explain the light-dependent and Calvin cycle stages of photosynthesis with one exam-style trick question.",
    studyIntent: "exam_prep",
    responseType: "explanation",
    searchDepth: "balanced",
  },
  {
    query: "Compare arrays, linked lists, and hash tables for insertion, lookup, and memory tradeoffs.",
    studyIntent: "deep_understanding",
    responseType: "comparison",
    searchDepth: "comprehensive",
  },
  {
    query: "Give me a concise summary of natural selection with two misconceptions students often make.",
    studyIntent: "revision_recall",
    responseType: "summary",
    searchDepth: "balanced",
  },
  {
    query: "How should I structure a 1500-word assignment on machine learning ethics with critical analysis?",
    studyIntent: "assignment_writing",
    responseType: "analysis",
    searchDepth: "comprehensive",
  },
  {
    query: "What are practical examples of supply and demand in housing and labor markets?",
    studyIntent: "deep_understanding",
    responseType: "examples",
    searchDepth: "balanced",
  },
  {
    query: "What common mistakes do students make with binary search and Big-O notation?",
    studyIntent: "exam_prep",
    responseType: "mistakes",
    searchDepth: "balanced",
  },
];

async function runPrompt(prompt) {
  const response = await fetch("http://localhost:3000/api/research/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prompt),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status} for query: ${prompt.query}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let remainder = "";
  let content = "";
  let source = "unknown";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    remainder += decoder.decode(value, { stream: true });
    const lines = remainder.split("\n");
    remainder = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      const payload = line.slice(6).trim();
      if (!payload) continue;

      try {
        const data = JSON.parse(payload);
        if (typeof data.content === "string") content += data.content;
        if (data.done && typeof data.source === "string") source = data.source;
      } catch {
        // Ignore partial/incomplete SSE JSON chunks
      }
    }
  }

  const preview = content.replace(/\s+/g, " ").trim().slice(0, 180);
  return {
    query: prompt.query,
    source,
    length: content.length,
    preview,
  };
}

function summarizeDiversity(results) {
  const uniquePreviews = new Set(results.map((r) => r.preview.toLowerCase()));
  const sourceCounts = results.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {});

  return {
    total: results.length,
    uniquePreviews: uniquePreviews.size,
    sourceCounts,
  };
}

(async () => {
  console.log("Running Insight Scout smoke test with diverse prompts...\n");

  const results = [];
  for (const prompt of prompts) {
    const result = await runPrompt(prompt);
    results.push(result);
    console.log(`Prompt: ${result.query}`);
    console.log(`Source: ${result.source}`);
    console.log(`Length: ${result.length}`);
    console.log(`Preview: ${result.preview}`);
    console.log("-".repeat(100));
  }

  const summary = summarizeDiversity(results);
  console.log("\nSummary:");
  console.log(JSON.stringify(summary, null, 2));

  if (summary.uniquePreviews <= Math.floor(summary.total / 2)) {
    console.warn("⚠️ Diversity check warning: many outputs look too similar.");
    process.exitCode = 2;
  } else {
    console.log("✅ Diversity check passed: outputs are meaningfully different across prompts.");
  }
})();
