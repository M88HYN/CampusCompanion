import "dotenv/config";
import runApp from "./app";
import { seedComputerScienceData } from "./seed-computer-science";
import type { Express } from "express";
import type { Server } from "http";

// Setup function for development - seed sample data
const setup = async (_app: Express, _server: Server) => {
  try {
    // Use a default demo user ID for seeding
    const demoUserId = "demo-user";
    await seedComputerScienceData(demoUserId);
  } catch (error) {
    console.error("Error during setup:", error);
  }
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

