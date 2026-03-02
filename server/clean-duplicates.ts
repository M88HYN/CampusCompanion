/*
==========================================================
File: server/clean-duplicates.ts

Module: Core Platform

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
API Routing and Service Layer

System Interaction:
- Receives HTTP requests and coordinates validation, authorization, and business workflows
- Interacts with storage/database adapters and shared schemas for consistent persistence

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

import { db } from "./db";
import { quizzes, decks, cards } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Clean duplicate quizzes and flashcards from the database
 * This utility removes duplicates while preserving the first occurrence
 */
/*
----------------------------------------------------------
Function: cleanDuplicates

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- userId: Input consumed by this routine during execution

Process:
1. Accepts and normalizes inputs before core processing
2. Applies relevant guards/validation to prevent invalid transitions
3. Executes primary logic path and handles expected edge conditions
4. Returns a deterministic output for the caller layer

Why Validation is Important:
Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

Returns:
A value/promise representing the outcome of the executed logic path.
----------------------------------------------------------
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
/*
----------------------------------------------------------
Function: enforceConstraints

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- userId: Input consumed by this routine during execution

Process:
1. Accepts and normalizes inputs before core processing
2. Applies relevant guards/validation to prevent invalid transitions
3. Executes primary logic path and handles expected edge conditions
4. Returns a deterministic output for the caller layer

Why Validation is Important:
Input and boundary checks protect data integrity, reduce fault propagation, and enforce predictable system behavior.

Returns:
A value/promise representing the outcome of the executed logic path.
----------------------------------------------------------
*/
export async function enforceConstraints(userId: string) {
  console.log(`[ENFORCE] Enforcing constraints for userId: ${userId}`);
  
  // Limit quizzes to 20 (increased to support multiple subjects)
  const allQuizzes = await db.select().from(quizzes).where(eq(quizzes.userId, userId));
  if (allQuizzes.length > 20) {
    const excessQuizzes = allQuizzes.slice(20);
    for (const quiz of excessQuizzes) {
      await db.delete(quizzes).where(eq(quizzes.id, quiz.id));
    }
    console.log(`[ENFORCE] Removed ${excessQuizzes.length} excess quizzes`);
  }
  
  // Limit decks to 15 (increased to support multiple subjects)
  const allDecks = await db.select().from(decks).where(eq(decks.userId, userId));
  if (allDecks.length > 15) {
    const excessDecks = allDecks.slice(15);
    for (const deck of excessDecks) {
      await db.delete(decks).where(eq(decks.id, deck.id));
    }
    console.log(`[ENFORCE] Removed ${excessDecks.length} excess decks`);
  }
  
  console.log(`[ENFORCE] ✅ Constraints enforced`);
}
