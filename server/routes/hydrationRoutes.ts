import { Router } from "express";
import { storage } from "../storage.js";
import {
  calculateHydrationGoal,
  computeHydrationProgress,
  generateHydrationInsight,
  HydrationUserProfile,
} from "../services/hydrationService.js";
import { getDayBoundariesUTC } from "../utils/dateUtils.js";

const router = Router();

async function getOwner(req: any) {
  if (!req.user) return null;
  return storage.findUserByIdOrEmail(req.user.id, req.user.email);
}

// GET /api/hydration/goal
router.get("/goal", async (req: any, res) => {
  try {
    const user = await getOwner(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userProfile: HydrationUserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      activityLevel: user.activityLevel || user.activity_level,
      pregnancyStatus: user.pregnancyStatus || user.pregnancy_status,
      lactationStatus: user.lactationStatus || user.lactation_status,
      climate: user.climate,
      timezone: user.timezone,
    };

    const goal = calculateHydrationGoal(userProfile);
    return res.json({
      success: true,
      goal,
    });
  } catch (err: any) {
    console.error("GET /api/hydration/goal error:", err);
    return res.status(500).json({ error: "Failed to calculate hydration goal" });
  }
});

// GET /api/hydration/today
router.get("/today", async (req: any, res) => {
  try {
    const user = await getOwner(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const timezone = (req.query.timezone as string) || user.timezone || "UTC";

    const { date, entries, meals } = await storage.getHydrationToday(user, { timezone });

    const userProfile: HydrationUserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      activityLevel: user.activityLevel || user.activity_level,
      pregnancyStatus: user.pregnancyStatus || user.pregnancy_status,
      lactationStatus: user.lactationStatus || user.lactation_status,
      climate: user.climate,
      timezone,
    };

    // Extract meals with water content
    const mealWaterItems = meals.map((m: any) => ({
      id: m.id,
      foodName: m.food_name || m.foodName || "Meal",
      waterContentMl: m.water_content_ml !== undefined ? m.water_content_ml : m.waterContentMl,
      waterContentConfidence: m.water_content_confidence !== undefined ? m.water_content_confidence : m.waterContentConfidence,
      createdAt: m.created_at || m.createdAt,
    }));

    const hydrationEntryItems = entries.map((e: any) => ({
      id: e.id,
      userEmail: e.user_email || e.userEmail,
      amountMl: e.amount_ml || e.amountMl,
      beverageType: e.beverage_type || e.beverageType || "Water",
      consumedAt: e.consumed_at || e.consumedAt,
      source: e.source,
      notes: e.notes,
      createdAt: e.created_at || e.createdAt,
    }));

    const progress = computeHydrationProgress(userProfile, hydrationEntryItems, mealWaterItems);

    return res.json({
      success: true,
      date,
      timezone,
      ...progress,
      entries: hydrationEntryItems.map((e: any) => storage.toPublicHydrationEntry(e)),
    });
  } catch (err: any) {
    console.error("GET /api/hydration/today error:", err);
    return res.status(500).json({ error: "Failed to fetch today's hydration" });
  }
});

// POST /api/hydration/log (and /api/hydration/entries)
async function handleLogHydration(req: any, res: any) {
  try {
    const user = await getOwner(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { amountMl, amount_ml, beverageType, beverage_type, consumedAt, consumed_at, source, notes, timezone } = req.body;

    const rawAmount = amountMl !== undefined ? amountMl : amount_ml;
    const amount = Number(rawAmount);

    if (isNaN(amount) || amount <= 0 || amount > 10000) {
      return res.status(400).json({
        error: "Invalid drink amount. Please specify an amount between 1 and 10,000 ml.",
      });
    }

    const validBeverageTypes = ["Water", "Milk", "Tea", "Coffee", "Juice", "Other"];
    const bevTypeInput = beverageType || beverage_type || "Water";
    const selectedType = validBeverageTypes.includes(bevTypeInput) ? bevTypeInput : "Water";

    const entry = await storage.createHydrationEntry(user, {
      amountMl: amount,
      beverageType: selectedType,
      consumedAt: consumedAt || consumed_at,
      source: source || "manual",
      notes: notes || "",
    });

    const tz = timezone || user.timezone || "UTC";
    const { date, entries, meals } = await storage.getHydrationToday(user, { timezone: tz });

    const userProfile: HydrationUserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      activityLevel: user.activityLevel || user.activity_level,
      pregnancyStatus: user.pregnancyStatus || user.pregnancy_status,
      lactationStatus: user.lactationStatus || user.lactation_status,
      climate: user.climate,
      timezone: tz,
    };

    const mealWaterItems = meals.map((m: any) => ({
      id: m.id,
      foodName: m.food_name || m.foodName || "Meal",
      waterContentMl: m.water_content_ml !== undefined ? m.water_content_ml : m.waterContentMl,
      waterContentConfidence: m.water_content_confidence !== undefined ? m.water_content_confidence : m.waterContentConfidence,
      createdAt: m.created_at || m.createdAt,
    }));

    const hydrationEntryItems = entries.map((e: any) => ({
      id: e.id,
      userEmail: e.user_email || e.userEmail,
      amountMl: e.amount_ml || e.amountMl,
      beverageType: e.beverage_type || e.beverageType || "Water",
      consumedAt: e.consumed_at || e.consumedAt,
      source: e.source,
      notes: e.notes,
      createdAt: e.created_at || e.createdAt,
    }));

    const progress = computeHydrationProgress(userProfile, hydrationEntryItems, mealWaterItems);

    return res.status(201).json({
      success: true,
      entry: storage.toPublicHydrationEntry(entry),
      progress,
    });
  } catch (err: any) {
    console.error("POST /api/hydration/log error:", err);
    return res.status(500).json({ error: "Failed to log hydration entry" });
  }
}

