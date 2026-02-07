import { type AuthUser } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// In-memory storage for demo (but also sync with database)
const userCache = new Map<string, AuthUser>();

export const storage = {
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

  async findUserById(userId: string): Promise<AuthUser | null> {
    return userCache.get(userId) || null;
  },

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

  async deleteUser(userId: string): Promise<void> {
    userCache.delete(userId);
  },
};
