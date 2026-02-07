import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  insertNoteSchema, insertNoteBlockSchema,
  insertDeckSchema, insertCardSchema,
  insertQuizSchema, insertQuizQuestionSchema, insertQuizOptionSchema,
  insertQuizAttemptSchema, insertQuizResponseSchema,
  cardReviews
} from "@shared/schema";
import { z } from "zod";
// Removed Replit chat integration import - using standard research endpoints instead
import { registerInsightScoutRoutes } from "./insight-scout";
import { registerAuthRoutes, authMiddleware } from "./auth-routes";
import type { Card } from "@shared/schema";
import type { JWTPayload } from "./auth";

/** Concrete card interface — Drizzle's $inferSelect resolves some SQLite columns as unknown */
interface CardRecord {
  id: string;
  deckId: string;
  type: string;
  front: string;
  back: string;
  imageUrl: string | null;
  clozeText: string | null;
  definition: string | null;
  example: string | null;
  tags: string | null;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueAt: number;
  status: string;
  lastReviewedAt: number | null;
  createdAt: number;
  sourceQuestionId: string | null;
  sourceNoteBlockId: string | null;
}


// Helper to get user ID from authenticated request
function getUserId(req: any): string {
  if (!req.user?.userId) {
    throw new Error("Unauthorized: No user ID found");
  }
  return req.user.userId;
}

// Helper functions for smart card prioritization
function getPriorityReason(card: CardRecord, daysSinceDue: number): string {
  const easeFactor = card.easeFactor ?? 2.5;
  if (daysSinceDue > 7) return "Overdue by more than a week";
  if (daysSinceDue > 0) return "Due for review";
  if (card.status === "new") return "New card - needs initial learning";
  if (easeFactor < 2.0) return "Struggling - needs extra practice";
  if (card.status === "learning") return "Currently learning";
  if (easeFactor < 2.5) return "Needs reinforcement";
  return "Scheduled review";
}

function getUrgencyLevel(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 40) return "critical";
  if (score >= 25) return "high";
  if (score >= 15) return "medium";
  return "low";
}

