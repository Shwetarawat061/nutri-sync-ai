import {
  UserProfile,
  MealItem,
  FoodScanResponse,
  FoodScanFailure,
  NextBestActionData,
  NutritionInsightData,
  MealRecommendationData,
  DietPlanData,
} from "../types";

async function safeFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("nutrisync_auth_token");
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
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
    const code =
      body?.errorCode ||
      body?.code ||
      (res.status === 401
        ? "AUTH_REQUIRED"
        : res.status === 429
        ? "RATE_LIMITED"
        : res.status === 413
        ? "PAYLOAD_TOO_LARGE"
        : "API_ERROR");
    const err = new Error(errorMsg);
    (err as any).errorCode = code;
    (err as any).status = res.status;
    throw err;
  }

  return body;
}

export const api = {
  async register(payload: { name: string; email: string; password: string }): Promise<{ user: UserProfile; token: string; isNewUser?: boolean }> {
    return safeFetch<{ user: UserProfile; token: string; isNewUser?: boolean }>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async login(payload: { email: string; password: string }): Promise<{ user: UserProfile; token: string; isNewUser?: boolean }> {
    return safeFetch<{ user: UserProfile; token: string; isNewUser?: boolean }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async getCurrentUser(): Promise<UserProfile> {
    const data = await safeFetch<{ user: UserProfile }>("/api/auth/me");
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await safeFetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("nutrisync_auth_token");
      localStorage.removeItem("user_email");
    }
  },

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
    const res = await fetch(`/api/user/profile?email=${encodeURIComponent(email)}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Profile lookup failed with status ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Profile lookup returned an invalid response");
    }

    const data = await res.json();
    if (!data.user) {
      throw new Error("Profile lookup returned no account data");
    }
    return data.user;
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

  async getTodayMeals(email: string, date?: string): Promise<{ meals: MealItem[]; totals: any; count: number; date?: string; weekday?: string }> {
    const url = date
      ? `/api/meals/today?email=${encodeURIComponent(email)}&date=${encodeURIComponent(date)}`
      : `/api/meals/today?email=${encodeURIComponent(email)}`;
    const data = await safeFetch<{ meals: MealItem[]; totals: any; count: number; date?: string; weekday?: string }>(url);
    return {
      meals: data.meals || [],
      totals: data.totals,
      count: data.count || 0,
      date: data.date,
      weekday: data.weekday,
    };
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

  async updateMeal(id: string, updates: Partial<MealItem>): Promise<MealItem> {
    const data = await safeFetch<{ meal: MealItem }>(`/api/meals/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
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
    imageBase64: string | string[],
    mimeType: string | string[],
    userGoal?: string,
    userTargets?: { calories: number; protein: number; carbs: number; fats: number }
  ): Promise<FoodScanResponse> {
    const data = await safeFetch<FoodScanResponse | FoodScanFailure>("/api/ai/scan-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType, userGoal, userTargets }),
    });
    if (data.success === false) {
      const err = new Error(data.message || "Food analysis failed");
      (err as any).errorCode = data.errorCode || "AI_UNAVAILABLE";
      throw err;
    }
    return data;
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
    try {
      const data = await safeFetch<{ nextBestAction: NextBestActionData }>("/api/ai/next-best-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return data.nextBestAction;
    } catch {
      const remainingProtein = Math.max(0, (payload.targets?.protein || 120) - (payload.consumed?.protein || 0));
      const remainingCalories = Math.max(0, (payload.targets?.calories || 2100) - (payload.consumed?.calories || 0));
      const isVeg = payload.dietaryPreference?.toLowerCase().includes("veg") && !payload.dietaryPreference?.toLowerCase().includes("non");
      return {
        title: remainingProtein > 30 ? "Prioritize Protein In Next Meal" : "Balance Daily Macros",
        action: `Target ${Math.min(remainingProtein, 35)}g of quality protein in your upcoming fuel window.`,
        why: `You have consumed ${payload.consumed?.protein || 0}g of ${payload.targets?.protein || 120}g protein target (${remainingCalories} kcal left today).`,
        suggested_foods: payload.budgetHostelMode
          ? (isVeg ? ["1 bowl hostel Dal + 100g Curd / Dahi", "Sprouted Moong & Roasted Chana", "Sattu drink with lemon"] : ["3 Boiled Eggs with toast/roti", "Curd bowl with roasted peanuts", "Egg Bhurji / Omelette"])
          : (isVeg ? ["200g Greek Yogurt / Paneer Salad", "Tofu stir-fry with greens", "Plant Protein shake with nuts"] : ["Grilled chicken breast / fish with greens", "3 boiled eggs + whole grain toast", "Greek yogurt with pumpkin seeds"]),
        urgency: remainingProtein > 40 ? "high" : "medium",
        hydration_tip: "Drink 350-500ml water to support metabolic hydration.",
      };
    }
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
    try {
      const data = await safeFetch<{ insights: { insights: string[]; score: number } }>("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return data.insights;
    } catch {
      const proteinPct = Math.round(((payload.consumed?.protein || 0) / (payload.targets?.protein || 1)) * 100);
      const caloriePct = Math.round(((payload.consumed?.calories || 0) / (payload.targets?.calories || 1)) * 100);
      const score = Math.min(100, Math.max(20, Math.round(100 - Math.abs(100 - caloriePct) * 0.4 - Math.max(0, 100 - proteinPct) * 0.3)));
      return {
        insights: [
          `You have completed ${proteinPct}% of your target protein threshold for ${payload.userGoal}.`,
          `Energy pacing is at ${caloriePct}% of your target daily allowance (${payload.consumed?.calories || 0} / ${payload.targets?.calories || 2100} kcal).`,
          payload.mealsCount > 0
            ? `Logged ${payload.mealsCount} meal${payload.mealsCount > 1 ? "s" : ""} today with balanced glycemic distribution.`
            : `Ready to log your first meal scan of the day to trigger adaptive nutrition reasoning.`
        ],
        score,
      };
    }
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

  // 📊 Weekly Goal Progress & Trends
  async getWeeklyProgress(email: string, date?: string): Promise<import("../types").WeeklyProgressResponse> {
    const url = date
      ? `/api/meals/weekly-progress?email=${encodeURIComponent(email)}&date=${encodeURIComponent(date)}`
      : `/api/meals/weekly-progress?email=${encodeURIComponent(email)}`;
    const data = await safeFetch<{ success: boolean; progress: import("../types").WeeklyProgressResponse }>(url);
    return data.progress;
  },

  // ⏰ Dynamic Time-Aware Reminders
  async getTimedReminders(email?: string, hostel?: boolean): Promise<import("../types").TimedReminderItem[]> {
    const query = new URLSearchParams();
    if (email) query.set("email", email);
    if (hostel) query.set("hostel", "true");
    const data = await safeFetch<{ success: boolean; reminders: import("../types").TimedReminderItem[] }>(
      `/api/ai/reminders?${query.toString()}`
    );
    return data.reminders || [];
  },

  // 🧠 Long-Term Memories
  async getUserMemories(email: string): Promise<import("../types").UserMemoryItem[]> {
    const data = await safeFetch<{ success: boolean; memories: import("../types").UserMemoryItem[] }>(
      `/api/ai/memories?email=${encodeURIComponent(email)}`
    );
    return data.memories || [];
  },

  async saveUserMemory(payload: { email: string; category: string; key: string; value: string }): Promise<import("../types").UserMemoryItem[]> {
    const data = await safeFetch<{ success: boolean; memories: import("../types").UserMemoryItem[] }>("/api/ai/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return data.memories || [];
  },

  // 💧 Personalized Hydration Engine Endpoints
  async getTodayHydration(timezone?: string): Promise<import("../types").HydrationTodayResponse> {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return safeFetch<import("../types").HydrationTodayResponse>(`/api/hydration/today?timezone=${encodeURIComponent(tz)}`);
  },

  async logHydration(payload: {
    amountMl: number;
    beverageType?: string;
    consumedAt?: string;
    source?: string;
    notes?: string;
    timezone?: string;
  }): Promise<{ success: boolean; entry: import("../types").HydrationEntry; progress: import("../types").HydrationTodayResponse }> {
    const tz = payload.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return safeFetch<{ success: boolean; entry: import("../types").HydrationEntry; progress: import("../types").HydrationTodayResponse }>(
      "/api/hydration/log",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, timezone: tz }),
      }
    );
  },

  async deleteHydration(id: string): Promise<{ success: boolean; deletedCount: number }> {
    return safeFetch<{ success: boolean; deletedCount: number }>(`/api/hydration/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  async getHydrationGoal(): Promise<{ success: boolean; goal: import("../types").HydrationGoalResult }> {
    return safeFetch<{ success: boolean; goal: import("../types").HydrationGoalResult }>("/api/hydration/goal");
  },

  async getHydrationHistory(days = 7, timezone?: string): Promise<{ success: boolean; entries: import("../types").HydrationEntry[] }> {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return safeFetch<{ success: boolean; entries: import("../types").HydrationEntry[] }>(
      `/api/hydration/history?days=${days}&timezone=${encodeURIComponent(tz)}`
    );
  },

  async getHydrationInsight(timezone?: string): Promise<{ success: boolean; insightText: string; source: "gemini" | "deterministic" }> {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    return safeFetch<{ success: boolean; insightText: string; source: "gemini" | "deterministic" }>("/api/hydration/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: tz }),
    });
  },
};

