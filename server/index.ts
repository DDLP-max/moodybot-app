import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server folder (for production, it's in the same directory as the built index.js)
dotenv.config({ path: path.resolve(__dirname, ".env") });
import http from "http";
import cors from "cors";

if (!process.env.OPENROUTER_API_KEY) {
  console.warn("⚠️  OPENROUTER_API_KEY is not set in .env file");
}

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://moodybot.ai', 'https://www.moodybot.ai']
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true
}));

// Increase payload limits for image uploads
app.use(express.json({ limit: 10 * 1024 * 1024 })); // 10MB
app.use(express.urlencoded({ limit: 10 * 1024 * 1024, extended: true })); // 10MB

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

(async () => {
  try {
    console.log("🚀 Starting MoodyBot server...");
    console.log("📁 Current directory:", process.cwd());
    console.log("🔧 Environment:", process.env.NODE_ENV || 'development');
    console.log("🔑 API Key status:", process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');
    
    await registerRoutes(app); // no longer expecting a return value

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error("❌ Server error:", err);
    });

    const httpServer = http.createServer(app);

    if (process.env.NODE_ENV === "development") {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || '10000', 10);
    const host = '0.0.0.0';

    httpServer.listen(port, host, () => {
      log(`✅ MoodyBot server listening at http://${host}:${port}`);
      log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`✅ API Keys: ${process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 'None configured'}`);
    });

    // Handle server errors
    httpServer.on('error', (error) => {
      console.error("❌ Server error:", error);
      process.exit(1);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();
