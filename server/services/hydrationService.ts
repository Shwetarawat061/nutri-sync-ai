import { GoogleGenAI } from "@google/genai";

export interface HydrationUserProfile {
  id?: string;
  name?: string;
  email?: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  activity_level?: string;
  activityLevel?: string;
  pregnancy_status?: boolean | string;
  pregnancyStatus?: boolean | string;
  lactation_status?: boolean | string;
  lactationStatus?: boolean | string;
  climate?: string;
  timezone?: string;
}

export interface HydrationEntryItem {
  id: string;
  userId?: string;
  userEmail: string;
  amountMl: number;
  beverageType: "Water" | "Milk" | "Tea" | "Coffee" | "Juice" | "Other" | string;
  consumedAt: string;
  source?: string;
  notes?: string;
  createdAt?: string;
}

export interface MealWaterItem {
  id: string;
  foodName: string;
  waterContentMl?: number | null;
  waterContentConfidence?: number | null;
  createdAt?: string;
}

export type HydrationStatus = "Good" | "Getting there" | "Needs attention";

export interface HydrationGoalResult {
  totalWaterGoalMl: number;
  beverageGoalMl: number;
  foodWaterEstimateMl: number;
  explanation: string;
  contextualFactors: Array<{ factor: string; note: string }>;
  isSpecialCategory?: "pregnancy" | "lactation" | "standard";
}

export interface HydrationProgressResult {
  totalWaterGoalMl: number;
  beverageGoalMl: number;
  foodWaterEstimateMl: number;
  consumedFromDrinksMl: number;
  estimatedFoodWaterMl: number;
  totalWaterConsumedMl: number;
  remainingBeverageMl: number;
  remainingTotalWaterMl: number;
  hydrationPercentage: number;
  beveragePercentage: number;
  totalPercentage: number;
  status: HydrationStatus;
  explanation: string;
  nextBestAction: string;
  foodWaterTrackingIncomplete: boolean;
  contextualFactors: Array<{ factor: string; note: string }>;
  beverageBreakdown: Record<string, number>;
  entriesCount: number;
  mealsCount: number;
  entries: HydrationEntryItem[];
}

/**
 * Calculates user's baseline hydration targets following the National Academies Dietary Reference Intake (DRI) values.
 *
 * DRI Reference Baselines:
 * - Adult Men: Total Water AI = 3.7 L/day (3700 ml), approx 3.0 L/day (3000 ml) from beverages (~80%), ~700 ml from food (~20%).
 * - Adult Women: Total Water AI = 2.7 L/day (2700 ml), approx 2.2 L/day (2200 ml) from beverages (~80%), ~500 ml from food (~20%).
 * - Pregnancy: Total Water AI = 3.0 L/day (3000 ml), approx 2.3 L/day (2300 ml) from beverages.
 * - Lactation: Total Water AI = 3.8 L/day (3800 ml), approx 3.1 L/day (3100 ml) from beverages.
 *
 * NOTE: Food contributes approximately 20% of total water intake as a general population estimate.
 * Users are not advised to drink 3.7 L or 2.7 L of plain water.
 */
