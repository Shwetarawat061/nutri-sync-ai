export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: string;
  bmi: number;
  bmr?: number;
  tdee?: number;
  goal: string;
  dietary_pref: string;
  dietaryPreference?: string;
  activity_level: string;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fats_target: number;
  budget?: "low" | "medium" | "high" | string;
  hostel_context?: string;
  pregnancy_status?: string | boolean;
  pregnancyStatus?: string | boolean;
  lactation_status?: string | boolean;
  lactationStatus?: string | boolean;
  climate?: string;
  timezone?: string;
  is_new_user?: boolean;
  profile_completed?: boolean;
  email_verified?: number | boolean;
  pending_email?: string;
  email_daily_digest?: number | boolean;
  email_weekly_recap?: number | boolean;
  email_deficit_alerts?: number | boolean;
  email_hostel_hacks?: number | boolean;
}

export interface EmailDigestResponse {
  success: boolean;
  message: string;
  targetEmail: string;
  subject: string;
  htmlPreview: string;
  stats: {
    totalCalories: number;
    targetCalories: number;
    totalProtein: number;
    targetProtein: number;
    remainingProtein: number;
    mealsCount: number;
  };
  sentAt: string;
}

export interface MealItem {
  id: string;
  user_email?: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  water_content_ml?: number | null;
  waterContentMl?: number | null;
  water_content_confidence?: number | null;
  waterContentConfidence?: number | null;
  glycemic_index?: "Low" | "Medium" | "High";
  metabolic_impact?: string;
  nutrition_reasoning?: string;
  meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack" | string;
  image_data?: string;
  image_url?: string;
  image_urls?: string[];
  foods?: Array<{ name: string; portion?: string }>;
  nutrition?: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  ai_metadata?: { source?: string; model?: string; confidence?: number; warnings?: string[] };
  consumed_at?: string;
  consumedAt?: string;
  date_status?: string;
  dateStatus?: string;
  created_at: string;
}

export interface FoodScanResponse {
  success: true;
  source: "gemini";
  model: string;
  mealName: string;
  foods: Array<{ name: string; portion?: string }>;
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  waterContentMl?: number | null;
  waterContentConfidence?: number | null;
  confidence: number;
  reasoning: string;
  warnings: string[];
  estimatedWeightG?: number;
  imageUrls?: string[];
}

export interface HydrationEntry {
  id: string;
  user_email?: string;
  userEmail?: string;
  amount_ml: number;
  amountMl: number;
  beverage_type: "Water" | "Milk" | "Tea" | "Coffee" | "Juice" | "Other" | string;
  beverageType: "Water" | "Milk" | "Tea" | "Coffee" | "Juice" | "Other" | string;
  consumed_at: string;
  consumedAt: string;
  source?: string;
  notes?: string;
  created_at?: string;
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

export interface HydrationTodayResponse {
  success: boolean;
  date: string;
  timezone: string;
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
  entries: HydrationEntry[];
}

export interface FoodScanFailure {
  success: false;
  source: "gemini";
  errorCode: "AI_UNAVAILABLE" | "AI_INVALID_RESULT" | "IMAGE_INVALID" | "LOW_CONFIDENCE" | "DAILY_LIMIT_REACHED" | "IMAGE_STORAGE_UNAVAILABLE";
  message: string;
}

export interface NextBestActionData {
  title: string;
  action: string;
  why: string;
  suggested_foods: string[];
  urgency: "low" | "medium" | "high";
  hydration_tip: string;
}

export interface NutritionInsightData {
  insight: {
    title: string;
    observation: string;
    reason: string;
  };
  next_best_action: {
    title: string;
    description: string;
    options: string[];
  };
}

export interface MealRecommendationData {
  recommendation: string;
  options: string[];
  rationale: string;
}

export interface DietPlanMeal {
  meal_type: string;
  time_window: string;
  items: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    hostel_tip?: string;
  }>;
  meal_calories: number;
  meal_protein: number;
  rationale: string;
}

export interface DietPlanData {
  summary: string;
  macros_summary: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  meals: DietPlanMeal[];
  budget_hacks: string[];
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export interface ParsedMealTextResult {
  food_name: string;
  items_breakdown: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  glycemic_index: "Low" | "Medium" | "High";
  meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  nutrition_reasoning: string;
  metabolic_impact: string;
  health_rating: number;
  confidence: "high" | "medium" | "low";
}

export interface HealthAdvisorMessage {
  id?: string;
  role: "user" | "model" | "assistant";
  content: string;
  timestamp?: string;
}

export interface HealthAdvisorResponse {
  reply: string;
  suggested_questions: string[];
  action_summary?: {
    action: string;
    recommended_foods?: string[];
    calorie_adjustment?: string;
  };
}

export interface WeeklyDayStat {
  date: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, etc.
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  calorieTarget: number;
  proteinTarget: number;
  adherenceScore: number;
  mealsCount: number;
  status: "perfect" | "on_track" | "under" | "over";
  isToday: boolean;
}

export interface WeeklyProgressResponse {
  weekRange: string;
  days: WeeklyDayStat[];
  averageCalories: number;
  averageProtein: number;
  averageScore: number;
  totalMealsLogged: number;
  streakDays: number;
  proteinGoalDays: number;
  calorieGoalDays: number;
  aiWeeklySummary: string;
  topImprovement: string;
  memoryInsights: string[];
}

export interface TimedReminderItem {
  id: string;
  title: string;
  timeWindow: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  description: string;
  suggestedAction: string;
  macroFocus: string;
  type: "hydration" | "breakfast" | "lunch" | "snack" | "dinner" | "recovery";
  urgency: "active" | "upcoming" | "past";
  completed: boolean;
}

export interface UserMemoryItem {
  id?: number;
  category: "preference" | "constraint" | "habit" | "milestone" | "struggle" | string;
  memory_key: string;
  memory_value: string;
  confidence?: string;
  updated_at?: string;
}


