import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { MealRow } from "../types.js";

export const mealRoutes = Router();

// GET /api/meals/today - Return today's meals and nutritional totals dynamically based on date
mealRoutes.get("/today", (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required" });
    }

    // Accept client date (YYYY-MM-DD) or fallback to server system date
    const clientDate = (req.query.date as string) || new Date().toISOString().split("T")[0];
    
    const meals = db
      .prepare(`
        SELECT * FROM meals 
        WHERE user_email = ? 
          AND (date(created_at) = date(?) OR substr(created_at, 1, 10) = ?)
        ORDER BY created_at DESC
      `)
      .all(email, clientDate, clientDate) as MealRow[];

    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + (Number(m.calories) || 0),
        protein: acc.protein + (Number(m.protein) || 0),
        carbs: acc.carbs + (Number(m.carbs) || 0),
        fats: acc.fats + (Number(m.fats) || 0),
        fiber: acc.fiber + (Number(m.fiber) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );

    const dateObj = new Date(`${clientDate}T12:00:00`);
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(dateObj);

    return res.status(200).json({
      success: true,
      meals,
      totals,
      count: meals.length,
      date: clientDate,
      weekday,
    });
  } catch (error: any) {
    console.error("❌ Error in GET /api/meals/today:", error);
    return res.status(500).json({ error: "Failed to fetch today's meals", details: error.message });
  }
});

// GET /api/meals - Return meal history (optionally filtered by date)
mealRoutes.get("/", (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required" });
    }

    const date = req.query.date as string; // Optional: YYYY-MM-DD
    let meals: MealRow[] = [];

    if (date) {
      meals = db
        .prepare(`
          SELECT * FROM meals 
          WHERE user_email = ? 
            AND (date(created_at) = date(?) OR substr(created_at, 1, 10) = ?)
          ORDER BY created_at DESC
        `)
        .all(email, date, date) as MealRow[];
    } else {
      meals = db
        .prepare("SELECT * FROM meals WHERE user_email = ? ORDER BY created_at DESC LIMIT 200")
        .all(email) as MealRow[];
    }

    return res.status(200).json({ success: true, meals });
  } catch (error: any) {
    console.error("❌ Error in GET /api/meals:", error);
    return res.status(500).json({ error: "Failed to fetch meals", details: error.message });
  }
});

// GET /api/meals/:id - Return one meal
mealRoutes.get("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const meal = db.prepare("SELECT * FROM meals WHERE id = ?").get(id) as MealRow | undefined;
    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }
    return res.status(200).json({ success: true, meal });
  } catch (error: any) {
    console.error("❌ Error in GET /api/meals/:id:", error);
    return res.status(500).json({ error: "Failed to retrieve meal", details: error.message });
  }
});

// POST /api/meals - Save analyzed meal
mealRoutes.post("/", (req: Request, res: Response) => {
  try {
    const {
      id,
      user_email,
      food_name,
      calories,
      protein,
      carbs,
      fats,
      fiber,
      glycemic_index,
      metabolic_impact,
      nutrition_reasoning,
      meal_type,
      image_data,
      created_at,
    } = req.body;

    if (!user_email || !food_name) {
      return res.status(400).json({ error: "user_email and food_name are required" });
    }

    const mealId = id || `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = created_at || new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO meals (
        id, user_email, food_name, calories, protein, carbs, fats, fiber,
        glycemic_index, metabolic_impact, nutrition_reasoning, meal_type, image_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      mealId,
      user_email,
      food_name,
      Number(calories) || 0,
      Number(protein) || 0,
      Number(carbs) || 0,
      Number(fats) || 0,
      Number(fiber) || 0,
      glycemic_index || "Medium",
      metabolic_impact || "",
      nutrition_reasoning || "",
      meal_type || "Snack",
      image_data || null,
      timestamp
    );

    const savedMeal = db.prepare("SELECT * FROM meals WHERE id = ?").get(mealId) as MealRow;
    return res.status(201).json({ success: true, meal: savedMeal });
  } catch (error: any) {
    console.error("❌ Error in POST /api/meals:", error);
    return res.status(500).json({ error: "Failed to save meal", details: error.message });
  }
});

// DELETE /api/meals/:id - Delete meal
mealRoutes.delete("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleteStmt = db.prepare("DELETE FROM meals WHERE id = ?");
    const result = deleteStmt.run(id);

    return res.status(200).json({
      success: true,
      message: "Meal deleted successfully",
      changes: result.changes,
    });
  } catch (error: any) {
    console.error("❌ Error in DELETE /api/meals/:id:", error);
    return res.status(500).json({ error: "Failed to delete meal", details: error.message });
  }
});

// POST /api/meals/batch-sync - Batch sync meals
mealRoutes.post("/batch-sync", (req: Request, res: Response) => {
  try {
    const { user_email, meals } = req.body;
    if (!user_email || !Array.isArray(meals)) {
      return res.status(400).json({ error: "user_email and meals array required" });
    }

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO meals (
        id, user_email, food_name, calories, protein, carbs, fats, fiber,
        glycemic_index, metabolic_impact, nutrition_reasoning, meal_type, image_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const syncMany = db.transaction((mealList: any[]) => {
      for (const m of mealList) {
        insertStmt.run(
          m.id || `meal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          user_email,
          m.food_name || m.name || "Logged Meal",
          Number(m.calories) || 0,
          Number(m.protein) || 0,
          Number(m.carbs) || 0,
          Number(m.fats) || 0,
          Number(m.fiber) || 0,
          m.glycemic_index || "Medium",
          m.metabolic_impact || "",
          m.nutrition_reasoning || "",
          m.meal_type || m.mealType || "Snack",
          m.image_data || m.image || null,
          m.created_at || m.timestamp || new Date().toISOString()
        );
      }
    });

    syncMany(meals);
    const allMeals = db
      .prepare("SELECT * FROM meals WHERE user_email = ? ORDER BY created_at DESC")
      .all(user_email) as MealRow[];

    return res.status(200).json({ success: true, count: allMeals.length, meals: allMeals });
  } catch (error: any) {
    console.error("❌ Error in POST /api/meals/batch-sync:", error);
    return res.status(500).json({ error: "Failed to sync meals", details: error.message });
  }
});

// GET /api/meals/weekly-progress - Fetch 7-day weekly progress with dynamic Monday-to-Sunday dates and long-term memory analysis
mealRoutes.get("/weekly-progress", async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    const clientDate = req.query.date as string | undefined;
    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    const { calculateWeeklyProgress } = await import("../services/memorySystem.js");
    const progress = await calculateWeeklyProgress(email, user, clientDate);

    return res.status(200).json({
      success: true,
      progress,
    });
  } catch (error: any) {
    console.error("❌ Error in GET /api/meals/weekly-progress:", error);
    return res.status(500).json({ error: "Failed to calculate weekly progress", details: error.message });
  }
});

