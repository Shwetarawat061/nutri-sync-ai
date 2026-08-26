import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initDatabase } from "./db.js";
import { userRoutes } from "./routes/userRoutes.js";
import { mealRoutes } from "./routes/mealRoutes.js";
import { aiRoutes } from "./routes/aiRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { authenticateUser } from "./middleware/auth.js";
import { connectMongo, migrateSqliteToMongo } from "./mongo.js";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Initialize DB tables
initDatabase();

export async function startServer() {
  await connectMongo();
  await migrateSqliteToMongo();
  const app = express();
  const PORT = 3000;
  const clientUrl = process.env.CLIENT_URL || process.env.APP_URL;

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
  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ extended: true, limit: "12mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "NutriSync Neural Engine" });
  });

  app.use("/api/auth", authRoutes);

  // API Routes
  app.use("/api/user", authenticateUser, userRoutes);
  app.use("/api/meals", authenticateUser, mealRoutes);
  app.use("/api/ai", authenticateUser, rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many AI requests. Please try again later.", code: "AI_RATE_LIMITED" },
  }), aiRoutes);

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
