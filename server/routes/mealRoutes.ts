import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { MealModel } from "../models/Meal.js";
import { UserModel } from "../models/User.js";

export const mealRoutes = Router();

function asMeal(meal: any) {
  const value = meal.toObject ? meal.toObject() : meal;
  return {
    id: String(value._id),
    user_email: value.userEmail,
    food_name: value.foodName,
    calories: value.calories,
    protein: value.protein,
    carbs: value.carbs,
    fats: value.fats,
    fiber: value.fiber,
    glycemic_index: value.glycemicIndex,
    metabolic_impact: value.metabolicImpact,
    nutrition_reasoning: value.nutritionReasoning,
    meal_type: value.mealType,
    image_url: value.imageUrl,
    image_urls: value.imageUrls || (value.imageData ? [value.imageData] : []),
    foods: value.foods || [],
    nutrition: value.nutrition,
    ai_metadata: value.aiMetadata,
    created_at: value.createdAt,
  };
}

async function owner(req: Request) {
  if (!mongoose.isValidObjectId(req.user!.id)) return null;
  return UserModel.findOne({ _id: req.user!.id, email: req.user!.email });
}

function dateRange(date?: string) {
  if (!date) return {};
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { createdAt: { $gte: start, $lt: end } };
}

mealRoutes.get("/today", async (req: Request, res: Response) => {
  try {
    const user = await owner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const meals = await MealModel.find({ userId: user._id, ...dateRange(date) }).sort({ createdAt: -1 });
    const mapped = meals.map(asMeal);
    const totals = mapped.reduce((acc, meal) => ({
      calories: acc.calories + (Number(meal.calories) || 0), protein: acc.protein + (Number(meal.protein) || 0),
      carbs: acc.carbs + (Number(meal.carbs) || 0), fats: acc.fats + (Number(meal.fats) || 0), fiber: acc.fiber + (Number(meal.fiber) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });
    return res.status(200).json({ success: true, meals: mapped, totals, count: mapped.length, date, weekday: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${date}T12:00:00`)) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch today's meals", details: error.message });
  }
});

mealRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const user = await owner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const meals = await MealModel.find({ userId: user._id, ...dateRange(req.query.date as string | undefined) }).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ success: true, meals: meals.map(asMeal) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch meals", details: error.message });
  }
});

mealRoutes.get("/weekly-progress", async (req: Request, res: Response) => {
  const user = await owner(req);
  if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
  const date = new Date(`${(req.query.date as string) || new Date().toISOString().slice(0, 10)}T12:00:00`);
  const monday = new Date(date);
  monday.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  const meals = await MealModel.find({ userId: user._id, createdAt: { $gte: monday, $lt: sunday } });
  const calorieTarget = Number(user.calorieTarget) || 2100;
  const proteinTarget = Number(user.proteinTarget) || 120;
  const days = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    const dayMeals = meals.filter((meal: any) => new Date(meal.createdAt).toISOString().slice(0, 10) === current.toISOString().slice(0, 10));
    const sum = (field: string) => Math.round(dayMeals.reduce((total: number, meal: any) => total + (Number(meal[field]) || 0), 0));
    return { date: current.toISOString().slice(0, 10), dayName: current.toLocaleDateString("en-US", { weekday: "short" }), calories: sum("calories"), protein: sum("protein"), carbs: sum("carbs"), fats: sum("fats"), calorieTarget, proteinTarget, adherenceScore: dayMeals.length ? Math.min(100, Math.round((sum("calories") / calorieTarget) * 40 + (sum("protein") / proteinTarget) * 60)) : 0, mealsCount: dayMeals.length, status: dayMeals.length ? "on_track" : "under", isToday: current.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10) };
  });
  return res.status(200).json({ success: true, progress: { weekRange: `${monday.toISOString().slice(0, 10)} - ${sunday.toISOString().slice(0, 10)}`, days, averageCalories: 0, averageProtein: 0, averageScore: 0, totalMealsLogged: meals.length, streakDays: 0, proteinGoalDays: days.filter((day) => day.protein >= proteinTarget * 0.85).length, calorieGoalDays: days.filter((day) => day.calories >= calorieTarget * 0.85 && day.calories <= calorieTarget * 1.15).length, aiWeeklySummary: "Weekly progress calculated from your MongoDB meal history.", topImprovement: `Distribute your ${proteinTarget}g protein target across the day.`, memoryInsights: [] } });
});

mealRoutes.get("/:id", async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Meal not found" });
    const meal = await MealModel.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!meal) return res.status(404).json({ error: "Meal not found" });
    return res.status(200).json({ success: true, meal: asMeal(meal) });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to retrieve meal", details: error.message });
  }
});

mealRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const user = await owner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const body = req.body || {};
    const numericFields = ["calories", "protein", "carbs", "fats"];
    if (typeof body.food_name !== "string" || !body.food_name.trim() || body.food_name.length > 240 ||
      numericFields.some((field) => typeof body[field] !== "number" || !Number.isFinite(body[field]) || body[field] < 0) ||
      (body.fiber !== undefined && (typeof body.fiber !== "number" || !Number.isFinite(body.fiber) || body.fiber < 0)) ||
      typeof body.meal_type !== "string" || !body.meal_type.trim() ||
      (body.image_urls !== undefined && (!Array.isArray(body.image_urls) || body.image_urls.length > 4 || body.image_urls.some((url: unknown) => typeof url !== "string" || url.length > 2048)))) {
      return res.status(400).json({ error: "A valid meal name, nutrition, meal type, and image URLs are required", code: "VALIDATION_ERROR" });
    }
    const meal = await MealModel.create({
      userId: user._id, foodName: body.food_name, calories: body.calories, protein: body.protein,
      carbs: body.carbs, fats: body.fats, fiber: body.fiber, glycemicIndex: body.glycemic_index,
      metabolicImpact: body.metabolic_impact, nutritionReasoning: body.nutrition_reasoning,
      mealType: body.meal_type, imageUrl: body.image_url, imageUrls: body.image_urls,
      foods: body.foods, nutrition: body.nutrition, aiMetadata: body.ai_metadata, scanResult: body.scan_result,
      ...(body.created_at ? { createdAt: new Date(body.created_at), updatedAt: new Date(body.created_at) } : {}),
    });
    return res.status(201).json({ success: true, meal: asMeal(meal) });
  } catch (error: any) {
    return res.status(400).json({ error: "Failed to save meal", code: "VALIDATION_ERROR", details: error.message });
  }
});

mealRoutes.delete("/:id", async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Meal not found" });
    const result = await MealModel.deleteOne({ _id: req.params.id, userId: req.user!.id });
    return res.status(200).json({ success: true, message: "Meal deleted successfully", changes: result.deletedCount });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to delete meal", details: error.message });
  }
});

mealRoutes.post("/batch-sync", async (req: Request, res: Response) => {
  try {
    const user = await owner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    if (!Array.isArray(req.body.meals)) return res.status(400).json({ error: "meals array required", code: "VALIDATION_ERROR" });
    const docs = req.body.meals.map((meal: any) => ({
      userId: user._id,
      foodName: meal.food_name || meal.name || "Logged Meal",
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fats: meal.fats || 0,
      fiber: meal.fiber || 0,
      glycemicIndex: meal.glycemic_index || "Medium",
      metabolicImpact: meal.metabolic_impact || "",
      nutritionReasoning: meal.nutrition_reasoning || "",
      mealType: meal.meal_type || meal.mealType || "Snack",
      imageData: meal.image_data || meal.image,
    }));
    if (docs.length) await MealModel.insertMany(docs, { ordered: false });
    const meals = await MealModel.find({ userId: user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: meals.length, meals: meals.map(asMeal) });
  } catch (error: any) {
    return res.status(400).json({ error: "Failed to sync meals", code: "VALIDATION_ERROR", details: error.message });
  }
});

mealRoutes.get("/weekly-progress", async (req: Request, res: Response) => {
  try {
    const user = await owner(req);
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const anchor = req.query.date ? new Date(`${req.query.date}T12:00:00`) : new Date();
    const monday = new Date(anchor);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);
    const meals = await MealModel.find({ userId: user._id, createdAt: { $gte: monday, $lt: sunday } }).sort({ createdAt: 1 });
    const calorieTarget = Number(user.calorieTarget) || 2100;
    const proteinTarget = Number(user.proteinTarget) || 120;
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateString = date.toISOString().slice(0, 10);
      const dayMeals = meals.filter((meal: any) => new Date(meal.createdAt).toISOString().slice(0, 10) === dateString);
      const calories = dayMeals.reduce((sum: number, meal: any) => sum + (Number(meal.calories) || 0), 0);
      const protein = dayMeals.reduce((sum: number, meal: any) => sum + (Number(meal.protein) || 0), 0);
      const adherenceScore = dayMeals.length ? Math.min(100, Math.round((Math.min(1.1, calories / calorieTarget) * 40) + (Math.min(1.1, protein / proteinTarget) * 60))) : 0;
      return { date: dateString, dayName: date.toLocaleDateString("en-US", { weekday: "short" }), calories: Math.round(calories), protein: Math.round(protein), carbs: Math.round(dayMeals.reduce((sum: number, meal: any) => sum + (Number(meal.carbs) || 0), 0)), fats: Math.round(dayMeals.reduce((sum: number, meal: any) => sum + (Number(meal.fats) || 0), 0)), calorieTarget, proteinTarget, adherenceScore, mealsCount: dayMeals.length, status: dayMeals.length ? (calories > calorieTarget * 1.15 ? "over" : protein >= proteinTarget * 0.7 ? "on_track" : "under") : "under", isToday: dateString === new Date().toISOString().slice(0, 10) };
    });
    const loggedDays = days.filter((day) => day.mealsCount > 0);
    const averageCalories = loggedDays.length ? Math.round(loggedDays.reduce((sum, day) => sum + day.calories, 0) / loggedDays.length) : 0;
    const averageProtein = loggedDays.length ? Math.round(loggedDays.reduce((sum, day) => sum + day.protein, 0) / loggedDays.length) : 0;
    const averageScore = loggedDays.length ? Math.round(loggedDays.reduce((sum, day) => sum + day.adherenceScore, 0) / loggedDays.length) : 0;
    return res.status(200).json({ success: true, progress: { weekRange: `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(sunday.getTime() - 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, days, averageCalories, averageProtein, averageScore, totalMealsLogged: meals.length, streakDays: 0, proteinGoalDays: days.filter((day) => day.protein >= proteinTarget * 0.85).length, calorieGoalDays: days.filter((day) => day.calories >= calorieTarget * 0.85 && day.calories <= calorieTarget * 1.15).length, aiWeeklySummary: `You averaged ${averageProtein}g protein across ${loggedDays.length} logged day${loggedDays.length === 1 ? "" : "s"}.`, topImprovement: `Distribute your ${proteinTarget}g protein target across each meal window.`, memoryInsights: [] } });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to calculate weekly progress", details: error.message });
  }
});
