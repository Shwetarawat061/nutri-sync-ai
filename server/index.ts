import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initDatabase } from "./db.js";
import { userRoutes } from "./routes/userRoutes.js";
import { mealRoutes } from "./routes/mealRoutes.js";
import { aiRoutes } from "./routes/aiRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import hydrationRoutes from "./routes/hydrationRoutes.js";
import { authenticateUser } from "./middleware/auth.js";
import { connectMongo, migrateSqliteToMongo } from "./mongo.js";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Initialize DB tables safely
try {
  initDatabase();
} catch (err) {
  console.warn("⚠️ SQLite initialization warning:", err);
}

export async function startServer() {
  const app = express();
  const PORT = 3000;
  const clientUrl = process.env.CLIENT_URL || process.env.APP_URL;

  // Enable trust proxy for reverse proxy environment (Cloud Run / NGINX)
  app.set("trust proxy", 1);

  // Safe MongoDB connection in background / startup without crashing
  try {
    const mongo = await connectMongo();
    if (mongo) {
      await migrateSqliteToMongo();
    }
  } catch (err) {
    console.warn("⚠️ MongoDB startup connection note:", err);
  }

  app.use(cors({
    origin: (origin, callback) => {
      if (process.env.NODE_ENV === "production") {
        return callback(null, Boolean(origin && clientUrl && origin === clientUrl));
      }
      return callback(null, !origin || origin === "http://localhost:3000" || origin === "http://localhost:5173");
    },
    credentials: true,
  }));

  // Keep JSON and image payloads bounded to reduce memory and abuse risk.
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "NutriSync Neural Engine" });
  });

  app.use("/api/auth", authRoutes);

  // API Routes
  app.use("/api/user", authenticateUser, userRoutes);
  app.use("/api/meals", authenticateUser, mealRoutes);
  app.use("/api/hydration", authenticateUser, hydrationRoutes);
  app.use(
    "/api/ai",
    authenticateUser,
    rateLimit({
      windowMs: 60 * 1000,
      limit: 30,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      keyGenerator: (req) => (req as any).user?.id || (req as any).user?.email || req.ip || "unknown",
      validate: {
        xForwardedForHeader: false,
        forwardedHeader: false,
        trustProxy: false,
      },
      message: { error: "Too many AI requests. Please try again later.", code: "AI_RATE_LIMITED" },
    }),
    aiRoutes
  );

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`⚡ NutriSync Core Server running on http://localhost:${PORT}`);
  });

  return app;
}

startServer();
