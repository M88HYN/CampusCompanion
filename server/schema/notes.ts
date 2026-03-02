/*
==========================================================
File: server/schema/notes.ts

Module: Notes Management

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

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull()
});
