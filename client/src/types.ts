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
  glycemic_index?: "Low" | "Medium" | "High";
  metabolic_impact?: string;
  nutrition_reasoning?: string;
  meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack" | string;
  image_data?: string;
  created_at: string;
}

export interface FoodScanResponse {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  glycemic_index: "Low" | "Medium" | "High";
  metabolic_impact: string;
  nutrition_reasoning: string;
  confidence?: "low" | "medium" | "high";
  health_rating: number;
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
