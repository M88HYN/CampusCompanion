import "dotenv/config"; // Load .env variables FIRST before other imports
import runApp from "./app";
import type { Express } from "express";
import type { Server } from "http";
import { createUser, findUserByEmail, findUserByUsername, hashPassword } from "./auth";
import { storage } from "./auth-storage";
import { seedComputerScienceData } from "./seed-computer-science";
import { seedCompletedQuizzes } from "./seed-completed-quizzes";

// Setup function for development
const setup = async (_app: Express, _server: Server) => {
  try {
    const demoUsername = "demo-user";
    const demoEmail = "demo@studymate.local";
    const demoPassword = "demo-user";

    const existingByUsername = await findUserByUsername(demoUsername);
    const existingByEmail = await findUserByEmail(demoEmail);
    let demoUser = existingByUsername || existingByEmail;

    if (!demoUser) {
      demoUser = await createUser(demoEmail, demoPassword, "Demo", "User", demoUsername);
      console.log("[DEV AUTH] Created demo account: demo-user / demo-user");
    } else {
      const passwordHash = await hashPassword(demoPassword);
      await storage.updateUser({
        ...demoUser,
        username: demoUsername,
        email: demoEmail,
        password: passwordHash,
        firstName: "Demo",
        lastName: "User",
      });
      console.log("[DEV AUTH] Demo account reset: demo-user / demo-user");
    }

    await seedComputerScienceData(demoUser.id);
    await seedCompletedQuizzes(demoUser.id);
    console.log("[DEV SEED] Demo sample data is ready");
  } catch (error) {
    console.error("[DEV AUTH] Failed to ensure demo account:", error);
  }

  return;
};



// Start with error handling
runApp(setup).catch((error) => {
  console.error("Failed to start app:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});



