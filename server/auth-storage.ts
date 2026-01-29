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
        email: user.email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
          email: user.email,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          updatedAt: new Date(),
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
    return null;
  },

  async deleteUser(userId: string): Promise<void> {
    userCache.delete(userId);
  },
};
