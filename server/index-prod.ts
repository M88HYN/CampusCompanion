import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import express, { type Express } from "express";
import runApp from "./app";
import { createUser, findUserByEmail, findUserByUsername } from "./auth";

export async function serveStatic(app: Express, _server: Server) {
  const enableDemoUser = process.env.ENABLE_DEMO_USER !== "false";

  if (enableDemoUser) {
    try {
      const demoUsername = "demo-user";
      const demoEmail = "demo@studymate.local";
      const demoPassword = "demo-user";

      const existingByUsername = await findUserByUsername(demoUsername);
      const existingByEmail = await findUserByEmail(demoEmail);
      const demoUser = existingByUsername || existingByEmail;

      if (!demoUser) {
        await createUser(demoEmail, demoPassword, "Demo", "User", demoUsername);
        console.log("[PROD AUTH] Created demo account: demo-user / demo-user");
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