export function calculateHydrationGoal(user: HydrationUserProfile): HydrationGoalResult {
  const genderNorm = String(user.gender || "").trim().toLowerCase();
  const isFemale = genderNorm === "female" || genderNorm === "f" || genderNorm === "woman";
  const isMale = genderNorm === "male" || genderNorm === "m" || genderNorm === "man";

  const isPregnant = Boolean(
    user.pregnancyStatus === true ||
    user.pregnancy_status === true ||
    user.pregnancyStatus === "pregnant" ||
    user.pregnancy_status === "pregnant" ||
    user.pregnancyStatus === "yes" ||
    user.pregnancy_status === "yes"
  );

  const isLactating = Boolean(
    user.lactationStatus === true ||
    user.lactation_status === true ||
    user.lactationStatus === "lactating" ||
    user.lactation_status === "lactating" ||
    user.lactationStatus === "breastfeeding" ||
    user.lactation_status === "breastfeeding" ||
    user.lactationStatus === "yes" ||
    user.lactation_status === "yes"
  );

  let totalWaterGoalMl = 3000;
  let beverageGoalMl = 2400;
  let foodWaterEstimateMl = 600;
  let isSpecialCategory: "pregnancy" | "lactation" | "standard" = "standard";

  if (isFemale && isLactating) {
    // Lactation reference baseline: 3.8 L total water/day
    totalWaterGoalMl = 3800;
    beverageGoalMl = 3100;
    foodWaterEstimateMl = 700;
    isSpecialCategory = "lactation";
  } else if (isFemale && isPregnant) {
    // Pregnancy reference baseline: 3.0 L total water/day
    totalWaterGoalMl = 3000;
    beverageGoalMl = 2300;
    foodWaterEstimateMl = 700;
    isSpecialCategory = "pregnancy";
  } else if (isMale) {
    // Adult Male reference baseline
    totalWaterGoalMl = 3700;
    beverageGoalMl = 3000;
    foodWaterEstimateMl = 700;
  } else if (isFemale) {
    // Adult Female reference baseline
    totalWaterGoalMl = 2700;
    beverageGoalMl = 2200;
    foodWaterEstimateMl = 500;
  }

  const contextualFactors: Array<{ factor: string; note: string }> = [];

  const activity = String(user.activityLevel || user.activity_level || "").toLowerCase();
  if (activity.includes("high") || activity.includes("very") || activity.includes("athlete") || activity.includes("active")) {
    contextualFactors.push({
      factor: "Physical Activity",
      note: "Your fluid needs may be higher under intense exercise or extended training sessions. Consider adding 250–500 ml per hour of vigorous movement.",
    });
  }

  const climate = String(user.climate || "").toLowerCase();
  if (climate.includes("hot") || climate.includes("humid") || climate.includes("tropical") || climate.includes("summer")) {
    contextualFactors.push({
      factor: "Environment & Climate",
      note: "Higher ambient temperatures increase sweat rate and fluid loss. Your fluid needs may be higher under these conditions.",
    });
  }

  let explanation = `Based on National Academies Dietary Reference Intake (DRI) guidelines, your daily total water goal is ${(totalWaterGoalMl / 1000).toFixed(1)} L (with approximately ${(beverageGoalMl / 1000).toFixed(1)} L from fluids and ~${foodWaterEstimateMl} ml contributed naturally through food).`;
  if (isSpecialCategory === "pregnancy") {
    explanation = `Based on DRI guidelines for pregnancy, your daily total water goal is 3.0 L (approx. 2.3 L from beverages and ~700 ml from food).`;
  } else if (isSpecialCategory === "lactation") {
    explanation = `Based on DRI guidelines for lactation, your daily total water goal is 3.8 L (approx. 3.1 L from beverages and ~700 ml from food).`;
  }

  return {
    totalWaterGoalMl,
    beverageGoalMl,
    foodWaterEstimateMl,
    explanation,
    contextualFactors,
    isSpecialCategory,
  };
}

/**
 * Computes deterministic hydration progress from logged beverage entries and measured food water.
 */
