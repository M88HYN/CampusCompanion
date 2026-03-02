/*
==========================================================
File: server/index-prod.ts

Module: Core Platform

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

import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import express, { type Express } from "express";
import runApp from "./app";
import { createUser, findUserByEmail, findUserByUsername } from "./auth";
import { storage } from "./storage";
import { seedComputerScienceData } from "./seed-computer-science";
import { seedCompletedQuizzes } from "./seed-completed-quizzes";

/*
----------------------------------------------------------
Function: serveStatic

Purpose:
Encapsulates a discrete unit of logic to keep behavior reusable, testable, and easy to reason about.

Parameters:
- app: Input consumed by this routine during execution
- _server: Input consumed by this routine during execution

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
export async function serveStatic(app: Express, _server: Server) {
  const enableDemoUser = process.env.ENABLE_DEMO_USER !== "false";
  const enableDemoSeed = process.env.ENABLE_DEMO_SEED !== "false";

  if (enableDemoUser) {
    try {
      const demoUsername = "demo-user";
      const demoEmail = "demo@studymate.local";
      const demoPassword = "demo-user";

      const existingByUsername = await findUserByUsername(demoUsername);
      const existingByEmail = await findUserByEmail(demoEmail);
      let demoUser = existingByUsername || existingByEmail;

      if (!demoUser) {
        demoUser = await createUser(demoEmail, demoPassword, "Demo", "User", demoUsername);
        console.log("[PROD AUTH] Created demo account: demo-user / demo-user");
      }

      if (demoUser && enableDemoSeed) {
        const [existingNotes, existingDecks, existingQuizzes] = await Promise.all([
          storage.getNotes(demoUser.id),
          storage.getDecks(demoUser.id),
          storage.getQuizzes(demoUser.id),
        ]);

        const hasCoreSampleData =
          existingNotes.length > 0 || existingDecks.length > 0 || existingQuizzes.length > 0;

        if (!hasCoreSampleData) {
          await seedComputerScienceData(demoUser.id);
          console.log("[PROD SEED] Seeded demo core sample data");
        }

        await seedCompletedQuizzes(demoUser.id);
        console.log("[PROD SEED] Ensured demo completed-quiz analytics data");
      }
    } catch (error) {
      console.error("[PROD AUTH] Failed to ensure demo account:", error);
    }
  }

  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

(async () => {
  await runApp(serveStatic);
})();
