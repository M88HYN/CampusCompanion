import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { db } from "./db";
import { conversations, messages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const researchQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  searchDepth: z.enum(["quick", "balanced", "comprehensive"]).default("balanced"),
  responseType: z.enum(["explanation", "summary", "comparison", "analysis"]).default("explanation"),
  conversationId: z.number().optional(),
});

const SYSTEM_PROMPT = `You are Insight Scout, an intelligent educational research assistant designed for university students. Your role is to:

1. Provide accurate, well-researched explanations of academic concepts
2. Give clear definitions with examples relevant to computer science and other subjects
3. Summarize complex topics in an accessible way
4. Compare and contrast related concepts
5. Suggest study strategies and common pitfalls to avoid

Guidelines:
- Always cite your reasoning and explain concepts step-by-step
- Use analogies and real-world examples when helpful
- Structure responses with clear headings when appropriate
- For code concepts, include brief code examples when relevant
- Be concise but thorough - adjust depth based on the question complexity
- If asked about something outside your knowledge, acknowledge limitations

You support various response types:
- Explanation: Detailed breakdown of concepts
- Summary: Concise overview of topics  
- Comparison: Side-by-side analysis of related concepts
- Analysis: Deep dive into implications and applications

Respond in a helpful, educational tone suitable for university-level learners.`;

type ResearchQuery = z.infer<typeof researchQuerySchema>;

export function registerInsightScoutRoutes(app: Express): void {
  app.get("/api/research/conversations", async (req: Request, res: Response) => {
    try {
      const allConversations = await db.select().from(conversations).orderBy(desc(conversations.createdAt));
      res.json(allConversations);
    } catch (error) {
      console.error("Error fetching research conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/research/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const conversationMessages = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
      res.json({ ...conversation, messages: conversationMessages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/research/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const [conversation] = await db.insert(conversations).values({ title: title || "New Research Session" }).returning();
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/research/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      await db.delete(messages).where(eq(messages.conversationId, id));
      await db.delete(conversations).where(eq(conversations.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/research/query", async (req: Request, res: Response) => {
    try {
      const parseResult = researchQuerySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0]?.message || "Invalid request" });
      }
      
      const { query, searchDepth, responseType, conversationId } = parseResult.data;
      let convoId = conversationId;
      
      if (!convoId) {
        const titleWords = query.split(" ").slice(0, 5).join(" ");
        const [newConvo] = await db.insert(conversations).values({ 
          title: titleWords.length > 50 ? titleWords.substring(0, 50) + "..." : titleWords 
        }).returning();
        convoId = newConvo.id;
      }

      await db.insert(messages).values({
        conversationId: convoId,
        role: "user",
        content: query,
      });

      const existingMessages = await db.select().from(messages).where(eq(messages.conversationId, convoId)).orderBy(messages.createdAt);
      
      const depthInstruction = {
        quick: "Provide a brief, focused answer in 2-3 paragraphs.",
        balanced: "Provide a well-structured answer with appropriate depth.",
        comprehensive: "Provide an in-depth, thorough response with examples, explanations, and related concepts.",
      }[searchDepth];

      const typeInstruction = {
        explanation: "Explain this concept clearly with step-by-step reasoning.",
        summary: "Summarize this topic concisely, highlighting key points.",
        comparison: "Compare and contrast the relevant concepts, noting similarities and differences.",
        analysis: "Analyze this topic in depth, discussing implications and applications.",
      }[responseType];

      const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...existingMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: `${depthInstruction} ${typeInstruction}\n\nQuery: ${query}` },
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
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

      await db.insert(messages).values({
        conversationId: convoId,
        role: "assistant",
        content: fullResponse,
      });

      res.write(`data: ${JSON.stringify({ done: true, conversationId: convoId })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing research query:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process query" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process research query" });
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
