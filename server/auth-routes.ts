/*
==========================================================
File: server/auth-routes.ts

Module: Authentication and Access Control

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Application Layer (Business and Interaction Logic)

System Interaction:
- Receives HTTP requests and coordinates validation, authorization, and business workflows
- Interacts with storage/database adapters and shared schemas for consistent persistence

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import axios from "axios";
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  comparePasswords,
  generateToken,
  verifyToken,
  type AuthUser,
} from "./auth";
import { storage as authStorage } from "./auth-storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { seedComputerScienceData } from "./seed-computer-science";
import { seedCompletedQuizzes } from "./seed-completed-quizzes";
import { storage } from "./storage";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// OAuth Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

function splitName(fullName: string): { firstName?: string; lastName?: string } {
  const normalized = fullName.trim();
  if (!normalized) {
    return {};
  }

  const parts = normalized.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0] };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

async function getSupabaseUser(token: string): Promise<any | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const response = await axios.get(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    return response.data;
  } catch {
    return null;
  }
}

async function ensureLocalUserFromSupabaseProfile(profile: any): Promise<AuthUser | null> {
  const id = typeof profile?.id === "string" ? profile.id : "";
  if (!id) {
    return null;
  }

  const metadata = profile?.user_metadata || {};
  const metadataFullName = typeof metadata?.full_name === "string" ? metadata.full_name : (typeof metadata?.name === "string" ? metadata.name : "");
  const fromFullName = splitName(metadataFullName);
  const firstName =
    (typeof metadata?.given_name === "string" && metadata.given_name) ||
    fromFullName.firstName;
  const lastName =
    (typeof metadata?.family_name === "string" && metadata.family_name) ||
    fromFullName.lastName;
  const email =
    (typeof profile?.email === "string" && profile.email) ||
    `${id}@supabase.local`;

  let existing = await findUserById(id);
  if (!existing) {
    existing = await findUserByEmail(email);
  }

  if (existing) {
    const merged: AuthUser = {
      ...existing,
      id,
      email,
      firstName: firstName || existing.firstName,
      lastName: lastName || existing.lastName,
      provider: "supabase",
    };
    await authStorage.updateUser(merged);
    return merged;
  }

  const created: AuthUser = {
    id,
    email,
    firstName,
    lastName,
    provider: "supabase",
  };
  await authStorage.createUser(created);
  return created;
}

function getSupabaseAuthorizeUrl(provider: "google" | "github"): string {
  const redirectTo = new URL("/login", FRONTEND_URL).toString();
  const params = new URLSearchParams({
    provider,
    redirect_to: redirectTo,
  });
  return `${SUPABASE_URL}/auth/v1/authorize?${params}`;
}

/*
----------------------------------------------------------
Function: authMiddleware

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- req: Input consumed by this routine during execution
- res: Input consumed by this routine during execution
- next: Input consumed by this routine during execution

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
export async function authMiddleware(req: any, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

  if (!token) {
    console.error("Auth failed: No token provided");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const localPayload = verifyToken(token);
  if (localPayload) {
    const localUser = await findUserById(localPayload.userId);
    if (localUser) {
      req.user = localPayload;
      return next();
    }
  }

  const supabaseProfile = await getSupabaseUser(token);
  if (!supabaseProfile) {
    console.error("Auth failed: Invalid token - not recognized by local JWT or Supabase");
    return res.status(401).json({ message: "Invalid token" });
  }

  const user = await ensureLocalUserFromSupabaseProfile(supabaseProfile);
  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  
  next();
}

/*
----------------------------------------------------------
Function: registerAuthRoutes

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- app: Input consumed by this routine during execution

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
export function registerAuthRoutes(app: Express) {
  app.get("/api/auth/demo-status", async (_req: any, res: Response) => {
    return res.json({ enabled: false });
  });

  // Register route
  app.post("/api/auth/register", async (req: any, res: Response) => {
    try {
      console.log("Register request body:", req.body);
      const data = registerSchema.parse(req.body);
      console.log("Parsed register data:", data);

      // Check if username already exists (only if provided)
      if (data.username) {
        const existingUsername = await findUserByUsername(data.username);
        if (existingUsername) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }

      // Check if email already exists
      const existingEmail = await findUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await createUser(data.email, data.password, data.firstName, data.lastName, data.username);

      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error: any) {
      console.error("Register error:", error);
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login route
  app.post("/api/auth/login", async (req: any, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      // Try to find user by email or username
      let user = await findUserByEmail(data.emailOrUsername);
      if (!user) {
        user = await findUserByUsername(data.emailOrUsername);
      }

      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await comparePasswords(data.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isDemoUser = user.username === "demo-user" || user.email === "demo@studymate.local";
      if (isDemoUser) {
        try {
          const [existingNotes, existingDecks, existingQuizzes] = await Promise.all([
            storage.getNotes(user.id),
            storage.getDecks(user.id),
            storage.getQuizzes(user.id),
          ]);

          const hasCoreSampleData =
            existingNotes.length > 0 || existingDecks.length > 0 || existingQuizzes.length > 0;

          if (!hasCoreSampleData) {
            await seedComputerScienceData(user.id);
            console.log("[DEMO SEED] Seeded core sample data on demo login");
          }

          await seedCompletedQuizzes(user.id);
          console.log("[DEMO SEED] Ensured completed quiz analytics on demo login");
        } catch (seedError) {
          console.error("[DEMO SEED] Failed during demo login seeding:", seedError);
        }
      }

      const token = generateToken(user);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, async (req: any, res: Response) => {
    try {
      const user = await findUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/auth/verify", authMiddleware, async (req: any, res: Response) => {
    try {
      const user = await findUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Logout (client-side handled, but endpoint for completeness)
  app.post("/api/auth/logout", (req: any, res: Response) => {
    res.json({ message: "Logged out" });
  });

  // Google OAuth - Initiate
  app.get("/api/auth/google", (req: any, res: Response) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ message: "Supabase OAuth not configured" });
    }
    res.redirect(getSupabaseAuthorizeUrl("google"));
  });

  // GitHub OAuth - Initiate
  app.get("/api/auth/github", (req: any, res: Response) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ message: "Supabase OAuth not configured" });
    }

    res.redirect(getSupabaseAuthorizeUrl("github"));
  });
}
