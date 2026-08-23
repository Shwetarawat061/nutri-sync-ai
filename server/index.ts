import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initDatabase } from "./db.js";
import { userRoutes } from "./routes/userRoutes.js";
import { mealRoutes } from "./routes/mealRoutes.js";
import { aiRoutes } from "./routes/aiRoutes.js";

// Initialize DB tables
initDatabase();

export async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large base64 image uploads for Food Scan
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "NutriSync Neural Engine" });
  });

  // API Routes
  app.use("/api/user", userRoutes);
  app.use("/api/meals", mealRoutes);
  app.use("/api/ai", aiRoutes);

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
