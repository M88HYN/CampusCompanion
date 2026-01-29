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

  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
  
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });

  // Handle server errors
  server.on('error', (error) => {
    log(`Server error: ${error.message}`, "express");
    console.error('Server Error:', error);
  });
}