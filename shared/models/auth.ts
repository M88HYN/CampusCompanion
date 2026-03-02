/*
==========================================================
File: shared/models/auth.ts

Module: Authentication and Access Control

Purpose:
Defines responsibilities specific to this unit while preserving
clear boundaries with adjacent modules in CampusCompanion.

Architectural Layer:
Data Access Layer

System Interaction:
- Defines shared contracts and schema primitives consumed by both frontend and backend
- Provides type-safe boundaries that reduce coupling and integration defects

Design Rationale:
A dedicated file-level boundary supports maintainability,
traceability, and scalability by keeping concerns local and
allowing safe evolution of features without cross-module side effects.
==========================================================
*/

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
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
