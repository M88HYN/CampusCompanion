import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// CORS configuration for local dev (allows vite dev server on 5173 to reach backend on 3000)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Health check endpoint - always works
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  // 404 handler - return JSON
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Not Found" });
  });

  // Global error handler - MUST be last middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const isDev = process.env.NODE_ENV === 'development';

    log(`ERROR: ${status} ${message}`, "express");
    
    if (isDev) {
      console.error(err);
    }

    res.status(status).json({
      message,
      ...(isDev && { stack: err.stack }),
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, "express");
    console.error('Unhandled Rejection:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    log(`Uncaught Exception: ${error.message}`, "express");
    console.error('Uncaught Exception:', error);
  });

  // Run setup
  await setup(app, server);

  const host = '0.0.0.0'; // Allow access from any device on the local network
  const PORT = 3000; // FIXED PORT - NO AUTO-INCREMENT

  // FAIL-FAST: If port is occupied, crash immediately with clear error
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ FATAL ERROR: Port ${PORT} is already in use!`);
      console.error(`❌ Another process is using port ${PORT}.`);
      console.error(`❌ Kill that process or change the port in shared/ports.ts\n`);
      process.exit(1);
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`\n❌ FATAL ERROR: Connection refused on port ${PORT}!`);
      process.exit(1);
    } else {
      console.error(`\n❌ FATAL ERROR: Server error:`, error);
      process.exit(1);
    }
  });

  // Start server on FIXED PORT ONLY
  server.listen(PORT, host, () => {
    log(`✅ Backend API server ready at http://${host}:${PORT}`);
    if (process.env.NODE_ENV === 'development') {
      log(`📱 Frontend will be available at http://localhost:5173`, "express");
      log(`🔗 API requests from frontend will be proxied to http://${host}:${PORT}`, "express");
    }
  });
}