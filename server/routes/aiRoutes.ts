import { NextFunction, Router, Request, Response } from "express";
import { UserModel } from "../models/User.js";
import { MealModel } from "../models/Meal.js";
import { AIAnalysisModel } from "../models/AIAnalysis.js";
import {
  scanFoodImage,
  generateNextBestAction,
  generateNutritionInsight,
  recommendNextMeal,
  generatePersonalizedDietPlan,
  generatePersonalizedInsights,
  parseEmailMeal,
  parseMealText,
  consultHealthAdvisor,
} from "../services/gemini.js";
import { uploadScanImages } from "../services/imageStorage.js";

export const aiRoutes = Router();

function validateAiPayload(req: Request, res: Response, next: NextFunction) {
  if (req.method === "POST" && (!req.body || typeof req.body !== "object" || Array.isArray(req.body))) {
    return res.status(400).json({ error: "A JSON object request body is required", code: "INVALID_AI_INPUT" });
  }
  for (const [key, value] of Object.entries(req.body || {})) {
    if (key !== "imageBase64" && typeof value === "string" && value.length > 10000) {
      return res.status(400).json({ error: `${key} is too long`, code: "INVALID_AI_INPUT" });
    }
  }
  return next();
}

aiRoutes.use(validateAiPayload);

export function validateScanImages(imageBase64: unknown, mimeType: unknown): string | null {
  const images = Array.isArray(imageBase64) ? imageBase64 : [imageBase64];
  const mimeTypes = Array.isArray(mimeType) ? mimeType : [mimeType || "image/jpeg"];
  if (!images.length || images.length > 4 || images.some((image) => typeof image !== "string" || image.length > 12_000_000)) return "The selected image is too large or invalid.";
  if (mimeTypes.length !== images.length || mimeTypes.some((mime) => typeof mime !== "string" || !/^image\/(jpeg|png|webp|heic|heif)$/i.test(mime))) return "The selected image type is invalid.";
  return null;
}