export function computeHydrationProgress(
  user: HydrationUserProfile,
  entries: HydrationEntryItem[] = [],
  mealsToday: MealWaterItem[] = []
): HydrationProgressResult {
  const goal = calculateHydrationGoal(user);

  // Sum beverage intake
  let consumedFromDrinksMl = 0;
  const beverageBreakdown: Record<string, number> = {
    Water: 0,
    Milk: 0,
    Tea: 0,
    Coffee: 0,
    Juice: 0,
    Other: 0,
  };

  for (const entry of entries) {
    const amt = Number(entry.amountMl) || 0;
    if (amt > 0) {
      consumedFromDrinksMl += amt;
      const type = entry.beverageType || "Water";
      if (beverageBreakdown[type] !== undefined) {
        beverageBreakdown[type] += amt;
      } else {
        beverageBreakdown[type] = (beverageBreakdown[type] || 0) + amt;
      }
    }
  }

  // Calculate measured food water (excluding unmeasured or null entries)
  let estimatedFoodWaterMl = 0;
  let foodWaterTrackingIncomplete = false;

  if (mealsToday.length > 0) {
    for (const meal of mealsToday) {
      if (typeof meal.waterContentMl === "number" && !isNaN(meal.waterContentMl) && meal.waterContentMl >= 0) {
        estimatedFoodWaterMl += Math.round(meal.waterContentMl);
      } else {
        // AI estimate missing or low confidence
        foodWaterTrackingIncomplete = true;
      }
    }
  } else {
    // No meals logged yet today
    foodWaterTrackingIncomplete = false;
  }

  // Food water is NOT double counted with beverages
  const totalWaterConsumedMl = consumedFromDrinksMl + estimatedFoodWaterMl;

  const remainingBeverageMl = Math.max(0, goal.beverageGoalMl - consumedFromDrinksMl);
  const remainingTotalWaterMl = Math.max(0, goal.totalWaterGoalMl - totalWaterConsumedMl);

  const beveragePercentage = Math.min(100, Math.round((consumedFromDrinksMl / goal.beverageGoalMl) * 100));
  const totalPercentage = Math.min(100, Math.round((totalWaterConsumedMl / goal.totalWaterGoalMl) * 100));
  const hydrationPercentage = beveragePercentage;

  // Status computation without alarming or diagnostic medical language
  let status: HydrationStatus = "Needs attention";
  if (beveragePercentage >= 80 || totalPercentage >= 80) {
    status = "Good";
  } else if (beveragePercentage >= 40 || totalPercentage >= 40) {
    status = "Getting there";
  } else {
    status = "Needs attention";
  }

  // Deterministic helpful explanation
  let explanation = "";
  if (consumedFromDrinksMl === 0) {
    explanation = `You haven't logged any drinks yet today. Your daily beverage target is ${(goal.beverageGoalMl / 1000).toFixed(1)} L.`;
  } else if (consumedFromDrinksMl >= goal.beverageGoalMl) {
    explanation = `You've logged ${(consumedFromDrinksMl / 1000).toFixed(1)} L of beverages today, meeting your daily ${(goal.beverageGoalMl / 1000).toFixed(1)} L target. ${
      estimatedFoodWaterMl > 0 ? `Your meals also contributed an estimated ${estimatedFoodWaterMl} ml of water.` : ""
    }`.trim();
  } else {
    explanation = `You've logged ${(consumedFromDrinksMl / 1000).toFixed(1)} L of beverages today. You're about ${beveragePercentage}% of your ${(goal.beverageGoalMl / 1000).toFixed(1)} L beverage goal.${
      estimatedFoodWaterMl > 0 ? ` Meals contributed an estimated ${estimatedFoodWaterMl} ml of water.` : ""
    }`;
  }

  // Deterministic next best action
  let nextBestAction = "";
  if (remainingBeverageMl === 0) {
    nextBestAction = "Hydration goal achieved for the day. Continue drinking water as desired.";
  } else if (consumedFromDrinksMl < 1000) {
    nextBestAction = `You've logged ${(consumedFromDrinksMl / 1000).toFixed(1)} L so far. Try adding 250–500 ml with your next meal.`;
  } else if (remainingBeverageMl <= 500) {
    nextBestAction = `Almost there! A final 250–500 ml glass of water will complete your daily beverage goal.`;
  } else {
    nextBestAction = `Pace your intake: aim for ~250 ml every 1–2 hours to comfortably reach your ${(goal.beverageGoalMl / 1000).toFixed(1)} L goal.`;
  }

  return {
    totalWaterGoalMl: goal.totalWaterGoalMl,
    beverageGoalMl: goal.beverageGoalMl,
    foodWaterEstimateMl: goal.foodWaterEstimateMl,
    consumedFromDrinksMl,
    estimatedFoodWaterMl,
    totalWaterConsumedMl,
    remainingBeverageMl,
    remainingTotalWaterMl,
    hydrationPercentage,
    beveragePercentage,
    totalPercentage,
    status,
    explanation,
    nextBestAction,
    foodWaterTrackingIncomplete,
    contextualFactors: goal.contextualFactors,
    beverageBreakdown,
    entriesCount: entries.length,
    mealsCount: mealsToday.length,
    entries,
  };
}

/**
 * Generates personalized wording using Gemini using pre-calculated facts.
 * If Gemini fails or API key is absent, gracefully falls back to deterministic wording.
 */
export async function generateHydrationInsight(
  progress: HydrationProgressResult,
  userProfile?: HydrationUserProfile
): Promise<{ insightText: string; source: "gemini" | "deterministic" }> {
  // Deterministic base message as robust fallback
  const fallback = `${progress.explanation} ${progress.nextBestAction}`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return { insightText: fallback, source: "deterministic" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a supportive, science-backed nutrition and hydration assistant in NutriSync.
Based on the following PRE-CALCULATED facts, write a brief, friendly, 1-2 sentence personalized hydration insight for the user.

FACTS:
- User beverage consumed today: ${(progress.consumedFromDrinksMl / 1000).toFixed(2)} L
- User beverage daily target: ${(progress.beverageGoalMl / 1000).toFixed(2)} L
- Beverage percentage: ${progress.beveragePercentage}%
- Estimated food water intake from meals: ${progress.estimatedFoodWaterMl} ml
- Total water consumed: ${(progress.totalWaterConsumedMl / 1000).toFixed(2)} L
- Total water goal: ${(progress.totalWaterGoalMl / 1000).toFixed(2)} L
- Status: ${progress.status}
- Food water tracking incomplete: ${progress.foodWaterTrackingIncomplete ? "yes" : "no"}

CRITICAL RULES:
1. Do NOT claim the user is medically dehydrated or diagnose any condition.
2. Do NOT invent new numbers or targets; reference only the numbers provided above.
3. Keep the tone encouraging, calm, and actionable (1-2 sentences maximum).
4. No markdown headers or bullet points.`;

    let timeoutHandle: ReturnType<typeof setTimeout>;
    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      }),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error("Timeout")), 8000);
      }),
    ]).finally(() => clearTimeout(timeoutHandle));

    const text = response?.text?.trim();
    if (text && text.length > 10) {
      return { insightText: text, source: "gemini" };
    }
  } catch (err) {
    // Graceful fallback - Gemini failure does not break hydration calculations
  }

  return { insightText: fallback, source: "deterministic" };
}
