import { Router, Request, Response } from "express";
import { db } from "../db.js";
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

export const aiRoutes = Router();

// 📸 Food Scan AI Endpoint
aiRoutes.post("/scan-food", async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, userGoal, userTargets } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required for food scanning" });
    }

    const result = await scanFoodImage(
      imageBase64,
      mimeType || "image/jpeg",
      userGoal || "Healthy eating",
      userTargets
    );

    return res.status(200).json({
      success: true,
      food_name: result.food_name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fats: result.fats,
      fiber: result.fiber,
      metabolic_impact: result.metabolic_impact,
      confidence: result.confidence,
      scan: result,
    });
  } catch (error: any) {
    console.error("❌ Error in /api/ai/scan-food:", error);
    return res.status(500).json({
      error: "Food scan processing failed",
      details: error?.message || "Internal AI error",
    });
  }
});

// 🎯 Nutrition Reasoning & Next Best Action (API Spec: POST /api/ai/nutrition-insight)
aiRoutes.post("/nutrition-insight", async (req: Request, res: Response) => {
  try {
    const { userProfile, currentMeal, todayNutrition, recentMeals, nutritionTargets } = req.body;

    const result = await generateNutritionInsight({
      userProfile,
      currentMeal,
      todayNutrition,
      recentMeals,
      nutritionTargets,
    });

    return res.status(200).json({
      success: true,
      insight: result.insight,
      next_best_action: result.next_best_action,
    });
  } catch (error: any) {
    console.error("❌ Error in /api/ai/nutrition-insight:", error);
    return res.status(500).json({
      error: "Nutrition insight generation failed",
      details: error?.message || "Internal AI error",
    });
  }
});

// 🎯 Next Best Action Engine (Core USP Endpoint)
aiRoutes.post("/next-best-action", async (req: Request, res: Response) => {
  try {
    const {
      userGoal,
      consumed,
      targets,
      recentMeals,
      timeOfDay,
      budgetHostelMode,
      hostelMenu,
      dietaryPreference,
    } = req.body;

    const result = await generateNextBestAction({
      userGoal: userGoal || "Healthy eating",
      consumed: consumed || { calories: 0, protein: 0, carbs: 0, fats: 0 },
      targets: targets || { calories: 2100, protein: 120, carbs: 200, fats: 60 },
      recentMeals: recentMeals || [],
      timeOfDay: timeOfDay || "Current",
      budgetHostelMode: Boolean(budgetHostelMode),
      hostelMenu: hostelMenu || "",
      dietaryPreference: dietaryPreference || "Omnivore",
    });

    // Optionally save to recommendations table if user is identifiable
    try {
      const userEmail = req.body.userEmail || (req.body.userProfile && req.body.userProfile.email);
      if (userEmail) {
        db.prepare(`
          INSERT INTO recommendations (user_email, recommendation_type, content_json)
          VALUES (?, 'next_best_action', ?)
        `).run(userEmail, JSON.stringify(result));
      }
    } catch {
      // Non-blocking database cache
    }

    return res.status(200).json({ success: true, nextBestAction: result });
  } catch (error: any) {
    console.warn("⚠️ Next-best-action route notice:", error?.message || error);
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
      userProfile,
      nutritionGoal,
      todayNutrition,
      recentMeals,
      budget,
      dietaryPreference,
      hostelMenu,
      availableFood,
    });

    try {
      const email = userProfile?.email;
      if (email) {
        db.prepare(`
          INSERT INTO recommendations (user_email, recommendation_type, content_json)
          VALUES (?, 'meal_recommendation', ?)
        `).run(email, JSON.stringify(result));
      }
    } catch (dbErr) {
      console.warn("⚠️ Non-blocking meal recommendation save error:", dbErr);
    }

    return res.status(200).json({
      success: true,
      recommendation: result.recommendation,
      options: result.options,
      rationale: result.rationale,
    });
  } catch (error: any) {
    console.error("❌ Error in /api/ai/recommend-next-meal:", error);
    return res.status(500).json({
      error: "Meal recommendation failed",
      details: error?.message || "Internal AI error",
    });
  }
});

// 🥗 Personalized Diet Plan Protocol (with hostel/budget support)
aiRoutes.post("/generate-diet", async (req: Request, res: Response) => {
  try {
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
      userGoal: userGoal || "Healthy eating",
      dietaryPreference: dietaryPreference || "Omnivore",
      dailyTarget: dailyTarget || { calories: 2100, protein: 120, carbs: 200, fats: 60 },
      budget: budget || "medium",
      isHostelMessMode: Boolean(isHostelMessMode),
      hostelMenuText: hostelMenuText || "",
      dislikedFoods: dislikedFoods || "",
    });

    return res.status(200).json({ success: true, dietPlan: result });
  } catch (error: any) {
    console.error("❌ Error in /api/ai/generate-diet:", error);
    return res.status(500).json({
      error: "Diet plan generation failed",
      details: error?.message || "Internal AI error",
    });
  }
});

// 💡 Personalized Daily Insights & Score
aiRoutes.post("/insights", async (req: Request, res: Response) => {
  try {
    const { userGoal, consumed, targets, mealsCount } = req.body;

    const result = await generatePersonalizedInsights({
      userGoal: userGoal || "Healthy eating",
      consumed: consumed || { calories: 0, protein: 0, carbs: 0, fats: 0 },
      targets: targets || { calories: 2100, protein: 120, carbs: 200, fats: 60 },
      mealsCount: mealsCount || 0,
    });

    return res.status(200).json({ success: true, insights: result });
  } catch (error: any) {
    console.warn("⚠️ Insights route notice:", error?.message || error);
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

    if (!subject && !snippet) {
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
    console.error("❌ Error in /api/ai/parse-email-meal:", error);
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
    console.error("❌ Error in /api/ai/parse-meal-text:", error);
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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Conversation messages array is required" });
    }

    const result = await consultHealthAdvisor({
      messages,
      userProfile,
      todayNutrition,
      recentMeals,
      budgetHostelMode: Boolean(budgetHostelMode),
    });

    return res.status(200).json({
      success: true,
      reply: result.reply,
      suggested_questions: result.suggested_questions,
      action_summary: result.action_summary,
    });
  } catch (error: any) {
    console.error("❌ Error in /api/ai/health-advisor:", error);
    return res.status(500).json({
      error: "Health advisor consultation failed",
      details: error?.message || "Internal AI error",
    });
  }
});