router.post("/log", handleLogHydration);
router.post("/entries", handleLogHydration);

// GET /api/hydration/history
router.get("/history", async (req: any, res) => {
  try {
    const user = await getOwner(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const days = Math.min(90, Math.max(1, Number(req.query.days) || 7));
    const timezone = (req.query.timezone as string) || user.timezone || "UTC";
    const dateQuery = req.query.date as string | undefined;

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (dateQuery) {
      const boundaries = getDayBoundariesUTC(dateQuery, timezone);
      startDate = boundaries.startUTC;
      endDate = boundaries.endUTC;
    } else {
      const now = new Date();
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      endDate = now;
    }

    const entries = await storage.getHydrationEntries(user, {
      startDate,
      endDate,
      timezone,
    });

    return res.json({
      success: true,
      entries: entries.map((e) => storage.toPublicHydrationEntry(e)),
    });
  } catch (err: any) {
    console.error("GET /api/hydration/history error:", err);
    return res.status(500).json({ error: "Failed to fetch hydration history" });
  }
});

// DELETE /api/hydration/:id
router.delete("/:id", async (req: any, res) => {
  try {
    const user = await getOwner(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Hydration entry ID is required" });
    }

    const deletedCount = await storage.deleteHydrationEntry(id, user);
    if (deletedCount === 0) {
      return res.status(404).json({ error: "Hydration entry not found or unauthorized" });
    }

    return res.json({
      success: true,
      deletedCount,
      message: "Hydration entry deleted successfully",
    });
  } catch (err: any) {
    console.error("DELETE /api/hydration/:id error:", err);
    return res.status(500).json({ error: "Failed to delete hydration entry" });
  }
});

// POST /api/hydration/insight
router.post("/insight", async (req: any, res) => {
  try {
    const user = await getOwner(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const timezone = (req.body.timezone as string) || user.timezone || "UTC";
    const { entries, meals } = await storage.getHydrationToday(user, { timezone });

    const userProfile: HydrationUserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      activityLevel: user.activityLevel || user.activity_level,
      pregnancyStatus: user.pregnancyStatus || user.pregnancy_status,
      lactationStatus: user.lactationStatus || user.lactation_status,
      climate: user.climate,
      timezone,
    };

    const mealWaterItems = meals.map((m: any) => ({
      id: m.id,
      foodName: m.food_name || m.foodName || "Meal",
      waterContentMl: m.water_content_ml !== undefined ? m.water_content_ml : m.waterContentMl,
      waterContentConfidence: m.water_content_confidence !== undefined ? m.water_content_confidence : m.waterContentConfidence,
    }));

    const hydrationEntryItems = entries.map((e: any) => ({
      id: e.id,
      userEmail: e.user_email || e.userEmail,
      amountMl: e.amount_ml || e.amountMl,
      beverageType: e.beverage_type || e.beverageType || "Water",
      consumedAt: e.consumed_at || e.consumedAt,
    }));

    const progress = computeHydrationProgress(userProfile, hydrationEntryItems, mealWaterItems);
    const insight = await generateHydrationInsight(progress, userProfile);

    return res.json({
      success: true,
      ...insight,
    });
  } catch (err: any) {
    console.error("POST /api/hydration/insight error:", err);
    return res.json({
      success: true,
      insightText: "Stay hydrated by sipping water steadily throughout the day.",
      source: "deterministic",
    });
  }
});

export default router;