function getEncouragement(accuracy: number): string {
  if (accuracy >= 90) return "Outstanding! You're mastering this material!";
  if (accuracy >= 80) return "Great work! Keep up the momentum!";
  if (accuracy >= 70) return "Good progress! A little more practice will help.";
  if (accuracy >= 50) return "You're learning! Focus on the concepts you missed.";
  return "Every expert was once a beginner. Keep practicing!";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register auth routes first
  registerAuthRoutes(app);

  // Verify token endpoint
  app.get("/api/auth/verify", authMiddleware, (req: any, res) => {
    res.json({ authenticated: true, user: req.user });
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  
  // ==================== NOTES API ====================
  
  app.get("/api/notes", authMiddleware, async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log("Fetching notes for user:", userId);
      const notes = await storage.getNotes(userId);
      console.log("Notes fetched successfully:", notes.length, "notes found");
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error instanceof Error ? error.message : String(error));
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      }
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", authMiddleware, async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      const blocks = await storage.getNoteBlocks(req.params.id);
      res.json({ ...note, blocks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", authMiddleware, async (req, res) => {
    try {
      console.log("POST /api/notes - Request body:", JSON.stringify(req.body, null, 2));
      const userId = getUserId(req);
      console.log("User ID extracted:", userId);
      
      // Pre-process tags: stringify arrays before Zod validation
      const bodyForValidation = { ...req.body, userId };
      if (Array.isArray(bodyForValidation.tags)) {
        bodyForValidation.tags = JSON.stringify(bodyForValidation.tags);
      }
      
      const noteData = insertNoteSchema.parse(bodyForValidation);
      console.log("Note data after schema validation:", JSON.stringify(noteData, null, 2));
      
      // Use storage layer which handles ID generation, timestamps, and SQLite compatibility
      const note = await storage.createNote(noteData);

      // Safety check (prevents silent 500s)
      if (!note) {
        return res.status(500).json({ error: "Note creation failed" });
      }

      
      if (req.body.blocks && Array.isArray(req.body.blocks)) {
        const blocks = req.body.blocks.map((block: any, index: number) => ({
          noteId: note.id,
          type: block.type || 'paragraph',
          // Ensure content is a string - stringify if it's an object
          content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
          order: index,
          noteType: block.noteType || 'general',
          isExamContent: block.isExamContent || false,
          examPrompt: block.examPrompt || null,
          examMarks: block.examMarks || null,
          keyTerms: block.keyTerms || null,
        }));
        console.log("Creating note blocks:", JSON.stringify(blocks, null, 2));
        await storage.createNoteBlocks(blocks);
      }
      
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating note:", error instanceof Error ? error.message : String(error));
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      }
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.patch("/api/notes/:id", authMiddleware, async (req, res) => {
    try {
      const { blocks, title, subject, tags } = req.body;
      const safeNoteData: { title?: string; subject?: string; tags?: string | null } = {};
      if (title !== undefined) safeNoteData.title = title;
      if (subject !== undefined) safeNoteData.subject = subject;
      if (tags !== undefined) safeNoteData.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags;
      
      const note = await storage.updateNote(req.params.id, safeNoteData);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      if (blocks && Array.isArray(blocks)) {
        await storage.deleteNoteBlocks(req.params.id);
        const newBlocks = blocks.map((block: any, index: number) => ({
          noteId: req.params.id,
          type: block.type || "paragraph",
          content: block.content || "",
          order: index,
        }));
        if (newBlocks.length > 0) {
          await storage.createNoteBlocks(newBlocks);
        }
      }
      
      const updatedBlocks = await storage.getNoteBlocks(req.params.id);
      res.json({ ...note, blocks: updatedBlocks });
    } catch (error) {
      console.error("Update note error:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", authMiddleware, async (req, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // ==================== NOTES AUTO-GENERATION ====================
  
  // Auto-generate quiz from note
  const generateQuizFromNoteSchema = z.object({
    noteId: z.string().min(1),
    title: z.string().optional(),
    questionCount: z.number().min(1).max(20).optional().default(5),
  });
  
  app.post("/api/notes/:id/generate-quiz", authMiddleware, async (req: any, res) => {
    try {
      const parsed = generateQuizFromNoteSchema.safeParse({ ...req.body, noteId: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      
      const { noteId, title, questionCount } = parsed.data;
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      const blocks = await storage.getNoteBlocks(noteId);
      if (blocks.length === 0) {
        return res.status(400).json({ error: "Note has no content to generate quiz from" });
      }
      
      // Create quiz
      const quiz = await storage.createQuiz({
        userId: getUserId(req),
        title: title || `Quiz: ${note.title}`,
        subject: (note.subject || "General") as string,
        description: `Auto-generated from note: ${note.title}`,
        timeLimit: questionCount * 60, // 1 min per question
        passingScore: 70,
      });
      
      // Generate questions from note blocks
      const questions = [];
      const eligibleBlocks = blocks.filter(b => 
        b.content.length >= 20 && 
        (b.noteType === "concept" || b.noteType === "definition" || b.noteType === "process" || b.noteType === "exam_tip" || b.type !== "heading")
      );
      
      const blocksToUse = eligibleBlocks.slice(0, questionCount);
      
      for (let i = 0; i < blocksToUse.length; i++) {
        const block = blocksToUse[i];
        let questionText = "";
        let correctAnswer = "";
        
        // Generate question based on note type
        if (block.noteType === "definition") {
          questionText = `Define the following: ${block.content.substring(0, 50)}...`;
          correctAnswer = block.content;
        } else if (block.noteType === "process") {
          questionText = `Explain the process described: ${block.content.substring(0, 50)}...`;
          correctAnswer = block.content;
        } else if (block.noteType === "concept") {
          questionText = `Explain this concept: ${block.content.substring(0, 50)}...`;
          correctAnswer = block.content;
        } else if (block.noteType === "exam_tip") {
          questionText = `What is the key exam tip for: ${block.content.substring(0, 50)}...`;
          correctAnswer = block.content;
        } else {
          questionText = `What do you know about: ${block.content.substring(0, 80)}${block.content.length > 80 ? '...' : ''}?`;
          correctAnswer = block.content;
        }
        
        const question = await storage.createQuizQuestion({
          quizId: quiz.id,
          type: "saq",
          question: questionText,
          explanation: `From your notes: ${block.content.substring(0, 200)}`,
          difficulty: block.examMarks ? Math.min(5, Math.ceil(block.examMarks / 2)) : 3,
          marks: block.examMarks || 2,
          correctAnswer: correctAnswer.substring(0, 500),
          order: i,
        });
        
        questions.push(question);
      }
      
      res.status(201).json({
        quiz,
        questionsCreated: questions.length,
        message: `Created quiz with ${questions.length} questions from "${note.title}"`,
      });
    } catch (error) {
      console.error("Generate quiz from note error:", error);
      res.status(500).json({ error: "Failed to generate quiz from note" });
    }
  });
  
  // Auto-generate flashcards from note
  const generateFlashcardsFromNoteSchema = z.object({
    noteId: z.string().min(1),
    deckId: z.string().min(1),
    cardCount: z.number().min(1).max(50).optional(),
  });
  
  app.post("/api/notes/:id/generate-flashcards", authMiddleware, async (req: any, res) => {
    try {
      const parsed = generateFlashcardsFromNoteSchema.safeParse({ ...req.body, noteId: req.params.id });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      
      const { noteId, deckId, cardCount } = parsed.data;
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      const deck = await storage.getDeck(deckId);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
      
      const blocks = await storage.getNoteBlocks(noteId);
      if (blocks.length === 0) {
        return res.status(400).json({ error: "Note has no content to generate flashcards from" });
      }
      
      // Filter blocks suitable for flashcards
      const eligibleBlocks = blocks.filter(b => 
        b.content.length >= 15 && b.content.length <= 1000
      );
      
      const blocksToUse = cardCount ? eligibleBlocks.slice(0, cardCount) : eligibleBlocks;
      const createdCards = [];
      
      for (const block of blocksToUse) {
        let front = "";
        let back = block.content;
        
        // Generate front based on note type
        if (block.noteType === "definition") {
          front = `Define: ${block.content.split(/[.!?]/)[0].substring(0, 100)}`;
        } else if (block.noteType === "process") {
          front = `Explain the steps/process for: ${block.content.substring(0, 60)}...`;
        } else if (block.noteType === "concept") {
          front = `What is: ${block.content.substring(0, 60)}...?`;
        } else if (block.noteType === "example") {
          front = `Give an example of: ${block.content.substring(0, 60)}...`;
        } else if (block.noteType === "exam_tip") {
          front = `Exam tip: ${block.content.substring(0, 60)}...`;
        } else {
          front = `What do you know about: ${block.content.substring(0, 60)}${block.content.length > 60 ? '...' : ''}?`;
        }
        
        const card = await storage.createCard({
          deckId,
          type: "basic",
          front,
          back,
          tags: (note.tags || []) as string[],
          sourceNoteBlockId: block.id,
        });
        
        createdCards.push(card);
      }
      
      res.status(201).json({
        cardsCreated: createdCards.length,
        deckId,
        message: `Created ${createdCards.length} flashcards from "${note.title}"`,
      });
    } catch (error) {
      console.error("Generate flashcards from note error:", error);
      res.status(500).json({ error: "Failed to generate flashcards from note" });
    }
  });
  
  // Update note block with smart annotations
  app.patch("/api/notes/:noteId/blocks/:blockId", authMiddleware, async (req: any, res) => {
    try {
      const { noteId, blockId } = req.params;
      const { noteType, isExamContent, examPrompt, examMarks, keyTerms } = req.body;
      
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      const blocks = await storage.getNoteBlocks(noteId);
      const block = blocks.find(b => b.id === blockId);
      if (!block) {
        return res.status(404).json({ error: "Block not found" });
      }
      
      // Update the block with annotations by deleting and recreating
      // Since we don't have updateNoteBlock, we update via deleteNoteBlocks + createNoteBlocks pattern
      // For now, just update the note with the new block data
      await storage.deleteNoteBlocks(noteId);
      const allBlocks = blocks.map(b => {
        if (b.id === blockId) {
          return {
            noteId,
            type: b.type,
            content: b.content,
            order: b.order,
            noteType: noteType ?? b.noteType,
            isExamContent: isExamContent ?? b.isExamContent,
            examPrompt: examPrompt ?? b.examPrompt,
            examMarks: examMarks ?? b.examMarks,
            keyTerms: keyTerms ?? b.keyTerms,
          };
        }
        return {
          noteId,
          type: b.type,
          content: b.content,
          order: b.order,
          noteType: b.noteType,
          isExamContent: b.isExamContent,
          examPrompt: b.examPrompt,
          examMarks: b.examMarks,
          keyTerms: b.keyTerms,
        };
      });
      await storage.createNoteBlocks(allBlocks);
      
      const updatedBlocks = await storage.getNoteBlocks(noteId);
      const updatedBlock = updatedBlocks.find(b => b.order === block.order);
      
      res.json(updatedBlock);
    } catch (error) {
      console.error("Update block error:", error);
      res.status(500).json({ error: "Failed to update block" });
    }
  });
  
  // Get note content with recall mode (key terms hidden)
  app.get("/api/notes/:id/recall", authMiddleware, async (req: any, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      const blocks = await storage.getNoteBlocks(req.params.id);
      
      // Process blocks for recall mode - hide key terms
      const recallBlocks = blocks.map(block => {
        let maskedContent = block.content;
        
        if (block.keyTerms) {
          const terms = block.keyTerms.split(',').map(t => t.trim()).filter(Boolean);
          for (const term of terms) {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            maskedContent = maskedContent.replace(regex, '▓'.repeat(term.length));
          }
        }
        
        return {
          ...block,
          originalContent: block.content,
          content: maskedContent,
          hasKeyTerms: !!block.keyTerms,
        };
      });
      
      res.json({ ...note, blocks: recallBlocks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch note for recall" });
    }
  });

  // ==================== FLASHCARDS API ====================

  app.get("/api/decks", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const decks = await storage.getDecks(userId);
      
      // Enrich with card counts
      const enrichedDecks = await Promise.all(
        decks.map(async (deck) => {
          const cards = await storage.getCards(deck.id);
          const now = Date.now();
          const dueToday = cards.filter(c => (c.dueAt as unknown as number) <= now).length;
          const mastered = cards.filter(c => c.status === "mastered").length;
          
          return {
            ...deck,
            cards: cards.length,
            dueToday,
            mastered,
          };
        })
      );
      
      res.json(enrichedDecks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch decks" });
    }
  });

  app.get("/api/decks/:id", async (req, res) => {
    try {
      const deck = await storage.getDeck(req.params.id);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
      const cards = await storage.getCards(req.params.id);
      res.json({ ...deck, cards });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deck" });
    }
  });

  app.post("/api/decks", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const deckData = insertDeckSchema.parse({ ...req.body, userId });
      const deck = await storage.createDeck(deckData);
      res.status(201).json(deck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create deck" });
    }
  });

  app.patch("/api/decks/:id", authMiddleware, async (req: any, res) => {
    try {
      const deck = await storage.updateDeck(req.params.id, req.body);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
      res.json(deck);
    } catch (error) {
      res.status(500).json({ error: "Failed to update deck" });
    }
  });

  app.delete("/api/decks/:id", authMiddleware, async (req: any, res) => {
    try {
      await storage.deleteDeck(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deck" });
    }
  });

  app.get("/api/decks/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getDeckStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deck stats" });
    }
  });

  app.post("/api/cards", authMiddleware, async (req: any, res) => {
    try {
      const cardData = insertCardSchema.parse(req.body);
      const card = await storage.createCard(cardData);
      res.status(201).json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create card" });
    }
  });

  // Create card in specific deck
  app.post("/api/decks/:deckId/cards", authMiddleware, async (req: any, res) => {
    try {
      const { deckId } = req.params;
      const deck = await storage.getDeck(deckId);
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
      
      const cardData = insertCardSchema.parse({
        ...req.body,
        deckId,
      });
      const card = await storage.createCard(cardData);
      res.status(201).json(card);
    } catch (error) {
      console.error("Create card in deck error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create card" });
    }
  });

  app.get("/api/cards/due", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const dueCards = await storage.getDueCards(userId);
      res.json(dueCards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch due cards" });
    }
  });

  // Smart card prioritization for intelligent study sessions
  // Get overall flashcard statistics
  app.get("/api/flashcards/stats", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const now = Date.now();

      // Get all decks for this user
      const userDecks = await storage.getDecks(userId);
      
      // Collect all cards
      let allCards: any[] = [];
      for (const deck of userDecks) {
        const deckCards = await storage.getCards(deck.id);
        allCards.push(...deckCards);
      }

      // Calculate stats
      const stats = {
        totalCards: allCards.length,
        dueNow: allCards.filter(c => ((c.dueAt as any) ?? now) <= now).length,
        new: allCards.filter(c => c.status === "new").length,
        struggling: allCards.filter(c => ((c.easeFactor as any) ?? 2.5) < 2.0).length,
        mastered: allCards.filter(c => ((c.interval as any) ?? 0) > 30).length, // interval > 30 days means mastered
      };

      res.json(stats);
    } catch (error) {
      console.error("[Flashcards Stats] Error:", error);
      res.status(500).json({ 
        totalCards: 0, 
        dueNow: 0, 
        new: 0, 
        struggling: 0, 
        mastered: 0 
      });
    }
  });

  // Get filtered flashcards
  app.get("/api/flashcards", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { filter = "due", limit = "20" } = req.query;
      const maxCards = Math.min(parseInt(limit as string) || 20, 100);
      const now = Date.now();

      // Get all cards
      const userDecks = await storage.getDecks(userId);
      let allCards: CardRecord[] = [];
      for (const deck of userDecks) {
        const deckCards = await storage.getCards(deck.id) as unknown as CardRecord[];
        allCards.push(...deckCards);
      }

      // Score and sort by priority
      const scoredCards = allCards.map(card => {
        let priorityScore = 0;
        const dueAtTime = card.dueAt ?? now;
        const daysSinceDue = (now - dueAtTime) / (1000 * 60 * 60 * 24);
        const easeFactor = card.easeFactor ?? 2.5;
        
        if (daysSinceDue > 0) {
          priorityScore += Math.min(daysSinceDue * 10, 50);
        }
        if (card.status === "new") {
          priorityScore += 20;
        }
        if (easeFactor < 2.5) {
          priorityScore += (2.5 - easeFactor) * 20;
        }
        if (card.status === "learning" && daysSinceDue >= 0) {
          priorityScore += 25;
        }

        return {
          ...card,
          priorityScore,
          daysOverdue: Math.max(0, daysSinceDue),
        };
      });

      // Apply filter
      let filtered = scoredCards;
      if (filter === "due") {
        filtered = scoredCards.filter(c => ((c.dueAt as unknown as number) ?? now) <= now).sort((a, b) => b.priorityScore - a.priorityScore);
      } else if (filter === "new") {
        filtered = scoredCards.filter(c => c.status === "new").sort((a, b) => b.priorityScore - a.priorityScore);
      } else if (filter === "struggling") {
        filtered = scoredCards.filter(c => ((c.easeFactor as unknown as number) ?? 2.5) < 2.0).sort((a, b) => b.priorityScore - a.priorityScore);
      }

      const result = filtered.slice(0, maxCards);
      res.json(result);
    } catch (error) {
      console.error("[Flashcards Filter] Error:", error);
      res.status(500).json([]);
    }
  });

  app.get("/api/cards/smart-queue", authMiddleware, async (req: any, res) => {
    try {
      const { deckId, mode = "smart", limit = "50" } = req.query;
      const maxCards = Math.min(parseInt(limit as string) || 50, 100);
      
      // Get all cards (from specific deck or all decks)
      let allCards: CardRecord[] = [];
      if (deckId) {
        allCards = await storage.getCards(deckId as string) as unknown as CardRecord[];
      } else {
        const decks = await storage.getDecks(getUserId(req));
        for (const deck of decks) {
          const deckCards = await storage.getCards(deck.id) as unknown as CardRecord[];
          allCards.push(...deckCards);
        }
      }

      const now = new Date();
      
      // Calculate priority score for each card
      const scoredCards = allCards.map(card => {
        let priorityScore = 0;
        const dueDate = new Date(card.dueAt);
        const daysSinceDue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Overdue cards get highest priority (max +50 points)
        if (daysSinceDue > 0) {
          priorityScore += Math.min(daysSinceDue * 10, 50);
        }
        
        // New cards get moderate priority (+20 points)
        if (card.status === "new") {
          priorityScore += 20;
        }
        
        // Low ease factor = struggling cards get priority (+30 max)
        if (card.easeFactor < 2.5) {
          priorityScore += (2.5 - card.easeFactor) * 20;
        }
        
        // Cards with many failed reviews (low repetitions but old) get priority
        if (card.repetitions < 3 && card.lastReviewedAt) {
          const daysSinceReview = (now.getTime() - new Date(card.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceReview > 1) {
            priorityScore += 15;
          }
        }
        
        // Learning cards due now get high priority
        if (card.status === "learning" && daysSinceDue >= 0) {
          priorityScore += 25;
        }

        return {
          ...card,
          priorityScore,
          priorityReason: getPriorityReason(card, daysSinceDue),
          urgency: getUrgencyLevel(priorityScore),
        };
      });

      // Sort by priority score (highest first)
      scoredCards.sort((a, b) => b.priorityScore - a.priorityScore);

      // Apply mode-specific filtering
      let filteredCards = scoredCards;
      if (mode === "due-only") {
        filteredCards = scoredCards.filter(c => new Date(c.dueAt) <= now);
      } else if (mode === "new-only") {
        filteredCards = scoredCards.filter(c => c.status === "new");
      } else if (mode === "struggling") {
        filteredCards = scoredCards.filter(c => c.easeFactor < 2.3 || c.priorityScore > 30);
      }

      // Limit results
      const result = filteredCards.slice(0, maxCards);

      // Calculate session stats
      const stats = {
        totalCards: allCards.length,
        dueNow: allCards.filter(c => new Date(c.dueAt) <= now).length,
        newCards: allCards.filter(c => c.status === "new").length,
        strugglingCards: allCards.filter(c => c.easeFactor < 2.3).length,
        masteredCards: allCards.filter(c => c.status === "mastered").length,
        estimatedTime: Math.ceil(result.length * 0.5), // 30 seconds per card average
      };

      res.json({ cards: result, stats });
    } catch (error) {
      console.error("Smart queue error:", error);
      res.status(500).json({ error: "Failed to get smart queue" });
    }
  });

  // Auto-generate flashcards from notes
  const fromNoteSchema = z.object({
    noteId: z.string().min(1),
    deckId: z.string().min(1),
  });
  
  app.post("/api/cards/from-note", authMiddleware, async (req: any, res) => {
    try {
      const parsed = fromNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "noteId and deckId are required", details: parsed.error.errors });
      }
      const { noteId, deckId } = parsed.data;

      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      const blocks = await storage.getNoteBlocks(noteId);
      const createdCards: Card[] = [];

      // Extract key concepts from note blocks
      for (const block of blocks) {
        if (block.type === "heading" || (block.content.length > 20 && block.content.length < 500)) {
          // Create a card from significant content
          const card = await storage.createCard({
            deckId,
            type: "basic",
            front: `What do you know about: ${block.content.substring(0, 100)}${block.content.length > 100 ? '...' : ''}?`,
            back: block.content,
            tags: (note.tags || []) as string[],
            sourceNoteBlockId: block.id,
          });
          createdCards.push(card);
        }
      }

      res.status(201).json({ 
        cardsCreated: createdCards.length, 
        cards: createdCards,
        message: `Created ${createdCards.length} flashcards from note "${note.title}"`
      });
    } catch (error) {
      console.error("Note to flashcard error:", error);
      res.status(500).json({ error: "Failed to create flashcards from note" });
    }
  });

  // Get session summary after studying
  const sessionSummarySchema = z.object({
    cardIds: z.array(z.string()),
    responses: z.array(z.number().min(0).max(5)),
  });
  
  app.post("/api/cards/session-summary", authMiddleware, async (req: any, res) => {
    try {
      const parsed = sessionSummarySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "cardIds and responses arrays required", details: parsed.error.errors });
      }
      const { cardIds, responses } = parsed.data;

      // Calculate session metrics
      const totalCards = cardIds.length;
      const correctCount = responses.filter((r: number) => r >= 3).length;
      const strugglingCount = responses.filter((r: number) => r <= 1).length;
      const accuracy = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0;

      // Get the cards to analyze weak areas
      const cards = await Promise.all(cardIds.map((id: string) => storage.getCard(id)));
      const validCards = cards.filter(Boolean) as Card[];

      // Identify weak concepts (cards rated 1 or 2)
      const weakCards = validCards.filter((_, idx) => responses[idx] <= 2);
      const strongCards = validCards.filter((_, idx) => responses[idx] >= 4);

      // Calculate next review estimates
      const nextActions = [];
      if (strugglingCount > 0) {
        nextActions.push({
          type: "review",
          title: "Review struggling cards",
          description: `${strugglingCount} cards need more practice. Review them again soon.`,
          priority: "high" as const,
        });
      }
      if (accuracy < 70) {
        nextActions.push({
          type: "practice",
          title: "More practice recommended",
          description: "Your accuracy was below 70%. Consider shorter, more frequent sessions.",
          priority: "medium" as const,
        });
      }
      if (accuracy >= 80) {
        nextActions.push({
          type: "advance",
          title: "Great progress!",
          description: "You're doing well. Consider adding new cards or trying harder topics.",
          priority: "low" as const,
        });
      }

      res.json({
        summary: {
          totalCards,
          correctCount,
          strugglingCount,
          accuracy,
          estimatedTimeSpent: Math.ceil(totalCards * 0.5),
        },
        weakConcepts: weakCards.map(c => ({
          id: c.id,
          front: c.front,
          easeFactor: c.easeFactor,
          suggestion: "Practice this concept more frequently",
        })),
        strongConcepts: strongCards.map(c => ({
          id: c.id,
          front: c.front,
        })),
        nextActions,
        encouragement: getEncouragement(accuracy),
      });
    } catch (error) {
      console.error("Session summary error:", error);
      res.status(500).json({ error: "Failed to generate session summary" });
    }
  });

  /**
   * Enhanced review endpoint with SM-2 algorithm
   * Applies spaced repetition, updates next review date, and tracks progress
   */
  app.post("/api/cards/:id/review", authMiddleware, async (req: any, res) => {
    try {
      const { quality, responseTime = 0, isCorrect } = req.body;
      
      if (typeof quality !== "number" || quality < 0 || quality > 5) {
        return res.status(400).json({ error: "Quality must be between 0 and 5" });
      }
      
      const cardId = req.params.id;
      const userId = getUserId(req);
      const rawCard = await storage.getCard(cardId);
      
      if (!rawCard) {
        return res.status(404).json({ error: "Card not found" });
      }
      const card = rawCard as unknown as CardRecord;

      // ============ SM-2 ALGORITHM ============
      // quality: 0-2 = incorrect, 3-5 = correct
      // All values from 0 to 5 are used to adjust ease factor
      
      let easeFactor: number = card.easeFactor;
      let interval: number = card.interval;
      let repetitions: number = card.repetitions;
      let status: string = card.status;
      
      // SM-2 Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      easeFactor = Math.max(1.3, easeFactor); // Minimum ease factor is 1.3
      
      if (quality >= 3) {
        // Correct response - increase interval
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 3;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        repetitions++;
      } else {
        // Incorrect response - reset interval
        repetitions = 0;
        interval = 1;
      }
      
      // Update status based on repetitions and ease factor
      if (repetitions === 0) {
        status = "new";
      } else if (repetitions < 2) {
        status = "learning";
      } else if (repetitions < 5) {
        status = "reviewing";
      } else {
        status = "mastered";
      }
      
      // Calculate next due date
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + interval);
      
      // Update card with new SM-2 values
      const updatedCard = await storage.updateCard(cardId, {
        easeFactor,
        interval,
        repetitions,
        status,
        dueAt,
        lastReviewedAt: new Date(),
      });
      
      // Create review record for analytics
      const review = await db.insert(cardReviews).values({
        id: randomUUID(),
        cardId,
        userId,
        quality,
        intervalBefore: card.interval,
        intervalAfter: interval,
        easeFactorBefore: card.easeFactor,
        easeFactorAfter: easeFactor,
        reviewedAt: new Date(),
      }).returning();
      
      // Return updated card with review details
      res.json({
        card: updatedCard,
        review: review[0],
        feedback: {
          message: quality >= 3 
            ? "Great! This card will appear again soon." 
            : "Let's review this concept more often.",
          nextInterval: interval,
          nextReviewDate: dueAt,
          easeFactor: Math.round(easeFactor * 100) / 100,
          status,
        },
      });
    } catch (error) {
      console.error("[Card Review] Error:", error);
      res.status(500).json({ error: "Failed to review card" });
    }
  });

  /**
   * Start a flashcard review session
   * Returns the first card to review and session metadata
   */
  app.post("/api/flashcards/sessions", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { deckId, sessionType = "normal" } = req.body;
      
      if (!deckId) {
        return res.status(400).json({ error: "deckId required" });
      }
      
      // Get deck and verify ownership
      const deck = await storage.getDeck(deckId);
      if (!deck || deck.userId !== userId) {
        return res.status(403).json({ error: "Deck not found or access denied" });
      }
      
      // Get all cards for this deck
      const allCards = await storage.getCards(deckId) as unknown as CardRecord[];
      
      // Prioritize cards based on sessionType
      let cardsToReview = [...allCards];
      
      if (sessionType === "due") {
        // Only cards that are due today
        const now = new Date();
        cardsToReview = allCards.filter(c => new Date(c.dueAt) <= now);
      } else if (sessionType === "new") {
        // Only new cards
        cardsToReview = allCards.filter(c => c.status === "new");
      } else if (sessionType === "struggling") {
        // Low ease factor cards (struggling with)
        cardsToReview = allCards
          .filter(c => c.easeFactor < 2.0 && c.status !== "mastered")
          .sort((a, b) => a.easeFactor - b.easeFactor);
      }
      
      // Sort by due date (oldest first - most overdue)
      cardsToReview.sort((a, b) => 
        new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      );
      
      if (cardsToReview.length === 0) {
        return res.json({
          session: {
            deckId,
            sessionType,
            totalCards: allCards.length,
            cardsToReview: 0,
          },
          firstCard: null,
          message: "No cards available for this session type",
        });
      }
      
      // Get first card
      const firstCard = cardsToReview[0];
      
      // Create session record
      const session = {
        id: randomUUID(),
        deckId,
        sessionType,
        startedAt: new Date(),
        cardsToReview: cardsToReview.length,
        cardsReviewed: 0,
        totalCards: allCards.length,
      };
      
      res.json({
        session,
        firstCard,
        remainingCards: cardsToReview.length,
      });
    } catch (error) {
      console.error("[Flashcard Session] Error:", error);
      res.status(500).json({ error: "Failed to start review session" });
    }
  });

  /**
   * Get next card in review session
   */
  app.get("/api/flashcards/sessions/:deckId/next", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const deckId = req.params.deckId;
      
      const deck = await storage.getDeck(deckId);
      if (!deck || deck.userId !== userId) {
        return res.status(403).json({ error: "Deck not found or access denied" });
      }
      
      // Get all cards sorted by due date
      const allCards = await storage.getCards(deckId) as unknown as CardRecord[];
      const now = new Date();
      
      // Get due cards (most overdue first)
      const dueCards = allCards
        .filter(c => new Date(c.dueAt) <= now)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
      
      if (dueCards.length === 0) {
        return res.json({
          card: null,
          message: "All cards are up to date!",
          stats: {
            dueToday: 0,
            totalCards: allCards.length,
            masteredCards: allCards.filter(c => c.status === "mastered").length,
          }
        });
      }
      
      const nextCard = dueCards[0];
      
      // Get card review history for this session
      const reviews = await db
        .select()
        .from(cardReviews)
        .where(
          and(
            eq(cardReviews.cardId, nextCard.id),
            eq(cardReviews.userId, userId)
          )
        )
        .orderBy(desc(cardReviews.reviewedAt))
        .limit(5);
      
      res.json({
        card: nextCard,
        reviewHistory: reviews.map((r: typeof reviews[0]) => ({
          quality: r.quality,
          reviewedAt: r.reviewedAt,
          easeFactorAfter: r.easeFactorAfter,
        })),
        stats: {
          dueToday: dueCards.length,
          totalCards: allCards.length,
          masteredCards: allCards.filter(c => c.status === "mastered").length,
          currentStreak: nextCard.repetitions,
        },
      });
    } catch (error) {
      console.error("[Get Next Card] Error:", error);
      res.status(500).json({ error: "Failed to get next card" });
    }
  });

  /**
   * Complete a flashcard review session and log statistics
   */
  app.post("/api/flashcards/sessions/:deckId/complete", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const deckId = req.params.deckId;
      const { cardsReviewed = 0, correctAnswers = 0, durationMinutes = 0 } = req.body;
      
      const deck = await storage.getDeck(deckId);
      if (!deck || deck.userId !== userId) {
        return res.status(403).json({ error: "Deck not found or access denied" });
      }
      
      // Create study session record
      const { DashboardAnalytics } = await import("./dashboard-analytics");
      const [session] = await DashboardAnalytics.createStudySession(
        userId,
        "flashcards",
        durationMinutes,
        deckId,
        cardsReviewed,
        correctAnswers
      );
      
      // Calculate session stats
      const accuracy = cardsReviewed > 0 
        ? Math.round((correctAnswers / cardsReviewed) * 100)
        : 0;
      
      res.json({
        session,
        stats: {
          cardsReviewed,
          correctAnswers,
          accuracy,
          durationMinutes,
          message: accuracy >= 80 
            ? "Excellent work! Keep it up!" 
            : "Good effort! Keep practicing!"
        },
      });
    } catch (error) {
      console.error("[Complete Session] Error:", error);
      res.status(500).json({ error: "Failed to complete session" });
    }
  });

  app.get("/api/cards/:id", async (req, res) => {
    try {
      const card = await storage.getCard(req.params.id);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch card" });
    }
  });

  app.patch("/api/cards/:id", authMiddleware, async (req: any, res) => {
    try {
      const card = await storage.updateCard(req.params.id, req.body);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      res.status(500).json({ error: "Failed to update card" });
    }
  });

  app.delete("/api/cards/:id", authMiddleware, async (req: any, res) => {
    try {
      await storage.deleteCard(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete card" });
    }
  });

  // ==================== QUIZZES API ====================

  app.get("/api/quizzes", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const quizzes = await storage.getQuizzes(userId);
      
      // Enrich with question counts and attempt stats
      const enrichedQuizzes = await Promise.all(
        quizzes.map(async (quiz) => {
          const questions = await storage.getQuizQuestions(quiz.id);
          const attempts = await storage.getQuizAttempts(quiz.id, getUserId(req));
          const completedAttempts = attempts.filter(a => a.completedAt);
          const bestScore = completedAttempts.length > 0
            ? Math.max(...completedAttempts.map(a => a.score || 0))
            : null;
          
          return {
            ...quiz,
            questionCount: questions.length,
            attemptCount: attempts.length,
            bestScore,
          };
        })
      );
      
      res.json(enrichedQuizzes);
    } catch (error) {
      console.error("[QUIZ API ERROR] Failed to fetch quizzes:", error);
      res.status(500).json({ error: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      const questions = await storage.getQuizQuestions(req.params.id);
      const questionsWithOptions = await Promise.all(
        questions.map(async (question) => {
          if (question.type === "mcq") {
            const options = await storage.getQuizOptions(question.id);
            return { ...question, options };
          }
          return question;
        })
      );
      
      res.json({ ...quiz, questions: questionsWithOptions });
    } catch (error) {
      console.error("[QUIZ API ERROR] Failed to fetch quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.post("/api/quizzes", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { questions, ...quizData } = req.body;
      const quiz = await storage.createQuiz(insertQuizSchema.parse({ ...quizData, userId }));
      
      if (questions && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const { options, ...questionData } = questions[i];
          const question = await storage.createQuizQuestion({
            ...questionData,
            quizId: quiz.id,
            order: i,
          });
          
          if (options && Array.isArray(options)) {
            for (let j = 0; j < options.length; j++) {
              await storage.createQuizOption({
                ...options[j],
                questionId: question.id,
                order: j,
              });
            }
          }
        }
      }
      
      res.status(201).json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create quiz" });
    }
  });

  app.delete("/api/quizzes/:id", authMiddleware, async (req: any, res) => {
    try {
      await storage.deleteQuiz(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  });

  app.post("/api/quizzes/:quizId/questions", authMiddleware, async (req: any, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const { question, type, difficulty, marks, explanation, options } = req.body;
      
      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: "Question text is required" });
      }

      const validatedDifficulty = typeof difficulty === 'number' && !isNaN(difficulty) 
        ? Math.min(5, Math.max(1, Math.round(difficulty))) 
        : 3;
      const validatedMarks = typeof marks === 'number' && !isNaN(marks) && marks > 0 
        ? Math.round(marks) 
        : 1;
      const validatedType = ['mcq', 'saq', 'laq'].includes(type) ? type : 'mcq';
      
      let validOptions: any[] = [];
      if (validatedType === 'mcq') {
        if (!options || !Array.isArray(options) || options.length < 2) {
          return res.status(400).json({ error: "At least 2 options are required for multiple choice questions" });
        }

        validOptions = options.filter((opt: any) => opt.text && typeof opt.text === 'string' && opt.text.trim());
        if (validOptions.length < 2) {
          return res.status(400).json({ error: "At least 2 non-empty options are required" });
        }

        const hasCorrectOption = validOptions.some((opt: any) => opt.isCorrect === true);
        if (!hasCorrectOption) {
          return res.status(400).json({ error: "At least one option must be marked as correct" });
        }
      } else {
        validOptions = (options || []).filter((opt: any) => opt.text && typeof opt.text === 'string' && opt.text.trim());
      }

      const existingQuestions = await storage.getQuizQuestions(req.params.quizId);
      const order = existingQuestions.length;

      const newQuestion = await storage.createQuizQuestion({
        quizId: req.params.quizId,
        question: question.trim(),
        type: validatedType,
        difficulty: validatedDifficulty,
        marks: validatedMarks,
        explanation: explanation || "",
        order,
      });

      for (let i = 0; i < validOptions.length; i++) {
        await storage.createQuizOption({
          questionId: newQuestion.id,
          text: validOptions[i].text.trim(),
          isCorrect: validOptions[i].isCorrect || false,
          order: i,
        });
      }

      res.status(201).json(newQuestion);
    } catch (error) {
      res.status(500).json({ error: "Failed to create quiz question" });
    }
  });

  // ==================== QUIZ ATTEMPTS API ====================

  app.post("/api/quizzes/:quizId/attempts", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const quiz = await storage.getQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      const attempt = await storage.createQuizAttempt({
        quizId: req.params.quizId,
        userId,
        mode: req.body.mode || quiz.mode,
      });
      
      res.status(201).json(attempt);
    } catch (error) {
      console.error("[QUIZ ATTEMPT ERROR] Failed to create attempt:", error);
      console.error("[QUIZ ATTEMPT ERROR] Stack:", error instanceof Error ? error.stack : 'No stack');
      res.status(500).json({ error: "Failed to create attempt" });
    }
  });

  app.get("/api/quizzes/:quizId/attempts", async (req, res) => {
    try {
      const attempts = await storage.getQuizAttempts(req.params.quizId, getUserId(req));
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attempts" });
    }
  });

  app.get("/api/attempts/:attemptId", async (req, res) => {
    try {
      const attempt = await storage.getQuizAttempt(req.params.attemptId);
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      const responses = await storage.getQuizResponses(req.params.attemptId);
      res.json({ ...attempt, responses });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attempt" });
    }
  });

  app.post("/api/attempts/:attemptId/submit", authMiddleware, async (req: any, res) => {
    try {
      const { responses = [], timeSpent } = req.body;
      const attempt = await storage.getQuizAttempt(req.params.attemptId);
      
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      if (attempt.completedAt) {
        return res.status(400).json({ error: "Attempt already completed" });
      }
      
      // Check for existing responses (from instant feedback mode)
      const existingResponses = await storage.getQuizResponses(req.params.attemptId);
      const questions = await storage.getQuizQuestions(attempt.quizId);
      
      let totalMarks = 0;
      let earnedMarks = 0;
      let finalResponses = existingResponses;
      
      // If responses were already submitted via /answer endpoint, use those
      if (existingResponses.length > 0) {
        for (const response of existingResponses) {
          const question = questions.find(q => q.id === response.questionId);
          if (question) {
            totalMarks += question.marks;
            earnedMarks += response.marksAwarded || 0;
          }
        }
      } else if (responses.length > 0) {
        // Process new responses if none exist yet (batch submit mode)
        for (const response of responses) {
          const question = questions.find(q => q.id === response.questionId);
          if (!question) continue;
          
          totalMarks += question.marks;
          let isCorrect = false;
          let marksAwarded = 0;
          
          if (question.type === "mcq") {
            const options = await storage.getQuizOptions(question.id);
            const correctOption = options.find(o => o.isCorrect);
            isCorrect = response.selectedOptionId === correctOption?.id;
            marksAwarded = isCorrect ? question.marks : 0;
          } else {
            const userAnswer = (response.textAnswer || "").trim().toLowerCase();
            const correctAnswer = (question.correctAnswer || "").trim().toLowerCase();
            isCorrect = userAnswer === correctAnswer;
            marksAwarded = isCorrect ? question.marks : 0;
          }
          
          earnedMarks += marksAwarded;
          
          const createdResponse = await storage.createQuizResponse({
            attemptId: req.params.attemptId,
            questionId: response.questionId,
            selectedOptionId: response.selectedOptionId,
            textAnswer: response.textAnswer,
            isCorrect: isCorrect ? 1 : 0,
            marksAwarded,
            feedback: isCorrect ? "Correct!" : question.explanation || "Incorrect",
          });
          
          finalResponses.push(createdResponse);
        }
      }
      
      const score = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
      const completedAttempt = await storage.completeQuizAttempt(
        req.params.attemptId,
        score,
        earnedMarks,
        totalMarks,
        timeSpent || 0
      );

      const userId = getUserId(req);

      // Update per-question stats for spaced repetition tracking
      // This ensures every quiz completion feeds into the review queue
      for (const response of finalResponses) {
        try {
          await storage.upsertUserQuestionStats(
            userId,
            response.questionId,
            !!(response.isCorrect),
            response.responseTime || 0
          );
        } catch (e) {
          // Don't fail the whole completion if stats update fails
          console.warn("[Quiz] Failed to update question stats for", response.questionId);
        }
      }

      console.log("[Quiz] Quiz completed:", {
        attemptId: req.params.attemptId,
        userId,
        score,
        earnedMarks,
        totalMarks,
        completedAt: completedAttempt?.completedAt,
      });
      
      // Analytics are automatically updated since they're derived from quiz_attempts table
      // The completedAt timestamp is now set, so next analytics fetch will include this quiz
      console.log("[Analytics] Quiz completion recorded - analytics will reflect on next fetch");
      
      res.json({ ...completedAttempt, responses: finalResponses });
    } catch (error) {
      console.error("Submit error:", error);
      res.status(500).json({ error: "Failed to submit attempt" });
    }
  });

  // ==================== INTEGRATION ENDPOINTS ====================

  app.post("/api/flashcards/from-response", authMiddleware, async (req: any, res) => {
    try {
      const { responseId, deckId } = req.body;
      if (!responseId || !deckId) {
        return res.status(400).json({ error: "responseId and deckId are required" });
      }
      
      const result = await storage.convertResponseToFlashcard(responseId, deckId);
      res.status(201).json(result);
    } catch (error) {
      console.error("Flashcard conversion error:", error);
      res.status(500).json({ error: "Failed to convert to flashcard" });
    }
  });

  app.get("/api/quizzes/:quizId/analytics", async (req, res) => {
    try {
      const analytics = await storage.getQuizAnalytics(req.params.quizId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const [notes, decks, quizzes, dueCards] = await Promise.all([
        storage.getNotes(getUserId(req)),
        storage.getDecks(getUserId(req)),
        storage.getQuizzes(getUserId(req)),
        storage.getDueCards(getUserId(req)),
      ]);
      
      // Calculate accuracy from quiz attempts
      const allAttempts = await Promise.all(
        quizzes.map(q => storage.getQuizAttempts(q.id, getUserId(req)))
      );
      const completedAttempts = allAttempts.flat().filter(a => a.completedAt && a.score !== null);
      const averageAccuracy = completedAttempts.length > 0
        ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length)
        : 0;
      
      res.json({
        noteCount: notes.length,
        deckCount: decks.length,
        quizCount: quizzes.length,
        dueCardsCount: dueCards.length,
        averageAccuracy,
        studyStreak: 7, // Mock data - would track in DB
        weeklyStudyTime: "12h 30m", // Mock data
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // ==================== USER ANALYTICS ====================

  app.get("/api/user/analytics", authMiddleware, async (req: any, res) => {
    try {
      // Validate user authentication
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Fetch analytics - this derives data from quiz_attempts and quiz_responses
      // If user has no quiz history, returns all zeros (safe default)
      const analytics = await storage.getUserAnalytics(userId);
      console.log("[Analytics] Fetched for user:", userId, "- Quizzes taken:", analytics.totalQuizzesTaken);
      res.json(analytics);
    } catch (error) {
      console.error("[Analytics] Fetch error:", error);
      // Return safe default analytics instead of 500 error
      // This ensures frontend never crashes due to missing analytics data
      res.json({
        totalQuizzesTaken: 0,
        totalQuestionsAnswered: 0,
        overallAccuracy: 0,
        averageTimePerQuestion: 0,
        strengthsByTopic: {},
        weaknessesByTopic: {},
        recentActivity: [],
      });
    }
  });

  // ==================== LEARNING INSIGHTS ====================

  app.get("/api/learning-insights", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const insights = await storage.getLearningInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Learning insights error:", error);
      res.status(500).json({ error: "Failed to fetch learning insights" });
    }
  });

  // ==================== SPACED REPETITION (Analytics-Driven) ====================

  /**
   * GET /api/spaced-review/queue
   * 
   * Generates a prioritised review queue from the SAME quiz_attempts + quiz_responses
   * data used by Analytics and My Quizzes. No separate dataset.
   * 
   * Priority scoring:
   *   +50 incorrect answer
   *   +30 weak topic (<70% accuracy)
   *   +20 last attempted >3 days ago
   *   +10 fast guess (<3s)
   *   +15 fewer than 3 attempts
   *   +25 question accuracy <50%
   */
  app.get("/api/spaced-review/queue", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const limit = parseInt(req.query.limit as string) || 20;

      const queue = await storage.getSpacedReviewQueue(userId, limit);
      res.json(queue);
    } catch (error) {
      console.error("[Spaced Review] Queue error:", error);
      res.json([]); // Safe fallback — empty queue, no crash
    }
  });

  // Keep legacy endpoint for backward compatibility
  app.get("/api/spaced-review/due", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const limit = parseInt(req.query.limit as string) || 20;
      const queue = await storage.getSpacedReviewQueue(userId, limit);
      res.json(queue);
    } catch (error) {
      console.error("Spaced review error:", error);
      res.json([]);
    }
  });

  /**
   * POST /api/spaced-review/submit
   * 
   * Submit a spaced review answer. Updates user_question_stats and
   * feeds back into the priority scoring system.
   */
  app.post("/api/spaced-review/submit", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { questionId, isCorrect, responseTime, selectedOptionId, textAnswer } = req.body;

      if (!questionId) {
        return res.status(400).json({ error: "questionId is required" });
      }

      // Update per-question stats (same table used by analytics)
      const stats = await storage.upsertUserQuestionStats(
        userId,
        questionId,
        !!isCorrect,
        responseTime || 0
      );

      // Also update the spaced repetition interval fields
      // SM-2 quality: correct = 4 (good), incorrect = 1 (again)
      const quality = isCorrect ? 4 : 1;
      await storage.updateQuestionReviewSchedule(questionId, userId, quality);

      res.json({
        success: true,
        stats,
        message: isCorrect ? "Correct! Review interval increased." : "Incorrect. This will appear again soon.",
      });
    } catch (error) {
      console.error("[Spaced Review] Submit error:", error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  // Keep legacy endpoint for backward compatibility
  app.post("/api/spaced-review/:statsId/review", authMiddleware, async (req: any, res) => {
    try {
      const { quality } = req.body;
      if (typeof quality !== "number" || quality < 0 || quality > 5) {
        return res.status(400).json({ error: "Quality must be between 0 and 5" });
      }
      const stats = await storage.updateSpacedRepetition(req.params.statsId, quality);
      res.json(stats);
    } catch (error) {
      console.error("[Spaced Review] Update error:", error);
      res.status(500).json({ error: "Failed to update spaced repetition" });
    }
  });

  // ==================== ADAPTIVE QUIZ ====================

  app.post("/api/quizzes/:quizId/adaptive-attempt", authMiddleware, async (req: any, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      const attempt = await storage.createQuizAttempt({
        quizId: req.params.quizId,
        userId: getUserId(req),
        mode: "adaptive",
        currentQuestionIndex: 0,
        currentDifficulty: 3, // Start at medium difficulty
        difficultyPath: JSON.stringify([3]),
        status: "in_progress",
      });
      
      // Get first question at medium difficulty (pass attempt.id to filter within this attempt only)
      const firstQuestion = await storage.getNextAdaptiveQuestion(req.params.quizId, getUserId(req), 3, attempt.id);
      
      // Include options for MCQ questions
      let firstQuestionWithOptions: any = firstQuestion;
      if (firstQuestion && firstQuestion.type === "mcq") {
        const options = await storage.getQuizOptions(firstQuestion.id);
        firstQuestionWithOptions = { ...firstQuestion, options };
      }
      
      res.status(201).json({ 
        attempt,
        currentQuestion: firstQuestionWithOptions,
        questionNumber: 1,
      });
    } catch (error) {
      console.error("[ADAPTIVE QUIZ ERROR] Failed to start adaptive quiz:", error);
      console.error("[ADAPTIVE QUIZ ERROR] Stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ error: "Failed to start adaptive quiz" });
    }
  });

  app.post("/api/attempts/:attemptId/adaptive-answer", authMiddleware, async (req: any, res) => {
    try {
      const { questionId, selectedOptionId, textAnswer, responseTime } = req.body;
      const attempt = await storage.getQuizAttempt(req.params.attemptId);
      
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      if (attempt.status === "completed") {
        return res.status(400).json({ error: "Quiz already completed" });
      }
      
      // Get question and check answer
      const questions = await storage.getQuizQuestions(attempt.quizId);
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      let isCorrect = false;
      if (question.type === "mcq") {
        const options = await storage.getQuizOptions(question.id);
        const correctOption = options.find(o => o.isCorrect);
        isCorrect = selectedOptionId === correctOption?.id;
      } else {
        const userAnswer = (textAnswer || "").trim().toLowerCase();
        const correctAnswer = (question.correctAnswer || "").trim().toLowerCase();
        isCorrect = userAnswer === correctAnswer;
      }
      
      // Create response
      const response = await storage.createQuizResponse({
        attemptId: req.params.attemptId,
        questionId,
        selectedOptionId,
        textAnswer,
        isCorrect: isCorrect ? 1 : 0,
        marksAwarded: isCorrect ? question.marks : 0,
        feedback: isCorrect ? "Correct!" : question.explanation || "Incorrect",
        responseTime,
      });
      
      // Update user question stats for spaced repetition
      await storage.upsertUserQuestionStats(getUserId(req), questionId, isCorrect, responseTime || 0);
      
      // Adjust difficulty based on answer
      const currentDifficulty = attempt.currentDifficulty || 3;
      let newDifficulty = currentDifficulty;
      
      if (isCorrect) {
        newDifficulty = Math.min(5, currentDifficulty + 1);
      } else {
        newDifficulty = Math.max(1, currentDifficulty - 1);
      }
      
      const difficultyPath = JSON.parse(attempt.difficultyPath || "[]");
      difficultyPath.push(newDifficulty);
      
      const newQuestionIndex = (attempt.currentQuestionIndex || 0) + 1;
      
      // Check if quiz is complete (e.g., after 10 questions)
      const maxQuestions = 10;
      const responses = await storage.getQuizResponses(req.params.attemptId);
      
      if (responses.length >= maxQuestions) {
        // Complete the quiz
        const correctCount = responses.filter(r => r.isCorrect).length;
        const score = Math.round((correctCount / responses.length) * 100);
        
        await storage.updateQuizAttempt(req.params.attemptId, {
          completedAt: Date.now(),
          status: "completed",
          score,
          earnedMarks: correctCount,
          totalMarks: responses.length,
          currentDifficulty: newDifficulty,
          difficultyPath: JSON.stringify(difficultyPath),
        });
        
        return res.json({
          response,
          isCorrect,
          explanation: question.explanation,
          completed: true,
          score,
          totalQuestions: responses.length,
          correctAnswers: correctCount,
        });
      }
      
      // Get next question (pass attemptId to filter within current attempt only)
      const nextQuestion = await storage.getNextAdaptiveQuestion(
        attempt.quizId, 
        getUserId(req), 
        newDifficulty,
        req.params.attemptId
      );
      
      // Update attempt
      await storage.updateQuizAttempt(req.params.attemptId, {
        currentQuestionIndex: newQuestionIndex,
        currentDifficulty: newDifficulty,
        difficultyPath: JSON.stringify(difficultyPath),
      });
      
      // Get options for MCQ
      let nextQuestionWithOptions: any = nextQuestion;
      if (nextQuestion && nextQuestion.type === "mcq") {
        const options = await storage.getQuizOptions(nextQuestion.id);
        nextQuestionWithOptions = { ...nextQuestion, options };
      }
      
      res.json({
        response,
        isCorrect,
        explanation: question.explanation,
        completed: false,
        nextQuestion: nextQuestionWithOptions,
        questionNumber: newQuestionIndex + 1,
        currentDifficulty: newDifficulty,
      });
    } catch (error) {
      console.error("Adaptive answer error:", error);
      res.status(500).json({ error: "Failed to process answer" });
    }
  });

  // ==================== SINGLE QUESTION ANSWER (for instant feedback) ====================

  app.post("/api/attempts/:attemptId/answer", authMiddleware, async (req: any, res) => {
    try {
      const { questionId, selectedOptionId, textAnswer, responseTime } = req.body;
      const attempt = await storage.getQuizAttempt(req.params.attemptId);
      
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      // Get question
      const questions = await storage.getQuizQuestions(attempt.quizId);
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      console.log("[Quiz] Question loaded:", { attemptId: req.params.attemptId, questionId });
      
      // Check if already answered
      const existingResponses = await storage.getQuizResponses(req.params.attemptId);
      const alreadyAnswered = existingResponses.find(r => r.questionId === questionId);
      if (alreadyAnswered) {
        return res.json({
          response: alreadyAnswered,
          isCorrect: alreadyAnswered.isCorrect,
          explanation: question.explanation,
          alreadyAnswered: true,
        });
      }
      
      // Check answer
      let isCorrect = false;
      let correctAnswer: string | null = null;

      console.log("[Quiz] Answer selected:", {
        attemptId: req.params.attemptId,
        questionId,
        selectedOptionId: selectedOptionId || null,
        textAnswer: textAnswer || null,
      });
      
      if (question.type === "mcq") {
        const options = await storage.getQuizOptions(question.id);
        const correctOption = options.find(o => o.isCorrect);
        isCorrect = selectedOptionId === correctOption?.id;
        correctAnswer = correctOption?.id || null;
      } else {
        const userAnswer = (textAnswer || "").trim().toLowerCase();
        const storedCorrectAnswer = (question.correctAnswer || "").trim().toLowerCase();
        isCorrect = userAnswer === storedCorrectAnswer;
        correctAnswer = question.correctAnswer;
      }
      
      // Create response
      const response = await storage.createQuizResponse({
        attemptId: req.params.attemptId,
        questionId,
        selectedOptionId,
        textAnswer,
        isCorrect: isCorrect ? 1 : 0,
        marksAwarded: isCorrect ? question.marks : 0,
        feedback: isCorrect ? "Correct!" : question.explanation || "Incorrect",
        responseTime,
      });

      console.log("[Quiz] Answer submitted:", {
        attemptId: req.params.attemptId,
        questionId,
        isCorrect,
      });
      
      // Update user question stats (non-blocking - don't fail quiz on stats error)
      try {
        await storage.upsertUserQuestionStats(getUserId(req), questionId, isCorrect, responseTime || 0);
      } catch (statsError) {
        console.warn("[Quiz] Failed to update question stats (non-critical):", statsError);
      }
      
      res.json({
        response,
        isCorrect,
        explanation: question.explanation,
        correctAnswer,
        alreadyAnswered: false,
      });
    } catch (error) {
      console.error("Answer error:", error);
      res.status(500).json({ error: "Failed to process answer" });
    }
  });

  // Register AI research routes (Replit chat integration removed - using standard endpoints)
  registerInsightScoutRoutes(app);

  // ==================== DASHBOARD METRICS (Real Data) ====================

  app.get("/api/dashboard/metrics", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { DashboardAnalytics } = await import("./dashboard-analytics");
      const metrics = await DashboardAnalytics.getDashboardMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("[Dashboard] Metrics error:", error);
      // Return safe defaults
      res.json({
        dueToday: 0,
        accuracy: 0,
        weeklyStudyTime: 0,
        itemsReviewedThisWeek: 0,
      });
    }
  });

  // Get due flashcards for immediate review
  app.get("/api/dashboard/due-flashcards", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const limit = parseInt(req.query.limit as string) || 20;
      const { DashboardAnalytics } = await import("./dashboard-analytics");
      const dueCards = await DashboardAnalytics.getDueFlashcards(userId, limit);
      res.json(dueCards);
    } catch (error) {
      console.error("[Dashboard] Due flashcards error:", error);
      res.json([]);
    }
  });

  // Get lowest scoring quiz for retake recommendation
  app.get("/api/dashboard/lowest-quiz", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { DashboardAnalytics } = await import("./dashboard-analytics");
      const lowestQuiz = await DashboardAnalytics.getLowestScoringQuiz(userId);
      
      if (!lowestQuiz) {
        return res.json(null);
      }
      
      res.json(lowestQuiz);
    } catch (error) {
      console.error("[Dashboard] Lowest quiz error:", error);
      res.json(null);
    }
  });

  // Get recent notes for quick review
  app.get("/api/dashboard/recent-notes", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const limit = parseInt(req.query.limit as string) || 5;
      const { DashboardAnalytics } = await import("./dashboard-analytics");
      const recentNotes = await DashboardAnalytics.getRecentNotes(userId, limit);
      res.json(recentNotes);
    } catch (error) {
      console.error("[Dashboard] Recent notes error:", error);
      res.json([]);
    }
  });

  // Create a study session (for Pomodoro or focused study blocks)
  app.post("/api/dashboard/study-session", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { sessionType, durationMinutes, resourceId, itemsReviewed, correctAnswers } = req.body;
      
      if (!sessionType || !durationMinutes) {
        return res.status(400).json({ error: "sessionType and durationMinutes required" });
      }

      const { DashboardAnalytics } = await import("./dashboard-analytics");
      const [session] = await DashboardAnalytics.createStudySession(
        userId,
        sessionType,
        durationMinutes,
        resourceId,
        itemsReviewed,
        correctAnswers
      );
      
      res.status(201).json(session);
    } catch (error) {
      console.error("[Dashboard] Study session error:", error);
      res.status(500).json({ error: "Failed to create study session" });
    }
  });

  // ==================== SEED SAMPLE FLASHCARD DECKS ====================
  
  app.post("/api/seed/flashcards", async (req, res) => {
    try {
      const sampleDecks = [
        {
          title: "Data Structures & Algorithms",
          subject: "Computer Science",
          description: "Essential DSA concepts for coding interviews",
          tags: ["dsa", "programming", "interviews"],
          cards: [
            { front: "What is the time complexity of binary search?", back: "O(log n) - The search space is halved with each comparison." },
            { front: "What is a Hash Table?", back: "A data structure that maps keys to values using a hash function for O(1) average-case lookups." },
            { front: "Explain the difference between a Stack and a Queue", back: "Stack: LIFO (Last In, First Out) - like a stack of plates.\nQueue: FIFO (First In, First Out) - like a line at a store." },
            { front: "What is a Binary Search Tree (BST)?", back: "A tree where each node has at most 2 children, left child < parent < right child. Enables O(log n) search in balanced trees." },
            { front: "What is Dynamic Programming?", back: "An optimization technique that solves complex problems by breaking them into overlapping subproblems and storing their solutions (memoization)." },
            { front: "What is the time complexity of QuickSort?", back: "Average: O(n log n)\nWorst case: O(n²) when pivot selection is poor\nBest case: O(n log n)" },
            { front: "What is a Linked List?", back: "A linear data structure where elements are stored in nodes, each pointing to the next. Allows O(1) insertion/deletion but O(n) access." },
            { front: "Explain BFS vs DFS", back: "BFS (Breadth-First): Explores level by level using a queue. Good for shortest path.\nDFS (Depth-First): Explores as deep as possible using a stack/recursion. Good for path finding." },
            { front: "What is a Heap?", back: "A complete binary tree where parent nodes are greater (max-heap) or smaller (min-heap) than children. Used for priority queues." },
            { front: "What is Big O notation?", back: "A mathematical notation describing the upper bound of an algorithm's time or space complexity as input size grows." },
          ]
        },
        {
          title: "Python Programming",
          subject: "Computer Science",
          description: "Core Python concepts and syntax",
          tags: ["python", "programming", "basics"],
          cards: [
            { front: "What is a list comprehension in Python?", back: "[expression for item in iterable if condition]\nExample: [x**2 for x in range(10) if x % 2 == 0]" },
            { front: "Explain the difference between == and is", back: "== compares values (equality)\nis compares identity (same object in memory)" },
            { front: "What are *args and **kwargs?", back: "*args: Passes variable number of positional arguments as a tuple\n**kwargs: Passes variable number of keyword arguments as a dictionary" },
            { front: "What is a decorator in Python?", back: "A function that wraps another function to extend its behavior without modifying it. Uses @decorator_name syntax." },
            { front: "Explain Python's GIL", back: "Global Interpreter Lock - A mutex that allows only one thread to execute Python bytecode at a time, limiting true parallelism in CPython." },
            { front: "What is the difference between a list and a tuple?", back: "List: Mutable, uses [], slower\nTuple: Immutable, uses (), faster, can be used as dict keys" },
            { front: "What is a lambda function?", back: "An anonymous, single-expression function.\nSyntax: lambda arguments: expression\nExample: square = lambda x: x**2" },
            { front: "Explain Python generators", back: "Functions that use yield to return an iterator. They generate values lazily, saving memory for large datasets." },
          ]
        },
        {
          title: "Human Biology",
          subject: "Biology",
          description: "Key concepts in human anatomy and physiology",
          tags: ["biology", "anatomy", "medicine"],
          cards: [
            { front: "What are the four chambers of the heart?", back: "Right atrium, Right ventricle, Left atrium, Left ventricle.\nAtria receive blood, ventricles pump blood out." },
            { front: "What is the function of mitochondria?", back: "The 'powerhouse of the cell' - produces ATP through cellular respiration, providing energy for cellular functions." },
            { front: "Describe the process of DNA replication", back: "1. Helicase unwinds DNA double helix\n2. Primase adds RNA primers\n3. DNA polymerase synthesizes new strand (5' to 3')\n4. Ligase joins Okazaki fragments" },
            { front: "What is the difference between arteries and veins?", back: "Arteries: Carry blood away from heart, thicker walls, higher pressure, usually oxygenated\nVeins: Carry blood to heart, thinner walls, have valves, usually deoxygenated" },
            { front: "What are the main components of blood?", back: "Plasma (55%): Water, proteins, nutrients\nRed blood cells: Carry oxygen\nWhite blood cells: Immune defense\nPlatelets: Blood clotting" },
            { front: "Explain the function of the liver", back: "Detoxification, bile production, protein synthesis, glycogen storage, metabolism regulation, vitamin storage" },
            { front: "What is the role of insulin?", back: "A hormone produced by the pancreas that allows cells to absorb glucose from blood, lowering blood sugar levels." },
            { front: "Describe the structure of a neuron", back: "Cell body (soma): Contains nucleus\nDendrites: Receive signals\nAxon: Transmits signals\nSynaptic terminals: Release neurotransmitters" },
          ]
        },
        {
          title: "Organic Chemistry",
          subject: "Chemistry",
          description: "Fundamental organic chemistry concepts",
          tags: ["chemistry", "organic", "reactions"],
          cards: [
            { front: "What is a functional group?", back: "A specific group of atoms within molecules that determines the chemical properties and reactions of that molecule (e.g., -OH, -COOH, -NH2)." },
            { front: "Explain SN1 vs SN2 reactions", back: "SN1: Two-step, carbocation intermediate, racemization, favored by tertiary substrates\nSN2: One-step, backside attack, inversion, favored by primary substrates" },
            { front: "What is chirality?", back: "A property where a molecule and its mirror image are non-superimposable (like left and right hands). Creates optical isomers." },
            { front: "What is an aldehyde vs a ketone?", back: "Aldehyde: Carbonyl (C=O) at terminal carbon, -CHO\nKetone: Carbonyl between two carbons, R-CO-R'" },
            { front: "Explain electronegativity", back: "The ability of an atom to attract electrons in a chemical bond. Increases across a period (left to right) and decreases down a group." },
            { front: "What is hybridization?", back: "The mixing of atomic orbitals to form new hybrid orbitals.\nsp³: Tetrahedral (109.5°)\nsp²: Trigonal planar (120°)\nsp: Linear (180°)" },
            { front: "What is a nucleophile vs electrophile?", back: "Nucleophile: Electron-rich, donates electrons (e.g., OH⁻, NH₃)\nElectrophile: Electron-poor, accepts electrons (e.g., H⁺, BF₃)" },
          ]
        },
        {
          title: "Calculus Fundamentals",
          subject: "Mathematics",
          description: "Essential calculus concepts and formulas",
          tags: ["math", "calculus", "derivatives"],
          cards: [
            { front: "What is the derivative of sin(x)?", back: "cos(x)" },
            { front: "State the Chain Rule", back: "If y = f(g(x)), then dy/dx = f'(g(x)) · g'(x)\nOr: (f ∘ g)' = (f' ∘ g) · g'" },
            { front: "What is the integral of 1/x?", back: "ln|x| + C" },
            { front: "State the Fundamental Theorem of Calculus", back: "If F is an antiderivative of f on [a,b], then:\n∫[a to b] f(x)dx = F(b) - F(a)" },
            { front: "What is L'Hôpital's Rule?", back: "If lim f(x)/g(x) gives 0/0 or ∞/∞, then:\nlim f(x)/g(x) = lim f'(x)/g'(x)\nProvided the right-hand limit exists." },
            { front: "What is the derivative of e^x?", back: "e^x (it's its own derivative!)" },
            { front: "State the Product Rule", back: "(fg)' = f'g + fg'\nOr: d/dx[f(x)·g(x)] = f'(x)·g(x) + f(x)·g'(x)" },
            { front: "What is an integral?", back: "The reverse of differentiation. Represents the area under a curve, accumulation of quantities, or antiderivative." },
          ]
        },
        {
          title: "Psychology 101",
          subject: "Psychology",
          description: "Introduction to psychology concepts",
          tags: ["psychology", "behavior", "mind"],
          cards: [
            { front: "What is classical conditioning?", back: "Learning through association. Pavlov's dogs: neutral stimulus (bell) paired with unconditioned stimulus (food) creates conditioned response (salivation to bell)." },
            { front: "Explain operant conditioning", back: "Learning through consequences (Skinner):\nPositive reinforcement: Add reward\nNegative reinforcement: Remove aversive\nPositive punishment: Add aversive\nNegative punishment: Remove reward" },
            { front: "What are the Big Five personality traits?", back: "OCEAN:\nOpenness to experience\nConscientiousness\nExtraversion\nAgreeableness\nNeuroticism" },
            { front: "What is cognitive dissonance?", back: "The mental discomfort from holding contradictory beliefs, values, or attitudes. People tend to reduce it by changing beliefs or behaviors." },
            { front: "Describe Maslow's Hierarchy of Needs", back: "Bottom to top:\n1. Physiological (food, water)\n2. Safety\n3. Love/Belonging\n4. Esteem\n5. Self-actualization" },
            { front: "What is the difference between short-term and long-term memory?", back: "Short-term: Limited capacity (7±2 items), brief duration (15-30 sec)\nLong-term: Unlimited capacity, permanent storage, requires encoding" },
            { front: "What is confirmation bias?", back: "The tendency to search for, interpret, and remember information that confirms pre-existing beliefs while ignoring contradictory evidence." },
          ]
        },
        {
          title: "Microeconomics",
          subject: "Economics",
          description: "Core microeconomics principles",
          tags: ["economics", "micro", "markets"],
          cards: [
            { front: "What is the law of supply and demand?", back: "Supply: Higher price → more quantity supplied\nDemand: Higher price → less quantity demanded\nEquilibrium: Where supply meets demand" },
            { front: "Define elasticity of demand", back: "Measures how responsive quantity demanded is to price changes.\nElastic: |E| > 1 (sensitive to price)\nInelastic: |E| < 1 (not sensitive)\nUnit elastic: |E| = 1" },
            { front: "What is opportunity cost?", back: "The value of the next best alternative foregone when making a choice. The true cost of any decision." },
            { front: "Explain marginal utility", back: "The additional satisfaction gained from consuming one more unit of a good. Typically decreases with each additional unit (diminishing marginal utility)." },
            { front: "What is a monopoly?", back: "A market structure with a single seller, no close substitutes, and barriers to entry. Results in higher prices and lower output than competition." },
            { front: "Define GDP", back: "Gross Domestic Product: Total monetary value of all final goods and services produced within a country's borders in a specific time period." },
            { front: "What is inflation?", back: "A sustained increase in the general price level of goods and services over time, reducing purchasing power of currency." },
          ]
        },
        {
          title: "World History",
          subject: "History",
          description: "Major events and periods in world history",
          tags: ["history", "world", "events"],
          cards: [
            { front: "When did World War I begin and end?", back: "1914-1918\nTrigger: Assassination of Archduke Franz Ferdinand\nEnded with Treaty of Versailles" },
            { front: "What was the Renaissance?", back: "A cultural movement (14th-17th century) originating in Italy, marking the transition from Medieval to Modern times. Emphasis on humanism, art, science, and classical learning." },
            { front: "Describe the causes of the French Revolution", back: "1. Financial crisis and debt\n2. Social inequality (Three Estates)\n3. Enlightenment ideas\n4. Weak leadership (Louis XVI)\n5. Food shortages" },
            { front: "What was the Cold War?", back: "A period of geopolitical tension (1947-1991) between the US and USSR. Featured proxy wars, nuclear arms race, space race, but no direct military conflict." },
            { front: "When did the Roman Empire fall?", back: "Western Roman Empire: 476 CE (fall of Romulus Augustulus)\nEastern Roman Empire (Byzantine): 1453 CE (fall of Constantinople)" },
            { front: "What was the Industrial Revolution?", back: "A period of rapid industrialization (1760-1840) starting in Britain. Shift from agrarian to manufacturing economy, new machinery, urbanization, social changes." },
          ]
        },
      ];

      const createdDecks = [];
      
      for (const deckData of sampleDecks) {
        // Create deck
        const deck = await storage.createDeck({
          userId: getUserId(req),
          title: deckData.title,
          subject: deckData.subject,
          description: deckData.description,
          tags: JSON.stringify(deckData.tags),
        });
        
        // Create cards for this deck with varied due dates for realistic spaced repetition
        for (let i = 0; i < deckData.cards.length; i++) {
          const cardData = deckData.cards[i];
          const now = Date.now();
          
          // Vary the status and due dates to simulate a realistic study history
          let status: "new" | "learning" | "reviewing" | "mastered" = "new";
          let easeFactor = 2.5;
          let interval = 0;
          let dueAt = now;
          
          if (i % 5 === 0) {
            // Some cards are overdue
            status = "reviewing";
            easeFactor = 2.2;
            interval = 3;
            dueAt = now - 2 * 24 * 60 * 60 * 1000; // 2 days ago
          } else if (i % 4 === 0) {
            // Some cards are struggling
            status = "learning";
            easeFactor = 1.8;
            interval = 1;
            dueAt = now - 12 * 60 * 60 * 1000; // 12 hours ago
          } else if (i % 3 === 0) {
            // Some cards due today
            status = "reviewing";
            easeFactor = 2.6;
            interval = 7;
            dueAt = now;
          } else if (i % 2 === 0) {
            // Some cards are mastered
            status = "mastered";
            easeFactor = 2.8;
            interval = 21;
            dueAt = now + 14 * 24 * 60 * 60 * 1000; // 14 days from now
          }
          // Remaining cards stay as "new"
          
          const card = await storage.createCard({
            deckId: deck.id,
            type: "basic",
            front: cardData.front,
            back: cardData.back,
            tags: JSON.stringify(deckData.tags),
          });
          
          // Update with spaced repetition state (not in insert schema)
          await storage.updateCard(card.id as string, {
            status,
            easeFactor,
            interval,
            dueAt,
          });
        }
        
        createdDecks.push({ id: deck.id, title: deck.title, cardCount: deckData.cards.length });
      }
      
      res.json({
        message: "Sample flashcard decks created successfully",
        decks: createdDecks,
        totalCards: sampleDecks.reduce((sum, d) => sum + d.cards.length, 0),
      });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ error: "Failed to seed flashcard decks" });
    }
  });

  // Seed sample quizzes
  app.post("/api/seed/quizzes", async (req, res) => {
    try {
      const { seedQuizzes } = await import("./seed-quizzes");
      const createdQuizzes = await seedQuizzes(getUserId(req));
      res.json({
        message: "Sample quizzes created successfully",
        quizzes: createdQuizzes.map((q: any) => ({ id: q.id, title: q.title })),
        count: createdQuizzes.length,
      });
    } catch (error) {
      console.error("Seed quizzes error:", error);
      res.status(500).json({ error: "Failed to seed quizzes" });
    }
  });

  // Seed sample flashcards
  app.post("/api/seed/flashcards", async (req, res) => {
    try {
      const { seedFlashcards } = await import("./seed-flashcards");
      const result = await seedFlashcards(getUserId(req));
      res.json({
        message: "Sample flashcards created successfully",
        decksCreated: result.decksCreated,
        cardsCreated: result.cardsCreated,
      });
    } catch (error) {
      console.error("Seed flashcards error:", error);
      res.status(500).json({ error: "Failed to seed flashcards" });
    }
  });

  // ==================== RESEARCH/CONVERSATIONS API ====================

  app.get("/api/research/conversations", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      res.json([]);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/research/conversations/:id", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      res.json({ id: req.params.id, title: "Conversation", messages: [] });
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/research/conversations", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { title } = req.body;
      res.status(201).json({ id: randomUUID(), title: title || "New Conversation", userId, createdAt: new Date() });
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/research/conversations/:id", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      res.status(204).send();
    } catch (error) {
      console.error("Delete conversation error:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/research/conversations/:id/messages", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { role, content } = req.body;
      res.status(201).json({ id: randomUUID(), conversationId: req.params.id, role: role || "user", content, createdAt: new Date() });
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // ==================== USER SETTINGS/PREFERENCES ====================

  app.get("/api/settings", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      let preferences = await storage.getUserPreferences(userId);
      
      // If preferences don't exist, create with defaults
      if (!preferences) {
        preferences = await storage.updateUserPreferences(userId, { userId });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const updates = req.body;
      
      // Validate incoming data if needed - remove userId from updates if present
      const { userId: _, ...safeUpdates } = updates;
      
      const updated = await storage.updateUserPreferences(userId, safeUpdates);
      res.json(updated);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Vite dev server in development, static files in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist/public"));
  }

  // Global error handler middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server error:", err);
    // Don't expose error details - redirect to login for API errors
    if (req.path.startsWith("/api")) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.sendFile("dist/public/index.html", { root: process.cwd() });
    }
  });

  // Serve index.html for SPA routing (catch-all route)
  app.get("*", (req, res) => {
    res.sendFile("dist/public/index.html", { root: process.cwd() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
