import "dotenv/config"; // Load .env variables FIRST before other imports
import runApp from "./app";
import type { Express } from "express";
import type { Server } from "http";

// Setup function for development
const setup = async (_app: Express, _server: Server) => {
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