async function getOwnedDailyContext(req: Request) {
  const user = await UserModel.findOne({ _id: req.user!.id, email: req.user!.email });
  if (!user) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const meals = await MealModel.find({ userId: user._id, createdAt: { $gte: start } }).sort({ createdAt: -1 }).limit(100);
  const consumed = meals.reduce((totals: any, meal: any) => ({
    calories: totals.calories + meal.calories,
    protein: totals.protein + meal.protein,
    carbs: totals.carbs + meal.carbs,
    fats: totals.fats + meal.fats,
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  return {
    user,
    meals,
    consumed,
    targets: { calories: user.calorieTarget, protein: user.proteinTarget, carbs: user.carbsTarget, fats: user.fatsTarget },
  };
}

// 📸 Food Scan AI Endpoint
aiRoutes.post("/scan-food", async (req: Request, res: Response) => {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const logScan = (result: { success: boolean; errorCode?: string; model?: string }) => {
    console.info("food_scan", {
      requestId,
      userId: req.user?.id,
      model: result.model,
      processingTime: Date.now() - startedAt,
      success: result.success,
      errorCode: result.errorCode,
    });
  };
  try {
    const user = await UserModel.findOne({ _id: req.user!.id, email: req.user!.email });
    if (!user) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dailyScanCount = await AIAnalysisModel.countDocuments({
      userId: user._id,
      analysisType: "food_scan",
      createdAt: { $gte: dayStart },
    });
    if (dailyScanCount >= 5) {
      const result = { success: false, source: "gemini", errorCode: "DAILY_LIMIT_REACHED", message: "You have reached today's scan limit. Please try again tomorrow." } as const;
      logScan(result);
      return res.status(429).json(result);
    }
    const { imageBase64, mimeType, userGoal, userTargets } = req.body;

    if (!imageBase64 || (Array.isArray(imageBase64) && imageBase64.length === 0)) {
      const result = { success: false, source: "gemini", errorCode: "IMAGE_INVALID", message: "The selected image could not be analyzed." } as const;
      logScan(result);
      return res.status(400).json(result);
    }
    const imageValidationError = validateScanImages(imageBase64, mimeType);
    if (imageValidationError) {
      const result = { success: false, source: "gemini", errorCode: "IMAGE_INVALID", message: imageValidationError } as const;
      logScan(result);
      return res.status(400).json(result);
    }
    const mimeTypes = Array.isArray(mimeType) ? mimeType : [mimeType || "image/jpeg"];
    const images = Array.isArray(imageBase64) ? imageBase64 : [imageBase64];

    const imageUrls = await uploadScanImages(images.map((image, index) => ({ data: image, mimeType: mimeTypes[index] || mimeTypes[0] })), String(user._id), requestId);
    const result = await scanFoodImage(
      imageBase64,
      mimeTypes,
      user.nutritionGoal || userGoal || "Healthy eating",
      {
        calories: user.calorieTarget,
        protein: user.proteinTarget,
        carbs: user.carbsTarget,
        fats: user.fatsTarget,
      }
    );

    const scanOutput = result.success ? { ...result, imageUrls } : result;
    await AIAnalysisModel.create({
      userId: user._id,
      analysisType: "food_scan",
      input: { requestId, imageCount: images.length, userGoal: user.nutritionGoal, targets: { calories: user.calorieTarget, protein: user.proteinTarget, carbs: user.carbsTarget, fats: user.fatsTarget } },
      output: scanOutput,
      status: result.success ? "success" : "error",
    });
    if (!result.success) {
      logScan(result);
      return res.status("errorCode" in result && result.errorCode === "IMAGE_INVALID" ? 400 : 503).json(result);
    }
    logScan(scanOutput);
    return res.status(200).json(scanOutput);
  } catch (error: any) {
    if (error?.message === "IMAGE_STORAGE_NOT_CONFIGURED") {
      const result = { success: false, source: "gemini", errorCode: "IMAGE_STORAGE_UNAVAILABLE", message: "Image storage is temporarily unavailable. Please try again later." } as const;
      logScan(result);
      return res.status(503).json(result);
    }
    const result = { success: false, source: "gemini", errorCode: "AI_UNAVAILABLE", message: "Food analysis is temporarily unavailable." } as const;
    logScan(result);
    console.error("Error in /api/ai/scan-food", { requestId, errorCode: result.errorCode });
    return res.status(503).json(result);
  }
});

// 🎯 Nutrition Reasoning & Next Best Action (API Spec: POST /api/ai/nutrition-insight)
aiRoutes.post("/nutrition-insight", async (req: Request, res: Response) => {
  try {
    const context = await getOwnedDailyContext(req);
    if (!context) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });

    const result = await generateNutritionInsight({
      userProfile: { goal: context.user.nutritionGoal, dietaryPreference: context.user.dietaryPreference, hostel_context: context.user.hostelContext },
      currentMeal: req.body.currentMeal,
      todayNutrition: context.consumed,
      recentMeals: context.meals,
      nutritionTargets: context.targets,
    });

    return res.status(200).json({
      success: true,
      insight: result.insight,
      next_best_action: result.next_best_action,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/nutrition-insight");
    return res.status(500).json({
      error: "Nutrition insight generation failed",
      details: error?.message || "Internal AI error",
    });
  }
});

// 🎯 Next Best Action Engine (Core USP Endpoint)
aiRoutes.post("/next-best-action", async (req: Request, res: Response) => {
  try {
    const context = await getOwnedDailyContext(req);
    if (!context) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });

    const result = await generateNextBestAction({
      userGoal: context.user.nutritionGoal || "Healthy eating",
      consumed: context.consumed,
      targets: context.targets,
      recentMeals: context.meals,
      timeOfDay: req.body.timeOfDay || "Current",
      budgetHostelMode: Boolean(context.user.hostelContext || req.body.budgetHostelMode),
      hostelMenu: context.user.hostelContext || "",
      dietaryPreference: context.user.dietaryPreference || "Omnivore",
    });

    // Optionally save to recommendations table if user is identifiable
    try {
      const userEmail = req.user!.email;
      if (userEmail) {
        await AIAnalysisModel.create({ userId: req.user!.id, analysisType: "insight", input: req.body, output: result });
      }
    } catch {
      // Non-blocking database cache
    }

    return res.status(200).json({ success: true, nextBestAction: result });
  } catch (error: any) {
    console.warn("Next-best-action route unavailable");
    const remProt = Math.max(0, 120 - (req.body?.consumed?.protein || 0));
    return res.status(200).json({
      success: true,
      nextBestAction: {
        title: remProt > 30 ? "Prioritize Protein In Next Meal" : "Balance Daily Macros",
        action: `Target ${Math.min(remProt, 35)}g of quality protein in your upcoming fuel window.`,
        why: "Maintain metabolic balance and sustain lean muscle preservation.",
        suggested_foods: ["High-protein meal with greens", "Boiled eggs or Greek yogurt", "Curd with roasted nuts"],
        urgency: remProt > 40 ? "high" : "medium",
        hydration_tip: "Drink 350-500ml water to support metabolic hydration.",
      },
    });
  }
});

// 🍱 Personalized Next Meal Recommendation (API Spec: POST /api/ai/recommend-next-meal)
aiRoutes.post("/recommend-next-meal", async (req: Request, res: Response) => {
  try {
    const context = await getOwnedDailyContext(req);
    if (!context) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const {
      userProfile,
      nutritionGoal,
      todayNutrition,
      recentMeals,
      budget,
      dietaryPreference,
      hostelMenu,
      availableFood,
    } = req.body;

    const result = await recommendNextMeal({
      userProfile: {
        goal: context.user.nutritionGoal,
        dietary_pref: context.user.dietaryPreference,
        budget: context.user.budget,
        hostel_context: context.user.hostelContext,
      },
      nutritionGoal: context.user.nutritionGoal || nutritionGoal,
      todayNutrition: context.consumed,
      recentMeals: context.meals,
      budget: context.user.budget || budget,
      dietaryPreference: context.user.dietaryPreference || dietaryPreference,
      hostelMenu: context.user.hostelContext || hostelMenu,
      availableFood,
    });

    try {
      const email = req.user!.email;
      if (email) {
        await AIAnalysisModel.create({ userId: req.user!.id, analysisType: "insight", input: req.body, output: result });
      }
    } catch (dbErr) {
      console.warn("Non-blocking meal recommendation save failed");
    }

    return res.status(200).json({
      success: true,
      recommendation: result.recommendation,
      options: result.options,
      rationale: result.rationale,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/recommend-next-meal");
    return res.status(500).json({
      error: "Meal recommendation failed",
      details: error?.message || "Internal AI error",
    });
  }
});

// 🥗 Personalized Diet Plan Protocol (with hostel/budget support)
aiRoutes.post("/generate-diet", async (req: Request, res: Response) => {
  try {
    const context = await getOwnedDailyContext(req);
    if (!context) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });
    const {
      userGoal,
      dietaryPreference,
      dailyTarget,
      budget,
      isHostelMessMode,
      hostelMenuText,
      dislikedFoods,
    } = req.body;

    const result = await generatePersonalizedDietPlan({
      userGoal: context.user.nutritionGoal || userGoal || "Healthy eating",
      dietaryPreference: context.user.dietaryPreference || dietaryPreference || "Omnivore",
      dailyTarget: { calories: context.user.calorieTarget, protein: context.user.proteinTarget, carbs: context.user.carbsTarget, fats: context.user.fatsTarget },
      budget: context.user.budget || budget || "medium",
      isHostelMessMode: Boolean(context.user.hostelContext || isHostelMessMode),
      hostelMenuText: context.user.hostelContext || hostelMenuText || "",
      dislikedFoods: dislikedFoods || "",
    });

    return res.status(200).json({ success: true, dietPlan: result });
  } catch (error: any) {
    console.error("Error in /api/ai/generate-diet");
    return res.status(500).json({
      error: "Diet plan generation failed",
      details: error?.message || "Internal AI error",
    });
  }
});

// 💡 Personalized Daily Insights & Score
aiRoutes.post("/insights", async (req: Request, res: Response) => {
  try {
    const context = await getOwnedDailyContext(req);
    if (!context) return res.status(401).json({ error: "Authenticated user not found", code: "AUTH_INVALID" });

    const result = await generatePersonalizedInsights({
      userGoal: context.user.nutritionGoal || "Healthy eating",
      consumed: context.consumed,
      targets: context.targets,
      mealsCount: context.meals.length,
    });

    return res.status(200).json({ success: true, insights: result });
  } catch (error: any) {
    console.warn("Insights route unavailable");
    const protPct = Math.round(((req.body?.consumed?.protein || 0) / (req.body?.targets?.protein || 120)) * 100);
    const calPct = Math.round(((req.body?.consumed?.calories || 0) / (req.body?.targets?.calories || 2100)) * 100);
    return res.status(200).json({
      success: true,
      insights: {
        insights: [
          `You have achieved ${protPct}% of your target protein threshold.`,
          `Energy pacing is at ${calPct}% of your daily allowance.`,
          "Logged meals are tracked with metabolic macronutrient pacing.",
        ],
        score: Math.min(100, Math.max(20, 100 - Math.abs(100 - calPct))),
      },
    });
  }
});

// 📨 Parse Food / Meal Receipt from Gmail
aiRoutes.post("/parse-email-meal", async (req: Request, res: Response) => {
  try {
    const { subject, snippet, sender, userGoal } = req.body;

    if ((subject !== undefined && typeof subject !== "string") || (snippet !== undefined && typeof snippet !== "string") || (!subject && !snippet)) {
      return res.status(400).json({ error: "Email subject or snippet is required" });
    }

    const result = await parseEmailMeal({
      subject: subject || "",
      snippet: snippet || "",
      sender: sender || "",
      userGoal: userGoal || "Healthy eating",
    });

    return res.status(200).json({ success: true, parsedMeal: result });
  } catch (error: any) {
    console.error("Error in /api/ai/parse-email-meal");
    return res.status(500).json({
      error: "Email meal parsing failed",
      details: error?.message || "Internal AI error",
    });
  }
});

// 🧠 AI Natural Language / Voice Meal Parser (/api/ai/parse-meal-text)
aiRoutes.post("/parse-meal-text", async (req: Request, res: Response) => {
  try {
    const { text, userGoal, dietaryPreference, userTargets, budgetHostelMode } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Meal description text is required" });
    }

    const result = await parseMealText({
      text: text.trim(),
      userGoal: userGoal || "Healthy eating",
      dietaryPreference: dietaryPreference || "Omnivore",
      userTargets,
      budgetHostelMode: Boolean(budgetHostelMode),
    });

    return res.status(200).json({ success: true, meal: result });
  } catch (error: any) {
    console.error("Error in /api/ai/parse-meal-text");
    return res.status(500).json({
      error: "Meal text parsing failed",
      details: error?.message || "Internal AI error",
    });
  }
});

