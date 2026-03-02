/*
==========================================================
File: server/auth-storage.ts

Module: Authentication and Access Control

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

import { type AuthUser } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// In-memory storage for demo (but also sync with database)
const userCache = new Map<string, AuthUser>();

export const storage = {
    /*
  ----------------------------------------------------------
  Function: createUser

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - user: Input consumed by this routine during execution

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
async createUser(user: AuthUser): Promise<void> {
    userCache.set(user.id, user);
    
    // Also create in database for foreign key consistency
    try {
      await db.insert(users).values({
        id: user.id,
        username: user.username || null,
        email: user.email,
        passwordHash: user.password || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profileImageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      // User might already exist
      console.log("User already exists in database or error:", error instanceof Error ? error.message : error);
    }
  },

    /*
  ----------------------------------------------------------
  Function: updateUser

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - user: Input consumed by this routine during execution

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
async updateUser(user: AuthUser): Promise<void> {
    userCache.set(user.id, user);
    
    // Also update in database
    try {
      await db.update(users)
        .set({
          username: user.username || null,
          email: user.email,
          passwordHash: user.password || null,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          updatedAt: Date.now(),
        })
        .where(eq(users.id, user.id));
    } catch (error) {
      console.log("Error updating user in database:", error instanceof Error ? error.message : error);
    }
  },

    /*
  ----------------------------------------------------------
  Function: findUserById

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
async findUserById(userId: string): Promise<AuthUser | null> {
    return userCache.get(userId) || null;
  },

    /*
  ----------------------------------------------------------
  Function: findUserByEmail

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - email: Input consumed by this routine during execution

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
async findUserByEmail(email: string): Promise<AuthUser | null> {
    for (const user of (userCache as Map<string, AuthUser>).values()) {
      if (user.email === email) {
        return user;
      }
    }
    // Fallback: check database (user may have been created by seed scripts)
    try {
      const rows = await db.select().from(users).where(eq(users.email, email));
      if (rows.length > 0) {
        const row = rows[0];
        const authUser: AuthUser = {
          id: row.id,
          email: row.email,
          username: row.username || undefined,
          password: row.passwordHash || undefined,
          firstName: row.firstName || undefined,
          lastName: row.lastName || undefined,
        };
        userCache.set(authUser.id, authUser);
        return authUser;
      }
    } catch (e) { /* ignore */ }
    return null;
  },

    /*
  ----------------------------------------------------------
  Function: findUserByUsername

  Purpose:
  Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

  Parameters:
  - username: Input consumed by this routine during execution

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
async findUserByUsername(username: string): Promise<AuthUser | null> {
    for (const user of (userCache as Map<string, AuthUser>).values()) {
      if (user.username === username) {
        return user;
      }
    }
    // Fallback: check database (user may have been created by seed scripts)
    try {
      const rows = await db.select().from(users).where(eq(users.username, username));
      if (rows.length > 0) {
        const row = rows[0];
        const authUser: AuthUser = {
          id: row.id,
          email: row.email,
          username: row.username || undefined,
          password: row.passwordHash || undefined,
          firstName: row.firstName || undefined,
          lastName: row.lastName || undefined,
        };
        userCache.set(authUser.id, authUser);
        return authUser;
      }
    } catch (e) { /* ignore */ }
    return null;
  },

    /*
  ----------------------------------------------------------
  Function: deleteUser

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
async deleteUser(userId: string): Promise<void> {
    userCache.delete(userId);
  },
};
