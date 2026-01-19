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
  responseType: z.enum(["explanation", "summary", "comparison", "analysis", "examples", "study_tips", "mistakes"]).default("explanation"),
  conversationId: z.number().optional(),
});

const SYSTEM_PROMPT = `You are Insight Scout, an intelligent educational research assistant designed specifically for university students. Your mission is to support learning, coursework, and revision with accurate, well-structured, academically relevant content.

## Your Capabilities:
1. **Explain Concepts**: Break down complex topics into clear, understandable explanations with step-by-step reasoning
2. **Summarize Topics**: Provide concise, well-organized summaries highlighting key points and takeaways
3. **Compare & Contrast**: Analyze similarities and differences between theories, technologies, or concepts
4. **Real-World Examples**: Connect academic concepts to practical, real-world applications
5. **Study Tips**: Offer effective study strategies, memory techniques, and learning approaches
6. **Common Mistakes**: Identify frequent misconceptions and errors students make

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