// 🩺 AI Health & Metabolic Advisor (/api/ai/health-advisor)
aiRoutes.post("/health-advisor", async (req: Request, res: Response) => {
  try {
    const { messages, userProfile, todayNutrition, recentMeals, budgetHostelMode } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0 || messages.length > 100 || messages.some((message) =>
      !message || typeof message !== "object" || !["user", "model", "assistant"].includes(message.role) ||
      typeof message.content !== "string" || !message.content.trim() || message.content.length > 10000
    )) {
      return res.status(400).json({ error: "Conversation messages array is required" });
    }

    const result = await consultHealthAdvisor({
      messages,
      userProfile,
      todayNutrition,
      recentMeals,
      budgetHostelMode: Boolean(budgetHostelMode),
    });

    // Asynchronously log conversation turn & extract long term memories
    try {
      const email = req.user!.email;
      if (email) {
        const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content || "";
        const { logConversationTurn, extractAndPersistMemories } = await import("../services/memorySystem.js");
        logConversationTurn(email, "user", lastUserMsg, { todayNutrition, budgetHostelMode });
        logConversationTurn(email, "assistant", result.reply, result.action_summary);
        extractAndPersistMemories(email, lastUserMsg, result.reply).catch(() => {});
      }
    } catch {
      // Non-blocking background log
    }

    return res.status(200).json({
      success: true,
      reply: result.reply,
      suggested_questions: result.suggested_questions,
      action_summary: result.action_summary,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/health-advisor");
    return res.status(500).json({
      error: "Health advisor consultation failed",
      details: error?.message || "Internal AI error",
    });
  }
});

// ⏰ Dynamic Time-Aware Nutrition & Hydration Reminders
aiRoutes.get("/reminders", async (req: Request, res: Response) => {
  try {
    const email = req.user!.email;
    const isHostelMode = req.query.hostel === "true" || req.query.hostel === "1";

    let user = null;
    if (email) {
      user = await UserModel.findOne({ _id: req.user!.id, email: req.user!.email });
    }

    const { getUpcomingReminders } = await import("../services/memorySystem.js");
    const reminders = getUpcomingReminders(user, isHostelMode);

    return res.status(200).json({
      success: true,
      reminders,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/reminders");
    return res.status(500).json({ error: "Failed to generate reminders", details: error.message });
  }
});

// 🧠 Long-Term Memories Endpoint (GET & POST)
aiRoutes.get("/memories", async (req: Request, res: Response) => {
  try {
    const email = req.user!.email;

    const { getUserMemories } = await import("../services/memorySystem.js");
    const memories = getUserMemories(email);

    return res.status(200).json({
      success: true,
      memories,
    });
  } catch (error: any) {
    console.error("Error in GET /api/ai/memories");
    return res.status(500).json({ error: "Failed to fetch user memories", details: error.message });
  }
});

aiRoutes.post("/memories", async (req: Request, res: Response) => {
  try {
    const { category, key, value } = req.body;
    if (typeof key !== "string" || !key.trim() || typeof value !== "string" || !value.trim() || key.length > 200 || value.length > 10000) {
      return res.status(400).json({ error: "key and value are required" });
    }
    const email = req.user!.email;

    const { saveUserMemory, getUserMemories } = await import("../services/memorySystem.js");
    saveUserMemory(email, category || "preference", key, value);
    const updatedMemories = getUserMemories(email);

    return res.status(200).json({
      success: true,
      message: "Memory persisted successfully",
      memories: updatedMemories,
    });
  } catch (error: any) {
    console.error("Error in POST /api/ai/memories");
    return res.status(500).json({ error: "Failed to save memory", details: error.message });
  }
});



