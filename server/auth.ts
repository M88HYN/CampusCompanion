/*
==========================================================
File: server/auth.ts

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

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID, randomInt } from "crypto";
import { storage } from "./auth-storage";
import { db } from "./db";
import { verificationCodes, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production-use-strong-random-string";
const JWT_EXPIRY = "7d";

export interface AuthUser {
  id: string;
  username?: string;
  email: string;
  password?: string;
  isVerified?: boolean;
  firstName?: string;
  lastName?: string;
  provider?: string;
  googleId?: string;
  githubId?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

/*
----------------------------------------------------------
Function: hashPassword

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- password: Input consumed by this routine during execution

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
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/*
----------------------------------------------------------
Function: comparePasswords

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- password: Input consumed by this routine during execution
- hash: Input consumed by this routine during execution

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
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/*
----------------------------------------------------------
Function: generateToken

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
export function generateToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/*
----------------------------------------------------------
Function: verifyToken

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- token: Input consumed by this routine during execution

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
export function verifyToken(token: string): JWTPayload | null {
  try {
    console.log("Verifying token with JWT_SECRET (length:", JWT_SECRET.length, ")");
    console.log("Token (first 50 chars):", token.substring(0, 50));
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log("Token verified successfully. userId:", decoded.userId);
    return decoded;
  } catch (error) {
    console.error("Token verification error:", error instanceof Error ? error.message : error);
    console.error("Token (first 50 chars):", token.substring(0, 50));
    console.error("JWT_SECRET length:", JWT_SECRET.length);
    return null;
  }
}

/*
----------------------------------------------------------
Function: createUser

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- email: Input consumed by this routine during execution
- password: Input consumed by this routine during execution
- firstName: Input consumed by this routine during execution
- lastName: Input consumed by this routine during execution
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
export async function createUser(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  username?: string,
  isVerified: boolean = false,
): Promise<AuthUser> {
  const hashedPassword = await hashPassword(password);
  const userId = randomUUID();
  
  const user: AuthUser = {
    id: userId,
    username,
    email,
    password: hashedPassword,
    isVerified,
    firstName,
    lastName,
    provider: "local",
  };

  // Store user (implement in your storage layer)
  await storage.createUser(user);
  return user;
}

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
export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  return storage.findUserByEmail(email);
}

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
export async function findUserByUsername(username: string): Promise<AuthUser | null> {
  return storage.findUserByUsername(username);
}

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
export async function findUserById(userId: string): Promise<AuthUser | null> {
  return storage.findUserById(userId);
}

/*
----------------------------------------------------------
Function: findOrCreateOAuthUser

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- email: Input consumed by this routine during execution
- provider: Input consumed by this routine during execution
- providerId: Input consumed by this routine during execution
- firstName: Input consumed by this routine during execution
- lastName: Input consumed by this routine during execution

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
export async function findOrCreateOAuthUser(
  email: string,
  provider: "google" | "github",
  providerId: string,
  firstName?: string,
  lastName?: string
): Promise<AuthUser> {
  const existing = await findUserByEmail(email);
  
  if (existing) {
    // Update provider ID if not already set
    if (provider === "google" && !existing.googleId) {
      existing.googleId = providerId;
      await storage.updateUser(existing);
    } else if (provider === "github" && !existing.githubId) {
      existing.githubId = providerId;
      await storage.updateUser(existing);
    }
    return existing;
  }

  const userId = Date.now().toString();
  const user: AuthUser = {
    id: userId,
    email,
    firstName,
    lastName,
    provider,
  };

  if (provider === "google") {
    user.googleId = providerId;
  } else if (provider === "github") {
    user.githubId = providerId;
  }

  await storage.createUser(user);
  return user;
}

/*
----------------------------------------------------------
Function: generateVerificationCode

Purpose:
Generate a unique 6-digit verification code and store it in the database
with an expiration time.

Returns:
A 6-digit code as a string.
----------------------------------------------------------
*/
export async function generateVerificationCode(userId: string): Promise<string> {
  // Generate a cryptographically secure 6-digit code
  const code = randomInt(100000, 1000000).toString();
  
  // Code expires in 10 minutes
  const expiresAt = Date.now() + 10 * 60 * 1000;
  
  try {
    await db.insert(verificationCodes).values({
      id: randomUUID(),
      userId,
      code,
      createdAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(expiresAt / 1000),
    });
  } catch (error) {
    console.error("Error storing verification code:", error);
  }
  
  return code;
}

/*
----------------------------------------------------------
Function: verifyEmailCode

Purpose:
Verify that the provided code matches an active code for the user
and mark the user as verified.

Returns:
True if verification succeeded, false otherwise.
----------------------------------------------------------
*/
export async function verifyEmailCode(userId: string, code: string): Promise<boolean> {
  try {
    // Find valid verification code
    const result = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.code, code)
        )
      );

    if (!result || result.length === 0) {
      console.error("Verification code not found for user:", userId);
      return false;
    }

    const verCode = result[0];
    const now = Math.floor(Date.now() / 1000);

    // Check if code is expired
    if (verCode.expiresAt < now) {
      console.error("Verification code expired for user:", userId);
      return false;
    }

    // Mark user as verified
    await db
      .update(users)
      .set({ isVerified: true, updatedAt: now })
      .where(eq(users.id, userId));

    // Delete the used code
    await db
      .delete(verificationCodes)
      .where(eq(verificationCodes.id, verCode.id));

    console.log("User verified successfully:", userId);
    return true;
  } catch (error) {
    console.error("Error verifying email code:", error);
    return false;
  }
}

/*
----------------------------------------------------------
Function: resendVerificationCode

Purpose:
Generate a new verification code for a user (invalidating old ones).

Returns:
New 6-digit code as a string.
----------------------------------------------------------
*/
export async function resendVerificationCode(userId: string): Promise<string> {
  try {
    // Delete old codes for this user
    await db.delete(verificationCodes).where(eq(verificationCodes.userId, userId));
  } catch (error) {
    console.error("Error clearing old verification codes:", error);
  }

  // Generate new code
  return generateVerificationCode(userId);
}

/*
----------------------------------------------------------
Function: verifyEmailCodeByEmail

Purpose:
Verify email using email + code payload while preserving existing
userId + code verification flow.

Returns:
The verified user when successful, otherwise null.
----------------------------------------------------------
*/
export async function verifyEmailCodeByEmail(email: string, code: string): Promise<AuthUser | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const verified = await verifyEmailCode(user.id, code);
  if (!verified) {
    return null;
  }

  return findUserById(user.id);
}
