import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import axios from "axios";
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  findOrCreateOAuthUser,
  comparePasswords,
  generateToken,
  verifyToken,
  type AuthUser,
} from "./auth";
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
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || "http://localhost:3000/api/auth/github/callback";

export function authMiddleware(req: any, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

  if (!token) {
    console.error("Auth failed: No token provided");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    console.error("Auth failed: Invalid token - verification failed. Token length:", token.length);
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = payload;
  
  // Ensure user exists in database AND has sample data (fire and forget)
  setImmediate(async () => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
      if (!user) {
        await db.insert(users).values({
          id: payload.userId,
          email: payload.email || `user-${payload.userId}@local.dev`,
          firstName: payload.firstName || null,
          lastName: payload.lastName || null,
          profileImageUrl: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }).catch(() => {}); // Ignore if already exists due to race condition
      }
      
      // Check if user has any data, seed if empty (only check once per user session)
      const notes = await storage.getNotes(payload.userId);
      const quizzes = await storage.getQuizzes(payload.userId);
      if (notes.length === 0 || quizzes.length === 0) {
        console.log(`[Auth] User ${payload.userId} has ${notes.length} notes and ${quizzes.length} quizzes - seeding sample content`);
        await seedComputerScienceData(payload.userId);
        await seedCompletedQuizzes(payload.userId);
      }
    } catch (error) {
      // Silently fail - best-effort seeding
      console.log("[Auth] Sample data seeding skipped:", error instanceof Error ? error.message : String(error));
    }
  });
  
  next();
}

export function registerAuthRoutes(app: Express) {
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
      
      // Seed sample data for new user
      try {
        await seedComputerScienceData(user.id);
      } catch (seedError) {
        console.log("Note: Could not seed sample data for new user, but registration succeeded:", seedError);
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

      // Seed sample data if user has none (fire and forget - don't block login)
      setImmediate(async () => {
        try {
          const notes = await storage.getNotes(user.id);
          if (notes.length === 0) {
            console.log("User has no data - seeding sample content for userId:", user.id);
            await seedComputerScienceData(user.id);
            await seedCompletedQuizzes(user.id);
          }
        } catch (seedError) {
          console.log("Note: Could not seed sample data, but login succeeded:", seedError);
        }
      });

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

  // Logout (client-side handled, but endpoint for completeness)
  app.post("/api/auth/logout", (req: any, res: Response) => {
    res.json({ message: "Logged out" });
  });

  // Google OAuth - Initiate
  app.get("/api/auth/google", (req: any, res: Response) => {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google OAuth not configured" });
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  // Google OAuth - Callback
  app.get("/api/auth/google/callback", async (req: any, res: Response) => {
    try {
      const { code, error } = req.query;

      if (error) {
        return res.redirect(`/?error=${error}`);
      }

      if (!code) {
        return res.status(400).json({ message: "No authorization code" });
      }

      // Exchange code for token
      const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      });

      const accessToken = tokenResponse.data.access_token;

      // Get user info
      const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const googleUser = userResponse.data;
      const email = googleUser.email;
      const firstName = googleUser.given_name || "";
      const lastName = googleUser.family_name || "";
      const googleId = googleUser.id;

      // Create or find user
      const user = await findOrCreateOAuthUser(email, "google", googleId, firstName, lastName);
      const token = generateToken(user);

      // Redirect to frontend with token
      res.redirect(`/?token=${token}`);
    } catch (error) {
      console.error("Google auth callback error:", error);
      res.redirect(`/?error=google_auth_failed`);
    }
  });

  // Microsoft OAuth - Initiate
  app.get("/api/auth/github", (req: any, res: Response) => {
    if (!GITHUB_CLIENT_ID) {
      return res.status(500).json({ message: "GitHub OAuth not configured" });
    }

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: "user:email",
      allow_signup: "true",
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  });

  // Microsoft OAuth - Callback
  app.get("/api/auth/microsoft/callback", async (req: any, res: Response) => {
    try {
      const { code, error } = req.query;

      if (error) {
        return res.redirect(`/?error=${error}`);
      }

      if (!code) {
        return res.status(400).json({ message: "No authorization code" });
      }

      // Exchange code for token
      const tokenResponse = await axios.post("https://github.com/login/oauth/access_token", {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      }, {
        headers: { Accept: "application/json" }
      });

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        return res.redirect(`/?error=github_auth_failed`);
      }

      // Get user info
      const userResponse = await axios.get("https://api.github.com/user", {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json"
        },
      });

      const githubUser = userResponse.data;
      const email = githubUser.email || `${githubUser.login}@github.com`;
      const firstName = githubUser.name ? githubUser.name.split(" ")[0] : githubUser.login;
      const lastName = githubUser.name ? githubUser.name.split(" ").slice(1).join(" ") : "";
      const githubId = githubUser.id.toString();

      // Create or find user
      const user = await findOrCreateOAuthUser(email, "github", githubId, firstName, lastName);
      const token = generateToken(user);

      // Redirect to frontend with token
      res.redirect(`/?token=${token}`);
    } catch (error) {
      console.error("GitHub auth callback error:", error);
      res.redirect(`/?error=github_auth_failed`);
    }
  });
}
