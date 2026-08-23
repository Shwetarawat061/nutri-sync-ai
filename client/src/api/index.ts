import {
  UserProfile,
  MealItem,
  FoodScanResponse,
  NextBestActionData,
  NutritionInsightData,
  MealRecommendationData,
  DietPlanData,
} from "../types";

export const api = {
  // User Profile Endpoints
  async onboardUser(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch("/api/user/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to onboard user");
    return data.user;
  },

  async updateUserProfile(profile: Partial<UserProfile> & { currentEmail?: string; oldEmail?: string }): Promise<UserProfile> {
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update profile");
    return data.user;
  },

  async sendEmailVerification(email: string, newEmail?: string): Promise<{ success: boolean; previewCode: string; message: string }> {
    const res = await fetch("/api/user/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send verification code");
    return data;
  },

  async verifyEmail(email: string, code: string, newEmail?: string): Promise<UserProfile> {
    const res = await fetch("/api/user/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to verify email");
    return data.user;
  },

  async getUserProfile(email: string): Promise<UserProfile | null> {
    const res = await fetch(`/api/user/profile?email=${encodeURIComponent(email)}`);
    if (res.status === 404) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get user profile");
    return data.user;
  },

  async saveEmailPreferences(payload: {
    email: string;
    email_daily_digest?: boolean;
    email_weekly_recap?: boolean;
    email_deficit_alerts?: boolean;
    email_hostel_hacks?: boolean;
  }): Promise<UserProfile> {
    const res = await fetch("/api/user/email-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save email preferences");
    return data.user;
  },

  async sendEmailDigest(email: string, customSubject?: string): Promise<any> {
    const res = await fetch("/api/user/send-digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, customSubject }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to dispatch email digest");
    return data;
  },

  // Meal Logs Endpoints
  async getMeals(email: string, date?: string): Promise<MealItem[]> {
    const url = date
      ? `/api/meals?email=${encodeURIComponent(email)}&date=${encodeURIComponent(date)}`
      : `/api/meals?email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch meals");
    return data.meals || [];
  },

  async getTodayMeals(email: string): Promise<{ meals: MealItem[]; totals: any; count: number }> {
    const res = await fetch(`/api/meals/today?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch today meals");
    return { meals: data.meals || [], totals: data.totals, count: data.count || 0 };
  },

  async getMealById(id: string): Promise<MealItem> {
    const res = await fetch(`/api/meals/${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch meal");
    return data.meal;
  },

  async logMeal(meal: Partial<MealItem>): Promise<MealItem> {
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meal),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to log meal");
    return data.meal;
  },

  async deleteMeal(id: string): Promise<void> {
    const res = await fetch(`/api/meals/${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete meal");
  },

  async batchSyncMeals(email: string, meals: Partial<MealItem>[]): Promise<MealItem[]> {
    const res = await fetch("/api/meals/batch-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email: email, meals }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to sync meals");
    return data.meals || [];
  },

  // AI Endpoints
  async scanFood(
    imageBase64: string,
    mimeType: string,
    userGoal?: string,
    userTargets?: { calories: number; protein: number; carbs: number; fats: number }
  ): Promise<FoodScanResponse> {
    const res = await fetch("/api/ai/scan-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType, userGoal, userTargets }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || "Food scan failed");
    return data.scan || data;
  },

  async getNutritionInsight(payload: {
    userProfile?: any;
    currentMeal?: any;
    todayNutrition?: any;
    recentMeals?: any[];
    nutritionTargets?: any;
  }): Promise<NutritionInsightData> {
    const res = await fetch("/api/ai/nutrition-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || "Nutrition insight failed");
    return {
      insight: data.insight,
      next_best_action: data.next_best_action,
    };
  },

  async getNextBestAction(payload: {
    userGoal: string;
    consumed: { calories: number; protein: number; carbs: number; fats: number };
    targets: { calories: number; protein: number; carbs: number; fats: number };
    recentMeals: Array<{ food_name: string; meal_type: string; calories: number; protein: number }>;
    timeOfDay: string;
    budgetHostelMode?: boolean;
    hostelMenu?: string;
    dietaryPreference?: string;
  }): Promise<NextBestActionData> {
    const res = await fetch("/api/ai/next-best-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || "Next Best Action failed");
    return data.nextBestAction;
  },

  async recommendNextMeal(payload: {
    userProfile?: any;
    nutritionGoal?: string;
    todayNutrition?: any;
    recentMeals?: any[];
    budget?: string;
    dietaryPreference?: string;
    hostelMenu?: string;
    availableFood?: string;
  }): Promise<MealRecommendationData> {
    const res = await fetch("/api/ai/recommend-next-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || "Meal recommendation failed");
    return {
      recommendation: data.recommendation,
      options: data.options || [],
      rationale: data.rationale,
    };
  },

  async generateDietPlan(payload: {
    userGoal: string;
    dietaryPreference: string;
    dailyTarget: { calories: number; protein: number; carbs: number; fats: number };
    budget: string;
    isHostelMessMode: boolean;
    hostelMenuText?: string;
    dislikedFoods?: string;
  }): Promise<DietPlanData> {
    const res = await fetch("/api/ai/generate-diet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.details || "Diet plan generation failed");
    return data.dietPlan;
  },

  async getPersonalizedInsights(payload: {
    userGoal: string;
    consumed: { calories: number; protein: number; carbs: number; fats: number };
    targets: { calories: number; protein: number; carbs: number; fats: number };
    mealsCount: number;
  }): Promise<{ insights: string[]; score: number }> {
    const res = await fetch("/api/ai/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to generate insights");
    return data.insights;
  },

  async parseEmailMeal(payload: {
    subject: string;
    snippet: string;
    sender?: string;
    userGoal?: string;
  }): Promise<{
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
    confidence: "high" | "medium" | "low";
    reasoning: string;
  }> {
    const res = await fetch("/api/ai/parse-email-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to parse meal from email");
    return data.parsedMeal;
  },
};
