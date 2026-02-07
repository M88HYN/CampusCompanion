import { db } from "./db";
import { quizzes, decks, cards } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Clean duplicate quizzes and flashcards from the database
 * This utility removes duplicates while preserving the first occurrence
 */
export async function cleanDuplicates(userId: string) {
  console.log(`[CLEANUP] Starting duplicate cleanup for userId: ${userId}`);
  
  try {
    // Clean duplicate quizzes by title
    const allQuizzes = await db.select().from(quizzes).where(eq(quizzes.userId, userId));
    const seenTitles = new Set<string>();
    const duplicateQuizIds: string[] = [];
    
    for (const quiz of allQuizzes) {
      if (seenTitles.has(quiz.title)) {
        duplicateQuizIds.push(quiz.id);
        console.log(`[CLEANUP] Found duplicate quiz: ${quiz.title} (${quiz.id})`);
      } else {
        seenTitles.add(quiz.title);
      }
    }
    
    // Delete duplicate quizzes
    for (const quizId of duplicateQuizIds) {
      await db.delete(quizzes).where(eq(quizzes.id, quizId));
    }
    
    if (duplicateQuizIds.length > 0) {
      console.log(`[CLEANUP] ✅ Deleted ${duplicateQuizIds.length} duplicate quizzes`);
    }
    
    // Clean duplicate decks by title
    const allDecks = await db.select().from(decks).where(eq(decks.userId, userId));
    const seenDeckTitles = new Set<string>();
    const duplicateDeckIds: string[] = [];
    
    for (const deck of allDecks) {
      if (seenDeckTitles.has(deck.title)) {
        duplicateDeckIds.push(deck.id);
        console.log(`[CLEANUP] Found duplicate deck: ${deck.title} (${deck.id})`);
      } else {
        seenDeckTitles.add(deck.title);
      }
    }
    
    // Delete duplicate decks (cards will cascade delete)
    for (const deckId of duplicateDeckIds) {
      await db.delete(decks).where(eq(decks.id, deckId));
    }
    
    if (duplicateDeckIds.length > 0) {
      console.log(`[CLEANUP] ✅ Deleted ${duplicateDeckIds.length} duplicate decks`);
    }
    
    // Verify final counts
    const finalQuizzes = await db.select().from(quizzes).where(eq(quizzes.userId, userId));
    const finalDecks = await db.select().from(decks).where(eq(decks.userId, userId));
    
    console.log(`[CLEANUP] Final counts: ${finalQuizzes.length} quizzes, ${finalDecks.length} decks`);
    
    // Validate constraints
    if (finalQuizzes.length > 12) {
      console.warn(`[CLEANUP] ⚠️  Still too many quizzes: ${finalQuizzes.length} (max 12)`);
    }
    if (finalDecks.length > 10) {
      console.warn(`[CLEANUP] ⚠️  Still too many decks: ${finalDecks.length} (max 10)`);
    }
    
    return {
      quizzesRemoved: duplicateQuizIds.length,
      decksRemoved: duplicateDeckIds.length,
      finalQuizzes: finalQuizzes.length,
      finalDecks: finalDecks.length,
    };
  } catch (error) {
    console.error("[CLEANUP] Error during cleanup:", error);
    throw error;
  }
}

/**
 * Enforce strict constraints on data counts
 * Removes excess items beyond the allowed limits
 */
export async function enforceConstraints(userId: string) {
  console.log(`[ENFORCE] Enforcing constraints for userId: ${userId}`);
  
  // Limit quizzes to 12
  const allQuizzes = await db.select().from(quizzes).where(eq(quizzes.userId, userId));
  if (allQuizzes.length > 12) {
    const excessQuizzes = allQuizzes.slice(12);
    for (const quiz of excessQuizzes) {
      await db.delete(quizzes).where(eq(quizzes.id, quiz.id));
    }
    console.log(`[ENFORCE] Removed ${excessQuizzes.length} excess quizzes`);
  }
  
  // Limit decks to 10
  const allDecks = await db.select().from(decks).where(eq(decks.userId, userId));
  if (allDecks.length > 10) {
    const excessDecks = allDecks.slice(10);
    for (const deck of excessDecks) {
      await db.delete(decks).where(eq(decks.id, deck.id));
    }
    console.log(`[ENFORCE] Removed ${excessDecks.length} excess decks`);
  }
  
  console.log(`[ENFORCE] ✅ Constraints enforced`);
}
