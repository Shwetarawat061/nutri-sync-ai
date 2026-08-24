import {
  UserProfile,
  MealItem,
  FoodScanResponse,
  NextBestActionData,
  NutritionInsightData,
  MealRecommendationData,
  DietPlanData,
} from "../types";

async function safeFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";

  let body: any = null;
  if (contentType.includes("application/json")) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } else {
    // If HTML or text is returned (e.g. proxy 503 error)
    const text = await res.text().catch(() => "");
    body = {
      error: res.ok ? "Unexpected response format" : `Service temporarily unavailable (${res.status})`,
      raw: text.slice(0, 100),
    };
  }

  if (!res.ok) {
    const errorMsg = body?.error || body?.details || body?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return body;
}

export const api = {
  // User Profile Endpoints
  async onboardUser(profile: Partial<UserProfile>): Promise<UserProfile> {
    const data = await safeFetch<{ user: UserProfile }>("/api/user/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    return data.user;
  },

  async updateUserProfile(profile: Partial<UserProfile> & { currentEmail?: string; oldEmail?: string }): Promise<UserProfile> {
    const data = await safeFetch<{ user: UserProfile }>("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    return data.user;
  },

  async sendEmailVerification(email: string, newEmail?: string): Promise<{ success: boolean; previewCode: string; message: string }> {
    return safeFetch<{ success: boolean; previewCode: string; message: string }>("/api/user/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newEmail }),
    });
  },

  async verifyEmail(email: string, code: string, newEmail?: string): Promise<UserProfile> {
    const data = await safeFetch<{ user: UserProfile }>("/api/user/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newEmail }),
    });
    return data.user;
  },

  async getUserProfile(email: string): Promise<UserProfile | null> {
    try {
      const res = await fetch(`/api/user/profile?email=${encodeURIComponent(email)}`);
      if (res.status === 404) return null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        return data.user || null;
      }
      return null;
    } catch {
      return null;
    }
  },

  async saveEmailPreferences(payload: {
    email: string;
    email_daily_digest?: boolean;
    email_weekly_recap?: boolean;
    email_deficit_alerts?: boolean;
    email_hostel_hacks?: boolean;
  }): Promise<UserProfile> {
    const data = await safeFetch<{ user: UserProfile }>("/api/user/email-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return data.user;
  },

  async sendEmailDigest(email: string, customSubject?: string): Promise<any> {
    return safeFetch("/api/user/send-digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, customSubject }),
    });
  },

  // Meal Logs Endpoints
  async getMeals(email: string, date?: string): Promise<MealItem[]> {
    const url = date
      ? `/api/meals?email=${encodeURIComponent(email)}&date=${encodeURIComponent(date)}`
      : `/api/meals?email=${encodeURIComponent(email)}`;
    const data = await safeFetch<{ meals: MealItem[] }>(url);
    return data.meals || [];
  },

  async getTodayMeals(email: string): Promise<{ meals: MealItem[]; totals: any; count: number }> {
    const data = await safeFetch<{ meals: MealItem[]; totals: any; count: number }>(`/api/meals/today?email=${encodeURIComponent(email)}`);
    return { meals: data.meals || [], totals: data.totals, count: data.count || 0 };
  },

  async getMealById(id: string): Promise<MealItem> {
    const data = await safeFetch<{ meal: MealItem }>(`/api/meals/${encodeURIComponent(id)}`);
    return data.meal;
  },

  async logMeal(meal: Partial<MealItem>): Promise<MealItem> {
    const data = await safeFetch<{ meal: MealItem }>("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meal),
    });
    return data.meal;
  },

  async deleteMeal(id: string): Promise<void> {
    await safeFetch(`/api/meals/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async batchSyncMeals(email: string, meals: Partial<MealItem>[]): Promise<MealItem[]> {
    const data = await safeFetch<{ meals: MealItem[] }>("/api/meals/batch-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email: email, meals }),
    });
    return data.meals || [];
  },

  // AI Endpoints
  async scanFood(
    imageBase64: string,
    mimeType: string,
    userGoal?: string,
    userTargets?: { calories: number; protein: number; carbs: number; fats: number }
  ): Promise<FoodScanResponse> {
    const data = await safeFetch<{ scan?: FoodScanResponse } & FoodScanResponse>("/api/ai/scan-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType, userGoal, userTargets }),
    });
    return data.scan || data;
  },

  async getNutritionInsight(payload: {
    userProfile?: any;
    currentMeal?: any;
    todayNutrition?: any;
    recentMeals?: any[];
    nutritionTargets?: any;
  }): Promise<NutritionInsightData> {
    const data = await safeFetch<{ insight: any; next_best_action: any }>("/api/ai/nutrition-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
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
    const data = await safeFetch<{ nextBestAction: NextBestActionData }>("/api/ai/next-best-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
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
    const data = await safeFetch<{ recommendation: string; options: string[]; rationale: string }>("/api/ai/recommend-next-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
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
    const data = await safeFetch<{ dietPlan: DietPlanData }>("/api/ai/generate-diet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return data.dietPlan;
  },

  async getPersonalizedInsights(payload: {
    userGoal: string;
    consumed: { calories: number; protein: number; carbs: number; fats: number };
    targets: { calories: number; protein: number; carbs: number; fats: number };
    mealsCount: number;
  }): Promise<{ insights: string[]; score: number }> {
    const data = await safeFetch<{ insights: { insights: string[]; score: number } }>("/api/ai/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
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
    const data = await safeFetch<{ parsedMeal: any }>("/api/ai/parse-email-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return data.parsedMeal;
  },

  async parseMealText(payload: {
    text: string;
    userGoal?: string;
    dietaryPreference?: string;
    userTargets?: { calories: number; protein: number; carbs: number; fats: number };
    budgetHostelMode?: boolean;
  }): Promise<any> {
    const data = await safeFetch<{ meal: any }>("/api/ai/parse-meal-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return data.meal;
  },

  async consultHealthAdvisor(payload: {
    messages: Array<{ role: "user" | "model" | "assistant"; content: string }>;
    userProfile?: any;
    todayNutrition?: any;
    recentMeals?: any[];
    budgetHostelMode?: boolean;
  }): Promise<{
    reply: string;
    suggested_questions: string[];
    action_summary?: {
      action: string;
      recommended_foods?: string[];
      calorie_adjustment?: string;
    };
  }> {
    const data = await safeFetch<{ reply: string; suggested_questions: string[]; action_summary?: any }>("/api/ai/health-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return {
      reply: data.reply,
      suggested_questions: data.suggested_questions || [],
      action_summary: data.action_summary,
    };
  },
};
