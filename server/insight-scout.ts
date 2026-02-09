import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "sk-test-key",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const researchQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  searchDepth: z.enum(["quick", "balanced", "comprehensive"]).default("balanced"),
  responseType: z.enum(["explanation", "summary", "comparison", "analysis", "examples", "study_tips", "mistakes"]).default("explanation"),
  studyIntent: z.enum(["exam_prep", "deep_understanding", "assignment_writing", "revision_recall", "quick_clarification"]).default("deep_understanding"),
  conversationId: z.string().nullable().optional(),
});

const SYSTEM_PROMPT = `You are Insight Scout, an intelligent educational research assistant designed specifically for university students. Your mission is to support learning, coursework, and revision with accurate, well-structured, academically relevant content.

## Your Capabilities:
1. **Explain Concepts**: Break down complex topics into clear, understandable explanations with step-by-step reasoning
2. **Summarize Topics**: Provide concise, well-organized summaries highlighting key points and takeaways
3. **Compare & Contrast**: Analyze similarities and differences between theories, technologies, or concepts
4. **Analyze In-Depth**: Provide comprehensive analysis including implications, significance, and critical perspectives
5. **Real-World Examples**: Connect academic concepts to practical, real-world applications
6. **Study Tips**: Offer effective study strategies, memory techniques, and learning approaches
7. **Common Mistakes**: Identify frequent misconceptions and errors students make

## Response Guidelines:
- Structure responses with clear headings and bullet points for readability
- Use analogies and examples appropriate for university-level understanding
- For technical concepts, include brief code examples or formulas when relevant
- Cite your reasoning and explain the "why" behind concepts
- Be academically rigorous while remaining accessible
- Acknowledge limitations when topics are outside your knowledge base

## Formatting Standards:
- Use **bold** for key terms and important concepts
- Use bullet points for lists of related items
- Use numbered lists for sequential steps or ranked items
- Include section headers for longer responses
- Provide brief summaries at the end of comprehensive responses

Your responses should be suitable for university coursework, exam preparation, and academic research.`;

type ResearchQuery = z.infer<typeof researchQuerySchema>;

export function registerInsightScoutRoutes(app: Express): void {
  // Conversation management endpoints moved to routes.ts
  // Only keep the query endpoint here

  app.post("/api/research/query", async (req: Request, res: Response) => {
    try {
      const parseResult = researchQuerySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0]?.message || "Invalid request" });
      }
      
      const { query, searchDepth, responseType, studyIntent, conversationId } = parseResult.data;
      let convoId = conversationId || "temp-" + Math.random().toString(36).substring(7);
      
      // For now, skip database storage and just return a stub response
      const depthInstruction = {
        quick: "Provide a brief, focused answer in 2-3 paragraphs.",
        balanced: "Provide a well-structured answer with appropriate depth.",
        comprehensive: "Provide an in-depth, thorough response with examples, explanations, and related concepts.",
      }[searchDepth];

      const intentInstruction = {
        exam_prep: "The student is preparing for exams. Focus on key testable concepts, mark scheme points, potential exam questions, and concise revision-friendly formatting. Highlight what examiners look for.",
        deep_understanding: "The student wants to deeply understand this topic. Provide thorough explanations, underlying principles, connections to related concepts, and build intuition step by step.",
        assignment_writing: "The student is writing an assignment. Provide academically rigorous content suitable for essays or reports, with structured arguments, evidence-based reasoning, and proper academic framing.",
        revision_recall: "The student is revising. Provide concise, memorable summaries with mnemonics, key definitions, and quick-reference material. Focus on retention and recall aids.",
        quick_clarification: "The student needs a quick clarification. Be concise and direct. Answer the specific question without unnecessary elaboration. Get straight to the point.",
      }[studyIntent];

      const typeInstruction = {
        explanation: "Provide a detailed explanation of this concept with step-by-step reasoning. Break down complex ideas into understandable parts and use clear examples.",
        summary: "Provide a concise, well-organized summary highlighting the key points, main ideas, and essential takeaways. Keep it focused and academically relevant.",
        comparison: "Compare and contrast the relevant concepts, theories, or technologies. Create a structured analysis showing similarities, differences, advantages, and disadvantages.",
        analysis: "Provide an in-depth analysis discussing implications, applications, significance, and critical perspectives. Include academic context where relevant.",
        examples: "Provide multiple real-world examples and practical applications of this concept. Show how it applies in industry, research, or everyday situations with specific cases.",
        study_tips: "Provide effective study strategies and tips for learning this topic. Include memory techniques, practice approaches, key areas to focus on, and how to approach exam questions.",
        mistakes: "Identify common mistakes, misconceptions, and errors students make with this topic. Explain why these mistakes happen and how to avoid them. Include correct approaches.",
      }[responseType];

      const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${depthInstruction} ${typeInstruction}\n\nStudent's study intent: ${intentInstruction}\n\nStructure your response with these clearly labeled sections where applicable:\n1. **Key Insight** — A bold one-sentence summary of the main takeaway\n2. **Explanation** — The detailed answer\n3. **Examples** — Concrete examples or applications\n4. **Common Mistakes** — Pitfalls to avoid\n5. **Exam Relevance** — How this might appear in exams\n\nQuery: ${query}` },
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: searchDepth === "comprehensive" ? 4096 : searchDepth === "quick" ? 1024 : 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, conversationId: convoId })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing research query:", error);
      
      let errorMessage = "Failed to process research query";
      if (error instanceof Error) {
        if (error.message.includes("getaddrinfo") || error.message.includes("ENOTFOUND")) {
          errorMessage = "Network error: Unable to reach external services. Please check your connection.";
        } else if (error.message.includes("401") || error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorMessage = "Authentication error: Invalid API credentials configured.";
        } else if (error.message.includes("429")) {
          errorMessage = "Rate limit exceeded: Too many requests. Please try again later.";
        } else if (error.message.includes("model") || error.message.includes("does not exist")) {
          errorMessage = "Model error: The configured AI model is not available.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  app.post("/api/research/create-flashcard", async (req: Request, res: Response) => {
    try {
      const { front, back, deckId } = req.body;
      
      if (!front || !back) {
        return res.status(400).json({ error: "Front and back content are required" });
      }

      res.json({ 
        success: true, 
        message: "Flashcard created from research",
        flashcard: { front, back, deckId }
      });
    } catch (error) {
      console.error("Error creating flashcard from research:", error);
      res.status(500).json({ error: "Failed to create flashcard" });
    }
  });

  app.post("/api/research/create-quiz-question", async (req: Request, res: Response) => {
    try {
      const { question, options, quizId, explanation } = req.body;
      
      if (!question || !options) {
        return res.status(400).json({ error: "Question and options are required" });
      }

      res.json({ 
        success: true, 
        message: "Quiz question created from research",
        question: { question, options, quizId, explanation }
      });
    } catch (error) {
      console.error("Error creating quiz question from research:", error);
      res.status(500).json({ error: "Failed to create quiz question" });
    }
  });
}
