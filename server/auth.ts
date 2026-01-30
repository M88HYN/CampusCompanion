import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./auth-storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production-use-strong-random-string";
const JWT_EXPIRY = "7d";

export interface AuthUser {
  id: string;
  username?: string;
  email: string;
  password?: string;
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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

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

export async function createUser(email: string, password: string, firstName?: string, lastName?: string, username?: string): Promise<AuthUser> {
  const hashedPassword = await hashPassword(password);
  const userId = Date.now().toString();
  
  const user: AuthUser = {
    id: userId,
    username,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    provider: "local",
  };

  // Store user (implement in your storage layer)
  await storage.createUser(user);
  return user;
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  return storage.findUserByEmail(email);
}

export async function findUserByUsername(username: string): Promise<AuthUser | null> {
  return storage.findUserByUsername(username);
}

export async function findUserById(userId: string): Promise<AuthUser | null> {
  return storage.findUserById(userId);
}

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
