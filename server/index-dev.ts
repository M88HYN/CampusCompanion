import "dotenv/config"; // Load .env variables FIRST before other imports
import runApp from "./app";
import { seedComputerScienceData } from "./seed-computer-science";
import { seedCompletedQuizzes } from "./seed-completed-quizzes";
import { cleanDuplicates, enforceConstraints } from "./clean-duplicates";
import { db } from "./db";
import { quizzes, quizAttempts, decks } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Express } from "express";
import type { Server } from "http";

// Setup function for development - seed sample data
const setup = async (_app: Express, _server: Server) => {
  try {
    // Use a default demo user ID for seeding
    const demoUserId = "demo-user";
    
    // FIRST: Clean any existing duplicates and enforce constraints
    console.log("\n🧹 Running duplicate cleanup...");
    await cleanDuplicates(demoUserId);
    await enforceConstraints(demoUserId);
    
    // CLEAR: Delete all existing data to load fresh multi-subject data
    console.log("\n🗑️  Clearing existing quizzes and decks to load new multi-subject data...");
    await db.delete(quizAttempts).where(eq(quizAttempts.userId, demoUserId));
    await db.delete(quizzes).where(eq(quizzes.userId, demoUserId));
    // Delete decks (will cascade to delete cards and cardReviews)
    await db.delete(decks).where(eq(decks.userId, demoUserId));
    console.log("✅ Cleared all quizzes, quiz attempts, decks, cards, and card reviews");
    
    // THEN: Seed data (will skip if data already exists)
    console.log("\n🌱 Seeding data...");
    await seedComputerScienceData(demoUserId);
    
    // Seed completed quizzes for analytics display
    await seedCompletedQuizzes(demoUserId);
    
    console.log("\n✅ Development setup complete!\n");
  } catch (error) {
    console.error("Error during setup:", error);
  }
};



// Start with error handling
runApp(setup).catch((error) => {
  console.error("Failed to start app:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});



