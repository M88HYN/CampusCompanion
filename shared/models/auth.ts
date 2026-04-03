// Shared auth tables for users, sessions, and verification codes.

import { index, sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Session storage table.
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON string
    expire: integer("expire").notNull(), // Unix timestamp
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  })
);

// User storage table.
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Email verification codes table.
export const verificationCodes = sqliteTable(
  "verification_codes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    code: text("code").notNull(),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => ({
    userIdIdx: index("verification_codes_user_id_idx").on(table.userId),
    codeIdx: index("verification_codes_code_idx").on(table.code),
  })
);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type VerificationCode = typeof verificationCodes.$inferSelect;
