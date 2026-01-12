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

// For demo purposes - in production you'd use proper authentication
const DEMO_USER_ID = "demo-user";

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

  const httpServer = createServer(app);

  return httpServer;
}
