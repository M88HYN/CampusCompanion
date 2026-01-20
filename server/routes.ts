import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertNoteSchema, insertNoteBlockSchema,
  insertDeckSchema, insertCardSchema,
  insertQuizSchema, insertQuizQuestionSchema, insertQuizOptionSchema,
  insertQuizAttemptSchema, insertQuizResponseSchema
} from "@shared/schema";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerInsightScoutRoutes } from "./insight-scout";
import type { Card } from "@shared/schema";

// For demo purposes - in production you'd use proper authentication
const DEMO_USER_ID = "demo-user";

// Helper functions for smart card prioritization
function getPriorityReason(card: Card, daysSinceDue: number): string {
  if (daysSinceDue > 7) return "Overdue by more than a week";
  if (daysSinceDue > 0) return "Due for review";
  if (card.status === "new") return "New card - needs initial learning";
  if (card.easeFactor < 2.0) return "Struggling - needs extra practice";
  if (card.status === "learning") return "Currently learning";
  if (card.easeFactor < 2.5) return "Needs reinforcement";
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
  
  // ==================== NOTES API ====================
  
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes(DEMO_USER_ID);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
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

  app.post("/api/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const note = await storage.createNote(noteData);
      
      if (req.body.blocks && Array.isArray(req.body.blocks)) {
        const blocks = req.body.blocks.map((block: any, index: number) => ({
          noteId: note.id,
          type: block.type,
          content: block.content,
          order: index,
        }));
        await storage.createNoteBlocks(blocks);
      }
      
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const { blocks, title, subject, tags } = req.body;
      const safeNoteData: { title?: string; subject?: string; tags?: string[] } = {};
      if (title !== undefined) safeNoteData.title = title;
      if (subject !== undefined) safeNoteData.subject = subject;
      if (tags !== undefined) safeNoteData.tags = tags;
      
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

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // ==================== FLASHCARDS API ====================

  app.get("/api/decks", async (req, res) => {
    try {
      const decks = await storage.getDecks(DEMO_USER_ID);
      
      // Enrich with card counts
      const enrichedDecks = await Promise.all(
        decks.map(async (deck) => {
          const cards = await storage.getCards(deck.id);
          const now = new Date();
          const dueToday = cards.filter(c => new Date(c.dueAt) <= now).length;
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

  app.post("/api/decks", async (req, res) => {
    try {
      const deckData = insertDeckSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const deck = await storage.createDeck(deckData);
      res.status(201).json(deck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create deck" });
    }
  });

  app.patch("/api/decks/:id", async (req, res) => {
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

  app.delete("/api/decks/:id", async (req, res) => {
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

  app.post("/api/cards", async (req, res) => {
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

  app.get("/api/cards/due", async (req, res) => {
    try {
      const dueCards = await storage.getDueCards(DEMO_USER_ID);
      res.json(dueCards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch due cards" });
    }
  });

  // Smart card prioritization for intelligent study sessions
  app.get("/api/cards/smart-queue", async (req, res) => {
    try {
      const { deckId, mode = "smart", limit = "50" } = req.query;
      const maxCards = Math.min(parseInt(limit as string) || 50, 100);
      
      // Get all cards (from specific deck or all decks)
      let allCards: Card[] = [];
      if (deckId) {
        allCards = await storage.getCards(deckId as string);
      } else {
        const decks = await storage.getDecks(DEMO_USER_ID);
        for (const deck of decks) {
          const deckCards = await storage.getCards(deck.id);
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
  
  app.post("/api/cards/from-note", async (req, res) => {
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
            tags: note.tags || [],
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
  
  app.post("/api/cards/session-summary", async (req, res) => {
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

  app.post("/api/cards/:id/review", async (req, res) => {
    try {
      const { quality } = req.body;
      if (typeof quality !== "number" || quality < 0 || quality > 5) {
        return res.status(400).json({ error: "Quality must be between 0 and 5" });
      }
      const card = await storage.reviewCard(req.params.id, quality, DEMO_USER_ID);
      res.json(card);
    } catch (error) {
      res.status(500).json({ error: "Failed to review card" });
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

  app.patch("/api/cards/:id", async (req, res) => {
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

  app.delete("/api/cards/:id", async (req, res) => {
    try {
      await storage.deleteCard(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete card" });
    }
  });

  // ==================== QUIZZES API ====================

  app.get("/api/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getQuizzes(DEMO_USER_ID);
      
      // Enrich with question counts and attempt stats
      const enrichedQuizzes = await Promise.all(
        quizzes.map(async (quiz) => {
          const questions = await storage.getQuizQuestions(quiz.id);
          const attempts = await storage.getQuizAttempts(quiz.id, DEMO_USER_ID);
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
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.post("/api/quizzes", async (req, res) => {
    try {
      const { questions, ...quizData } = req.body;
      const quiz = await storage.createQuiz(insertQuizSchema.parse({ ...quizData, userId: DEMO_USER_ID }));
      
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

  app.delete("/api/quizzes/:id", async (req, res) => {
    try {
      await storage.deleteQuiz(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  });

  app.post("/api/quizzes/:quizId/questions", async (req, res) => {
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

  app.post("/api/quizzes/:quizId/attempts", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      const attempt = await storage.createQuizAttempt({
        quizId: req.params.quizId,
        userId: DEMO_USER_ID,
        mode: req.body.mode || quiz.mode,
      });
      
      res.status(201).json(attempt);
    } catch (error) {
      res.status(500).json({ error: "Failed to create attempt" });
    }
  });

  app.get("/api/quizzes/:quizId/attempts", async (req, res) => {
    try {
      const attempts = await storage.getQuizAttempts(req.params.quizId, DEMO_USER_ID);
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

  app.post("/api/attempts/:attemptId/submit", async (req, res) => {
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
            isCorrect,
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
      
      res.json({ ...completedAttempt, responses: finalResponses });
    } catch (error) {
      console.error("Submit error:", error);
      res.status(500).json({ error: "Failed to submit attempt" });
    }
  });

  // ==================== INTEGRATION ENDPOINTS ====================

  app.post("/api/flashcards/from-response", async (req, res) => {
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
        storage.getNotes(DEMO_USER_ID),
        storage.getDecks(DEMO_USER_ID),
        storage.getQuizzes(DEMO_USER_ID),
        storage.getDueCards(DEMO_USER_ID),
      ]);
      
      // Calculate accuracy from quiz attempts
      const allAttempts = await Promise.all(
        quizzes.map(q => storage.getQuizAttempts(q.id, DEMO_USER_ID))
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

  app.get("/api/user/analytics", async (req, res) => {
    try {
      const analytics = await storage.getUserAnalytics(DEMO_USER_ID);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user analytics" });
    }
  });

  // ==================== LEARNING INSIGHTS ====================

  app.get("/api/learning-insights", async (req, res) => {
    try {
      const insights = await storage.getLearningInsights(DEMO_USER_ID);
      res.json(insights);
    } catch (error) {
      console.error("Learning insights error:", error);
      res.status(500).json({ error: "Failed to fetch learning insights" });
    }
  });

  // ==================== SPACED REPETITION ====================

  app.get("/api/spaced-review/due", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const dueQuestions = await storage.getDueQuestionsForReview(DEMO_USER_ID, limit);
      
      // Get the actual questions for each stat
      const questionsWithDetails = await Promise.all(
        dueQuestions.map(async (stat) => {
          const questions = await storage.getQuizQuestions(stat.questionId);
          // Find the question in all quizzes
          const allQuizzes = await storage.getAllQuizzes();
          for (const quiz of allQuizzes) {
            const quizQuestions = await storage.getQuizQuestions(quiz.id);
            const question = quizQuestions.find(q => q.id === stat.questionId);
            if (question) {
              const options = question.type === "mcq" 
                ? await storage.getQuizOptions(question.id) 
                : [];
              return {
                ...stat,
                question: { ...question, options },
                quizTitle: quiz.title,
              };
            }
          }
          return { ...stat, question: null };
        })
      );
      
      res.json(questionsWithDetails.filter(q => q.question !== null));
    } catch (error) {
      console.error("Spaced review error:", error);
      res.status(500).json({ error: "Failed to fetch due questions" });
    }
  });

  app.post("/api/spaced-review/:statsId/review", async (req, res) => {
    try {
      const { quality } = req.body;
      if (typeof quality !== "number" || quality < 0 || quality > 5) {
        return res.status(400).json({ error: "Quality must be between 0 and 5" });
      }
      const stats = await storage.updateSpacedRepetition(req.params.statsId, quality);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to update spaced repetition" });
    }
  });

  // ==================== ADAPTIVE QUIZ ====================

  app.post("/api/quizzes/:quizId/adaptive-attempt", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      const attempt = await storage.createQuizAttempt({
        quizId: req.params.quizId,
        userId: DEMO_USER_ID,
        mode: "adaptive",
        currentQuestionIndex: 0,
        currentDifficulty: 3, // Start at medium difficulty
        difficultyPath: JSON.stringify([3]),
        status: "in_progress",
      });
      
      // Get first question at medium difficulty (pass attempt.id to filter within this attempt only)
      const firstQuestion = await storage.getNextAdaptiveQuestion(req.params.quizId, DEMO_USER_ID, 3, attempt.id);
      
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
      console.error("Adaptive attempt error:", error);
      res.status(500).json({ error: "Failed to start adaptive quiz" });
    }
  });

  app.post("/api/attempts/:attemptId/adaptive-answer", async (req, res) => {
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
        isCorrect,
        marksAwarded: isCorrect ? question.marks : 0,
        feedback: isCorrect ? "Correct!" : question.explanation || "Incorrect",
        responseTime,
      });
      
      // Update user question stats for spaced repetition
      await storage.upsertUserQuestionStats(DEMO_USER_ID, questionId, isCorrect, responseTime || 0);
      
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
          completedAt: new Date(),
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
        DEMO_USER_ID, 
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

  app.post("/api/attempts/:attemptId/answer", async (req, res) => {
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
        isCorrect,
        marksAwarded: isCorrect ? question.marks : 0,
        feedback: isCorrect ? "Correct!" : question.explanation || "Incorrect",
        responseTime,
      });
      
      // Update user question stats
      await storage.upsertUserQuestionStats(DEMO_USER_ID, questionId, isCorrect, responseTime || 0);
      
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

  // Register AI chat and research routes
  registerChatRoutes(app);
  registerInsightScoutRoutes(app);

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
          userId: DEMO_USER_ID,
          title: deckData.title,
          subject: deckData.subject,
          description: deckData.description,
          tags: deckData.tags,
        });
        
        // Create cards for this deck with varied due dates for realistic spaced repetition
        for (let i = 0; i < deckData.cards.length; i++) {
          const cardData = deckData.cards[i];
          const now = new Date();
          
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
            dueAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
          } else if (i % 4 === 0) {
            // Some cards are struggling
            status = "learning";
            easeFactor = 1.8;
            interval = 1;
            dueAt = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
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
            dueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
          }
          // Remaining cards stay as "new"
          
          await storage.createCard({
            deckId: deck.id,
            type: "basic",
            front: cardData.front,
            back: cardData.back,
            tags: deckData.tags,
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

  const httpServer = createServer(app);

  return httpServer;
}
