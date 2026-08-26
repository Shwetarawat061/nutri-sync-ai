import { Router, Request, Response } from "express";
import { storage } from "../storage.js";

export const mealRoutes = Router();

async function getOwner(req: Request) {
  if (!req.user) return null;
  return storage.findUserByIdOrEmail(req.user.id, req.user.email);
}

mealRoutes.get("/today", async (req: Request, res: Response) => {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const meals = await storage.getMeals(user, { date });
    const mapped = meals.map(storage.toPublicMeal);
    const totals = mapped.reduce((acc: any, meal: any) => ({
      calories: acc.calories + (Number(meal.calories) || 0),
      protein: acc.protein + (Number(meal.protein) || 0),
      carbs: acc.carbs + (Number(meal.carbs) || 0),
      fats: acc.fats + (Number(meal.fats) || 0),
      fiber: acc.fiber + (Number(meal.fiber) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });
    return res.status(200).json({
      success: true,
      meals: mapped,
      totals,
      count: mapped.length,
      date,
      weekday: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${date}T12:00:00`))
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch today's meals", details: error.message });
  }
});

mealRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const meals = await storage.getMeals(user, { date: req.query.date as string | undefined, limit: 200 });
    return res.status(200).json({ success: true, meals: meals.map(storage.toPublicMeal) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch meals", details: error.message });
  }
});

mealRoutes.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const meal = await storage.getMealById(req.params.id, user);
    if (!meal) return res.status(404).json({ error: "Meal not found" });
    return res.status(200).json({ success: true, meal: storage.toPublicMeal(meal) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to retrieve meal", details: error.message });
  }
});

mealRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const body = req.body || {};

    const rawFoodName = body.food_name || body.foodName || body.mealName;
    if (!rawFoodName || typeof rawFoodName !== "string" || !rawFoodName.trim()) {
      return res.status(400).json({ error: "A valid meal name is required", code: "VALIDATION_ERROR" });
    }
    const foodName = rawFoodName.trim().slice(0, 240);

    const rawMealType = body.meal_type || body.mealType || "Snack";
    const mealType = typeof rawMealType === "string" && rawMealType.trim() ? rawMealType.trim().slice(0, 50) : "Snack";

    const calories = Math.max(0, Math.round(Number(body.calories ?? body.nutrition?.calories ?? 0) || 0));
    const protein = Math.max(0, Math.round((Number(body.protein ?? body.nutrition?.protein ?? 0) || 0) * 10) / 10);
    const carbs = Math.max(0, Math.round((Number(body.carbs ?? body.nutrition?.carbs ?? 0) || 0) * 10) / 10);
    const fats = Math.max(0, Math.round((Number(body.fats ?? body.fat ?? body.nutrition?.fat ?? 0) || 0) * 10) / 10);
    const fiber = Math.max(0, Math.round((Number(body.fiber ?? body.nutrition?.fiber ?? 0) || 0) * 10) / 10);

    // Collect and sanitize image URLs (support data URLs, CDN URLs, web links)
    let imageUrls: string[] = [];
    if (Array.isArray(body.image_urls)) {
      imageUrls = body.image_urls.filter((u: unknown) => typeof u === "string" && u.trim().length > 0);
    } else if (Array.isArray(body.imageUrls)) {
      imageUrls = body.imageUrls.filter((u: unknown) => typeof u === "string" && u.trim().length > 0);
    } else if (typeof body.image_url === "string" && body.image_url.trim()) {
      imageUrls = [body.image_url.trim()];
    } else if (typeof body.imageUrl === "string" && body.imageUrl.trim()) {
      imageUrls = [body.imageUrl.trim()];
    }

    const primaryImageUrl = imageUrls[0] || (typeof body.image_url === "string" ? body.image_url : undefined) || (typeof body.imageUrl === "string" ? body.imageUrl : undefined);

    const mealPayload = {
      ...body,
      food_name: foodName,
      foodName,
      meal_type: mealType,
      mealType,
      calories,
      protein,
      carbs,
      fats,
      fiber,
      image_urls: imageUrls,
      imageUrls,
      image_url: primaryImageUrl,
      imageUrl: primaryImageUrl,
      glycemic_index: body.glycemic_index || body.glycemicIndex || "Medium",
      metabolic_impact: body.metabolic_impact || body.metabolicImpact || "",
      nutrition_reasoning: body.nutrition_reasoning || body.nutritionReasoning || "",
    };

    const meal = await storage.createMeal(user, mealPayload);
    return res.status(201).json({ success: true, meal: storage.toPublicMeal(meal) });
  } catch (error: any) {
    console.error("Failed to save meal:", error);
    return res.status(400).json({ error: "Failed to save meal", code: "VALIDATION_ERROR", details: error.message });
  }
});

mealRoutes.put("/:id", async (req: Request, res: Response) => {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const updated = await storage.updateMeal(req.params.id, user, req.body || {});
    if (!updated) return res.status(404).json({ error: "Meal not found" });
    return res.status(200).json({ success: true, meal: storage.toPublicMeal(updated) });
  } catch (error: any) {
    return res.status(400).json({ error: "Failed to update meal", details: error.message });
  }
});

mealRoutes.patch("/:id", async (req: Request, res: Response) => {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const updated = await storage.updateMeal(req.params.id, user, req.body || {});
    if (!updated) return res.status(404).json({ error: "Meal not found" });
    return res.status(200).json({ success: true, meal: storage.toPublicMeal(updated) });
  } catch (error: any) {
    return res.status(400).json({ error: "Failed to update meal", details: error.message });
  }
});

mealRoutes.delete("/:id", async (req: Request, res: Response) => {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const deletedCount = await storage.deleteMeal(req.params.id, user);
    return res.status(200).json({ success: true, message: "Meal deleted successfully", changes: deletedCount });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to delete meal", details: error.message });
  }
});

mealRoutes.post("/batch-sync", async (req: Request, res: Response) => {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    if (!Array.isArray(req.body.meals)) return res.status(400).json({ error: "meals array required", code: "VALIDATION_ERROR" });
    const meals = await storage.batchSyncMeals(user, req.body.meals);
    return res.status(200).json({ success: true, count: meals.length, meals: meals.map(storage.toPublicMeal) });
  } catch (error: any) {
    return res.status(400).json({ error: "Failed to sync meals", code: "VALIDATION_ERROR", details: error.message });
  }
});

mealRoutes.get("/weekly-progress", async (req: Request, res: Response) => {
  try {
    const user = await getOwner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const anchor = req.query.date ? new Date(`${req.query.date}T12:00:00`) : new Date();
    const monday = new Date(anchor);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);
    const meals = await storage.getMeals(user, { startDate: monday, endDate: sunday, limit: 300 });
    const calorieTarget = Number(user.calorieTarget || user.calorie_target) || 2100;
    const proteinTarget = Number(user.proteinTarget || user.protein_target) || 120;
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateString = date.toISOString().slice(0, 10);
      const dayMeals = meals.filter((meal: any) => new Date(meal.created_at || meal.createdAt).toISOString().slice(0, 10) === dateString);
      const calories = dayMeals.reduce((sum: number, meal: any) => sum + (Number(meal.calories) || 0), 0);
      const protein = dayMeals.reduce((sum: number, meal: any) => sum + (Number(meal.protein) || 0), 0);
      const adherenceScore = dayMeals.length ? Math.min(100, Math.round((Math.min(1.1, calories / calorieTarget) * 40) + (Math.min(1.1, protein / proteinTarget) * 60))) : 0;
      return {
        date: dateString,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(dayMeals.reduce((sum: number, meal: any) => sum + (Number(meal.carbs) || 0), 0)),
        fats: Math.round(dayMeals.reduce((sum: number, meal: any) => sum + (Number(meal.fats) || 0), 0)),
        calorieTarget,
        proteinTarget,
        adherenceScore,
        mealsCount: dayMeals.length,
        status: dayMeals.length ? (calories > calorieTarget * 1.15 ? "over" : protein >= proteinTarget * 0.7 ? "on_track" : "under") : "under",
        isToday: dateString === new Date().toISOString().slice(0, 10)
      };
    });
    const loggedDays = days.filter((day) => day.mealsCount > 0);
    const averageCalories = loggedDays.length ? Math.round(loggedDays.reduce((sum, day) => sum + day.calories, 0) / loggedDays.length) : 0;
    const averageProtein = loggedDays.length ? Math.round(loggedDays.reduce((sum, day) => sum + day.protein, 0) / loggedDays.length) : 0;
    const averageScore = loggedDays.length ? Math.round(loggedDays.reduce((sum, day) => sum + day.adherenceScore, 0) / loggedDays.length) : 0;
    return res.status(200).json({
      success: true,
      progress: {
        weekRange: `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(sunday.getTime() - 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        days,
        averageCalories,
        averageProtein,
        averageScore,
        totalMealsLogged: meals.length,
        streakDays: 0,
        proteinGoalDays: days.filter((day) => day.protein >= proteinTarget * 0.85).length,
        calorieGoalDays: days.filter((day) => day.calories >= calorieTarget * 0.85 && day.calories <= calorieTarget * 1.15).length,
        aiWeeklySummary: `You averaged ${averageProtein}g protein across ${loggedDays.length} logged day${loggedDays.length === 1 ? "" : "s"}.`,
        topImprovement: `Distribute your ${proteinTarget}g protein target across each meal window.`,
        memoryInsights: []
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to calculate weekly progress", details: error.message });
  }
});
